import { z } from "zod";

export const createUrgentRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  deliveryCity: z.enum([
    "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
    "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
  ]),
  deliveryLat: z.coerce.number().min(-90).max(90),
  deliveryLng: z.coerce.number().min(-180).max(180),
  maxRadiusKm: z.coerce.number().int().positive().default(50),
  maxBudget: z.coerce.number().positive().optional(),
  neededBy: z.string().optional(), // ISO datetime string
  items: z.array(
    z.object({
      description: z.string().min(2, "Description required"),
      quantity: z.coerce.number().positive("Quantity must be positive"),
      unit: z.string().min(1, "Unit required"),
    })
  ).min(1, "At least one item is required"),
});

export const urgentResponseSchema = z.object({
  canFulfill: z.boolean(),
  priceQuote: z.coerce.number().positive().optional(),
});

export type CreateUrgentRequestInput = z.infer<typeof createUrgentRequestSchema>;
export type UrgentResponseInput = z.infer<typeof urgentResponseSchema>;
