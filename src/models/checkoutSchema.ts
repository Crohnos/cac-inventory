import { z } from 'zod';

// Enum-like definitions for better type safety
export const LocationEnum = z.enum(['CACCC Plano', 'CACCC McKinney']);
export const DepartmentEnum = z.enum(['CPS/DFPS', 'CACCC FA/CE', 'Family Compass', 'Law Enforcement']);
export const AllegationEnum = z.enum([
  'Abandonment',
  'Emotional Abuse', 
  'Human Trafficking',
  'Neglectful Supervision',
  'RAPR',
  'Exploitation',
  'Medical Neglect',
  'Physical Neglect',
  'Sexual Abuse',
  'Sex Trafficking',
  'Labor Trafficking',
  'Other'
]);

// Base checkout schema
export const CheckoutSchema = z.object({
  checkoutDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in MM-DD-YYYY format'),
  location: LocationEnum,
  workerFirstName: z.string().min(1, 'Worker first name is required').max(100),
  workerLastName: z.string().min(1, 'Worker last name is required').max(100),
  department: DepartmentEnum,
  caseNumber: z.string().min(1, 'Case number is required').max(100),
  allegations: z.array(AllegationEnum).min(1, 'At least one allegation must be selected'),
  parentGuardianFirstName: z.string().max(100).optional(),
  parentGuardianLastName: z.string().max(100).optional(),
  zipCode: z.string().max(10).optional(),
  allegedPerpetratorFirstName: z.string().max(100).optional(),
  allegedPerpetratorLastName: z.string().max(100).optional(),
  numberOfChildren: z.number().int().min(1, 'Number of children must be at least 1'),
  itemCategoryId: z.number().int().positive(),
  itemsRemovedCount: z.number().int().min(1).max(3)
});

// Types inferred from schemas
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type LocationType = z.infer<typeof LocationEnum>;
export type DepartmentType = z.infer<typeof DepartmentEnum>;
export type AllegationType = z.infer<typeof AllegationEnum>;

// Database row type (includes generated fields)
export interface RainbowRoomCheckout extends Omit<CheckoutInput, 'allegations'> {
  id: number;
  allegations: string; // JSON string in database
  createdAt: string;
  updatedAt: string;
}