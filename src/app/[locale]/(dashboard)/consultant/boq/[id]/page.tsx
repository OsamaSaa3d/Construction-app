import { setRequestLocale } from "next-intl/server";
import { getBOQDetail } from "@/server/actions/boq.actions";
import { notFound } from "next/navigation";
import { BOQDetailClient } from "./boq-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ConsultantBOQDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getBOQDetail(id);
  if (result.error || !result.data) return notFound();

  return <BOQDetailClient boq={result.data} />;
}
