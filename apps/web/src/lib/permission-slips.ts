import "server-only";
import type { z } from "zod";
import type { slipReportSchema, slipViewSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { assertGuardianAccess } from "./tenancy";
import { isMinorToday } from "./student-consent";
import { forSchool } from "./tenant-context";
import { todayKey } from "./dates";
import { studentTokensOf } from "./college-audience";
import type { ActiveContext } from "./session";

/**
 * PERMISSION SLIPS (5 October 2026; the campaign's parent recommendation: "a
 * circular with a yes/no per child and a deadline; the acknowledgement
 * machinery exists"). A circular may ask one yes-or-no question
 * (Post.consentQuestion) until a day (Post.consentBy): a trip, a vaccination
 * camp, a photograph in the annual magazine. Each child in the circular's
 * audience gets one answer (PostConsent), given by any of their guardians and
 * changeable until the day; the last answer stands and says who gave it.
 * Answering is also the circular's "seen and understood" (PostAck). An adult
 * at a college answers for themself; their guardians do not (the default of
 * every family door with no grant, tenancy.ts). The staff who may read a
 * circular's reach read the slip's answers child by child, with who has not
 * answered — the class teacher's list the morning of the trip.
 */

type SlipView = z.infer<typeof slipViewSchema>;
type SlipReport = z.infer<typeof slipReportSchema>;
type SlipPost = { id: string; schoolId: string; scope: string; classId: string | null; audience: string; audienceGrade: string | null; audienceTarget: string | null; consentQuestion: string; consentBy: string | null };

const SLIP_SELECT = { id: true, schoolId: true, scope: true, classId: true, audience: true, audienceGrade: true, audienceTarget: true, consentQuestion: true, consentBy: true, status: true } as const;

async function slipPost(postId: string, schoolId?: string): Promise<SlipPost> {
  const p = await db.post.findFirst({ where: { id: postId, ...(schoolId ? { schoolId } : {}), status: "APPROVED", consentQuestion: { not: null } }, select: SLIP_SELECT });
  if (!p || !p.schoolId || !p.consentQuestion) throw new AccessError("access.postNotFound", "NOT_FOUND");
  return { ...p, schoolId: p.schoolId, consentQuestion: p.consentQuestion };
}

/** Whether the slip still takes answers: through its day, in the school's zone; no day, no end. */
async function isOpen(post: SlipPost, now: Date): Promise<boolean> {
  if (!post.consentBy) return true;
  const tz = (await db.school.findUnique({ where: { id: post.schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  return todayKey(tz, now) <= post.consentBy;
}

/** The students a slip asks about: the class's, or the school's (by grade, or a college notice's target). */
async function audienceOf(post: SlipPost): Promise<{ membershipId: string; name: string; className: string | null }[]> {
  if (post.scope === "CLASS" && post.classId) {
    const rows = await db.enrollment.findMany({ where: { schoolId: post.schoolId, classId: post.classId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true, class: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
    return rows.map((r) => ({ membershipId: r.studentMembershipId, name: r.student.user.preferredName ?? r.student.user.name, className: r.class.name }));
  }
  const students = await db.membership.findMany({
    where: { schoolId: post.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, ...(post.audienceGrade ? { enrollments: { some: { status: "ACTIVE", class: { gradeLevel: post.audienceGrade, archivedAt: null } } } } : {}) },
    select: { id: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { class: { select: { name: true } } }, take: 1 } },
    take: 5000,
  });
  let rows = students.map((m) => ({ membershipId: m.id, name: m.user.preferredName ?? m.user.name, className: m.enrollments[0]?.class.name ?? null }));
  if (post.audienceTarget) {
    const keep: typeof rows = [];
    for (const r of rows) if ((await studentTokensOf(r.membershipId)).includes(post.audienceTarget)) keep.push(r);
    rows = keep;
  }
  return rows;
}

async function inAudience(post: SlipPost, studentMembershipId: string): Promise<boolean> {
  return (await audienceOf(post)).some((s) => s.membershipId === studentMembershipId);
}

/** A family's answer for one child (a guardian), or an adult student's own. Changing it until the day is allowed. */
export async function answerSlip(ctx: ActiveContext, postId: string, input: { studentMembershipId: string; answer: "YES" | "NO" }, now: Date = new Date()): Promise<SlipView> {
  let schoolId: string;
  if (ctx.role === "PARENT") {
    // No grant names a slip: an adult at a college answers for themself.
    const link = await assertGuardianAccess(ctx.user.id, input.studentMembershipId);
    schoolId = link.student.school.id;
  } else if (ctx.role === "STUDENT" && ctx.schoolId && ctx.membershipId === input.studentMembershipId) {
    const me = await db.membership.findUniqueOrThrow({ where: { id: ctx.membershipId }, select: { user: { select: { birthdate: true, isMinor: true } }, school: { select: { timezone: true } } } });
    if (isMinorToday(me.user, me.school.timezone, now)) throw new AccessError("collegeDesks.refuseSlipMinor");
    schoolId = ctx.schoolId;
  } else throw new AccessError("access.wrongRoleForThisAction");
  return forSchool(schoolId, async () => {
    const post = await slipPost(postId, schoolId);
    if (!(await inAudience(post, input.studentMembershipId))) throw new AccessError("access.postNotFound", "NOT_FOUND");
    if (!(await isOpen(post, now))) throw new AccessError("collegeDesks.refuseSlipClosed", "FORBIDDEN", { date: post.consentBy ?? "" });
    await db.postConsent.upsert({
      where: { postId_studentMembershipId: { postId, studentMembershipId: input.studentMembershipId } },
      create: { postId, schoolId, studentMembershipId: input.studentMembershipId, answeredByUserId: ctx.user.id, answer: input.answer },
      update: { answeredByUserId: ctx.user.id, answer: input.answer },
    });
    // Answering is seeing: the circular's reach counts the family.
    await db.postAck.upsert({ where: { postId_userId: { postId, userId: ctx.user.id } }, update: {}, create: { postId, userId: ctx.user.id, schoolId } });
    await audit({ schoolId, actorUserId: ctx.user.id, action: "circular.slip.answer", targetType: "Post", targetId: postId, meta: { studentMembershipId: input.studentMembershipId, answer: input.answer } });
    return slipFor(ctx, post, now);
  });
}

async function slipFor(ctx: ActiveContext, post: SlipPost, now: Date): Promise<SlipView> {
  const audience = await audienceOf(post);
  let mine: { membershipId: string; name: string }[];
  if (ctx.role === "PARENT") {
    const links = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE", studentSchoolId: post.schoolId }, select: { studentMembershipId: true } });
    const ids = new Set(links.map((l) => l.studentMembershipId));
    mine = [];
    for (const s of audience.filter((a) => ids.has(a.membershipId))) {
      try {
        await assertGuardianAccess(ctx.user.id, s.membershipId);
        mine.push(s);
      } catch {
        // An adult at a college answers for themself.
      }
    }
  } else if (ctx.role === "STUDENT" && ctx.membershipId) {
    const self = audience.find((a) => a.membershipId === ctx.membershipId);
    const me = self ? await db.membership.findUniqueOrThrow({ where: { id: self.membershipId }, select: { user: { select: { birthdate: true, isMinor: true } }, school: { select: { timezone: true } } } }) : null;
    mine = self && me && !isMinorToday(me.user, me.school.timezone, now) ? [self] : [];
  } else mine = [];
  const answers = await db.postConsent.findMany({ where: { postId: post.id, studentMembershipId: { in: mine.map((m) => m.membershipId) } }, select: { studentMembershipId: true, answer: true, answeredByUserId: true } });
  const names = new Map((await db.user.findMany({ where: { id: { in: [...new Set(answers.map((a) => a.answeredByUserId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const byChild = new Map(answers.map((a) => [a.studentMembershipId, a]));
  return {
    question: post.consentQuestion,
    consentBy: post.consentBy,
    open: await isOpen(post, now),
    children: mine.map((m) => {
      const a = byChild.get(m.membershipId);
      return { studentMembershipId: m.membershipId, name: m.name, answer: (a?.answer as "YES" | "NO" | undefined) ?? null, answeredByName: a ? (names.get(a.answeredByUserId) ?? null) : null };
    }),
  };
}

/** The reader's view of a slip: their children in its audience (a student: themself, if an adult) and each one's answer. */
export async function slipForReader(ctx: ActiveContext, postId: string, now: Date = new Date()): Promise<SlipView> {
  if (ctx.role === "PARENT") {
    const p = await db.post.findFirst({ where: { id: postId, consentQuestion: { not: null } }, select: { schoolId: true } });
    // A guardian reaches the post through a child at its school, as the feed does.
    const linked = p?.schoolId ? await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", studentSchoolId: p.schoolId }, select: { id: true } }) : null;
    if (!p?.schoolId || !linked) throw new AccessError("access.postNotFound", "NOT_FOUND");
    return forSchool(p.schoolId, async () => slipFor(ctx, await slipPost(postId, p.schoolId!), now));
  }
  if (ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  if (!ctx.schoolId) throw new AccessError("access.postNotFound", "NOT_FOUND");
  return slipFor(ctx, await slipPost(postId, ctx.schoolId), now);
}

/** The staff's list: every child in the audience, their answer and who gave it, the unanswered first. A teacher reads a class slip of their own class; the office and the head every slip. */
export async function slipReport(ctx: ActiveContext, postId: string, now: Date = new Date()): Promise<SlipReport> {
  if (!ctx.schoolId || !ctx.role || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  const post = await slipPost(postId, ctx.schoolId);
  if (ctx.role === "TEACHER") {
    const own = post.classId ? await db.classTeacher.findFirst({ where: { classId: post.classId, teacherMembershipId: ctx.membershipId ?? "" }, select: { id: true } }) : null;
    const author = await db.post.findFirst({ where: { id: post.id, authorMembershipId: ctx.membershipId }, select: { id: true } });
    if (!own && !author) throw new AccessError("access.postNotFound", "NOT_FOUND");
  }
  const audience = await audienceOf(post);
  const answers = await db.postConsent.findMany({ where: { postId: post.id }, select: { studentMembershipId: true, answer: true, answeredByUserId: true, updatedAt: true } });
  const names = new Map((await db.user.findMany({ where: { id: { in: [...new Set(answers.map((a) => a.answeredByUserId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const byChild = new Map(answers.map((a) => [a.studentMembershipId, a]));
  const rows = audience
    .map((s) => {
      const a = byChild.get(s.membershipId);
      return { studentMembershipId: s.membershipId, name: s.name, className: s.className, answer: (a?.answer as "YES" | "NO" | undefined) ?? null, answeredByName: a ? (names.get(a.answeredByUserId) ?? null) : null, answeredAt: a?.updatedAt.toISOString() ?? null };
    })
    .sort((x, y) => Number(x.answer !== null) - Number(y.answer !== null) || (x.className ?? "").localeCompare(y.className ?? "") || x.name.localeCompare(y.name));
  return { question: post.consentQuestion, consentBy: post.consentBy, open: await isOpen(post, now), yes: rows.filter((r) => r.answer === "YES").length, no: rows.filter((r) => r.answer === "NO").length, none: rows.filter((r) => r.answer === null).length, rows };
}
