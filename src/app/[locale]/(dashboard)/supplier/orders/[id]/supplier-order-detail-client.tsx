"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Truck, CheckCircle2, Upload } from "lucide-react";
import { uploadDeliveryProof } from "@/server/actions/order.actions";

type OrderDetail = {
  id: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  createdAt: Date;
  boq: {
    title: string;
    items: {
      id: string;
      itemNumber: number;
      description: string;
      quantity: number | string;
      unit: { symbol: string } | null;
    }[];
  };
  bid: {
    totalPrice: number | string;
    isAnonymous: boolean;
    supplier: { companyName: string; userId: string };
    lineItems: {
      id: string;
      unitPrice: number | string;
      totalPrice: number | string;
      brand: string | null;
      boqItem: { itemNumber: number; description: string };
    }[];
  };
  escrow: { status: string; amount: number | string } | null;
  deliveries: {
    id: string;
    proofImages: string;
    notes: string | null;
    createdAt: Date;
  }[];
  managerApproval: { status: string; notes: string | null } | null;
};

export function SupplierOrderDetailClient({ order }: { order: OrderDetail }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const canUploadProof = order.status === "PAID" && order.escrow?.status === "FUNDS_HELD";
  const alreadyUploaded = order.deliveries.length > 0;

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await uploadDeliveryProof(order.id, formData);
    setLoading(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/supplier/orders" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{order.boq.title}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold">
            {Number(order.totalAmount).toLocaleString()} {order.currency}
          </p>
          <Badge variant="outline">{order.status}</Badge>
        </div>
      </div>

      {/* Escrow status */}
      {order.escrow && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("order.escrow")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.escrow.status.replace(/_/g, " ")}
                </p>
              </div>
              {order.escrow.status === "FUNDS_HELD" && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {t("order.fundsSecure")}
                </Badge>
              )}
              {order.escrow.status === "RELEASED" && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("order.fundsReleased")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload delivery proof */}
      {canUploadProof && !alreadyUploaded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("order.uploadProof")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="proofImageUrls">{t("order.proofImageUrls")}</Label>
                <Input
                  id="proofImageUrls"
                  name="proofImageUrls"
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">{t("order.proofImageUrlsHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("order.deliveryNotes")}</Label>
                <Textarea id="notes" name="notes" rows={3} placeholder="…" />
              </div>
              {serverError && (
                <p className="text-destructive text-sm">{serverError}</p>
              )}
              <Button type="submit" disabled={loading}>
                <Truck className="h-4 w-4 mr-2" />
                {loading ? t("common.saving") : t("order.submitProof")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Proof already uploaded */}
      {alreadyUploaded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("order.deliveryProof")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.deliveries.map((d) => {
              let imgs: string[] = [];
              try {
                imgs = JSON.parse(d.proofImages) as string[];
              } catch {
                /* ignore */
              }
              return (
                <div key={d.id}>
                  {d.notes && <p className="text-sm">{d.notes}</p>}
                  {imgs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {imgs.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          {t("order.proofImage")} {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>{t("order.lineItems")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("boq.item")}</TableHead>
                <TableHead className="text-right">{t("boq.unitPrice")}</TableHead>
                <TableHead className="text-right">{t("boq.totalPrice")}</TableHead>
                <TableHead>{t("boq.brand")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.bid.lineItems.map((li) => (
                <TableRow key={li.id}>
                  <TableCell>
                    <span className="text-muted-foreground">#{li.boqItem.itemNumber}</span>{" "}
                    {li.boqItem.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(li.unitPrice).toLocaleString()} {order.currency}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {Number(li.totalPrice).toLocaleString()} {order.currency}
                  </TableCell>
                  <TableCell>{li.brand ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
