# Design Document

## Overview

The Timetable Lifecycle Management system will enhance the existing timetable functionality by adding period-based validation, deletion capabilities, and automatic archiving. This design ensures data integrity, prevents scheduling conflicts, and maintains a clean separation between active and historical timetables.

## Architecture

### Database Schema Changes

#### Timetable Model Updates

Add new fields to the existing `Timetable` model:

```prisma
model Timetable {
  // ... existing fields
  startDate     DateTime  // Start date of the timetable period
  endDate       DateTime  // End date of the timetable period
  archivedAt    DateTime? // Timestamp when timetable was archived
  // ... existing fields
}
```

### System Components

1. **Validation Layer**: Checks for overlapping timetables and validates date ranges
2. **Deletion Service**: Handles timetable deletion with proper cascade
3. **Archiving Service**: Automated job to archive expired timetables
4. **UI Components**: Enhanced forms and list views with period management

## Components and Interfaces

### 1. Timetable Validation Service

**Purpose**: Validate timetable periods and check for conflicts

**Interface**:
```typescript
interface TimetableValidationService {
  validatePeriod(startDate: Date, endDate: Date): ValidationResult;
  checkOverlap(startDate: Date, endDate: Date, excludeId?: number): Promise<OverlapResult>;
  isValidWeekPeriod(startDate: Date, endDate: Date): boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface OverlapResult {
  hasOverlap: boolean;
  conflictingTimetables: TimetableInfo[];
}
```

**Implementation Details**:
- Validate start date is not more than 1 day in the past
- Validate end date is after start date
- Validate period is between 1 and 7 days
- Query database for overlapping timetables
- Return detailed conflict information

### 2. Timetable Deletion Service

**Purpose**: Safely delete timetables and associated data

**Interface**:
```typescript
interface TimetableDeletionService {
  canDelete(timetableId: number): Promise<DeletionEligibility>;
  deleteTimetable(timetableId: number): Promise<DeletionResult>;
}

interface DeletionEligibility {
  canDelete: boolean;
  reason?: string;
  requiresUnpublish: boolean;
}

interface DeletionResult {
  success: boolean;
  deletedAssignments: number;
  error?: string;
}
```

**Implementation Details**:
- Check timetable status (cannot delete PUBLISHED without unpublishing)
- Use transaction to delete assignments first, then timetable
- Log deletion action for audit trail
- Return count of deleted assignments

### 3. Archiving Service

**Purpose**: Automatically archive expired timetables

**Interface**:
```typescript
interface ArchivingService {
  findExpiredTimetables(): Promise<Timetable[]>;
  archiveTimetable(timetableId: number): Promise<ArchiveResult>;
  runArchivingJob(): Promise<JobResult>;
}

interface ArchiveResult {
  success: boolean;
  timetableId: number;
  archivedAt: Date;
}

interface JobResult {
  archivedCount: number;
  errors: string[];
  executedAt: Date;
}
```

**Implementation Details**:
- Run as a cron job (daily at midnight)
- Query for PUBLISHED timetables where endDate < current date
- Update status to ARCHIVED and set archivedAt timestamp
- Log each archiving action
- Send summary report to admin

### 4. Unpublish Service

**Purpose**: Revert published timetables to generated status

**Interface**:
```typescript
interface UnpublishService {
  unpublishTimetable(timetableId: number): Promise<UnpublishResult>;
}

interface UnpublishResult {
  success: boolean;
  previousStatus: TimetableStatus;
  newStatus: TimetableStatus;
}
```

**Implementation Details**:
- Verify timetable is in PUBLISHED status
- Update status to GENERATED
- Clear publishedAt timestamp
- Log unpublish action

## Data Models

### Enhanced Timetable Model

```typescript
interface Timetable {
  id: number;
  name: string;
  semester: string;
  academicYear: string;
  status: TimetableStatus;
  startDate: Date;        // NEW
  endDate: Date;          // NEW
  archivedAt: Date | null; // NEW
  publishedAt: Date | null;
  fitnessScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  assignments: Assignment[];
}

enum TimetableStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  GENERATED = 'GENERATED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}
```

### Period Validation Model

```typescript
interface PeriodValidation {
  startDate: Date;
  endDate: Date;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: 'startDate' | 'endDate' | 'period';
  message: string;
  code: string;
}

interface ValidationWarning {
  message: string;
  type: 'overlap' | 'short_notice' | 'long_period';
}
```

## Error Handling

### Error Types

1. **OverlapError**: Thrown when attempting to create overlapping timetables
2. **InvalidPeriodError**: Thrown when date range is invalid
3. **DeletionNotAllowedError**: Thrown when attempting to delete published timetable
4. **ArchivingError**: Thrown when archiving process fails

### Error Messages

