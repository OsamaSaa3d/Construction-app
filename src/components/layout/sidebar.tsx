"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { roleNavMap, type NavItem } from "@/lib/constants";
import { LayoutDashboard } from "lucide-react";

type Props = {
  role: string;
};

export function Sidebar({ role }: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const navItems = roleNavMap[role] ?? [];

  return (
    <aside className="flex h-full w-64 flex-col border-e bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-xl font-bold text-primary">
          {t("common.appName")}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <SidebarLink
          href={`/${role.toLowerCase()}`}
          icon={<LayoutDashboard className="h-5 w-5" />}
          label={t("dashboard.overview")}
          active={pathname === `/${role.toLowerCase()}`}
        />
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            icon={<item.icon className="h-5 w-5" />}
            label={getNestedTranslation(t, item.labelKey)}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function getNestedTranslation(t: ReturnType<typeof useTranslations>, key: string): string {
  try {
    return t(key as Parameters<typeof t>[0]);
  } catch {
    return key;
  }
}
