import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type ConstraintConfigWithMetadata = Prisma.ConstraintConfigGetPayload<{
  select: {
    id: true;
    name: true;
    isDefault: true;
    noRoomDoubleBooking: true;
    noInstructorDoubleBooking: true;
    roomCapacityCheck: true;
    roomTypeMatch: true;
    workingHoursOnly: true;
    instructorPreferencesWeight: true;
    compactSchedulesWeight: true;
    balancedDailyLoadWeight: true;
    preferredRoomsWeight: true;
    workingHoursStart: true;
    workingHoursEnd: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export interface GetConstraintConfigsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateConstraintConfigInput {
  name: string;
  isDefault?: boolean;
  noRoomDoubleBooking?: boolean;
  noInstructorDoubleBooking?: boolean;
  roomCapacityCheck?: boolean;
  roomTypeMatch?: boolean;
  workingHoursOnly?: boolean;
  instructorPreferencesWeight?: number;
  compactSchedulesWeight?: number;
  balancedDailyLoadWeight?: number;
  preferredRoomsWeight?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
}

export interface UpdateConstraintConfigInput {
  name?: string;
  isDefault?: boolean;
  noRoomDoubleBooking?: boolean;
  noInstructorDoubleBooking?: boolean;
  roomCapacityCheck?: boolean;
  roomTypeMatch?: boolean;
  workingHoursOnly?: boolean;
  instructorPreferencesWeight?: number;
  compactSchedulesWeight?: number;
  balancedDailyLoadWeight?: number;
  preferredRoomsWeight?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
}

/**
 * Get all constraint configurations with pagination and filtering
 */
export async function getConstraintConfigs(
  params: GetConstraintConfigsParams = {}
) {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.ConstraintConfigWhereInput = search
    ? {
        name: { contains: search },
      }
    : {};

  // Execute queries in parallel
  const [configs, total] = await Promise.all([
    prisma.constraintConfig.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.constraintConfig.count({ where }),
  ]);

  return {
    configs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get a constraint configuration by ID
 */
export async function getConstraintConfigById(id: number) {
  return prisma.constraintConfig.findUnique({
    where: { id },
  });
}

/**
 * Get a constraint configuration by name
 */
export async function getConstraintConfigByName(name: string) {
  return prisma.constraintConfig.findUnique({
    where: { name },
  });
}

/**
 * Get the default constraint configuration
 * Returns the first config marked as default, or creates one if none exists
 */
export async function getDefaultConstraintConfig() {
  // Try to find existing default config
  let defaultConfig = await prisma.constraintConfig.findFirst({
    where: { isDefault: true },
  });

  // If no default exists, create one
  if (!defaultConfig) {
    defaultConfig = await prisma.constraintConfig.create({
      data: {
        name: "Default Configuration",
        isDefault: true,
        noRoomDoubleBooking: true,
        noInstructorDoubleBooking: true,
        roomCapacityCheck: true,
        roomTypeMatch: true,
        workingHoursOnly: true,
        instructorPreferencesWeight: 5,
        compactSchedulesWeight: 7,
        balancedDailyLoadWeight: 6,
        preferredRoomsWeight: 3,
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
      },
    });
  }

  return defaultConfig;
}

/**
 * Create a new constraint configuration
 */
export async function createConstraintConfig(
  data: CreateConstraintConfigInput
) {
  // If this is being set as default, unset any existing defaults
  if (data.isDefault) {
    await prisma.constraintConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.constraintConfig.create({
    data,
  });
}

/**
 * Update an existing constraint configuration
 */
export async function updateConstraintConfig(
  id: number,
  data: UpdateConstraintConfigInput
) {
  // If this is being set as default, unset any existing defaults
  if (data.isDefault) {
    await prisma.constraintConfig.updateMany({
      where: { 
        isDefault: true,
        NOT: { id }
      },
      data: { isDefault: false },
    });
  }

  return prisma.constraintConfig.update({
    where: { id },
    data,
  });
}

/**
 * Delete a constraint configuration
 * Prevents deletion of the default configuration
 */
export async function deleteConstraintConfig(id: number) {
  const config = await prisma.constraintConfig.findUnique({
    where: { id },
  });

  if (!config) {
    throw new Error("Constraint configuration not found");
  }

  if (config.isDefault) {
    throw new Error("Cannot delete the default constraint configuration");
  }

  return prisma.constraintConfig.delete({
    where: { id },
  });
}

/**
 * Set a constraint configuration as the default
 */
export async function setDefaultConstraintConfig(id: number) {
  // Unset any existing defaults
  await prisma.constraintConfig.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  // Set the new default
  return prisma.constraintConfig.update({
    where: { id },
    data: { isDefault: true },
  });
}

/**
 * Get all constraint configurations (without pagination)
 */
export async function getAllConstraintConfigs() {
  return prisma.constraintConfig.findMany({
    orderBy: [
      { isDefault: "desc" },
      { name: "asc" },
    ],
  });
}

/**
 * Search constraint configurations by name
 */
export async function searchConstraintConfigs(query: string, limit = 10) {
  return prisma.constraintConfig.findMany({
    where: {
      name: { contains: query },
    },
    take: limit,
    orderBy: [
      { isDefault: "desc" },
      { name: "asc" },
    ],
  });
}
