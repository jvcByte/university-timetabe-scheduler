"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

interface FilterOptions {
  rooms: Array<{ id: number; name: string; building: string }>;
  instructors: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}

interface TimetableFilterPanelProps {
  filterOptions: FilterOptions;
  onFilterChange: (filters: {
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }) => void;
}

export function TimetableFilterPanel({
  filterOptions,
  onFilterChange,
}: TimetableFilterPanelProps) {
  const [roomId, setRoomId] = useState<number | undefined>();
  const [instructorId, setInstructorId] = useState<number | undefined>();
  const [groupId, setGroupId] = useState<number | undefined>();

  const handleRoomChange = (value: string) => {
    const newRoomId = value === "all" ? undefined : parseInt(value);
    setRoomId(newRoomId);
    onFilterChange({ roomId: newRoomId, instructorId, groupId });
  };

  const handleInstructorChange = (value: string) => {
    const newInstructorId = value === "all" ? undefined : parseInt(value);
    setInstructorId(newInstructorId);
    onFilterChange({ roomId, instructorId: newInstructorId, groupId });
  };

  const handleGroupChange = (value: string) => {
    const newGroupId = value === "all" ? undefined : parseInt(value);
    setGroupId(newGroupId);
    onFilterChange({ roomId, instructorId, groupId: newGroupId });
  };

  const handleClearFilters = () => {
    setRoomId(undefined);
    setInstructorId(undefined);
    setGroupId(undefined);
    onFilterChange({});
  };

  const hasActiveFilters = roomId || instructorId || groupId;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter Assignments</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Room Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Room
          </label>
          <Select
            value={roomId?.toString() || "all"}
            onValueChange={handleRoomChange}
          >
            <SelectTrigger>
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

        {/* Instructor Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Instructor
          </label>
          <Select
            value={instructorId?.toString() || "all"}
            onValueChange={handleInstructorChange}
          >
            <SelectTrigger>
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

        {/* Group Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Student Group
          </label>
          <Select
            value={groupId?.toString() || "all"}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger>
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

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {roomId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Room:{" "}
                {
                  filterOptions.rooms.find((r) => r.id === roomId)?.name
                }
              </span>
            )}
            {instructorId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Instructor:{" "}
                {
                  filterOptions.instructors.find((i) => i.id === instructorId)
                    ?.name
                }
              </span>
            )}
            {groupId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Group:{" "}
                {filterOptions.groups.find((g) => g.id === groupId)?.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
