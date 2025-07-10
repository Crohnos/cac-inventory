import { z } from 'zod';

/**
 * Schema for validating ItemCategory objects
 */
export const ItemCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Category name is required' }),
  description: z.string().optional(),
  lowStockThreshold: z.number().int().positive().default(5),
});

/**
 * Schema for validating item category updates
 */
export const ItemCategoryUpdateSchema = ItemCategorySchema.partial();

/**
 * Schema for associating a size with a category
 */
export const CategorySizeSchema = z.object({
  sizeId: z.number().int().positive({ message: 'Size ID is required and must be positive' }),
});

// Types for ItemCategory
export type ItemCategory = z.infer<typeof ItemCategorySchema> & {
  id: number;
  qrCodeValue?: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemCategoryWithQuantity = ItemCategory & {
  totalQuantity: number;
};

export type ItemCategoryInput = z.infer<typeof ItemCategorySchema>;
export type ItemCategoryUpdateInput = z.infer<typeof ItemCategoryUpdateSchema>;
export type CategorySizeInput = z.infer<typeof CategorySizeSchema>;