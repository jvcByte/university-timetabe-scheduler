"use client";

import { useState } from "react";
import { EditableCalendarView } from "@/components/editable-calendar-view";
import { AssignmentEditDialog } from "@/components/assignment-edit-dialog";
import { TimetableFilterPanel } from "@/components/timetable-filter-panel";
import { updateAssignment } from "@/actions/timetables";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  course: {
    id: number;
    code: string;
    title: string;
    duration: number;
  };
  instructor: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
    building: string;
    capacity: number;
  };
  group: {
    id: number;
    name: string;
    size: number;
  };
}

interface FilterOptions {
  rooms: Array<{ id: number; name: string; building: string; capacity: number }>;
  instructors: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}

interface EditableTimetableViewProps {
  timetableId: number;
  initialAssignments: Assignment[];
  filterOptions: FilterOptions;
  allRooms: Array<{ id: number; name: string; building: string; capacity: number }>;
  allInstructors: Array<{ id: number; name: string }>;
  violations?: any[];
}

export function EditableTimetableView({
  timetableId,
  initialAssignments,
  filterOptions,
  allRooms,
  allInstructors,
  violations = [],
}: EditableTimetableViewProps) {
  const router = useRouter();
  const [filteredAssignments, setFilteredAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [activeFilters, setActiveFilters] = useState<{
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Apply filters client-side
  const handleFilterChange = (filters: {
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }) => {
    setActiveFilters(filters);

    let filtered = initialAssignments;

    if (filters.roomId) {
      filtered = filtered.filter(
        (assignment) => assignment.room.id === filters.roomId
      );
    }

    if (filters.instructorId) {
      filtered = filtered.filter(
        (assignment) => assignment.instructor.id === filters.instructorId
      );
    }

    if (filters.groupId) {
      filtered = filtered.filter(
        (assignment) => assignment.group.id === filters.groupId
      );
    }

    setFilteredAssignments(filtered);
  };

  // Handle assignment move via drag and drop
  const handleAssignmentMove = async (
    assignmentId: number,
    newDay: string,
    newStartTime: string
  ) => {
    const result = await updateAssignment({
      assignmentId,
      day: newDay,
      startTime: newStartTime,
    });

    if (result.success) {
      router.refresh();
    }

    return result;
  };

  // Handle assignment click to open edit dialog
  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  // Handle assignment save from dialog
  const handleAssignmentSave = async (
    assignmentId: number,
    updates: {
      day?: string;
      startTime?: string;
      roomId?: number;
      instructorId?: number;
    }
  ) => {
    const result = await updateAssignment({
      assignmentId,
      ...updates,
    });

    if (result.success) {
      router.refresh();
    }

    return result;
  };

  // Convert violations to conflicts format
  const conflicts =
    violations?.map((violation: any) => ({
      assignmentIds: violation.affected_assignments || [],
      type: violation.constraint_type || "unknown",
      description: violation.description || "Constraint violation",
    })) || [];

  return (
    <div className="space-y-6">
      {/* Violations Alert */}
      {violations && violations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                Soft Constraint Violations
              </p>
              <p className="text-sm text-amber-700 mt-1">
                The timetable has {violations.length} soft constraint violations.
                These are preferences that could not be fully satisfied.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <TimetableFilterPanel
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Results Summary */}
      {(activeFilters.roomId ||
        activeFilters.instructorId ||
        activeFilters.groupId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Showing{" "}
            <span className="font-semibold">{filteredAssignments.length}</span> of{" "}
            <span className="font-semibold">{initialAssignments.length}</span>{" "}
            assignments
          </p>
        </div>
      )}

      {/* Editable Calendar View */}
      <EditableCalendarView
        assignments={filteredAssignments}
        conflicts={conflicts}
        onAssignmentMove={handleAssignmentMove}
        onAssignmentClick={handleAssignmentClick}
      />

      {/* Assignment Edit Dialog */}
      <AssignmentEditDialog
        assignment={selectedAssignment}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleAssignmentSave}
        availableRooms={allRooms}
        availableInstructors={allInstructors}
      />
    </div>
  );
}
