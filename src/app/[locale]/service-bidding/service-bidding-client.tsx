"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Calendar, Gavel, Plus } from "lucide-react";

const SERVICE_CATEGORIES = [
  "COMPANY", "INTERIOR_DESIGN", "CONTRACTOR", "ELECTRICAL",
  "PLUMBING", "HVAC", "LANDSCAPING", "PAINTING", "FLOORING", "OTHER",
] as const;

const UAE_CITIES = [
  "ABU_DHABI", "DUBAI", "SHARJAH", "AJMAN",
  "UMM_AL_QUWAIN", "RAS_AL_KHAIMAH", "FUJAIRAH",
] as const;

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  AWARDED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

type ServiceRequest = {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  budget: { toString(): string } | null;
  currency: string;
  deadline: Date | null;
  createdAt: Date;
  requester: { id: string; name: string; role: string };
  _count: { bids: number };
};

type Props = {
  requests: ServiceRequest[];
  filters: { category?: string; city?: string; showAll?: boolean };
  locale: string;
};

export function ServiceBiddingBrowse({ requests, filters, locale }: Props) {
  const t = useTranslations("serviceBidding");
  const tCities = useTranslations("cities");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backHome")}
          </Link>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <Link href="/service-bidding/create">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createRequest")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            value={filters.category ?? ""}
            onValueChange={(v) => updateFilter("category", v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("allCategories")}</SelectItem>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={filters.city ?? ""}
            onValueChange={(v) => updateFilter("city", v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("allCities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("allCities")}</SelectItem>
              {UAE_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {tCities(city)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => updateFilter("all", filters.showAll ? null : "1")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filters.showAll
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("showAll")}
        </button>
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">{t("noRequests")}</p>
          <p className="mt-1 text-sm">{t("noRequestsDesc")}</p>
          <Link href="/service-bidding/create" className="mt-4 inline-block">
            <Button size="sm">{t("createRequest")}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link key={req.id} href={`/service-bidding/${req.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{t(`categories.${req.category}`)}</Badge>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[req.status] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {t(`status.${req.status}`)}
                        </span>
                      </div>
                      <h3 className="mb-1 text-base font-semibold">{req.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {tCities(req.city as any)}
                        </span>
                        {req.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(req.deadline).toLocaleDateString(locale)}
                          </span>
                        )}
                        {req.budget && (
                          <span className="font-medium text-foreground">
                            {req.budget.toString()} {req.currency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                      <Gavel className="h-4 w-4" />
                      {req._count.bids} {t("bids")}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("postedBy")} {req.requester.name} &middot;{" "}
                    {new Date(req.createdAt).toLocaleDateString(locale)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
