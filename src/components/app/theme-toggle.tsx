"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { trackAnalyticsEvent } from "@/lib/analytics/track";

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeTheme = (isMounted ? (resolvedTheme ?? theme) : theme) ?? "light";
  const isDark = activeTheme === "dark";

  function handleToggle() {
    const nextTheme = isDark ? "light" : "dark";
    trackAnalyticsEvent("theme_changed", { theme: nextTheme });
    setTheme(nextTheme);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Переключить тему"
      title={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
    >
      {isDark ? (
        <Moon aria-hidden className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <Sun aria-hidden className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}
