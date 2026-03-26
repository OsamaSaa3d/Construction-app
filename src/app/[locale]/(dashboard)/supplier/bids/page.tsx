import { setRequestLocale } from "next-intl/server";
import { getOpenBOQsForSupplier, getMyBids } from "@/server/actions/boq.actions";
import { SupplierBidsClient } from "./supplier-bids-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierBidsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [openResult, myBidsResult] = await Promise.all([
    getOpenBOQsForSupplier(),
    getMyBids(),
  ]);

  return (
    <SupplierBidsClient
      openBOQs={openResult.data ?? []}
      myBids={myBidsResult.data ?? []}
    />
  );
}
