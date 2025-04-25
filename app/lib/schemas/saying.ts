import { z } from "zod";

export const SayingSchema = z.object({
  saying: z
    .string({ required_error: "Saying is required" })
    .min(1, "Saying cannot be empty")
    .max(100, "Saying must be a reasonable length") // Soft max to prevent absurd lengths
    .trim()
    .regex(
      /^[A-Z].*[.!?]$/,
      "Saying must start with a capital letter and end with a period, question mark, or exclamation point"
    )
    .refine(
      (val) => (val.match(/[a-zA-Z]/g) || []).length <= 40,
      {
        message: "Saying must contain at most 40 letters",
      }
    ),
  category: z.string().optional(),
});

export type SayingFormValues = z.infer<typeof SayingSchema>;
