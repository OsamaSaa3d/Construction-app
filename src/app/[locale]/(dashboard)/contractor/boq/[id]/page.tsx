import { setRequestLocale } from "next-intl/server";
import { getBOQDetail } from "@/server/actions/boq.actions";
import { redirect } from "next/navigation";
import { ContractorBOQDetailClient } from "./boq-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ContractorBOQDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getBOQDetail(id);
  if (result.error || !result.data) redirect(`/${locale}/contractor/boq`);

  return <ContractorBOQDetailClient boq={result.data} />;
}
