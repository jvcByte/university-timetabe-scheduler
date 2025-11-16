# E2E Tests for University Timetable Scheduler

This directory contains end-to-end tests for the University Timetable Scheduler application using Playwright.

## Test Coverage

### 1. Admin Login and Course Creation Flow (`admin-login-course-creation.spec.ts`)
- ✅ Admin login with valid credentials
- ✅ Course creation workflow
- ✅ Form validation for invalid data
- ✅ Error handling for invalid login

### 2. Timetable Generation Flow (`timetable-generation.spec.ts`)
- ✅ Complete timetable generation process
- ✅ Generation progress tracking
- ✅ Error handling for insufficient data
- ✅ Timetable detail viewing

### 3. Manual Editing and Validation (`manual-editing-validation.spec.ts`)
- ✅ Timetable edit mode access
- ✅ Filtering by room, instructor, and student group
- ✅ Clear filters functionality
- ✅ Drag and drop assignment editing
- ✅ Conflict validation

### 4. Export Functionality (`export-functionality.spec.ts`)
- ✅ CSV export for course data
- ✅ Excel export for course data
- ✅ PDF export for timetables
- ✅ Excel export for timetables
- ✅ Filtered export functionality
- ✅ CSV import functionality

### 5. Role-Based Access Control (`role-based-access-control.spec.ts`)
- ✅ Admin access to all admin routes
- ✅ Faculty access restrictions
- ✅ Student access restrictions
- ✅ Unauthenticated user redirects
- ✅ Role-based navigation menus
- ✅ Faculty schedule and availability management
- ✅ API route protection

### 6. Comprehensive User Flows (`comprehensive-user-flows.spec.ts`)
- ✅ Complete admin workflow (login → create course → generate timetable → export)
- ✅ Faculty workflow (login → view schedule → update availability)
- ✅ Data management workflow (create instructor → room → student group)
- ✅ Error handling scenarios
- ✅ Responsive design testing

## Requirements Coverage

The E2E tests cover the following requirements from the specification:

- **Requirement 2.7**: Role-based access control and authentication
- **Requirement 4.1**: Automated timetable generation
- **Requirement 6.2**: Manual timetable editing
- **Requirement 7.3**: Export functionality

## Running the Tests

### Prerequisites
1. Ensure the application is seeded with test data:
   ```bash
   npm run db:seed
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test admin-login-course-creation.spec.ts

# Run tests with specific browser
npx playwright test --project=chromium
```

### Test Data

The tests rely on the following seeded data:

**Admin User:**
- Email: `admin@university.edu`
- Password: `admin123`

**Faculty User:**
- Email: `john.smith@university.edu`
- Password: `faculty123`

**Test Entities:**
- Departments (Computer Science, Mathematics, etc.)
- Sample courses, instructors, rooms, and student groups
- Default constraint configuration

## Test Structure

### Setup
- `auth.setup.ts`: Handles authentication setup for tests that require login state

### Test Organization
Each test file focuses on a specific functional area:
- Authentication and authorization
- CRUD operations
- Complex workflows
- Error scenarios
- UI interactions

### Test Patterns
- Tests use data-testid attributes where available
- Fallback to text content and CSS selectors
- Graceful handling of missing features (test.skip)
- Proper cleanup and isolation

## Debugging

### Screenshots and Videos
- Screenshots are captured on failure
- Traces are recorded on first retry
- HTML reports include detailed information

### Common Issues
1. **Timing Issues**: Tests include appropriate waits for async operations
2. **Data Dependencies**: Tests handle cases where expected data might not exist
3. **Feature Availability**: Tests gracefully skip when features are not implemented

### Debug Mode
```bash
# Run with debug mode
npx playwright test --debug

# Run specific test with debug
npx playwright test admin-login-course-creation.spec.ts --debug
```

## CI/CD Integration

The tests are configured for CI environments:
- Retries: 2 attempts in CI, 0 locally
- Workers: 1 (to avoid database conflicts)
- Timeouts: Extended for slower CI environments

## Maintenance

### Adding New Tests
1. Create new spec file in `/e2e` directory
2. Follow existing naming convention
3. Include appropriate test data setup
4. Add graceful handling for missing features

### Updating Tests
- Update selectors when UI changes
- Maintain test data requirements
- Keep tests focused and isolated
- Update this README when adding new test coverage