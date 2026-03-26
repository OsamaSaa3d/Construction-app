"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  AlertTriangle,
  Star,
} from "lucide-react";
import { simulatePayment, contractorConfirmReceipt } from "@/server/actions/order.actions";
import { createSupplierRating } from "@/server/actions/rating.actions";

type OrderDetail = {
  id: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  createdAt: Date;
  contractor: { userId: string; managerUserId: string | null };
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
    deliveryDays: number | null;
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
  escrow: { id: string; status: string; amount: number | string; releasedAt: Date | null } | null;
  deliveries: {
    id: string;
    proofImages: string;
    notes: string | null;
    createdAt: Date;
  }[];
  managerApproval: {
    id: string;
    status: string;
    notes: string | null;
  } | null;
};

const ESCROW_STEPS = [
  "PENDING_PAYMENT",
  "FUNDS_HELD",
  "PROOF_UPLOADED",
  "PENDING_CONFIRMATION",
  "PENDING_MANAGER_APPROVAL",
  "RELEASED",
];

export function ContractorOrderDetailClient({
  order,
  supplierUserId,
  alreadyRated,
}: {
  order: OrderDetail;
  supplierUserId: string | null;
  alreadyRated: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Rating state
  const [ratingScores, setRatingScores] = useState({
    trustworthiness: 0,
    deliveryReliability: 0,
    timeliness: 0,
    materialQuality: 0,
  });
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(alreadyRated);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const escrowStatus = order.escrow?.status ?? "PENDING_PAYMENT";
  const currentStep = ESCROW_STEPS.indexOf(escrowStatus);

  async function handleSubmitRating() {
    if (!supplierUserId) return;
    const scores = Object.values(ratingScores);
    if (scores.some((s) => s === 0)) {
      setRatingError("Please rate all categories.");
      return;
    }
    setRatingError(null);
    setLoading("rate");
    const result = await createSupplierRating(supplierUserId, order.id, {
      ...ratingScores,
      comment: ratingComment || undefined,
    });
    setLoading(null);
    if (result.error) {
      setRatingError(result.error);
    } else {
      setRatingSubmitted(true);
    }
  }

  async function handlePayment() {    if (!confirm(t("order.confirmPayment"))) return;
    setLoading("pay");
    await simulatePayment(order.id);
    setLoading(null);
    router.refresh();
  }

  async function handleConfirmReceipt() {
    if (!confirm(t("order.confirmReceipt"))) return;
    setLoading("confirm");
    const result = await contractorConfirmReceipt(order.id);
    setLoading(null);
    if (result.needsManagerApproval) {
      alert(t("order.managerApprovalNeeded"));
    }
    router.refresh();
  }

  const proofImages: string[] = order.deliveries.flatMap((d) => {
    try {
      return JSON.parse(d.proofImages) as string[];
    } catch {
      return [];
    }
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contractor/orders" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{order.boq.title}</h1>
          <p className="text-sm text-muted-foreground">
            {order.bid.isAnonymous ? t("boq.anonymousSupplier") : order.bid.supplier.companyName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold">
            {Number(order.totalAmount).toLocaleString()} {order.currency}
          </p>
          <Badge variant="outline">{order.status}</Badge>
        </div>
      </div>

      {/* Escrow timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            {t("order.escrowExplainer")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {ESCROW_STEPS.map((step, idx) => {
              const isActive = escrowStatus === step;
              const isDone = currentStep > idx;
              const isDisrupted =
                escrowStatus === "DISPUTED" || escrowStatus === "REFUNDED";
              return (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isDisrupted && isActive
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : isDone
                        ? "bg-muted border-border text-muted-foreground line-through"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {isDone && !isDisrupted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isActive ? (
                      <Clock className="h-3 w-3 animate-pulse" />
                    ) : null}
                    {step.replace(/_/g, " ")}
                  </div>
                  {idx < ESCROW_STEPS.length - 1 && (
                    <div className={`h-px w-4 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA based on escrow status */}
          <div className="mt-4 flex gap-3">
            {escrowStatus === "PENDING_PAYMENT" && (
              <Button onClick={handlePayment} disabled={loading === "pay"}>
                <CreditCard className="h-4 w-4 mr-2" />
                {t("order.simulatePayment")}
              </Button>
            )}
            {(escrowStatus === "PROOF_UPLOADED" || escrowStatus === "PENDING_CONFIRMATION") && (
              <Button onClick={handleConfirmReceipt} disabled={loading === "confirm"}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {order.contractor.managerUserId
                  ? t("order.confirmReceiptWithManager")
                  : t("order.confirmReceipt")}
              </Button>
            )}
            {escrowStatus === "PENDING_MANAGER_APPROVAL" && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <Clock className="h-4 w-4" />
                {t("order.managerApprovalNeeded")}
              </div>
            )}
            {escrowStatus === "RELEASED" && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {t("order.fundsReleased")}
              </div>
            )}
            {escrowStatus === "DISPUTED" && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                {t("order.disputed")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manager approval result */}
      {order.managerApproval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("order.managerApproval")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  order.managerApproval.status === "APPROVED"
                    ? "default"
                    : order.managerApproval.status === "REJECTED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {order.managerApproval.status}
              </Badge>
              {order.managerApproval.notes && (
                <p className="text-sm text-muted-foreground">{order.managerApproval.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid line items */}
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

      {/* Delivery proofs */}
      {order.deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("order.deliveryProof")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.deliveries.map((d) => (
              <div key={d.id}>
                {d.notes && <p className="text-sm text-muted-foreground">{d.notes}</p>}
                {(() => {
                  let imgs: string[] = [];
                  try {
                    imgs = JSON.parse(d.proofImages) as string[];
                  } catch {
                    /* ignore */
                  }
                  return imgs.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                  ) : null;
                })()}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rate supplier — shown when escrow released and supplier identity is known */}
      {escrowStatus === "RELEASED" && supplierUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              {ratingSubmitted ? t("ratings.alreadyRated") : t("ratings.rateTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratingSubmitted ? (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t("ratings.alreadyRated")}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("ratings.rateDesc")}</p>
                {(
                  [
                    ["trustworthiness", t("ratings.trustworthiness")],
                    ["deliveryReliability", t("ratings.deliveryReliability")],
                    ["timeliness", t("ratings.timeliness")],
                    ["materialQuality", t("ratings.materialQuality")],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <StarPicker
                      value={ratingScores[key]}
                      onChange={(v) =>
                        setRatingScores((prev) => ({ ...prev, [key]: v }))
                      }
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-sm">{t("ratings.comment")}</Label>
                  <Textarea
                    className="mt-1"
                    placeholder={t("ratings.commentPlaceholder")}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={3}
                  />
                </div>
                {ratingError && (
                  <p className="text-sm text-destructive">{ratingError}</p>
                )}
                <Button
                  onClick={handleSubmitRating}
                  disabled={loading === "rate"}
                >
                  {loading === "rate" ? t("ratings.submitting") : t("ratings.submitRating")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
