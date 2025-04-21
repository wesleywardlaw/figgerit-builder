import mongoose, { models, Schema, Document } from "mongoose";

interface FiggeritDocument extends Document {
  volume: number;
  saying: { text: string; _id: string };
  matches: {
    answer: string;
    letterPositions: { letter: string; position: number }[];
    riddle: { clue: string; word: string; _id: string };
  }[];
}

const MatchResultSchema = new Schema({
  answer: String,
  letterPositions: [
    {
      letter: String,
      position: Number,
    },
  ],
  riddle: {
    clue: String,
    word: String,
    _id: String,
  },
});

const FiggeritSchema = new Schema({
  volume: { type: Number, required: true },
  saying: {
    text: String,
    _id: String,
  },
  matches: [MatchResultSchema],
});

const FiggeritModel =
  models.Figgerit ||
  mongoose.model<FiggeritDocument>("Figgerit", FiggeritSchema);
export default FiggeritModel;
