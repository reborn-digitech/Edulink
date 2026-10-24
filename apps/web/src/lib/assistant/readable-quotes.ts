/**
 * A QUOTED SCREEN SENTENCE AS A PERSON READS IT (QA-64, QA campaign of 24 October 2026). The guide quotes the
 * dictionary's sentences with their placeholders ("Fees for {year}", "Try again in {minutes} minutes."), so the guide,
 * its renderings and any answer quoting them printed braces. A `{name}` in the guide's running text becomes "…", the
 * part the screen fills in; one inside backticks (a path such as `/admin/classes/{classId}`) is left as it is. The
 * guide's quotes nest ("Lent "{title}" to {name}"), so the running text is told from code by its backticks, not by its
 * quotation marks. Pure.
 */
export function readableQuotes(text: string): string {
  return text
    .split(/(`[^`\n]*`)/)
    .map((part) => (part.startsWith("`") && part.endsWith("`") && part.length > 1 ? part : part.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, "…")))
    .join("");
}
