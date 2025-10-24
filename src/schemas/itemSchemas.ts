import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string()
    .min(1, 'Item name is required')
    .max(200, 'Item name must be less than 200 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  storage_location: z.string()
    .max(100, 'Storage location must be less than 100 characters')
    .optional(),
  has_sizes: z.boolean(),
  sizes: z.array(z.string().min(1, 'Size label cannot be empty')).optional(),
  min_stock_level: z.number()
    .int()
    .min(0, 'Minimum stock level cannot be negative')
    .optional()
    .default(5),
  unit_type: z.string()
    .min(1, 'Unit type cannot be empty')
    .max(20, 'Unit type must be less than 20 characters')
    .optional()
    .default('each')
});

export const updateQuantitySchema = z.object({
  quantity: z.number()
    .int()
    .min(0, 'Quantity cannot be negative')
});

export const adjustQuantitySchema = z.object({
  adjustment: z.number()
    .int()
    .refine(val => val !== 0, 'Adjustment cannot be zero')
});

export const updateLocationSchema = z.object({
  location_id: z.number()
    .int()
    .positive('Location ID must be positive')
    .nullable()
});

export const itemParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Item ID must be a number')
});

export const sizeParamsSchema = z.object({
  sizeId: z.string().regex(/^\d+$/, 'Size ID must be a number')
});

export const itemSizeParamsSchema = z.object({
  itemId: z.string().regex(/^\d+$/, 'Item ID must be a number')
});

export const itemQuerySchema = z.object({
  location_id: z.string()
    .regex(/^\d+$/, 'Location ID must be a number')
    .optional()
});