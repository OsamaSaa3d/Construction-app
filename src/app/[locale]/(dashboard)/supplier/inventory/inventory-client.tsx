"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { getInventoryItems } from "@/server/actions/inventory.actions";

type Category = { id: string; name: string; nameAr: string | null; parentId: string | null };
type Unit = { id: string; name: string; nameAr: string; symbol: string };
type InventoryItemResult = Awaited<ReturnType<typeof getInventoryItems>>;
type InventoryItem = InventoryItemResult extends { data?: infer T }
  ? NonNullable<T> extends Array<infer U> ? U : never
  : never;

type Props = {
  categories: Category[];
  units: Unit[];
};

export function InventoryPageClient({ categories, units }: Props) {
  const t = useTranslations();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadItems = useCallback(() => {
    startTransition(async () => {
      const result = await getInventoryItems();
      if (result.data) {
        setItems(result.data);
      }
    });
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEdit(item: any) {
    setEditItem(item as InventoryItem);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditItem(null);
    setFormOpen(true);
  }

  function handleSuccess() {
    loadItems();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("supplier.inventory")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("inventory.subtitle", { count: items.length })}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 me-2" />
          {t("inventory.addItem")}
        </Button>
      </div>

      <InventoryTable items={items} onEdit={handleEdit} onRefresh={loadItems} />

      <InventoryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
        categories={categories}
        units={units}
        editItem={editItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
