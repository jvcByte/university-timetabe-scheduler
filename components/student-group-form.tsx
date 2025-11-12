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
  createStudentGroup,
  updateStudentGroup,
  type StudentGroupInput,
} from "@/actions/student-groups";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

const studentGroupFormSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name must be at most 100 characters"),
  program: z
    .string()
    .min(2, "Program must be at least 2 characters")
    .max(100, "Program must be at most 100 characters"),
  year: z.coerce
    .number()
    .int("Year must be an integer")
    .min(1, "Year must be at least 1")
    .max(10, "Year must be at most 10"),
  semester: z.coerce
    .number()
    .int("Semester must be an integer")
    .min(1, "Semester must be at least 1")
    .max(2, "Semester must be at most 2"),
  size: z.coerce
    .number()
    .int("Size must be an integer")
    .min(1, "Group size must be at least 1")
    .max(500, "Group size must be at most 500"),
});

type StudentGroupFormData = z.infer<typeof studentGroupFormSchema>;

interface Course {
  id: number;
  code: string;
  title: string;
  department: {
    name: string;
  };
}

interface StudentGroupFormProps {
  group?: {
    id: number;
    name: string;
    program: string;
    year: number;
    semester: number;
    size: number;
    courses: {
      course: Course;
    }[];
  };
  courses: Course[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StudentGroupForm({
  group,
  courses,
  onSuccess,
  onCancel,
}: StudentGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>(
    group?.courses.map((c) => c.course.id) || []
  );
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentGroupFormData>({
    resolver: zodResolver(studentGroupFormSchema),
    defaultValues: group
      ? {
          name: group.name,
          program: group.program,
          year: group.year,
          semester: group.semester,
          size: group.size,
        }
      : {
          year: 1,
          semester: 1,
          size: 30,
        },
  });

  const year = watch("year");
  const semester = watch("semester");

  const onSubmit = async (data: StudentGroupFormData) => {
    setIsSubmitting(true);

    try {
      const input: StudentGroupInput = {
        name: data.name,
        program: data.program,
        year: data.year,
        semester: data.semester,
        size: data.size,
        courseIds: selectedCourseIds,
      };

      const result = group
        ? await updateStudentGroup({ id: group.id, ...input })
        : await createStudentGroup(input);

      if (result.success) {
        toast({
          title: "Success",
          description: group
            ? "Student group updated successfully"
            : "Student group created successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/groups");
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

  const handleAddCourse = (courseId: number) => {
    if (!selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
    setCourseSearchQuery("");
  };

  const handleRemoveCourse = (courseId: number) => {
    setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
  };

  const selectedCourses = courses.filter((c) => selectedCourseIds.includes(c.id));
  const availableCourses = courses.filter(
    (c) =>
      !selectedCourseIds.includes(c.id) &&
      (courseSearchQuery === "" ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Group Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="CS-2024-A"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="program">Program *</Label>
        <Input
          id="program"
          {...register("program")}
          placeholder="Computer Science"
          disabled={isSubmitting}
        />
        {errors.program && (
          <p className="text-sm text-red-600">{errors.program.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Select
            value={year?.toString()}
            onValueChange={(value) => setValue("year", Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.year && (
            <p className="text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Semester *</Label>
          <Select
            value={semester?.toString()}
            onValueChange={(value) => setValue("semester", Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
          {errors.semester && (
            <p className="text-sm text-red-600">{errors.semester.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Group Size *</Label>
          <Input
            id="size"
            type="number"
            {...register("size")}
            placeholder="30"
            disabled={isSubmitting}
          />
          {errors.size && (
            <p className="text-sm text-red-600">{errors.size.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assigned Courses</Label>
        <div className="border rounded-lg p-4 space-y-3">
          {/* Selected Courses */}
          {selectedCourses.length > 0 ? (
            <div className="space-y-2">
              {selectedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{course.code}</p>
                    <p className="text-xs text-gray-600">{course.title}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCourse(course.id)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              No courses assigned yet
            </p>
          )}

          {/* Course Search and Add */}
          <div className="pt-2 border-t">
            <Input
              placeholder="Search courses to add..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              disabled={isSubmitting}
            />
            {courseSearchQuery && availableCourses.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded">
                {availableCourses.slice(0, 10).map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleAddCourse(course.id)}
                    className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0"
                    disabled={isSubmitting}
                  >
                    <p className="font-medium text-sm">{course.code}</p>
                    <p className="text-xs text-gray-600">
                      {course.title} - {course.department.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
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
          {group ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </form>
  );
}
