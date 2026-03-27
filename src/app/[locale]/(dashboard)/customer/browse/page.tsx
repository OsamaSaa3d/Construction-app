import { setRequestLocale } from "next-intl/server";
import {
  getMarketplaceListings,
  getMarketplaceCategories,
} from "@/server/actions/marketplace.actions";
import { MarketplaceBrowse } from "@/components/marketplace/marketplace-browse";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function CustomerBrowsePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = {
    categoryId: sp.category || undefined,
    city: sp.city || undefined,
    search: sp.q || undefined,
    sort: (sp.sort as "newest" | "price_asc" | "price_desc") || "newest",
  };

  const [listings, categories] = await Promise.all([
    getMarketplaceListings(filters),
    getMarketplaceCategories(),
  ]);

  return (
    <MarketplaceBrowse
      listings={listings}
      categories={categories}
      filters={filters}
      locale={locale}
    />
  );
}
