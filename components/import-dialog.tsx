"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ImportActionResult } from "@/actions/import-export";

interface ImportDialogProps {
  entityType: "courses" | "instructors" | "rooms" | "studentGroups";
  entityLabel: string;
  importAction: (fileContent: string, fileType: "csv" | "excel") => Promise<ImportActionResult>;
  onSuccess?: () => void;
  templateCSV?: string;
}

export function ImportDialog({
  entityType,
  entityLabel,
  importAction,
  onSuccess,
  templateCSV,
}: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportActionResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith(".csv") && 
          !selectedFile.name.endsWith(".xlsx")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const fileType = file.name.endsWith(".csv") ? "csv" : "excel";
      
      let fileContent: string;
      if (fileType === "csv") {
        fileContent = await file.text();
      } else {
        const buffer = await file.arrayBuffer();
        fileContent = Buffer.from(buffer).toString("base64");
      }

      const importResult = await importAction(fileContent, fileType);
      setResult(importResult);

      if (importResult.success) {
        toast({
          title: "Import successful",
          description: importResult.message,
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Close dialog after successful import with no errors
        if (!importResult.errors || importResult.errors.length === 0) {
          setTimeout(() => {
            setOpen(false);
            setFile(null);
            setResult(null);
          }, 2000);
        }
      } else {
        toast({
          title: "Import failed",
          description: importResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!templateCSV) return;

    const blob = new Blob([templateCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import {entityLabel.toLowerCase()}. The file should
            contain the required columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {templateCSV && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Download template file</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <input
              id="file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  result.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{result.message}</p>
                  {result.validCount !== undefined && (
                    <p className="text-sm mt-1">
                      Valid rows: {result.validCount} | Errors: {result.errorCount || 0}
                    </p>
                  )}
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {result.errors.slice(0, 50).map((error, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-red-50 border border-red-200 rounded"
                      >
                        <span className="font-medium">Row {error.row}</span>
                        {error.field && <span className="text-muted-foreground"> ({error.field})</span>}
                        : {error.message}
                        {error.value !== undefined && (
                          <span className="text-muted-foreground"> - Value: {String(error.value)}</span>
                        )}
                      </div>
                    ))}
                    {result.errors.length > 50 && (
                      <p className="text-sm text-muted-foreground">
                        ... and {result.errors.length - 50} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setFile(null);
                setResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
