import "server-only";
import { PLACEMENT_PREP_SUBJECTS, type StudentPlacement } from "@edulink/contracts";
import { db } from "./db";
import { assertGuardianAccess } from "./tenancy";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { listTopics, normaliseLanguage } from "./quiz";
import { todayKey } from "./dates";
import { readJson } from "./json";
import { EMPTY_RECORD, placementRecords } from "./placement-record";
import { myOffers, placementSettings, profileView, studentDrives, studentOf } from "./placement";
import { childInternships, myInternships } from "./placement-internships";
import { renderResumePdf } from "./placement-pdf";
import { normaliseLocale } from "./i18n/locales";
import type { ActiveContext } from "./session";

/**
 * The student's placement page (4 October 2026): the profile and the record
 * it is built on, every drive they can see with whether they qualify and,
 * when not, each condition that failed; their applications, rounds and
 * offers; their internships and credits; the aptitude, reasoning and coding
 * practice on the practice engine; and the free one-to-ones their college's
 * alumni mentors offer (mock interviews in the season) — never priced.
 * A guardian reads offers and internships, with the PLACEMENT grant for an
 * adult (`familyPlacement`).
 */

/** The placement bank's topics with this student's level, from the shared practice catalogue (subjects APTITUDE, REASONING, CODING). */
async function prepTopics(ctx: ActiveContext) {
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const out = [];
  for (const subject of PLACEMENT_PREP_SUBJECTS) {
    for (const t of await listTopics(ctx, { subject, language })) out.push({ slug: t.slug, name: t.name, subject: t.subject, questionCount: t.questionCount, level: t.level });
  }
  return out;
}

/** The one-to-ones the college's alumni mentors offer: their own slots, not begun and not taken. */
export async function mentorSlotsAt(schoolId: string, now: Date = new Date()) {
  const slots = await db.gigSlot.findMany({
    where: { providerKind: "ALUMNUS", teacherSchoolId: schoolId, cancelledAt: null, startsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
    take: 100,
    select: { id: true, title: true, startsAt: true, endsAt: true, seats: true, seatsTaken: true, providerUserId: true, provider: { select: { name: true, preferredName: true } } },
  });
  const open = slots.filter((s) => s.seatsTaken < s.seats);
  const rows = open.length ? await db.membership.findMany({ where: { schoolId, role: "ALUMNUS", userId: { in: open.map((s) => s.providerUserId) } }, select: { userId: true, joinedAt: true } }) : [];
  const batch = new Map(rows.map((r) => [r.userId, r.joinedAt.getUTCFullYear()]));
  return open.map((s) => ({ id: s.id, title: s.title, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), mentorName: s.provider.preferredName ?? s.provider.name, batchYear: batch.get(s.providerUserId) ?? null, seatsLeft: s.seats - s.seatsTaken }));
}

export async function studentPlacement(ctx: ActiveContext): Promise<StudentPlacement> {
  const me = await studentOf(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: me.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const [settings, profile, records, drives, offers, internships, prep, mentorSlots] = await Promise.all([
    placementSettings(me.schoolId, today),
    db.placementProfile.findUnique({ where: { studentMembershipId: me.membershipId } }),
    placementRecords(me.schoolId, [me.membershipId], today),
    studentDrives(me),
    myOffers(me.membershipId),
    myInternships(me.membershipId),
    prepTopics(ctx),
    mentorSlotsAt(me.schoolId),
  ]);
  return {
    batchYear: settings.seasonBatchYear,
    profile: profileView(profile),
    record: records.get(me.membershipId) ?? EMPTY_RECORD,
    drives,
    offers,
    internships: internships.internships,
    internshipCredits: internships.creditsTotal,
    prep,
    mentorSlots,
  };
}

/** The student's own resume, rendered from the live record and the profile, in their language. */
export async function myResume(ctx: ActiveContext): Promise<{ filename: string; pdf: Buffer }> {
  const me = await studentOf(ctx);
  const [school, profile, internships] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: me.schoolId }, select: { name: true, timezone: true } }),
    db.placementProfile.findUnique({ where: { studentMembershipId: me.membershipId } }),
    db.internship.findMany({ where: { studentMembershipId: me.membershipId, status: { in: ["SUBMITTED", "EVALUATED", "CREDITED"] } }, orderBy: { fromKey: "asc" } }),
  ]);
  const record = (await placementRecords(me.schoolId, [me.membershipId], todayKey(school.timezone))).get(me.membershipId) ?? EMPTY_RECORD;
  const pdf = await renderResumePdf({
    locale: normaliseLocale(ctx.user.prefs.locale),
    name: ctx.user.preferredName ?? ctx.user.name,
    collegeName: school.name,
    record,
    skills: readJson<string[]>(profile?.skills, []),
    certifications: readJson<string[]>(profile?.certifications, []),
    projects: readJson<{ title: string; note: string }[]>(profile?.projects, []),
    internships: internships.map((i) => ({ companyName: i.companyName, from: i.fromKey, to: i.toKey, hours: i.hours })),
    watermark: null,
  });
  return { filename: "resume.pdf", pdf };
}

/**
 * A guardian reads a child's offers and internships: the child must be theirs
 * (`assertGuardianAccess`, which refuses an adult's guardian unless the
 * child has granted PLACEMENT), at a college that has placement on.
 */
export async function familyPlacement(ctx: ActiveContext, childId: string | null | undefined) {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  let id = childId ?? null;
  if (!id) {
    const first = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null, school: { kind: { in: ["COLLEGE", "AUTONOMOUS_COLLEGE"] } } } }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true } });
    id = first?.studentMembershipId ?? null;
  }
  if (!id) throw new AccessError("access.notYourChild", "NOT_FOUND");
  const link = await assertGuardianAccess(ctx.user.id, id, "PLACEMENT");
  await assertModuleOn(link.student.schoolId, "PLACEMENT");
  return { name: link.student.user.preferredName ?? link.student.user.name, offers: await myOffers(id), internships: await childInternships(id) };
}
