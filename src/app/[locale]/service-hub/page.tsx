import { setRequestLocale } from "next-intl/server";
import { getServiceHubPosts } from "@/server/actions/service-hub.actions";
import { auth } from "@/lib/auth";
import { ServiceHubBrowse } from "./service-hub-client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function ServiceHubPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  const roleHomeMap: Record<string, string> = {
    SUPPLIER: "/supplier",
    CONTRACTOR: "/contractor",
    CONSULTANT: "/consultant",
    CUSTOMER: "/customer",
  };

  const backHref = session?.user?.role ? roleHomeMap[session.user.role] ?? "/" : "/";

  const sp = await searchParams;
  const filters = { category: sp.category, search: sp.q };

  const result = await getServiceHubPosts(filters);
  const posts = result.data ?? [];

  return <ServiceHubBrowse posts={posts} filters={filters} locale={locale} backHref={backHref} />;
}

