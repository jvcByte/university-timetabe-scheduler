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
  createCourse,
  updateCourse,
  type CourseInput,
} from "@/actions/courses";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Department } from "@/lib/departments";

const courseFormSchema = z.object({
  code: z
    .string()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be at most 20 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Course code must contain only uppercase letters, numbers, and hyphens"
    ),
  title: z
    .string()
    .min(3, "Course title must be at least 3 characters")
    .max(200, "Course title must be at most 200 characters"),
  duration: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(30, "Duration must be at least 30 minutes")
    .max(300, "Duration must be at most 300 minutes"),
  credits: z.coerce
    .number()
    .int("Credits must be an integer")
    .min(1, "Credits must be at least 1")
    .max(10, "Credits must be at most 10"),
  departmentId: z.coerce
    .number()
    .int("Department ID must be an integer")
    .positive("Department must be selected"),
  roomType: z.string().max(50, "Room type must be at most 50 characters").optional(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: {
    id: number;
    code: string;
    title: string;
    duration: number;
    credits: number;
    department: {
      id: number;
      name: string;
    };
    roomType: string | null;
  };
  departments: Department[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CourseForm({ course, departments, onSuccess, onCancel }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course
      ? {
          code: course.code,
          title: course.title,
          duration: course.duration,
          credits: course.credits,
          departmentId: course.department.id,
          roomType: course.roomType || "",
        }
      : {
          duration: 60,
          credits: 3,
        },
  });

  const departmentId = watch("departmentId");

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);

    try {
      const input: CourseInput = {
        code: data.code,
        title: data.title,
        duration: data.duration,
        credits: data.credits,
        departmentId: data.departmentId,
        roomType: data.roomType || null,
        instructorIds: [],
        groupIds: [],
      };

      const result = course
        ? await updateCourse({ id: course.id, ...input })
        : await createCourse(input);

      if (result.success) {
        toast({
          title: "Success",
          description: course
            ? "Course updated successfully"
            : "Course created successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/courses");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Course Code *</Label>
        <Input
          id="code"
          {...register("code")}
          placeholder="CSC101"
          disabled={isSubmitting}
        />
        {errors.code && (
          <p className="text-sm text-red-600">{errors.code.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Introduction to Computer Science"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input
            id="duration"
            type="number"
            {...register("duration")}
            placeholder="60"
            disabled={isSubmitting}
          />
          {errors.duration && (
            <p className="text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="credits">Credits *</Label>
          <Input
            id="credits"
            type="number"
            {...register("credits")}
            placeholder="3"
            disabled={isSubmitting}
          />
          {errors.credits && (
            <p className="text-sm text-red-600">{errors.credits.message}</p>
          )}
        </div>
      </div>

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
        <Label htmlFor="roomType">Room Type</Label>
        <Input
          id="roomType"
          {...register("roomType")}
          placeholder="LAB, LECTURE_HALL, etc."
          disabled={isSubmitting}
        />
        {errors.roomType && (
          <p className="text-sm text-red-600">{errors.roomType.message}</p>
        )}
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
          {course ? "Update Course" : "Create Course"}
        </Button>
      </div>
    </form>
  );
}
