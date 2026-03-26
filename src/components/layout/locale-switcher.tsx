"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locales.find((l) => l !== locale) ?? locales[0];

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSwitch} className="gap-2">
      <Languages className="h-4 w-4" />
      <span>{localeNames[nextLocale]}</span>
    </Button>
  );
}
