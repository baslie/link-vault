import { describe, expect, it } from "vitest";

import { extractMetadataFromHtml } from "@/lib/metadata/extract";

describe("[metadata] html parser", () => {
  it("extracts og title, description and icon", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="OG Title" />
          <meta name="description" content="Page description" />
          <link rel="icon" href="/favicon.svg" />
        </head>
      </html>
    `;

    const result = extractMetadataFromHtml(html);

    expect(result.title).toBe("OG Title");
    expect(result.description).toBe("Page description");
    expect(result.iconHref).toBe("/favicon.svg");
  });

  it("falls back to the document title", () => {
    const html = `
      <html>
        <head>
          <title>Example &amp; Docs</title>
          <link rel="shortcut icon" href="//static.example.com/favicon.ico" />
        </head>
      </html>
    `;

    const result = extractMetadataFromHtml(html);

    expect(result.title).toBe("Example & Docs");
    expect(result.iconHref).toBe("//static.example.com/favicon.ico");
  });

  it("supports apple-touch-icon rel variants", () => {
    const html = `
      <html>
        <head>
          <link rel="apple-touch-icon" href="/icons/apple.png" />
        </head>
      </html>
    `;

    const result = extractMetadataFromHtml(html);

    expect(result.iconHref).toBe("/icons/apple.png");
  });
});
