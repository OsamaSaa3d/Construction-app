"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ─── Get conversations ─────────────────────────────────────────────────────────

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;

  // Get latest message for each unique conversation partner
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    include: { receiver: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  const received = await prisma.message.findMany({
    where: { receiverId: userId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Build conversation map keyed by other user id
  const convMap = new Map<
    string,
    { user: { id: string; name: string; role: string }; lastMessage: string; createdAt: Date; unread: number }
  >();

  for (const msg of sent) {
    const other = msg.receiver;
    if (!convMap.has(other.id)) {
      convMap.set(other.id, {
        user: other,
        lastMessage: msg.content,
        createdAt: msg.createdAt,
        unread: 0,
      });
    }
  }

  for (const msg of received) {
    const other = msg.sender;
    const existing = convMap.get(other.id);
    if (!existing || msg.createdAt > existing.createdAt) {
      const unread = received.filter((m) => m.senderId === other.id && !m.isRead).length;
      convMap.set(other.id, {
        user: other,
        lastMessage: msg.content,
        createdAt: msg.createdAt,
        unread,
      });
    }
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return { data: conversations };
}

// ─── Get messages in thread ────────────────────────────────────────────────────

export async function getMessages(otherUserId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { senderId: otherUserId, receiverId: userId, isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true, role: true },
  });

  return { data: { messages, otherUser } };
}

// ─── Send message ──────────────────────────────────────────────────────────────

export async function sendMessage(receiverId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = sendMessageSchema.safeParse({ content });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (receiverId === session.user.id) return { error: "Cannot send a message to yourself" };

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: parsed.data.content,
    },
  });

  revalidatePath(`/messages/${receiverId}`);
  return { success: true };
}

// ─── Get unread message count ──────────────────────────────────────────────────

export async function getUnreadMessageCount() {
  const session = await auth();
  if (!session?.user?.id) return { count: 0 };

  const count = await prisma.message.count({
    where: { receiverId: session.user.id, isRead: false },
  });

  return { count };
}
