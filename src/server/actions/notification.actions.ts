"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Get notifications ─────────────────────────────────────────────────────────

export async function getMyNotifications(page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  return { data: { notifications, total, page, limit } };
}

// ─── Get unread count ──────────────────────────────────────────────────────────

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return { count: 0 };

  const count = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return { count };
}

// ─── Mark single notification read ────────────────────────────────────────────

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

// ─── Mark all notifications read ──────────────────────────────────────────────

export async function markAllRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}
