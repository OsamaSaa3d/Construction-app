import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Gavel, ShoppingCart, Star } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SupplierDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SupplierDashboardContent />;
}

function SupplierDashboardContent() {
  const t = useTranslations();

  const stats = [
    { labelKey: "supplier.inventory", value: "0", icon: Package },
    { labelKey: "supplier.myBids", value: "0", icon: Gavel },
    { labelKey: "supplier.orders", value: "0", icon: ShoppingCart },
    { labelKey: "supplier.ratings", value: "—", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.overview")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.labelKey}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.labelKey as Parameters<typeof t>[0])}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
