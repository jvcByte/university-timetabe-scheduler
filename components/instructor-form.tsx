"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  createInstructor,
  updateInstructor,
  type InstructorInput,
} from "@/actions/instructors";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Department } from "@/lib/departments";

const availabilitySchema = z.record(
  z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Time slot must be in format HH:MM-HH:MM"))
);

const instructorFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  departmentId: z.coerce
    .number()
    .int("Department ID must be an integer")
    .positive("Department must be selected"),
  teachingLoad: z.coerce
    .number()
    .int("Teaching load must be an integer")
    .min(1, "Teaching load must be at least 1 hour")
    .max(40, "Teaching load must be at most 40 hours"),
  availability: availabilitySchema,
});

type InstructorFormData = z.infer<typeof instructorFormSchema>;

interface InstructorFormProps {
  instructor?: {
    id: number;
    name: string;
    email: string;
    department: {
      id: number;
      name: string;
    };
    teachingLoad: number;
    availability: any;
    preferences: any;
  };
  departments: Department[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export function InstructorForm({ instructor, departments, onSuccess, onCancel }: InstructorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize availability state
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    instructor?.availability || {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    }
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Omit<InstructorFormData, "availability">>({
    resolver: zodResolver(instructorFormSchema.omit({ availability: true })),
    defaultValues: instructor
      ? {
          name: instructor.name,
          email: instructor.email,
          departmentId: instructor.department.id,
          teachingLoad: instructor.teachingLoad,
        }
      : {
          teachingLoad: 20,
        },
  });

  const departmentId = watch("departmentId");

  const addTimeSlot = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...prev[day], "09:00-10:00"],
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (day: string, index: number, value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) => (i === index ? value : slot)),
    }));
  };

  const onSubmit = async (data: Omit<InstructorFormData, "availability">) => {
    setIsSubmitting(true);

    try {
      // Validate availability
      const validationResult = availabilitySchema.safeParse(availability);
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: "Please check the availability time slots format (HH:MM-HH:MM)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const input: InstructorInput = {
        name: data.name,
        email: data.email,
        departmentId: data.departmentId,
        teachingLoad: data.teachingLoad,
        availability: validationResult.data,
        preferences: null,
        userId: null,
      };

      const result = instructor
        ? await updateInstructor({ id: instructor.id, ...input })
        : await createInstructor(input);

      if (result.success) {
        toast({
          title: "Success",
          description: instructor
            ? "Instructor updated successfully"
            : "Instructor created successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/instructors");
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Dr. John Smith"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="john.smith@university.edu"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department *</Label>
            <Select
              value={departmentId?.toString()}
              onValueChange={(value) => setValue("departmentId", Number(value))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <p className="text-sm text-red-600">{errors.departmentId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teachingLoad">Teaching Load (hours/week) *</Label>
            <Input
              id="teachingLoad"
              type="number"
              {...register("teachingLoad")}
              placeholder="20"
              disabled={isSubmitting}
            />
            {errors.teachingLoad && (
              <p className="text-sm text-red-600">{errors.teachingLoad.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Availability *</Label>
          <p className="text-sm text-gray-500">Format: HH:MM-HH:MM (e.g., 09:00-12:00)</p>
        </div>

        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          {DAYS.map((day) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{day}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day)}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Slot
                </Button>
              </div>

              {availability[day].length === 0 ? (
                <p className="text-sm text-gray-500 italic">No availability set</p>
              ) : (
                <div className="space-y-2">
                  {availability[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={slot}
                        onChange={(e) => updateTimeSlot(day, index, e.target.value)}
                        placeholder="09:00-12:00"
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(day, index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {instructor ? "Update Instructor" : "Create Instructor"}
        </Button>
      </div>
    </form>
  );
}
