"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Zap, ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  price: { toString(): string };
  currency: string;
  images: string;
  viewCount: number;
  category: { name: string; nameAr: string | null };
  supplier: {
    companyName: string;
    city: string;
    isVerified: boolean;
  };
  inventoryItem: {
    quantityInStock: { toString(): string };
    unit: { name: string; symbol: string };
    canUrgentDeliver: boolean;
  };
};

type Category = {
  id: string;
  name: string;
  nameAr: string | null;
  children: { id: string; name: string; nameAr: string | null }[];
};

type Props = {
  listings: Listing[];
  categories: Category[];
  filters: {
    categoryId?: string;
    city?: string;
    search?: string;
    sort?: string;
  };
  locale: string;
  backHref?: string;
};

const UAE_CITIES = [
  "ABU_DHABI",
  "DUBAI",
  "SHARJAH",
  "AJMAN",
  "UMM_AL_QUWAIN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
] as const;

export function MarketplaceBrowse({ listings, categories, filters, locale, backHref = "/" }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search || "");

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue || null);
  }

  // Flatten categories for filter
  const allCategories = categories.flatMap((cat) => [
    cat,
    ...cat.children.map((child) => ({ ...child, children: [] })),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <Link
          href={backHref}
          locale={locale}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
        <h1 className="text-3xl font-bold">{t("marketplace.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("marketplace.browseProducts")}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="ps-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            {t("common.search")}
          </Button>
        </form>

        <Select
          value={filters.categoryId ?? ""}
          onValueChange={(v) => updateFilter("category", v || null)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("marketplace.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("marketplace.allCategories")}</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {locale === "ar" && cat.nameAr ? cat.nameAr : cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.city ?? ""}
          onValueChange={(v) => updateFilter("city", v || null)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("marketplace.filterByCity")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("marketplace.filterByCity")}</SelectItem>
            {UAE_CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {t(`cities.${city}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? "newest"}
          onValueChange={(v) => updateFilter("sort", v || null)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("marketplace.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("marketplace.newest")}</SelectItem>
            <SelectItem value="price_asc">{t("marketplace.priceLowHigh")}</SelectItem>
            <SelectItem value="price_desc">{t("marketplace.priceHighLow")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {t("common.noResults")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              locale={locale}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold line-clamp-1">
                        {locale === "ar" && listing.titleAr
                          ? listing.titleAr
                          : listing.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {listing.category.name}
                      </p>
                    </div>
                    {listing.inventoryItem.canUrgentDeliver && (
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>

                  {listing.description && (
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  <div className="mb-3">
                    <span className="text-lg font-bold">
                      {Number(listing.price.toString()).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground ms-1">
                      {listing.currency}/{listing.inventoryItem.unit.symbol}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>{listing.supplier.companyName}</span>
                      {listing.supplier.isVerified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t(`cities.${listing.supplier.city}` as Parameters<typeof t>[0])}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {t("inventory.quantity")}:{" "}
                    {Number(listing.inventoryItem.quantityInStock.toString())}{" "}
                    {listing.inventoryItem.unit.symbol}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
