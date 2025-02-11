import mongoose, { models, Schema } from "mongoose";

interface IRiddle {
  clue: string;
  word: string;
}

const RiddleSchema = new Schema({
  clue: { type: String, required: true },
  word: { type: String, required: true },
});

export default models.Riddle || mongoose.model<IRiddle>("Riddle", RiddleSchema);
