# User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Administrator Guide](#administrator-guide)
4. [Faculty Guide](#faculty-guide)
5. [Student Guide](#student-guide)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the System

1. Open your web browser and navigate to the application URL
2. You will be redirected to the login page
3. Enter your email and password
4. Click "Sign In"

### First-Time Login

**Default Credentials (Development):**
- **Admin:** admin@university.edu / admin123
- **Faculty:** john.smith@university.edu / faculty123

⚠️ **Important:** Change your password after first login!

### Changing Your Password

1. Click on your profile icon in the top right
2. Select "Settings"
3. Navigate to "Security"
4. Enter your current password and new password
5. Click "Update Password"

---

## User Roles

The system supports three user roles:

### Administrator
- Full system access
- Manage all academic data (courses, instructors, rooms, groups)
- Generate and publish timetables
- View analytics and reports
- Import/export data

### Faculty
- View teaching schedule
- Set availability preferences
- View assigned courses
- Access personal dashboard

### Student
- View class schedule
- View course information
- Access personal dashboard

---

## Administrator Guide

### Dashboard Overview

The admin dashboard displays:
- **Entity Counts:** Total courses, instructors, rooms, and student groups
- **Timetable Status:** Current timetables and their status
- **Analytics:** Room utilization and instructor load charts
- **Recent Activity:** Latest system actions

### Managing Courses

#### Creating a Course

1. Navigate to **Admin → Courses**
2. Click **"New Course"** button
3. Fill in the course details:
   - **Code:** Unique course identifier (e.g., CS101)
   - **Title:** Course name
   - **Duration:** Class length in minutes (e.g., 90)
   - **Credits:** Number of credits
   - **Department:** Select department
   - **Room Type:** Required room type (optional)
4. Click **"Create Course"**

#### Editing a Course

1. Navigate to **Admin → Courses**
2. Find the course in the list
3. Click the **Edit** icon
4. Update the fields
5. Click **"Save Changes"**

#### Deleting a Course

1. Navigate to **Admin → Courses**
2. Find the course in the list
3. Click the **Delete** icon
4. Confirm deletion

⚠️ **Warning:** Deleting a course will remove all associated assignments.

#### Assigning Instructors to Courses

1. Edit the course
2. In the **Instructors** section, select one or more instructors
3. Mark one as **Primary Instructor**
4. Save changes

#### Assigning Student Groups to Courses

1. Edit the course
2. In the **Student Groups** section, select groups
3. Save changes

### Managing Instructors

#### Creating an Instructor

1. Navigate to **Admin → Instructors**
2. Click **"New Instructor"**
3. Fill in details:
   - **Name:** Full name
   - **Email:** Unique email address
   - **Department:** Select department
   - **Teaching Load:** Maximum hours per week
4. Click **"Create Instructor"**

#### Setting Instructor Availability

1. Edit the instructor
2. Navigate to **Availability** tab
3. For each day of the week:
   - Click **"Add Time Range"**
   - Select start and end times
   - Click **"Add"**
4. Save changes

**Example Availability:**
```
Monday:    09:00-12:00, 14:00-17:00
Tuesday:   09:00-17:00
Wednesday: 09:00-12:00
Thursday:  09:00-17:00
Friday:    09:00-12:00
```

#### Setting Instructor Preferences

1. Edit the instructor
2. Navigate to **Preferences** tab
3. Select **Preferred Days** (optional)
4. Add **Preferred Time Ranges** (optional)
5. Save changes

**Note:** Preferences are soft constraints - the system will try to honor them but may violate them if necessary.

### Managing Rooms

#### Creating a Room

1. Navigate to **Admin → Rooms**
2. Click **"New Room"**
3. Fill in details:
   - **Name:** Room identifier (e.g., "Room 101")
   - **Building:** Building name
   - **Capacity:** Maximum occupancy
   - **Type:** LECTURE_HALL, LAB, SEMINAR, or AUDITORIUM
   - **Equipment:** Select available equipment
4. Click **"Create Room"**

#### Room Types

- **LECTURE_HALL:** Standard classroom with seating
- **LAB:** Computer or science laboratory
- **SEMINAR:** Small discussion room
- **AUDITORIUM:** Large lecture hall

### Managing Student Groups

#### Creating a Student Group

1. Navigate to **Admin → Groups**
2. Click **"New Group"**
3. Fill in details:
   - **Name:** Group identifier (e.g., "CS-2025-A")
   - **Program:** Degree program
   - **Year:** Academic year
   - **Semester:** Current semester
   - **Size:** Number of students
4. Click **"Create Group"**

#### Assigning Courses to Groups

1. Edit the student group
2. In the **Courses** section, select courses
3. Save changes

### Importing Data

#### CSV Import

1. Navigate to the entity page (Courses, Instructors, Rooms, or Groups)
2. Click **"Import"** button
3. Click **"Choose File"** and select your CSV file
4. Review the preview
5. Click **"Import Data"**

**CSV Format Requirements:**

**Courses CSV:**
```csv
code,title,duration,credits,department,roomType
CS101,Intro to CS,90,3,Computer Science,LECTURE_HALL
MATH201,Calculus II,90,4,Mathematics,LECTURE_HALL
```

**Instructors CSV:**
```csv
name,email,department,teachingLoad
Dr. John Smith,john.smith@university.edu,Computer Science,20
Dr. Jane Doe,jane.doe@university.edu,Mathematics,18
```

**Rooms CSV:**
```csv
name,building,capacity,type,equipment
Room 101,Main Building,50,LECTURE_HALL,"PROJECTOR,WHITEBOARD"
Lab 201,Science Building,30,LAB,"COMPUTERS,PROJECTOR"
```

**Student Groups CSV:**
```csv
name,program,year,semester,size
CS-2025-A,Computer Science,2025,1,30
MATH-2025-B,Mathematics,2025,1,25
```

#### Excel Import

1. Follow the same steps as CSV import
2. Select an Excel file (.xlsx)
3. The system will read the first sheet

### Exporting Data

1. Navigate to the entity page
2. Click **"Export"** button
3. Choose format:
   - **CSV:** Plain text, compatible with Excel
   - **Excel:** Formatted spreadsheet with headers
4. File will download automatically

### Configuring Constraints

#### Accessing Constraint Configuration

1. Navigate to **Admin → Constraints**
2. View current configuration

#### Hard Constraints

Hard constraints **must** be satisfied. Toggle on/off:

- ✅ **No Room Double-Booking:** Prevent room conflicts
- ✅ **No Instructor Double-Booking:** Prevent instructor conflicts
- ✅ **Room Capacity Check:** Ensure rooms fit student groups
- ✅ **Room Type Match:** Match course requirements to room types
- ✅ **Working Hours Only:** Schedule within working hours

**Recommendation:** Keep all hard constraints enabled.

#### Soft Constraints

Soft constraints are preferences. Adjust weights (0-10):

- **Instructor Preferences (5):** Honor instructor day/time preferences
- **Compact Schedules (7):** Minimize gaps in student schedules
- **Balanced Daily Load (6):** Distribute instructor workload evenly
- **Preferred Rooms (3):** Use appropriately sized rooms

**Higher weight = Higher priority**

#### Working Hours

Set the scheduling window:
- **Start Time:** e.g., 08:00
- **End Time:** e.g., 18:00

All classes will be scheduled within this window.

### Generating Timetables

#### Starting Generation

1. Navigate to **Admin → Timetables**
2. Click **"Generate New Timetable"**
3. Fill in details:
   - **Name:** Descriptive name (e.g., "Fall 2025 Schedule")
   - **Semester:** e.g., "Fall 2025"
   - **Academic Year:** e.g., "2025-2025"
4. Click **"Generate"**

#### Generation Process

The system will:
1. Collect all courses, instructors, rooms, and groups
2. Run the optimization algorithm (local solver by default)
3. Display progress indicator
4. Show results when complete

**Solver Options:**
- **Fast Local Solver** (Default, Recommended): Quick results, good quality
- **OR-Tools Solver**: Slower but can prove optimality

**Typical Generation Time (Local Solver):**
- 50 courses: 5-10 seconds
- 100 courses: 10-20 seconds
- 200 courses: 20-40 seconds
- 300+ courses: 30-60 seconds

**Typical Generation Time (OR-Tools Solver):**
- 50 courses: 10-30 seconds
- 100 courses: 30-90 seconds
- 200 courses: 60-180 seconds
- 500+ courses: 2-5 minutes

#### Understanding Results

**Success:**
- ✅ **Fitness Score:** 0-100 (lower is better)
  - 0-10: Excellent
  - 10-30: Good
  - 30-50: Acceptable
  - 50+: Poor
- **Assignments:** Number of scheduled classes
- **Violations:** List of soft constraint violations

**Failure:**
- ❌ **Error Message:** Describes why generation failed
- **Suggestions:** Recommended actions to fix the issue

#### Common Generation Issues

**Issue:** "Not enough room-time slots"
- **Solution:** Add more rooms or extend working hours

**Issue:** "No room with sufficient capacity"
- **Solution:** Add larger rooms or split student groups

**Issue:** "Instructor needs X hours but only has Y hours available"
- **Solution:** Expand instructor availability or assign fewer courses

**Issue:** "No room of type 'LAB' for course CS201"
- **Solution:** Add LAB rooms or change course room type requirement

### Viewing Timetables

#### Calendar View

1. Navigate to **Admin → Timetables**
2. Click on a timetable
3. View the weekly calendar grid

**Features:**
- Color-coded by course or group
- Shows course, instructor, room, and group for each assignment
- Hover for details
- Click for more information

#### Filtering

Use the filter panel to view specific schedules:

**Filter by Room:**
1. Select a room from the dropdown
2. View only classes in that room

**Filter by Instructor:**
1. Select an instructor
2. View their teaching schedule

**Filter by Student Group:**
1. Select a group
2. View their class schedule

**Clear Filters:**
- Click **"Clear All Filters"** to reset

#### View Modes

- **Week View:** See entire week at once
- **Day View:** Focus on one day
- **List View:** Tabular format

### Editing Timetables

#### Manual Editing

1. Open a timetable
2. Click **"Edit Mode"**
3. Drag and drop assignments to new time slots
4. The system validates changes in real-time

#### Conflict Detection

If you create a conflict:
- ❌ Red border appears on the assignment
- Warning message displays
- Change is prevented

**Conflicts:**
- Room double-booking
- Instructor double-booking
- Student group double-booking
- Room capacity exceeded
- Instructor unavailable

#### Editing Assignment Details

1. Click on an assignment
2. Edit dialog opens
3. Change:
   - Instructor
   - Room
   - Time
4. Click **"Save"**

The system validates changes before saving.

### Publishing Timetables

#### Publishing Process

1. Open a timetable
2. Review for accuracy
3. Click **"Publish"** button
4. Confirm publication

**Effects of Publishing:**
- Status changes to **PUBLISHED**
- Timetable becomes visible to faculty and students
- Timestamp recorded

#### Unpublishing

1. Open a published timetable
2. Click **"Unpublish"**
3. Confirm

The timetable will no longer be visible to faculty and students.

### Exporting Timetables

#### PDF Export

1. Open a timetable
2. Click **"Export"** → **"PDF"**
3. Choose scope:
   - **Full Timetable:** All assignments
   - **By Room:** One PDF per room
   - **By Instructor:** One PDF per instructor
   - **By Group:** One PDF per student group
4. PDF downloads automatically

**PDF Features:**
- Professional formatting
- University branding (if configured)
- Weekly calendar layout
- Assignment details

#### Excel Export

1. Open a timetable
2. Click **"Export"** → **"Excel"**
3. Choose scope (same as PDF)
4. Excel file downloads

**Excel Features:**
- Multiple sheets (one per day or entity)
- Formatted tables
- Sortable and filterable
- Easy to share and print

### Analytics and Reports

#### Dashboard Analytics

**Entity Statistics:**
- Total courses, instructors, rooms, groups
- Growth trends

**Room Utilization:**
- Percentage of time each room is used
- Identify underutilized rooms
- Bar chart visualization

**Instructor Load:**
- Teaching hours per instructor
- Distribution chart
- Identify overloaded instructors

**Constraint Violations:**
- Breakdown by violation type
- Pie chart visualization

#### Generating Reports

1. Navigate to **Admin → Analytics**
2. Select report type
3. Choose date range
4. Click **"Generate Report"**
5. View or download

---

## Faculty Guide

### Dashboard

The faculty dashboard shows:
- **My Schedule:** Upcoming classes
- **Teaching Load:** Total hours this week
- **Assigned Courses:** List of courses you teach
- **Availability Status:** Current availability settings

### Viewing Your Schedule

1. Navigate to **Faculty → Schedule**
2. View your teaching schedule in calendar format
3. Filter by:
   - Week
   - Course
   - Room

### Setting Availability

#### Updating Availability

1. Navigate to **Faculty → Availability**
2. For each day:
   - Click **"Add Time Range"**
   - Select start and end times
   - Click **"Add"**
3. Click **"Save Changes"**

**Example:**
```
Monday:    09:00-12:00, 14:00-17:00
Tuesday:   09:00-17:00
Wednesday: 09:00-12:00
Thursday:  09:00-17:00
Friday:    09:00-12:00
```

#### Setting Preferences

1. Navigate to **Faculty → Availability**
2. Scroll to **Preferences** section
3. Select preferred days (optional)
4. Add preferred time ranges (optional)
5. Save changes

**Note:** Preferences are considered during scheduling but may be overridden if necessary.

### Viewing Course Information

1. Navigate to **Faculty → Courses**
2. Click on a course
3. View:
   - Course details
   - Enrolled student groups
   - Schedule (when assigned)
   - Room assignments

### Exporting Your Schedule

1. Navigate to **Faculty → Schedule**
2. Click **"Export"**
3. Choose format (PDF or Excel)
4. Download

---

## Student Guide

### Dashboard

The student dashboard shows:
- **My Schedule:** Upcoming classes
- **Enrolled Courses:** List of your courses
- **This Week:** Classes for the current week

### Viewing Your Schedule

1. Navigate to **Student → Schedule**
2. View your class schedule in calendar format
3. See:
   - Course name
   - Instructor
   - Room
   - Time

### Viewing Course Information

1. Navigate to **Student → Courses**
2. Click on a course
3. View:
   - Course details
   - Instructor information
   - Schedule
   - Room location

### Exporting Your Schedule

1. Navigate to **Student → Schedule**
2. Click **"Export"**
3. Choose format (PDF or Excel)
4. Download

**Use Cases:**
- Print for reference
- Add to personal calendar
- Share with parents/advisors

---

## Troubleshooting

### Login Issues

**Problem:** Cannot log in
- **Solution:** Verify email and password are correct
- **Solution:** Contact administrator to reset password
- **Solution:** Clear browser cache and cookies

**Problem:** Redirected to unauthorized page
- **Solution:** Verify you have the correct role for the page
- **Solution:** Contact administrator to verify account status

### Timetable Generation Issues

**Problem:** Generation takes too long
- **Solution:** Wait up to 5 minutes for complex schedules
- **Solution:** Reduce number of courses or constraints
- **Solution:** Contact administrator

**Problem:** Generation fails with "infeasible" error
- **Solution:** Review error message for specific issues
- **Solution:** Add more rooms or extend working hours
- **Solution:** Relax instructor availability constraints
- **Solution:** Contact administrator for assistance

**Problem:** Poor fitness score (50+)
- **Solution:** Review soft constraint violations
- **Solution:** Adjust constraint weights
- **Solution:** Expand instructor availability
- **Solution:** Add more suitable rooms

### Data Import Issues

**Problem:** CSV import fails
- **Solution:** Verify CSV format matches template
- **Solution:** Check for special characters or encoding issues
- **Solution:** Ensure all required fields are present
- **Solution:** Remove empty rows

**Problem:** Some rows skipped during import
- **Solution:** Check for duplicate codes/emails
- **Solution:** Verify data types (numbers vs. text)
- **Solution:** Review error messages

### Display Issues

**Problem:** Calendar not displaying correctly
- **Solution:** Refresh the page
- **Solution:** Clear browser cache
- **Solution:** Try a different browser
- **Solution:** Check browser console for errors

**Problem:** Drag and drop not working
- **Solution:** Ensure you're in Edit Mode
- **Solution:** Try a different browser
- **Solution:** Disable browser extensions

### Performance Issues

**Problem:** Slow page loading
- **Solution:** Check internet connection
- **Solution:** Clear browser cache
- **Solution:** Close unnecessary browser tabs
- **Solution:** Contact administrator if issue persists

**Problem:** Export takes too long
- **Solution:** Export smaller subsets (by room/instructor/group)
- **Solution:** Wait for large exports to complete
- **Solution:** Try during off-peak hours

### Getting Help

**Contact Administrator:**
- Email: admin@university.edu
- Phone: (555) 123-4567
- Office: Admin Building, Room 101

**Technical Support:**
- Email: support@university.edu
- Hours: Monday-Friday, 9:00 AM - 5:00 PM

**Documentation:**
- User Guide: This document
- API Documentation: For developers
- FAQ: Frequently asked questions

---

## Best Practices

### For Administrators

1. **Regular Backups:** Export data regularly
2. **Test Before Publishing:** Review timetables thoroughly
3. **Communicate Changes:** Notify users of schedule updates
4. **Monitor Analytics:** Track room utilization and instructor load
5. **Update Constraints:** Adjust based on feedback

### For Faculty

1. **Update Availability Early:** Set availability before scheduling
2. **Keep Preferences Realistic:** Don't over-constrain
3. **Check Schedule Regularly:** Review for changes
4. **Report Issues Promptly:** Contact admin for conflicts

### For Students

1. **Check Schedule Weekly:** Stay informed of changes
2. **Export Schedule:** Keep a backup copy
3. **Note Room Locations:** Plan routes between classes
4. **Report Conflicts:** Notify admin of scheduling issues

---

## Keyboard Shortcuts

### Global

- `Ctrl/Cmd + K`: Open search
- `Ctrl/Cmd + /`: Show keyboard shortcuts
- `Esc`: Close dialogs

### Calendar View

- `←` / `→`: Previous/Next week
- `↑` / `↓`: Previous/Next day
- `T`: Go to today
- `E`: Enter edit mode
- `F`: Open filter panel

### Data Tables

- `Ctrl/Cmd + F`: Search table
- `Ctrl/Cmd + N`: New item
- `Ctrl/Cmd + E`: Edit selected
- `Delete`: Delete selected

---

## Glossary

- **Assignment:** A scheduled class event
- **Constraint:** A rule or preference for scheduling
- **Fitness Score:** Quality metric for timetables (0-100, lower is better)
- **Hard Constraint:** Must be satisfied (e.g., no conflicts)
- **Soft Constraint:** Preference to optimize (e.g., instructor preferences)
- **Infeasible:** No valid solution exists
- **Time Slot:** A specific day and time period
- **Timetable:** Complete schedule for a semester

---

## Appendix: Sample Workflows

### Workflow 1: Setting Up a New Semester

1. Import or create courses
2. Import or create instructors
3. Set instructor availability
4. Import or create rooms
5. Import or create student groups
6. Assign courses to instructors and groups
7. Configure constraints
8. Generate timetable
9. Review and edit as needed
10. Publish timetable

### Workflow 2: Making Schedule Changes

1. Open published timetable
2. Enter edit mode
3. Drag assignment to new time slot
4. Verify no conflicts
5. Save changes
6. Notify affected parties

### Workflow 3: Adding a New Course Mid-Semester

1. Create new course
2. Assign instructor and groups
3. Open current timetable
4. Enter edit mode
5. Manually place new course
6. Verify no conflicts
7. Save and notify

---

**Version:** 1.0.0  
**Last Updated:** November 26, 2025  
**For Support:** support@university.edu
