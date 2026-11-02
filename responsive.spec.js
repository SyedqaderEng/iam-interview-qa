const { test, expect } = require('@playwright/test');
for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  test(`topic opens at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:4173/index.html');
    const cards = page.locator('.topic-card');
    await expect(cards).toHaveCount(292);
    await cards.first().click();
    await expect(page.locator('#topicView')).toBeVisible();
    await expect(page.locator('.detail-hero h1')).toBeVisible();
    const topicViewBox = await page.locator('#topicView').boundingBox();
    console.log(viewport.width, topicViewBox);
  });
}
