import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Geist } from "next/font/google";
import { routing } from "@/i18n/routing";
import { isRtl, type Locale } from "@/i18n/config";
import "@/app/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = isRtl(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={geist.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased"
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
