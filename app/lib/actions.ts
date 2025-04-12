"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { ZodSchema } from "zod"; // Import ZodSchema from Zod
import Riddle from "./models/Riddle";
import { RiddleSchema } from "./schemas/riddle";
import Saying from "./models/Saying";
import { SayingSchema } from "./schemas/saying";
import { Figgerit } from "@/types/figgerit";
import { findCompleteFiggerit } from "./utils/findCompleteFiggerit";
import { MatchResult } from "@/types/matchresult";

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
      return { success: false, error: "Number of figgerits must be at least 1" };
    }

    const sayingCount = await Saying.countDocuments();
    if (sayingCount === 0) {
      return { success: false, error: "No sayings found in database" };
    }

    const figgerits: Figgerit[] = [];
    const usedRiddleIds = new Set<string>(); // Track used riddles
    const maxAttempts = numFiggerits * 1000;
    let attempts = 0;

    while (figgerits.length < numFiggerits && attempts < maxAttempts) {
      attempts++;
      console.log(`\nAttempt ${attempts}/${maxAttempts}`);

      const randomSaying = await Saying.aggregate([{ $sample: { size: 1 } }]).exec();
      if (!randomSaying[0]) continue;

      const saying = {
        text: randomSaying[0].saying,
        _id: randomSaying[0]._id.toString(),
      };

      console.log("Selected saying:", saying.text);

      // Fetch random riddles ensuring they haven't been used before
      let randomRiddles = await Riddle.aggregate([{ $sample: { size: riddlesPerAttempt } }]).exec();
      randomRiddles = randomRiddles.filter((r) => !usedRiddleIds.has(r._id.toString()));

      if (randomRiddles.length < 28) {
        return { success: false, error: "Insufficient unique riddles in database" };
      }

      console.log("\nRandom riddles from database:");
      randomRiddles.forEach((r, i) => console.log(`${i + 1}. ${r.word} (${r.clue})`));

      const plainRiddles = randomRiddles.map((r) => ({
        word: r.word,
        clue: r.clue,
        _id: r._id.toString(),
      }));

      const solution = findCompleteFiggerit(plainRiddles, saying.text);

      if (solution) {
        console.log("Found solution!");

        const serializedSolution: MatchResult[] = solution.map((match) => ({
          answer: match.answer,
          letterPositions: match.letterPositions,
          riddle: {
            clue: match.riddle.clue,
            word: match.riddle.word,
            _id: match.riddle._id.toString(),
          },
        }));

        figgerits.push({
          saying,
          matches: serializedSolution,
        });

        // Mark only used riddles as used
        solution.forEach((match) => usedRiddleIds.add(match.riddle._id.toString()));
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

    console.log(figgerits);

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
