import mongoose, { models, Schema } from "mongoose";

interface ISaying {
  saying: string;
  volumes?: number[];
  category?: string;
}

const SayingSchema = new Schema({
  saying: { type: String, required: true },
  volumes: [{ type: Number }],
  category: { type: String },
});

export default models.Saying || mongoose.model<ISaying>("Saying", SayingSchema);
