import { z } from 'zod';

export const RiddleSchema = z.object({
  clue: z
    .string({ required_error: 'Clue is required' }) 
    .min(1, 'Clue cannot be empty')
    .trim(),
  word: z
    .string({ required_error: 'Word is required' }) 
    .min(1, 'Word cannot be empty') 
    .trim(), 
});

export type RiddleFormValues = z.infer<typeof RiddleSchema>;