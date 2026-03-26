import { setRequestLocale } from "next-intl/server";
import { getSupplierUrgentMatches } from "@/server/actions/urgent.actions";
import { SupplierUrgentListClient } from "./urgent-list-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierUrgentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getSupplierUrgentMatches();
  const matches = result.data ?? [];

  return <SupplierUrgentListClient matches={matches} />;
}
