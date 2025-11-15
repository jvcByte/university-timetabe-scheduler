import { prisma } from "@/lib/db";

export interface GetStudentsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: number;
  year?: number;
  semester?: number;
  groupId?: number;
  hasGroup?: boolean;
}

export async function getStudents(options: GetStudentsOptions = {}) {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    departmentId,
    year,
    semester,
    groupId,
    hasGroup,
  } = options;

  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { studentId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (departmentId !== undefined) {
    where.departmentId = departmentId;
  }

  if (year !== undefined) {
    where.year = year;
  }

  if (semester !== undefined) {
    where.semester = semester;
  }

  if (groupId !== undefined) {
    where.studentGroupId = groupId;
  }

  if (hasGroup !== undefined) {
    where.studentGroupId = hasGroup ? { not: null } : null;
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ name: "asc" }],
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            year: true,
            semester: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    students,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export async function getStudentById(id: number) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      department: true,
      group: {
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
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function getStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      department: true,
      group: {
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
        },
      },
    },
  });
}


export async function getStudentsByGroupId(groupId: number) {
  return prisma.student.findMany({
    where: { studentGroupId: groupId },
    orderBy: [{ name: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function getUnassignedStudents() {
  return prisma.student.findMany({
    where: { studentGroupId: null },
    orderBy: [{ name: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}
