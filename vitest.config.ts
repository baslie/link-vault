import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next-themes": fileURLToPath(new URL("./src/test/stubs/next-themes.tsx", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/components/app/**/*.{ts,tsx}",
        "src/components/links/**/*.{ts,tsx}",
        "src/components/ui/**/*.{ts,tsx}",
      ],
      exclude: ["src/**/__tests__/**", "src/test/**", "src/**/*.d.ts"],
      thresholds: {
        lines: 65,
        statements: 65,
        functions: 70,
        branches: 60,
      },
    },
  },
});
