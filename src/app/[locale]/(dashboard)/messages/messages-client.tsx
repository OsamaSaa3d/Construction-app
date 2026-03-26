"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Conversation = {
  user: { id: string; name: string; role: string };
  lastMessage: string;
  createdAt: Date;
  unread: number;
};

type Props = {
  conversations: Conversation[];
};

export function MessagesClient({ conversations }: Props) {
  const t = useTranslations("messages");

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t("inbox")}</h1>

      {conversations.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 font-medium">{t("noConversations")}</p>
          <p className="text-sm text-muted-foreground">{t("noConversationsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.user.id} href={`/messages/${conv.user.id}` as any}>
              <Card className={`hover:bg-accent/50 transition-colors cursor-pointer ${conv.unread > 0 ? "border-primary/40" : ""}`}>
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{conv.user.name}</p>
                      <Badge variant="secondary" className="text-xs">{conv.user.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
