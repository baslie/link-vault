vi.mock("@/components/app/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Выйти</button>,
}));

import { fireEvent, render, screen } from "@testing-library/react";

import { AppShell } from "@/components/app/app-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";

const profile = {
  id: "123",
  email: "user@example.com",
  display_name: "Анна", // eslint-disable-line camelcase -- соответствие полю таблицы
  theme: "system" as const,
};

describe("AppShell", () => {
  function renderShell() {
    return render(
      <ThemeProvider>
        <AppShell profile={profile} isAdmin>
          <div>Контент</div>
        </AppShell>
      </ThemeProvider>,
    );
  }

  it("отображает бренд, профиль и поисковую заглушку", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Link Vault" })).toBeVisible();
    expect(screen.getByText("Минималистичный менеджер ссылок")).toBeVisible();
    expect(screen.getByText(profile.email)).toBeVisible();
    expect(screen.getByRole("searchbox", { name: /глобальный поиск/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /ан/i }));
    expect(screen.getByRole("link", { name: "Админ-панель" })).toBeVisible();
  });

  it("соответствует снепшоту", () => {
    const { asFragment } = renderShell();

    expect(asFragment()).toMatchSnapshot();
  });
});
