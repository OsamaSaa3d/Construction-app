import { setRequestLocale } from "next-intl/server";
import { getCategories, getUnits } from "@/server/actions/inventory.actions";
import { InventoryPageClient } from "./inventory-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierInventoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [categories, units] = await Promise.all([getCategories(), getUnits()]);

  return <InventoryPageClient categories={categories} units={units} />;
}
