import type { ReactNode } from "react";

export interface StubThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: StubThemeProviderProps) {
  return <>{children}</>;
}

export function useTheme() {
  return {
    theme: "light",
    resolvedTheme: "light",
    setTheme: () => undefined,
    themes: ["light", "dark"],
  };
}
