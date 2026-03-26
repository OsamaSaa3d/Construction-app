"use client";

import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { createServiceHubPost } from "@/server/actions/service-hub.actions";
import type { CreatePostInput } from "@/lib/validations/service-hub";

const SERVICE_CATEGORIES = [
  "COMPANY", "INTERIOR_DESIGN", "CONTRACTOR", "ELECTRICAL",
  "PLUMBING", "HVAC", "LANDSCAPING", "PAINTING", "FLOORING", "OTHER",
] as const;

export function CreatePostClient() {
  const t = useTranslations("serviceHub");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  const { register, handleSubmit } = useForm<{
    title: string;
    content: string;
    imageUrlsRaw: string;
    tagsRaw: string;
  }>();

  async function onSubmit(values: {
    title: string;
    content: string;
    imageUrlsRaw: string;
    tagsRaw: string;
  }) {
    if (!category) { setError(t("selectCategory")); return; }
    setError(null);
    setSaving(true);

    const imageUrls = values.imageUrlsRaw
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    const tags = values.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data: CreatePostInput = {
      title: values.title,
      content: values.content,
      category: category as any,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    const result = await createServiceHubPost(data);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "An error occurred"); return; }
    router.push(`/service-hub/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/service-hub"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToHub")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">{t("createPost")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("postDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("postTitle")} *</Label>
              <Input
                {...register("title", { required: true })}
                placeholder={t("postTitlePlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("category")} *</Label>
              <Select onValueChange={(v: string | null) => { if (v) setCategory(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("postContent")} *</Label>
              <Textarea
                {...register("content", { required: true })}
                placeholder={t("postContentPlaceholder")}
                rows={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("postTags")}</Label>
              <Input
                {...register("tagsRaw")}
                placeholder={t("postTagsPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("postImageUrls")}</Label>
              <Textarea
                {...register("imageUrlsRaw")}
                placeholder={t("postImageUrlsPlaceholder")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/service-hub">
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? t("publishing") : t("submitPost")}
          </Button>
        </div>
      </form>
    </div>
  );
}
