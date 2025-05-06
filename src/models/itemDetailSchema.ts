import { z } from 'zod';

/**
 * Schema for validating ItemDetail objects
 */
export const ItemDetailSchema = z.object({
  itemCategoryId: z.number().int().positive({ message: 'Item category ID is required' }),
  sizeId: z.number().int().positive({ message: 'Size ID must be positive' }).optional(),
  condition: z.enum(['New', 'Gently Used', 'Heavily Used']).default('New'),
  location: z.enum(['McKinney', 'Plano']),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Received date must be in YYYY-MM-DD format' }),
  donorInfo: z.string().optional(),
  approxPrice: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an ItemDetail
 */
export const ItemDetailUpdateSchema = ItemDetailSchema.partial();

/**
 * Schema for transferring an item to a new location
 */
export const ItemTransferSchema = z.object({
  location: z.enum(['McKinney', 'Plano'])
});

// Types for ItemDetail
export type ItemDetail = z.infer<typeof ItemDetailSchema> & {
  id: number;
  qrCodeValue: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemDetailInput = z.infer<typeof ItemDetailSchema>;
export type ItemDetailUpdateInput = z.infer<typeof ItemDetailUpdateSchema>;
export type ItemTransferInput = z.infer<typeof ItemTransferSchema>;