"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeTheme = (isMounted ? resolvedTheme ?? theme : theme) ?? "light";
  const isDark = activeTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
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
