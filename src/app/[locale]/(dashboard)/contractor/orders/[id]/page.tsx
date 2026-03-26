import { setRequestLocale } from "next-intl/server";
import { getOrderDetail } from "@/server/actions/order.actions";
import { checkExistingRating } from "@/server/actions/rating.actions";
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

  const order = result.data;

  // Supplier userId is available after payment (isAnonymous=false); use 'in' guard for type safety
  const supplierUserId =
    "userId" in order.bid.supplier ? order.bid.supplier.userId : null;

  const alreadyRated = supplierUserId
    ? (await checkExistingRating(supplierUserId, order.id)).exists
    : false;

  return (
    <ContractorOrderDetailClient
      order={order}
      supplierUserId={supplierUserId}
      alreadyRated={alreadyRated}
    />
  );
}
