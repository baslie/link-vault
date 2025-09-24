import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("доступность маркетинговой страницы", () => {
  test("не содержит критичных нарушений WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    expect(results.violations).toEqual([]);
  });
});
