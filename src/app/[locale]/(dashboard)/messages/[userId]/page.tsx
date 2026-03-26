import { setRequestLocale } from "next-intl/server";
import { getMessages } from "@/server/actions/message.actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageThreadClient } from "./message-thread-client";

type Props = {
  params: Promise<{ locale: string; userId: string }>;
};

export default async function MessageThreadPage({ params }: Props) {
  const { locale, userId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const result = await getMessages(userId);
  if (result.error || !result.data) redirect(`/${locale}/messages`);

  return (
    <MessageThreadClient
      messages={result.data.messages}
      otherUser={result.data.otherUser}
      currentUserId={session.user.id!}
    />
  );
}
