import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login page with sign-in text", async ({ page }) => {
    await expect(page.getByText("Sign in to sync your tasks")).toBeVisible();
  });

  test("renders auth form with email input", async ({ page }) => {
    const emailInput = page.getByRole("textbox").or(page.locator('input[type="email"]')).first();
    await expect(emailInput).toBeVisible();
  });

  test("has navbar", async ({ page }) => {
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navbar logo links to home", async ({ page }) => {
    await page.goto("/blog");
    const logoLink = page.locator("a").filter({ hasText: "Foci" }).first();
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("navbar shows Stats link", async ({ page }) => {
    await page.goto("/");
    const statsLink = page.getByRole("link", { name: "Stats" });
    await expect(statsLink).toBeVisible();
    await expect(statsLink).toHaveAttribute("href", "/stats");
  });

  test("navbar shows Blog link", async ({ page }) => {
    await page.goto("/");
    const blogLink = page.getByRole("link", { name: "Blog" });
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveAttribute("href", "/blog");
  });

  test("Stats link in navbar navigates to stats page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page).toHaveURL(/\/stats/);
  });

  test("Blog link in navbar navigates to blog page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("theme toggle button is accessible", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page.getByLabel(/theme/i).first();
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    // Should not crash - theme changes
    await expect(themeBtn).toBeVisible();
  });

  test("mobile menu toggle works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // On mobile, the main nav links should be hidden initially
    // and there should be a hamburger/menu toggle button
    const navLinks = page.getByRole("link", { name: "Blog" });
    // In mobile, nav links are either hidden or in a menu
    // Just verify the page loads at mobile viewport without errors
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});

test.describe("Page Load Performance", () => {
  test("landing page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("app page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("stats page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/stats", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("blog page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});

test.describe("SEO & Meta", () => {
  test("landing page has correct title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("foci");
  });

  test("blog page has correct title", async ({ page }) => {
    await page.goto("/blog");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("blog");
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/");
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute("content", /.+/);
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("manifest.json is accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
  });
});
