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
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Users } from "lucide-react";
import { closeBOQBidding, acceptBid } from "@/server/actions/boq.actions";

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
  submittedAt: Date;
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
  deliveryCity: string | null;
  biddingDeadline: Date | null;
  createdAt: Date;
  items: BOQItem[];
  materialBids: Bid[];
  isOwner: boolean;
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  BIDDING_CLOSED: "outline",
  AWARDED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

const BID_STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
  AUTO_ACCEPTED: "default",
};

function fmt(value: number | string | null | undefined) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BOQDetailClient({ boq }: { boq: BOQ }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);

  async function handleCloseBidding() {
    if (!confirm(t("boq.confirmClose"))) return;
    setLoading("close");
    await closeBOQBidding(boq.id);
    setLoading(null);
    router.refresh();
  }

  async function handleAcceptBid(bidId: string) {
    if (!confirm(t("boq.confirmAccept"))) return;
    setLoading(bidId);
    await acceptBid(bidId);
    setLoading(null);
    router.refresh();
  }

  const statusLabel: Record<string, string> = {
    DRAFT: t("boq.draft"),
    PUBLISHED: t("boq.published"),
    BIDDING_CLOSED: t("boq.biddingClosed"),
    AWARDED: t("boq.awarded"),
    IN_PROGRESS: t("boq.inProgress"),
    COMPLETED: t("boq.completed"),
    CANCELLED: t("boq.cancelled"),
  };

  const bidStatusLabel: Record<string, string> = {
    SUBMITTED: t("boq.bidSubmitted"),
    UNDER_REVIEW: t("boq.bidUnderReview"),
    ACCEPTED: t("boq.bidAccepted"),
    REJECTED: t("boq.bidRejected"),
    WITHDRAWN: t("boq.bidWithdrawn"),
    AUTO_ACCEPTED: t("boq.bidAutoAccepted"),
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/consultant/boq" as any)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{boq.title}</h1>
            <Badge variant={(STATUS_BADGE[boq.status] as any) ?? "secondary"}>
              {statusLabel[boq.status] ?? boq.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
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
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t("boq.totalBids", { count: boq.materialBids.length })}
            </span>
          </div>
        </div>
        {boq.isOwner && boq.status === "PUBLISHED" && (
          <Button variant="outline" onClick={handleCloseBidding} disabled={loading === "close"}>
            {t("boq.closeBidding")}
          </Button>
        )}
      </div>

      {boq.description && (
        <p className="text-muted-foreground text-sm">{boq.description}</p>
      )}

      {/* BOQ Items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("boq.items")} ({boq.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t("boq.itemNumber")}</TableHead>
                <TableHead>{t("boq.itemDescription")}</TableHead>
                <TableHead>{t("boq.specification")}</TableHead>
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
                    <div>{item.description}</div>
                    {item.descriptionAr && (
                      <div className="text-xs text-muted-foreground" dir="rtl">{item.descriptionAr}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {item.specification ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{Number(item.quantity).toLocaleString()}</TableCell>
                  <TableCell>{item.unit?.symbol ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {item.estimatedPrice ? `${fmt(item.estimatedPrice)} AED` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bids section — only visible to owner */}
      {boq.isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("boq.bids")} ({boq.materialBids.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {boq.materialBids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("boq.noBids")}</p>
                <p className="text-sm mt-1">{t("boq.noBidsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {boq.materialBids.map((bid, i) => (
                  <div key={bid.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedBid(expandedBid === bid.id ? null : bid.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bid.supplier.companyName}</span>
                            {bid.supplier.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            <Badge variant={(BID_STATUS_BADGE[bid.status] as any) ?? "secondary"} className="text-xs">
                              {bidStatusLabel[bid.status] ?? bid.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t(`cities.${bid.supplier.city}`)}
                            {bid.deliveryDays && ` · ${bid.deliveryDays} ${t("boq.days")}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{fmt(bid.totalPrice)} AED</div>
                        {bid.deliveryCost != null && Number(bid.deliveryCost) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{fmt(bid.deliveryCost)} delivery
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedBid === bid.id && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-3">
                        {/* Line items */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>{t("boq.itemDescription")}</TableHead>
                              <TableHead className="text-right">{t("boq.unitPrice")}</TableHead>
                              <TableHead className="text-right">{t("boq.lineTotal")}</TableHead>
                              <TableHead>{t("boq.brand")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bid.lineItems.map((li) => (
                              <TableRow key={li.id}>
                                <TableCell>{li.boqItem.itemNumber}</TableCell>
                                <TableCell>{li.boqItem.description}</TableCell>
                                <TableCell className="text-right">{fmt(li.unitPrice)}</TableCell>
                                <TableCell className="text-right">{fmt(li.totalPrice)}</TableCell>
                                <TableCell>{li.brand ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {bid.notes && (
                          <p className="text-sm text-muted-foreground">{bid.notes}</p>
                        )}

                        {boq.isOwner &&
                          (boq.status === "PUBLISHED" || boq.status === "BIDDING_CLOSED") &&
                          bid.status === "SUBMITTED" && (
                            <div className="flex justify-end pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={loading === bid.id}
                              >
                                {t("boq.acceptBid")}
                              </Button>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
