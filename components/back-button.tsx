"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Button
      size="lg"
      variant="outline"
      onClick={() => window.history.back()}
      className="w-full sm:w-auto"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Go Back
    </Button>
  );
}
