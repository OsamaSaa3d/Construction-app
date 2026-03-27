import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      supplierProfile: { select: { companyName: true, city: true, isVerified: true } },
      contractorProfile: { select: { companyName: true, city: true } },
      consultantProfile: { select: { companyName: true, city: true } },
      customerProfile: { select: { city: true, address: true } },
    },
  });

  if (!user) {
    return <div className="text-sm text-muted-foreground">User not found.</div>;
  }

  const companyName =
    user.supplierProfile?.companyName ||
    user.contractorProfile?.companyName ||
    user.consultantProfile?.companyName ||
    null;

  const city =
    user.supplierProfile?.city ||
    user.contractorProfile?.city ||
    user.consultantProfile?.city ||
    user.customerProfile?.city ||
    null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{user.name ?? "Unnamed User"}</CardTitle>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium break-all">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <p className="font-medium">{user.status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">City</p>
            <p className="font-medium">{city ? String(city).replace(/_/g, " ") : "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Company / Organization</p>
            <p className="font-medium">{companyName ?? "-"}</p>
          </div>
          {user.supplierProfile ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Verification</p>
              <p className="font-medium">{user.supplierProfile.isVerified ? "Verified" : "Unverified"}</p>
            </div>
          ) : null}
          {user.customerProfile?.address ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{user.customerProfile.address}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
