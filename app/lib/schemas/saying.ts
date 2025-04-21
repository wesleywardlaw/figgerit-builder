import { z } from 'zod';

export const SayingSchema = z.object({
  saying: z
    .string({ required_error: 'Saying is required' }) 
    .min(1, 'Saying cannot be empty')
    .max(60, 'Saying must be at most 60 characters')
    .trim()
    .regex(
      /^[A-Z].*[.!?]$/,
      'Saying must start with a capital letter and end with a period, question mark, or exclamation point'
    ),
  category: z
    .string()
    .optional(),
});

export type SayingFormValues = z.infer<typeof SayingSchema>;