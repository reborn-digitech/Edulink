import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { readJsonArray, writeJson } from "./json";
import { EMPLOYMENT_TYPES, type EmploymentType } from "./constants";
import { contactableMembership } from "./school-profile";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The job board — vacancies schools post for every teacher on the platform.
 *
 * WHO POSTS: an admin or the principal, and each posting names a HIRING
 * CONTACT (an active admin, principal or teacher of the school) so a
 * teacher's enquiry lands on a person, never on a school-shaped void. The
 * contact is told they were named — being volunteered for a queue you don't
 * know exists is how enquiries rot.
 *
 * WHO READS: every school's staff see the same board, exactly like the expert
 * marketplace — an open posting is globally readable by RLS. What crosses is
 * the advertisement: the posting, and the school's prospectus behind it.
 * The hiring contact's NAME does not cross (their Membership row stays
 * school-scoped, correctly); a teacher writes to "the hiring team" and learns
 * who answered when somebody does.
 *
 * CLOSING IS AN END STATE, not a deletion: the row stays for the school's own
 * records and for the enquiry threads that reference it, but it leaves the
 * board — and the Enquiry insert policy — the moment `status` flips.
 */

export type VacancyResult = { ok: true; postingId?: string } | { ok: false; errorKey: TranslationKey };

/** The desk is read by the office and the head alike: what the school has posted and what each post drew. */
function requireDesk(ctx: ActiveContext): { schoolId: string; membershipId: string } {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan");
  }
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId };
}

/**
 * Posting and closing shape the school's hiring, which is setting the
 * school up: the admin's. The head reads the desk (requireDesk) and the
 * enquiries, and does not open or close a post.
 */
