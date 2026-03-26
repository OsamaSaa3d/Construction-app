import { setRequestLocale } from "next-intl/server";
import { getContractorOrders } from "@/server/actions/order.actions";
import { ContractorOrdersClient } from "./contractor-orders-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ContractorOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getContractorOrders();
  const orders = result.data ?? [];

  return <ContractorOrdersClient orders={orders} />;
}
