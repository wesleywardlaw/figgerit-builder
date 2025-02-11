'use server'

import mongoose from "mongoose";
import Riddle from "./models/Riddle";
import { connectToDatabase } from "./mongodb"
import { RiddleSchema } from "./schemas/riddle";


export async function submitRiddle(formData:FormData){
    try{
    await connectToDatabase();

    const rawFormData = {
        clue: formData.get('clue'),
        word: formData.get('word'),
    }

    const validatedFields = RiddleSchema.safeParse(rawFormData);

    if(!validatedFields.success){
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { clue, word } = validatedFields.data;

    const newRiddle = new Riddle({clue,word})
    await newRiddle.save();

    return { success: true };
} catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
        return { errors: { general: ["Database validation error"] } };
      }
  
      if (error instanceof mongoose.Error) {
        return { errors: { general: ["Database error"] } };
      }
  
      // Handle generic server errors
      return { errors: { general: ["Something went wrong. Please try again later."] } };
}

}