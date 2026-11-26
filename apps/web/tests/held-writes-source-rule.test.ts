import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

/**
 * EVERY HELD WRITE HEARS A LOST ANSWER (src/app/root/subscriptions/pending-writes.ts). A write the operator's console holds
 * behind a toast's Undo is sent by its server action when the toast goes. A server action rejects, rather than answering,
 * when no answer could be read: the request was lost, or the server answered with something other than the action's answer
 * (a 5xx page, an action unknown after a deploy). Whether the write happened is then not known, and the console must say so
 * and let go of what the write held. A commit written `void action(...).then(handler)` has no second handler and hears
 * nothing. So every held commit goes through one helper, `whenAnswered`, which takes both: this rule parses each file under
 * src/app/root with TypeScript's own parser, finds each call of `hold(`, or of any other name the file binds to
 * `usePendingWrites()`, whose callee is that name itself (never `function hold(` or `x.hold(`), and refuses one whose write
 * (its first argument) does not call the helper or has a `.then(` with a single argument inside. pending-writes.ts, where
 * `hold` is defined and passed through, is left out. Exactly five held writes are expected, three in the card
 * (src/app/root/[schoolId]/terms-controls.tsx: its sheet save, payment and switch) and two in the Schools tab
 * (src/app/root/subscriptions/schools-table.tsx: its switch and bulk "on"): a sixth, one gone, or one moved from one file to
 * the other fails the rule by name, so it is looked at. So does any other mention of a holder's name, being neither the
 * declaration that binds it nor the callee of a counted call (`const later = hold`, `{ hold }`, `x(hold)`), through which a
 * write could be held where this rule does not count it.
 */

const ROOT = join(process.cwd(), "src", "app", "root");

function code(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? code(path) : /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

type Held = { file: string; at: string; write: ts.Node | undefined };

/** Each held write under src/app/root (a call whose callee is `hold`, or a name the file binds to `usePendingWrites()`), and each other mention of such a name. */
function heldWrites(): { found: Held[]; strays: string[] } {
  const found: Held[] = [];
  const strays: string[] = [];
  for (const file of code(ROOT)) {
    if (file.endsWith(join("subscriptions", "pending-writes.ts"))) continue;
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const holders = new Set(["hold"]);
    const bind = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "usePendingWrites") holders.add(node.name.text);
      ts.forEachChild(node, bind);
    };
    bind(source);
    const at = (node: ts.Node) => `${relative(process.cwd(), file)}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && holders.has(node.expression.text)) {
        found.push({ file: relative(process.cwd(), file), at: at(node), write: node.arguments[0] });
      }
      if (ts.isIdentifier(node) && holders.has(node.text)) {
        const parent = node.parent;
        const declared = ts.isVariableDeclaration(parent) && parent.name === node;
        const called = ts.isCallExpression(parent) && parent.expression === node;
        // A property's own name (`x.hold`, `{ hold: … }`) is not the holder; a shorthand `{ hold }` is, and is a stray.
        const property = (ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node);
        if (!declared && !called && !property) strays.push(at(node));
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { found, strays };
}

/** Whether a write calls `whenAnswered` and has no `.then(` given a single argument. */
function hearsBothWays(write: ts.Node | undefined): boolean {
  if (!write) return false;
  let helper = false;
  let singleThen = false;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === "whenAnswered") helper = true;
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "then" && node.arguments.length < 2) singleThen = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(write);
  return helper && !singleThen;
}

describe("every held write hears a lost answer", () => {
  it("each of the five held writes under src/app/root goes through whenAnswered, with no single-argument .then( inside", () => {
    const { found, strays } = heldWrites();
    const where = found.map((h) => h.at);
    expect(found.length, `held writes found: ${where.join(", ") || "none"}`).toBe(5);
    const byFile: Record<string, number> = {};
    for (const h of found) byFile[h.file] = (byFile[h.file] ?? 0) + 1;
    expect(byFile, `held writes found: ${where.join(", ")}`).toEqual({ "src/app/root/[schoolId]/terms-controls.tsx": 3, "src/app/root/subscriptions/schools-table.tsx": 2 });
    expect(strays, `a holder named other than at its declaration or as a counted call: ${strays.join(", ")}`).toEqual([]);
    const bad = found.filter((h) => !hearsBothWays(h.write)).map((h) => h.at);
    expect(bad, `held writes that do not go through whenAnswered, or have a .then( with one argument: ${bad.join(", ")}`).toEqual([]);
  });
});
