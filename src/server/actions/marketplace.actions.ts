"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

export async function publishToMarketplace(inventoryItemId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") {
    return { error: "Unauthorized" };
  }

  const profile = await prisma.supplierProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Supplier profile not found" };

  const item = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, supplierId: profile.id },
    include: { category: true, unit: true },
  });
  if (!item) return { error: "Inventory item not found" };

  const existing = await prisma.marketplaceListing.findUnique({
    where: { inventoryItemId },
  });
  if (existing) return { error: "Item already published" };

  await prisma.marketplaceListing.create({
    data: {
      supplierId: profile.id,
      inventoryItemId: item.id,
      categoryId: item.categoryId,
      title: item.name,
      titleAr: item.nameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      price: item.pricePerUnit,
      images: item.images,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath("/supplier/inventory");
  return { success: true };
}

export async function unpublishFromMarketplace(inventoryItemId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") {
    return { error: "Unauthorized" };
  }

  const profile = await prisma.supplierProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Supplier profile not found" };

  const listing = await prisma.marketplaceListing.findUnique({
    where: { inventoryItemId },
  });
  if (!listing || listing.supplierId !== profile.id) {
    return { error: "Listing not found" };
  }

  await prisma.marketplaceListing.delete({ where: { id: listing.id } });

  revalidatePath("/marketplace");
  revalidatePath("/supplier/inventory");
  return { success: true };
}

export type MarketplaceFilters = {
  categoryId?: string;
  city?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
};

export async function getMarketplaceListings(filters: MarketplaceFilters = {}) {
  try {
    const where: Prisma.MarketplaceListingWhereInput = { isActive: true };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.city) {
      where.supplier = { city: filters.city as Prisma.EnumUAECityFilter };
    }

    let orderBy: Prisma.MarketplaceListingOrderByWithRelationInput = { createdAt: "desc" };
    if (filters.sort === "price_asc") orderBy = { price: "asc" };
    if (filters.sort === "price_desc") orderBy = { price: "desc" };

    const listings = await prisma.marketplaceListing.findMany({
      where,
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
            city: true,
            isVerified: true,
          },
        },
        inventoryItem: {
          select: {
            quantityInStock: true,
            unit: true,
            canUrgentDeliver: true,
          },
        },
      },
      orderBy,
    });

    return listings;
  } catch (error) {
    console.error("getMarketplaceListings failed", error);
    return [];
  }
}

export async function getMarketplaceListing(id: string) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
            companyNameAr: true,
            city: true,
            isVerified: true,
            description: true,
          },
        },
        inventoryItem: {
          select: {
            quantityInStock: true,
            minOrderQty: true,
            unit: true,
            brand: true,
            sku: true,
            canUrgentDeliver: true,
          },
        },
      },
    });

    if (!listing) return null;

    // Increment view count
    await prisma.marketplaceListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  } catch (error) {
    console.error("getMarketplaceListing failed", error);
    return null;
  }
}

export async function getMarketplaceCategories() {
  try {
    const categories = await prisma.materialCategory.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("getMarketplaceCategories failed", error);
    return [];
  }
}
