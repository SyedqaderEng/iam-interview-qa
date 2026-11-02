const { test, expect } = require('playwright/test');

test('topic card opens detail and visual sections', async ({ page }) => {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('http://localhost:4173/index.html');
  await expect(page.locator('.topic-card')).toHaveCount(292);
  await page.locator('.topic-card').first().click();
  await expect(page.locator('.detail-hero h1')).toContainText('What is IAM');
  await page.getByRole('button', { name: /Level 2/ }).click();
  await expect(page.locator('.flow-diagram')).toBeVisible();
  await expect(page.locator('.sequence')).toBeVisible();
  await page.getByRole('button', { name: /Level 3/ }).click();
  await expect(page.getByText('Senior engineer answer')).toBeVisible();
  expect(errors).toEqual([]);
});
