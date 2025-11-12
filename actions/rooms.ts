"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const roomSchema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(50, "Room name must be at most 50 characters"),
  building: z
    .string()
    .min(1, "Building is required")
    .max(100, "Building must be at most 100 characters"),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be at most 1000"),
  type: z
    .string()
    .min(1, "Room type is required")
    .max(50, "Room type must be at most 50 characters"),
  equipment: z.array(z.string()).optional().default([]),
});

const updateRoomSchema = roomSchema.extend({
  id: z.number().int(),
});

// Result types
export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type RoomInput = z.infer<typeof roomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

/**
 * Create a new room
 */
export async function createRoom(
  input: RoomInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = roomSchema.parse(input);

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name: validated.name },
    });

    if (existingRoom) {
      return {
        success: false,
        error: `Room with name "${validated.name}" already exists`,
      };
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        name: validated.name,
        building: validated.building,
        capacity: validated.capacity,
        type: validated.type,
        equipment: validated.equipment,
      },
    });

    revalidatePath("/admin/rooms");
    return { success: true, data: { id: room.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error("Failed to create room:", error);
    return {
      success: false,
      error: "Failed to create room. Please try again.",
    };
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(
  input: UpdateRoomInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = updateRoomSchema.parse(input);

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: validated.id },
    });

    if (!existingRoom) {
      return {
        success: false,
        error: "Room not found",
      };
    }

    // Check if name is being changed and if new name already exists
    if (validated.name !== existingRoom.name) {
      const nameExists = await prisma.room.findUnique({
        where: { name: validated.name },
      });

      if (nameExists) {
        return {
          success: false,
          error: `Room with name "${validated.name}" already exists`,
        };
      }
    }

    // Update room
    await prisma.room.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        building: validated.building,
        capacity: validated.capacity,
        type: validated.type,
        equipment: validated.equipment,
      },
    });

    revalidatePath("/admin/rooms");
    revalidatePath(`/admin/rooms/${validated.id}`);
    return { success: true, data: { id: validated.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error("Failed to update room:", error);
    return {
      success: false,
      error: "Failed to update room. Please try again.",
    };
  }
}

/**
 * Delete a room
 */
export async function deleteRoom(id: number): Promise<ActionResult> {
  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!room) {
      return {
        success: false,
        error: "Room not found",
      };
    }

    // Check if room has assignments
    if (room._count.assignments > 0) {
      return {
        success: false,
        error: `Cannot delete room "${room.name}" because it has ${room._count.assignments} assignment(s) in timetables. Please remove the assignments first.`,
      };
    }

    // Delete room
    await prisma.room.delete({
      where: { id },
    });

    revalidatePath("/admin/rooms");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete room:", error);
    return {
      success: false,
      error: "Failed to delete room. Please try again.",
    };
  }
}
