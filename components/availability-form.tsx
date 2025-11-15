"use client";

import { useState } from "react";
import { AvailabilityEditor } from "@/components/availability-editor";
import { Button } from "@/components/ui/button";
import { updateInstructorAvailability } from "@/actions/instructors";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { validateTimeSlot } from "@/lib/validation";

interface AvailabilityFormProps {
  instructorId: number;
  availability: Record<string, string[]>;
  preferences?: { preferredDays?: string[]; preferredTimes?: string[] };
}

export function AvailabilityForm({
  instructorId,
  availability: initialAvailability,
  preferences: initialPreferences,
}: AvailabilityFormProps) {
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    initialAvailability || {}
  );
  const [preferences, setPreferences] = useState<{
    preferredDays?: string[];
    preferredTimes?: string[];
  }>(initialPreferences || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const { toast } = useToast();

  const handleChange = (
    newAvailability: Record<string, string[]>,
    newPreferences: { preferredDays?: string[]; preferredTimes?: string[] }
  ) => {
    setAvailability(newAvailability);
    setPreferences(newPreferences);
    setValidationError("");
  };

  const validateAvailability = (): boolean => {
    // Validate all time slots
    for (const [day, slots] of Object.entries(availability)) {
      for (const slot of slots) {
        const validation = validateTimeSlot(slot);
        if (!validation.valid) {
          setValidationError(`Invalid time slot on ${day}: ${validation.error}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate before submitting
    if (!validateAvailability()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateInstructorAvailability(
        instructorId,
        availability,
        preferences
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Your availability has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update availability.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {validationError}
        </div>
      )}

      <AvailabilityEditor
        availability={availability}
        preferences={preferences}
        onChange={handleChange}
      />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAvailability(initialAvailability || {});
            setPreferences(initialPreferences || {});
            setValidationError("");
          }}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Availability
        </Button>
      </div>
    </form>
  );
}
