import { setRequestLocale } from "next-intl/server";
import { getConsultantBOQs } from "@/server/actions/boq.actions";
import { BOQListClient } from "./boq-list-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ConsultantBOQPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getConsultantBOQs();
  const boqs = result.data ?? [];

  return <BOQListClient boqs={boqs} />;
}
