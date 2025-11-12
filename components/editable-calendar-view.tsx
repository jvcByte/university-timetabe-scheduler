"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Calendar, List, AlertTriangle } from "lucide-react";

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

interface ConflictInfo {
  type: string;
  message: string;
}

interface EditableCalendarViewProps {
  assignments: Assignment[];
  conflicts?: Array<{
    assignmentIds: number[];
    type: string;
    description: string;
  }>;
  onAssignmentMove: (
    assignmentId: number,
    newDay: string,
    newStartTime: string
  ) => Promise<{ success: boolean; error?: string; conflicts?: ConflictInfo[] }>;
  onAssignmentClick?: (assignment: Assignment) => void;
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

export function EditableCalendarView({
  assignments,
  conflicts = [],
  onAssignmentMove,
  onAssignmentClick,
}: EditableCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dragConflicts, setDragConflicts] = useState<ConflictInfo[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setDragConflicts([]);
  };

  // Client-side validation function
  const validateMove = (
    assignment: Assignment,
    newDay: string,
    newStartTime: string
  ): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const duration = timeToMinutes(assignment.endTime) - timeToMinutes(assignment.startTime);
    const newEndMinutes = timeToMinutes(newStartTime) + duration;
    const newEndHours = Math.floor(newEndMinutes / 60);
    const newEndMins = newEndMinutes % 60;
    const newEndTime = `${String(newEndHours).padStart(2, "0")}:${String(newEndMins).padStart(2, "0")}`;

    // Check for room conflicts
    const roomConflicts = assignments.filter(
      (a) =>
        a.id !== assignment.id &&
        a.day === newDay &&
        a.room.id === assignment.room.id &&
        ((timeToMinutes(a.startTime) < newEndMinutes &&
          timeToMinutes(a.endTime) > timeToMinutes(newStartTime)))
    );

    if (roomConflicts.length > 0) {
      conflicts.push({
        type: "room_conflict",
        message: `Room ${assignment.room.name} is already booked at this time`,
      });
    }

    // Check for instructor conflicts
    const instructorConflicts = assignments.filter(
      (a) =>
        a.id !== assignment.id &&
        a.day === newDay &&
        a.instructor.id === assignment.instructor.id &&
        ((timeToMinutes(a.startTime) < newEndMinutes &&
          timeToMinutes(a.endTime) > timeToMinutes(newStartTime)))
    );

    if (instructorConflicts.length > 0) {
      conflicts.push({
        type: "instructor_conflict",
        message: `Instructor ${assignment.instructor.name} is already teaching at this time`,
      });
    }

    // Check for student group conflicts
    const groupConflicts = assignments.filter(
      (a) =>
        a.id !== assignment.id &&
        a.day === newDay &&
        a.group.id === assignment.group.id &&
        ((timeToMinutes(a.startTime) < newEndMinutes &&
          timeToMinutes(a.endTime) > timeToMinutes(newStartTime)))
    );

    if (groupConflicts.length > 0) {
      conflicts.push({
        type: "group_conflict",
        message: `Student group ${assignment.group.name} already has a class at this time`,
      });
    }

    return conflicts;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const assignmentId = active.id as number;
    const dropTarget = over.id as string;

    // Parse drop target: format is "day-time" (e.g., "MONDAY-09:00")
    const [newDay, newStartTime] = dropTarget.split("-");

    if (!newDay || !newStartTime) {
      return;
    }

