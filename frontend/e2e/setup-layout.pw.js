import { expect, test } from "@playwright/test";

test("setup remains scrollable and its fixed actions stay usable at phone size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/setup");
  await expect(page.getByRole("heading", { name: "Build your player" })).toBeVisible();
  await page.getByTestId("guide-skip-btn").click();

  const scroll = await page.evaluate(() => {
    window.scrollTo(0, document.scrollingElement.scrollHeight);
    return document.scrollingElement.scrollTop;
  });
  expect(scroll).toBeGreaterThan(0);
  const start = await page.getByTestId("setup-start-match-btn").boundingBox();
  const practice = await page.getByTestId("setup-practice-btn").boundingBox();
  expect(start).not.toBeNull();
  expect(practice).not.toBeNull();
  expect(start.y).toBeGreaterThanOrEqual(0);
  expect(start.y + start.height).toBeLessThanOrEqual(844);
  expect(practice.y).toBeGreaterThanOrEqual(0);
  expect(practice.y + practice.height).toBeLessThanOrEqual(844);
  expect(start.x).toBeGreaterThanOrEqual(practice.x + practice.width);
});

test("setup controls do not overlap at desktop dimensions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/setup");
  await page.getByTestId("guide-skip-btn").click();
  const [practice, start] = await Promise.all([
    page.getByTestId("setup-practice-btn").boundingBox(),
    page.getByTestId("setup-start-match-btn").boundingBox(),
  ]);
  expect(practice).not.toBeNull();
  expect(start).not.toBeNull();
  expect(start.x).toBeGreaterThanOrEqual(practice.x + practice.width);
  expect(start.y + start.height).toBeLessThanOrEqual(720);
});
