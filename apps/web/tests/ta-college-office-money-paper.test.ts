/**
 * A sealed question paper replaced while it is moderated: the third door of finding TA-529 of the testing analysis
 * of 13 November 2026, held by a case that FAILS while the defect stands and passes once it is fixed.
 *
 *   TA-529  submitPaper checked MODERATED on a row read earlier and wrote by id, so a setter's upload racing the
 *           exam cell's Moderate replaced the sealed body and set the paper back to SUBMITTED, keeping the
 *           moderation of a text no longer stored.
 *
 * A scratch ZZ autonomous college from tests/ta-college-exam-cell-fixture.ts, with a setter of this suite's own,
 * removed in afterAll. Needs the sealing key, as the exam cell's own paper suites do.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ActiveContext } from "@/lib/session";
import { submitPaper } from "@/lib/exam-cell-after";
import { sealingAvailable } from "@/lib/secret-box";
import { db, makeCollege, type College } from "./ta-college-exam-cell-fixture";

let auto: College;
const ids: Record<string, string> = {};

function setter(): ActiveContext {
  return {
    sessionId: "zz-ta-com-paper",
    membershipId: ids.setterM!,
    schoolId: auto.id,
    role: "FACULTY",
    user: {
      id: ids.setter!, name: "ZZ COM setter", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

beforeAll(async () => {
  auto = await makeCollege("COMPAPER", { autonomous: true, students: 1 });
  ids.setter = (await db.user.create({ data: { name: "ZZ COM setter", email: `zz-tacec-compaper-setter-${auto.stamp}@test.invalid` }, select: { id: true } })).id;
  ids.setterM = (await db.membership.create({ data: { userId: ids.setter, schoolId: auto.id, role: "FACULTY", status: "ACTIVE" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await auto?.drop();
  await db.$disconnect();
});

describe("TA-529: a moderated paper keeps the text it was moderated on", () => {
  it.skipIf(!sealingAvailable())("TA-529: an upload that read the paper before Moderate committed is refused, and the body stays", async () => {
    const session = await auto.session("ZZ COM Paper", { students: [] });
    const schedule = await db.examSchedule.create({ data: { schoolId: auto.id, sessionId: session, courseId: auto.c1, courseCode: "ZCA", courseName: "ZZ Mechanics", at: new Date("2026-11-04T04:30:00Z") }, select: { id: true } });
    const paper = await db.questionPaper.create({ data: { schoolId: auto.id, sessionId: session, scheduleId: schedule.id, setterMembershipId: ids.setterM!, assignedByUserId: auto.user.ctrl!, status: "SUBMITTED", fileName: "zz-first.pdf", sha256: "zz-first-sha" }, select: { id: true } });
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let ready!: () => void;
    const isReady = new Promise<void>((r) => (ready = r));
    // The exam cell's Moderate, written and not yet committed.
    const moderate = db.$transaction(
      async (tx) => {
        await tx.$executeRaw`UPDATE "QuestionPaper" SET "status" = 'MODERATED', "moderatedByUserId" = ${auto.user.ctrl!}, "moderatedAt" = now() WHERE "id" = ${paper.id}`;
        ready();
        await gate;
      },
      { timeout: 60_000 },
    );
    await isReady;
    const upload = submitPaper(setter(), paper.id, { fileName: "zz-second.pdf", mime: "application/pdf", dataBase64: Buffer.from("%PDF-1.4 ZZ second").toString("base64"), coMap: [] }).then(
      () => "stored",
      (e: unknown) => (e as { key?: string }).key ?? String(e),
    );
    await new Promise((r) => setTimeout(r, 1500));
    release();
    await moderate;
    expect(await upload).toBe("examCell.refusePaperModerated");
    const row = await db.questionPaper.findUniqueOrThrow({ where: { id: paper.id }, select: { status: true, sha256: true, fileName: true } });
    expect(row).toEqual({ status: "MODERATED", sha256: "zz-first-sha", fileName: "zz-first.pdf" });
  });
});
