import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type StudentGroupWithRelations = Prisma.StudentGroupGetPayload<{
  include: {
    courses: {
      include: {
        course: {
          include: {
            department: true;
          };
        };
      };
    };
    user: true;
  };
}>;

export type StudentGroupListItem = Prisma.StudentGroupGetPayload<{
  include: {
    _count: {
      select: {
        courses: true;
        assignments: true;
      };
    };
  };
}>;

export interface GetStudentGroupsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  program?: string;
  year?: number;
  semester?: number;
  sortBy?: "name" | "program" | "year" | "semester" | "size" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function getStudentGroups(params: GetStudentGroupsParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    program,
    year,
    semester,
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.StudentGroupWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { program: { contains: search } },
            ],
          }
        : {},
      program ? { program } : {},
      year ? { year } : {},
      semester ? { semester } : {},
    ],
  };

  // Execute queries in parallel
  const [groups, total] = await Promise.all([
    prisma.studentGroup.findMany({
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
      },
    }),
    prisma.studentGroup.count({ where }),
  ]);

  return {
    groups,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getStudentGroupById(id: number) {
  return prisma.studentGroup.findUnique({
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
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });
}

export async function searchStudentGroups(query: string, limit = 10) {
  return prisma.studentGroup.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { program: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });
}

export async function getPrograms() {
  const groups = await prisma.studentGroup.findMany({
    select: {
      program: true,
    },
    distinct: ["program"],
    orderBy: {
      program: "asc",
    },
  });

  return groups.map((group) => group.program);
}
