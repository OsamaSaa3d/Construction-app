import { setRequestLocale } from "next-intl/server";
import { getBOQDetail, getMyBidOnBOQ } from "@/server/actions/boq.actions";
import { notFound } from "next/navigation";
import { SupplierBidFormClient } from "./supplier-bid-form-client";

type Props = {
  params: Promise<{ locale: string; boqId: string }>;
};

export default async function SupplierBidPage({ params }: Props) {
  const { locale, boqId } = await params;
  setRequestLocale(locale);

  const [boqResult, bidResult] = await Promise.all([
    getBOQDetail(boqId),
    getMyBidOnBOQ(boqId),
  ]);

  if (boqResult.error || !boqResult.data) return notFound();

  const boq = boqResult.data;

  return (
    <SupplierBidFormClient
      boq={boq}
      existingBid={bidResult.data ?? null}
    />
  );
}
