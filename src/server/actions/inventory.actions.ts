"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  inventoryItemSchema,
  type InventoryItemInput,
} from "@/lib/validations/inventory";
import { revalidatePath } from "next/cache";

const DEFAULT_UNITS = [
  { name: "piece", nameAr: "قطعة", symbol: "pc" },
  { name: "kilogram", nameAr: "كيلوغرام", symbol: "kg" },
  { name: "ton", nameAr: "طن", symbol: "t" },
  { name: "bag", nameAr: "كيس", symbol: "bag" },
  { name: "meter", nameAr: "متر", symbol: "m" },
  { name: "square meter", nameAr: "متر مربع", symbol: "m2" },
  { name: "cubic meter", nameAr: "متر مكعب", symbol: "m3" },
] as const;

const DEFAULT_CATEGORIES = [
  {
    name: "Cement & Concrete",
    nameAr: "الأسمنت والخرسانة",
    slug: "cement-concrete",
    children: [
      { name: "Portland Cement", nameAr: "أسمنت بورتلاندي", slug: "portland-cement" },
      { name: "Ready Mix Concrete", nameAr: "خرسانة جاهزة", slug: "ready-mix-concrete" },
    ],
  },
  {
    name: "Steel & Metals",
    nameAr: "الحديد والمعادن",
    slug: "steel-metals",
    children: [
      { name: "Rebar", nameAr: "حديد تسليح", slug: "rebar" },
      { name: "Steel Sheets", nameAr: "ألواح صلب", slug: "steel-sheets" },
    ],
  },
  {
    name: "Electrical",
    nameAr: "الكهرباء",
    slug: "electrical",
    children: [
      { name: "Cables & Wires", nameAr: "كابلات وأسلاك", slug: "cables-wires" },
      { name: "Lighting", nameAr: "إضاءة", slug: "lighting" },
    ],
  },
] as const;

async function ensureInventoryReferenceData() {
  const [categoryCount, unitCount] = await prisma.$transaction([
    prisma.materialCategory.count(),
    prisma.unitOfMeasure.count(),
  ]);

  if (unitCount === 0) {
    for (const unit of DEFAULT_UNITS) {
      await prisma.unitOfMeasure.upsert({
        where: { name: unit.name },
        update: {},
        create: unit,
      });
    }
  }

  if (categoryCount === 0) {
    for (const parent of DEFAULT_CATEGORIES) {
      const parentCategory = await prisma.materialCategory.upsert({
        where: { slug: parent.slug },
        update: {},
        create: {
          name: parent.name,
          nameAr: parent.nameAr,
          slug: parent.slug,
        },
      });

      for (const child of parent.children) {
        await prisma.materialCategory.upsert({
          where: { slug: child.slug },
          update: { parentId: parentCategory.id },
          create: {
            name: child.name,
            nameAr: child.nameAr,
            slug: child.slug,
            parentId: parentCategory.id,
          },
        });
      }
    }
  }
}

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
  await ensureInventoryReferenceData();

  const categories = await prisma.materialCategory.findMany({
    orderBy: { name: "asc" },
  });
  return categories;
}

export async function getUnits() {
  await ensureInventoryReferenceData();

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
