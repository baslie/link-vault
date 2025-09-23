import { describe, expect, it } from "vitest";

import {
  DEFAULT_LINKS_FILTERS,
  LinksQueryValidationError,
  buildLinksQueryParams,
  createLinksQueryKey,
  parseLinksSearchParams,
  resolveLinksFilters,
} from "@/lib/links/query";

const uuidA = "11111111-1111-4111-8111-111111111111";
const uuidB = "22222222-2222-4222-8222-222222222222";

describe("[data] links query helpers", () => {
  it("returns default filters for empty params", () => {
    const filters = parseLinksSearchParams(new URLSearchParams());

    expect(filters).toEqual(DEFAULT_LINKS_FILTERS);
  });

  it("normalizes provided query parameters", () => {
    const params = new URLSearchParams({
      search: "  Design ",
      sort: "TITLE",
      order: "ASC",
      page: "3",
      perPage: "50",
      dateFrom: "2024-01-01T00:00:00.000Z",
      dateTo: "2024-01-31T23:59:59.000Z",
    });
    params.append("tagIds", uuidB);
    params.append("tagIds", uuidA);

    const filters = parseLinksSearchParams(params);

    expect(filters.search).toBe("Design");
    expect(filters.sort).toBe("title");
    expect(filters.order).toBe("asc");
    expect(filters.page).toBe(3);
    expect(filters.perPage).toBe(50);
    expect(filters.tagIds).toEqual([uuidA, uuidB]);
    expect(filters.dateFrom).toBe("2024-01-01T00:00:00.000Z");
    expect(filters.dateTo).toBe("2024-01-31T23:59:59.000Z");
  });

  it("throws when the date range is invalid", () => {
    expect(() =>
      resolveLinksFilters({
        dateFrom: "2024-01-10T00:00:00.000Z",
        dateTo: "2024-01-01T00:00:00.000Z",
      }),
    ).toThrow(LinksQueryValidationError);
  });

  it("builds query params for the API route", () => {
    const params = buildLinksQueryParams({
      search: "React",
      tagIds: [uuidA],
      sort: "created_at",
      order: "desc",
      page: 2,
      perPage: 20,
      dateFrom: "2024-02-01T00:00:00.000Z",
    });

    expect(params.get("search")).toBe("React");
    expect(params.getAll("tagIds")).toEqual([uuidA]);
    expect(params.get("page")).toBe("2");
    expect(params.get("perPage")).toBe("20");
    expect(params.get("dateFrom")).toBe("2024-02-01T00:00:00.000Z");
  });

  it("creates a stable query key", () => {
    const filters = resolveLinksFilters({
      search: "docs",
      tagIds: [uuidB, uuidA],
      page: 4,
    });

    const key = createLinksQueryKey(filters);

    expect(key).toEqual([
      "links",
      "created_at",
      "desc",
      4,
      DEFAULT_LINKS_FILTERS.perPage,
      "docs",
      "",
      "",
      `${uuidA}|${uuidB}`,
    ]);
  });
});
