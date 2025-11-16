import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login');
  
  await page.fill('#email', 'admin@university.edu');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  // Wait until the page receives the cookies
  await page.waitForURL('/admin');
  await expect(page.locator('h1')).toContainText('Dashboard');

  // End of authentication steps
  await page.context().storageState({ path: authFile });
});