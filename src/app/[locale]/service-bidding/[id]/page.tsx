import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getServiceRequest } from "@/server/actions/service-bidding.actions";
import { RequestDetailClient } from "./request-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ServiceRequestDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getServiceRequest(id);
  if ("error" in result) notFound();

  return (
    <RequestDetailClient
      request={result.data}
      isRequester={result.isRequester}
      myBid={result.myBid}
      userId={result.userId}
      locale={locale}
    />
  );
}
