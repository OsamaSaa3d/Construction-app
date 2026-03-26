"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { type CreateUrgentRequestInput } from "@/lib/validations/urgent";
import { createUrgentRequest } from "@/server/actions/urgent.actions";
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
import { Plus, Trash2, ArrowLeft, MapPin } from "lucide-react";
import { useState } from "react";

const UAE_CITIES = [
  "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
  "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
] as const;

// Approximate city centres for quick fill
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  ABU_DHABI: { lat: 24.4539, lng: 54.3773 },
  DUBAI: { lat: 25.2048, lng: 55.2708 },
  SHARJAH: { lat: 25.3462, lng: 55.4209 },
  AJMAN: { lat: 25.4052, lng: 55.5136 },
  UMM_AL_QUWAIN: { lat: 25.5647, lng: 55.5533 },
  RAS_AL_KHAIMAH: { lat: 25.8007, lng: 55.9762 },
  FUJAIRAH: { lat: 25.1288, lng: 56.3265 },
};

export function UrgentCreateClient() {
  const t = useTranslations("urgent");
  const tc = useTranslations("common");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateUrgentRequestInput>({
    defaultValues: {
      maxRadiusKm: 50,
      items: [{ description: "", quantity: 1, unit: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function handleCityChange(city: string | null) {
    if (!city) return;
    setValue("deliveryCity", city as any);
    const coords = CITY_COORDS[city];
    if (coords) {
      setValue("deliveryLat", coords.lat);
      setValue("deliveryLng", coords.lng);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setValue("deliveryLat", pos.coords.latitude);
      setValue("deliveryLng", pos.coords.longitude);
    });
  }

  async function onSubmit(data: CreateUrgentRequestInput) {
    setSaving(true);
    setServerError(null);
    const result = await createUrgentRequest(data);
    setSaving(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push("/contractor/urgent" as any);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contractor/urgent" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("newRequest")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("titleLabel")}</Label>
              <Input {...register("title")} placeholder={t("titlePlaceholder")} />
              {errors.title && (
                <p className="text-destructive text-xs">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Textarea {...register("description")} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("maxBudget")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("maxBudget", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">{t("maxBudgetHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("neededBy")}</Label>
                <Input type="datetime-local" {...register("neededBy")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("deliveryLocation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("deliveryCity")}</Label>
              <Select onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {UAE_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deliveryCity && (
                <p className="text-destructive text-xs">{errors.deliveryCity.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("deliveryLat")}</Label>
                <Input
                  type="number"
                  step="0.000001"
                  {...register("deliveryLat", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("deliveryLng")}</Label>
                <Input
                  type="number"
                  step="0.000001"
                  {...register("deliveryLng", { valueAsNumber: true })}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {t("useMyLocation")}
            </Button>
            <div className="space-y-1.5">
              <Label>{t("maxRadiusKm")}</Label>
              <Input
                type="number"
                min="1"
                max="200"
                {...register("maxRadiusKm", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("items")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unit: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("addItem")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("item")} #{index + 1}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>{t("itemDescription")}</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder={t("itemDescriptionPlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>{t("quantity")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("unit")}</Label>
                      <Input
                        {...register(`items.${index}.unit`)}
                        placeholder={t("unitPlaceholder")}
                      />
                    </div>
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
            onClick={() => router.push("/contractor/urgent" as any)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? tc("saving") : t("createRequest")}
          </Button>
        </div>
      </form>
    </div>
  );
}
