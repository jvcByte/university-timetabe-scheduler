# CSV/Excel Import and Export Implementation

## Overview
Implemented comprehensive CSV and Excel import/export functionality for all entity types (courses, instructors, rooms, and student groups) as specified in task 8.

## Files Created

### Core Libraries
- **lib/import-export.ts**: Core utility functions for parsing, validating, and converting data
  - CSV parsing using papaparse
  - Excel parsing using xlsx library
  - Zod validation schemas for each entity type
  - Data formatting for export
  - Error handling and validation reporting

### Server Actions
- **actions/import-export.ts**: Server-side import/export actions
  - `importCourses()`, `importInstructors()`, `importRooms()`, `importStudentGroups()`
  - `exportCoursesCSV()`, `exportCoursesExcel()`, etc.
  - Comprehensive error handling with row-level error reporting
  - Database validation (checking for duplicates, foreign key references)

### UI Components
- **components/import-dialog.tsx**: Reusable import dialog component
  - File upload with CSV/Excel support
  - Template download functionality
  - Real-time validation feedback
  - Detailed error reporting with row numbers
  - Preview of import results

- **components/export-button.tsx**: Export dropdown button
  - CSV and Excel export options
  - Automatic file download
  - Loading states and error handling

- **components/import-export-buttons.tsx**: Combined wrapper component
  - Entity-specific configuration
  - Template CSV data for each entity type
  - Integrates import and export functionality

- **components/ui/dropdown-menu.tsx**: Radix UI dropdown menu component

## Features Implemented

### Import Functionality (Task 8.1)
✅ CSV parser using papaparse
✅ Excel parser using xlsx library
✅ Validation logic for imported data with Zod schemas
✅ Import UI with file upload and preview
✅ Row-level error reporting with field names and values
✅ Template download for each entity type
✅ Duplicate detection (checks for existing records)
✅ Foreign key validation (e.g., department codes)
✅ Default value handling (e.g., instructor availability)

### Export Functionality (Task 8.2)
✅ CSV export for all entity types
✅ Excel export with formatting
✅ Export Server Actions for each entity
✅ Automatic file download with proper MIME types
✅ Date-stamped filenames

## Entity-Specific Details

### Courses
- **Import Fields**: code, title, duration, credits, departmentCode, roomType
- **Validation**: Unique course codes, valid department references
- **Template**: Includes sample CS, MATH, and PHY courses

### Instructors
- **Import Fields**: name, email, departmentCode, teachingLoad
- **Validation**: Unique emails, valid department references
- **Default**: Sets default availability (Mon-Fri 9:00-17:00)
- **Template**: Includes sample instructors from different departments

### Rooms
- **Import Fields**: name, building, capacity, type, equipment
- **Validation**: Unique room names, capacity limits
- **Equipment**: Comma-separated list parsed into JSON array
- **Template**: Includes lecture halls, labs, and auditoriums

### Student Groups
- **Import Fields**: name, program, year, semester, size
- **Validation**: Unique group names, valid year/semester ranges
- **Template**: Includes sample groups from different programs

## Integration

All entity management pages have been updated with import/export buttons:
- `/admin/courses` - Courses page
- `/admin/instructors` - Instructors page
- `/admin/rooms` - Rooms page
- `/admin/groups` - Student Groups page

## Error Handling

The implementation includes comprehensive error handling:
1. **Parse Errors**: Invalid file format, corrupted files
2. **Validation Errors**: Schema validation failures with specific field errors
3. **Database Errors**: Duplicate records, missing foreign keys
4. **User Feedback**: Toast notifications and detailed error lists

## Requirements Satisfied

✅ **Requirement 1.5**: Export data to CSV or Excel files
✅ **Requirement 1.6**: Import data from CSV or Excel files with validation
✅ **Requirement 1.7**: Display validation errors with row numbers and field details

## Testing

The implementation has been verified with:
- TypeScript compilation (no errors)
- Next.js build (successful)
- All diagnostics passing

## Usage

### Importing Data
1. Click "Import" button on any entity page
2. Download template (optional) to see required format
3. Upload CSV or Excel file
4. Review validation results
5. Successful imports are automatically reflected in the table

### Exporting Data
1. Click "Export" dropdown on any entity page
2. Select "Export as CSV" or "Export as Excel"
3. File downloads automatically with current data

## Future Enhancements

Potential improvements for future iterations:
- Bulk update support (import to update existing records)
- Import preview before committing to database
- Export with filters (export only filtered results)
- Import history and rollback functionality
- Support for importing relationships (e.g., course-instructor assignments)
