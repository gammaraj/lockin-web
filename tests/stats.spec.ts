import { test, expect } from "@playwright/test";

test.describe("Stats Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stats");
  });

  test("renders page heading and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Stats & Analytics" })).toBeVisible();
    await expect(page.getByText("Track your focus habits")).toBeVisible();
  });

  test("renders 4 stat cards", async ({ page }) => {
    await expect(page.getByText("Total Sessions")).toBeVisible();
    await expect(page.getByText("Focus Time", { exact: true })).toBeVisible();
    await expect(page.getByText("Current Streak")).toBeVisible();
    await expect(page.getByText("Avg / Active Day")).toBeVisible();
  });

  test("renders range toggle with 7D and 30D options", async ({ page }) => {
    const btn7 = page.getByRole("button", { name: "7D" });
    const btn30 = page.getByRole("button", { name: "30D" });
    await expect(btn7).toBeVisible();
    await expect(btn30).toBeVisible();
  });

  test("can switch between 7D and 30D range", async ({ page }) => {
    const btn30 = page.getByRole("button", { name: "30D" });
    await btn30.click();

    // 30D button should now have the active styling (white bg / shadow)
    await expect(btn30).toHaveClass(/shadow/);

    const btn7 = page.getByRole("button", { name: "7D" });
    await btn7.click();
    await expect(btn7).toHaveClass(/shadow/);
  });

  test("renders activity heatmap section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    // Legend should be visible
    await expect(page.getByText("Less")).toBeVisible();
    await expect(page.getByText("More")).toBeVisible();
  });

  test("renders sessions per day chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sessions per Day" })).toBeVisible();
  });

  test("renders focus time per day chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Focus Time per Day" })).toBeVisible();
  });

  test("renders focus by project section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Focus by Project" })).toBeVisible();
  });

  test("renders today's activity section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Today's Activity" })).toBeVisible();
  });

  test("renders goal completion section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Goal Completion" })).toBeVisible();
  });

  test("renders weekly pattern section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Weekly Pattern" })).toBeVisible();
    // Day labels should be visible
    await expect(page.getByText("Mo").first()).toBeVisible();
  });

  test("renders overview section with stats", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Longest Streak")).toBeVisible();
    await expect(page.getByText("Active Days", { exact: true })).toBeVisible();
    await expect(page.getByText("Goals Met")).toBeVisible();
    await expect(page.getByText("Total Tasks")).toBeVisible();
  });

  test("page uses full width layout (max-w-1280px)", async ({ page }) => {
    const main = page.locator("main");
    const className = await main.getAttribute("class");
    expect(className).toContain("max-w-[1280px]");
  });

  test("has navbar", async ({ page }) => {
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});
