/**
 * TA-409 and TA-301 (college-exam-cell batch of the testing analysis of 13
 * November 2026), each held by a case that failed on the code of that day.
 *
 *   TA-409  staff-typed sentences about a student (a correction's reason, a grace decision's note, a run's reason,
 *           a swap's note, a form's refusal, a fee reversal's and a rejected claim's reason) went into the audit
 *           log, against the rule its own writers state (decision 0002: the log holds no sentences about a child);
 *           the words stay on their rows and the log says only that they were given
 *   TA-301  a sealed question paper travels in a server action's body, which Next refuses above 1 MB, while the
 *           library takes up to 2 MB; the limit is raised and said beside the field
 *
 * A scratch ZZ college of this suite's own for the runtime half, removed afterwards; the rest reads the source.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { correctMark, decideGrace, proposeGrace, publishRun, runResults } from "@/lib/exam-cell-marks";
import { db, makeCollege, type College } from "./ta-college-exam-cell-fixture";

let c: College;
let session = "";

beforeAll(async () => {
  c = await makeCollege("Audit");
  session = await c.session("ZZ Audit");
  for (const s of c.students) {
    await c.mark(session, c.c1, s, s === c.students[0] ? 25_000 : 50_000);
    await c.mark(session, c.c2, s, 50_000);
  }
});

afterAll(async () => {
  await c?.drop();
  await db.$disconnect();
});

const metaOf = async (action: string) => JSON.stringify((await db.auditLog.findMany({ where: { schoolId: c.id, action }, select: { meta: true } })).map((r) => r.meta));

describe("TA-409: the audit log holds no staff-typed sentences", () => {
  it("TA-409: a grace decision's note, a run's reason and a correction's reason stay on their rows", async () => {
    const grace = await proposeGrace(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 3, rule: "TO_PASS", reason: "ZZ needs three" });
    await decideGrace(c.ctx("principal"), grace.id!, { approve: true, note: "ZZ unwell on the day of the paper" });
    const first = await runResults(c.ctx("ctrl"), session);
    await publishRun(c.ctx("ctrl"), session, first.id!);
    await correctMark(c.ctx("ctrl"), session, { courseId: c.c2, studentMembershipId: c.students[1]!, marks: 55, absent: false, reason: "ZZ re-marked after a medical note" });
    await runResults(c.ctx("ctrl"), session, "ZZ the medical re-mark");
    const logged = [await metaOf("exam.grace.approve"), await metaOf("exam.marks.correct"), await metaOf("exam.result.run")].join(" ");
    expect(logged).not.toContain("unwell");
    expect(logged).not.toContain("medical");
    // The words are where they were.
    expect((await db.examGrace.findUniqueOrThrow({ where: { id: grace.id! }, select: { decisionNote: true } })).decisionNote).toContain("unwell");
    expect((await db.examMark.findFirstOrThrow({ where: { sessionId: session, source: "CORRECTION" }, select: { reason: true } })).reason).toContain("medical");
  });

  it("TA-409: the swap's note, a form's reason and the fee desk's reasons are not written into the log's meta", () => {
    const read = (p: string) => readFileSync(p, "utf8");
    const line = (src: string, action: string) => src.split("\n").find((l) => l.includes(`"${action}"`) && l.includes("audit(")) ?? "";
    const examCell = read("src/lib/exam-cell.ts");
    expect(line(examCell, "exam.invigilation.swap")).not.toMatch(/note: input\.note/);
    // The form's decision logged `reason` itself (the waiver's or the refusal's words) as a shorthand property.
    expect(line(examCell, "exam.form.approve")).not.toMatch(/meta: \{[^}]*[{,]\s*reason\s*[,}]/);
    const fees = read("src/lib/fees-payments.ts");
    expect(line(fees, "fees.reverse")).not.toMatch(/reason: why/);
    expect(line(fees, "fees.claimReject")).not.toMatch(/reason: why/);
  });
});

describe("TA-301: a question paper up to the library's 2 MB reaches the action", () => {
  it("TA-301: the server action body limit covers a 2 MB paper and the form, and the field says the limit", () => {
    const config = readFileSync("next.config.ts", "utf8");
    const limit = /bodySizeLimit:\s*"(\d+(?:\.\d+)?)mb"/i.exec(config);
    expect(limit, "experimental.serverActions.bodySizeLimit is set").not.toBeNull();
    expect(Number(limit![1])).toBeGreaterThan(2);
    const page = readFileSync("src/app/(app)/faculty/exams/page.tsx", "utf8");
    expect(page).toMatch(/hint=\{t\("examCell\.paperFileHint"\)\}/);
  });
});
