/**
 * A page's words and links, for the competitions crawler. HTML is read as text by a small extraction
 * (scripts, styles, forms' inner controls, navigation chrome dropped; block elements become line breaks;
 * entities decoded) — the corpus fetcher's own helpers do the same for its index pages. A PDF is read
 * through scripts/corpus-pdf.ts, the corpus ingest's text layer, first pages only, no OCR.
 *
 * Two refusals are decided here, never worked around: a page that asks for a password (a login) and a
 * page whose words are drawn by a script (a single-page app a plain request cannot see into).
 */

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", copy: "©", reg: "®", bull: "•", middot: "·", rarr: "→", laquo: "«", raquo: "»" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : " ";
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

const BLOCK = /<\/?(?:p|div|br|li|ul|ol|tr|td|th|table|h[1-6]|section|article|header|footer|blockquote|dd|dt|dl|pre|hr)\b[^>]*>/gi;

/** The visible words of an HTML page, line by line, with the title first. */
export function htmlToText(html: string): string {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|select|textarea)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/i, " ")
    .replace(BLOCK, "\n")
    .replace(/<[^>]+>/g, " ");
  const lines = decodeEntities(body)
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean);
  const head = title ? decodeEntities(title).replace(/\s+/g, " ").trim() : "";
  return [head, ...lines].filter(Boolean).join("\n");
}

/** Every link on the page, absolute, without its fragment; mailto, tel and javascript links left out. */
export function linksOf(html: string, base: string): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const raw = decodeEntities((m[1] ?? m[2] ?? m[3] ?? "").trim());
    if (!raw || /^(?:javascript:|mailto:|tel:|whatsapp:|#)/i.test(raw)) continue;
    try {
      const u = new URL(raw, base);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      u.hash = "";
      out.add(u.toString());
    } catch {
      /* an href no parser accepts is not a link */
    }
  }
  return [...out];
}

/** A page that asks for a password is a login: refused, never filled. */
export function needsLogin(html: string): boolean {
  return /<input\b[^>]*type\s*=\s*["']?password/i.test(html);
}

/**
 * A page whose words are drawn by a script: almost no text or links in the HTML and a script root or a
 * framework's bundle (the corpus fetcher's test, with the text floor added).
 */
export function renderedByScript(html: string): boolean {
  const text = htmlToText(html).replace(/\s+/g, " ");
  const links = linksOf(html, "https://x.invalid/").length;
  const scriptRoot = /<div id="(?:root|app|__next)"|<app-root|ng-version|data-critters-container|static\/js\/main|umi\.[a-f0-9]+\.js|<script[^>]+src="[^"]*(?:main|runtime|polyfills)[.-][a-z0-9]+\.js/i.test(html);
  return scriptRoot && (text.length < 400 || links < 3);
}

const BINARY = /\.(?:png|jpe?g|gif|webp|svg|ico|zip|rar|7z|gz|mp4|mp3|avi|mov|wmv|docx?|xlsx?|pptx?|apk|exe|css|js|json|xml|woff2?|ttf)(?:$|\?)/i;
/** Whether a link is worth a request: a page or a PDF, not a picture, an archive or an office file. */
export function worthReading(url: string): boolean {
  try {
    return !BINARY.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** A PDF's words, first `maxPages` pages, through the corpus ingest's text layer (no OCR, no figures). */
export async function pdfToText(bytes: Uint8Array, maxPages = 8): Promise<string> {
  const { extractPdf } = await import("../corpus-pdf");
  const { pages } = await extractPdf(bytes, { figures: false, ocrLangs: null });
  return pages
    .slice(0, maxPages)
    .map((p) => p.runs.map((r) => r.text).join(" "))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
