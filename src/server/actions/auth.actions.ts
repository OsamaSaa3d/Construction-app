"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { signIn, signOut } from "@/lib/auth";
import { UAECity, UserRole } from "@/generated/prisma/client";

export async function registerUser(data: RegisterInput) {
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

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as UserRole,
      phone: phone || null,
      status: "ACTIVE",
    },
  });

  // Create role-specific profile
  const cityEnum = city as UAECity;

  switch (role) {
    case "SUPPLIER":
      await prisma.supplierProfile.create({
        data: {
          userId: user.id,
          companyName,
          city: cityEnum,
          tradeLicense: tradeLicense || null,
        },
      });
      break;
    case "CONTRACTOR":
      await prisma.contractorProfile.create({
        data: {
          userId: user.id,
          companyName,
          city: cityEnum,
          tradeLicense: tradeLicense || null,
        },
      });
      break;
    case "CONSULTANT":
      await prisma.consultantProfile.create({
        data: {
          userId: user.id,
          companyName,
          city: cityEnum,
        },
      });
      break;
    case "CUSTOMER":
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          city: cityEnum,
        },
      });
      break;
  }

  return { success: true };
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
  await signOut({ redirectTo: `/${locale}/login` });
}
