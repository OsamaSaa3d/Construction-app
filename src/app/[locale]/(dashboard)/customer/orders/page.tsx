import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CustomerOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return <div className="text-sm text-muted-foreground">Customer profile not found.</div>;
  }

  const orders = await prisma.marketplaceOrder.findMany({
    where: { customerId: profile.id },
    include: {
      items: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              supplier: { select: { companyName: true } },
            },
          },
        },
      },
      escrow: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track marketplace purchases and escrow status.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No marketplace orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="font-semibold">
                    {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </span>
                  {order.escrow ? (
                    <span className="ml-3 text-muted-foreground">
                      Escrow: {order.escrow.status}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span className="truncate">{item.listing.title}</span>
                      <span className="text-muted-foreground shrink-0">
                        {Number(item.quantity).toLocaleString()} x {Number(item.unitPrice).toLocaleString()} AED
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
