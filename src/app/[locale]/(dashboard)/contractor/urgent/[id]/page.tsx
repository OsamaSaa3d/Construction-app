import { setRequestLocale } from "next-intl/server";
import { getUrgentRequestDetail } from "@/server/actions/urgent.actions";
import { redirect } from "next/navigation";
import { ContractorUrgentDetailClient } from "./urgent-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ContractorUrgentDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getUrgentRequestDetail(id);
  if (result.error || !result.data) redirect(`/${locale}/contractor/urgent`);

  return <ContractorUrgentDetailClient request={result.data} />;
}
