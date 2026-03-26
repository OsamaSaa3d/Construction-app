"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";

type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  createdAt: Date;
  boq: { title: string; type: string } | null;
  bid: {
    totalPrice: number | string;
    isAnonymous: boolean;
    supplier: { companyName: string } | null;
  };
  escrow: { status: string } | null;
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "secondary",
  PAID: "default",
  IN_ESCROW: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
};

export function ContractorOrdersClient({ orders }: { orders: Order[] }) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("order.myOrders")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} {t("order.orders").toLowerCase()}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">{t("order.noOrders")}</h3>
            <p className="text-muted-foreground text-sm mt-1">{t("order.noOrdersDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {order.boq?.title ?? t("order.untitled")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.bid.isAnonymous
                        ? t("boq.anonymousSupplier")
                        : order.bid.supplier?.companyName ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={(ORDER_STATUS_COLORS[order.status] as any) ?? "secondary"}>
                      {t(`order.status_${order.status.toLowerCase()}` as any, { fallback: order.status })}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-bold">
                    {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </p>
                  {order.escrow && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("order.escrow")}: {order.escrow.status.replace(/_/g, " ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/contractor/orders/${order.id}` as any)}
                >
                  {t("common.view")}
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
