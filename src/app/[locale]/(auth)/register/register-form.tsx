"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { registerUser } from "@/server/actions/auth.actions";
import type { RegisterInput } from "@/lib/validations/auth";

const roles = ["SUPPLIER", "CONTRACTOR", "CONSULTANT", "CUSTOMER"] as const;
const cities = [
  "ABU_DHABI",
  "DUBAI",
  "SHARJAH",
  "AJMAN",
  "UMM_AL_QUWAIN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
] as const;

export function RegisterForm() {
  const t = useTranslations("auth");
  const tRoles = useTranslations("roles");
  const tCities = useTranslations("cities");
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data: RegisterInput = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: role as RegisterInput["role"],
      companyName: formData.get("companyName") as string,
      city: city as RegisterInput["city"],
      phone: (formData.get("phone") as string) || undefined,
      tradeLicense: (formData.get("tradeLicense") as string) || undefined,
    };

    const result = await registerUser(data);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@company.ae"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder={t("role")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {tRoles(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">{t("companyName")}</Label>
            <Input id="companyName" name="companyName" required minLength={2} />
          </div>

          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Select value={city} onValueChange={(v) => setCity(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder={t("city")} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {tCities(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+971" />
          </div>

          {(role === "SUPPLIER" || role === "CONTRACTOR") && (
            <div className="space-y-2">
              <Label htmlFor="tradeLicense">{t("tradeLicense")}</Label>
              <Input id="tradeLicense" name="tradeLicense" />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !role || !city}>
            {loading ? "..." : t("register")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("login")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
