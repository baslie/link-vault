export function toTitleCase(hostname: string): string {
  const base = hostname
    .split(".")
    .filter((segment) => segment !== "www")
    .shift();

  if (!base) {
    return hostname;
  }

  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function buildFaviconGeneratorUrl(hostname: string, size = 128): string {
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${hostname}`;
}
