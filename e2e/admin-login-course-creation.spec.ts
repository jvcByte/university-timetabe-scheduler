import { test, expect } from '@playwright/test';

test.describe('Admin Login and Course Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login');
  });

  test('admin can login and create a new course', async ({ page }) => {
    // Test admin login
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Navigate to courses page
    await page.click('a[href="/admin/courses"]');
    await expect(page).toHaveURL('/admin/courses');
    await expect(page.locator('h1')).toContainText('Courses');

    // Click Add Course button
    await page.click('a[href="/admin/courses/new"]');
    await expect(page).toHaveURL('/admin/courses/new');

    // Fill out course form
    await page.fill('#code', 'TEST101');
    await page.fill('#title', 'Test Course for E2E');
    await page.fill('#duration', '90');
    await page.fill('#credits', '3');
    
    // Select department (assuming Computer Science exists from seed)
    await page.click('[data-testid="department-select"]');
    await page.click('[data-value="1"]'); // First department from seed
    
    // Select room type
    await page.click('[data-testid="room-type-select"]');
    await page.click('[data-value="LECTURE_HALL"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect back to courses list
    await expect(page).toHaveURL('/admin/courses');
    
    // Verify course appears in the list
    await expect(page.locator('text=TEST101')).toBeVisible();
    await expect(page.locator('text=Test Course for E2E')).toBeVisible();
  });

  test('admin login with invalid credentials shows error', async ({ page }) => {
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.text-red-600')).toContainText('Invalid credentials');
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('course creation with invalid data shows validation errors', async ({ page }) => {
    // Login first
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to new course page
    await page.goto('/admin/courses/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Course code is required')).toBeVisible();
    await expect(page.locator('text=Course title is required')).toBeVisible();
  });
});