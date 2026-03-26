import { z } from "zod";

export const createRatingSchema = z.object({
  trustworthiness: z.coerce.number().int().min(1).max(5),
  deliveryReliability: z.coerce.number().int().min(1).max(5),
  timeliness: z.coerce.number().int().min(1).max(5),
  materialQuality: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
