"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCourse } from "@/actions/courses";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CourseListItem } from "@/lib/courses";
import type { Department } from "@/lib/departments";

interface CoursesTableProps {
  courses: CourseListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  departments: Department[];
  currentSearch: string;
  currentDepartmentId?: number;
}

export function CoursesTable({
  courses,
  pagination,
  departments,
  currentSearch,
  currentDepartmentId,
}: CoursesTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState(currentSearch);
  const [departmentId, setDepartmentId] = useState<string>(currentDepartmentId?.toString() || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    router.push(`/admin/courses?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDepartmentId("");
    router.push("/admin/courses");
  };

  const handleDeleteClick = (course: CourseListItem) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    const result = await deleteCourse(courseToDelete.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete course",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    router.push(`/admin/courses?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="w-64">
          <Select value={departmentId || "all"} onValueChange={(value) => setDepartmentId(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button variant="outline" onClick={handleClearFilters}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Instructors</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No courses found. Create your first course to get started.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.department.name}</TableCell>
                  <TableCell>{course.duration} min</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course._count.instructors}</TableCell>
                  <TableCell>{course._count.groups}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(course)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} courses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course{" "}
              <strong>{courseToDelete?.code}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
