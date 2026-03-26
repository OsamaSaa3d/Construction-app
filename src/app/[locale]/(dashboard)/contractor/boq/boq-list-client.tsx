"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Calendar, Users } from "lucide-react";
import { publishContractorBOQ, deleteContractorBOQ } from "@/server/actions/contractor-boq.actions";
import { useState } from "react";

type BOQ = {
  id: string;
  title: string;
  status: string;
  purchaseMode: string | null;
  biddingDeadline: Date | null;
  createdAt: Date;
  items: { id: string }[];
  materialBids: { id: string; status: string }[];
  orders: { id: string; status: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  BIDDING_CLOSED: "outline",
  AWARDED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export function ContractorBOQListClient({ boqs }: { boqs: BOQ[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePublish(id: string) {
    if (!confirm(t("boq.confirmPublish"))) return;
    setLoading(id);
    await publishContractorBOQ(id);
    setLoading(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("boq.confirmDelete"))) return;
    setLoading(id);
    await deleteContractorBOQ(id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("boq.purchaseBOQ")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {boqs.length} {t("boq.title").toLowerCase()}
          </p>
        </div>
        <Button onClick={() => router.push("/contractor/boq/create" as any)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("boq.createBoq")}
        </Button>
      </div>

      {boqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">{t("boq.emptyBoqs")}</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">{t("boq.emptyBoqsDesc")}</p>
            <Button onClick={() => router.push("/contractor/boq/create" as any)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("boq.createBoq")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {boqs.map((boq) => (
            <Card key={boq.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle
                      className="text-base cursor-pointer hover:underline truncate"
                      onClick={() => router.push(`/contractor/boq/${boq.id}` as any)}
                    >
                      {boq.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        {t("boq.totalItems", { count: boq.items.length })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {t("boq.totalBids", { count: boq.materialBids.length })}
                      </span>
                      {boq.biddingDeadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(boq.biddingDeadline).toLocaleDateString()}
                        </span>
                      )}
                      {boq.purchaseMode && (
                        <span className="text-xs font-medium">
                          {boq.purchaseMode === "ALL_AT_ONCE"
                            ? t("boq.allAtOnce")
                            : t("boq.bitByBit")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={(STATUS_COLORS[boq.status] as any) ?? "secondary"}>
                    {statusLabel[boq.status] ?? boq.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/contractor/boq/${boq.id}` as any)}
                >
                  {t("common.view")}
                </Button>
                {boq.status === "DRAFT" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handlePublish(boq.id)}
                      disabled={loading === boq.id}
                    >
                      {t("boq.publish")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(boq.id)}
                      disabled={loading === boq.id}
                    >
                      {t("common.delete")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
