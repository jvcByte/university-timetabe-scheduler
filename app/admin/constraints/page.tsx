import { Suspense } from "react";
import Link from "next/link";
import { getDefaultConstraintConfig } from "@/lib/constraints";
import { ConstraintEditor } from "@/components/constraint-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export const metadata = {
  title: "Constraint Configuration | Admin",
  description: "Configure scheduling constraints for timetable generation",
};

async function ConstraintConfigContent() {
  const config = await getDefaultConstraintConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Constraint Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure hard and soft constraints for timetable generation
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{config.name}</h2>
          {config.isDefault && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
              Default Configuration
            </span>
          )}
        </div>

        <ConstraintEditor config={config} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          About Constraint Configuration
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Hard Constraints:</strong> These are mandatory rules that
            must be satisfied for a valid timetable. Violations of hard
            constraints will result in an invalid schedule.
          </p>
          <p>
            <strong>Soft Constraints:</strong> These are preferences that the
            optimization algorithm will try to satisfy. The weight (0-10)
            determines how important each preference is. Higher weights mean the
            system will prioritize that constraint more heavily.
          </p>
          <p>
            <strong>Working Hours:</strong> Define the time window during which
            classes can be scheduled. All assignments will fall within this
            range when the &quot;Working Hours Only&quot; hard constraint is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConstraintsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <ConstraintConfigContent />
      </Suspense>
    </div>
  );
}
