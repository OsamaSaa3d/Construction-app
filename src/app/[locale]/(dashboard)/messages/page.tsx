import { setRequestLocale } from "next-intl/server";
import { getConversations } from "@/server/actions/message.actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessagesClient } from "./messages-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const result = await getConversations();
  if (result.error || !result.data) return <div>Error loading messages.</div>;

  return <MessagesClient conversations={result.data} />;
}
