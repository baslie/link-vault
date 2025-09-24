import { describe, expect, it } from "vitest";

import { linkFormSchema } from "@/lib/links/schema";

describe("[links] form schema", () => {
  it("normalizes values and removes duplicates", () => {
    const result = linkFormSchema.parse({
      url: " https://example.com ",
      title: " Example Title ",
      comment: "  note  ",
      tagIds: [
        "11111111-1111-4111-8111-111111111111",
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
      newTags: ["  design  ", "Design", "docs"],
    });

    expect(result.url).toBe("https://example.com");
    expect(result.title).toBe("Example Title");
    expect(result.comment).toBe("note");
    expect(result.tagIds).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(result.newTags).toEqual(["design", "docs"]);
  });

  it("omits empty optional fields", () => {
    const result = linkFormSchema.parse({
      url: "https://example.com",
      title: "Example",
      comment: " ",
      tagIds: [],
      newTags: ["  "],
    });

    expect(result.comment).toBeUndefined();
    expect(result.newTags).toEqual([]);
  });

  it("validates url field", () => {
    const result = linkFormSchema.safeParse({
      url: "notaurl",
      title: "Example",
      comment: "",
      tagIds: [],
      newTags: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Некорректный URL");
    }
  });
});
