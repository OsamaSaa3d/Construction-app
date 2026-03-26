"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Users, ShieldCheck } from "lucide-react";
import {
  closeContractorBOQBidding,
  contractorAcceptBid,
} from "@/server/actions/contractor-boq.actions";

type BOQItem = {
  id: string;
  itemNumber: number;
  description: string;
  descriptionAr: string | null;
  specification: string | null;
  quantity: number | string;
  estimatedPrice: number | string | null;
  category: { name: string } | null;
  unit: { symbol: string } | null;
};

type BidLineItem = {
  id: string;
  boqItemId: string;
  unitPrice: number | string;
  totalPrice: number | string;
  brand: string | null;
  notes: string | null;
  boqItem: { itemNumber: number; description: string };
};

type Bid = {
  id: string;
  totalPrice: number | string;
  deliveryDays: number | null;
  deliveryCost: number | string | null;
  notes: string | null;
  status: string;
  isAnonymous: boolean;
  supplierId: string;
  supplier: {
    id: string | null;
    companyName: string;
    city: string;
    isVerified: boolean;
  };
  lineItems: BidLineItem[];
};

type BOQ = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  status: string;
  type: string;
  purchaseMode: string | null;
  startingPrice: number | string | null;
  autoAcceptPrice: number | string | null;
  currency: string;
  deliveryCity: string | null;
  biddingDeadline: Date | null;
  createdAt: Date;
  isOwner: boolean;
  items: BOQItem[];
  materialBids: Bid[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  BIDDING_CLOSED: "outline",
  AWARDED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

const BID_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "default",
  ACCEPTED: "default",
  AUTO_ACCEPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
};

export function ContractorBOQDetailClient({ boq }: { boq: BOQ }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCloseBidding() {
    if (!confirm(t("boq.confirmClose"))) return;
    setLoading("close");
    await closeContractorBOQBidding(boq.id);
    setLoading(null);
    router.refresh();
  }

  async function handleAcceptBid(bidId: string) {
    if (!confirm(t("boq.confirmAccept"))) return;
    setLoading(bidId);
    const result = await contractorAcceptBid(bidId);
    setLoading(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  const activeBids = boq.materialBids.filter((b) => b.status !== "REJECTED" && b.status !== "WITHDRAWN");
  const canAccept = boq.isOwner && ["PUBLISHED", "BIDDING_CLOSED"].includes(boq.status);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contractor/boq" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold truncate">{boq.title}</h1>
            <Badge variant={(STATUS_COLORS[boq.status] as any) ?? "secondary"} className="mt-1">
              {boq.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {boq.deliveryCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {boq.deliveryCity.replace(/_/g, " ")}
              </span>
            )}
            {boq.biddingDeadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(boq.biddingDeadline).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t("boq.totalBids", { count: activeBids.length })}
            </span>
          </div>
        </div>
        {boq.isOwner && boq.status === "PUBLISHED" && (
          <Button variant="outline" onClick={handleCloseBidding} disabled={loading === "close"}>
            {t("boq.closeBidding")}
          </Button>
        )}
      </div>

      {/* Purchase settings */}
      {(boq.startingPrice || boq.autoAcceptPrice || boq.purchaseMode) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("boq.purchaseBOQ")}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8 text-sm">
            {boq.purchaseMode && (
              <div>
                <p className="text-muted-foreground">{t("boq.purchaseMode")}</p>
                <p className="font-medium">
                  {boq.purchaseMode === "ALL_AT_ONCE" ? t("boq.allAtOnce") : t("boq.bitByBit")}
                </p>
              </div>
            )}
            {boq.startingPrice && (
              <div>
                <p className="text-muted-foreground">{t("boq.startingPrice")}</p>
                <p className="font-medium">
                  {Number(boq.startingPrice).toLocaleString()} {boq.currency}
                </p>
              </div>
            )}
            {boq.autoAcceptPrice && (
              <div>
                <p className="text-muted-foreground">{t("boq.autoAcceptPrice")}</p>
                <p className="font-medium text-green-600">
                  {Number(boq.autoAcceptPrice).toLocaleString()} {boq.currency}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("boq.items")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("boq.itemDescription")}</TableHead>
                <TableHead>{t("boq.category")}</TableHead>
                <TableHead className="text-right">{t("boq.quantity")}</TableHead>
                <TableHead>{t("boq.unit")}</TableHead>
                <TableHead className="text-right">{t("boq.estimatedPrice")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boq.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.description}</p>
                      {item.specification && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.specification}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity).toLocaleString()}</TableCell>
                  <TableCell>{item.unit?.symbol ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {item.estimatedPrice
                      ? `${Number(item.estimatedPrice).toLocaleString()} ${boq.currency}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bids */}
      <Card>
        <CardHeader>
          <CardTitle>{t("boq.bids")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeBids.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{t("boq.noBids")}</p>
          ) : (
            activeBids.map((bid) => (
              <div key={bid.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {bid.isAnonymous ? t("boq.anonymousSupplier") : bid.supplier.companyName}
                      </p>
                      {bid.supplier.isVerified && (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant={(BID_STATUS_COLORS[bid.status] as any) ?? "secondary"}>
                        {bid.status === "AUTO_ACCEPTED" ? t("boq.autoAccepted") : bid.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bid.supplier.city.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">
                      {Number(bid.totalPrice).toLocaleString()} {boq.currency}
                    </p>
                    {bid.deliveryDays && (
                      <p className="text-xs text-muted-foreground">
                        {bid.deliveryDays} {t("boq.days")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line items */}
                {bid.lineItems.length > 0 && (
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
                      {bid.lineItems.map((li) => (
                        <TableRow key={li.id}>
                          <TableCell>
                            #{li.boqItem.itemNumber} {li.boqItem.description}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(li.unitPrice).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(li.totalPrice).toLocaleString()}
                          </TableCell>
                          <TableCell>{li.brand ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {bid.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-2">{bid.notes}</p>
                )}

                {canAccept && bid.status === "SUBMITTED" && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={!!loading}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t("boq.acceptBid")}
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
