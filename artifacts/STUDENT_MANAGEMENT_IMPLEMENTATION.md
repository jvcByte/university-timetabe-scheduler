# Student Management Implementation

## Overview

This document describes the implementation of individual student tracking and management in the University Timetable Scheduler. The system now supports tracking individual students and assigning them to student groups, replacing the previous approach where groups only had a size number.

## Database Schema Changes

### New Student Model

Added a new `Student` model to track individual students:

```prisma
model Student {
  id              Int      @id @default(autoincrement())
  userId          String   @unique
  studentId       String   @unique
  name            String
  email           String   @unique
  program         String?
  year            Int?
  semester        Int?
  studentGroupId  Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  group StudentGroup? @relation(fields: [studentGroupId], references: [id], onDelete: SetNull)
  
  @@index([studentGroupId])
  @@index([program, year, semester])
}
```

### Updated StudentGroup Model

Modified the `StudentGroup` model to support a one-to-many relationship with students:

```prisma
model StudentGroup {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  program   String
  year      Int
  semester  Int
  size      Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  students    Student[]      // NEW: Many students can belong to one group
  courses     CourseGroup[]
  assignments Assignment[]
}
```

### Updated User Model

Removed the `studentGroup` relation and added `student` relation:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  instructor Instructor?
  student    Student?     // NEW: One-to-one with Student
}
```

## Migration

Applied migration: `20251115024246_add_student_model`

This migration:
- Creates the new `Student` table
- Removes the `userId` column from `StudentGroup` table
- Adds necessary indexes for performance

## Server Actions

### Created `actions/students.ts`

New server actions for student management:

1. **createStudent(input: StudentInput)** - Create a new student
   - Validates student ID and email uniqueness
   - Optionally links to a User account
   - Assigns to a student group

2. **updateStudent(input: UpdateStudentInput)** - Update student information
   - Updates student details
   - Can reassign to different groups
   - Validates uniqueness constraints

3. **deleteStudent(id: number)** - Delete a student
   - Removes student record
   - Cascades to user if linked

4. **assignStudentToGroup(studentId: number, groupId: number | null)** - Assign student to a group
   - Assigns or removes student from group
   - Revalidates affected pages

5. **bulkAssignStudentsToGroup(studentIds: number[], groupId: number | null)** - Bulk assign students
   - Assigns multiple students to a group at once
   - Useful for batch operations

### Validation Schema

```typescript
const studentSchema = z.object({
  studentId: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/i),
  name: z.string().min(2).max(100),
  email: z.string().email().max(100),
  program: z.string().max(100).optional(),
  year: z.coerce.number().int().min(1).max(10).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  studentGroupId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.string().optional(),
});
```

## Library Functions

### Created `lib/students.ts`

Query functions for student data:

1. **getStudents(options)** - Get paginated list of students with filters
   - Supports search by name, email, student ID
   - Filter by program, year, semester, group
   - Filter by group assignment status

2. **getStudentById(id)** - Get single student with full details
   - Includes group information
   - Includes user account if linked
   - Includes group's courses

3. **getStudentByUserId(userId)** - Get student by user account
   - Used for student portal access

4. **getPrograms()** - Get list of all programs
   - Distinct list from student records

5. **getStudentsByGroupId(groupId)** - Get all students in a group
   - Used in group detail pages

6. **getUnassignedStudents()** - Get students without a group
   - Useful for assignment operations

## UI Components

### 1. StudentForm (`components/student-form.tsx`)

Form component for creating and editing students:

**Features**:
- Student ID input with validation
- Name and email fields
- Program, year, semester selection
- Student group assignment dropdown
- Full Zod validation with React Hook Form
- Real-time field-level error messages

**Props**:
```typescript
interface StudentFormProps {
  student?: Student;
  studentGroups: StudentGroup[];
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### 2. StudentsTable (`components/students-table.tsx`)

Table component for listing and managing students:

**Features**:
- Search by name, email, or student ID
- Filter by program, year, semester
- Filter by group assignment status
- Bulk selection with checkboxes
- Bulk assign to group
- Individual edit and delete actions
- Pagination support
- Responsive design

**Props**:
```typescript
interface StudentsTableProps {
  students: Student[];
  pagination: Pagination;
  programs: string[];
  studentGroups: StudentGroup[];
  currentSearch?: string;
  currentProgram?: string;
  currentYear?: number;
  currentSemester?: number;
  currentGroupId?: number;
  currentHasGroup?: boolean;
}
```

## Pages

### 1. Students List Page (`app/admin/students/page.tsx`)

Main students management page:

**Features**:
- Lists all students with pagination
- Advanced filtering and search
- Bulk operations
- Link to add new student
- Quick access to edit/delete

**URL**: `/admin/students`

### 2. New Student Page (`app/admin/students/new/page.tsx`)

Page for creating a new student:

**Features**:
- Student creation form
- Group assignment during creation
- Validation and error handling

**URL**: `/admin/students/new`

### 3. Edit Student Page (`app/admin/students/[id]/edit/page.tsx`)

Page for editing an existing student:

**Features**:
- Pre-populated form with student data
- Update all student information
- Reassign to different group

**URL**: `/admin/students/[id]/edit`

### 4. Updated Group Detail Page (`app/admin/groups/[id]/page.tsx`)

Enhanced to show students in the group:

**New Features**:
- Lists all students in the group
- Student count display
- Quick link to manage students
- Student avatars with initials
- Link to add first student if empty

## Dashboard Updates

### Updated `lib/dashboard.ts`

1. **getEntityCounts()** - Now includes student count
   ```typescript
   return {
     courses,
     instructors,
     rooms,
     groups,
     students,  // NEW
     timetables,
   };
   ```

2. **getStudentDashboardData(userId)** - Updated for new schema
   - Now finds student by userId first
   - Then retrieves group information
   - Returns student details along with group data

### Updated Admin Dashboard (`app/admin/page.tsx`)

**New Features**:
- Student count card in statistics
- Quick action card for Students management
- Link to `/admin/students`

## How to Use

### Adding Students to Groups

There are multiple ways to add students to groups:

#### Method 1: Create Student with Group Assignment

1. Go to **Admin → Students**
2. Click **Add Student**
3. Fill in student details
4. Select a **Student Group** from the dropdown
5. Click **Create Student**

#### Method 2: Edit Existing Student

1. Go to **Admin → Students**
2. Find the student and click **Edit**
3. Change the **Student Group** dropdown
4. Click **Update Student**

#### Method 3: Bulk Assignment

1. Go to **Admin → Students**
2. Use checkboxes to select multiple students
3. Click **Assign to Group**
4. Select the target group
5. Click **Assign**

#### Method 4: From Group Detail Page

1. Go to **Admin → Student Groups**
2. Click on a group
3. Click **Manage Students** button
4. This filters the students page to show options for that group

### Viewing Students in a Group

1. Go to **Admin → Student Groups**
2. Click on a group name
3. The **Students** section shows all students in that group
4. Each student card shows:
   - Name with avatar (initials)
   - Student ID
   - Email address
   - Quick edit button

### Filtering Students

The students list page supports multiple filters:

- **Search**: By name, email, or student ID
- **Program**: Filter by academic program
- **Year**: Filter by academic year (1-5)
- **Semester**: Filter by semester (1-2)
- **Group Status**: 
  - All Students
  - With Group (assigned)
  - Without Group (unassigned)

### Bulk Operations

Select multiple students using checkboxes to:

1. **Assign to Group**: Move students to a specific group
2. **Remove from Group**: Unassign students (select "Remove from Group" option)

## Data Flow

### Student Creation Flow

```
User Input → StudentForm → createStudent action
  ↓
Validation (Zod schema)
  ↓
Check uniqueness (studentId, email)
  ↓
Create Student record
  ↓
Revalidate pages
  ↓
Redirect to students list
```

### Group Assignment Flow

```
Select Students → Bulk Assign Dialog
  ↓
Choose Target Group
  ↓
bulkAssignStudentsToGroup action
  ↓
Update studentGroupId for all selected
  ↓
Revalidate affected pages
  ↓
Show success message
```

## Key Features

### 1. Individual Student Tracking

- Each student has a unique student ID
- Personal information (name, email)
- Academic details (program, year, semester)
- Optional link to user account for portal access

### 2. Flexible Group Assignment

- Students can be assigned to groups
- Students can be unassigned (no group)
- Bulk assignment operations
- Easy reassignment between groups

### 3. Comprehensive Filtering

- Search across multiple fields
- Filter by academic attributes
- Filter by group assignment status
- Combine multiple filters

### 4. Validation and Data Integrity

- Unique student IDs
- Unique email addresses
- Format validation for student IDs
- Referential integrity with cascading deletes

### 5. User Account Integration

- Students can be linked to user accounts
- Enables portal access for students
- One-to-one relationship
- Optional (students can exist without accounts)

## Benefits

### For Administrators

1. **Granular Control**: Manage individual students rather than just group sizes
2. **Accurate Records**: Track actual student enrollment
3. **Flexible Assignment**: Easily move students between groups
4. **Bulk Operations**: Efficiently manage large numbers of students
5. **Better Reporting**: Generate accurate statistics and reports

### For Students

1. **Personal Accounts**: Students can log in to view their schedules
2. **Accurate Schedules**: See schedules specific to their group
3. **Personal Information**: Maintain their own profile data

### For the System

1. **Data Integrity**: Proper relationships between entities
2. **Scalability**: Supports large numbers of students
3. **Flexibility**: Easy to extend with additional student features
4. **Consistency**: Aligns with how instructors are managed

## Future Enhancements

Potential improvements for future iterations:

1. **Student Import**: Bulk import students from CSV/Excel
2. **Student Photos**: Upload and display student photos
3. **Attendance Tracking**: Track student attendance
4. **Grade Management**: Link to grading system
5. **Student Portal**: Enhanced student-facing features
6. **Parent Access**: Allow parents to view student schedules
7. **Communication**: Send notifications to students
8. **Student History**: Track group changes over time
9. **Academic Records**: Link to transcript system
10. **Financial Integration**: Link to fee payment system

## Migration Notes

### For Existing Deployments

If you have an existing deployment with student groups:

1. **Backup Database**: Always backup before migration
2. **Run Migration**: Apply the `add_student_model` migration
3. **Create Students**: Manually create student records or import from external system
4. **Assign to Groups**: Use bulk assignment to populate groups
5. **Update Size**: The `size` field in StudentGroup is now informational only

### Data Consistency

- The `size` field in `StudentGroup` is still maintained for reference
- It represents the intended/maximum group size
- Actual student count is `students.length`
- These may differ (e.g., group size 30, but only 25 students assigned)

## Related Files

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/20251115024246_add_student_model/` - Migration files

### Server Actions
- `actions/students.ts` - Student CRUD operations

### Library Functions
- `lib/students.ts` - Student queries
- `lib/dashboard.ts` - Dashboard data (updated)

### Components
- `components/student-form.tsx` - Student form
- `components/students-table.tsx` - Students table

### Pages
- `app/admin/students/page.tsx` - Students list
- `app/admin/students/new/page.tsx` - New student
- `app/admin/students/[id]/edit/page.tsx` - Edit student
- `app/admin/groups/[id]/page.tsx` - Group detail (updated)
- `app/admin/page.tsx` - Admin dashboard (updated)

## Conclusion

The student management implementation provides a comprehensive solution for tracking individual students and managing their group assignments. The system maintains backward compatibility with the group size field while adding powerful new capabilities for student management. The implementation follows the same patterns used for instructors and other entities, ensuring consistency across the application.
