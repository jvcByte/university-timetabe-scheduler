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
import { deleteStudentGroup } from "@/actions/student-groups";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import type { StudentGroupListItem } from "@/lib/student-groups";

interface StudentGroupsTableProps {
  groups: StudentGroupListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  programs: string[];
  currentSearch: string;
  currentProgram?: string;
  currentYear?: number;
  currentSemester?: number;
}

export function StudentGroupsTable({
  groups,
  pagination,
  programs,
  currentSearch,
  currentProgram,
  currentYear,
  currentSemester,
}: StudentGroupsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState(currentSearch);
  const [program, setProgram] = useState<string>(currentProgram || "");
  const [year, setYear] = useState<string>(currentYear?.toString() || "");
  const [semester, setSemester] = useState<string>(currentSemester?.toString() || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<StudentGroupListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (program) params.set("program", program);
    if (year) params.set("year", year);
    if (semester) params.set("semester", semester);
    router.push(`/admin/groups?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setProgram("");
    setYear("");
    setSemester("");
    router.push("/admin/groups");
  };

  const handleDeleteClick = (group: StudentGroupListItem) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    const result = await deleteStudentGroup(groupToDelete.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Student group deleted successfully",
      });
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete student group",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    if (search) params.set("search", search);
    if (program) params.set("program", program);
    if (year) params.set("year", year);
    if (semester) params.set("semester", semester);
    router.push(`/admin/groups?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="w-48">
          <Select value={program || "all"} onValueChange={(value) => setProgram(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((prog) => (
                <SelectItem key={prog} value={prog}>
                  {prog}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select value={year || "all"} onValueChange={(value) => setYear(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {[1, 2, 3, 4, 5].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select value={semester || "all"} onValueChange={(value) => setSemester(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
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
              <TableHead>Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No student groups found. Create your first group to get started.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.program}</TableCell>
                  <TableCell>Year {group.year}</TableCell>
                  <TableCell>Semester {group.semester}</TableCell>
                  <TableCell>{group.size}</TableCell>
                  <TableCell>
                    <span className={group._count.students > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
                      {group._count.students}
                    </span>
                  </TableCell>
                  <TableCell>{group._count.courses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/groups/${group.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/groups/${group.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(group)}
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
            {pagination.total} groups
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
            <DialogTitle>Delete Student Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the student group{" "}
              <strong>{groupToDelete?.name}</strong>? This action cannot be
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
