"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { type SubmitBidInput } from "@/lib/validations/boq";
import { submitBid } from "@/server/actions/boq.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, MapPin, ShieldCheck } from "lucide-react";
import { useState, useMemo } from "react";

type BOQItem = {
  id: string;
  itemNumber: number;
  description: string;
  quantity: number | string;
  estimatedPrice: number | string | null;
  unit: { symbol: string } | null;
  category: { name: string } | null;
};

type ExistingBidLineItem = {
  boqItemId: string;
  unitPrice: number | string;
  brand: string | null;
  notes: string | null;
};

type ExistingBid = {
  id: string;
  deliveryDays: number | null;
  deliveryCost: number | string | null;
  notes: string | null;
  lineItems: ExistingBidLineItem[];
  status: string;
};

type BOQ = {
  id: string;
  title: string;
  status: string;
  deliveryCity: string | null;
  biddingDeadline: Date | null;
  items: BOQItem[];
};

export function SupplierBidFormClient({
  boq,
  existingBid,
}: {
  boq: BOQ;
  existingBid: ExistingBid | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isReadOnly = existingBid !== null && existingBid.status !== "SUBMITTED";
  const cannotBid = boq.status !== "PUBLISHED";

  // Build default values from existing bid or empty
  const defaultLineItems = boq.items.map((item) => {
    const existing = existingBid?.lineItems.find((li) => li.boqItemId === item.id);
    return {
      boqItemId: item.id,
      unitPrice: existing ? Number(existing.unitPrice) : (undefined as unknown as number),
      brand: existing?.brand ?? "",
      notes: existing?.notes ?? "",
    };
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SubmitBidInput>({
    defaultValues: {
      deliveryDays: existingBid?.deliveryDays ?? undefined,
      deliveryCost: existingBid?.deliveryCost ? Number(existingBid.deliveryCost) : undefined,
      notes: existingBid?.notes ?? "",
      lineItems: defaultLineItems,
    },
  });

  const watchedLineItems = watch("lineItems");
  const watchedDeliveryCost = watch("deliveryCost");

  const grandTotal = useMemo(() => {
    let total = 0;
    (watchedLineItems ?? []).forEach((li, idx) => {
      const qty = Number(boq.items[idx]?.quantity ?? 0);
      const price = Number(li?.unitPrice ?? 0);
      total += qty * price;
    });
    total += Number(watchedDeliveryCost ?? 0);
    return total;
  }, [watchedLineItems, watchedDeliveryCost, boq.items]);

  async function onSubmit(data: SubmitBidInput) {
    setSaving(true);
    setServerError(null);
    const result = await submitBid(boq.id, data);
    setSaving(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push("/supplier/bids" as any);
  }

  function fmt(value: number) {
    return value.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/supplier/bids" as any)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{boq.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {boq.deliveryCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {t(`cities.${boq.deliveryCity}`)}
              </span>
            )}
            {boq.biddingDeadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {t("boq.deadline")}: {new Date(boq.biddingDeadline).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Anonymity notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t("boq.supplierBidTitle")}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              {t("boq.supplierBidDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {cannotBid ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>This BOQ is no longer accepting bids.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/supplier/bids" as any)}
            >
              {t("boq.backToBids")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Line items pricing table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("boq.items")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>{t("boq.itemDescription")}</TableHead>
                      <TableHead className="text-right w-24">{t("boq.quantity")}</TableHead>
                      <TableHead className="w-20">{t("boq.unit")}</TableHead>
                      <TableHead className="w-36">{t("boq.unitPrice")} *</TableHead>
                      <TableHead className="text-right w-36">{t("boq.lineTotal")}</TableHead>
                      <TableHead className="w-32">{t("boq.brand")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boq.items.map((item, index) => {
                      const qty = Number(item.quantity);
                      const unitPrice = Number(watchedLineItems?.[index]?.unitPrice ?? 0);
                      const lineTotal = qty * unitPrice;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{item.description}</div>
                            {item.estimatedPrice && (
                              <div className="text-xs text-muted-foreground">
                                Est: {fmt(Number(item.estimatedPrice))} AED
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{qty.toLocaleString()}</TableCell>
                          <TableCell>{item.unit?.symbol ?? "—"}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              className="h-8 w-32"
                              disabled={isReadOnly}
                              {...register(`lineItems.${index}.unitPrice`)}
                            />
                            <input type="hidden" {...register(`lineItems.${index}.boqItemId`)} value={item.id} />
                            {errors.lineItems?.[index]?.unitPrice && (
                              <p className="text-destructive text-xs mt-0.5">
                                {errors.lineItems[index].unitPrice?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {unitPrice > 0 ? `${fmt(lineTotal)} AED` : "—"}
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 w-28"
                              placeholder="Optional"
                              disabled={isReadOnly}
                              {...register(`lineItems.${index}.brand`)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("boq.deliveryInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryDays">{t("boq.deliveryDays")}</Label>
                  <Input
                    id="deliveryDays"
                    type="number"
                    min="1"
                    step="1"
                    disabled={isReadOnly}
                    {...register("deliveryDays")}
                  />
                  {errors.deliveryDays && (
                    <p className="text-destructive text-xs">{errors.deliveryDays.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryCost">{t("boq.deliveryCost")}</Label>
                  <Input
                    id="deliveryCost"
                    type="number"
                    min="0"
                    step="any"
                    disabled={isReadOnly}
                    {...register("deliveryCost")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("boq.bidNotes")}</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  disabled={isReadOnly}
                  {...register("notes")}
                />
              </div>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t("boq.grandTotal")}</p>
                  <p className="text-2xl font-bold">{fmt(grandTotal)} AED</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}

          {!isReadOnly && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving
                  ? t("common.saving")
                  : existingBid
                  ? t("boq.updateBid")
                  : t("boq.submitBid")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/supplier/bids" as any)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          )}

          {isReadOnly && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {existingBid?.status}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Your bid is under review and cannot be edited.
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
