import { setRequestLocale } from "next-intl/server";
import { getOrderDetail } from "@/server/actions/order.actions";
import { redirect } from "next/navigation";
import { ContractorOrderDetailClient } from "./contractor-order-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ContractorOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getOrderDetail(id);
  if (result.error || !result.data) redirect(`/${locale}/contractor/orders`);

  return <ContractorOrderDetailClient order={result.data} />;
}
