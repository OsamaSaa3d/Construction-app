"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Rating = {
  id: string;
  trustworthiness: number;
  deliveryReliability: number;
  timeliness: number;
  materialQuality: number;
  overallScore: number;
  comment: string | null;
  createdAt: Date;
  ratedByUser: { name: string; role: string };
};

type Averages = {
  trustworthiness: number;
  deliveryReliability: number;
  timeliness: number;
  materialQuality: number;
  overall: number;
} | null;

type Props = {
  data: { ratings: Rating[]; averages: Averages; count: number };
};

function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3.5 w-3.5 ${s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function SupplierRatingsClient({ data }: Props) {
  const t = useTranslations("ratings");

  const { ratings, averages, count } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("totalRatings", { count })}</p>
        </div>
        {averages && (
          <div className="text-right">
            <p className="text-4xl font-bold">{averages.overall.toFixed(1)}</p>
            <div className="flex justify-end gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= Math.round(averages.overall) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Averages breakdown */}
      {averages && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("averageScores")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StarRow label={t("trustworthiness")} value={averages.trustworthiness} />
            <StarRow label={t("deliveryReliability")} value={averages.deliveryReliability} />
            <StarRow label={t("timeliness")} value={averages.timeliness} />
            <StarRow label={t("materialQuality")} value={averages.materialQuality} />
          </CardContent>
        </Card>
      )}

      {/* Individual ratings */}
      {ratings.length === 0 ? (
        <div className="py-16 text-center">
          <Star className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 font-medium">{t("noRatings")}</p>
          <p className="text-sm text-muted-foreground">{t("noRatingsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.ratedByUser.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {r.ratedByUser.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{Number(r.overallScore).toFixed(1)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <StarRow label={t("trustworthiness")} value={r.trustworthiness} />
                  <StarRow label={t("deliveryReliability")} value={r.deliveryReliability} />
                  <StarRow label={t("timeliness")} value={r.timeliness} />
                  <StarRow label={t("materialQuality")} value={r.materialQuality} />
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground border-t pt-2">{r.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
