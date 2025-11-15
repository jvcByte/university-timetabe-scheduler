# Implementation Plan

- [ ] 1. Database Schema Updates
  - [ ] 1.1 Add startDate, endDate, and archivedAt fields to Timetable model in Prisma schema
    - Update `prisma/schema.prisma` with new fields
    - _Requirements: 2.2, 4.3_
  
  - [ ] 1.2 Create and run database migration
    - Generate Prisma migration
    - Set default values for existing timetables
    - _Requirements: 2.2_
  
  - [ ] 1.3 Add database indexes for performance
    - Create index on (startDate, endDate)
    - Create index on status
    - Create composite index on (status, endDate)
    - _Requirements: 2.2, 4.1_

- [ ] 2. Validation Service Implementation
  - [ ] 2.1 Create timetable validation utility functions
    - Implement date range validation
    - Implement period length validation (1-7 days)
    - Implement past date check
    - _Requirements: 1.4, 2.4, 5.1, 5.2_
  
  - [ ] 2.2 Implement overlap detection service
    - Create function to query overlapping timetables
    - Return detailed conflict information
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.3 Create validation schema for timetable generation
    - Update Zod schema with date validations
    - Add custom validators for period checks
    - _Requirements: 2.1, 5.3, 5.4_

- [ ] 3. Timetable Generation Updates
  - [ ] 3.1 Update generation form to include date pickers
    - Add start date input field
    - Add end date input field with auto-calculation
    - Add date validation on client side
    - _Requirements: 2.1, 2.5, 5.5_
  
  - [ ] 3.2 Update generation action to validate periods
    - Check for overlapping timetables before generation
    - Return error if overlap exists
    - Store startDate and endDate with timetable
    - _Requirements: 1.1, 1.2, 1.3, 2.2_
  
  - [ ] 3.3 Update generation UI to show conflicts
    - Display error message with conflicting timetable details
    - Show link to existing timetable
    - _Requirements: 1.2_

- [ ] 4. Deletion Functionality
  - [ ] 4.1 Create deletion service
    - Implement canDelete check (status validation)
    - Implement deleteTimetable with transaction
    - Cascade delete assignments
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ] 4.2 Add delete button to timetable detail page
    - Show delete button for DRAFT and GENERATED status
    - Hide delete button for PUBLISHED status
    - _Requirements: 3.1, 3.4_
  
  - [ ] 4.3 Create delete confirmation dialog component
    - Show timetable details
    - Show assignment count
    - Require explicit confirmation
    - _Requirements: 3.2_
  
  - [ ] 4.4 Implement delete action handler
    - Call deletion service
    - Handle success and error cases
    - Redirect to timetables list on success
    - _Requirements: 3.3, 3.5_

- [ ] 5. Unpublish Functionality
  - [ ] 5.1 Create unpublish service
    - Verify timetable is PUBLISHED
    - Update status to GENERATED
    - Clear publishedAt timestamp
    - _Requirements: 7.3, 7.4_
  
  - [ ] 5.2 Add unpublish button to timetable detail page
    - Show for PUBLISHED timetables only
    - _Requirements: 7.1_
  
  - [ ] 5.3 Create unpublish confirmation dialog
    - Warn about visibility impact
    - _Requirements: 7.2_
  
  - [ ] 5.4 Implement unpublish action handler
    - Call unpublish service
    - Update UI on success
    - _Requirements: 7.5_

- [ ] 6. Archiving Service
  - [ ] 6.1 Create archiving utility functions
    - Implement findExpiredTimetables query
    - Implement archiveTimetable update
    - _Requirements: 4.1, 4.2_
  
  - [ ] 6.2 Create archiving cron job
    - Set up daily schedule (midnight)
    - Call archiving service
    - Log results
    - _Requirements: 4.1, 4.5_
  
  - [ ] 6.3 Implement archiving service
    - Query expired PUBLISHED timetables
    - Update status to ARCHIVED
    - Set archivedAt timestamp
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 7. Timetable List View Enhancements
  - [ ] 7.1 Update timetable list to display periods
    - Show startDate - endDate for each timetable
    - Format dates appropriately
    - _Requirements: 2.3, 6.1_
  
  - [ ] 7.2 Add status filter dropdown
    - Add filter options: All, Active, Upcoming, Expired, Archived
    - Implement filter logic
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ] 7.3 Update timetable list query to support filtering
    - Add date-based filtering
    - Add status filtering
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ] 7.4 Update default sorting
    - Sort by startDate descending
    - _Requirements: 6.5_

- [ ] 8. Archive Management View
  - [ ] 8.1 Create archived timetables page
    - List archived timetables
    - Show archiving date
    - _Requirements: 8.1, 8.5_
  
  - [ ] 8.2 Implement read-only timetable view
    - Disable edit actions
    - Disable delete actions
    - _Requirements: 8.2, 8.4_
  
  - [ ] 8.3 Add export functionality for archived timetables
    - Support PDF export
    - Support Excel export
    - _Requirements: 8.3_

- [ ] 9. Error Handling and Validation
  - [ ] 9.1 Create error types and messages
    - Define OverlapError
    - Define InvalidPeriodError
    - Define DeletionNotAllowedError
    - _Requirements: 1.2, 3.4, 5.3_
  
  - [ ] 9.2 Implement server-side validation
    - Validate all date inputs
    - Validate period constraints
    - _Requirements: 1.4, 1.5, 2.4, 5.1, 5.2_
  
  - [ ] 9.3 Implement client-side validation
    - Add form validation
    - Show inline error messages
    - _Requirements: 5.3, 5.4_

- [ ] 10. Testing and Documentation
  - [ ] 10.1 Write unit tests for validation service
    - Test date range validation
    - Test overlap detection
    - Test period length validation
    - _Requirements: All validation requirements_
  
  - [ ] 10.2 Write unit tests for deletion service
    - Test successful deletion
    - Test deletion prevention
    - Test cascade deletion
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ] 10.3 Write unit tests for archiving service
    - Test expired timetable detection
    - Test status update
    - Test job execution
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 10.4 Perform integration testing
    - Test complete generation flow
    - Test deletion flow
    - Test archiving flow
    - _Requirements: All requirements_
  
  - [ ] 10.5 Update user documentation
    - Document new date fields
    - Document deletion process
    - Document archiving behavior
    - _Requirements: All requirements_
