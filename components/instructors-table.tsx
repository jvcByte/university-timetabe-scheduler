"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { deleteInstructor } from "@/actions/instructors";
import { useToast } from "@/hooks/use-toast";
import { Eye, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import type { InstructorListItem } from "@/lib/instructors";
import type { Department } from "@/lib/departments";

interface InstructorsTableProps {
  instructors: InstructorListItem[];
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

export function InstructorsTable({
  instructors,
  pagination,
  departments,
  currentSearch,
  currentDepartmentId,
}: InstructorsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState(currentSearch);
  const [departmentId, setDepartmentId] = useState<string>(currentDepartmentId?.toString() || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<InstructorListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    params.set("page", "1");
    router.push(`/admin/instructors?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDepartmentId("");
    router.push("/admin/instructors");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    params.set("page", newPage.toString());
    router.push(`/admin/instructors?${params.toString()}`);
  };

  const handleDeleteClick = (instructor: InstructorListItem) => {
    setInstructorToDelete(instructor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!instructorToDelete) return;

    setIsDeleting(true);
    const result = await deleteInstructor(instructorToDelete.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Instructor deleted successfully",
      });
      setDeleteDialogOpen(false);
      setInstructorToDelete(null);
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete instructor",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={departmentId || "all"} onValueChange={(value) => setDepartmentId(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
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
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {(search || departmentId) && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Teaching Load</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No instructors found
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.name}</TableCell>
                  <TableCell>{instructor.email}</TableCell>
                  <TableCell>{instructor.department.name}</TableCell>
                  <TableCell>{instructor.teachingLoad} hrs/week</TableCell>
                  <TableCell>{instructor._count.courses}</TableCell>
                  <TableCell>{instructor._count.assignments}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/instructors/${instructor.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/instructors/${instructor.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(instructor)}
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
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} instructors
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
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
            <DialogTitle>Delete Instructor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {instructorToDelete?.name}? This action cannot be
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
