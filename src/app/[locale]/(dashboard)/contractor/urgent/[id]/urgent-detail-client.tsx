"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  cancelUrgentRequest,
  acceptUrgentMatch,
  contractorConfirmUrgentDelivery,
} from "@/server/actions/urgent.actions";

type SupplierMatch = {
  id: string;
  supplierId: string;
  distanceKm: number;
  canFulfill: boolean;
  priceQuote: number | string | null;
  respondedAt: Date | null;
  accepted: boolean;
  supplier: {
    id: string;
    companyName: string;
    city: string;
    isVerified: boolean;
    userId: string;
  };
};

type UrgentRequestDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deliveryCity: string;
  deliveryLat: number;
  deliveryLng: number;
  maxRadiusKm: number;
  maxBudget: number | string | null;
  neededBy: Date | null;
  createdAt: Date;
  contractor: { userId: string };
  items: {
    id: string;
    description: string;
    quantity: number | string;
    unit: string;
  }[];
  matches: SupplierMatch[];
};

const STATUS_COLORS: Record<string, string> = {
  SEARCHING: "secondary",
  MATCHED: "default",
  ACCEPTED: "default",
  IN_DELIVERY: "default",
  DELIVERED: "outline",
  CONFIRMED: "outline",
  CANCELLED: "destructive",
};

export function ContractorUrgentDetailClient({
  request,
}: {
  request: UrgentRequestDetail;
}) {
  const t = useTranslations("urgent");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm(t("confirmCancel"))) return;
    setLoading("cancel");
    await cancelUrgentRequest(request.id);
    setLoading(null);
    router.refresh();
  }

  async function handleAccept(matchId: string) {
    if (!confirm(t("confirmAccept"))) return;
    setLoading(matchId);
    const result = await acceptUrgentMatch(matchId);
    setLoading(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleConfirmDelivery() {
    if (!confirm(t("confirmReceiptDesc"))) return;
    setLoading("deliver");
    await contractorConfirmUrgentDelivery(request.id);
    setLoading(null);
    router.refresh();
  }

  const respondedMatches = request.matches.filter((m) => m.respondedAt !== null);
  const fulfillableMatches = respondedMatches.filter((m) => m.canFulfill);
  const canAccept = ["MATCHED", "SEARCHING"].includes(request.status);
  const canConfirm = request.status === "DELIVERED";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/contractor/urgent" as any)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold truncate">{request.title}</h1>
            <Badge
              variant={(STATUS_COLORS[request.status] as any) ?? "secondary"}
              className="mt-1 shrink-0"
            >
              {request.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {request.deliveryCity.replace(/_/g, " ")} · {request.maxRadiusKm}km radius
            </span>
            {request.neededBy && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(request.neededBy).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {canConfirm && (
            <Button
              onClick={handleConfirmDelivery}
              disabled={loading === "deliver"}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t("confirmReceipt")}
            </Button>
          )}
          {canAccept && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading === "cancel"}
            >
              {t("cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* Description + budget */}
      {(request.description || request.maxBudget) && (
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-8">
            {request.description && (
              <p className="text-sm text-muted-foreground flex-1">{request.description}</p>
            )}
            {request.maxBudget && (
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground">{t("budget")}</p>
                <p className="font-semibold">
                  {Number(request.maxBudget).toLocaleString()} AED
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {t("items")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("itemDescription")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead>{t("unit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Matches */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("matches")}{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({respondedMatches.length}/{request.matches.length} responded)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {request.matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("noMatches")}</p>
              <p className="text-xs mt-1">{t("noMatchesDesc")}</p>
            </div>
          ) : (
            request.matches.map((match) => (
              <div
                key={match.id}
                className={`border rounded-lg p-4 space-y-2 ${
                  match.accepted ? "border-green-300 bg-green-50/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{match.supplier.companyName}</p>
                      {match.supplier.isVerified && (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      )}
                      {match.accepted && (
                        <Badge variant="default" className="text-xs">
                          Accepted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("distanceKm", { km: match.distanceKm.toFixed(1) })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {match.respondedAt === null ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t("responding")}
                      </span>
                    ) : match.canFulfill ? (
                      <div>
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("canFulfill")}
                        </span>
                        {match.priceQuote && (
                          <p className="font-bold text-lg mt-0.5">
                            {Number(match.priceQuote).toLocaleString()} AED
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        {t("cannotFulfill")}
                      </span>
                    )}
                  </div>
                </div>

                {canAccept && match.canFulfill && match.respondedAt && !match.accepted && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(match.id)}
                      disabled={!!loading}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t("acceptMatch")}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
