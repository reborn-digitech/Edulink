/**
 * A CUSTOM PAGE'S RICH TEXT, SANITISED ON THE SERVER (website-two, 16 October 2026).
 *
 * A school website's custom page (at most four) takes limited rich text from the editor: headings, paragraphs,
 * bulleted and numbered lists, bold, links, and a line break. The browser's editing surface sends HTML; nothing of it
 * is trusted. This rebuilds the page from tokens: every run of text is decoded and escaped again, every tag on the
 * list is written out in its own canonical spelling with no attribute (a link keeps only an https, mailto or tel
 * address, escaped, with rel="noopener"), every other tag is dropped with its words kept, and script, style and the
 * like are dropped with their contents. Tags are balanced with a stack, so the output can never close an element
 * the page around it opened. Pure: no DOM, no library, the same answer in the browser and on the server.
 */

const BLOCK = new Set(["h2", "h3", "p", "ul", "ol", "li"]);
const INLINE = new Set(["strong", "a"]);
/** Spellings the editing surface uses for the same thing. */
const ALIAS: Record<string, string> = { b: "strong", h1: "h2", h4: "h3", h5: "h3", h6: "h3", div: "p" };
/** Dropped with everything inside them. */
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "textarea", "select", "title", "head"]);

export const SITE_RICH_TEXT_MAX = 20_000;

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d{1,7});/g, (_, n: string) => safeChar(Number(n)))
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, n: string) => safeChar(Number.parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return "";
  return String.fromCodePoint(code);
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** An address a link may keep: https, mailto or tel, nothing else (no javascript:, data:, relative or http). */
export function safeLinkHref(raw: string): string | null {
  const href = decodeEntities(raw).trim();
  if (/^mailto:[^\s<>"']{3,200}$/i.test(href)) return href;
  if (/^tel:[+\d][\d\s()-]{4,30}$/i.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
}

function hrefOf(attrs: string): string | null {
  const m = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
  const raw = m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
  return raw ? safeLinkHref(raw) : null;
}

/** The page's rich text, rebuilt from the allowed tags and escaped words only. */
export function sanitiseRichText(input: string): string {
  const source = input.slice(0, SITE_RICH_TEXT_MAX * 2);
  const out: string[] = [];
  const open: string[] = [];
  let dropping: string | null = null;
  const tokens = source.split(/(<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>)/);
  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith("<!--")) continue;
    const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>$/.exec(token);
    if (!tag) {
      if (dropping) continue;
      // Text, or a stray "<" that began no tag: decoded once, escaped again.
      const text = escapeText(decodeEntities(token.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")));
      if (text.trim() || (open.length && text)) out.push(text);
      continue;
    }
    const closing = tag[1] === "/";
    const raw = tag[2]!.toLowerCase();
    if (dropping) {
      if (closing && raw === dropping) dropping = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(raw)) {
      if (!closing && !/\/\s*$/.test(tag[3] ?? "")) dropping = raw;
      continue;
    }
    if (raw === "br") {
      out.push("<br>");
      continue;
    }
    const name = ALIAS[raw] ?? raw;
    if (!BLOCK.has(name) && !INLINE.has(name)) continue;
    if (closing) {
      const at = open.lastIndexOf(name);
      if (at < 0) continue;
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }
    // Nesting the way a browser would read it: a block never opens inside an inline element or inside a paragraph or a
    // heading; a list item belongs in a list (one is opened for a loose one) and closes the item before it; a
    // paragraph or a heading never sits straight inside a list, so the list ends first.
    const top = () => open[open.length - 1];
    if (BLOCK.has(name)) {
      while (open.length && INLINE.has(top()!)) out.push(`</${open.pop()}>`);
      while (open.length && (top() === "p" || top() === "h2" || top() === "h3")) out.push(`</${open.pop()}>`);
    }
    if (name === "li") {
      const list = Math.max(open.lastIndexOf("ul"), open.lastIndexOf("ol"));
      if (list < 0) {
        out.push("<ul>");
        open.push("ul");
      } else if (open.lastIndexOf("li") > list) {
        while (open.length && top() !== "li") out.push(`</${open.pop()}>`);
        out.push(`</${open.pop()}>`);
      }
    }
    if (name === "p" || name === "h2" || name === "h3") while (open.length && (top() === "ul" || top() === "ol")) out.push(`</${open.pop()}>`);
    if (name === "a") {
      const href = hrefOf(tag[3] ?? "");
      if (!href || open.includes("a")) continue;
      out.push(`<a href="${escapeText(href)}" rel="noopener">`);
      open.push("a");
      continue;
    }
    out.push(`<${name}>`);
    open.push(name);
  }
  while (open.length) out.push(`</${open.pop()}>`);
  return out
    .join("")
    .replace(/<(strong|a)( [^>]*)?><\/\1>/g, "")
    .replace(/<(h2|h3|p|li)><\/\1>/g, "")
    .replace(/<(ul|ol)><\/\1>/g, "")
    .slice(0, SITE_RICH_TEXT_MAX)
    .replace(/<[^>]*$/, "");
}

/** The words of a rich text alone, for a description or a search: tags gone, entities decoded, spaces folded. */
export function richTextWords(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
