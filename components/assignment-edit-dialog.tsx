"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AssignmentEditDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    assignmentId: number,
    updates: {
      day?: string;
      startTime?: string;
      roomId?: number;
      instructorId?: number;
    }
  ) => Promise<{ success: boolean; error?: string; conflicts?: ConflictInfo[] }>;
  availableRooms: Array<{ id: number; name: string; building: string; capacity: number }>;
  availableInstructors: Array<{ id: number; name: string }>;
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

const assignmentSchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  roomId: z.number().min(1, "Room is required"),
  instructorId: z.number().min(1, "Instructor is required"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export function AssignmentEditDialog({
  assignment,
  open,
  onOpenChange,
  onSave,
  availableRooms,
  availableInstructors,
}: AssignmentEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  const selectedRoomId = watch("roomId");
  const selectedInstructorId = watch("instructorId");

  // Reset form when assignment changes
  useEffect(() => {
    if (assignment) {
      reset({
        day: assignment.day,
        startTime: assignment.startTime,
        roomId: assignment.room.id,
        instructorId: assignment.instructor.id,
      });
      setConflicts([]);
    }
  }, [assignment, reset]);

  const onSubmit = async (data: AssignmentFormData) => {
    if (!assignment) return;

    setIsSaving(true);
    setConflicts([]);

    try {
      // Determine what changed
      const updates: any = {};
      if (data.day !== assignment.day) updates.day = data.day;
      if (data.startTime !== assignment.startTime) updates.startTime = data.startTime;
      if (data.roomId !== assignment.room.id) updates.roomId = data.roomId;
      if (data.instructorId !== assignment.instructor.id)
        updates.instructorId = data.instructorId;

      // If nothing changed, just close
      if (Object.keys(updates).length === 0) {
        onOpenChange(false);
        return;
      }

      const result = await onSave(assignment.id, updates);

      if (result.success) {
        onOpenChange(false);
      } else {
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
        } else if (result.error) {
          setConflicts([
            {
              type: "error",
              message: result.error,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to save assignment:", error);
      setConflicts([
        {
          type: "error",
          message: "Failed to save changes. Please try again.",
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (!assignment) return null;

  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const roomCapacityWarning =
    selectedRoom && selectedRoom.capacity < assignment.group.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            {assignment.course.code} - {assignment.course.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Cannot Save Changes
                  </p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>• {conflict.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Course Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Student Group:</span>{" "}
              <span className="font-medium">{assignment.group.name}</span>
              <span className="text-gray-500 ml-2">
                ({assignment.group.size} students)
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Duration:</span>{" "}
              <span className="font-medium">{assignment.course.duration} minutes</span>
            </div>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Select
              value={watch("day")}
              onValueChange={(value) => setValue("day", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.day && (
              <p className="text-sm text-red-600">{errors.day.message}</p>
            )}
          </div>

          {/* Start Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select
              value={watch("startTime")}
              onValueChange={(value) => setValue("startTime", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startTime && (
              <p className="text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="roomId">Room</Label>
            <Select
              value={selectedRoomId?.toString()}
              onValueChange={(value) => setValue("roomId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name} ({room.building}) - Capacity: {room.capacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-sm text-red-600">{errors.roomId.message}</p>
            )}
            {roomCapacityWarning && (
              <p className="text-sm text-amber-600">
                ⚠️ Room capacity ({selectedRoom.capacity}) is less than group size (
                {assignment.group.size})
              </p>
            )}
          </div>

          {/* Instructor Selection */}
          <div className="space-y-2">
            <Label htmlFor="instructorId">Instructor</Label>
            <Select
              value={selectedInstructorId?.toString()}
              onValueChange={(value) => setValue("instructorId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {availableInstructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.instructorId && (
              <p className="text-sm text-red-600">{errors.instructorId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
