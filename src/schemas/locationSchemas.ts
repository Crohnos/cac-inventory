import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string()
    .min(1, 'Location name is required')
    .max(100, 'Location name must be less than 100 characters'),
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters'),
  state: z.string()
    .length(2, 'State must be 2 characters (e.g., TX)')
    .optional()
    .default('TX'),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  phone: z.string()
    .regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .optional()
});

export const updateLocationSchema = z.object({
  name: z.string()
    .min(1, 'Location name cannot be empty')
    .max(100, 'Location name must be less than 100 characters')
    .optional(),
  city: z.string()
    .min(1, 'City cannot be empty')
    .max(50, 'City must be less than 50 characters')
    .optional(),
  state: z.string()
    .length(2, 'State must be 2 characters (e.g., TX)')
    .optional(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  phone: z.string()
    .regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const locationParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Location ID must be a number')
});