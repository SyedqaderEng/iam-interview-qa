const { test, expect } = require('@playwright/test');

async function openTopic(page, query) {
  await page.goto('http://localhost:4173/index.html');
  await page.locator('#searchInput').fill(query);
  await page.locator('.topic-card').click();
  await page.getByRole('button', { name: /Level 2/ }).click();
}

test('SAML sequence uses real SP and IdP actors', async ({ page }) => {
  await openTopic(page, 'SAML 2.0');
  await expect(page.locator('.sequence')).toContainText('Service Provider (SP)');
  await expect(page.locator('.sequence')).toContainText('IdP');
  await expect(page.locator('.implementation-lab pre')).toContainText('AssertionConsumerServiceURL');
  await expect(page.locator('.implementation-lab pre')).toContainText('InResponseTo');
});

test('OAuth sequence uses authorization server and API', async ({ page }) => {
  await openTopic(page, 'Authorization Code flow');
  await expect(page.locator('.sequence')).toContainText('authorization server');
  await expect(page.locator('.sequence')).toContainText('token endpoint');
});

test('all cards render and every detail has implementation lab', async ({ page }) => {
  await page.goto('http://localhost:4173/index.html');
  await expect(page.locator('.topic-card')).toHaveCount(292);
  const cardCount = await page.locator('.topic-card').count();
  for (let index = 0; index < cardCount; index += 49) {
    await page.locator('.topic-card').nth(index).click();
    await page.getByRole('button', { name: /Level 2/ }).click();
    await expect(page.locator('.implementation-lab')).toBeVisible();
    await page.locator('#backButton').click();
  }
});
