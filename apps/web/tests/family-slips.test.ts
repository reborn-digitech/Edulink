/**
 * R-1 (risks batch, 5 Oct 2026): a family answers a permission slip on the web. The walk found no screen that let a
 * parent answer one; now /parent lists the open slips with a child of theirs unanswered (openSlipsForFamily), the
 * notice takes the yes or no in place (answerSlipAction, the consent door's library call), the answer shows who gave
 * it and reaches the staff's report, and a guardian of another child is refused.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createPost } from "@/lib/bulletin";
import { slipForReader, slipReport } from "@/lib/permission-slips";
import { openSlipsForFamily } from "@/lib/permission-slips-family";
import { FORM_IDLE } from "@/lib/form-state";
import { translator } from "@/lib/i18n/dictionary";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
import { answerSlipAction } from "@/app/(app)/bulletin/[postId]/slip-actions";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const t = translator("en");
const ids = { school: "", users: [] as string[], teacher: "", teacherM: "", pupil1: "", pupil2: "", pupil3: "", p1: "", p2: "", class1: "", class2: "", slip: "" };

async function as(userId: string, role: string, schoolId: string | null = ids.school) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

function answer(studentMembershipId: string, value: "YES" | "NO", postId = ids.slip): FormData {
  const f = new FormData();
  f.set("postId", postId);
  f.set("studentMembershipId", studentMembershipId);
  f.set("answer", value);
  return f;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Family Slips ${STAMP}`, slug: `zz-fslips-${STAMP}`, code: `ZFS${SUFFIX}`, contactEmail: `zz-fslips-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const user = async (who: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ FSlips ${who}`, email: `zz-fslips-${who.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  const member = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } }).then((m) => m.id);
  ids.teacher = await user("Teacher");
  ids.teacherM = await member(ids.teacher, "TEACHER");
  ids.pupil1 = await member(await user("Pupil One", { isMinor: true }), "STUDENT");
  ids.pupil2 = await member(await user("Pupil Two", { isMinor: true }), "STUDENT");
  ids.pupil3 = await member(await user("Pupil Three", { isMinor: true }), "STUDENT");
  ids.class1 = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 6A", gradeLevel: "6", joinCode: `ZZFS1${SUFFIX}` }, select: { id: true } })).id;
  ids.class2 = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 6B", gradeLevel: "6", joinCode: `ZZFS2${SUFFIX}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [{ classId: ids.class1, schoolId: ids.school, studentMembershipId: ids.pupil1 }, { classId: ids.class1, schoolId: ids.school, studentMembershipId: ids.pupil2 }, { classId: ids.class2, schoolId: ids.school, studentMembershipId: ids.pupil3 }] });
  await db.classTeacher.create({ data: { classId: ids.class1, schoolId: ids.school, teacherMembershipId: ids.teacherM } });
  ids.p1 = await user("Parent One");
  ids.p2 = await user("Parent Two");
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.p1, studentMembershipId: ids.pupil1, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.p1, studentMembershipId: ids.pupil2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.p2, studentMembershipId: ids.pupil3, studentSchoolId: ids.school, status: "ACTIVE" },
    ],
  });
  ids.slip = (await createPost(await as(ids.teacher, "TEACHER"), { scope: "CLASS", classId: ids.class1, title: "ZZ Science centre trip", body: "On Friday.", tags: [], media: [], consentQuestion: "May your child go to the science centre?", consentBy: "2099-12-31" })).postId;
});

afterAll(async () => {
  __resetCookies();
  await db.notification.deleteMany({ where: { userId: { in: ids.users } } });
  const members = await db.membership.findMany({ where: { schoolId: ids.school }, select: { id: true } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: [...members.map((m) => `post:${m.id}`), ...ids.users.flatMap((u) => [`slip-answer:${u}`, `consent:${u}`])] } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("a family answers a permission slip on the web (R-1)", () => {
  it("lists the open slip on the family's page with the children still to answer", async () => {
    const slips = await openSlipsForFamily(await as(ids.p1, "PARENT", null));
    const mine = slips.find((s) => s.postId === ids.slip);
    expect(mine).toMatchObject({ title: "ZZ Science centre trip", question: "May your child go to the science centre?", consentBy: "2099-12-31" });
    expect(mine!.unanswered.sort()).toEqual(["ZZ FSlips Pupil One", "ZZ FSlips Pupil Two"]);
    // A family with no child in the class is not asked.
    expect((await openSlipsForFamily(await as(ids.p2, "PARENT", null))).map((s) => s.postId)).not.toContain(ids.slip);
  });

  it("takes the answer in place, shows who gave it, and the staff's report has it", async () => {
    await as(ids.p1, "PARENT", null);
    const done = await answerSlipAction(FORM_IDLE, answer(ids.pupil1, "YES"));
    expect(done).toMatchObject({ ok: true, message: t("collegeDesks.slipSaved") });
    const view = await slipForReader(await as(ids.p1, "PARENT", null), ids.slip);
    expect(view.children.find((c) => c.studentMembershipId === ids.pupil1)).toMatchObject({ answer: "YES", answeredByName: "ZZ FSlips Parent One" });
    const report = await slipReport(await as(ids.teacher, "TEACHER"), ids.slip);
    expect(report.rows.find((r) => r.studentMembershipId === ids.pupil1)).toMatchObject({ answer: "YES", answeredByName: "ZZ FSlips Parent One" });
    // One child left: the card still asks, for that child only.
    expect((await openSlipsForFamily(await as(ids.p1, "PARENT", null))).find((s) => s.postId === ids.slip)?.unanswered).toEqual(["ZZ FSlips Pupil Two"]);
    await as(ids.p1, "PARENT", null);
    expect((await answerSlipAction(FORM_IDLE, answer(ids.pupil2, "NO"))).ok).toBe(true);
    expect((await openSlipsForFamily(await as(ids.p1, "PARENT", null))).map((s) => s.postId)).not.toContain(ids.slip);
  });

  it("refuses a guardian answering for a child who is not theirs, in place and with what was posted kept", async () => {
    await as(ids.p2, "PARENT", null);
    const refused = await answerSlipAction(FORM_IDLE, answer(ids.pupil1, "NO"));
    expect(refused.ok).toBe(false);
    expect(refused.values).toMatchObject({ studentMembershipId: ids.pupil1, answer: "NO" });
    const view = await slipForReader(await as(ids.p1, "PARENT", null), ids.slip);
    expect(view.children.find((c) => c.studentMembershipId === ids.pupil1)?.answer).toBe("YES");
  });

  it("puts the card on the family's page and answers through <ActionForm> on the notice", () => {
    const read = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
    expect(read("app/(app)/parent/page.tsx")).toContain("<FamilySlipsCard slips={familySlips} t={t} />");
    expect(read("app/(app)/parent/slips-card.tsx")).toContain("href={`/bulletin/${s.postId}#slip`}");
    expect(read("app/(app)/bulletin/[postId]/slip.tsx")).toContain("<ActionForm key={answer} action={answerSlipAction}>");
  });
});
