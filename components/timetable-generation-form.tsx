"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { GenerateTimetableResult } from "@/actions/timetables";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface TimetableGenerationFormProps {
  constraintConfigs: Array<{
    id: number;
    name: string;
    isDefault: boolean;
  }>;
}

export function TimetableGenerationForm({
  constraintConfigs,
}: TimetableGenerationFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateTimetableResult | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [constraintConfigId, setConstraintConfigId] = useState<string>(
    constraintConfigs.find((c) => c.isDefault)?.id.toString() || ""
  );
  const [timeLimitSeconds, setTimeLimitSeconds] = useState("300");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setResult(null);

    try {
      const generationResult = await generateTimetable({
        name,
        semester,
        academicYear,
        constraintConfigId: constraintConfigId
          ? parseInt(constraintConfigId)
          : undefined,
        timeLimitSeconds: parseInt(timeLimitSeconds),
      });

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

  const canSubmit =
    !isGenerating && name.trim() && semester.trim() && academicYear.trim();

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Timetable Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fall 2024 Schedule"
            required
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g., Fall 2024"
              required
              disabled={isGenerating}
            />
          </div>

          <div>
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2024-2025"
              required
              disabled={isGenerating}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="constraintConfig">Constraint Configuration</Label>
          <Select
            value={constraintConfigId}
            onValueChange={setConstraintConfigId}
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
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input
            id="timeLimit"
            type="number"
            min="10"
            max="600"
            value={timeLimitSeconds}
            onChange={(e) => setTimeLimitSeconds(e.target.value)}
            disabled={isGenerating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum time for the solver to find a solution (10-600 seconds)
          </p>
        </div>

        <Button type="submit" disabled={!canSubmit} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Timetable...
            </>
          ) : (
            "Generate Timetable"
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
