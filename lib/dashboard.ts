import { prisma } from './db';
import { Day, TimetableStatus } from '@prisma/client';

/**
 * Dashboard data queries for analytics and statistics
 */

// Entity counts
export async function getEntityCounts() {
  const [courses, instructors, rooms, groups, students, timetables] = await Promise.all([
    prisma.course.count(),
    prisma.instructor.count(),
    prisma.room.count(),
    prisma.studentGroup.count(),
    prisma.student.count(),
    prisma.timetable.count(),
  ]);

  return {
    courses,
    instructors,
    rooms,
    groups,
    students,
    timetables,
  };
}

// Room utilization rates
export async function getRoomUtilization(timetableId?: number) {
  const rooms = await prisma.room.findMany({
    include: {
      assignments: timetableId
        ? {
            where: { timetableId },
          }
        : true,
    },
  });

  // Calculate total available time slots per week
  // Assuming 5 days (Mon-Fri), 10 hours per day (8:00-18:00), 1-hour slots = 50 slots per week
  const totalSlotsPerWeek = 50;

  const utilization = rooms.map((room) => {
    const assignedSlots = room.assignments.length;
    const utilizationRate = (assignedSlots / totalSlotsPerWeek) * 100;

    return {
      roomId: room.id,
      roomName: room.name,
      building: room.building,
      capacity: room.capacity,
      type: room.type,
      assignedSlots,
      totalSlots: totalSlotsPerWeek,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  });

  return utilization;
}

// Instructor teaching load distribution
export async function getInstructorLoadDistribution(timetableId?: number) {
  const instructors = await prisma.instructor.findMany({
    include: {
      assignments: timetableId
        ? {
            where: { timetableId },
            include: {
              course: true,
            },
          }
        : {
            include: {
              course: true,
            },
          },
      department: true,
    },
  });

  const distribution = instructors.map((instructor) => {
    // Calculate total teaching hours
    const totalHours = instructor.assignments.reduce((sum, assignment) => {
      return sum + assignment.course.duration / 60; // Convert minutes to hours
    }, 0);

    const loadPercentage = instructor.teachingLoad > 0 
      ? (totalHours / instructor.teachingLoad) * 100 
      : 0;

    return {
      instructorId: instructor.id,
      instructorName: instructor.name,
      department: instructor.department.name,
      teachingLoad: instructor.teachingLoad,
      assignedHours: Math.round(totalHours * 100) / 100,
      loadPercentage: Math.round(loadPercentage * 100) / 100,
      assignmentCount: instructor.assignments.length,
    };
  });

  return distribution;
}

// Recent timetables
export async function getRecentTimetables(limit: number = 5) {
  const timetables = await prisma.timetable.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    include: {
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return timetables.map((timetable) => ({
    id: timetable.id,
    name: timetable.name,
    semester: timetable.semester,
    academicYear: timetable.academicYear,
    status: timetable.status,
    fitnessScore: timetable.fitnessScore,
    assignmentCount: timetable._count.assignments,
    createdAt: timetable.createdAt,
    publishedAt: timetable.publishedAt,
  }));
}

// Timetable status overview
export async function getTimetableStatusOverview() {
  const statusCounts = await prisma.timetable.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  const overview = {
    draft: 0,
    generating: 0,
    generated: 0,
    published: 0,
    archived: 0,
    total: 0,
  };

  statusCounts.forEach((item) => {
    const count = item._count.status;
    overview.total += count;

    switch (item.status) {
      case TimetableStatus.DRAFT:
        overview.draft = count;
        break;
      case TimetableStatus.GENERATING:
        overview.generating = count;
        break;
      case TimetableStatus.GENERATED:
        overview.generated = count;
        break;
      case TimetableStatus.PUBLISHED:
        overview.published = count;
        break;
      case TimetableStatus.ARCHIVED:
        overview.archived = count;
        break;
    }
  });

  return overview;
}

// Soft constraint violations breakdown
export async function getConstraintViolationsBreakdown(timetableId: number) {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: {
      violations: true,
      fitnessScore: true,
    },
  });

  if (!timetable || !timetable.violations) {
    return {
      fitnessScore: timetable?.fitnessScore || null,
      violations: [],
      totalViolations: 0,
    };
  }

  const violations = timetable.violations as any;

  // Parse violations structure (assuming it's an array of violation objects)
  const violationsList = Array.isArray(violations) ? violations : [];

  // Group violations by type
  const violationsByType: Record<string, number> = {};
  violationsList.forEach((violation: any) => {
    const type = violation.constraint_type || violation.type || 'unknown';
    violationsByType[type] = (violationsByType[type] || 0) + 1;
  });

  return {
    fitnessScore: timetable.fitnessScore,
    violations: Object.entries(violationsByType).map(([type, count]) => ({
      type,
      count,
    })),
    totalViolations: violationsList.length,
  };
}

// Get dashboard data for a specific role
export async function getDashboardData(role: string, userId?: string) {
  const entityCounts = await getEntityCounts();
  const statusOverview = await getTimetableStatusOverview();
  const recentTimetables = await getRecentTimetables();

  return {
    entityCounts,
    statusOverview,
    recentTimetables,
  };
}

// Get faculty-specific dashboard data
export async function getFacultyDashboardData(userId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { userId },
    include: {
      assignments: {
        where: {
          timetable: {
            status: TimetableStatus.PUBLISHED,
          },
        },
        include: {
          course: true,
          room: true,
          group: true,
          timetable: true,
        },
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      },
      department: true,
    },
  });

  if (!instructor) {
    return null;
  }

  // Calculate teaching hours
  const totalHours = instructor.assignments.reduce((sum, assignment) => {
    return sum + assignment.course.duration / 60;
  }, 0);

  return {
    instructor: {
      id: instructor.id,
      name: instructor.name,
      email: instructor.email,
      department: instructor.department.name,
      teachingLoad: instructor.teachingLoad,
      assignedHours: Math.round(totalHours * 100) / 100,
      loadPercentage: Math.round((totalHours / instructor.teachingLoad) * 100 * 100) / 100,
    },
    assignments: instructor.assignments,
    upcomingClasses: instructor.assignments.slice(0, 5),
  };
}

// Get student-specific dashboard data
export async function getStudentDashboardData(userId: string) {
  // First find the student by userId
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      group: {
        include: {
          assignments: {
            where: {
              timetable: {
                status: TimetableStatus.PUBLISHED,
              },
            },
            include: {
              course: true,
              instructor: true,
              room: true,
              timetable: true,
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          },
          courses: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  if (!student || !student.group) {
    return null;
  }

  const studentGroup = student.group;

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      program: student.program,
      year: student.year,
      semester: student.semester,
    },
    group: {
      id: studentGroup.id,
      name: studentGroup.name,
      program: studentGroup.program,
      year: studentGroup.year,
      semester: studentGroup.semester,
      size: studentGroup.size,
    },
    assignments: studentGroup.assignments,
    courses: studentGroup.courses.map((cg: any) => cg.course),
    upcomingClasses: studentGroup.assignments.slice(0, 5),
  };
}
