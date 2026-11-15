/**
 * tests/competitions.test.ts cleaned up by prefix: before and after every run it deleted every competition titled
 * "TEST …" and its entries in every school, every notice whose title held "TEST " for anybody, and every audit row
 * whose action began "competition." in every school, while it runs in the seed schools Riverside and Oakfield. That
 * is against this repository's rule that a test removes only what it made and cleans up only its own school's rows
 * (CLAUDE.md, "Database and fixtures"). Its sister, tests/competition-leaderboard.test.ts, was put right for the same
 * fault in b1141e14, whose second reader found this one. The suite now removes the competitions it made, by id, their
 * entries, the audit rows that name them and the notices they caused its own people since it started.
 *
 * This reads the suite's source and holds that none of its deletes on competitions, entries, audit rows or notices is
 * keyed on a title or an action alone (or on nothing), and that it still deletes from each of the four, so that its
 * clean-up was put right rather than dropped. No database is touched.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const MODELS = ["auditLog", "competition", "competitionEntry", "notification"] as const;
/** The columns a delete must not be keyed on alone: a prefix there reaches other suites' and other schools' rows. */
const TEXT = new Set(["title", "action"]);

/** The suite's clean-up as it stood at b1141e14, when the second reader found it, for the check to be seen to recognise. */
const OLD_CLEANUP = `
  await db.competitionEntry.deleteMany({ where: { competition: { title: { startsWith: "TEST " } } } });
  await db.competition.deleteMany({ where: { title: { startsWith: "TEST " } } });
  await db.notification.deleteMany({ where: { title: { contains: "TEST " } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: "competition." } } });
`;

function keyOf(property: ts.ObjectLiteralElementLike): string | null {
  if (ts.isSpreadAssignment(property)) return null;
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : null;
}

/**
 * Whether a where matches rows by a title or an action and nothing else, or by nothing at all: every condition is one
 * of those columns, a relation reached through one of them alone (as `{ competition: { title: … } }` was), an OR with
 * such a branch, or an AND of nothing but such branches. A spread, a computed key or a value not written out here may
 * bind anything, so it is not judged to be text alone.
 */
function byTextAlone(where: ts.ObjectLiteralExpression): boolean {
  return where.properties.every((property) => {
    const key = keyOf(property);
    if (key === null) return false;
    if (TEXT.has(key)) return true;
    if (!ts.isPropertyAssignment(property)) return false;
    const value = property.initializer;
    if (key === "OR" || key === "AND") {
      if (!ts.isArrayLiteralExpression(value)) return false;
      const branches = value.elements.map((branch) => ts.isObjectLiteralExpression(branch) && byTextAlone(branch));
      return key === "OR" ? branches.some(Boolean) : branches.length > 0 && branches.every(Boolean);
    }
    return ts.isObjectLiteralExpression(value) && value.properties.length > 0 && byTextAlone(value);
  });
}

type Delete = { model: string; call: string; byText: boolean };

/** Every `….<model>.deleteMany(…)` on the four tables in a source, and whether it is keyed on text alone. */
function deletesIn(source: string): Delete[] {
  const file = ts.createSourceFile("source.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found: Delete[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "deleteMany" &&
      ts.isPropertyAccessExpression(node.expression.expression) &&
      (MODELS as readonly string[]).includes(node.expression.expression.name.text)
    ) {
      const argument = node.arguments[0];
      let byText = argument === undefined; // no argument at all removes every row
      if (argument && ts.isObjectLiteralExpression(argument)) {
        const where = argument.properties.find((property) => keyOf(property) === "where");
        if (!where) byText = true;
        else if (ts.isPropertyAssignment(where) && ts.isObjectLiteralExpression(where.initializer)) byText = byTextAlone(where.initializer);
      }
      found.push({ model: node.expression.expression.name.text, call: node.getText(file).replace(/\s+/g, " "), byText });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

describe("the competitions suite removes only what it made", () => {
  it("no delete it makes on competitions, entries, audit rows or notices is keyed on a title or an action alone, and it still deletes from each", () => {
    // The check sees the old clean-up's four shapes for what they were.
    expect(deletesIn(OLD_CLEANUP).map((d) => [d.model, d.byText])).toEqual([
      ["competitionEntry", true],
      ["competition", true],
      ["notification", true],
      ["auditLog", true],
    ]);

    const deletes = deletesIn(readFileSync(join(__dirname, "competitions.test.ts"), "utf8"));
    expect(deletes.filter((d) => d.byText).map((d) => d.call)).toEqual([]);
    // Still removing from each of the four: the clean-up was scoped, not dropped.
    expect([...new Set(deletes.map((d) => d.model))].sort()).toEqual([...MODELS]);
  });
});
