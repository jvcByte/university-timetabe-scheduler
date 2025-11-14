"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTimetableExportData } from "@/actions/export";
import { generateTimetablePDF, generateWeeklyCalendarPDF } from "@/lib/export-pdf";
import { generateTimetableExcel } from "@/lib/export-excel";
import { useToast } from "@/hooks/use-toast";

interface SimpleExportButtonProps {
  timetableId: number;
  timetableName: string;
  filters?: {
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  };
}

type ExportFormat = "pdf-list" | "pdf-calendar" | "excel";

export function SimpleExportButton({
  timetableId,
  timetableName,
  filters,
}: SimpleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      // Get export data with filters
      const result = await getTimetableExportData(timetableId, filters);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to get timetable data");
      }

      // Generate export based on format
      let blob: Blob;
      let filename: string;

      if (format === "pdf-list") {
        blob = generateTimetablePDF(result.data, []);
        filename = `${timetableName.replace(/\s+/g, "_")}_list.pdf`;
      } else if (format === "pdf-calendar") {
        blob = generateWeeklyCalendarPDF(result.data, []);
        filename = `${timetableName.replace(/\s+/g, "_")}_calendar.pdf`;
      } else {
        const buffer = generateTimetableExcel(result.data, []);
        blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        filename = `${timetableName.replace(/\s+/g, "_")}.xlsx`;
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Schedule exported as ${filename}`,
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export schedule",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("pdf-list")}>
          <FileText className="h-4 w-4 mr-2" />
          PDF (List View)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf-calendar")}>
          <FileText className="h-4 w-4 mr-2" />
          PDF (Calendar View)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (Multiple Sheets)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
