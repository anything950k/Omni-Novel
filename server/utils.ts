export function isUrlAbsolute(url: string): boolean {
  if (!url) return false;
  return /^(?:[a-z+]+:)?\/\//i.test(url);
}

export function resolveUrl(baseUrl: string, relativePath: string): string {
  if (!relativePath) return '';
  if (isUrlAbsolute(relativePath)) return relativePath;
  try {
    return new URL(relativePath, baseUrl).href;
  } catch {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanRel = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    return `${cleanBase}${cleanRel}`;
  }
}

export function cleanHtmlContent(rawHtml: string): string {
  if (!rawHtml) return '';
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<div class="ads[^"]*"[^>]*>.*?<\/div>/gis, '')
    .replace(/<!--.*?-->/gis, '')
    .trim();

  return cleaned;
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, '\n')
    .trim();
}
