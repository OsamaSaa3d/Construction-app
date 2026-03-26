import { setRequestLocale } from "next-intl/server";
import { getContractorUrgentRequests } from "@/server/actions/urgent.actions";
import { ContractorUrgentListClient } from "./urgent-list-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ContractorUrgentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getContractorUrgentRequests();
  const requests = result.data ?? [];

  return <ContractorUrgentListClient requests={requests} />;
}
