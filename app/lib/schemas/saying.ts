import { z } from 'zod';

export const SayingSchema = z.object({
  saying: z
    .string({ required_error: 'Saying is required' }) 
    .min(1, 'Saying cannot be empty')
    .trim(),
});

export type SayingFormValues = z.infer<typeof SayingSchema>;