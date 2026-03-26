"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { type CreateContractorBOQInput } from "@/lib/validations/order";
import { createContractorBOQ } from "@/server/actions/contractor-boq.actions";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";

type Category = { id: string; name: string; nameAr: string; parentId: string | null };
type Unit = { id: string; name: string; nameAr: string; symbol: string };

const UAE_CITIES = [
  "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
  "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
] as const;

export function ContractorBOQCreateClient({
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
  } = useForm<CreateContractorBOQInput>({
    defaultValues: {
      purchaseMode: "ALL_AT_ONCE",
      items: [{ itemNumber: 1, description: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(data: CreateContractorBOQInput) {
    setSaving(true);
    setServerError(null);
    const result = await createContractorBOQ(data);
    setSaving(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push("/contractor/boq" as any);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contractor/boq" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("boq.newBoq")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("boq.generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("boq.titleLabel")}</Label>
                <Input {...register("title")} placeholder={t("boq.titlePlaceholder")} />
                {errors.title && (
                  <p className="text-destructive text-xs">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t("boq.titleArLabel")}</Label>
                <Input {...register("titleAr")} dir="rtl" placeholder="عنوان المناقصة" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("boq.deliveryCity")}</Label>
                <Select onValueChange={(v) => setValue("deliveryCity", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("boq.selectCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("boq.biddingDeadline")}</Label>
                <Input type="datetime-local" {...register("biddingDeadline")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("boq.description")}</Label>
              <Textarea {...register("description")} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Purchase settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("boq.purchaseBOQ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{t("boq.purchaseMode")}</Label>
                <Select
                  defaultValue="ALL_AT_ONCE"
                  onValueChange={(v) => setValue("purchaseMode", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_AT_ONCE">{t("boq.allAtOnce")}</SelectItem>
                    <SelectItem value="BIT_BY_BIT">{t("boq.bitByBit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("boq.startingPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("startingPrice", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">{t("boq.startingPriceHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("boq.autoAcceptPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("autoAcceptPrice", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">{t("boq.autoAcceptPriceHint")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("boq.items")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("boq.item")} #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>{t("boq.itemDescription")}</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder={t("boq.itemDescriptionPlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.quantity")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.estimatedPrice")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`items.${index}.estimatedPrice`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.category")}</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.categoryId` as any, v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("boq.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("boq.unit")}</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.unitId` as any, v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("boq.selectUnit")} />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>{t("boq.specification")}</Label>
                    <Input
                      {...register(`items.${index}.specification`)}
                      placeholder={t("boq.specificationPlaceholder")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {serverError && (
          <p className="text-destructive text-sm text-center">{serverError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/contractor/boq" as any)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("boq.createBoq")}
          </Button>
        </div>
      </form>
    </div>
  );
}
