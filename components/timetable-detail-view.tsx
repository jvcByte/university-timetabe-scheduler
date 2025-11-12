"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar-view";
import { TimetableFilterPanel } from "@/components/timetable-filter-panel";
import { AlertTriangle } from "lucide-react";

interface Assignment {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  course: {
    id: number;
    code: string;
    title: string;
  };
  instructor: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
    building: string;
  };
  group: {
    id: number;
    name: string;
  };
}

interface FilterOptions {
  rooms: Array<{ id: number; name: string; building: string }>;
  instructors: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}

interface TimetableDetailViewProps {
  timetableId: number;
  initialAssignments: Assignment[];
  filterOptions: FilterOptions;
  violations?: any[];
}

export function TimetableDetailView({
  timetableId,
  initialAssignments,
  filterOptions,
  violations = [],
}: TimetableDetailViewProps) {
  const [filteredAssignments, setFilteredAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [activeFilters, setActiveFilters] = useState<{
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Apply filters client-side for better performance
  const handleFilterChange = (filters: {
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }) => {
    setActiveFilters(filters);

    // Filter assignments based on selected filters
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

  // Convert violations to conflicts format for CalendarView
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
                The timetable has {violations.length} soft constraint
                violations. These are preferences that could not be fully
                satisfied.
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
            Showing <span className="font-semibold">{filteredAssignments.length}</span> of{" "}
            <span className="font-semibold">{initialAssignments.length}</span> assignments
          </p>
        </div>
      )}

      {/* Calendar View */}
      <CalendarView assignments={filteredAssignments} conflicts={conflicts} />
    </div>
  );
}
