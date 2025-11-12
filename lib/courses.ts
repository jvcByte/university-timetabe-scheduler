import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    instructors: {
      include: {
        instructor: true;
      };
    };
    groups: {
      include: {
        group: true;
      };
    };
    department: true;
  };
}>;

export type CourseListItem = Prisma.CourseGetPayload<{
  include: {
    _count: {
      select: {
        instructors: true;
        groups: true;
        assignments: true;
      };
    };
    department: true;
  };
}>;

export interface GetCoursesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: number;
  sortBy?: "code" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function getCourses(params: GetCoursesParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    departmentId,
    sortBy = "code",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.CourseWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { code: { contains: search } },
              { title: { contains: search } },
            ],
          }
        : {},
      departmentId ? { departmentId } : {},
    ],
  };

  // Execute queries in parallel
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            instructors: true,
            groups: true,
            assignments: true,
          },
        },
        department: true,
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getCourseById(id: number) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      instructors: {
        include: {
          instructor: {
            include: {
              department: true,
            },
          },
        },
      },
      groups: {
        include: {
          group: true,
        },
      },
      department: true,
    },
  });
}

export async function searchCourses(query: string, limit = 10) {
  return prisma.course.findMany({
    where: {
      OR: [
        { code: { contains: query } },
        { title: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { code: "asc" },
    include: {
      department: true,
    },
  });
}
