import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ContractorBidsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CONTRACTOR") {
    redirect(`/${locale}/login`);
  }

  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return <div className="text-sm text-muted-foreground">Contractor profile not found.</div>;
  }

  const boqs = await prisma.bOQ.findMany({
    where: { contractorId: profile.id, type: "PURCHASE" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      materialBids: {
        select: {
          id: true,
          status: true,
          totalPrice: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = boqs.reduce(
    (acc, boq) => {
      acc.totalBoqs += 1;
      acc.totalBids += boq.materialBids.length;
      if (boq.status === "AWARDED") acc.awarded += 1;
      return acc;
    },
    { totalBoqs: 0, totalBids: 0, awarded: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contractor Bids</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review supplier bids submitted to your purchase BOQs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">BOQs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalBoqs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalBids}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awarded BOQs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.awarded}</p>
          </CardContent>
        </Card>
      </div>

      {boqs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No purchase BOQs yet. Create one first to start receiving bids.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {boqs.map((boq) => {
            const lowestBid = boq.materialBids.length
              ? Math.min(...boq.materialBids.map((b) => Number(b.totalPrice)))
              : null;

            return (
              <Card key={boq.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{boq.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(boq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{boq.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    <span>{boq.materialBids.length} bids</span>
                    {lowestBid !== null ? (
                      <span className="ml-3 text-foreground font-medium">
                        Lowest: {lowestBid.toLocaleString()} AED
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={`/contractor/boq/${boq.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    View BOQ
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
