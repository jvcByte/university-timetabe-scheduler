import * as XLSX from "xlsx";

interface TimetableData {
  timetable: {
    name: string;
    semester: string;
    academicYear: string;
    status: string;
    fitnessScore: number | null;
  };
  assignments: Array<{
    day: string;
    startTime: string;
    endTime: string;
    course: {
      code: string;
      title: string;
    };
    instructor: {
      name: string;
      email: string;
    };
    room: {
      name: string;
      building: string;
      capacity: number;
      type: string;
    };
    group: {
      name: string;
      program: string;
      year: number;
      size: number;
    };
  }>;
}

const DAYS_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/**
 * Generate Excel export of timetable with multiple sheets
 */
export function generateTimetableExcel(
  data: TimetableData,
  filterLabels: string[] = []
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ["Timetable Export"],
    [],
    ["Name:", data.timetable.name],
    ["Semester:", data.timetable.semester],
    ["Academic Year:", data.timetable.academicYear],
    ["Status:", data.timetable.status],
    [
      "Fitness Score:",
      data.timetable.fitnessScore?.toFixed(2) || "N/A",
    ],
    ["Total Classes:", data.assignments.length],
    [],
  ];

  if (filterLabels.length > 0) {
    overviewData.push(["Filters:", filterLabels.join(", ")]);
    overviewData.push([]);
  }

  overviewData.push(["Generated:", new Date().toLocaleString()]);

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);

  // Set column widths
  overviewSheet["!cols"] = [{ wch: 20 }, { wch: 40 }];

  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

  // Sheet 2: All Assignments (List View)
  const assignmentsData = [
    [
      "Day",
      "Start Time",
      "End Time",
      "Course Code",
      "Course Title",
      "Instructor",
      "Instructor Email",
      "Room",
      "Building",
      "Room Type",
      "Room Capacity",
      "Group",
      "Group Program",
      "Group Year",
      "Group Size",
    ],
  ];

  // Sort assignments by day and time
  const sortedAssignments = [...data.assignments].sort((a, b) => {
    const dayCompare =
      DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  sortedAssignments.forEach((assignment) => {
    assignmentsData.push([
      assignment.day,
      assignment.startTime,
      assignment.endTime,
      assignment.course.code,
      assignment.course.title,
      assignment.instructor.name,
      assignment.instructor.email,
      assignment.room.name,
      assignment.room.building,
      assignment.room.type,
      assignment.room.capacity.toString(),
      assignment.group.name,
      assignment.group.program,
      assignment.group.year.toString(),
      assignment.group.size.toString(),
    ]);
  });

  const assignmentsSheet = XLSX.utils.aoa_to_sheet(assignmentsData);

  // Set column widths
  assignmentsSheet["!cols"] = [
    { wch: 12 }, // Day
    { wch: 10 }, // Start Time
    { wch: 10 }, // End Time
    { wch: 12 }, // Course Code
    { wch: 30 }, // Course Title
    { wch: 20 }, // Instructor
    { wch: 25 }, // Instructor Email
    { wch: 15 }, // Room
    { wch: 15 }, // Building
    { wch: 15 }, // Room Type
    { wch: 12 }, // Room Capacity
    { wch: 15 }, // Group
    { wch: 20 }, // Group Program
    { wch: 10 }, // Group Year
    { wch: 10 }, // Group Size
  ];

  XLSX.utils.book_append_sheet(workbook, assignmentsSheet, "All Assignments");

  // Sheet 3: Weekly Calendar View
  const calendarSheet = createWeeklyCalendarSheet(data);
  XLSX.utils.book_append_sheet(workbook, calendarSheet, "Weekly Calendar");

  // Sheet 4: By Instructor
  const instructorSheet = createByInstructorSheet(data);
  XLSX.utils.book_append_sheet(workbook, instructorSheet, "By Instructor");

  // Sheet 5: By Room
  const roomSheet = createByRoomSheet(data);
  XLSX.utils.book_append_sheet(workbook, roomSheet, "By Room");

  // Sheet 6: By Group
  const groupSheet = createByGroupSheet(data);
  XLSX.utils.book_append_sheet(workbook, groupSheet, "By Group");

  // Generate buffer
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

/**
 * Create weekly calendar view sheet
 */
function createWeeklyCalendarSheet(data: TimetableData): XLSX.WorkSheet {
  // Get all unique time slots
  const timeSlots = Array.from(
    new Set(data.assignments.map((a) => a.startTime))
  ).sort();

  // Group assignments by day
  const assignmentsByDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = data.assignments.filter((a) => a.day === day);
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  // Get active days
  const activeDays = DAYS_ORDER.filter(
    (day) => assignmentsByDay[day].length > 0
  );

  // Create header row
  const calendarData: any[][] = [["Time", ...activeDays]];

  // Create rows for each time slot
  timeSlots.forEach((timeSlot) => {
    const row: any[] = [timeSlot];

    activeDays.forEach((day) => {
      const assignment = assignmentsByDay[day].find(
        (a) => a.startTime === timeSlot
      );

      if (assignment) {
        row.push(
          `${assignment.course.code} - ${assignment.course.title}\n${assignment.room.name} (${assignment.room.building})\n${assignment.instructor.name}\nGroup: ${assignment.group.name}`
        );
      } else {
        row.push("");
      }
    });

    calendarData.push(row);
  });

  const sheet = XLSX.utils.aoa_to_sheet(calendarData);

  // Set column widths
  sheet["!cols"] = [
    { wch: 10 }, // Time
    ...activeDays.map(() => ({ wch: 35 })), // Days
  ];

  return sheet;
}

/**
 * Create by instructor sheet
 */
function createByInstructorSheet(data: TimetableData): XLSX.WorkSheet {
  // Group assignments by instructor
  const byInstructor = data.assignments.reduce((acc, assignment) => {
    const key = assignment.instructor.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  const sheetData: any[][] = [
    [
      "Instructor",
      "Day",
      "Time",
      "Course",
      "Room",
      "Group",
    ],
  ];

  // Sort instructors alphabetically
  const instructors = Object.keys(byInstructor).sort();

  instructors.forEach((instructor) => {
    const assignments = byInstructor[instructor].sort((a, b) => {
      const dayCompare =
        DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    assignments.forEach((assignment, index) => {
      sheetData.push([
        index === 0 ? instructor : "", // Only show instructor name once
        assignment.day,
        `${assignment.startTime} - ${assignment.endTime}`,
        `${assignment.course.code} - ${assignment.course.title}`,
        `${assignment.room.name} (${assignment.room.building})`,
        assignment.group.name,
      ]);
    });

    // Add empty row between instructors
    sheetData.push([]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

  sheet["!cols"] = [
    { wch: 25 }, // Instructor
    { wch: 12 }, // Day
    { wch: 15 }, // Time
    { wch: 35 }, // Course
    { wch: 20 }, // Room
    { wch: 15 }, // Group
  ];

  return sheet;
}

/**
 * Create by room sheet
 */
function createByRoomSheet(data: TimetableData): XLSX.WorkSheet {
  // Group assignments by room
  const byRoom = data.assignments.reduce((acc, assignment) => {
    const key = `${assignment.room.name} (${assignment.room.building})`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  const sheetData: any[][] = [
    [
      "Room",
      "Day",
      "Time",
      "Course",
      "Instructor",
      "Group",
    ],
  ];

  // Sort rooms alphabetically
  const rooms = Object.keys(byRoom).sort();

  rooms.forEach((room) => {
    const assignments = byRoom[room].sort((a, b) => {
      const dayCompare =
        DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    assignments.forEach((assignment, index) => {
      sheetData.push([
        index === 0 ? room : "", // Only show room name once
        assignment.day,
        `${assignment.startTime} - ${assignment.endTime}`,
        `${assignment.course.code} - ${assignment.course.title}`,
        assignment.instructor.name,
        assignment.group.name,
      ]);
    });

    // Add empty row between rooms
    sheetData.push([]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

  sheet["!cols"] = [
    { wch: 25 }, // Room
    { wch: 12 }, // Day
    { wch: 15 }, // Time
    { wch: 35 }, // Course
    { wch: 25 }, // Instructor
    { wch: 15 }, // Group
  ];

  return sheet;
}

/**
 * Create by group sheet
 */
function createByGroupSheet(data: TimetableData): XLSX.WorkSheet {
  // Group assignments by student group
  const byGroup = data.assignments.reduce((acc, assignment) => {
    const key = assignment.group.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  const sheetData: any[][] = [
    [
      "Group",
      "Day",
      "Time",
      "Course",
      "Instructor",
      "Room",
    ],
  ];

  // Sort groups alphabetically
  const groups = Object.keys(byGroup).sort();

  groups.forEach((group) => {
    const assignments = byGroup[group].sort((a, b) => {
      const dayCompare =
        DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    assignments.forEach((assignment, index) => {
      sheetData.push([
        index === 0 ? group : "", // Only show group name once
        assignment.day,
        `${assignment.startTime} - ${assignment.endTime}`,
        `${assignment.course.code} - ${assignment.course.title}`,
        assignment.instructor.name,
        `${assignment.room.name} (${assignment.room.building})`,
      ]);
    });

    // Add empty row between groups
    sheetData.push([]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

  sheet["!cols"] = [
    { wch: 20 }, // Group
    { wch: 12 }, // Day
    { wch: 15 }, // Time
    { wch: 35 }, // Course
    { wch: 25 }, // Instructor
    { wch: 20 }, // Room
  ];

  return sheet;
}
