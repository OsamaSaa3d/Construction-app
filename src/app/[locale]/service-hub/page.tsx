import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ServiceHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ServiceHubContent />;
}

function ServiceHubContent() {
  const t = useTranslations("nav");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">{t("serviceHub")}</h1>
      <div className="mt-8 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Service posts will appear here.
      </div>
    </div>
  );
}
