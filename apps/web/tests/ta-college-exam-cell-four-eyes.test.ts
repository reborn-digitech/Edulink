/**
 * TA-237 (college-exam-cell batch of the testing analysis of 13 November
 * 2026): the owner's four-eyes rule (R-7, "the platform does not let one
 * account approve its own ask") stopped at the three approvals it was written
 * for. One account holding EXAM_CONTROLLER and PRINCIPAL approved its own
 * grace and published, as the principal, a run carrying the corrections it
 * made as controller; one holding ADMIN and PRINCIPAL approved its own PEN
 * change. Each is refused now with collegeDesks.refuseOwnAsk, and a second
 * person still decides.
 *
 * A scratch ZZ college of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { correctMark, decideGrace, proposeGrace, publishRun, runResults } from "@/lib/exam-cell-marks";
import { decidePenChange, proposePenChange } from "@/lib/pen-changes";
import { db, makeCollege, refusalOf, type College } from "./ta-college-exam-cell-fixture";

let c: College;
let session = "";

beforeAll(async () => {
  c = await makeCollege("FourEyes");
  session = await c.session("ZZ Four eyes");
  // s1 fails c1 on 25/70 (28 needed); everyone else passes both.
  for (const s of c.students) {
    await c.mark(session, c.c1, s, s === c.students[0] ? 25_000 : 50_000);
    await c.mark(session, c.c2, s, 50_000);
  }
});

afterAll(async () => {
  await c?.drop();
  await db.$disconnect();
});

describe("TA-237: one person does not sign both halves", () => {
  it("TA-237: a grace proposed as controller is not approved by the same account as principal", async () => {
    const proposed = await proposeGrace(c.ctx("dual", "EXAM_CONTROLLER"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 3, rule: "TO_PASS", reason: "ZZ needs three" });
    const refused = await refusalOf(decideGrace(c.ctx("dual", "PRINCIPAL"), proposed.id!, { approve: true }));
    expect(refused.key).toBe("collegeDesks.refuseOwnAsk");
    expect((await db.examGrace.findUniqueOrThrow({ where: { id: proposed.id! }, select: { status: true } })).status).toBe("PROPOSED");
    expect(await db.examMark.count({ where: { sessionId: session, courseId: c.c1, studentMembershipId: c.students[0]!, source: "GRACE" } })).toBe(0);
    // Another principal decides it.
    expect((await decideGrace(c.ctx("principal"), proposed.id!, { approve: true })).ok).toBe(true);
  });

  it("TA-237: a run carrying the principal's own corrections is not published by that principal", async () => {
    const first = await runResults(c.ctx("ctrl"), session);
    await publishRun(c.ctx("ctrl"), session, first.id!);
    // The dual account corrects a published mark as controller ...
    await correctMark(c.ctx("dual", "EXAM_CONTROLLER"), session, { courseId: c.c2, studentMembershipId: c.students[1]!, marks: 55, absent: false, reason: "ZZ re-totalled" });
    const rerun = await runResults(c.ctx("ctrl"), session, "ZZ correction");
    // ... and may not be the second signatory on it.
    const refused = await refusalOf(publishRun(c.ctx("dual", "PRINCIPAL"), session, rerun.id!));
    expect(refused.key).toBe("collegeDesks.refuseOwnAsk");
    expect((await db.resultRun.findUniqueOrThrow({ where: { id: rerun.id! }, select: { status: true } })).status).toBe("DRAFT");
    // The other principal publishes it.
    expect((await publishRun(c.ctx("principal"), session, rerun.id!)).ok).toBe(true);
    expect((await db.resultRun.findUniqueOrThrow({ where: { id: rerun.id! }, select: { status: true } })).status).toBe("PUBLISHED");
  });

  it("TA-237: a PEN change proposed as admin is not approved by the same account as head", async () => {
    await db.membership.create({ data: { userId: c.user.dual!, schoolId: c.id, role: "ADMIN", status: "ACTIVE" } });
    const pupilUser = c.user.s3!;
    const before = `3${String(c.stamp).slice(-10)}`;
    const after = `4${String(c.stamp).slice(-10)}`;
    await db.user.update({ where: { id: pupilUser }, data: { penNumber: before } });
    const admin = c.ctx("dual", "ADMIN");
    admin.membershipId = (await db.membership.findFirstOrThrow({ where: { userId: c.user.dual!, schoolId: c.id, role: "ADMIN" }, select: { id: true } })).id;
    const asked = await proposePenChange(admin, c.students[2]!, { toPen: after, reason: "ZZ the UDISE+ record says otherwise" });
    const refused = await refusalOf(decidePenChange(c.ctx("dual", "PRINCIPAL"), asked.id, { approve: true }));
    expect(refused.key).toBe("collegeDesks.refuseOwnAsk");
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUser }, select: { penNumber: true } })).penNumber).toBe(before);
    expect((await db.penChangeRequest.findUniqueOrThrow({ where: { id: asked.id }, select: { principalDecidedAt: true } })).principalDecidedAt).toBeNull();
    const applied = await decidePenChange(c.ctx("principal"), asked.id, { approve: true });
    expect(applied.status).toBe("APPLIED");
  });
});
