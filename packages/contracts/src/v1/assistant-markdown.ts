/**
 * VIDURA'S ANSWERS AS RESTRICTED MARKDOWN (docs/plans/vidura.md, the owner's decision 6; pass 1, 17 Oct 2026).
 *
 * An answer is organised with headings, numbered and bulleted lists, bold and, for a person's own figures, a table;
 * nothing else. The model is asked for exactly that (src/lib/assistant/prompt.ts); the server narrows what it wrote
 * to it before the answer gate reads it (`restrictAnswerMarkdown`), so the gate checks the very text that is shown;
 * and the web drawer and the phone's sheet draw the same blocks from `parseAnswer`, which knows no other syntax (an
 * image, a link off the platform, a code block, HTML: never drawn as such). A platform path in the text
 * ("/student/assignments") is its own inline, which the surfaces draw as a link on the platform; a citation mark
 * ("[2]") is its own inline too. Pure, shared by both apps: one parser, one set of tests.
 */

export type AnswerInline = { kind: "text"; text: string } | { kind: "bold"; text: string } | { kind: "path"; path: string } | { kind: "cite"; n: number };

export type AnswerBlock =
  | { kind: "heading"; inlines: AnswerInline[] }
  | { kind: "paragraph"; inlines: AnswerInline[] }
  | { kind: "list"; ordered: boolean; start: number; items: AnswerInline[][] }
  | { kind: "table"; header: AnswerInline[][]; rows: AnswerInline[][][] };

/** A path on the platform, as the answer gate reads one (src/lib/assistant/pages.ts `foreignPaths`). */
const PATH = /(?<![\w.:/-])\/[a-z][\w-]*(?:\/[\w-]+)*/g;

/**
 * Narrow what the model wrote to the allowed syntax, before the answer gate: a link `[words](target)` keeps its
 * words (and a platform path as the path, which the gate still checks is the person's own), an image goes, a code
 * fence and inline code marks go (their text stays), HTML tags go, `#` and `##` headings become `###`, `__bold__`
 * becomes `**bold**`, and a single `*` or `_` of emphasis goes. A horizontal rule goes. Pure.
 */
export function restrictAnswerMarkdown(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]\n]+)\]\(\s*(\/(?!\/)[^\s)]*)\s*\)/g, "$1 ($2)")
    .replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1")
    .replace(/^\s*```[^\n]*$/gm, "")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/<\/?[a-zA-Z][^>\n]*>/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "### ")
    .replace(/__([^_\n]+)__/g, "**$1**")
    .replace(/(?<![*\w])\*(?![*\s])([^*\n]+?)(?<!\s)\*(?![*\w])/g, "$1")
    .replace(/(?<![_\w])_(?![_\s])([^_\n]+?)(?<!\s)_(?![_\w])/g, "$1")
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The inlines of one line: bold, citation marks and platform paths; everything else is text. Pure. */
export function parseInlines(line: string): AnswerInline[] {
  const out: AnswerInline[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.kind === "text") last.text += text;
    else out.push({ kind: "text", text });
  };
  const plain = (text: string) => {
    let at = 0;
    for (const m of text.matchAll(new RegExp(`\\[(\\d{1,3})\\]|${PATH.source}`, "g"))) {
      pushText(text.slice(at, m.index));
      if (m[1]) out.push({ kind: "cite", n: Number(m[1]) });
      else out.push({ kind: "path", path: m[0] });
      at = m.index! + m[0].length;
    }
    pushText(text.slice(at));
  };
  const cleaned = line.replace(/`/g, "");
  let at = 0;
  for (const m of cleaned.matchAll(/\*\*([^*]+)\*\*/g)) {
    plain(cleaned.slice(at, m.index));
    const inner = m[1]!.trim();
    if (inner) out.push({ kind: "bold", text: inner });
    at = m.index! + m[0].length;
  }
  plain(cleaned.slice(at).replace(/\*\*/g, ""));
  return out;
}

const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/;
const ORDERED = /^\s{0,3}(\d{1,3})[.)]\s+(.*)$/;
const BULLET = /^\s{0,3}[-*•]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** An answer as blocks: headings, paragraphs, lists and tables, and nothing else. Pure. */
export function parseAnswer(text: string): AnswerBlock[] {
  const lines = restrictAnswerMarkdown(text).split("\n");
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", inlines: parseInlines(paragraph.join(" ")) });
    paragraph = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", inlines: parseInlines(heading[1]!.replace(/\*\*/g, "")) });
      continue;
    }
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1]!)) {
      flush();
      const header = cells(line).map(parseInlines);
      const rows: AnswerInline[][][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i]!)) {
        const row = cells(lines[i]!).map(parseInlines);
        while (row.length < header.length) row.push([]);
        rows.push(row.slice(0, header.length));
        i++;
      }
      i--;
      blocks.push({ kind: "table", header, rows });
      continue;
    }
    const ordered = ORDERED.exec(line);
    const bullet = ordered ? null : BULLET.exec(line);
    if (ordered || bullet) {
      flush();
      const isOrdered = !!ordered;
      const last = blocks[blocks.length - 1];
      const item = parseInlines((ordered ? ordered[2] : bullet![1])!);
      // A list goes on across the blank lines between its items; a list of the other kind starts a new block.
      const prev = lines[i - 1]?.trim() === "" ? lines[i - 2] : lines[i - 1];
      const continues = last?.kind === "list" && last.ordered === isOrdered && prev !== undefined && (ORDERED.test(prev) || BULLET.test(prev) || /^\s{2,}\S/.test(prev));
      if (continues && last.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", ordered: isOrdered, start: ordered ? Number(ordered[1]) : 1, items: [item] });
      continue;
    }
    // An indented line under a list item belongs to it.
    const last = blocks[blocks.length - 1];
    if (/^\s{2,}\S/.test(line) && !paragraph.length && last?.kind === "list") {
      const item = last.items[last.items.length - 1]!;
      item.push({ kind: "text", text: " " }, ...parseInlines(line.trim()));
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/** The words of an inline run, as read aloud or measured. Pure. */
export function inlineText(inlines: readonly AnswerInline[]): string {
  return inlines.map((x) => (x.kind === "cite" ? `[${x.n}]` : x.kind === "path" ? x.path : x.text)).join("");
}

/** The answer as plain sentences, for a screen reader's one announcement and the phone's short form. Pure. */
export function answerPlainText(text: string): string {
  return parseAnswer(text)
    .map((b) => {
      if (b.kind === "heading" || b.kind === "paragraph") return inlineText(b.inlines);
      if (b.kind === "list") return b.items.map((it, n) => (b.ordered ? `${b.start + n}. ` : "• ") + inlineText(it)).join("\n");
      return [b.header, ...b.rows].map((r) => r.map(inlineText).join(" · ")).join("\n");
    })
    .join("\n");
}
