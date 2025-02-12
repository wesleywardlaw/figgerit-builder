import mongoose, { models, Schema } from "mongoose";

interface ISaying {
    saying: string;
}

const SayingSchema = new Schema({
  saying: { type: String, required: true },
});

export default models.Saying || mongoose.model<ISaying>("Saying", SayingSchema);