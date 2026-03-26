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
import { createServiceRequest } from "@/server/actions/service-bidding.actions";
import type { CreateServiceRequestInput } from "@/lib/validations/service-bidding";

const SERVICE_CATEGORIES = [
  "COMPANY", "INTERIOR_DESIGN", "CONTRACTOR", "ELECTRICAL",
  "PLUMBING", "HVAC", "LANDSCAPING", "PAINTING", "FLOORING", "OTHER",
] as const;

const UAE_CITIES = [
  "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
  "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
] as const;

export function CreateRequestClient() {
  const t = useTranslations("serviceBidding");
  const tCities = useTranslations("cities");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");

  const { register, handleSubmit } = useForm<{
    title: string;
    description: string;
    budget: string;
    deadline: string;
    imageUrlsRaw: string;
  }>();

  async function onSubmit(values: {
    title: string;
    description: string;
    budget: string;
    deadline: string;
    imageUrlsRaw: string;
  }) {
    if (!category) { setError(t("selectCategory")); return; }
    if (!city) { setError(t("selectCity")); return; }
    setError(null);
    setSaving(true);

    const imageUrls = values.imageUrlsRaw
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const data: CreateServiceRequestInput = {
      title: values.title,
      description: values.description,
      category: category as any,
      city: city as any,
      budget: values.budget ? Number(values.budget) : undefined,
      deadline: values.deadline || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    const result = await createServiceRequest(data);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "An error occurred"); return; }
    router.push(`/service-bidding/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/service-bidding"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">{t("createRequest")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("requestDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("requestTitle")} *</Label>
              <Input
                {...register("title", { required: true })}
                placeholder={t("requestTitlePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label>{t("city")} *</Label>
                <Select onValueChange={(v: string | null) => { if (v) setCity(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {tCities(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("requestDescription")} *</Label>
              <Textarea
                {...register("description", { required: true })}
                placeholder={t("requestDescriptionPlaceholder")}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("requestBudget")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("budget")}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("requestDeadline")}</Label>
                <Input type="date" {...register("deadline")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("requestImages")}</Label>
              <Textarea
                {...register("imageUrlsRaw")}
                placeholder={t("requestImagesPlaceholder")}
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
          <Link href="/service-bidding">
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? t("submitting") : t("submitRequest")}
          </Button>
        </div>
      </form>
    </div>
  );
}
