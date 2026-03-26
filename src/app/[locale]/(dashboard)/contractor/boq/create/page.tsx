import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ContractorBOQCreateClient } from "./boq-create-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ContractorBOQCreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [categories, units] = await Promise.all([
    prisma.materialCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <ContractorBOQCreateClient categories={categories} units={units} />;
}
