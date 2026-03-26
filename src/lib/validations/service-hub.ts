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

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.enum(SERVICE_CATEGORIES),
  imageUrls: z.array(z.string().url("Invalid URL")).max(10).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
