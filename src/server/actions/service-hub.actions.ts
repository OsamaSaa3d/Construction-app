"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createPostSchema,
  createCommentSchema,
  type CreatePostInput,
} from "@/lib/validations/service-hub";
import { revalidatePath } from "next/cache";

export async function getServiceHubPosts(filters?: {
  category?: string;
  search?: string;
}) {
  const posts = await prisma.serviceHubPost.findMany({
    where: {
      isActive: true,
      ...(filters?.category ? { category: filters.category as any } : {}),
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search } },
              { content: { contains: filters.search } },
            ],
          }
        : {}),
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { data: posts };
}

export async function getServiceHubPost(id: string) {
  const session = await auth();

  const post = await prisma.serviceHubPost.findUnique({
    where: { id, isActive: true },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      likes: {
        where: { userId: session?.user?.id ?? "" },
        select: { id: true },
      },
    },
  });

  if (!post) return { error: "Not found" as const };

  const liked = (post.likes?.length ?? 0) > 0;
  return { data: post, liked, userId: session?.user?.id ?? null };
}

export async function createServiceHubPost(data: CreatePostInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createPostSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, content, category, imageUrls, tags } = parsed.data;

  const post = await prisma.serviceHubPost.create({
    data: {
      authorId: session.user.id,
      category: category as any,
      title,
      content,
      images: JSON.stringify(imageUrls ?? []),
      tags: JSON.stringify(tags ?? []),
    },
  });

  revalidatePath("/service-hub");
  return { data: post };
}

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await prisma.serviceHubLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.serviceHubLike.delete({ where: { id: existing.id } }),
      prisma.serviceHubPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    revalidatePath(`/service-hub/${postId}`);
    return { liked: false };
  } else {
    await prisma.$transaction([
      prisma.serviceHubLike.create({ data: { postId, userId: session.user.id } }),
      prisma.serviceHubPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    revalidatePath(`/service-hub/${postId}`);
    return { liked: true };
  }
}

export async function addComment(postId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createCommentSchema.safeParse({ content });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.$transaction([
    prisma.serviceHubComment.create({
      data: { postId, authorId: session.user.id, content: parsed.data.content },
    }),
    prisma.serviceHubPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/service-hub/${postId}`);
  return { success: true };
}
