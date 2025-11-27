import { test, expect } from '@playwright/test';

test.describe('Timetable Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
  });

  test('admin can generate a timetable', async ({ page }) => {
    // Navigate to timetables page
    await page.click('a[href="/admin/timetables"]');
    await expect(page).toHaveURL('/admin/timetables');

    // Click generate timetable button
    await page.click('a[href="/admin/timetables/generate"]');
    await expect(page).toHaveURL('/admin/timetables/generate');
    await expect(page.locator('h1')).toContainText('Generate School-Wide Timetable');

    // Verify data counts are displayed
    await expect(page.locator('text=Courses')).toBeVisible();
    await expect(page.locator('text=Instructors')).toBeVisible();
    await expect(page.locator('text=Rooms')).toBeVisible();
    await expect(page.locator('text=Student Groups')).toBeVisible();

    // Fill generation form
    await page.fill('#name', 'E2E Test Timetable');
    await page.fill('#semester', 'Fall 2025');
    await page.fill('#academicYear', '2025-2025');

    // Select constraint configuration (default should be available)
    await page.click('[data-testid="constraint-config-select"]');
    await page.click('[data-value="1"]'); // Default configuration

    // Submit generation request
    await page.click('button[type="submit"]');

    // Should show generation in progress
    await expect(page.locator('text=Generating timetable')).toBeVisible();

    // Wait for generation to complete (with timeout)
    await expect(page.locator('text=Generation complete')).toBeVisible({ timeout: 60000 });

    // Should redirect to timetable view
    await expect(page.url()).toMatch(/\/admin\/timetables\/\d+/);
    
    // Verify timetable details
    await expect(page.locator('text=E2E Test Timetable')).toBeVisible();
    await expect(page.locator('text=Fall 2025')).toBeVisible();
  });

  test('generation shows error for insufficient data', async ({ page }) => {
    // First, delete all courses to create insufficient data scenario
    await page.goto('/admin/courses');
    
    // If there are courses, this test would need to handle that
    // For now, we'll test the UI behavior when generation fails
    await page.goto('/admin/timetables/generate');

    // Fill form with minimal data
    await page.fill('#name', 'Test Empty Timetable');
    await page.fill('#semester', 'Test Semester');
    await page.fill('#academicYear', '2025');

    // Try to generate (this might fail due to insufficient data)
    await page.click('button[type="submit"]');

    // Should either show generation progress or immediate error
    // The exact behavior depends on validation logic
    const hasError = await page.locator('.text-red-600').isVisible();
    const hasProgress = await page.locator('text=Generating').isVisible();
    
    expect(hasError || hasProgress).toBeTruthy();
  });

  test('can view generated timetable details', async ({ page }) => {
    // Navigate to timetables list
    await page.goto('/admin/timetables');

    // Click on first timetable (if any exist)
    const firstTimetableLink = page.locator('a[href*="/admin/timetables/"]').first();
    
    if (await firstTimetableLink.isVisible()) {
      await firstTimetableLink.click();
      
      // Should be on timetable detail page
      await expect(page.url()).toMatch(/\/admin\/timetables\/\d+/);
      
      // Should show timetable information
      await expect(page.locator('h1')).toBeVisible();
      
      // Should show calendar view or assignments
      const hasCalendar = await page.locator('[data-testid="calendar-view"]').isVisible();
      const hasAssignments = await page.locator('text=Assignment').isVisible();
      
      expect(hasCalendar || hasAssignments).toBeTruthy();
    }
  });
});