"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  inventoryItemSchema,
  type InventoryItemInput,
} from "@/lib/validations/inventory";
import { revalidatePath } from "next/cache";

async function getSupplierProfile() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPPLIER") {
    return null;
  }
  return prisma.supplierProfile.findUnique({
    where: { userId: session.user.id },
  });
}

export async function getInventoryItems() {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const items = await prisma.inventoryItem.findMany({
    where: { supplierId: profile.id },
    include: {
      category: true,
      unit: true,
      marketplaceListing: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: items };
}

export async function getCategories() {
  const categories = await prisma.materialCategory.findMany({
    orderBy: { name: "asc" },
  });
  return categories;
}

export async function getUnits() {
  const units = await prisma.unitOfMeasure.findMany({
    orderBy: { name: "asc" },
  });
  return units;
}

export async function createInventoryItem(data: InventoryItemInput) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const parsed = inventoryItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { pricePerUnit, quantityInStock, minOrderQty, ...rest } = parsed.data;

  await prisma.inventoryItem.create({
    data: {
      ...rest,
      supplierId: profile.id,
      pricePerUnit: pricePerUnit,
      quantityInStock: quantityInStock,
      minOrderQty: minOrderQty ?? null,
    },
  });

  revalidatePath("/supplier/inventory");
  return { success: true };
}

export async function updateInventoryItem(id: string, data: InventoryItemInput) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, supplierId: profile.id },
  });
  if (!existing) return { error: "Item not found" };

  const parsed = inventoryItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { pricePerUnit, quantityInStock, minOrderQty, ...rest } = parsed.data;

  await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...rest,
      pricePerUnit: pricePerUnit,
      quantityInStock: quantityInStock,
      minOrderQty: minOrderQty ?? null,
    },
  });

  revalidatePath("/supplier/inventory");
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
  const profile = await getSupplierProfile();
  if (!profile) return { error: "Unauthorized" };

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, supplierId: profile.id },
  });
  if (!existing) return { error: "Item not found" };

  await prisma.inventoryItem.delete({ where: { id } });

  revalidatePath("/supplier/inventory");
  return { success: true };
}
