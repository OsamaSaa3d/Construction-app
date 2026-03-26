import { setRequestLocale } from "next-intl/server";
import { getMyNotifications } from "@/server/actions/notification.actions";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationsClient } from "./notifications-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const result = await getMyNotifications(1, 50);
  if (result.error || !result.data) return <div>Error loading notifications.</div>;

  return <NotificationsClient data={result.data} />;
}
