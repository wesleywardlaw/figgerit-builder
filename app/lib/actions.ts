"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { ZodSchema } from "zod"; // Import ZodSchema from Zod
import Riddle from "./models/Riddle";
import { RiddleSchema } from "./schemas/riddle";
import Saying from "./models/Saying";
import { SayingSchema } from "./schemas/saying";
import { Figgerit } from "@/types/figgert";
import { findCompleteFiggerit } from "./utils/findCompleteFiggerit";

type SubmitDataResult = {
  errors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

async function submitData<T>(
  data: T,
  Model: mongoose.Model<any>,
  Schema: ZodSchema<T>
): Promise<SubmitDataResult> {
  try {
    await connectToDatabase();

    const validatedFields = Schema.safeParse(data);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors as Partial<
          Record<string, string[]>
        >,
      };
    }

    const newData = new Model(validatedFields.data);
    await newData.save();

    return { success: true };
  } catch (error) {
    const errorResponse: SubmitDataResult = { errors: {} };

    if (error instanceof mongoose.Error.ValidationError) {
      errorResponse.errors = { root: ["Database validation error"] };
    } else if (error instanceof mongoose.Error) {
      errorResponse.errors = { root: ["Database error"] };
    } else {
      errorResponse.errors = {
        root: ["Something went wrong. Please try again later."],
      };
    }

    return errorResponse;
  }
}

export async function submitRiddle(data: { clue: string; word: string }) {
  return submitData(data, Riddle, RiddleSchema);
}

export async function submitSaying(data: { saying: string }) {
  return submitData(data, Saying, SayingSchema);
}

export async function createFiggerits(
  numFiggerits: number = 6,
  riddlesPerAttempt: number = 2000
): Promise<{ success: boolean; figgerits?: Figgerit[]; error?: string }> {
  try {
    await connectToDatabase();

    if (numFiggerits < 1) {
      return {
        success: false,
        error: "Number of figgerits must be at least 1",
      };
    }

    const sayingCount = await Saying.countDocuments();
    if (sayingCount === 0) {
      return { success: false, error: "No sayings found in database" };
    }

    const figgerits: Figgerit[] = [];
    const maxAttempts = numFiggerits * 3;
    let attempts = 0;

    while (figgerits.length < numFiggerits && attempts < maxAttempts) {
      attempts++;
      console.log(`\nAttempt ${attempts}/${maxAttempts}`);

      // Get random saying
      const randomSaying = await Saying.aggregate([{ $sample: { size: 1 } }]);
      if (!randomSaying[0]) continue;

      const saying = randomSaying[0];
      console.log("Selected saying:", saying.saying);

      // Get random riddles
      const randomRiddles = await Riddle.aggregate([
        { $sample: { size: 28 } }
      ]);

      if (randomRiddles.length < 28) {
        return { success: false, error: "Insufficient riddles in database" };
      }

      console.log("\nRandom riddles from database:");
      randomRiddles.forEach((r, i) => {
        console.log(`${i + 1}. ${r.word} (${r.clue})`);
      });

      const solution = findCompleteFiggerit(randomRiddles, saying.saying);

      if (solution) {
        console.log("Found solution!");
        figgerits.push({
          saying: {
            text: saying.saying,
            _id: saying._id,
          },
          matches: solution,
        });
      } else {
        console.log("No solution found for this saying");
      }
    }

    if (figgerits.length === 0) {
      return { success: false, error: "Could not create any valid figgerits" };
    }

    if (figgerits.length < numFiggerits) {
      return {
        success: false,
        error: `Could only create ${figgerits.length} of ${numFiggerits} requested figgerits`,
      };
    }

    return { success: true, figgerits };
  } catch (error: unknown) {
    console.error("Error creating figgerits:", error);

    const errorMessage =
      error instanceof Error
        ? error.name === "MongoNetworkError"
          ? "Database connection error"
          : "An unexpected error occurred"
        : "An unknown error occurred";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
