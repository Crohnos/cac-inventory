import { z } from 'zod';

/**
 * Schema for validating Size objects
 */
export const SizeSchema = z.object({
  name: z.string().trim().min(1, { message: 'Size name is required' }),
});

/**
 * Schema for validating size updates
 */
export const SizeUpdateSchema = SizeSchema.partial();

// Types for Size
export type Size = z.infer<typeof SizeSchema> & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type SizeInput = z.infer<typeof SizeSchema>;
export type SizeUpdateInput = z.infer<typeof SizeUpdateSchema>;