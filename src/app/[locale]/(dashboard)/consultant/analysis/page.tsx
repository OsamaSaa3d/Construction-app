import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ConsultantAnalysisPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CONSULTANT") {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return <div className="text-sm text-muted-foreground">Consultant profile not found.</div>;
  }

  const boqs = await prisma.bOQ.findMany({
    where: { consultantId: profile.id, type: "MARKET_ANALYSIS" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      materialBids: {
        select: { id: true, totalPrice: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBoqs = boqs.length;
  const totalBids = boqs.reduce((sum, boq) => sum + boq.materialBids.length, 0);
  const awardedBoqs = boqs.filter((b) => b.status === "AWARDED").length;
  const avgBidsPerBoq = totalBoqs > 0 ? totalBids / totalBoqs : 0;

  const acceptedBidValues = boqs
    .flatMap((boq) => boq.materialBids)
    .filter((bid) => bid.status === "ACCEPTED" || bid.status === "AUTO_ACCEPTED")
    .map((bid) => Number(bid.totalPrice));

  const avgAcceptedBid = acceptedBidValues.length
    ? acceptedBidValues.reduce((sum, value) => sum + value, 0) / acceptedBidValues.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consultant Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Snapshot of bidding activity across your BOQs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total BOQs</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalBoqs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Bids</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalBids}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Awarded</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{awardedBoqs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Bids / BOQ</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgBidsPerBoq.toFixed(1)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent BOQs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {boqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No BOQs found yet.</p>
          ) : (
            boqs.slice(0, 8).map((boq) => {
              const bestBid = boq.materialBids.length
                ? Math.min(...boq.materialBids.map((bid) => Number(bid.totalPrice)))
                : null;

              return (
                <div key={boq.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
                  <div>
                    <p className="font-medium text-sm">{boq.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(boq.createdAt).toLocaleDateString()} · {boq.materialBids.length} bids
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{boq.status}</Badge>
                    {bestBid !== null ? (
                      <p className="text-xs text-muted-foreground mt-1">Best: {bestBid.toLocaleString()} AED</p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accepted Bid Average</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgAcceptedBid.toLocaleString(undefined, { maximumFractionDigits: 2 })} AED</p>
        </CardContent>
      </Card>
    </div>
  );
}
