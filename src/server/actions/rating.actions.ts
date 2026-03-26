"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createRatingSchema, type CreateRatingInput } from "@/lib/validations/rating";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSupplierProfileId(supplierUserId: string): Promise<string | null> {
  const profile = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ─── Create rating ─────────────────────────────────────────────────────────────

export async function createSupplierRating(
  supplierUserId: string,
  orderId: string | null,
  data: CreateRatingInput
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = createRatingSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supplierId = await getSupplierProfileId(supplierUserId);
  if (!supplierId) return { error: "Supplier profile not found" };

  // Check for duplicate
  const existing = await prisma.supplierRating.findFirst({
    where: {
      supplierId,
      ratedByUserId: session.user.id,
      orderId: orderId ?? null,
    },
  });
  if (existing) return { error: "You have already rated this supplier for this order" };

  const { trustworthiness, deliveryReliability, timeliness, materialQuality, comment } =
    parsed.data;
  const overallScore =
    (trustworthiness + deliveryReliability + timeliness + materialQuality) / 4;

  await prisma.supplierRating.create({
    data: {
      supplierId,
      ratedByUserId: session.user.id,
      orderId: orderId ?? null,
      trustworthiness,
      deliveryReliability,
      timeliness,
      materialQuality,
      overallScore,
      comment,
    },
  });

  // Create notification for the supplier
  await prisma.notification.create({
    data: {
      userId: supplierUserId,
      type: "RATING_RECEIVED",
      title: "New Rating Received",
      titleAr: "تقييم جديد",
      body: `You received a ${overallScore.toFixed(1)}/5 overall rating.`,
      bodyAr: `لقد حصلت على تقييم ${overallScore.toFixed(1)}/5`,
      link: "/supplier/ratings",
    },
  });

  revalidatePath("/supplier/ratings");
  return { success: true };
}

// ─── Get supplier ratings (public) ────────────────────────────────────────────

export async function getSupplierRatings(supplierId: string) {
  const ratings = await prisma.supplierRating.findMany({
    where: { supplierId },
    include: {
      ratedByUser: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const count = ratings.length;
  if (count === 0) return { data: { ratings, averages: null, count: 0 } };

  const avg = (key: keyof typeof ratings[0]) =>
    ratings.reduce((sum, r) => sum + Number(r[key]), 0) / count;

  const averages = {
    trustworthiness: avg("trustworthiness"),
    deliveryReliability: avg("deliveryReliability"),
    timeliness: avg("timeliness"),
    materialQuality: avg("materialQuality"),
    overall: avg("overallScore"),
  };

  return { data: { ratings, averages, count } };
}

// ─── Get my ratings (supplier view) ───────────────────────────────────────────

export async function getMyRatingsAsSupplier() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") {
    return { error: "Unauthorized" };
  }

  const profile = await prisma.supplierProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Profile not found" };

  return getSupplierRatings(profile.id);
}

// ─── Check existing rating ─────────────────────────────────────────────────────

export async function checkExistingRating(supplierUserId: string, orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { exists: false };

  const supplierId = await getSupplierProfileId(supplierUserId);
  if (!supplierId) return { exists: false };

  const existing = await prisma.supplierRating.findFirst({
    where: {
      supplierId,
      ratedByUserId: session.user.id,
      orderId,
    },
  });

  return { exists: !!existing };
}

