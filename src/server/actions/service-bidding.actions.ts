"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createServiceRequestSchema,
  createServiceBidSchema,
  type CreateServiceRequestInput,
  type CreateServiceBidInput,
} from "@/lib/validations/service-bidding";
import { revalidatePath } from "next/cache";

export async function getServiceRequests(filters?: {
  category?: string;
  city?: string;
  showAll?: boolean;
}) {
  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(filters?.category ? { category: filters.category as any } : {}),
      ...(filters?.city ? { city: filters.city as any } : {}),
      ...(!filters?.showAll ? { status: { in: ["OPEN", "IN_REVIEW"] as any } } : {}),
    },
    include: {
      requester: { select: { id: true, name: true, role: true } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { data: requests };
}

export async function getServiceRequest(id: string) {
  const session = await auth();

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, role: true } },
      bids: {
        include: {
          bidder: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) return { error: "Not found" as const };

  const isRequester = session?.user?.id === request.requester.id;
  const myBid = session?.user?.id
    ? (request.bids.find((b) => b.bidderId === session.user.id) ?? null)
    : null;

  return { data: request, isRequester, myBid, userId: session?.user?.id ?? null };
}

export async function createServiceRequest(data: CreateServiceRequestInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createServiceRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, description, category, city, budget, deadline, imageUrls } = parsed.data;

  const request = await prisma.serviceRequest.create({
    data: {
      requesterId: session.user.id,
      category: category as any,
      title,
      description,
      city: city as any,
      budget: budget ?? null,
      deadline: deadline ? new Date(deadline) : null,
      images: JSON.stringify(imageUrls ?? []),
    },
  });

  revalidatePath("/service-bidding");
  return { data: request };
}

export async function createServiceBid(requestId: string, data: CreateServiceBidInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { requesterId: true, status: true },
  });
  if (!request) return { error: "Request not found" };
  if (request.requesterId === session.user.id)
    return { error: "Cannot bid on your own request" };
  if (!["OPEN", "IN_REVIEW"].includes(request.status))
    return { error: "Request is no longer accepting bids" };

  const parsed = createServiceBidSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const bid = await prisma.serviceBid.create({
    data: {
      requestId,
      bidderId: session.user.id,
      price: parsed.data.price,
      proposal: parsed.data.proposal,
      estimatedDays: parsed.data.estimatedDays ?? null,
    },
  });

  if (request.status === "OPEN") {
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: "IN_REVIEW" },
    });
  }

  revalidatePath(`/service-bidding/${requestId}`);
  return { data: bid };
}

export async function acceptServiceBid(bidId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const bid = await prisma.serviceBid.findUnique({
    where: { id: bidId },
    include: {
      request: { select: { requesterId: true, id: true, status: true } },
    },
  });
  if (!bid) return { error: "Bid not found" };
  if (bid.request.requesterId !== session.user.id) return { error: "Forbidden" };
  if (!["OPEN", "IN_REVIEW"].includes(bid.request.status))
    return { error: "Cannot accept at this stage" };

  await prisma.$transaction([
    prisma.serviceBid.update({ where: { id: bidId }, data: { status: "ACCEPTED" } }),
    prisma.serviceBid.updateMany({
      where: { requestId: bid.request.id, id: { not: bidId } },
      data: { status: "REJECTED" },
    }),
    prisma.serviceRequest.update({
      where: { id: bid.request.id },
      data: { status: "AWARDED" },
    }),
  ]);

  revalidatePath(`/service-bidding/${bid.request.id}`);
  return { success: true };
}

export async function updateServiceRequestStatus(
  requestId: string,
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { requesterId: true, status: true },
  });
  if (!request) return { error: "Not found" };
  if (request.requesterId !== session.user.id) return { error: "Forbidden" };

  const VALID_TRANSITIONS: Record<string, string[]> = {
    AWARDED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED"],
  };

  if (!VALID_TRANSITIONS[request.status]?.includes(status)) {
    return { error: "Invalid status transition" };
  }

  await prisma.serviceRequest.update({ where: { id: requestId }, data: { status } });
  revalidatePath(`/service-bidding/${requestId}`);
  revalidatePath("/service-bidding");
  return { success: true };
}
