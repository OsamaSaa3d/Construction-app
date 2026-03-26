import { z } from "zod";

export const createContractorBOQSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  deliveryCity: z.string().optional(),
  biddingDeadline: z.string().optional(),
  purchaseMode: z.enum(["ALL_AT_ONCE", "BIT_BY_BIT"]).default("ALL_AT_ONCE"),
  startingPrice: z.coerce.number().positive().optional(),
  autoAcceptPrice: z.coerce.number().positive().optional(),
  items: z.array(
    z.object({
      itemNumber: z.coerce.number().int().positive(),
      description: z.string().min(2, "Description is required"),
      descriptionAr: z.string().optional(),
      specification: z.string().optional(),
      quantity: z.coerce.number().positive("Quantity must be positive"),
      estimatedPrice: z.coerce.number().positive().optional(),
      categoryId: z.string().optional(),
      unitId: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
});

export const uploadProofSchema = z.object({
  proofImageUrls: z.string().min(1, "At least one image URL is required"),
  notes: z.string().optional(),
});

export const managerDecisionSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export type CreateContractorBOQInput = z.infer<typeof createContractorBOQSchema>;
export type UploadProofInput = z.infer<typeof uploadProofSchema>;
export type ManagerDecisionInput = z.infer<typeof managerDecisionSchema>;
