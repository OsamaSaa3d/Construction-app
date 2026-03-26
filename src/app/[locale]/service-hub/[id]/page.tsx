import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getServiceHubPost } from "@/server/actions/service-hub.actions";
import { PostDetailClient } from "./post-detail-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ServiceHubPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getServiceHubPost(id);
  if ("error" in result) notFound();

  return (
    <PostDetailClient
      post={result.data}
      liked={result.liked}
      userId={result.userId}
      locale={locale}
    />
  );
}
