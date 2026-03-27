import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-600">
            {tCommon("appName")}
          </span>
          <nav className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900">
              {tNav("marketplace")}
            </Link>
            <Link href="/service-hub" className="text-sm text-gray-600 hover:text-gray-900">
              {tNav("serviceHub")}
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {tNav("login")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          {t("hero")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            {t("getStarted")}
          </Link>
          <Link
            href="/marketplace"
            className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("learnMore")}
          </Link>
        </div>
      </main>
    </div>
  );
}
