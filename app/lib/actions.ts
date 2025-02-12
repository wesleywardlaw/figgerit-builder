"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { ZodSchema } from "zod"; // Import ZodSchema from Zod
import Riddle from "./models/Riddle";
import { RiddleSchema } from "./schemas/riddle";
import Saying from "./models/Saying";
import { SayingSchema } from "./schemas/saying";

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
        errors: validatedFields.error.flatten().fieldErrors as Partial<Record<string, string[]>>,
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