import { test, expect } from "@playwright/test";

test.describe("App Page (unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
  });

  test("renders the timer display", async ({ page }) => {
    await expect(page.locator("text=/\\d{2}:\\d{2}/").first()).toBeVisible();
  });

  test("renders daily progress section", async ({ page }) => {
    await expect(page.getByText("Today's Sessions", { exact: false })).toBeVisible();
  });

  test("renders task list with input", async ({ page }) => {
    const taskInput = page.locator('input[type="text"]').first();
    await expect(taskInput).toBeVisible();
  });

  test("can add a new task", async ({ page }) => {
    const taskInput = page.locator('input[type="text"]').first();
    await taskInput.fill("Test task from Playwright");
    await taskInput.press("Enter");

    await expect(page.getByText("Test task from Playwright")).toBeVisible();
  });

  test("can complete a task via checkbox button", async ({ page }) => {
    const taskInput = page.locator('input[type="text"]').first();
    await taskInput.fill("Task to complete");
    await taskInput.press("Enter");
    await expect(page.getByText("Task to complete")).toBeVisible();

    // The checkbox is a button with aria-label: Mark "Task to complete" complete
    const checkbox = page.getByLabel('Mark "Task to complete" complete');
    await checkbox.click();

    // After completion, the task text should have line-through styling
    await expect(page.locator('[class*="line-through"]').filter({ hasText: "Task to complete" })).toBeVisible();
  });

  test("can delete a task", async ({ page }) => {
    const taskInput = page.locator('input[type="text"]').first();
    await taskInput.fill("Task to delete");
    await taskInput.press("Enter");
    await expect(page.getByText("Task to delete")).toBeVisible();

    // Hover on the task row to reveal action buttons
    await page.getByText("Task to delete").hover();

    // Click the delete button (aria-label contains "Delete")
    const deleteBtn = page.getByLabel(/delete.*task to delete/i);
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.click();
    } else {
      // Fallback: find delete button near the task text
      const taskContainer = page.getByText("Task to delete").locator("..").locator("..");
      await taskContainer.getByRole("button").last().click();
    }

    await expect(page.getByText("Task to delete")).not.toBeVisible();
  });

  test("renders ambient sounds section", async ({ page }) => {
    await expect(page.getByText("Music & Sounds")).toBeVisible();
  });

  test("can expand ambient sounds panel", async ({ page }) => {
    // Click the collapse toggle button
    await page.getByText("Music & Sounds").click();

    // After expanding, the Sounds tab should be visible
    await expect(page.getByText("Sounds", { exact: false }).first()).toBeVisible();
  });

  test("renders settings button", async ({ page }) => {
    const settingsBtn = page.getByLabel("Open settings");
    await expect(settingsBtn).toBeVisible();
  });

  test("can open settings panel", async ({ page }) => {
    await page.getByLabel("Open settings").click();
    // Settings panel should appear with duration options
    await expect(page.getByText("Work Duration", { exact: false })).toBeVisible();
  });

  test("layout is responsive - mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/app");

    // Timer and tasks should both be visible (stacked)
    await expect(page.locator("text=/\\d{2}:\\d{2}/").first()).toBeVisible();
  });
});
