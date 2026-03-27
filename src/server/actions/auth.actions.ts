"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { signIn, signOut } from "@/lib/auth";
import { Prisma, UAECity, UserRole } from "@/generated/prisma/client";

export async function registerUser(data: RegisterInput) {
  try {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, password, role, companyName, city, phone, tradeLicense } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already registered" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role as UserRole,
          phone: phone || null,
          status: "ACTIVE",
        },
      });

      // Create role-specific profile in the same transaction to avoid partial users.
      const cityEnum = city as UAECity;

      switch (role) {
        case "SUPPLIER":
          await tx.supplierProfile.create({
            data: {
              userId: user.id,
              companyName,
              city: cityEnum,
              tradeLicense: tradeLicense || null,
            },
          });
          break;
        case "CONTRACTOR":
          await tx.contractorProfile.create({
            data: {
              userId: user.id,
              companyName,
              city: cityEnum,
              tradeLicense: tradeLicense || null,
            },
          });
          break;
        case "CONSULTANT":
          await tx.consultantProfile.create({
            data: {
              userId: user.id,
              companyName,
              city: cityEnum,
            },
          });
          break;
        case "CUSTOMER":
          await tx.customerProfile.create({
            data: {
              userId: user.id,
              city: cityEnum,
            },
          });
          break;
      }
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "A user with these details already exists." };
      }

      if (error.code === "P2021") {
        return { error: "Database schema is not initialized. Please contact support." };
      }

      if (error.code === "P1001" || error.code === "P1017") {
        return { error: "Database connection failed. Please try again shortly." };
      }
    }

    console.error("registerUser failed", error);
    return { error: "Registration failed. Please try again." };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "Invalid email or password" };
  }
}

export async function logoutUser(locale: string) {
  const safeLocale = locale === "ar" ? "ar" : "en";
  await signOut({ redirect: false });
  redirect(`/${safeLocale}/login`);
}
