"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { inventoryItemSchema, type InventoryItemInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createInventoryItem, updateInventoryItem } from "@/server/actions/inventory.actions";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

type Category = { id: string; name: string; nameAr: string | null; parentId: string | null };
type Unit = { id: string; name: string; nameAr: string; symbol: string };

type InventoryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  units: Unit[];
  editItem?: {
    id: string;
    name: string;
    nameAr: string | null;
    description: string | null;
    descriptionAr: string | null;
    categoryId: string;
    unitId: string;
    sku: string | null;
    brand: string | null;
    pricePerUnit: { toString(): string };
    quantityInStock: { toString(): string };
    minOrderQty: { toString(): string } | null;
    isActive: boolean;
    canUrgentDeliver: boolean;
    [key: string]: unknown;
  } | null;
  onSuccess: () => void;
};

export function InventoryForm({
  open,
  onOpenChange,
  categories,
  units,
  editItem,
  onSuccess,
}: InventoryFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryItemInput>({
    defaultValues: editItem
      ? {
          name: editItem.name,
          nameAr: editItem.nameAr ?? "",
          description: editItem.description ?? "",
          descriptionAr: editItem.descriptionAr ?? "",
          categoryId: editItem.categoryId,
          unitId: editItem.unitId,
          sku: editItem.sku ?? "",
          brand: editItem.brand ?? "",
          pricePerUnit: Number(editItem.pricePerUnit.toString()),
          quantityInStock: Number(editItem.quantityInStock.toString()),
          minOrderQty: editItem.minOrderQty ? Number(editItem.minOrderQty.toString()) : undefined,
          isActive: editItem.isActive,
          canUrgentDeliver: editItem.canUrgentDeliver,
        }
      : {
          name: "",
          nameAr: "",
          description: "",
          descriptionAr: "",
          categoryId: "",
          unitId: "",
          sku: "",
          brand: "",
          pricePerUnit: 0,
          quantityInStock: 0,
          minOrderQty: undefined,
          isActive: true,
          canUrgentDeliver: false,
        },
  });

  const categoryId = watch("categoryId");
  const unitId = watch("unitId");
  const isActive = watch("isActive");
  const canUrgentDeliver = watch("canUrgentDeliver");

  // Group categories: parents first, then children under them
  const parentCategories = categories.filter((c) => !c.parentId);
  const childCategories = categories.filter((c) => c.parentId);

  function onSubmit(data: InventoryItemInput) {
    setError("");
    startTransition(async () => {
      const result = editItem
        ? await updateInventoryItem(editItem.id, data)
        : await createInventoryItem(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem ? t("inventory.editItem") : t("inventory.addItem")}
          </DialogTitle>
          <DialogDescription>
            {editItem ? t("inventory.editDescription") : t("inventory.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("inventory.name")} *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{t("inventory.nameAr")}</Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("inventory.category")} *</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setValue("categoryId", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("inventory.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((parent) => (
                    <div key={parent.id}>
                      <SelectItem value={parent.id} className="font-semibold">
                        {parent.name}
                      </SelectItem>
                      {childCategories
                        .filter((c) => c.parentId === parent.id)
                        .map((child) => (
                          <SelectItem key={child.id} value={child.id} className="ps-6">
                            {child.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("inventory.unit")} *</Label>
              <Select
                value={unitId}
                onValueChange={(v) => setValue("unitId", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("inventory.selectUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && (
                <p className="text-xs text-destructive">{errors.unitId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">{t("inventory.brand")}</Label>
              <Input id="brand" {...register("brand")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">{t("inventory.sku")}</Label>
              <Input id="sku" {...register("sku")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">{t("inventory.price")} (AED) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                min="0"
                {...register("pricePerUnit")}
              />
              {errors.pricePerUnit && (
                <p className="text-xs text-destructive">{errors.pricePerUnit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityInStock">{t("inventory.quantity")} *</Label>
              <Input
                id="quantityInStock"
                type="number"
                step="0.01"
                min="0"
                {...register("quantityInStock")}
              />
              {errors.quantityInStock && (
                <p className="text-xs text-destructive">{errors.quantityInStock.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrderQty">{t("inventory.minOrder")}</Label>
              <Input
                id="minOrderQty"
                type="number"
                step="0.01"
                min="0"
                {...register("minOrderQty")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("inventory.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">{t("inventory.descriptionAr")}</Label>
            <Textarea id="descriptionAr" dir="rtl" rows={2} {...register("descriptionAr")} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", !!checked)}
              />
              <Label htmlFor="isActive">{t("inventory.active")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="canUrgentDeliver"
                checked={canUrgentDeliver}
                onCheckedChange={(checked) => setValue("canUrgentDeliver", !!checked)}
              />
              <Label htmlFor="canUrgentDeliver">{t("inventory.urgentDelivery")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t("common.saving")
                : editItem
                  ? t("common.save")
                  : t("inventory.addItem")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