function requireStaffing(ctx: ActiveContext): { schoolId: string; membershipId: string } {
  const desk = requireDesk(ctx);
  if (ctx.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  return desk;
}

export async function createPosting(
  ctx: ActiveContext,
  input: {
    title: string;
    body: string;
    subjects: string[];
    employmentType: string;
    hiringContactMembershipId: string;
  },
): Promise<VacancyResult> {
  const { schoolId, membershipId } = requireStaffing(ctx);

  const title = input.title.trim().slice(0, 160);
  const body = input.body.trim().slice(0, 8000);
  if (!title || !body) return { ok: false, errorKey: "vacancies.titleAndBodyRequired" };

  const employmentType: EmploymentType = (EMPLOYMENT_TYPES as readonly string[]).includes(
    input.employmentType,
  )
    ? (input.employmentType as EmploymentType)
    : "FULL_TIME";

  const subjects = [...new Set(input.subjects.map((s) => s.trim()).filter(Boolean))].slice(0, 10);

  const contact = await contactableMembership(schoolId, input.hiringContactMembershipId);
  if (!contact) return { ok: false, errorKey: "explore.contactMustBeActiveStaff" };

  const posting = await db.jobPosting.create({
    data: {
      schoolId,
      title,
      body,
      subjects: writeJson(subjects),
      employmentType,
      hiringContactMembershipId: contact.id,
      postedByMembershipId: membershipId,
    },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "vacancy.post",
    targetType: "JobPosting",
    targetId: posting.id,
    meta: { title, employmentType },
  });

  // The person the enquiries will land on deserves to know they were named.
  if (contact.userId !== ctx.user.id) {
    await notify({
      userId: contact.userId,
      schoolId,
      kind: "ENQUIRY",
      titleKey: "notif.namedHiringContact",
      body: title,
      url: `/vacancies/${posting.id}`,
    });
  }

  return { ok: true, postingId: posting.id };
}

export async function closePosting(ctx: ActiveContext, postingId: string): Promise<VacancyResult> {
  const { schoolId } = requireStaffing(ctx);
  const posting = await db.jobPosting.findFirst({
    where: { id: postingId, schoolId, status: "OPEN" },
    select: { id: true },
  });
  if (!posting) return { ok: false, errorKey: "vacancies.notOpenHere" };

  await db.jobPosting.update({
    where: { id: postingId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "vacancy.close",
    targetType: "JobPosting",
    targetId: postingId,
  });

  return { ok: true };
}

export type BoardPosting = {
  id: string;
  title: string;
  subjects: string[];
  employmentType: string;
  createdAt: Date;
  schoolId: string;
  schoolName: string;
  city: string | null;
  region: string | null;
  logoPath: string | null;
  ours: boolean;
};

/** The platform-wide board: every open vacancy, newest first. */
export async function listBoard(ctx: ActiveContext): Promise<BoardPosting[]> {
  if (ctx.role !== "TEACHER" && ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    throw new AccessError("access.onlySchoolStaffReadTheBoard");
  }
  const rows = await db.jobPosting.findMany({
    where: { status: "OPEN" },
    select: {
      id: true,
      title: true,
      subjects: true,
      employmentType: true,
      createdAt: true,
      schoolId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // The schools behind the board, fetched separately rather than as the
  // required `school` include: an include that RLS refuses is an
  // inconsistent-relation CRASH in Prisma, not a null — and while the
  // removal machinery closes a removed school's postings, one slipping
  // through must cost that one card, not the whole board.
  const schools = await db.school.findMany({
    where: { id: { in: [...new Set(rows.map((p) => p.schoolId))] } },
    select: { id: true, name: true, city: true, region: true, logoPath: true },
  });
  const bySchool = new Map(schools.map((s) => [s.id, s]));

  return rows.flatMap((p) => {
    const school = bySchool.get(p.schoolId);
    if (!school) return [];
    return [{
      id: p.id,
      title: p.title,
      subjects: readJsonArray(p.subjects),
      employmentType: p.employmentType,
      createdAt: p.createdAt,
      schoolId: p.schoolId,
      schoolName: school.name,
      city: school.city,
      region: school.region,
      logoPath: school.logoPath,
      ours: p.schoolId === ctx.schoolId,
    }];
  });
}

export type PostingDetail = BoardPosting & {
  body: string;
  status: string;
  /** Whether THIS reader may enquire: a teacher, and not of this school. */
  canEnquire: boolean;
  /** Staff of the posting school: enquiry count, contact name, closability. */
  ours: boolean;
  contactName: string | null;
  enquiryCount: number | null;
};

export async function readPosting(
  ctx: ActiveContext,
  postingId: string,
): Promise<PostingDetail | null> {
  if (ctx.role !== "TEACHER" && ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    throw new AccessError("access.onlySchoolStaffReadTheBoard");
  }
  const posting = await db.jobPosting.findFirst({
    // Another school's posting is visible only while OPEN (the RLS clause
    // says the same); your own school's stays visible closed, so the desk
    // that posted it can still see what it said.
    //
    // ⚠ NO `hiringContact` INCLUDE HERE. The relation is required in the
    // schema, and for a foreign posting the contact's Membership row is
    // (correctly) refused by RLS — which Prisma reports as an inconsistent
    // required relation, i.e. a crash, not a null. The contact is fetched
    // separately below, only for the posting school's own staff.
    where: ctx.schoolId
      ? { id: postingId, OR: [{ status: "OPEN" }, { schoolId: ctx.schoolId }] }
      : { id: postingId, status: "OPEN" },
    select: {
      id: true,
      title: true,
      body: true,
      subjects: true,
      employmentType: true,
      status: true,
      createdAt: true,
      schoolId: true,
      hiringContactMembershipId: true,
    },
  });
  if (!posting) return null;
  const school = await db.school.findFirst({
    where: { id: posting.schoolId },
    select: { name: true, city: true, region: true, logoPath: true },
  });
  if (!school) return null;
  const isOurs = posting.schoolId === ctx.schoolId;

  const [contact, enquiryCount] = isOurs
    ? await Promise.all([
        db.membership.findUnique({
          where: { id: posting.hiringContactMembershipId },
          select: { user: { select: { name: true, preferredName: true } } },
        }),
        db.enquiry.count({ where: { jobPostingId: posting.id } }),
      ])
    : [null, null];
  return {
    id: posting.id,
    title: posting.title,
    body: posting.body,
    subjects: readJsonArray(posting.subjects),
    employmentType: posting.employmentType,
    status: posting.status,
    createdAt: posting.createdAt,
    schoolId: posting.schoolId,
    schoolName: school.name,
    city: school.city,
    region: school.region,
    logoPath: school.logoPath,
    ours: isOurs,
    canEnquire: ctx.role === "TEACHER" && !isOurs && posting.status === "OPEN",
    // A name only the posting school's own staff see; everyone else writes
    // to "the hiring team" and learns who answered when somebody does.
    contactName: contact ? (contact.user.preferredName ?? contact.user.name) : null,
    enquiryCount,
  };
}

export type OwnPosting = {
  id: string;
  title: string;
  employmentType: string;
  status: string;
  createdAt: Date;
  closedAt: Date | null;
  contactName: string | null;
  enquiryCount: number;
};

/** The school's own desk: every posting, any status, with enquiry counts. */
export async function listOurPostings(
  ctx: ActiveContext,
  opts: { status?: "OPEN" | "CLOSED" | "ALL" } = {},
): Promise<OwnPosting[]> {
  const { schoolId } = requireDesk(ctx);
  const status = opts.status ?? "ALL";
  const rows = await db.jobPosting.findMany({
    where: { schoolId, ...(status === "ALL" ? {} : { status }) },
    select: {
      id: true,
      title: true,
      employmentType: true,
      status: true,
      createdAt: true,
      closedAt: true,
      hiringContact: { select: { user: { select: { name: true, preferredName: true } } } },
      _count: { select: { enquiries: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    employmentType: p.employmentType,
    status: p.status,
    createdAt: p.createdAt,
    closedAt: p.closedAt,
    contactName: p.hiringContact
      ? (p.hiringContact.user.preferredName ?? p.hiringContact.user.name)
      : null,
    enquiryCount: p._count.enquiries,
  }));
}
