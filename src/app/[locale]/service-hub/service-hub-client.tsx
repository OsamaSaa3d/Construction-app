"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Heart, MessageCircle, PenLine, ArrowLeft } from "lucide-react";

const SERVICE_CATEGORIES = [
  "COMPANY", "INTERIOR_DESIGN", "CONTRACTOR", "ELECTRICAL",
  "PLUMBING", "HVAC", "LANDSCAPING", "PAINTING", "FLOORING", "OTHER",
] as const;

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string | null; role: string };
};

type Props = {
  posts: Post[];
  filters: { category?: string; search?: string };
  locale: string;
  backHref?: string;
};

export function ServiceHubBrowse({ posts, filters, locale, backHref = "/" }: Props) {
  const t = useTranslations("serviceHub");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue || null);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backHome")}
          </Link>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <Link href="/service-hub/create">
          <Button size="sm" className="gap-2">
            <PenLine className="h-4 w-4" />
            {t("createPost")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          {t("search")}
        </Button>
      </form>

      {/* Category chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => updateFilter("category", null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !filters.category
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("allCategories")}
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilter("category", cat)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filters.category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">{t("noPosts")}</p>
          <p className="mt-1 text-sm">{t("noPostsDesc")}</p>
          <Link href="/service-hub/create" className="mt-4 inline-block">
            <Button size="sm">{t("createPost")}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
            return (
              <Link key={post.id} href={`/service-hub/${post.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{t(`categories.${post.category}`)}</Badge>
                          {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="mb-1 text-base font-semibold leading-tight">{post.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {post.content.slice(0, 180)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {post.author.name} · {new Date(post.createdAt).toLocaleDateString(locale)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
