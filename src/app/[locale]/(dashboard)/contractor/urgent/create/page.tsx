import { setRequestLocale } from "next-intl/server";
import { UrgentCreateClient } from "./urgent-create-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UrgentCreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UrgentCreateClient />;
}
