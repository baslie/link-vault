vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { useTheme } from "next-themes";

describe("ThemeToggle", () => {
  const useThemeMock = vi.mocked(useTheme);

  beforeEach(() => {
    const setTheme = vi.fn();

    useThemeMock.mockReturnValue({
      resolvedTheme: "light",
      theme: "light",
      setTheme,
    } as unknown as ReturnType<typeof useTheme>);
  });

  it("рендерит доступную кнопку переключения", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Переключить тему" })).toBeVisible();
  });

  it("включает тёмную тему при клике", async () => {
    const setTheme = vi.fn();

    useThemeMock.mockReturnValue({
      resolvedTheme: "light",
      theme: "light",
      setTheme,
    } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Переключить тему" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("включает светлую тему из тёмной", async () => {
    const setTheme = vi.fn();

    useThemeMock.mockReturnValue({
      resolvedTheme: "dark",
      theme: "dark",
      setTheme,
    } as unknown as ReturnType<typeof useTheme>);

    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Переключить тему" }));

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
