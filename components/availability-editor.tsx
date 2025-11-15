"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityData {
  [key: string]: string[]; // Day -> array of time ranges like ["09:00-12:00", "14:00-17:00"]
}

interface PreferencesData {
  preferredDays?: string[];
  preferredTimes?: string[];
}

interface AvailabilityEditorProps {
  availability: AvailabilityData;
  preferences?: PreferencesData;
  onChange: (availability: AvailabilityData, preferences: PreferencesData) => void;
  readOnly?: boolean;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

// Generate time slots from 08:00 to 18:00 in 1-hour increments
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

export function AvailabilityEditor({
  availability,
  preferences = {},
  onChange,
  readOnly = false,
}: AvailabilityEditorProps) {
  const [localAvailability, setLocalAvailability] = useState<AvailabilityData>(availability);
  const [localPreferences, setLocalPreferences] = useState<PreferencesData>(preferences);
  const [selectionMode, setSelectionMode] = useState<"available" | "preferred" | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Parse availability into a grid format for easier manipulation
  const isTimeSlotAvailable = (day: string, timeSlot: string): boolean => {
    const ranges = localAvailability[day] || [];
    const slotMinutes = timeToMinutes(timeSlot);

    for (const range of ranges) {
      const [start, end] = range.split("-");
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);

      if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
        return true;
      }
    }

