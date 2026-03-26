"use client";

import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, MessageCircle, Send } from "lucide-react";
import { toggleLike, addComment } from "@/server/actions/service-hub.actions";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string | null };
};

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string;
  tags: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string | null; role: string };
  comments: Comment[];
};

type Props = {
  post: Post;
  liked: boolean;
  userId: string | null;
  locale: string;
};

export function PostDetailClient({ post, liked: initialLiked, userId, locale }: Props) {
  const t = useTranslations("serviceHub");
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [commentError, setCommentError] = useState<string | null>(null);

  const images: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
  const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();

  function handleLike() {
    if (!userId) { router.push("/login"); return; }
    startTransition(async () => {
      const result = await toggleLike(post.id);
      if ("liked" in result) {
        setLiked(result.liked ?? false);
        setLikeCount((c) => c + (result.liked ? 1 : -1));
      }
    });
  }

  function handleComment() {
    if (!userId) { router.push("/login"); return; }
    if (!commentText.trim()) return;
    setCommentError(null);
    startTransition(async () => {
      const result = await addComment(post.id, commentText.trim());
      if ("error" in result) { setCommentError(result.error ?? "An error occurred"); return; }
      setCommentText("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/service-hub"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToHub")}
      </Link>

      {/* Post */}
      <article className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(`categories.${post.category}`)}</Badge>
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="mb-3 text-2xl font-bold">{post.title}</h1>

        <p className="mb-4 text-sm text-muted-foreground">
          {post.author.name} &middot;{" "}
          {new Date(post.createdAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </div>

        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-40 w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}

        <Separator className="mt-6" />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isPending}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likeCount} {t("likes")}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {post.commentCount} {t("comments")}
          </span>
        </div>
      </article>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("commentsTitle")}</h2>

        {post.comments.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        )}

        {post.comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{comment.author.name}</span>
                <span>{new Date(comment.createdAt).toLocaleDateString(locale)}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </CardContent>
          </Card>
        ))}

        {/* Add comment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("addComment")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!userId ? (
              <p className="text-sm text-muted-foreground">
                {t("loginToInteract")}{" "}
                <Link href="/login" className="text-primary underline">
                  {t("loginLink")}
                </Link>
              </p>
            ) : (
              <>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("commentPlaceholder")}
                  rows={3}
                />
                {commentError && (
                  <p className="text-sm text-destructive">{commentError}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={isPending || !commentText.trim()}
                    className="gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {t("submitComment")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
