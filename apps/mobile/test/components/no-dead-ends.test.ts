import fs from "node:fs";
import path from "node:path";

/**
 * No dead ends: every empty state offers a door. The Empty component
 * (src/components/states.tsx) carries the door in its `action` prop — a
 * Button or a link rendered under the title and body. This reads every
 * screen's source and names each <Empty …> that has no action= at all, by
 * file and line, so the list in a failure is the list of screens to fix.
 *
 * A source check, not a render: an Empty inside a branch a test never
 * reaches still counts, which is the point — the dead end is in the code
 * whether or not a fixture happens to exercise it.
 */
const screensDir = path.resolve(__dirname, "../../src/screens");

function listScreens(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listScreens(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out.sort();
}

/** Each <Empty …> opening tag in a file: its line, its full text, and whether it carries action=. */
export function emptyUsages(source: string): { line: number; tag: string; hasDoor: boolean }[] {
  const found: { line: number; tag: string; hasDoor: boolean }[] = [];
  const re = /<Empty(?=[\s/>])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const start = match.index;
    // Walk to the end of the opening tag: a `>` at brace depth zero. A `=>`
    // inside an {expression} sits at depth ≥ 1 and is skipped.
    let depth = 0;
    let end = -1;
    for (let i = start + "<Empty".length; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        end = i + 1;
        break;
      }
    }
    if (end === -1) end = source.length;
    const tag = source.slice(start, end);
    // action= as a prop of this tag, at depth zero — not inside an expression.
    let hasDoor = false;
    depth = 0;
    for (let i = 0; i < tag.length; i++) {
      const ch = tag[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (depth === 0 && /\s/.test(tag[i - 1] ?? "") && tag.startsWith("action=", i)) hasDoor = true;
    }
    const line = source.slice(0, start).split("\n").length;
    found.push({ line, tag: tag.replace(/\s+/g, " "), hasDoor });
  }
  return found;
}

describe("no dead ends", () => {
  const files = listScreens(screensDir);

  it("finds the screens", () => {
    expect(files.length).toBeGreaterThanOrEqual(27);
  });

  it("recognises the door prop", () => {
    expect(emptyUsages('<Empty title={t("x")} action={<Button label="Go" onPress={() => go()} />} />')[0]?.hasDoor).toBe(true);
    expect(emptyUsages('<Empty title={t("x")} body={t("y", { name })} />')[0]?.hasDoor).toBe(false);
    expect(emptyUsages("<Empty\n  title={a}\n  body={b}\n/>")[0]?.hasDoor).toBe(false);
    expect(emptyUsages("<EmptyOther action={x} />")).toHaveLength(0);
  });

  it("every <Empty> on every screen offers a door (action=)", () => {
    const offenders: string[] = [];
    let total = 0;
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const usage of emptyUsages(source)) {
        total++;
        if (!usage.hasDoor) offenders.push(`${path.relative(path.resolve(__dirname, "../.."), file)}:${usage.line}  ${usage.tag}`);
      }
    }
    if (offenders.length > 0) {
      console.error(`${offenders.length} of ${total} <Empty> usages have no action= door:\n  ${offenders.join("\n  ")}`);
    }
    expect(offenders).toEqual([]);
  });
});
