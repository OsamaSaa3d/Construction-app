import { setRequestLocale } from "next-intl/server";
import { getSupplierOrders } from "@/server/actions/order.actions";
import { SupplierOrdersClient } from "./supplier-orders-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getSupplierOrders();
  const orders = result.data ?? [];

  return <SupplierOrdersClient orders={orders} />;
}
