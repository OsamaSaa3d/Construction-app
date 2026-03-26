"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { markNotificationRead, markAllRead } from "@/server/actions/notification.actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  titleAr: string | null;
  body: string;
  bodyAr: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

type Props = {
  data: { notifications: Notification[]; total: number };
};

export function NotificationsClient({ data }: Props) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(data.notifications);
  const [marking, setMarking] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    router.refresh();
  }

  async function handleMarkAllRead() {
    setMarking(true);
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarking(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} {t("unread")}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={marking}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 font-medium">{t("noNotifications")}</p>
          <p className="text-sm text-muted-foreground">{t("noNotificationsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors cursor-pointer ${!n.isRead ? "border-primary/40 bg-primary/5" : ""}`}
              onClick={() => {
                if (!n.isRead) handleMarkRead(n.id);
                if (n.link) router.push(n.link as any);
              }}
            >
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {t(`types.${n.type}` as Parameters<typeof t>[0]) ?? n.type}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