    return false;
  };

  const isTimeSlotPreferred = (day: string, timeSlot: string): boolean => {
    const preferredDays = localPreferences.preferredDays || [];
    const preferredTimes = localPreferences.preferredTimes || [];

    if (!preferredDays.includes(day)) {
      return false;
    }

    if (preferredTimes.length === 0) {
      return true; // If day is preferred but no specific times, all times on that day are preferred
    }

    const slotMinutes = timeToMinutes(timeSlot);

    for (const range of preferredTimes) {
      const [start, end] = range.split("-");
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);

      if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
        return true;
      }
    }

    return false;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const toggleTimeSlot = (day: string, timeSlot: string, mode: "available" | "preferred") => {
    if (readOnly) return;

    if (mode === "available") {
      toggleAvailability(day, timeSlot);
    } else {
      togglePreference(day, timeSlot);
    }
  };

  const toggleAvailability = (day: string, timeSlot: string) => {
    const newAvailability = { ...localAvailability };
    const ranges = newAvailability[day] || [];
    const slotMinutes = timeToMinutes(timeSlot);
    const slotEndMinutes = slotMinutes + 60;

    // Check if this slot is currently available
    const isAvailable = isTimeSlotAvailable(day, timeSlot);

    if (isAvailable) {
      // Remove this slot from availability
      const newRanges: string[] = [];

      for (const range of ranges) {
        const [start, end] = range.split("-");
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);

        if (slotMinutes >= startMinutes && slotEndMinutes <= endMinutes) {
          // Slot is within this range - split the range
          if (slotMinutes > startMinutes) {
            newRanges.push(`${start}-${timeSlot}`);
          }
          if (slotEndMinutes < endMinutes) {
            newRanges.push(`${minutesToTime(slotEndMinutes)}-${end}`);
          }
        } else {
          // Keep this range as is
          newRanges.push(range);
        }
      }

      newAvailability[day] = newRanges;
    } else {
      // Add this slot to availability
      const newRanges = [...ranges];
      const newRange = `${timeSlot}-${minutesToTime(slotEndMinutes)}`;

      // Try to merge with adjacent ranges
      let merged = false;
      for (let i = 0; i < newRanges.length; i++) {
        const [start, end] = newRanges[i].split("-");
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);

        // Check if new range is adjacent to this range
        if (slotEndMinutes === startMinutes) {
          // New range is just before this range
          newRanges[i] = `${timeSlot}-${end}`;
          merged = true;
          break;
        } else if (slotMinutes === endMinutes) {
          // New range is just after this range
          newRanges[i] = `${start}-${minutesToTime(slotEndMinutes)}`;
          merged = true;
          break;
        }
      }

      if (!merged) {
        newRanges.push(newRange);
      }

      // Sort and merge overlapping ranges
      newRanges.sort((a, b) => {
        const aStart = timeToMinutes(a.split("-")[0]);
        const bStart = timeToMinutes(b.split("-")[0]);
        return aStart - bStart;
      });

      // Merge overlapping or adjacent ranges
      const mergedRanges: string[] = [];
      for (const range of newRanges) {
        const [start, end] = range.split("-");
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);

        if (mergedRanges.length === 0) {
          mergedRanges.push(range);
        } else {
          const lastRange = mergedRanges[mergedRanges.length - 1];
          const [lastStart, lastEnd] = lastRange.split("-");
          const lastEndMinutes = timeToMinutes(lastEnd);

          if (startMinutes <= lastEndMinutes) {
            // Merge with last range
            const newEnd = Math.max(endMinutes, lastEndMinutes);
            mergedRanges[mergedRanges.length - 1] = `${lastStart}-${minutesToTime(newEnd)}`;
          } else {
            mergedRanges.push(range);
          }
        }
      }

      newAvailability[day] = mergedRanges;
    }

    setLocalAvailability(newAvailability);
    onChange(newAvailability, localPreferences);
  };

  const togglePreference = (day: string, timeSlot: string) => {
    const newPreferences = { ...localPreferences };
    const preferredDays = newPreferences.preferredDays || [];
    const preferredTimes = newPreferences.preferredTimes || [];

    const isPreferred = isTimeSlotPreferred(day, timeSlot);

    if (isPreferred) {
      // Remove preference
      // For simplicity, we'll remove the entire day from preferred days
      newPreferences.preferredDays = preferredDays.filter((d) => d !== day);
    } else {
      // Add preference
      if (!preferredDays.includes(day)) {
        newPreferences.preferredDays = [...preferredDays, day];
      }

      // Add time range if not already present
      const slotMinutes = timeToMinutes(timeSlot);
      const slotEndMinutes = slotMinutes + 60;
      const newRange = `${timeSlot}-${minutesToTime(slotEndMinutes)}`;

      if (!preferredTimes.some((range) => range === newRange)) {
        newPreferences.preferredTimes = [...preferredTimes, newRange];
      }
    }

    setLocalPreferences(newPreferences);
    onChange(localAvailability, newPreferences);
  };

  const handleMouseDown = (day: string, timeSlot: string, mode: "available" | "preferred") => {
    if (readOnly) return;
    setSelectionMode(mode);
    setIsSelecting(true);
    toggleTimeSlot(day, timeSlot, mode);
  };

  const handleMouseEnter = (day: string, timeSlot: string) => {
    if (readOnly || !isSelecting || !selectionMode) return;
    toggleTimeSlot(day, timeSlot, selectionMode);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionMode(null);
  };

  const setDayAvailability = (day: string, available: boolean) => {
    if (readOnly) return;

    const newAvailability = { ...localAvailability };

    if (available) {
      // Set entire day as available (08:00-18:00)
      newAvailability[day] = ["08:00-18:00"];
    } else {
      // Clear availability for this day
      newAvailability[day] = [];
    }

    setLocalAvailability(newAvailability);
    onChange(newAvailability, localPreferences);
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Weekly Availability</Label>
          <p className="text-sm text-gray-600 mt-1">
            Click and drag to mark time slots as available (green) or preferred (blue)
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
              <span>Preferred</span>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-sm font-medium text-gray-700 w-20">Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="border p-2 text-sm font-medium text-gray-700">
                    <div className="flex flex-col items-center gap-1">
                      <span>{DAY_LABELS[day]}</span>
                      {!readOnly && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDayAvailability(day, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDayAvailability(day, false)}
                          >
                            None
                          </Button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot, idx) => (
                <tr key={timeSlot}>
                  <td className="border p-2 text-sm text-gray-600 text-center bg-gray-50">
                    {timeSlot}
                  </td>
                  {DAYS.map((day) => {
                    const isAvailable = isTimeSlotAvailable(day, timeSlot);
                    const isPreferred = isTimeSlotPreferred(day, timeSlot);

                    return (
                      <td
                        key={`${day}-${timeSlot}`}
                        className={cn(
                          "border p-1 cursor-pointer select-none transition-colors",
                          isPreferred && "bg-blue-200 hover:bg-blue-300",
                          isAvailable && !isPreferred && "bg-green-200 hover:bg-green-300",
                          !isAvailable && !isPreferred && "bg-white hover:bg-gray-100",
                          readOnly && "cursor-default"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (e.button === 0) {
                            // Left click for availability
                            handleMouseDown(day, timeSlot, "available");
                          } else if (e.button === 2) {
                            // Right click for preference
                            e.preventDefault();
                            handleMouseDown(day, timeSlot, "preferred");
                          }
                        }}
                        onMouseEnter={() => handleMouseEnter(day, timeSlot)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!readOnly) {
                            handleMouseDown(day, timeSlot, "preferred");
                          }
                        }}
                      >
                        <div className="h-8 flex items-center justify-center">
                          {isPreferred && (
                            <span className="text-xs text-blue-700 font-medium">★</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>• Left-click and drag to mark time slots as available</p>
        <p>• Right-click or Ctrl+click to mark available slots as preferred</p>
        <p>• Click &quot;All&quot; to mark entire day as available, &quot;None&quot; to clear</p>
      </div>
    </div>
  );
}
