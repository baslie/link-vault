import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { MonitoringProvider } from "@/components/providers/monitoring-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getAnalyticsConfig } from "@/lib/analytics/config";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Link Vault",
  description: "Link Vault — минималистичный менеджер закладок с поиском, тегами и импортом.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const analyticsConfig = getAnalyticsConfig();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <MonitoringProvider />
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </ThemeProvider>
        <AnalyticsScripts config={analyticsConfig} />
      </body>
    </html>
  );
}
