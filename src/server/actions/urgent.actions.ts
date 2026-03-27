"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createUrgentRequestSchema,
  urgentResponseSchema,
  type CreateUrgentRequestInput,
  type UrgentResponseInput,
} from "@/lib/validations/urgent";
import { revalidatePath } from "next/cache";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getContractorProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CONTRACTOR") return null;
  return prisma.contractorProfile.findUnique({ where: { userId: session.user.id } });
}

async function getSupplierProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") return null;
  return prisma.supplierProfile.findUnique({ where: { userId: session.user.id } });
}

// ─── Distance helper ──────────────────────────────────────────────────────────

/** Haversine distance in kilometres between two lat/lng points. */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Contractor actions ───────────────────────────────────────────────────────

/**
 * List all urgent requests created by the authenticated contractor.
 */
export async function getContractorUrgentRequests() {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const requests = await prisma.urgentRequest.findMany({
    where: { contractorId: profile.id },
    include: {
      items: true,
      matches: { select: { id: true, canFulfill: true, accepted: true, priceQuote: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: requests.map((request) => ({
      ...request,
      maxBudget: request.maxBudget ? Number(request.maxBudget) : null,
      items: request.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
      matches: request.matches.map((match) => ({
        ...match,
        priceQuote: match.priceQuote ? Number(match.priceQuote) : null,
      })),
    })),
  };
}

/**
 * Get full detail of a single urgent request (contractor or matched supplier).
 */
export async function getUrgentRequestDetail(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const request = await prisma.urgentRequest.findUnique({
    where: { id },
    include: {
      items: true,
      contractor: { select: { userId: true } },
      matches: {
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              city: true,
              isVerified: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) return { error: "Not found" };

  const isContractor = request.contractor.userId === session.user.id;

  // Supplier can only see if they are in the match list
  const supplierMatch =
    !isContractor && session.user.role === "SUPPLIER"
      ? request.matches.find((m) => m.supplier.userId === session.user.id)
      : null;

  if (!isContractor && !supplierMatch) return { error: "Forbidden" };

  // Suppliers only see their own match entry
  const visibleMatches = isContractor ? request.matches : request.matches.filter((m) => m.supplierId === supplierMatch!.supplierId);

  return {
    data: {
      ...request,
      maxBudget: request.maxBudget ? Number(request.maxBudget) : null,
      items: request.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
      matches: visibleMatches.map((match) => ({
        ...match,
        priceQuote: match.priceQuote ? Number(match.priceQuote) : null,
      })),
    },
    isContractor,
  };
}

/**
 * Create a new urgent request.
 * Automatically matches nearby suppliers who have canUrgentDeliver=true items.
 */
export async function createUrgentRequest(data: CreateUrgentRequestInput) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const parsed = createUrgentRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { items, neededBy, maxBudget, maxRadiusKm, deliveryLat, deliveryLng, deliveryCity, ...rest } =
    parsed.data;

  // Find suppliers with urgent-delivery capability in the same city
  const candidateSuppliers = await prisma.supplierProfile.findMany({
    where: {
      city: deliveryCity as any,
      inventoryItems: { some: { canUrgentDeliver: true, isActive: true } },
    },
    select: { id: true, latitude: true, longitude: true },
  });

  // Filter by radius
  const nearbySupplierIds = candidateSuppliers
    .filter((s) => {
      if (s.latitude === null || s.longitude === null) return false;
      const km = haversineKm(deliveryLat, deliveryLng, s.latitude, s.longitude);
      return km <= (maxRadiusKm ?? 50);
    })
    .map((s) => ({ id: s.id, distanceKm: haversineKm(deliveryLat, deliveryLng, s.latitude!, s.longitude!) }));

  const request = await prisma.urgentRequest.create({
    data: {
      ...rest,
      contractorId: profile.id,
      deliveryCity: deliveryCity as any,
      deliveryLat,
      deliveryLng,
      maxRadiusKm: maxRadiusKm ?? 50,
      maxBudget: maxBudget ?? null,
      neededBy: neededBy ? new Date(neededBy) : null,
      status: nearbySupplierIds.length > 0 ? "MATCHED" : "SEARCHING",
      items: {
        create: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        })),
      },
      matches: {
        create: nearbySupplierIds.map(({ id, distanceKm }) => ({
          supplierId: id,
          distanceKm,
        })),
      },
    },
  });

  revalidatePath("/contractor/urgent");
  return { data: request, matchedCount: nearbySupplierIds.length };
}

/**
 * Contractor cancels an in-flight urgent request.
 */
export async function cancelUrgentRequest(id: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const request = await prisma.urgentRequest.findFirst({
    where: {
      id,
      contractorId: profile.id,
      status: { in: ["SEARCHING", "MATCHED"] },
    },
  });
  if (!request) return { error: "Request not found or cannot be cancelled" };

  await prisma.urgentRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/contractor/urgent");
  revalidatePath(`/contractor/urgent/${id}`);
  return { success: true };
}

/**
 * Contractor accepts a supplier's quote — moves to ACCEPTED + IN_DELIVERY.
 */
export async function acceptUrgentMatch(matchId: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const match = await prisma.urgentSupplierMatch.findUnique({
    where: { id: matchId },
    include: { request: { select: { contractorId: true, id: true, status: true } } },
  });
  if (!match) return { error: "Match not found" };
  if (match.request.contractorId !== profile.id) return { error: "Forbidden" };
  if (!match.canFulfill) return { error: "Supplier indicated they cannot fulfill this request" };
  if (!["MATCHED", "SEARCHING"].includes(match.request.status)) {
    return { error: "Request is no longer in a state where matches can be accepted" };
  }

  await prisma.$transaction([
    prisma.urgentSupplierMatch.update({
      where: { id: matchId },
      data: { accepted: true },
    }),
    prisma.urgentRequest.update({
      where: { id: match.request.id },
      data: { status: "IN_DELIVERY" },
    }),
  ]);

  revalidatePath(`/contractor/urgent/${match.request.id}`);
  revalidatePath("/contractor/urgent");
  return { success: true };
}

/**
 * Contractor confirms receipt of urgent delivery → CONFIRMED.
 */
export async function contractorConfirmUrgentDelivery(requestId: string) {
  const profile = await getContractorProfile();
  if (!profile) return { error: "Unauthorized" };

  const request = await prisma.urgentRequest.findFirst({
    where: { id: requestId, contractorId: profile.id, status: "DELIVERED" },
  });
  if (!request) return { error: "Request not found or not yet delivered" };

  await prisma.urgentRequest.update({ where: { id: requestId }, data: { status: "CONFIRMED" } });
  revalidatePath(`/contractor/urgent/${requestId}`);
  revalidatePath("/contractor/urgent");
  return { success: true };
}

// ─── Supplier actions ─────────────────────────────────────────────────────────

/**
 * Get all urgent request matches for the authenticated supplier.
 */
export async function getSupplierUrgentMatches() {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const matches = await prisma.urgentSupplierMatch.findMany({
    where: { supplierId: profile.id },
    include: {
      request: {
        include: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: matches.map((match) => ({
      ...match,
      priceQuote: match.priceQuote ? Number(match.priceQuote) : null,
      request: {
        ...match.request,
        maxBudget: match.request.maxBudget ? Number(match.request.maxBudget) : null,
        items: match.request.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
        })),
      },
    })),
  };
}

/**
 * Supplier responds to an urgent match — either confirms ability + price, or declines.
 */
export async function respondToUrgentMatch(matchId: string, data: UrgentResponseInput) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const parsed = urgentResponseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const match = await prisma.urgentSupplierMatch.findFirst({
    where: { id: matchId, supplierId: profile.id },
    include: { request: { select: { id: true, status: true } } },
  });
  if (!match) return { error: "Match not found" };
  if (!["SEARCHING", "MATCHED"].includes(match.request.status)) {
    return { error: "This request is no longer accepting responses" };
  }
  if (match.respondedAt !== null) return { error: "You have already responded to this match" };

  await prisma.urgentSupplierMatch.update({
    where: { id: matchId },
    data: {
      canFulfill: parsed.data.canFulfill,
      priceQuote: parsed.data.canFulfill ? (parsed.data.priceQuote ?? null) : null,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/supplier/urgent/${match.request.id}`);
  revalidatePath("/supplier/urgent");
  return { success: true };
}

/**
 * Supplier marks the urgent delivery as delivered → request status DELIVERED.
 */
export async function supplierMarkUrgentDelivered(requestId: string) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  // Verify the supplier has the accepted match for this request
  const match = await prisma.urgentSupplierMatch.findFirst({
    where: { supplierId: profile.id, requestId, accepted: true },
    include: { request: { select: { status: true } } },
  });
  if (!match) return { error: "No accepted match found for this request" };
  if (match.request.status !== "IN_DELIVERY") {
    return { error: "Request is not in delivery state" };
  }

  await prisma.urgentRequest.update({ where: { id: requestId }, data: { status: "DELIVERED" } });
  revalidatePath(`/supplier/urgent/${requestId}`);
  revalidatePath("/supplier/urgent");
  return { success: true };
}
