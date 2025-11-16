"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishTimetable, archiveTimetable } from "@/actions/timetables";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Archive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimetablePublishButtonProps {
  timetableId: number;
  currentStatus: string;
  timetableName: string;
}

export function TimetablePublishButton({
  timetableId,
  currentStatus,
  timetableName,
}: TimetablePublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const result = await publishTimetable(timetableId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Timetable published successfully. It is now visible to faculty and students.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to publish timetable",
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
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);

    try {
      const result = await archiveTimetable(timetableId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Timetable archived successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to archive timetable",
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
      setIsArchiving(false);
    }
  };

  // Only show publish button for GENERATED timetables
  if (currentStatus === "GENERATED") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Timetable
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Timetable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish &quot;{timetableName}&quot;? Once published,
              this timetable will be visible to all faculty members and students.
              You can still edit it after publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Show archive button for PUBLISHED timetables
  if (currentStatus === "PUBLISHED") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isArchiving}>
            {isArchiving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Timetable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{timetableName}&quot;? Archived
              timetables will no longer be visible to faculty and students, but
              can be restored later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Don't show any button for DRAFT or ARCHIVED status
  return null;
}
