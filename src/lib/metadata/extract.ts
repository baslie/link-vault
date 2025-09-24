interface HtmlMetadataResult {
  title?: string;
  description?: string;
  iconHref?: string | null;
}

const META_TAG_PATTERN = /<meta\b[^>]*>/gi;
const LINK_TAG_PATTERN = /<link\b[^>]*>/gi;

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    switch (normalized) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
      case "#39":
        return "'";
      default:
        return match;
    }
  });
}

function parseAttributes(fragment: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(fragment))) {
    const [, name, , doubleQuoted, singleQuoted] = match;
    const rawValue = doubleQuoted ?? singleQuoted ?? "";
    attributes[name.toLowerCase()] = decodeHtmlEntities(rawValue.trim());
  }

  return attributes;
}

function extractMetaContent(
  html: string,
  attribute: "name" | "property",
  target: string,
): string | null {
  META_TAG_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = META_TAG_PATTERN.exec(html))) {
    const attributes = parseAttributes(match[0]);
    const candidate = attributes[attribute];

    if (candidate && candidate.toLowerCase() === target) {
      const content = attributes.content;
      if (content) {
        return content;
      }
    }
  }

  return null;
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) {
    return null;
  }

  return decodeHtmlEntities(match[1].trim());
}

function isIconRel(value: string): boolean {
  const tokens = value
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  return tokens.some(
    (token) => token === "icon" || token === "shortcut-icon" || token === "apple-touch-icon",
  );
}

function extractIconHref(html: string): string | null {
  LINK_TAG_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_TAG_PATTERN.exec(html))) {
    const attributes = parseAttributes(match[0]);
    const rel = attributes.rel;
    const href = attributes.href;

    if (!rel || !href) {
      continue;
    }

    if (isIconRel(rel)) {
      return href;
    }
  }

  return null;
}

export function extractMetadataFromHtml(html: string): HtmlMetadataResult {
  const ogTitle =
    extractMetaContent(html, "property", "og:title") ??
    extractMetaContent(html, "name", "twitter:title");
  const metaDescription =
    extractMetaContent(html, "name", "description") ??
    extractMetaContent(html, "property", "og:description");
  const title = ogTitle ?? extractTitle(html) ?? undefined;
  const description = metaDescription ?? undefined;
  const iconHref = extractIconHref(html);

  return {
    title,
    description,
    iconHref,
  };
}
