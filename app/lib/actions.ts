"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { ZodSchema } from "zod";
import Riddle from "./models/Riddle";
import { RiddleSchema } from "./schemas/riddle";
import Saying from "./models/Saying";
import { SayingSchema } from "./schemas/saying";
import { Figgerit } from "@/types/figgerit";
import { findCompleteFiggerit } from "./utils/findCompleteFiggerit";
import { MatchResult } from "@/types/matchresult";
import FiggeritModel from "./models/Figgerit";

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

export async function submitRiddle(data: {
  clue: string;
  word: string;
  category?: string;
}) {
  return submitData(data, Riddle, RiddleSchema);
}

export async function submitSaying(data: {
  saying: string;
  category?: string;
}) {
  return submitData(data, Saying, SayingSchema);
}

export async function createFiggerits(
  numFiggerits: number = 6,
  riddlesPerAttempt: number = 2000,
  volume: number,
  category?: string
): Promise<{ success: boolean; figgerits?: Figgerit[]; error?: string }> {
  try {
    await connectToDatabase();

    if (numFiggerits < 1) {
      return {
        success: false,
        error: "Number of figgerits must be at least 1",
      };
    }

    // Build the match query for sayings
    const sayingMatchQuery: any = {
      $or: [{ volumes: { $exists: false } }, { volumes: { $nin: [volume] } }],
    };
    if (category) {
      sayingMatchQuery.category = category;
    }

    const sayingCount = await Saying.countDocuments(sayingMatchQuery);
    if (sayingCount === 0) {
      return {
        success: false,
        error: "No unused sayings found for this volume",
      };
    }

    // Check if we have enough riddles before starting the main loop
    const riddleMatchQuery: any = {
      $or: [{ volumes: { $exists: false } }, { volumes: { $nin: [volume] } }],
    };
    if (category) {
      riddleMatchQuery.category = category;
    }

    const initialRiddles = await Riddle.aggregate([
      { $match: riddleMatchQuery },
      { $sample: { size: riddlesPerAttempt } },
    ]).exec();

    if (initialRiddles.length < 28) {
      console.log("Not enough riddles in database");
      return {
        success: false,
        error: "Insufficient unique riddles in database",
      };
    }

    const figgerits: Figgerit[] = [];
    const usedRiddleIds = new Set<string>();
    const maxAttempts = numFiggerits * 1000;
    let attempts = 0;

    while (figgerits.length < numFiggerits && attempts < maxAttempts) {
      attempts++;
      console.log(`\nAttempt ${attempts}/${maxAttempts}`);

      const randomSaying = await Saying.aggregate([
        { $match: sayingMatchQuery },
        { $sample: { size: 1 } },
      ]).exec();

      if (!randomSaying[0]) continue;

      const saying = {
        text: randomSaying[0].saying,
        _id: randomSaying[0]._id.toString(),
      };

      console.log("Selected saying:", saying.text);

      let randomRiddles = await Riddle.aggregate([
        { $match: riddleMatchQuery },
        { $sample: { size: riddlesPerAttempt } },
      ]).exec();

      randomRiddles = randomRiddles.filter(
        (r) => !usedRiddleIds.has(r._id.toString())
      );
      console.log("random riddles", randomRiddles);
      console.log("random riddles length", randomRiddles.length);

      if (randomRiddles.length < 28) {
        console.log("Not enough riddles - throwing error");
        throw new Error("INSUFFICIENT_RIDDLES");
      }

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

        const newFiggerit = {
          volume,
          saying,
          matches: serializedSolution,
        };

        figgerits.push(newFiggerit);

        await FiggeritModel.create(newFiggerit);

        // Check if Saying is being updated
        const sayingUpdateResult = await Saying.updateOne(
          { _id: saying._id },
          { $addToSet: { volumes: volume } }
        );
        console.log("Saying update result:", sayingUpdateResult);

        // Check if Riddles are being updated
        for (const match of solution) {
          const riddleUpdateResult = await Riddle.updateOne(
            { _id: match.riddle._id },
            { $addToSet: { volumes: volume } }
          );
          console.log(
            `Riddle ${match.riddle._id} update result:`,
            riddleUpdateResult
          );
          usedRiddleIds.add(match.riddle._id.toString());
        }
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
        figgerits,
      };
    }

    return { success: true, figgerits };
  } catch (error: unknown) {
    console.error("Error creating figgerits:", error);

    if (error instanceof Error && error.message === "INSUFFICIENT_RIDDLES") {
      return {
        success: false,
        error: "Insufficient unique riddles in database",
      };
    }

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

export async function getFiggeritsByVolume(
  volume: number
): Promise<{ success: boolean; figgerits?: Figgerit[]; error?: string }> {
  try {
    await connectToDatabase();

    if (!volume || volume < 1) {
      return { success: false, error: "Volume number must be at least 1" };
    }

    const figgeritDocs = await FiggeritModel.find({ volume }).exec();

    if (!figgeritDocs || figgeritDocs.length === 0) {
      return {
        success: false,
        error: `No figgerits found for volume ${volume}`,
      };
    }

    // Convert Mongoose documents to plain JavaScript objects
    const figgerits = figgeritDocs.map((doc) => {
      const plainDoc = doc.toObject();
      return {
        saying: {
          text: String(plainDoc.saying.text || ""),
          _id: String(plainDoc.saying._id || ""),
        },
        matches: plainDoc.matches.map((match: any) => ({
          answer: String(match.answer || ""),
          letterPositions: Array.isArray(match.letterPositions)
            ? match.letterPositions.map((pos: any) => ({
                letter: String(pos.letter || ""),
                position: Number(pos.position || 0),
              }))
            : [],
          riddle: {
            clue: String(match.riddle?.clue || ""),
            word: String(match.riddle?.word || ""),
            _id: String(match.riddle?._id || ""),
          },
        })),
      };
    });

    return { success: true, figgerits };
  } catch (error: unknown) {
    console.error("Error retrieving figgerits:", error);

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
