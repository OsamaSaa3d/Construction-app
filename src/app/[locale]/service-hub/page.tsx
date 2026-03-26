import { setRequestLocale } from "next-intl/server";
import { getServiceHubPosts } from "@/server/actions/service-hub.actions";
import { ServiceHubBrowse } from "./service-hub-client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function ServiceHubPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = { category: sp.category, search: sp.q };

  const result = await getServiceHubPosts(filters);
  const posts = result.data ?? [];

  return <ServiceHubBrowse posts={posts} filters={filters} locale={locale} />;
}

