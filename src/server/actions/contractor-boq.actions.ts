"use server";

import { prisma } from "@/lib/prisma";
import { getContractorProfile } from "@/server/actions/boq.actions";
import { createContractorBOQSchema, type CreateContractorBOQInput } from "@/lib/validations/order";
import { revalidatePath } from "next/cache";

// ─── Contractor: BOQ management ───────────────────────────────────────────────

/**
 * List all PURCHASE BOQs created by the authenticated contractor.
 */
export async function getContractorBOQs() {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const boqs = await prisma.bOQ.findMany({
    where: { contractorId: profile.id, type: "PURCHASE" },
    include: {
      items: { select: { id: true } },
      materialBids: { select: { id: true, status: true } },
      orders: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: boqs };
}

/**
 * Create a new PURCHASE BOQ (contractor only).
 */
export async function createContractorBOQ(data: CreateContractorBOQInput) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const parsed = createContractorBOQSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    items,
    deliveryCity,
    biddingDeadline,
    startingPrice,
    autoAcceptPrice,
    purchaseMode,
    ...rest
  } = parsed.data;

  const boq = await prisma.bOQ.create({
    data: {
      ...rest,
      type: "PURCHASE",
      status: "DRAFT",
      createdByUserId: profile.userId,
      contractorId: profile.id,
      deliveryCity: (deliveryCity as any) ?? null,
      biddingDeadline: biddingDeadline ? new Date(biddingDeadline) : null,
      purchaseMode: purchaseMode as any,
      startingPrice: startingPrice ?? null,
      autoAcceptPrice: autoAcceptPrice ?? null,
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

  revalidatePath("/contractor/boq");
  return { data: boq };
}

/**
 * Publish a draft PURCHASE BOQ so suppliers can submit bids.
 */
export async function publishContractorBOQ(id: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, contractorId: profile.id, status: "DRAFT" },
  });
  if (!boq) return { error: "BOQ not found or already published" };

  await prisma.bOQ.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath("/contractor/boq");
  revalidatePath(`/contractor/boq/${id}`);
  return { success: true };
}

/**
 * Close bidding on a contractor's PURCHASE BOQ.
 */
export async function closeContractorBOQBidding(id: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, contractorId: profile.id, status: "PUBLISHED" },
  });
  if (!boq) return { error: "BOQ not found or not in PUBLISHED state" };

  await prisma.bOQ.update({ where: { id }, data: { status: "BIDDING_CLOSED" } });
  revalidatePath(`/contractor/boq/${id}`);
  return { success: true };
}

/**
 * Delete a DRAFT BOQ (contractor only).
 */
export async function deleteContractorBOQ(id: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const boq = await prisma.bOQ.findFirst({
    where: { id, contractorId: profile.id, status: "DRAFT" },
  });
  if (!boq) return { error: "Cannot delete – only draft BOQs can be removed" };

  await prisma.bOQ.delete({ where: { id } });
  revalidatePath("/contractor/boq");
  return { success: true };
}

/**
 * Contractor accepts a supplier bid — creates Order + EscrowTransaction.
 * Reveals supplier identity only after contractor pays (not here).
 */
export async function contractorAcceptBid(bidId: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const bid = await prisma.materialBid.findUnique({
    where: { id: bidId },
    include: { boq: { select: { contractorId: true, id: true, status: true } } },
  });
  if (!bid) return { error: "Bid not found" };
  if (bid.boq.contractorId !== profile.id) return { error: "Forbidden" };
  if (!["PUBLISHED", "BIDDING_CLOSED"].includes(bid.boq.status)) {
    return { error: "BOQ is not in an acceptable state" };
  }

  await prisma.$transaction([
    // Accept this bid (keep anonymous until payment)
    prisma.materialBid.update({
      where: { id: bidId },
      data: { status: "ACCEPTED" },
    }),
    // Reject all other bids on the same BOQ
    prisma.materialBid.updateMany({
      where: { boqId: bid.boq.id, id: { not: bidId } },
      data: { status: "REJECTED" },
    }),
    // Mark BOQ as awarded
    prisma.bOQ.update({
      where: { id: bid.boq.id },
      data: { status: "AWARDED" },
    }),
    // Create the Order + escrow
    prisma.order.create({
      data: {
        boqId: bid.boq.id,
        bidId: bid.id,
        contractorId: profile.id,
        totalAmount: bid.totalPrice,
        status: "PENDING",
        escrow: {
          create: { amount: bid.totalPrice, status: "PENDING_PAYMENT" },
        },
      },
    }),
  ]);

  revalidatePath(`/contractor/boq/${bid.boq.id}`);
  revalidatePath("/contractor/boq");
  revalidatePath("/contractor/orders");
  return { success: true };
}
