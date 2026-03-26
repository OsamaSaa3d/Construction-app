"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Zap, Store } from "lucide-react";
import { deleteInventoryItem } from "@/server/actions/inventory.actions";
import { publishToMarketplace, unpublishFromMarketplace } from "@/server/actions/marketplace.actions";

type InventoryItemRow = {
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
  category: { id: string; name: string; nameAr: string | null; [key: string]: unknown };
  unit: { id: string; name: string; nameAr: string; symbol: string; [key: string]: unknown };
  marketplaceListing?: { id: string } | null;
  [key: string]: unknown;
};

type InventoryTableProps = {
  items: InventoryItemRow[];
  onEdit: (item: InventoryItemRow) => void;
  onRefresh: () => void;
};

export function InventoryTable({ items, onEdit, onRefresh }: InventoryTableProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm(t("inventory.confirmDelete"))) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteInventoryItem(id);
      setDeletingId(null);
      onRefresh();
    });
  }

  function handlePublish(id: string, isPublished: boolean) {
    startTransition(async () => {
      if (isPublished) {
        await unpublishFromMarketplace(id);
      } else {
        await publishToMarketplace(id);
      }
      onRefresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("inventory.empty")}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.name")}</TableHead>
            <TableHead>{t("inventory.category")}</TableHead>
            <TableHead className="text-end">{t("inventory.price")}</TableHead>
            <TableHead className="text-end">{t("inventory.quantity")}</TableHead>
            <TableHead>{t("inventory.unit")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {item.brand && (
                  <div className="text-xs text-muted-foreground">{item.brand}</div>
                )}
              </TableCell>
              <TableCell>{item.category.name}</TableCell>
              <TableCell className="text-end font-mono">
                {Number(item.pricePerUnit).toFixed(2)} AED
              </TableCell>
              <TableCell className="text-end font-mono">
                {Number(item.quantityInStock)}
              </TableCell>
              <TableCell>{item.unit.symbol}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? t("inventory.active") : t("inventory.inactive")}
                  </Badge>
                  {item.marketplaceListing && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Store className="h-3 w-3 me-1" />
                      {t("inventory.published")}
                    </Badge>
                  )}
                  {item.canUrgentDeliver && (
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4 me-2" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlePublish(item.id, !!item.marketplaceListing)}
                      disabled={isPending}
                    >
                      <Store className="h-4 w-4 me-2" />
                      {item.marketplaceListing
                        ? t("inventory.unpublish")
                        : t("inventory.publish")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending && deletingId === item.id}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
