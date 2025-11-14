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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTimetableExportData, getExportFilterLabels } from "@/actions/export";
import { generateTimetablePDF, generateWeeklyCalendarPDF } from "@/lib/export-pdf";
import { generateTimetableExcel } from "@/lib/export-excel";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  timetableId: number;
  timetableName: string;
  filterOptions: {
    rooms: Array<{ id: number; name: string; building: string }>;
    instructors: Array<{ id: number; name: string }>;
    groups: Array<{ id: number; name: string }>;
  };
}

type ExportFormat = "pdf-list" | "pdf-calendar" | "excel";

export function TimetableExportButton({
  timetableId,
  timetableName,
  filterOptions,
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf-list");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);

    try {
      // Build filters
      const filters: any = {};
      if (selectedRoom && selectedRoom !== "all") filters.roomId = parseInt(selectedRoom);
      if (selectedInstructor && selectedInstructor !== "all") filters.instructorId = parseInt(selectedInstructor);
      if (selectedGroup && selectedGroup !== "all") filters.groupId = parseInt(selectedGroup);

      // Get export data
      const result = await getTimetableExportData(timetableId, filters);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to get timetable data");
      }

      // Get filter labels
      const filterLabels = await getExportFilterLabels(filters);

      // Generate export based on format
      let blob: Blob;
      let filename: string;

      if (selectedFormat === "pdf-list") {
        blob = generateTimetablePDF(result.data, filterLabels);
        filename = `${timetableName.replace(/\s+/g, "_")}_list.pdf`;
      } else if (selectedFormat === "pdf-calendar") {
        blob = generateWeeklyCalendarPDF(result.data, filterLabels);
        filename = `${timetableName.replace(/\s+/g, "_")}_calendar.pdf`;
      } else {
        const buffer = generateTimetableExcel(result.data, filterLabels);
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
        description: `Timetable exported as ${filename}`,
      });

      setIsDialogOpen(false);
      resetFilters();
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export timetable",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedRoom("all");
    setSelectedInstructor("all");
    setSelectedGroup("all");
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isExporting) {
      setIsDialogOpen(false);
      resetFilters();
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case "pdf-list":
        return "PDF (List View)";
      case "pdf-calendar":
        return "PDF (Calendar View)";
      case "excel":
        return "Excel (Multiple Sheets)";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Timetable</DialogTitle>
            <DialogDescription>
              Choose filters to export a specific view of the timetable.
              Leave all filters empty to export the complete timetable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Format</Label>
              <div className="text-sm text-gray-600">
                {getFormatLabel(selectedFormat)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-filter">Filter by Room (Optional)</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger id="room-filter">
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  {filterOptions.rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name} ({room.building})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor-filter">
                Filter by Instructor (Optional)
              </Label>
              <Select
                value={selectedInstructor}
                onValueChange={setSelectedInstructor}
              >
                <SelectTrigger id="instructor-filter">
                  <SelectValue placeholder="All instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instructors</SelectItem>
                  {filterOptions.instructors.map((instructor) => (
                    <SelectItem
                      key={instructor.id}
                      value={instructor.id.toString()}
                    >
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-filter">Filter by Group (Optional)</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="group-filter">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {filterOptions.groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmExport} disabled={isExporting}>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
