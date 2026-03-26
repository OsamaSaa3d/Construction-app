import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  unitId: z.string().min(1, "Unit is required"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  pricePerUnit: z.coerce.number().positive("Price must be positive"),
  quantityInStock: z.coerce.number().min(0, "Quantity cannot be negative"),
  minOrderQty: z.coerce.number().positive("Min order must be positive").optional(),
  isActive: z.boolean().default(true),
  canUrgentDeliver: z.boolean().default(false),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
