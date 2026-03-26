import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreatePostClient } from "./create-post-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreatePostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return <CreatePostClient />;
}
