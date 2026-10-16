import { expect, test } from "@playwright/test";

test("setup remains scrollable and its fixed actions stay usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/setup");
  await page.getByTestId("guide-skip-btn").click();
  await expect(page.getByRole("heading", { name: "Build your player" })).toBeVisible();

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

test("setup actions do not overlap at desktop dimensions", async ({ page }) => {
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

test("post-match dialog stays inside mobile viewport without overlapping its actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/tests/browser/fixture.html?mode=result");
  const dialog = page.getByTestId("match-end-modal");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await dialog.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  for (const id of ["match-end-rematch-btn", "match-end-leaderboard-btn", "match-end-setup-btn"]) {
    await expect(page.getByTestId(id)).toBeInViewport();
  }
});
