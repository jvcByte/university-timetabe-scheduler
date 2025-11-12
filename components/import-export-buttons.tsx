"use client";

import { ImportDialog } from "@/components/import-dialog";
import { ExportButton } from "@/components/export-button";
import {
  importCourses,
  importInstructors,
  importRooms,
  importStudentGroups,
  exportCoursesCSV,
  exportCoursesExcel,
  exportInstructorsCSV,
  exportInstructorsExcel,
  exportRoomsCSV,
  exportRoomsExcel,
  exportStudentGroupsCSV,
  exportStudentGroupsExcel,
} from "@/actions/import-export";
import { useRouter } from "next/navigation";

interface ImportExportButtonsProps {
  entityType: "courses" | "instructors" | "rooms" | "studentGroups";
}

const entityConfig = {
  courses: {
    label: "Courses",
    template: `code,title,duration,credits,departmentCode,roomType
CS101,Introduction to Programming,90,3,CS,LECTURE_HALL
MATH201,Calculus I,90,4,MATH,LECTURE_HALL
PHY101,Physics Lab,120,2,PHY,LAB`,
  },
  instructors: {
    label: "Instructors",
    template: `name,email,departmentCode,teachingLoad
John Smith,john.smith@university.edu,CS,20
Jane Doe,jane.doe@university.edu,MATH,18
Bob Johnson,bob.johnson@university.edu,PHY,16`,
  },
  rooms: {
    label: "Rooms",
    template: `name,building,capacity,type,equipment
A101,Building A,50,LECTURE_HALL,"PROJECTOR, WHITEBOARD"
B201,Building B,30,LAB,"COMPUTERS, PROJECTOR"
C301,Building C,100,AUDITORIUM,"SOUND SYSTEM, PROJECTOR"`,
  },
  studentGroups: {
    label: "Student Groups",
    template: `name,program,year,semester,size
CS-2024-1,Computer Science,1,1,45
MATH-2023-3,Mathematics,2,3,38
PHY-2024-1,Physics,1,1,42`,
  },
};

export function ImportExportButtons({ entityType }: ImportExportButtonsProps) {
  const router = useRouter();
  const config = entityConfig[entityType];

  const handleImportSuccess = () => {
    router.refresh();
  };

  // Get import/export actions based on entity type
  const getActions = () => {
    switch (entityType) {
      case "courses":
        return {
          import: importCourses,
          exportCSV: exportCoursesCSV,
          exportExcel: exportCoursesExcel,
        };
      case "instructors":
        return {
          import: importInstructors,
          exportCSV: exportInstructorsCSV,
          exportExcel: exportInstructorsExcel,
        };
      case "rooms":
        return {
          import: importRooms,
          exportCSV: exportRoomsCSV,
          exportExcel: exportRoomsExcel,
        };
      case "studentGroups":
        return {
          import: importStudentGroups,
          exportCSV: exportStudentGroupsCSV,
          exportExcel: exportStudentGroupsExcel,
        };
    }
  };

  const actions = getActions();

  return (
    <>
      <ImportDialog
        entityType={entityType}
        entityLabel={config.label}
        importAction={actions.import}
        onSuccess={handleImportSuccess}
        templateCSV={config.template}
      />
      <ExportButton
        entityType={entityType}
        entityLabel={config.label}
        exportCSVAction={actions.exportCSV}
        exportExcelAction={actions.exportExcel}
      />
    </>
  );
}
