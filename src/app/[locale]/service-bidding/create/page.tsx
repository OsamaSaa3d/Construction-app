import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateRequestClient } from "./create-request-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreateServiceRequestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return <CreateRequestClient />;
}
