import { z } from "zod";

export const SERVICE_CATEGORIES = [
  "COMPANY",
  "INTERIOR_DESIGN",
  "CONTRACTOR",
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "LANDSCAPING",
  "PAINTING",
  "FLOORING",
  "OTHER",
] as const;

export const UAE_CITIES = [
  "ABU_DHABI",
  "DUBAI",
  "SHARJAH",
  "AJMAN",
  "UMM_AL_QUWAIN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
] as const;

export const createServiceRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(SERVICE_CATEGORIES),
  city: z.enum(UAE_CITIES),
  budget: z.coerce.number().positive().optional(),
  deadline: z.string().optional(),
  imageUrls: z.array(z.string().url("Invalid URL")).max(10).optional(),
});

export const createServiceBidSchema = z.object({
  price: z.coerce.number().positive("Price must be positive"),
  proposal: z.string().min(10, "Proposal must be at least 10 characters"),
  estimatedDays: z.coerce.number().int().positive().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type CreateServiceBidInput = z.infer<typeof createServiceBidSchema>;
