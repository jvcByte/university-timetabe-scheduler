"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActionResult } from "@/lib/error-handling";

interface ExportButtonProps {
  entityType: "courses" | "instructors" | "rooms" | "studentGroups";
  entityLabel: string;
  exportCSVAction: () => Promise<ActionResult<string>>;
  exportExcelAction: () => Promise<ActionResult<string>>;
}

export function ExportButton({
  entityType,
  entityLabel,
  exportCSVAction,
  exportExcelAction,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);

    try {
      const result = format === "csv" 
        ? await exportCSVAction() 
        : await exportExcelAction();

      if (result.success && result.data) {
        // Create download
        let blob: Blob;
        let filename: string;

        if (format === "csv") {
          blob = new Blob([result.data], { type: "text/csv" });
          filename = `${entityType}_${new Date().toISOString().split("T")[0]}.csv`;
        } else {
          const buffer = Buffer.from(result.data, "base64");
          blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          filename = `${entityType}_${new Date().toISOString().split("T")[0]}.xlsx`;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: `${entityLabel} exported as ${format.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
