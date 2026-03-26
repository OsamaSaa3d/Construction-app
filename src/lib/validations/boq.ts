import { z } from "zod";

export const boqItemSchema = z.object({
  itemNumber: z.coerce.number().int().positive(),
  description: z.string().min(2, "Description is required"),
  descriptionAr: z.string().optional(),
  specification: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  estimatedPrice: z.coerce.number().positive().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
});

export const createBOQSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  deliveryCity: z.string().optional(),
  biddingDeadline: z.string().optional(), // ISO date string
  items: z.array(boqItemSchema).min(1, "At least one item is required"),
});

export const bidLineItemSchema = z.object({
  boqItemId: z.string().min(1),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  brand: z.string().optional(),
  notes: z.string().optional(),
});

export const submitBidSchema = z.object({
  deliveryDays: z.coerce.number().int().positive("Delivery days must be positive").optional(),
  deliveryCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  lineItems: z.array(bidLineItemSchema).min(1, "At least one line item is required"),
});

export type CreateBOQInput = z.infer<typeof createBOQSchema>;
export type SubmitBidInput = z.infer<typeof submitBidSchema>;
