import { z } from "zod";

export const RiddleSchema = z.object({
  clue: z
    .string({ required_error: "Clue is required" })
    .min(1, "Clue cannot be empty")
    .max(85, "Clue must be at most 85 characters")
    .trim(),
  word: z
    .string({ required_error: "Word is required" })
    .min(1, "Word cannot be empty")
    .trim()
    .refine((val) =>{
      return val.trim().replace(/\s+/g, ' ').split(' ').every((w) => w.length <= 12)
    },
    {
      message: "Each word must be at most 12 characters long",
    }),
  category: z.string().optional(),
});

export type RiddleFormValues = z.infer<typeof RiddleSchema>;
