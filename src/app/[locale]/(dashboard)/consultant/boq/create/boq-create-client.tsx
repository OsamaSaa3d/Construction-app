"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { type CreateBOQInput } from "@/lib/validations/boq";
import { createBOQ } from "@/server/actions/boq.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";

type Category = { id: string; name: string; nameAr: string; parentId: string | null };
type Unit = { id: string; name: string; nameAr: string; symbol: string };

const UAE_CITIES = [
  "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
  "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
] as const;

export function BOQCreateClient({
  categories,
  units,
}: {
  categories: Category[];
  units: Unit[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateBOQInput>({
    defaultValues: {
      items: [
        {
          itemNumber: 1,
          description: "",
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(data: CreateBOQInput) {
    setSaving(true);
    setServerError(null);
    const result = await createBOQ(data);
    setSaving(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push("/consultant/boq" as any);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/consultant/boq" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("boq.newBoq")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common.create")} {t("boq.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("boq.boqTitle")} *</Label>
                <Input id="title" {...register("title")} />
                {errors.title && (
                  <p className="text-destructive text-xs">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="titleAr">{t("boq.boqTitleAr")}</Label>
                <Input id="titleAr" {...register("titleAr")} dir="rtl" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="description">{t("boq.description")}</Label>
                <Textarea id="description" rows={3} {...register("description")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descriptionAr">{t("boq.descriptionAr")}</Label>
                <Textarea id="descriptionAr" rows={3} {...register("descriptionAr")} dir="rtl" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryCity">{t("boq.deliveryCity")}</Label>
                <Select onValueChange={(v) => setValue("deliveryCity", v as string)}>
                  <SelectTrigger id="deliveryCity">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {t(`cities.${city}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biddingDeadline">{t("boq.biddingDeadline")}</Label>
                <Input
                  id="biddingDeadline"
                  type="datetime-local"
                  {...register("biddingDeadline")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("boq.items")}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({
                    itemNumber: fields.length + 1,
                    description: "",
                    quantity: 1,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("boq.addItem")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.items?.root && (
              <p className="text-destructive text-sm">{errors.items.root.message}</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("boq.itemNumber")} {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive h-7 w-7"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <input
                  type="hidden"
                  {...register(`items.${index}.itemNumber`)}
                  value={index + 1}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("boq.itemDescription")} *</Label>
                    <Input {...register(`items.${index}.description`)} />
                    {errors.items?.[index]?.description && (
                      <p className="text-destructive text-xs">
                        {errors.items[index].description?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.itemDescriptionAr")}</Label>
                    <Input {...register(`items.${index}.descriptionAr`)} dir="rtl" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>{t("boq.quantity")} *</Label>
                    <Input
                      type="number"
                      min="0.001"
                      step="any"
                      {...register(`items.${index}.quantity`)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-destructive text-xs">
                        {errors.items[index].quantity?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.estimatedPrice")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Optional"
                      {...register(`items.${index}.estimatedPrice`)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.category")}</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.categoryId`, v as string)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.unit")}</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.unitId`, v as string)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("boq.specification")}</Label>
                  <Textarea rows={2} {...register(`items.${index}.specification`)} />
                </div>

                {index < fields.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("common.create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/consultant/boq" as any)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
