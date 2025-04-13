import mongoose, { models, Schema } from "mongoose";

interface ISaying {
  saying: string;
  volumes?: number[];
}

const SayingSchema = new Schema({
  saying: { type: String, required: true },
  volumes: [{ type: Number }],
});

export default models.Saying || mongoose.model<ISaying>("Saying", SayingSchema);