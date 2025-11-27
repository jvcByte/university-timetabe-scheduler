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
import { createStudent, updateStudent } from "@/actions/students";
import { getUserByEmail } from "@/actions/user-lookup";
import type { StudentInput } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";

const studentFormSchema = z.object({
  studentId: z
    .string()
    .min(3, "Student ID must be at least 3 characters")
    .max(50, "Student ID must be at most 50 characters")
    .regex(
      /^[A-Z0-9-]+$/i,
      "Student ID must contain only letters, numbers, and hyphens"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  year: z.coerce.number().int().min(1).max(10).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  studentGroupId: z.coerce.number().int().positive().optional().nullable(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: {
    id: number;
    studentId: string;
    name: string;
    email: string;
    year: number | null;
    semester: number | null;
    departmentId: number | null;
    studentGroupId: number | null;
    department?: {
      id: number;
      name: string;
    } | null;
    group?: {
      id: number;
      name: string;
    } | null;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    } | null;
  };
  departments: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  studentGroups: Array<{
    id: number;
    name: string;
    program: string;
    year: number;
    semester: number;
  }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StudentForm({
  student,
  departments,
  studentGroups,
  onSuccess,
  onCancel,
}: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student
      ? {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          year: student.year || undefined,
          semester: student.semester || undefined,
          departmentId: student.departmentId || undefined,
          studentGroupId: student.studentGroupId || undefined,
        }
      : {
          year: 1,
          semester: 1,
        },
  });

  const departmentId = watch("departmentId");
  const studentGroupId = watch("studentGroupId");
  const email = watch("email");

  const handleEmailLookup = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLookingUp(true);

    try {
      const result = await getUserByEmail(email);

      if (result.success && result.user) {
        // Auto-populate name from user table and store userId
        setValue("name", result.user.name);
        setFoundUserId(result.user.id);

        toast({
          title: "User Found",
          description: `Found user: ${result.user.name} (${result.user.role})`,
        });

        if (result.user.hasStudentRecord) {
          toast({
            title: "Warning",
            description: "This user already has a student record",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "User Not Found",
          description: result.error || "No user found with this email",
          variant: "destructive",
        });
        setFoundUserId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to look up user",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);

    try {
      const input: StudentInput = {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        year: data.year || undefined,
        semester: data.semester || undefined,
        departmentId: data.departmentId || null,
        studentGroupId: data.studentGroupId || null,
        userId: foundUserId || undefined, // Pass the userId from email lookup
      };

      const result = student
        ? await updateStudent({ id: student.id, ...input })
        : await createStudent(input);

      if (result.success) {
        toast({
          title: "Success",
          description: student
            ? "Student updated successfully"
            : "Student created successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/students");
        }
      } else {
        toast({
          title: "Error",
          description: ("error" in result ? result.error : undefined) || "An error occurred",
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
        <Label htmlFor="studentId">Student ID *</Label>
        <Input
          id="studentId"
          {...register("studentId")}
          placeholder="S2025001"
          disabled={isSubmitting}
        />
        {errors.studentId && (
          <p className="text-sm text-red-600">{errors.studentId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="john.doe@university.edu"
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleEmailLookup}
            disabled={isSubmitting || isLookingUp || !email}
          >
            {isLookingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Enter email and click search to auto-fill name from user table
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="John Doe"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="departmentId">Department *</Label>
        <Select
          value={departmentId?.toString() || "none"}
          onValueChange={(value) =>
            setValue("departmentId", value === "none" ? undefined : Number(value))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Department</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.name} ({dept.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className="text-sm text-red-600">{errors.departmentId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={watch("year")?.toString()}
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
          <Label htmlFor="semester">Semester</Label>
          <Select
            value={watch("semester")?.toString()}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentGroupId">Student Group</Label>
        <Select
          value={studentGroupId?.toString() || "none"}
          onValueChange={(value) =>
            setValue("studentGroupId", value === "none" ? undefined : Number(value))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select student group (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Group</SelectItem>
            {studentGroups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name} - {group.program} (Year {group.year}, Sem {group.semester})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.studentGroupId && (
          <p className="text-sm text-red-600">{errors.studentGroupId.message}</p>
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
          {student ? "Update Student" : "Create Student"}
        </Button>
      </div>
    </form>
  );
}
