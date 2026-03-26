import { setRequestLocale } from "next-intl/server";
import { getCategories, getUnits } from "@/server/actions/inventory.actions";
import { BOQCreateClient } from "./boq-create-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ConsultantBOQCreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [categories, units] = await Promise.all([getCategories(), getUnits()]);

  return <BOQCreateClient categories={categories} units={units} />;
}
