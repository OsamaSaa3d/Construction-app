"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Calendar, ArrowRight, Clock, CheckCircle2 } from "lucide-react";

type UrgentMatch = {
  id: string;
  distanceKm: number;
  canFulfill: boolean;
  priceQuote: number | string | null;
  respondedAt: Date | null;
  accepted: boolean;
  request: {
    id: string;
    title: string;
    status: string;
    deliveryCity: string;
    maxBudget: number | string | null;
    neededBy: Date | null;
    createdAt: Date;
    items: { id: string; description: string; quantity: number | string; unit: string }[];
  };
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

export function SupplierUrgentListClient({ matches }: { matches: UrgentMatch[] }) {
  const t = useTranslations("urgent");
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("myMatches")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {matches.length} {t("title").toLowerCase()}
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">{t("emptyMatches")}</h3>
            <p className="text-muted-foreground text-sm mt-1">{t("emptyMatchesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className={`hover:shadow-md transition-shadow ${
                match.accepted ? "border-green-300" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {match.request.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.request.deliveryCity.replace(/_/g, " ")}
                      </span>
                      <span>{t("distanceKm", { km: match.distanceKm.toFixed(1) })}</span>
                      {match.request.neededBy && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(match.request.neededBy).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={(STATUS_COLORS[match.request.status] as any) ?? "secondary"}>
                      {match.request.status.replace(/_/g, " ")}
                    </Badge>
                    {match.respondedAt === null ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" />
                        {t("pending")}
                      </span>
                    ) : match.canFulfill ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("canFulfill")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("cannotFulfill")}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {t("totalItems", { count: match.request.items.length })}
                  {match.request.maxBudget ? (
                    <span className="ml-3 font-medium text-foreground">
                      {t("budget")}: {Number(match.request.maxBudget).toLocaleString()} AED
                    </span>
                  ) : null}
                  {match.priceQuote && (
                    <span className="ml-3 font-bold text-foreground">
                      My quote: {Number(match.priceQuote).toLocaleString()} AED
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/supplier/urgent/${match.request.id}` as any)}
                >
                  {t("view")}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
