import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    };
    room: {
      name: string;
      building: string;
    };
    group: {
      name: string;
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
 * Generate PDF export of timetable
 */
export function generateTimetablePDF(
  data: TimetableData,
  filterLabels: string[] = []
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.timetable.name, pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 8;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.timetable.semester} ${data.timetable.academicYear}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  yPosition += 10;

  // Filter labels
  if (filterLabels.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Filtered by: ${filterLabels.join(", ")}`, 14, yPosition);
    yPosition += 8;
  }

  // Metadata
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const metadata = [
    `Status: ${data.timetable.status}`,
    `Total Classes: ${data.assignments.length}`,
  ];
  if (data.timetable.fitnessScore !== null) {
    metadata.push(`Fitness Score: ${data.timetable.fitnessScore.toFixed(2)}`);
  }
  doc.text(metadata.join(" | "), 14, yPosition);

  yPosition += 10;

  // Group assignments by day
  const assignmentsByDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = data.assignments
      .filter((a) => a.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  // Create table data
  const tableData: any[] = [];

  DAYS_ORDER.forEach((day) => {
    const dayAssignments = assignmentsByDay[day];
    if (dayAssignments.length === 0) return;

    dayAssignments.forEach((assignment, index) => {
      tableData.push([
        index === 0 ? day : "", // Only show day name for first assignment
        `${assignment.startTime} - ${assignment.endTime}`,
        `${assignment.course.code}\n${assignment.course.title}`,
        assignment.instructor.name,
        `${assignment.room.name}\n${assignment.room.building}`,
        assignment.group.name,
      ]);
    });
  });

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [["Day", "Time", "Course", "Instructor", "Room", "Group"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold" }, // Day
      1: { cellWidth: 30 }, // Time
      2: { cellWidth: 60 }, // Course
      3: { cellWidth: 40 }, // Instructor
      4: { cellWidth: 40 }, // Room
      5: { cellWidth: 35 }, // Group
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  // Return as Blob
  return doc.output("blob");
}

/**
 * Generate weekly calendar view PDF
 */
export function generateWeeklyCalendarPDF(
  data: TimetableData,
  filterLabels: string[] = []
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.timetable.name, pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 8;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.timetable.semester} ${data.timetable.academicYear} - Weekly View`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  yPosition += 10;

  // Filter labels
  if (filterLabels.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Filtered by: ${filterLabels.join(", ")}`, 14, yPosition);
    yPosition += 8;
  }

  yPosition += 5;

  // Get all unique time slots
  const timeSlots = Array.from(
    new Set(data.assignments.map((a) => a.startTime))
  ).sort();

  // Group assignments by day
  const assignmentsByDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = data.assignments.filter((a) => a.day === day);
    return acc;
  }, {} as Record<string, typeof data.assignments>);

  // Create calendar grid
  const activeDays = DAYS_ORDER.filter(
    (day) => assignmentsByDay[day].length > 0
  );

  const tableData: any[] = [];

  timeSlots.forEach((timeSlot) => {
    const row: any[] = [timeSlot];

    activeDays.forEach((day) => {
      const assignment = assignmentsByDay[day].find(
        (a) => a.startTime === timeSlot
      );

      if (assignment) {
        row.push(
          `${assignment.course.code}\n${assignment.room.name}\n${assignment.instructor.name}`
        );
      } else {
        row.push("");
      }
    });

    tableData.push(row);
  });

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [["Time", ...activeDays]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold", halign: "center" },
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  return doc.output("blob");
}
