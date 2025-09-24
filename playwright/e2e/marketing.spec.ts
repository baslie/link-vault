import { expect, test } from "@playwright/test";

test.describe("маркетинговая главная страница", () => {
  test("отображает геро-блок и ссылки на документацию", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Каркас приложения готов к дальнейшей разработке",
        level: 1,
      }),
    ).toBeVisible();

    const architectureLink = page.getByRole("link", { name: "Ознакомиться с архитектурой" });
    await expect(architectureLink).toBeVisible();
    await expect(architectureLink).toHaveAttribute("href", "/docs/architecture.md");

    const briefLink = page.getByRole("link", { name: "Прочитать бриф" });
    await expect(briefLink).toBeVisible();
    await expect(briefLink).toHaveAttribute("href", "/docs/brief.md");

    const checklistItems = page.locator("section ul li");
    await expect(checklistItems).toHaveCount(5);
    await expect(checklistItems.first()).toContainText("Next.js 14 App Router");
  });

  test("переход по ссылке архитектуры открывает документ", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Ознакомиться с архитектурой" }).click();

    await expect(page).toHaveURL(/\/docs\/architecture\.md$/);
    await expect(page.locator("body")).toContainText(
      'Архитектура и реализация системы "Link Vault"',
    );
  });
});
