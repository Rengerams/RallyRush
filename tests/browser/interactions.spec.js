import { expect, test } from "@playwright/test";

const fixtureUrl = "http://127.0.0.1:4174/tests/browser/fixture.html";

async function touchPointer(locator, type, pointerId = 17, x = 20, y = 20) {
  await locator.dispatchEvent(type, {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    button: type === "pointerup" ? 0 : 0,
    buttons: type === "pointerup" || type === "pointercancel" ? 0 : 1,
    clientX: x,
    clientY: y,
  });
}

test.describe("real browser interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
  });

  test("a short touch release taps without preparing a held shot", async ({ page }) => {
    const button = page.getByTestId("shot-btn-flat");
    await touchPointer(button, "pointerdown");
    await touchPointer(button, "pointerup");

    await expect(page.getByTestId("events")).toContainText('["tap","flat"]');
    await expect(page.getByTestId("engine-input")).toHaveText("none");
  });

  test("a hold prepares and releases the shot on pointer up", async ({ page }) => {
    const button = page.getByTestId("shot-btn-topspin");
    await touchPointer(button, "pointerdown");
    await page.waitForTimeout(175);
    await expect(page.getByTestId("engine-input")).toHaveText("topspin");
    await touchPointer(button, "pointerup");

    await expect(page.getByTestId("events")).toContainText('["hold","topspin"]');
    await expect(page.getByTestId("events")).toContainText('["release","topspin"]');
    await expect(page.getByTestId("engine-input")).toHaveText("none");
  });

  test("pointer cancellation clears a prepared shot without releasing it", async ({ page }) => {
    const button = page.getByTestId("shot-btn-flat");
    await touchPointer(button, "pointerdown");
    await page.waitForTimeout(175);
    await expect(page.getByTestId("engine-input")).toHaveText("flat");
    await touchPointer(button, "pointercancel");

    await expect(page.getByTestId("events")).toContainText('["cancel","flat"]');
    await expect(page.getByTestId("events")).not.toContainText('["release","flat"]');
    await expect(page.getByTestId("engine-input")).toHaveText("none");
  });

  test("lost pointer capture cancels a prepared shot", async ({ page }) => {
    const button = page.getByTestId("shot-btn-flat");
    await touchPointer(button, "pointerdown");
    await page.waitForTimeout(175);
    await expect(page.getByTestId("engine-input")).toHaveText("flat");
    await touchPointer(button, "lostpointercapture");

    await expect(page.getByTestId("events")).toContainText('["cancel","flat"]');
    await expect(page.getByTestId("events")).not.toContainText('["release","flat"]');
    await expect(page.getByTestId("engine-input")).toHaveText("none");
  });

  test("a sideways swipe remains a scroll gesture and does not fire a shot", async ({ page }) => {
    const button = page.getByTestId("shot-btn-flat");
    await touchPointer(button, "pointerdown", 18, 20, 20);
    await touchPointer(button, "pointermove", 18, 45, 22);
    await touchPointer(button, "pointerup", 18, 45, 22);

    await expect(page.getByTestId("events")).toHaveText("[]");
    await expect(page.getByTestId("engine-input")).toHaveText("none");
  });

  test("pause shortcuts do not escape nested dialogs and focus returns to each trigger", async ({ page }) => {
    await page.getByTestId("pause-trigger").click();
    await expect(page.getByTestId("pause-modal")).toBeVisible();
    await page.keyboard.press("p");
    await expect(page.getByTestId("pause-modal")).toBeVisible();

    const restart = page.getByTestId("pause-restart-btn");
    await restart.click();
    const confirmation = page.getByRole("alertdialog", { name: "Restart this match?" });
    await expect(confirmation).toBeVisible();
    await page.keyboard.press("p");
    await expect(confirmation).toBeVisible();
    await page.getByRole("button", { name: "Keep playing" }).click();
    await expect(restart).toBeFocused();

    const guideTrigger = page.getByTestId("pause-controls-guide-btn");
    await guideTrigger.click();
    const guide = page.getByTestId("first-session-guide");
    await expect(guide).toBeVisible();
    await page.keyboard.press("p");
    await expect(guide).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(guide).toBeHidden();
    await expect(guideTrigger).toBeFocused();
    await expect(page.getByTestId("pause-modal")).toBeVisible();
  });
});
