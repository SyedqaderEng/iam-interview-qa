const { test, expect } = require('@playwright/test');
test('implementation lab renders below technical explanation', async ({ page }) => {
  await page.goto('http://localhost:4173/index.html');
  await page.locator('.topic-card').first().click();
  await page.getByRole('button', { name: /Level 2/ }).click();
  await expect(page.locator('.implementation-lab')).toBeVisible();
  await expect(page.getByText('Expected example')).toBeVisible();
});
test('token topic includes JSON response lab', async ({ page }) => {
  await page.goto('http://localhost:4173/index.html');
  await page.locator('#searchInput').fill('Access tokens and ID tokens');
  await page.locator('.topic-card').click();
  await page.getByRole('button', { name: /Level 2/ }).click();
  await expect(page.locator('.implementation-lab pre')).toContainText('access_token');
});
