import mongoose, { models, Schema } from "mongoose";

interface IRiddle {
  clue: string;
  word: string;
  volumes?: number[];
  category?: string;
}

const RiddleSchema = new Schema({
  clue: { type: String, required: true },
  word: { type: String, required: true },
  volumes: [{ type: Number }],
  category: { type: String },
});

export default models.Riddle || mongoose.model<IRiddle>("Riddle", RiddleSchema);
