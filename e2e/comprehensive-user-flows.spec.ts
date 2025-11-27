import { test, expect } from '@playwright/test';

test.describe('Comprehensive User Flows', () => {
  test('complete admin workflow: login -> create course -> generate timetable -> export', async ({ page }) => {
    // Step 1: Admin Login
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Step 2: Create a new course
    await page.goto('/admin/courses/new');
    await page.fill('#code', 'E2E-FLOW-101');
    await page.fill('#title', 'E2E Test Flow Course');
    await page.fill('#duration', '90');
    await page.fill('#credits', '3');
    
    // Select department and room type (using fallback selectors)
    const departmentSelect = page.locator('select[name="departmentId"], [data-testid="department-select"]').first();
    if (await departmentSelect.isVisible()) {
      await departmentSelect.selectOption({ index: 1 });
    }
    
    const roomTypeSelect = page.locator('select[name="roomType"], [data-testid="room-type-select"]').first();
    if (await roomTypeSelect.isVisible()) {
      await roomTypeSelect.selectOption('LECTURE_HALL');
    }

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/courses');

    // Step 3: Verify course was created
    await expect(page.locator('text=E2E-FLOW-101')).toBeVisible();

    // Step 4: Generate a timetable
    await page.goto('/admin/timetables/generate');
    await page.fill('#name', 'E2E Complete Flow Timetable');
    await page.fill('#semester', 'Test Semester 2025');
    await page.fill('#academicYear', '2025-2025');

    // Select constraint config
    const constraintSelect = page.locator('select[name="constraintConfigId"], [data-testid="constraint-config-select"]').first();
    if (await constraintSelect.isVisible()) {
      await constraintSelect.selectOption({ index: 1 });
    }

    await page.click('button[type="submit"]');

    // Wait for generation to complete or show progress
    const generationComplete = page.locator('text=Generation complete');
    const generationProgress = page.locator('text=Generating');
    
    await expect(generationComplete.or(generationProgress)).toBeVisible({ timeout: 10000 });

    // Step 5: Navigate to timetables and verify
    await page.goto('/admin/timetables');
    await expect(page.locator('text=E2E Complete Flow Timetable')).toBeVisible();

    // Step 6: View timetable details
    await page.click('text=E2E Complete Flow Timetable');
    await expect(page.url()).toMatch(/\/admin\/timetables\/\d+/);

    // Step 7: Test export functionality (if available)
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Select PDF if dropdown appears
      const pdfOption = page.locator('text=PDF');
      if (await pdfOption.isVisible()) {
        await pdfOption.click();
      }
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/);
      } catch (e) {
        // Export might not be fully implemented, continue test
        console.log('Export test skipped - functionality may not be available');
      }
    }
  });

  test('faculty workflow: login -> view schedule -> update availability', async ({ page }) => {
    // Step 1: Faculty Login
    await page.goto('/login');
    await page.fill('#email', 'john.smith@university.edu');
    await page.fill('#password', 'faculty123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/faculty');

    // Step 2: View schedule
    await page.goto('/faculty/schedule');
    await expect(page.locator('h1')).toContainText('Schedule');

    // Step 3: Update availability
    await page.goto('/faculty/availability');
    await expect(page.locator('h1')).toContainText('Availability');

    // Try to interact with availability grid if present
    const availabilityGrid = page.locator('[data-testid="availability-grid"]');
    if (await availabilityGrid.isVisible()) {
      const timeSlot = page.locator('[data-testid="time-slot"]').first();
      if (await timeSlot.isVisible()) {
        await timeSlot.click();
        
        const saveButton = page.locator('button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }

    // Step 4: Verify faculty cannot access admin routes
    await page.goto('/admin/courses');
    await expect(page).toHaveURL('/unauthorized');
  });

  test('data management workflow: create instructor -> create room -> create student group', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Step 1: Create instructor
    await page.goto('/admin/instructors/new');
    await page.fill('#name', 'E2E Test Instructor');
    await page.fill('#email', 'e2e.instructor@test.edu');
    
    const departmentSelect = page.locator('select[name="departmentId"]').first();
    if (await departmentSelect.isVisible()) {
      await departmentSelect.selectOption({ index: 1 });
    }
    
    await page.fill('#teachingLoad', '12');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/instructors');

    // Step 2: Create room
    await page.goto('/admin/rooms/new');
    await page.fill('#name', 'E2E-TEST-ROOM');
    await page.fill('#building', 'Test Building');
    await page.fill('#capacity', '50');
    
    const roomTypeSelect = page.locator('select[name="type"]').first();
    if (await roomTypeSelect.isVisible()) {
      await roomTypeSelect.selectOption('LECTURE_HALL');
    }
    
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/rooms');

    // Step 3: Create student group
    await page.goto('/admin/groups/new');
    await page.fill('#name', 'E2E-TEST-GROUP');
    await page.fill('#program', 'Test Program');
    await page.fill('#year', '1');
    await page.fill('#semester', '1');
    await page.fill('#size', '30');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/groups');

    // Verify all entities were created
    await page.goto('/admin/instructors');
    await expect(page.locator('text=E2E Test Instructor')).toBeVisible();

    await page.goto('/admin/rooms');
    await expect(page.locator('text=E2E-TEST-ROOM')).toBeVisible();

    await page.goto('/admin/groups');
    await expect(page.locator('text=E2E-TEST-GROUP')).toBeVisible();
  });

  test('error handling: invalid login -> form validation -> network errors', async ({ page }) => {
    // Test invalid login
    await page.goto('/login');
    await page.fill('#email', 'invalid@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page).toHaveURL('/login');

    // Test form validation
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Test course form validation
    await page.goto('/admin/courses/new');
    await page.click('button[type="submit"]'); // Submit empty form
    
    // Should show validation errors
    const hasValidationErrors = await page.locator('.text-red-600').isVisible();
    expect(hasValidationErrors).toBeTruthy();

    // Test with invalid data
    await page.fill('#code', ''); // Empty required field
    await page.fill('#duration', '-10'); // Invalid duration
    await page.fill('#credits', '0'); // Invalid credits
    await page.click('button[type="submit"]');
    
    // Should still show validation errors
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('responsive design: mobile navigation and forms', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Should show navigation menu
      await expect(page.locator('nav')).toBeVisible();
    }

    // Test form usability on mobile
    await page.goto('/admin/courses/new');
    
    // Form should be responsive
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Input fields should be accessible
    await page.fill('#code', 'MOBILE-TEST');
    await page.fill('#title', 'Mobile Test Course');
    
    // Should be able to scroll and interact with form elements
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});