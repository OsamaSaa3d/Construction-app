"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createBOQSchema, submitBidSchema, type CreateBOQInput, type SubmitBidInput } from "@/lib/validations/boq";
import { revalidatePath } from "next/cache";

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function getConsultantProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CONSULTANT") return null;
  return prisma.consultantProfile.findUnique({ where: { userId: session.user.id } });
}

async function getSupplierProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") return null;
  return prisma.supplierProfile.findUnique({ where: { userId: session.user.id } });
}

// ─── Consultant: BOQ management ───────────────────────────────────────────────

/**
 * List all BOQs created by the authenticated consultant.
 */
export async function getConsultantBOQs() {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const boqs = await prisma.bOQ.findMany({
    where: { consultantId: profile.id, type: "MARKET_ANALYSIS" },
    include: {
      items: { select: { id: true } },
      materialBids: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: boqs };
}

/**
 * Get a single BOQ with full details (items + bids).
 * For consultant — shows anonymised supplier info.
 */
export async function getBOQDetail(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findUnique({
    where: { id },
    include: {
      items: {
        include: { category: true, unit: true },
        orderBy: { itemNumber: "asc" },
      },
      materialBids: {
        include: {
          lineItems: {
            include: { boqItem: { select: { itemNumber: true, description: true } } },
          },
          // Only reveal supplier identity to the consultant after they accept the bid,
          // or after the BOQ is in AWARDED state.
          supplier: {
            select: {
              id: true,
              companyName: true,
              city: true,
              isVerified: true,
            },
          },
        },
        orderBy: { totalPrice: "asc" },
      },
      consultant: { select: { userId: true } },
    },
  });

  if (!boq) return { error: "Not found" };

  // Determine if the caller is the owner
  const isOwner = boq.consultant?.userId === session.user.id;
  const isSupplier = session.user.role === "SUPPLIER";

  if (!isOwner && !isSupplier) return { error: "Forbidden" };

  // Anonymise bids unless BOQ is awarded (or caller is supplier viewing their own bid)
  const supplierProfile = isSupplier
    ? await prisma.supplierProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const sanitisedBids = boq.materialBids.map((bid) => {
    const isOwnBid = supplierProfile?.id === bid.supplierId;
    const revealIdentity = !bid.isAnonymous || boq.status === "AWARDED" || isOwnBid;
    return {
      ...bid,
      supplier: revealIdentity
        ? bid.supplier
        : { id: null, companyName: "Anonymous Supplier", city: bid.supplier.city, isVerified: false },
    };
  });

  return { data: { ...boq, materialBids: sanitisedBids, isOwner } };
}

/**
 * Create a new MARKET_ANALYSIS BOQ (consultant only).
 */
export async function createBOQ(data: CreateBOQInput) {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const parsed = createBOQSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { items, deliveryCity, biddingDeadline, ...rest } = parsed.data;

  const boq = await prisma.bOQ.create({
    data: {
      ...rest,
      type: "MARKET_ANALYSIS",
      status: "DRAFT",
      createdByUserId: profile.userId,
      consultantId: profile.id,
      deliveryCity: (deliveryCity as any) ?? null,
      biddingDeadline: biddingDeadline ? new Date(biddingDeadline) : null,
      items: {
        create: items.map((item) => ({
          ...item,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice ?? null,
          categoryId: item.categoryId ?? null,
          unitId: item.unitId ?? null,
        })),
      },
    },
  });

  revalidatePath("/consultant/boq");
  return { data: boq };
}

/**
 * Publish a draft BOQ so suppliers can submit bids.
 */
export async function publishBOQ(id: string) {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, consultantId: profile.id, status: "DRAFT" },
  });
  if (!boq) return { error: "BOQ not found or already published" };

  await prisma.bOQ.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath("/consultant/boq");
  revalidatePath(`/consultant/boq/${id}`);
  return { success: true };
}

/**
 * Close bidding on a published BOQ.
 */
export async function closeBOQBidding(id: string) {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, consultantId: profile.id, status: "PUBLISHED" },
  });
  if (!boq) return { error: "BOQ not found or not in PUBLISHED state" };

  await prisma.bOQ.update({ where: { id }, data: { status: "BIDDING_CLOSED" } });
  revalidatePath(`/consultant/boq/${id}`);
  return { success: true };
}

/**
 * Accept a supplier bid — marks bid as ACCEPTED and BOQ as AWARDED.
 */
export async function acceptBid(bidId: string) {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const bid = await prisma.materialBid.findUnique({
    where: { id: bidId },
    include: { boq: { select: { consultantId: true, id: true } } },
  });
  if (!bid) return { error: "Bid not found" };
  if (bid.boq.consultantId !== profile.id) return { error: "Forbidden" };

  await prisma.$transaction([
    prisma.materialBid.update({ where: { id: bidId }, data: { status: "ACCEPTED", isAnonymous: false } }),
    // Reject all other bids on the same BOQ
    prisma.materialBid.updateMany({
      where: { boqId: bid.boq.id, id: { not: bidId } },
      data: { status: "REJECTED" },
    }),
    prisma.bOQ.update({ where: { id: bid.boq.id }, data: { status: "AWARDED" } }),
  ]);

  revalidatePath(`/consultant/boq/${bid.boq.id}`);
  revalidatePath("/consultant/boq");
  return { success: true };
}

