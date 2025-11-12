"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";

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

interface CalendarViewProps {
  assignments: Assignment[];
  conflicts?: Array<{
    assignmentIds: number[];
    type: string;
    description: string;
  }>;
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Generate color based on course code for consistency
function getCourseColor(courseCode: string): string {
  const colors = [
    "bg-blue-100 border-blue-300 text-blue-900",
    "bg-green-100 border-green-300 text-green-900",
    "bg-purple-100 border-purple-300 text-purple-900",
    "bg-pink-100 border-pink-300 text-pink-900",
    "bg-indigo-100 border-indigo-300 text-indigo-900",
    "bg-yellow-100 border-yellow-300 text-yellow-900",
    "bg-red-100 border-red-300 text-red-900",
    "bg-teal-100 border-teal-300 text-teal-900",
  ];

  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function CalendarView({ assignments, conflicts = [] }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");

  // Group assignments by day
  const assignmentsByDay = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.day]) {
      acc[assignment.day] = [];
    }
    acc[assignment.day].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  // Check if assignment has conflicts
  const hasConflict = (assignmentId: number): boolean => {
    return conflicts.some((conflict) =>
      conflict.assignmentIds.includes(assignmentId)
    );
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    const colorClass = getCourseColor(assignment.course.code);
    const isConflicted = hasConflict(assignment.id);
    const conflictClass = isConflicted
      ? "ring-2 ring-red-500 ring-offset-1"
      : "";

    return (
      <div
        key={assignment.id}
        className={`${colorClass} ${conflictClass} border-l-4 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {assignment.course.code}
              </span>
              <span className="text-xs opacity-75">
                {assignment.startTime} - {assignment.endTime}
              </span>
            </div>
            <p className="text-xs font-medium truncate mb-1">
              {assignment.course.title}
            </p>
            <div className="text-xs opacity-75 space-y-0.5">
              <p className="truncate">👤 {assignment.instructor.name}</p>
              <p className="truncate">
                📍 {assignment.room.name} ({assignment.room.building})
              </p>
              <p className="truncate">👥 {assignment.group.name}</p>
            </div>
          </div>
        </div>
        {isConflicted && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            ⚠️ Conflict detected
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const displayDays = DAYS.filter(
      (day) => assignmentsByDay[day] && assignmentsByDay[day].length > 0
    );

    if (displayDays.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No assignments scheduled
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displayDays.map((day) => (
          <div key={day} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-center">
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </h3>
            <div className="space-y-2">
              {assignmentsByDay[day]
                .sort(
                  (a, b) =>
                    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                )
                .map((assignment) => renderAssignmentCard(assignment))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayAssignments = assignmentsByDay[selectedDay] || [];

    if (dayAssignments.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No assignments scheduled for this day
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-2">
            {dayAssignments
              .sort(
                (a, b) =>
                  timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
              )
              .map((assignment) => renderAssignmentCard(assignment))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Week View
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            <List className="h-4 w-4 mr-2" />
            Day View
          </Button>
        </div>

        {viewMode === "day" && (
          <div className="flex gap-2">
            {DAYS.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {viewMode === "week" ? renderWeekView() : renderDayView()}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-300 rounded"></div>
            <span>Different colors represent different courses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
            <span>Red border indicates conflicts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
