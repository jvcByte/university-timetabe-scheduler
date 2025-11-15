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
import { generateTimetable } from "@/actions/timetables";
import { generateTimetableLocal } from "@/actions/local-timetables";
import type { GenerateTimetableResult } from "@/actions/timetables";
import { Loader2, CheckCircle, XCircle, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface TimetableGenerationFormProps {
  constraintConfigs: Array<{
    id: number;
    name: string;
    isDefault: boolean;
  }>;
}

const timetableGenerationSchema = z.object({
  name: z
    .string()
    .min(3, "Timetable name must be at least 3 characters")
    .max(100, "Timetable name must be at most 100 characters"),
  semester: z
    .string()
    .min(1, "Semester is required")
    .max(50, "Semester must be at most 50 characters"),
  academicYear: z
    .string()
    .min(4, "Academic year must be at least 4 characters")
    .max(20, "Academic year must be at most 20 characters")
    .regex(/^\d{4}(-\d{4})?$/, "Academic year must be in format YYYY or YYYY-YYYY"),
  constraintConfigId: z.coerce.number().int().positive().optional(),
  timeLimitSeconds: z.coerce
    .number()
    .int("Time limit must be an integer")
    .min(10, "Time limit must be at least 10 seconds")
    .max(1200, "Time limit must be at most 1200 seconds"),
  useLocalSolver: z.boolean().default(true),
});

type TimetableGenerationFormData = z.infer<typeof timetableGenerationSchema>;

export function TimetableGenerationForm({
  constraintConfigs,
}: TimetableGenerationFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateTimetableResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimetableGenerationFormData>({
    resolver: zodResolver(timetableGenerationSchema),
    mode: "onBlur",
    defaultValues: {
      constraintConfigId: constraintConfigs.find((c) => c.isDefault)?.id,
      timeLimitSeconds: 600,
      useLocalSolver: true,
    },
  });

  const constraintConfigId = watch("constraintConfigId");
  const useLocalSolver = watch("useLocalSolver");

  const onSubmit = async (data: TimetableGenerationFormData) => {
    setIsGenerating(true);
    setResult(null);

    try {
      const input = {
        name: data.name,
        semester: data.semester,
        academicYear: data.academicYear,
        constraintConfigId: data.constraintConfigId,
        timeLimitSeconds: data.timeLimitSeconds,
      };

      const generationResult = data.useLocalSolver
        ? await generateTimetableLocal(input)
        : await generateTimetable(input);

      setResult(generationResult);

      // If successful, redirect to timetable view after a short delay
      if (generationResult.success && generationResult.timetableId) {
        setTimeout(() => {
          router.push(`/admin/timetables/${generationResult.timetableId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Generation error:", error);
      setResult({
        success: false,
        error: "An unexpected error occurred",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Timetable Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Fall 2024 Schedule"
            disabled={isGenerating}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="semester">Semester *</Label>
            <Input
              id="semester"
              {...register("semester")}
              placeholder="e.g., Fall 2024"
              disabled={isGenerating}
            />
            {errors.semester && (
              <p className="text-sm text-red-600">{errors.semester.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Input
              id="academicYear"
              {...register("academicYear")}
              placeholder="e.g., 2024-2025"
              disabled={isGenerating}
            />
            {errors.academicYear && (
              <p className="text-sm text-red-600">{errors.academicYear.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="constraintConfig">Constraint Configuration</Label>
          <Select
            value={constraintConfigId?.toString()}
            onValueChange={(value) => setValue("constraintConfigId", Number(value))}
            disabled={isGenerating}
          >
            <SelectTrigger id="constraintConfig">
              <SelectValue placeholder="Select constraint configuration" />
            </SelectTrigger>
            <SelectContent>
              {constraintConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id.toString()}>
                  {config.name} {config.isDefault && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.constraintConfigId && (
            <p className="text-sm text-red-600">{errors.constraintConfigId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimitSeconds">Time Limit (seconds) *</Label>
          <Input
            id="timeLimitSeconds"
            type="number"
            {...register("timeLimitSeconds")}
            disabled={isGenerating}
          />
          {errors.timeLimitSeconds && (
            <p className="text-sm text-red-600">{errors.timeLimitSeconds.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Maximum time for the solver to find a solution (10-1200 seconds)
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 ${useLocalSolver ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <Label htmlFor="useLocalSolver" className="text-sm font-medium cursor-pointer">
                Use Fast Local Solver (Recommended)
              </Label>
              <p className="text-xs text-gray-600 mt-0.5">
                {useLocalSolver 
                  ? "TypeScript-based solver - 10x faster, handles large datasets, supports concurrent requests"
                  : "Python-based solver - slower, may timeout on large datasets"}
              </p>
            </div>
          </div>
          <Switch
            id="useLocalSolver"
            checked={useLocalSolver}
            onCheckedChange={(checked) => setValue("useLocalSolver", checked)}
            disabled={isGenerating}
          />
        </div>

        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Timetable{useLocalSolver ? ' (Fast)' : ''}...
            </>
          ) : (
            <>
              {useLocalSolver && <Zap className="mr-2 h-4 w-4" />}
              Generate Timetable
            </>
          )}
        </Button>
      </form>

      {/* Progress/Result Display */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">
                Generating timetable...
              </p>
              <p className="text-sm text-blue-700">
                This may take a few minutes. Please wait.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">
                Timetable generated successfully!
              </p>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                {result.assignmentCount !== undefined && (
                  <p>Assignments created: {result.assignmentCount}</p>
                )}
                {result.fitnessScore !== undefined && (
                  <p>Fitness score: {result.fitnessScore.toFixed(2)}</p>
                )}
                {result.violationCount !== undefined &&
                  result.violationCount > 0 && (
                    <p className="text-amber-700">
                      Soft constraint violations: {result.violationCount}
                    </p>
                  )}
                {result.solveTimeSeconds !== undefined && (
                  <p>
                    Solve time: {result.solveTimeSeconds.toFixed(2)} seconds
                  </p>
                )}
              </div>
              <p className="text-sm text-green-600 mt-2">
                Redirecting to timetable view...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Result */}
      {result && !result.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">
                {result.error || "Failed to generate timetable"}
              </p>
              {result.details && (
                <p className="text-sm text-red-700 mt-1">{result.details}</p>
              )}
              {result.timetableId && (
                <p className="text-sm text-red-600 mt-2">
                  A draft timetable was created but generation failed. You can
                  try again or adjust your constraints.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