    // Find the assignment being moved
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      return;
    }

    // Check if actually moved
    if (assignment.day === newDay && assignment.startTime === newStartTime) {
      return;
    }

    // Perform client-side validation
    const validationConflicts = validateMove(assignment, newDay, newStartTime);
    if (validationConflicts.length > 0) {
      setDragConflicts(validationConflicts);
      return;
    }

    // Update assignment
    setIsUpdating(true);
    setDragConflicts([]);

    try {
      const result = await onAssignmentMove(assignmentId, newDay, newStartTime);

      if (!result.success) {
        if (result.conflicts && result.conflicts.length > 0) {
          setDragConflicts(result.conflicts);
        } else if (result.error) {
          setDragConflicts([
            {
              type: "server_error",
              message: result.error,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to move assignment:", error);
      setDragConflicts([
        {
          type: "error",
          message: "Failed to update assignment. Please try again.",
        },
      ]);
    } finally {
      setIsUpdating(false);
    }
  };

  // Draggable Assignment Card Component
  const DraggableAssignment = ({ assignment }: { assignment: Assignment }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: assignment.id,
    });

    const colorClass = getCourseColor(assignment.course.code);
    const isConflicted = hasConflict(assignment.id);
    const conflictClass = isConflicted
      ? "ring-2 ring-red-500 ring-offset-1"
      : "";
    const draggingClass = isDragging ? "opacity-50" : "";

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`${colorClass} ${conflictClass} ${draggingClass} border-l-4 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-move`}
        onClick={() => onAssignmentClick?.(assignment)}
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

  // Droppable Time Slot Component
  const DroppableTimeSlot = ({
    day,
    time,
    children,
  }: {
    day: string;
    time: string;
    children?: React.ReactNode;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `${day}-${time}`,
    });

    // Check if dropping here would cause conflicts
    let wouldConflict = false;
    if (isOver && activeId) {
      const assignment = assignments.find((a) => a.id === activeId);
      if (assignment) {
        const conflicts = validateMove(assignment, day, time);
        wouldConflict = conflicts.length > 0;
      }
    }

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[80px] p-2 rounded border-2 border-dashed transition-colors ${
          isOver && wouldConflict
            ? "border-red-500 bg-red-50"
            : isOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 bg-gray-50/50"
        }`}
      >
        {children}
        {isOver && wouldConflict && (
          <div className="text-xs text-red-600 font-medium mt-1">
            ⚠️ Conflict
          </div>
        )}
      </div>
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
        className={`${colorClass} ${conflictClass} border-l-4 rounded-lg p-3 shadow-sm`}
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

  const activeAssignment = activeId
    ? assignments.find((a) => a.id === activeId)
    : null;

  const renderWeekView = () => {
    // Create a grid with time slots
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="font-medium text-sm text-gray-600 p-2">Time</div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="font-bold text-sm text-gray-900 text-center p-2"
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="space-y-2">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 gap-2">
                <div className="text-sm text-gray-600 p-2 font-medium">
                  {time}
                </div>
                {DAYS.map((day) => {
                  // Find assignments for this day and time
                  const slotAssignments = (assignmentsByDay[day] || []).filter(
                    (a) => a.startTime === time
                  );

                  return (
                    <DroppableTimeSlot key={`${day}-${time}`} day={day} time={time}>
                      {slotAssignments.map((assignment) => (
                        <DraggableAssignment
                          key={assignment.id}
                          assignment={assignment}
                        />
                      ))}
                    </DroppableTimeSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="space-y-3">
          {TIME_SLOTS.map((time) => {
            const slotAssignments = (assignmentsByDay[selectedDay] || []).filter(
              (a) => a.startTime === time
            );

            return (
              <div key={time} className="flex gap-4">
                <div className="w-20 text-sm text-gray-600 font-medium pt-2">
                  {time}
                </div>
                <div className="flex-1">
                  <DroppableTimeSlot day={selectedDay} time={time}>
                    {slotAssignments.map((assignment) => (
                      <DraggableAssignment
                        key={assignment.id}
                        assignment={assignment}
                      />
                    ))}
                  </DroppableTimeSlot>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Drag Conflicts Alert */}
      {dragConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Cannot Move Assignment</p>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {dragConflicts.map((conflict, idx) => (
                  <li key={idx}>• {conflict.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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

      {/* Calendar Content with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-lg shadow-md p-6 relative">
          {isUpdating && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
              <div className="text-gray-600">Updating assignment...</div>
            </div>
          )}
          {viewMode === "week" ? renderWeekView() : renderDayView()}
        </div>

        <DragOverlay>
          {activeAssignment ? (
            <div className="w-64">
              {renderAssignmentCard(activeAssignment)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
          <div className="flex items-center gap-2">
            <span className="text-gray-500">💡 Drag assignments to reschedule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
