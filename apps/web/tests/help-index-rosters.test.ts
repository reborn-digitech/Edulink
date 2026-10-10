/**
 * A roster is not help (integration, 11 Oct 2026). docs/demo-schools.md lists the demo people with their
 * addresses, classes and marks, and docs/college.md names the fixtures' people; while they were indexed, a
 * college pupil asking "What was my SGPA last term?" was answered with another student's 8.33 out of the
 * roster (the data questions' metrics, cs-02). Both files carry `<!-- helpIndex: false -->` on their first
 * line and scripts/help-index.ts leaves a marked file out whole.
 *
 * Held two ways: the rows the index would write now, and the rows the HelpEntry table holds (the index as
 * last built; rebuilt with `npm run help:index`).
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { QUESTION_GIG_FOR_TEACHERS } from "@edulink/contracts";
import { buildHelpRows, docFiles, HELP_INDEX_OFF } from "../scripts/help-index";

const REPO = resolve(process.cwd(), "..", "..");
const ROSTERS = ["docs/demo-schools.md", "docs/college.md"];
/** A person's address on the demo or the ZZ domain: a local part, then the domain (a pattern such as `sac.*@…` is not one). */
const ADDRESS = /[A-Za-z0-9._%+-]+@(?:demo\.relay\.test|zz\.test)\b/;
/** The same in Postgres's regular expressions (whose `\b` is a backspace). */
const SQL_ADDRESS = "[A-Za-z0-9._%+-]+@(demo\\.relay\\.test|zz\\.test)";
/** A roster table's row as the index flattens it: "Who: …; Email: …" or an account column. */
const ROSTER_LINE = /\b(?:Email|Account|Sign in as): `?[A-Za-z0-9._%+-]+@/i;

const db = new PrismaClient();
afterAll(() => db.$disconnect());

describe("the help index and the rosters", () => {
  it("both roster files carry the marker on their first line", () => {
    for (const file of ROSTERS) {
      const first = readFileSync(join(REPO, file), "utf8").split("\n", 1)[0]!;
      expect(HELP_INDEX_OFF.test(first), file).toBe(true);
    }
  });

  it("reads neither roster file", () => {
    const read = docFiles().map((f) => f.slice(REPO.length + 1));
    for (const file of ROSTERS) expect(read).not.toContain(file);
    expect(read).toContain("HANDOFF.md");
    expect(read.some((f) => f.startsWith("docs/guide/"))).toBe(true);
  });

  it("writes no entry from a roster, with a demo or ZZ address, or a roster line", () => {
    const rows = buildHelpRows();
    expect(rows.length).toBeGreaterThan(1000);
    for (const r of rows) {
      expect(ROSTERS, `${r.sourceFile}: ${r.title}`).not.toContain(r.sourceFile);
      expect(ADDRESS.test(`${r.title} ${r.text}`), `${r.sourceFile}: ${r.text.slice(0, 120)}`).toBe(false);
      expect(ROSTER_LINE.test(r.text), `${r.sourceFile}: ${r.text.slice(0, 120)}`).toBe(false);
    }
  });

  it("points no teacher at the question gig's doors while the gig is off", () => {
    if (QUESTION_GIG_FOR_TEACHERS) return;
    const doors = buildHelpRows().filter((r) => r.kind === "door").map((r) => r.door ?? "");
    expect(doors.filter((d) => d.includes("/api/v1/gigs/questions"))).toEqual([]);
    expect(doors).toContain("POST /api/v1/gigs/payee");
  });

  it("holds no such entry in the index as built", async () => {
    const leaked = await db.$queryRaw<{ n: bigint }[]>`
      SELECT count(*)::bigint AS n FROM "HelpEntry"
       WHERE "sourceFile" = ANY(${ROSTERS}::text[])
          OR "text" ~ ${SQL_ADDRESS}
          OR "title" ~ ${SQL_ADDRESS}`;
    expect(Number(leaked[0]!.n)).toBe(0);
  });
});
