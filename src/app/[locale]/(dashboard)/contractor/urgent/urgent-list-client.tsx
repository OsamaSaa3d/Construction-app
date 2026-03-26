"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, MapPin, Calendar, Users, ArrowRight } from "lucide-react";

type UrgentRequest = {
  id: string;
  title: string;
  status: string;
  deliveryCity: string;
  maxBudget: number | string | null;
  neededBy: Date | null;
  createdAt: Date;
  items: { id: string }[];
  matches: { id: string; canFulfill: boolean; accepted: boolean; priceQuote: number | string | null }[];
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

export function ContractorUrgentListClient({
  requests,
}: {
  requests: UrgentRequest[];
}) {
  const t = useTranslations("urgent");
  const router = useRouter();

  const statusLabel: Record<string, string> = {
    SEARCHING: t("searching"),
    MATCHED: t("matched"),
    ACCEPTED: t("accepted"),
    IN_DELIVERY: t("inDelivery"),
    DELIVERED: t("delivered"),
    CONFIRMED: t("confirmed"),
    CANCELLED: t("cancelled"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("myRequests")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {requests.length} {t("title").toLowerCase()}
          </p>
        </div>
        <Button onClick={() => router.push("/contractor/urgent/create" as any)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newRequest")}
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">{t("emptyRequests")}</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">{t("emptyRequestsDesc")}</p>
            <Button onClick={() => router.push("/contractor/urgent/create" as any)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("newRequest")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const respondedMatches = req.matches.filter((m) => m.canFulfill);
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{req.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {req.deliveryCity.replace(/_/g, " ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {req.matches.length} matched, {respondedMatches.length} can fulfill
                        </span>
                        {req.neededBy && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(req.neededBy).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={(STATUS_COLORS[req.status] as any) ?? "secondary"}>
                      {statusLabel[req.status] ?? req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t("totalItems", { count: req.items.length })}
                      {req.maxBudget ? (
                        <span className="ml-3 font-medium text-foreground">
                          {t("budget")}: {Number(req.maxBudget).toLocaleString()} AED
                        </span>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/contractor/urgent/${req.id}` as any)}
                    >
                      {t("view")}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