/**
 * Delete a DRAFT BOQ (consultant only).
 */
export async function deleteBOQ(id: string) {
  const profile = await getConsultantProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, consultantId: profile.id, status: "DRAFT" },
  });
  if (!boq) return { error: "Cannot delete – only draft BOQs can be removed" };

  await prisma.bOQ.delete({ where: { id } });
  revalidatePath("/consultant/boq");
  return { success: true };
}

// ─── Supplier: browsing & bidding ─────────────────────────────────────────────

/**
 * List all PUBLISHED MARKET_ANALYSIS BOQs for a supplier to browse.
 */
export async function getOpenBOQsForSupplier() {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const boqs = await prisma.bOQ.findMany({
    where: { type: "MARKET_ANALYSIS", status: "PUBLISHED" },
    include: {
      items: { select: { id: true } },
      materialBids: {
        where: { supplierId: profile.id },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: boqs };
}

/**
 * Get a supplier's existing bid on a BOQ (for editing).
 */
export async function getMyBidOnBOQ(boqId: string) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const bid = await prisma.materialBid.findUnique({
    where: { boqId_supplierId: { boqId, supplierId: profile.id } },
    include: { lineItems: true },
  });

  return { data: bid };
}

/**
 * Submit or update a bid on a MARKET_ANALYSIS BOQ.
 */
export async function submitBid(boqId: string, data: SubmitBidInput) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  // Verify BOQ is still open
  const boq = await prisma.bOQ.findFirst({
    where: { id: boqId, type: "MARKET_ANALYSIS", status: "PUBLISHED" },
    include: { items: { select: { id: true } } },
  });
  if (!boq) return { error: "BOQ not found or no longer accepting bids" };

  const parsed = submitBidSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { lineItems, deliveryDays, deliveryCost, notes } = parsed.data;

  // Calculate total from line items
  const boqItemMap = new Map(boq.items.map((i) => [i.id, i]));
  for (const li of lineItems) {
    if (!boqItemMap.has(li.boqItemId)) return { error: `Invalid BOQ item: ${li.boqItemId}` };
  }

  const lineItemsWithTotals = lineItems.map((li) => ({
    boqItemId: li.boqItemId,
    unitPrice: li.unitPrice,
    brand: li.brand ?? null,
    notes: li.notes ?? null,
    // totalPrice calculated server-side (quantity × unitPrice)
    totalPrice: 0, // placeholder — set below
  }));

  // We need quantities - fetch them
  const boqItems = await prisma.bOQItem.findMany({
    where: { boqId, id: { in: lineItems.map((li) => li.boqItemId) } },
    select: { id: true, quantity: true },
  });

  const qtyMap = new Map(boqItems.map((i) => [i.id, Number(i.quantity)]));
  let totalPrice = 0;
  const finalLineItems = lineItemsWithTotals.map((li) => {
    const qty = qtyMap.get(li.boqItemId) ?? 0;
    const lineTotal = Number(li.unitPrice) * qty;
    totalPrice += lineTotal;
    return { ...li, totalPrice: lineTotal };
  });

  const deliveryCostNum = deliveryCost ?? 0;
  const grandTotal = totalPrice + deliveryCostNum;

  // Upsert the bid
  const existing = await prisma.materialBid.findUnique({
    where: { boqId_supplierId: { boqId, supplierId: profile.id } },
  });

  if (existing) {
    // Update: delete old line items and recreate
    if (existing.status !== "SUBMITTED") {
      return { error: "Cannot edit a bid that is under review or has been decided" };
    }
    await prisma.$transaction([
      prisma.bidLineItem.deleteMany({ where: { bidId: existing.id } }),
      prisma.materialBid.update({
        where: { id: existing.id },
        data: {
          totalPrice: grandTotal,
          deliveryDays: deliveryDays ?? null,
          deliveryCost: deliveryCostNum,
          notes: notes ?? null,
          lineItems: { create: finalLineItems },
        },
      }),
    ]);
  } else {
    await prisma.materialBid.create({
      data: {
        boqId,
        supplierId: profile.id,
        totalPrice: grandTotal,
        deliveryDays: deliveryDays ?? null,
        deliveryCost: deliveryCostNum,
        notes: notes ?? null,
        isAnonymous: true,
        lineItems: { create: finalLineItems },
      },
    });
  }

  revalidatePath(`/supplier/bids/${boqId}`);
  revalidatePath("/supplier/bids");
  return { success: true };
}

/**
 * Withdraw own bid on a BOQ.
 */
export async function withdrawBid(bidId: string) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const bid = await prisma.materialBid.findFirst({
    where: { id: bidId, supplierId: profile.id, status: "SUBMITTED" },
  });
  if (!bid) return { error: "Bid not found or cannot be withdrawn" };

  await prisma.materialBid.update({ where: { id: bidId }, data: { status: "WITHDRAWN" } });
  revalidatePath("/supplier/bids");
  return { success: true };
}

/**
 * Get all bids submitted by the authenticated supplier.
 */
export async function getMyBids() {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const bids = await prisma.materialBid.findMany({
    where: { supplierId: profile.id },
    include: {
      boq: { select: { id: true, title: true, status: true, biddingDeadline: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return { data: bids };
}
