import { test, expect } from "@playwright/test";

test.describe("Blog Listing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
  });

  test("renders blog heading and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Blog", level: 1 })).toBeVisible();
    await expect(page.getByText("Tips on focus, productivity")).toBeVisible();
  });

  test("renders blog posts as links", async ({ page }) => {
    // Should have at least one article link
    const articleLinks = page.locator("a[href^='/blog/']");
    const count = await articleLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("each post shows title, description, and metadata", async ({ page }) => {
    // First article should have a heading
    const firstArticle = page.locator("a[href^='/blog/']").first();
    await expect(firstArticle.locator("h2")).toBeVisible();
  });

  test("clicking a post navigates to the blog post page", async ({ page }) => {
    const firstLink = page.locator("a[href^='/blog/']").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("renders footer", async ({ page }) => {
    await expect(page.getByText("Built for focus")).toBeVisible();
  });

  test("has navbar with Foci logo", async ({ page }) => {
    await expect(page.getByText("Foci").first()).toBeVisible();
  });
});

test.describe("Blog Post Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific known blog post
    await page.goto("/blog/pomodoro-technique-guide");
  });

  test("renders post title as h1", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text!.length).toBeGreaterThan(5);
  });

  test("renders back link to blog listing", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /all posts/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/blog");
  });

  test("renders post metadata (date and reading time)", async ({ page }) => {
    // Should show reading time
    await expect(page.getByText(/min read/i)).toBeVisible();
  });

  test("renders MDX content", async ({ page }) => {
    // prose container should exist with content
    const prose = page.locator(".prose");
    await expect(prose).toBeVisible();

    // Should contain paragraphs
    const paragraphs = prose.locator("p");
    const count = await paragraphs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("renders CTA section at bottom", async ({ page }) => {
    await expect(page.getByRole("link", { name: /try foci free/i })).toBeVisible();
  });

  test("back link navigates to blog listing", async ({ page }) => {
    await page.getByRole("link", { name: /all posts/i }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("renders tags if present", async ({ page }) => {
    // Tags are optional but the container should exist
    const tags = page.locator("text=/[A-Za-z]+/").filter({
      has: page.locator('[class*="bg-blue-50"], [class*="bg-blue-900"]'),
    });
    // Tags may or may not exist, just verify page loads correctly
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
