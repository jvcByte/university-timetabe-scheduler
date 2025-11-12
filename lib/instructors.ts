import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type InstructorWithRelations = Prisma.InstructorGetPayload<{
  include: {
    courses: {
      include: {
        course: true;
      };
    };
    user: true;
    department: true;
  };
}>;

export type InstructorListItem = Prisma.InstructorGetPayload<{
  include: {
    _count: {
      select: {
        courses: true;
        assignments: true;
      };
    };
    department: true;
  };
}>;

export interface GetInstructorsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: number;
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function getInstructors(params: GetInstructorsParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    departmentId,
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.InstructorWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {},
      departmentId ? { departmentId } : {},
    ],
  };

  // Execute queries in parallel
  const [instructors, total] = await Promise.all([
    prisma.instructor.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            courses: true,
            assignments: true,
          },
        },
        department: true,
      },
    }),
    prisma.instructor.count({ where }),
  ]);

  return {
    instructors,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getInstructorById(id: number) {
  return prisma.instructor.findUnique({
    where: { id },
    include: {
      courses: {
        include: {
          course: {
            include: {
              department: true,
            },
          },
        },
      },
      user: true,
      department: true,
    },
  });
}

export async function searchInstructors(query: string, limit = 10) {
  return prisma.instructor.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });
}
