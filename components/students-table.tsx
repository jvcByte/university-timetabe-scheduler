"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteStudent, bulkAssignStudentsToGroup } from "@/actions/students";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
} from "lucide-react";

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  year: number | null;
  semester: number | null;
  department: {
    id: number;
    code: string;
    name: string;
  } | null;
  group: {
    id: number;
    name: string;
    year: number;
    semester: number;
  } | null;
}

interface StudentsTableProps {
  students: Student[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  departments: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  studentGroups: Array<{
    id: number;
    name: string;
    program: string;
    year: number;
    semester: number;
  }>;
  currentSearch?: string;
  currentDepartmentId?: number;
  currentYear?: number;
  currentSemester?: number;
  currentGroupId?: number;
  currentHasGroup?: boolean;
}

export function StudentsTable({
  students,
  pagination,
  departments,
  studentGroups,
  currentSearch = "",
  currentDepartmentId,
  currentYear,
  currentSemester,
  currentGroupId,
  currentHasGroup,
}: StudentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [search, setSearch] = useState(currentSearch);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState<string>("");

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/students?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/admin/students?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/admin/students?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteStudent(deleteId);

    if (result.success) {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete student",
        variant: "destructive",
      });
    }

    setDeleteId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) return;

    const groupId = bulkGroupId === "none" ? null : Number(bulkGroupId);

    const result = await bulkAssignStudentsToGroup(selectedStudents, groupId);

    if (result.success) {
      toast({
        title: "Success",
        description: `${"count" in result ? result.count : selectedStudents.length} student(s) assigned successfully`,
      });
      setSelectedStudents([]);
      setShowBulkAssign(false);
      setBulkGroupId("");
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: ("error" in result ? result.error : undefined) || "Failed to assign students",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={currentDepartmentId?.toString() || "all"}
            onValueChange={(value) => handleFilterChange("departmentId", value)}
          >
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

          <Select
            value={currentYear?.toString() || "all"}
            onValueChange={(value) => handleFilterChange("year", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {[1, 2, 3, 4, 5].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  Year {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentSemester?.toString() || "all"}
            onValueChange={(value) => handleFilterChange("semester", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentHasGroup !== undefined ? (currentHasGroup ? "yes" : "no") : "all"}
            onValueChange={(value) => handleFilterChange("hasGroup", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Group Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="yes">With Group</SelectItem>
              <SelectItem value="no">Without Group</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedStudents.length} student(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkAssign(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign to Group
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStudents([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year/Sem</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) =>
                        handleSelectStudent(student.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {student.studentId}
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-gray-600">{student.email}</TableCell>
                  <TableCell>{student.department?.name || "-"}</TableCell>
                  <TableCell>
                    {student.year && student.semester
                      ? `Y${student.year}/S${student.semester}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {student.group ? (
                      <Link
                        href={`/admin/groups/${student.group.id}`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {student.group.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">No group</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/students/${student.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(student.id)}
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
            {pagination.total} students
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Assign Dialog */}
      <AlertDialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Students to Group</AlertDialogTitle>
            <AlertDialogDescription>
              Assign {selectedStudents.length} selected student(s) to a group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulkGroupId">Select Group</Label>
            <Select value={bulkGroupId} onValueChange={setBulkGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remove from Group</SelectItem>
                {studentGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name} - {group.program} (Year {group.year}, Sem {group.semester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkGroupId("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAssign} disabled={!bulkGroupId}>
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