```typescript
const ERROR_MESSAGES = {
  OVERLAP_EXISTS: 'A timetable already exists for this period',
  INVALID_DATE_RANGE: 'End date must be after start date',
  PAST_START_DATE: 'Start date cannot be more than 1 day in the past',
  PERIOD_TOO_LONG: 'Timetable period cannot exceed 7 days',
  PERIOD_TOO_SHORT: 'Timetable period must be at least 1 day',
  CANNOT_DELETE_PUBLISHED: 'Cannot delete published timetable. Unpublish first.',
  TIMETABLE_NOT_FOUND: 'Timetable not found',
  ARCHIVING_FAILED: 'Failed to archive timetable',
};
```

## Testing Strategy

### Unit Tests

1. **Validation Tests**
   - Test date range validation
   - Test overlap detection
   - Test period length validation
   - Test past date rejection

2. **Deletion Tests**
   - Test successful deletion
   - Test deletion prevention for published timetables
   - Test cascade deletion of assignments
   - Test transaction rollback on error

3. **Archiving Tests**
   - Test expired timetable detection
   - Test status update to ARCHIVED
   - Test timestamp setting
   - Test job execution

### Integration Tests

1. **End-to-End Generation Flow**
   - Create timetable with valid period
   - Attempt duplicate creation (should fail)
   - Publish timetable
   - Verify cannot delete while published
   - Unpublish and delete

2. **Archiving Flow**
   - Create and publish timetable with past end date
   - Run archiving job
   - Verify status changed to ARCHIVED
   - Verify cannot modify archived timetable

### Manual Testing Scenarios

1. Generate timetable for current week
2. Attempt to generate another for same week (should fail)
3. Generate for next week (should succeed)
4. Delete draft timetable
5. Publish timetable
6. Attempt to delete published (should fail)
7. Unpublish timetable
8. Delete unpublished timetable
9. Wait for end date to pass
10. Verify automatic archiving

## UI/UX Considerations

### Generation Form Enhancements

- Add date pickers for start and end dates
- Show visual calendar for period selection
- Display warning if period overlaps with existing timetable
- Auto-calculate end date (start + 7 days) with option to customize
- Show existing timetables for reference

### Timetable List View

- Display period (e.g., "Jan 15 - Jan 21, 2025")
- Add status badges (Active, Upcoming, Expired, Archived)
- Add filter dropdown for status
- Show days until expiration for active timetables
- Highlight overlapping periods in red

### Delete Confirmation Dialog

- Show timetable name and period
- Display number of assignments that will be deleted
- Show warning if timetable is published
- Require explicit confirmation checkbox
- Show "Unpublish first" button if published

### Archive View

- Separate page for archived timetables
- Read-only display
- Export functionality (PDF/Excel)
- Search and filter by date range
- Show archiving date and reason

## Performance Considerations

1. **Database Indexing**
   - Add index on `startDate` and `endDate` for overlap queries
   - Add index on `status` for filtering
   - Add composite index on `(status, endDate)` for archiving job

2. **Query Optimization**
   - Use date range queries efficiently
   - Limit overlap check to relevant statuses (exclude ARCHIVED)
   - Batch archiving operations

3. **Caching**
   - Cache active timetable periods
   - Invalidate cache on timetable creation/deletion
   - Cache archived timetable list

## Security Considerations

1. **Authorization**
   - Only ADMIN users can delete timetables
   - Only ADMIN users can unpublish timetables
   - Archiving job runs with system privileges

2. **Audit Trail**
   - Log all deletion actions with user ID and timestamp
   - Log all unpublish actions
   - Log all archiving actions
   - Store deleted timetable metadata for recovery

3. **Data Integrity**
   - Use database transactions for deletion
   - Validate all date inputs on server side
   - Prevent SQL injection in date queries
   - Validate user permissions before operations

## Migration Strategy

1. **Database Migration**
   - Add `startDate`, `endDate`, `archivedAt` columns to Timetable table
   - Set default values for existing timetables (use createdAt as startDate, +7 days as endDate)
   - Create database indexes
   - Update Prisma schema

2. **Code Migration**
   - Update timetable generation to require dates
   - Add validation layer
   - Implement deletion service
   - Implement archiving service
   - Update UI components

3. **Deployment Steps**
   - Run database migration
   - Deploy backend changes
   - Deploy frontend changes
   - Set up cron job for archiving
   - Monitor for errors

## Future Enhancements

1. **Flexible Period Lengths**: Support periods other than weekly (daily, bi-weekly, monthly)
2. **Recurring Timetables**: Auto-generate timetables for recurring periods
3. **Soft Delete**: Implement soft delete with recovery option
4. **Version History**: Track changes to timetables over time
5. **Conflict Resolution**: Suggest alternative periods when overlap detected
6. **Bulk Operations**: Archive or delete multiple timetables at once
7. **Email Notifications**: Notify admins before timetables expire
8. **Analytics**: Dashboard showing timetable usage and lifecycle metrics
