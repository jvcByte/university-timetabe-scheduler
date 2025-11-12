import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type RoomWithRelations = Prisma.RoomGetPayload<{
  include: {
    assignments: {
      include: {
        course: true;
        instructor: true;
        group: true;
        timetable: true;
      };
    };
  };
}>;

export type RoomListItem = Prisma.RoomGetPayload<{
  include: {
    _count: {
      select: {
        assignments: true;
      };
    };
  };
}>;

export interface GetRoomsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  sortBy?: "name" | "building" | "capacity" | "type" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function getRooms(params: GetRoomsParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    type,
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.RoomWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { building: { contains: search } },
            ],
          }
        : {},
      type ? { type } : {},
    ],
  };

  // Execute queries in parallel
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    }),
    prisma.room.count({ where }),
  ]);

  return {
    rooms,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getRoomById(id: number) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      assignments: {
        include: {
          course: true,
          instructor: true,
          group: true,
          timetable: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });
}

export async function searchRooms(query: string, limit = 10) {
  return prisma.room.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { building: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });
}

export async function getRoomTypes() {
  const rooms = await prisma.room.findMany({
    select: {
      type: true,
    },
    distinct: ["type"],
    orderBy: {
      type: "asc",
    },
  });

  return rooms.map((room) => room.type);
}
