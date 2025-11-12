import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type Department = Prisma.DepartmentGetPayload<{}>;

export async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(id: number) {
  return prisma.department.findUnique({
    where: { id },
  });
}

export async function getDepartmentByCode(code: string) {
  return prisma.department.findUnique({
    where: { code },
  });
}

export async function getDepartmentByName(name: string) {
  return prisma.department.findUnique({
    where: { name },
  });
}
