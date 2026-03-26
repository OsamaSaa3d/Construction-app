import { setRequestLocale } from "next-intl/server";
import { getContractorBOQs } from "@/server/actions/contractor-boq.actions";
import { ContractorBOQListClient } from "./boq-list-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ContractorBOQPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getContractorBOQs();
  const boqs = result.data ?? [];

  return <ContractorBOQListClient boqs={boqs} />;
}
