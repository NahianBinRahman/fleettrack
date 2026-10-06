"use server";

import { db } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both official email and password." };
  }

  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    return { error: "Invalid credentials. Official account not recognized." };
  }

  if (!user.isActive) {
    return {
      error: "This naval account has been deactivated. Please contact the Administrative Directorate.",
    };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid credentials. Please re-check your password." };
  }

  // Create JWT session
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role as "ADMIN" | "PERSONNEL",
    name: user.name,
    serviceId: user.serviceId,
  });

  await setSessionCookie(token);

  if (user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
