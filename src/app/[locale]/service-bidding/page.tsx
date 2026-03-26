import { setRequestLocale } from "next-intl/server";
import { getServiceRequests } from "@/server/actions/service-bidding.actions";
import { ServiceBiddingBrowse } from "./service-bidding-client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function ServiceBiddingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = {
    category: sp.category,
    city: sp.city,
    showAll: sp.all === "1",
  };

  const result = await getServiceRequests(filters);
  const requests = result.data ?? [];

  return <ServiceBiddingBrowse requests={requests} filters={filters} locale={locale} />;
}

