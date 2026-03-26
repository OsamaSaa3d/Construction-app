"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { sendMessage } from "@/server/actions/message.actions";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  sender: { id: string; name: string };
};

type Props = {
  messages: Message[];
  otherUser: { id: string; name: string; role: string } | null;
  currentUserId: string;
};

export function MessageThreadClient({ messages: initialMessages, otherUser, currentUserId }: Props) {
  const t = useTranslations("messages");
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!otherUser) return null;

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(otherUser!.id, trimmed);
    setSending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setContent("");
      router.refresh();
      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          content: trimmed,
          createdAt: new Date(),
          isRead: false,
          sender: { id: currentUserId, name: "You" },
        },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/messages" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-semibold">{otherUser.name}</p>
          <Badge variant="secondary" className="text-xs">{otherUser.role}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t("noMessages")}</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3">
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <div className="flex gap-2">
          <Textarea
            rows={2}
            placeholder={t("messagePlaceholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none"
          />
          <Button onClick={handleSend} disabled={sending || !content.trim()} size="icon" className="h-auto">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
