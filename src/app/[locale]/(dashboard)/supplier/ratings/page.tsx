import { setRequestLocale } from "next-intl/server";
import { getMyRatingsAsSupplier } from "@/server/actions/rating.actions";
import { redirect } from "next/navigation";
import { SupplierRatingsClient } from "./supplier-ratings-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierRatingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getMyRatingsAsSupplier();
  if (!("data" in result) || !result.data) redirect(`/${locale}/supplier`);

  return <SupplierRatingsClient data={result.data} />;
}
