import { z } from 'zod';

/**
 * Schema for the photo description in requests
 */
export const PhotoDescriptionSchema = z.object({
  description: z.string().optional()
});

// Types for ItemPhoto
export type ItemPhoto = {
  id: number;
  itemDetailId: number;
  filePath: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PhotoDescriptionInput = z.infer<typeof PhotoDescriptionSchema>;