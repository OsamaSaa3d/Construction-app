"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  respondToUrgentMatch,
  supplierMarkUrgentDelivered,
} from "@/server/actions/urgent.actions";

type SupplierMatchInList = {
  id: string;
  supplierId: string;
  distanceKm: number;
  canFulfill: boolean;
  priceQuote: number | string | null;
  respondedAt: Date | null;
  accepted: boolean;
  supplier: { id: string; companyName: string; city: string; isVerified: boolean; userId: string };
};

type UrgentRequestDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deliveryCity: string;
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
  matches: SupplierMatchInList[];
};

export function SupplierUrgentDetailClient({
  request,
}: {
  request: UrgentRequestDetail;
}) {
  const t = useTranslations("urgent");
  const tc = useTranslations("common");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [canFulfill, setCanFulfill] = useState<boolean | null>(null);
  const [priceQuote, setPriceQuote] = useState("");

  // Find this supplier's own match — we rely on the fact that non-own matches are only
  // visible to the contractor; the action returns only the caller's match for suppliers.
  // Since the detail page is accessible to supplier because they ARE in matches, we find
  // the match that the server returned.
  const myMatch = request.matches[0]; // server already filtered to only this supplier's match

  const hasResponded = myMatch?.respondedAt !== null;
  const isAccepted = myMatch?.accepted ?? false;
  const canDeliver = isAccepted && request.status === "IN_DELIVERY";

  async function handleRespond(fulfill: boolean) {
    if (!myMatch) return;
    setLoading(true);
    setServerError(null);
    const result = await respondToUrgentMatch(myMatch.id, {
      canFulfill: fulfill,
      priceQuote: fulfill && priceQuote ? parseFloat(priceQuote) : undefined,
    });
    setLoading(false);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleMarkDelivered() {
    if (!confirm(t("confirmDelivered"))) return;
    setLoading(true);
    await supplierMarkUrgentDelivered(request.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/supplier/urgent" as any)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{request.title}</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {request.deliveryCity.replace(/_/g, " ")}
            </span>
            {request.neededBy && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(request.neededBy).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Badge variant="outline">{request.status.replace(/_/g, " ")}</Badge>
      </div>

      {/* Budget */}
      {request.maxBudget && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t("budget")}</p>
            <p className="font-bold text-lg">
              {Number(request.maxBudget).toLocaleString()} AED
            </p>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t("items")}</CardTitle>
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

      {/* Response panel */}
      {myMatch && !hasResponded && ["SEARCHING", "MATCHED"].includes(request.status) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("respondToMatch")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canFulfill === null ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => setCanFulfill(true)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("canFulfill")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRespond(false)}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("cannotFulfill")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="priceQuote">{t("priceQuote")}</Label>
                  <Input
                    id="priceQuote"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceQuote}
                    onChange={(e) => setPriceQuote(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">{t("priceQuoteHint")}</p>
                </div>
                {serverError && (
                  <p className="text-destructive text-sm">{serverError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRespond(true)}
                    disabled={loading}
                  >
                    {loading ? tc("saving") : tc("submit")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCanFulfill(null)}
                  >
                    {tc("back")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Already responded */}
      {myMatch && hasResponded && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Your Response</p>
                {myMatch.canFulfill ? (
                  <p className="text-green-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("canFulfill")}
                    {myMatch.priceQuote && (
                      <span className="font-bold ml-2">
                        {Number(myMatch.priceQuote).toLocaleString()} AED
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <XCircle className="h-4 w-4" />
                    {t("cannotFulfill")}
                  </p>
                )}
              </div>
              {isAccepted && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {t("accepted")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark delivered */}
      {canDeliver && (
        <Card>
          <CardContent className="pt-4">
            <Button onClick={handleMarkDelivered} disabled={loading} className="w-full">
              <Truck className="h-4 w-4 mr-2" />
              {t("markDelivered")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
