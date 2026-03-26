import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMarketplaceListing } from "@/server/actions/marketplace.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, ShieldCheck, Zap, ArrowLeft, Package, Eye } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const listing = await getMarketplaceListing(id);

  if (!listing) {
    notFound();
  }

  const isAr = locale === "ar";
  const title = isAr && listing.titleAr ? listing.titleAr : listing.title;
  const description = isAr && listing.descriptionAr
    ? listing.descriptionAr
    : listing.description;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/${locale}/marketplace`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")} {t("marketplace.title")}
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <Badge variant="outline" className="mb-2">
                  {listing.category.name}
                </Badge>
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
              {listing.inventoryItem.canUrgentDeliver && (
                <Badge className="bg-amber-500">
                  <Zap className="h-3 w-3 me-1" />
                  {t("inventory.urgentDelivery")}
                </Badge>
              )}
            </div>

            {description && (
              <p className="mt-3 text-muted-foreground">{description}</p>
            )}
          </div>

          <Separator />

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label={t("inventory.price")}>
              <span className="text-xl font-bold">
                {Number(listing.price.toString()).toFixed(2)} {listing.currency}
              </span>
              <span className="text-sm text-muted-foreground">
                /{listing.inventoryItem.unit.symbol}
              </span>
            </DetailRow>

            <DetailRow label={t("inventory.quantity")}>
              {Number(listing.inventoryItem.quantityInStock.toString())}{" "}
              {listing.inventoryItem.unit.symbol} {t("inventory.active").toLowerCase()}
            </DetailRow>

            {listing.inventoryItem.minOrderQty && (
              <DetailRow label={t("inventory.minOrder")}>
                {Number(listing.inventoryItem.minOrderQty.toString())}{" "}
                {listing.inventoryItem.unit.symbol}
              </DetailRow>
            )}

            {listing.inventoryItem.brand && (
              <DetailRow label={t("inventory.brand")}>
                {listing.inventoryItem.brand}
              </DetailRow>
            )}

            {listing.inventoryItem.sku && (
              <DetailRow label={t("inventory.sku")}>
                {listing.inventoryItem.sku}
              </DetailRow>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {listing.viewCount} views
          </div>
        </div>

        {/* Supplier Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("marketplace.supplier")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{listing.supplier.companyName}</span>
                {listing.supplier.isVerified && (
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                )}
              </div>

              {listing.supplier.description && (
                <p className="text-sm text-muted-foreground">
                  {listing.supplier.description}
                </p>
              )}

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {t(`cities.${listing.supplier.city}` as Parameters<typeof t>[0])}
              </div>

              <Button className="w-full">
                <Package className="h-4 w-4 me-2" />
                {t("marketplace.contactSupplier")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
