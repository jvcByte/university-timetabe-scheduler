"use client";

import { useState } from "react";
import { AvailabilityEditor } from "@/components/availability-editor";
import { Button } from "@/components/ui/button";
import { updateInstructorAvailability } from "@/actions/instructors";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const { toast } = useToast();

  const handleChange = (
    newAvailability: Record<string, string[]>,
    newPreferences: { preferredDays?: string[]; preferredTimes?: string[] }
  ) => {
    setAvailability(newAvailability);
    setPreferences(newPreferences);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
