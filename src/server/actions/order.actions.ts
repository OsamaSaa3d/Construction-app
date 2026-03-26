"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getContractorProfile } from "@/server/actions/boq.actions";
import { uploadProofSchema, managerDecisionSchema } from "@/lib/validations/order";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSupplierProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.supplierProfile.findUnique({ where: { userId: session.user.id } });
}

async function getManagerProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

// ─── Contractor: orders ───────────────────────────────────────────────────────

/**
 * List all orders belonging to the authenticated contractor.
 */
export async function getContractorOrders() {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const orders = await prisma.order.findMany({
    where: { contractorId: profile.id },
    include: {
      escrow: true,
      boq: { select: { title: true, type: true } },
      bid: {
        select: {
          totalPrice: true,
          supplierId: true,
          isAnonymous: true,
          supplier: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: orders };
}

/**
 * Get full order detail. Supplier identity revealed only after payment.
 */
export async function getOrderDetail(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      escrow: true,
      boq: { include: { items: true } },
      bid: {
        include: {
          lineItems: true,
          supplier: { select: { companyName: true, userId: true } },
        },
      },
      contractor: { select: { userId: true, managerUserId: true } },
      deliveries: true,
      managerApproval: true,
    },
  });

  if (!order) return { error: "Order not found" };

  // Access control: only contractor or supplier of this order
  const isContractor = order.contractor.userId === session.user.id;
  const isSupplier = order.bid.supplier.userId === session.user.id;
  if (!isContractor && !isSupplier) return { error: "Forbidden" };

  // Hide supplier info until payment
  const data = {
    ...order,
    bid: {
      ...order.bid,
      supplier:
        order.bid.isAnonymous && !isSupplier
          ? { companyName: "Anonymous" }
          : order.bid.supplier,
    },
  };

  return { data };
}

// ─── Supplier: orders ─────────────────────────────────────────────────────────

/**
 * List all orders for the authenticated supplier (from accepted bids).
 */
export async function getSupplierOrders() {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const orders = await prisma.order.findMany({
    where: { bid: { supplierId: profile.id } },
    include: {
      escrow: true,
      boq: { select: { title: true } },
      bid: { select: { totalPrice: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: orders };
}

// ─── Contractor: simulate payment ────────────────────────────────────────────

/**
 * Contractor "pays" — funds move to escrow, supplier identity revealed.
 */
export async function simulatePayment(orderId: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, contractorId: profile.id, status: "PENDING" },
    include: { escrow: true },
  });
  if (!order) return { error: "Order not found or already paid" };
  if (!order.escrow) return { error: "Escrow record missing" };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
    prisma.escrowTransaction.update({
      where: { id: order.escrow.id },
      data: { status: "FUNDS_HELD" },
    }),
    // Reveal supplier identity to contractor
    prisma.materialBid.update({
      where: { id: order.bidId },
      data: { isAnonymous: false },
    }),
  ]);

  revalidatePath(`/contractor/orders/${orderId}`);
  revalidatePath("/contractor/orders");
  return { success: true };
}

// ─── Supplier: upload delivery proof ─────────────────────────────────────────

/**
 * Supplier uploads proof of delivery.
 */
export async function uploadDeliveryProof(orderId: string, formData: FormData) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const rawData = {
    proofImageUrls: formData.get("proofImageUrls") as string,
    notes: formData.get("notes") as string | null,
  };

  const parsed = uploadProofSchema.safeParse(rawData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const order = await prisma.order.findFirst({
    where: { id: orderId, bid: { supplierId: profile.id }, status: "PAID" },
    include: { escrow: true },
  });
  if (!order) return { error: "Order not found or not yet paid" };
  if (!order.escrow) return { error: "Escrow record missing" };

  const urls = parsed.data.proofImageUrls.split(",").map((u) => u.trim()).filter(Boolean);

  await prisma.$transaction([
    prisma.delivery.create({
      data: {
        orderId,
        supplierId: profile.id,
        proofImages: JSON.stringify(urls),
        notes: parsed.data.notes ?? null,
      },
    }),
    prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } }),
    prisma.escrowTransaction.update({
      where: { id: order.escrow.id },
      data: { status: "PROOF_UPLOADED" },
    }),
  ]);

  revalidatePath(`/supplier/orders/${orderId}`);
  revalidatePath("/supplier/orders");
  return { success: true };
}

// ─── Contractor: confirm receipt ──────────────────────────────────────────────

/**
 * Contractor confirms receipt.
 * If contractor has a managerUserId → triggers manager approval gate.
 * Otherwise → funds released immediately.
 */
export async function contractorConfirmReceipt(orderId: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, contractorId: profile.id, status: "DELIVERED" },
    include: { escrow: true, contractor: { select: { managerUserId: true } } },
  });
  if (!order) return { error: "Order not found or not yet delivered" };
  if (!order.escrow) return { error: "Escrow record missing" };

  const needsManagerApproval = !!order.contractor.managerUserId;

  if (needsManagerApproval) {
    await prisma.$transaction([
      prisma.escrowTransaction.update({
        where: { id: order.escrow.id },
        data: { status: "PENDING_MANAGER_APPROVAL" },
      }),
      prisma.managerApproval.create({
        data: {
          orderId,
          managerId: order.contractor.managerUserId!,
          status: "PENDING",
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
      prisma.escrowTransaction.update({
        where: { id: order.escrow.id },
        data: { status: "RELEASED", releasedAt: new Date() },
      }),
    ]);
  }

  revalidatePath(`/contractor/orders/${orderId}`);
  revalidatePath("/contractor/orders");
  return { success: true, needsManagerApproval };
}

// ─── Manager: approve or reject ───────────────────────────────────────────────

/**
 * Manager reviews the delivery and approves or rejects.
 */
export async function managerDecision(orderId: string, formData: FormData) {
  const session = await getManagerProfile();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const rawData = {
    approved: formData.get("approved") === "true",
    notes: formData.get("notes") as string | null,
  };

  const parsed = managerDecisionSchema.safeParse(rawData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const approval = await prisma.managerApproval.findFirst({
    where: {
      orderId,
      managerId: session.user.id,
      status: "PENDING",
    },
    include: { order: { include: { escrow: true } } },
  });
  if (!approval) return { error: "No pending approval found for this order" };
  if (!approval.order.escrow) return { error: "Escrow record missing" };

  if (parsed.data.approved) {
    await prisma.$transaction([
      prisma.managerApproval.update({
        where: { id: approval.id },
        data: { status: "APPROVED", notes: parsed.data.notes ?? null },
      }),
      prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
      prisma.escrowTransaction.update({
        where: { id: approval.order.escrow.id },
        data: { status: "RELEASED", releasedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.managerApproval.update({
        where: { id: approval.id },
        data: { status: "REJECTED", notes: parsed.data.notes ?? null },
      }),
      prisma.order.update({ where: { id: orderId }, data: { status: "DISPUTED" } }),
      prisma.escrowTransaction.update({
        where: { id: approval.order.escrow.id },
        data: { status: "DISPUTED" },
      }),
    ]);
  }

  revalidatePath(`/contractor/orders/${orderId}`);
  return { success: true };
}
