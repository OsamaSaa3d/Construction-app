"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileSpreadsheet, Gavel } from "lucide-react";
import { withdrawBid } from "@/server/actions/boq.actions";

type OpenBOQ = {
  id: string;
  title: string;
  status: string;
  deliveryCity: string | null;
  biddingDeadline: Date | null;
  createdAt: Date;
  items: { id: string }[];
  materialBids: { id: string; status: string }[];
};

type MyBid = {
  id: string;
  totalPrice: number | string;
  status: string;
  submittedAt: Date;
  boq: {
    id: string;
    title: string;
    status: string;
    biddingDeadline: Date | null;
  };
};

const BID_STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
  AUTO_ACCEPTED: "default",
};

export function SupplierBidsClient({
  openBOQs,
  myBids,
}: {
  openBOQs: OpenBOQ[];
  myBids: MyBid[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const bidStatusLabel: Record<string, string> = {
    SUBMITTED: t("boq.bidSubmitted"),
    UNDER_REVIEW: t("boq.bidUnderReview"),
    ACCEPTED: t("boq.bidAccepted"),
    REJECTED: t("boq.bidRejected"),
    WITHDRAWN: t("boq.bidWithdrawn"),
    AUTO_ACCEPTED: t("boq.bidAutoAccepted"),
  };

  async function handleWithdraw(bidId: string) {
    if (!confirm(t("boq.confirmWithdraw"))) return;
    setLoading(bidId);
    await withdrawBid(bidId);
    setLoading(null);
    router.refresh();
  }

  function fmt(value: number | string) {
    return Number(value).toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("supplier.myBids")}</h1>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            {t("boq.openBOQs")} ({openBOQs.length})
          </TabsTrigger>
          <TabsTrigger value="mybids">
            {t("boq.myBids")} ({myBids.length})
          </TabsTrigger>
        </TabsList>

        {/* Open RFQs */}
        <TabsContent value="open" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">{t("boq.openBOQsDesc")}</p>

          {openBOQs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">{t("common.noResults")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {openBOQs.map((boq) => {
                const myBidOnThis = boq.materialBids[0];
                return (
                  <Card key={boq.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base">{boq.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              {t("boq.totalItems", { count: boq.items.length })}
                            </span>
                            {boq.deliveryCity && (
                              <span>{t(`cities.${boq.deliveryCity}`)}</span>
                            )}
                            {boq.biddingDeadline ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {t("boq.deadline")}:{" "}
                                {new Date(boq.biddingDeadline).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>{t("boq.noDeadline")}</span>
                            )}
                          </div>
                        </div>
                        {myBidOnThis && (
                          <Badge
                            variant={
                              (BID_STATUS_BADGE[myBidOnThis.status] as any) ?? "secondary"
                            }
                          >
                            {bidStatusLabel[myBidOnThis.status] ?? myBidOnThis.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        {myBidOnThis ? (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {t("boq.alreadyBid")}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/supplier/bids/${boq.id}` as any)
                              }
                            >
                              {t("boq.editBid")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/supplier/bids/${boq.id}` as any)
                            }
                          >
                            <Gavel className="h-3.5 w-3.5 mr-1.5" />
                            {t("boq.bidOn")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Bids */}
        <TabsContent value="mybids" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">{t("boq.myBidsDesc")}</p>

          {myBids.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gavel className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">{t("common.noResults")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myBids.map((bid) => (
                <Card key={bid.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{bid.boq.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>
                            {t("boq.grandTotal")}: {fmt(bid.totalPrice)} AED
                          </span>
                          <span>
                            {t("boq.createdAt")}:{" "}
                            {new Date(bid.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            (BID_STATUS_BADGE[bid.status] as any) ?? "secondary"
                          }
                        >
                          {bidStatusLabel[bid.status] ?? bid.status}
                        </Badge>
                        {bid.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdraw(bid.id)}
                            disabled={loading === bid.id}
                          >
                            {t("boq.withdrawBid")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/supplier/bids/${bid.boq.id}` as any)
                          }
                        >
                          {t("boq.viewBOQ")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
