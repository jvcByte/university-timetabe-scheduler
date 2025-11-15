"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateConstraintConfig } from "@/actions/constraints";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { validateWorkingHours } from "@/lib/validation";

interface ConstraintConfig {
  id: number;
  name: string;
  isDefault: boolean;
  noRoomDoubleBooking: boolean;
  noInstructorDoubleBooking: boolean;
  roomCapacityCheck: boolean;
  roomTypeMatch: boolean;
  workingHoursOnly: boolean;
  instructorPreferencesWeight: number;
  compactSchedulesWeight: number;
  balancedDailyLoadWeight: number;
  preferredRoomsWeight: number;
  workingHoursStart: string;
  workingHoursEnd: string;
}

interface ConstraintEditorProps {
  config: ConstraintConfig;
  onSuccess?: () => void;
}

const HARD_CONSTRAINTS = [
  {
    key: "noRoomDoubleBooking" as const,
    label: "No Room Double-Booking",
    description:
      "Ensures that no room is assigned to multiple courses at the same time",
  },
  {
    key: "noInstructorDoubleBooking" as const,
    label: "No Instructor Double-Booking",
    description:
      "Ensures that no instructor is assigned to multiple courses at the same time",
  },
  {
    key: "roomCapacityCheck" as const,
    label: "Room Capacity Check",
    description:
      "Ensures that the room capacity is greater than or equal to the student group size",
  },
  {
    key: "roomTypeMatch" as const,
    label: "Room Type Match",
    description:
      "Ensures that specialized courses are assigned to appropriate room types (e.g., labs for lab courses)",
  },
  {
    key: "workingHoursOnly" as const,
    label: "Working Hours Only",
    description:
      "Ensures that all classes are scheduled within the defined working hours",
  },
];

const SOFT_CONSTRAINTS = [
  {
    key: "instructorPreferencesWeight" as const,
    label: "Instructor Preferences",
    description:
      "Prioritizes scheduling courses during instructors' preferred time slots",
  },
  {
    key: "compactSchedulesWeight" as const,
    label: "Compact Schedules",
    description:
      "Minimizes gaps between classes for student groups to create more efficient schedules",
  },
  {
    key: "balancedDailyLoadWeight" as const,
    label: "Balanced Daily Load",
    description:
      "Distributes courses evenly across days to avoid overloading specific days",
  },
  {
    key: "preferredRoomsWeight" as const,
    label: "Preferred Rooms",
    description:
      "Assigns courses to preferred rooms when possible (e.g., department-specific rooms)",
  },
];

export function ConstraintEditor({ config, onSuccess }: ConstraintEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const { toast } = useToast();
  const router = useRouter();

  // Hard constraints state
  const [hardConstraints, setHardConstraints] = useState({
    noRoomDoubleBooking: config.noRoomDoubleBooking,
    noInstructorDoubleBooking: config.noInstructorDoubleBooking,
    roomCapacityCheck: config.roomCapacityCheck,
    roomTypeMatch: config.roomTypeMatch,
    workingHoursOnly: config.workingHoursOnly,
  });

  // Soft constraints state
  const [softConstraints, setSoftConstraints] = useState({
    instructorPreferencesWeight: config.instructorPreferencesWeight,
    compactSchedulesWeight: config.compactSchedulesWeight,
    balancedDailyLoadWeight: config.balancedDailyLoadWeight,
    preferredRoomsWeight: config.preferredRoomsWeight,
  });

  // Working hours state
  const [workingHours, setWorkingHours] = useState({
    start: config.workingHoursStart,
    end: config.workingHoursEnd,
  });

  const handleHardConstraintToggle = (key: keyof typeof hardConstraints) => {
    setHardConstraints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSoftConstraintChange = (
    key: keyof typeof softConstraints,
    value: number[]
  ) => {
    setSoftConstraints((prev) => ({
      ...prev,
      [key]: value[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate working hours
    const workingHoursValidation = validateWorkingHours(
      workingHours.start,
      workingHours.end
    );
    if (!workingHoursValidation.valid) {
      setValidationError(workingHoursValidation.error || "Invalid working hours");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateConstraintConfig({
        id: config.id,
        ...hardConstraints,
        ...softConstraints,
        workingHoursStart: workingHours.start,
        workingHoursEnd: workingHours.end,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Constraint configuration updated successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-8">
        {validationError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {validationError}
          </div>
        )}

        {/* Hard Constraints Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Hard Constraints</h3>
            <p className="text-sm text-gray-600">
              These constraints must always be satisfied. Disabling them may
              result in invalid timetables.
            </p>
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            {HARD_CONSTRAINTS.map((constraint) => (
              <div
                key={constraint.key}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Label
                    htmlFor={constraint.key}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {constraint.label}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{constraint.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id={constraint.key}
                  checked={hardConstraints[constraint.key]}
                  onCheckedChange={() =>
                    handleHardConstraintToggle(constraint.key)
                  }
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Soft Constraints Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Soft Constraints</h3>
            <p className="text-sm text-gray-600">
              These constraints are preferences that the system will try to
              optimize. Higher weights mean higher priority (0-10 scale).
            </p>
          </div>

          <div className="space-y-6 border rounded-lg p-4 bg-gray-50">
            {SOFT_CONSTRAINTS.map((constraint) => (
              <div key={constraint.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">
                      {constraint.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{constraint.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-semibold min-w-[2rem] text-right">
                    {softConstraints[constraint.key]}
                  </span>
                </div>
                <Slider
                  value={[softConstraints[constraint.key]]}
                  onValueChange={(value) =>
                    handleSoftConstraintChange(constraint.key, value)
                  }
                  min={0}
                  max={10}
                  step={1}
                  disabled={isSubmitting}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low Priority (0)</span>
                  <span>High Priority (10)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Working Hours Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Working Hours</h3>
            <p className="text-sm text-gray-600">
              Define the time range during which classes can be scheduled.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Start Time</Label>
              <Input
                id="workingHoursStart"
                type="time"
                value={workingHours.start}
                onChange={(e) =>
                  setWorkingHours((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">End Time</Label>
              <Input
                id="workingHoursEnd"
                type="time"
                value={workingHours.end}
                onChange={(e) =>
                  setWorkingHours((prev) => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
}
