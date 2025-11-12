import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireFaculty() {
  const session = await requireAuth();
  if (session.user.role !== "FACULTY") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireStudent() {
  const session = await requireAuth();
  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireRole(role: "ADMIN" | "FACULTY" | "STUDENT") {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/unauthorized");
  }
  return session;
}
