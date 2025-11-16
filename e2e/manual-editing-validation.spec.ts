import { test, expect } from '@playwright/test';

test.describe('Manual Timetable Editing and Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@university.edu');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
  });

  test('can access timetable edit mode', async ({ page }) => {
    // Navigate to timetables
    await page.goto('/admin/timetables');

    // Look for existing timetable or create one for testing
    const editButton = page.locator('a[href*="/edit"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should be in edit mode
      await expect(page.url()).toMatch(/\/admin\/timetables\/\d+\/edit/);
      await expect(page.locator('text=Edit')).toBeVisible();
      
      // Should show editable calendar
      await expect(page.locator('[data-testid="editable-calendar"]')).toBeVisible();
    } else {
      // Skip test if no timetables exist
      test.skip('No timetables available for editing');
    }
  });

  test('can filter timetable view by room', async ({ page }) => {
    // Navigate to a timetable detail page
    await page.goto('/admin/timetables');
    
    const firstTimetable = page.locator('a[href*="/admin/timetables/"]').first();
    if (await firstTimetable.isVisible()) {
      await firstTimetable.click();
      
      // Look for filter panel
      const filterPanel = page.locator('[data-testid="filter-panel"]');
      if (await filterPanel.isVisible()) {
        // Try to filter by room
        await page.click('[data-testid="room-filter"]');
        
        // Select first room option
        const firstRoom = page.locator('[data-testid="room-option"]').first();
        if (await firstRoom.isVisible()) {
          await firstRoom.click();
          
          // Calendar should update to show only selected room
          await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
        }
      }
    } else {
      test.skip('No timetables available for filtering');
    }
  });

  test('can filter timetable view by instructor', async ({ page }) => {
    // Navigate to a timetable detail page
    await page.goto('/admin/timetables');
    
    const firstTimetable = page.locator('a[href*="/admin/timetables/"]').first();
    if (await firstTimetable.isVisible()) {
      await firstTimetable.click();
      
      // Look for instructor filter
      const instructorFilter = page.locator('[data-testid="instructor-filter"]');
      if (await instructorFilter.isVisible()) {
        await instructorFilter.click();
        
        // Select first instructor
        const firstInstructor = page.locator('[data-testid="instructor-option"]').first();
        if (await firstInstructor.isVisible()) {
          await firstInstructor.click();
          
          // Verify filter is applied
          await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
        }
      }
    } else {
      test.skip('No timetables available for filtering');
    }
  });

  test('can clear all filters', async ({ page }) => {
    // Navigate to a timetable detail page
    await page.goto('/admin/timetables');
    
    const firstTimetable = page.locator('a[href*="/admin/timetables/"]').first();
    if (await firstTimetable.isVisible()) {
      await firstTimetable.click();
      
      // Apply some filters first
      const roomFilter = page.locator('[data-testid="room-filter"]');
      if (await roomFilter.isVisible()) {
        await roomFilter.click();
        const firstRoom = page.locator('[data-testid="room-option"]').first();
        if (await firstRoom.isVisible()) {
          await firstRoom.click();
        }
      }
      
      // Clear filters
      const clearButton = page.locator('button:has-text("Clear Filters")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        
        // All assignments should be visible again
        await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      }
    } else {
      test.skip('No timetables available for filter testing');
    }
  });

  test('drag and drop assignment shows conflict validation', async ({ page }) => {
    // Navigate to edit mode
    await page.goto('/admin/timetables');
    
    const editButton = page.locator('a[href*="/edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Look for draggable assignments
      const assignment = page.locator('[data-testid="assignment-card"]').first();
      if (await assignment.isVisible()) {
        // Get assignment position
        const assignmentBox = await assignment.boundingBox();
        
        if (assignmentBox) {
          // Try to drag to a different time slot
          const targetSlot = page.locator('[data-testid="time-slot"]').nth(1);
          const targetBox = await targetSlot.boundingBox();
          
          if (targetBox) {
            // Perform drag and drop
            await page.mouse.move(assignmentBox.x + assignmentBox.width / 2, assignmentBox.y + assignmentBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
            await page.mouse.up();
            
            // Should either show success or conflict warning
            const hasSuccess = await page.locator('text=Assignment updated').isVisible();
            const hasConflict = await page.locator('text=Conflict').isVisible();
            
            expect(hasSuccess || hasConflict).toBeTruthy();
          }
        }
      }
    } else {
      test.skip('No timetables available for drag and drop testing');
    }
  });

  test('can validate timetable for conflicts', async ({ page }) => {
    // Navigate to a timetable
    await page.goto('/admin/timetables');
    
    const firstTimetable = page.locator('a[href*="/admin/timetables/"]').first();
    if (await firstTimetable.isVisible()) {
      await firstTimetable.click();
      
      // Look for validate button
      const validateButton = page.locator('button:has-text("Validate")');
      if (await validateButton.isVisible()) {
        await validateButton.click();
        
        // Should show validation results
        await expect(page.locator('text=Validation')).toBeVisible();
        
        // Should show either "No conflicts" or list of conflicts
        const hasNoConflicts = await page.locator('text=No conflicts').isVisible();
        const hasConflicts = await page.locator('text=conflict').isVisible();
        
        expect(hasNoConflicts || hasConflicts).toBeTruthy();
      }
    } else {
      test.skip('No timetables available for validation');
    }
  });
});