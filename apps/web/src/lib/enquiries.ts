import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { readJson, writeJson } from "./json";
import { CONTACTABLE_ROLES, type EnquiryKind } from "./constants";
import { forSchool } from "./tenant-context";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";
import { assertFeatureOn } from "./platform-features";

/**
 * Enquiries — the conversation an outsider opens with a school.
 *
 * A parent asking about admission (through the directory) or a teacher asking
 * about a vacancy (through the board). The thread lives in the TARGET school's
 * tenant; the opener keeps reading and replying through the self clauses and
 * pinned insert policies in scripts/gen-rls.ts — the enquiries counterpart of
 * the global feed's cross-tenant writes.
 *
 * WHO ANSWERS, ON THE SCHOOL SIDE. The named contact — the admissions contact
 * for an ADMISSION enquiry, the posting's hiring contact for a JOB one — plus
 * every admin and the principal, who run the desk the contact sits at. A
 * teacher who is NOT the named contact sees nothing: an enquiry is somebody's
 * to answer, not the staff room's to browse.
 *
 * WHAT THE OPENER'S SIDE NEVER GETS: a list of the school's people, or a
 * channel that outlives the school's own opt-in. New enquiries require the
 * profile published / the vacancy open (in the insert policy, not a page's
 * `if`); existing threads live on so an answer already owed can still be
 * given, and CLOSING a thread is the school's act that ends replies from both
 * sides.
 *
 * ONE THREAD PER QUESTION. Opening "again" against the same school, kind and
 * vacancy while a thread is still open APPENDS to it instead of minting a
 * sibling — the school answers one conversation, not a pile of duplicates.
 */

export type EnquiryResult =
  | { ok: true; enquiryId: string }
  | { ok: false; errorKey: TranslationKey };

const MAX_BODY = 5000;

/**
 * Where a new enquiry (or an opener's reply) should be announced: the named
 * contact while they are still contactable, otherwise the school's admins —
 * a named person leaving must reroute the queue, never silence it.
 *
 * ⚠ RUNS UNDER THE TARGET SCHOOL'S OWN BINDING (`forSchool`), NOT THE
 * CALLER'S. The caller is an outsider — a parent with no school, a teacher
 * bound to a DIFFERENT school — and under their binding the target's
 * Membership rows are (correctly) unreadable, so the named contact resolves
 * to nobody and the enquiry arrives silently. The walkthrough caught exactly
 * that: the parent's announcement fired (a guardian's tenant set includes
 * the child's school) and the teacher's did not. What this widens is
 * precisely two reads the server itself asks — "who is the contact?" and
 * "who are the admins?" — with a server-resolved schoolId, to route a
 * notification; nothing here returns data to the caller.
 */
async function contactUserIds(
  schoolId: string,
  kind: EnquiryKind,
  jobPostingId: string | null,
): Promise<string[]> {
  return forSchool(schoolId, () => contactUserIdsBound(schoolId, kind, jobPostingId));
}

async function contactUserIdsBound(
  schoolId: string,
  kind: EnquiryKind,
  jobPostingId: string | null,
): Promise<string[]> {
  const namedMembershipId =
    kind === "JOB" && jobPostingId
      ? (
          await db.jobPosting.findFirst({
            where: { id: jobPostingId, schoolId },
            select: { hiringContactMembershipId: true },
          })
        )?.hiringContactMembershipId
      : (
          await db.school.findFirst({
            where: { id: schoolId },
            select: { admissionsContactMembershipId: true },
          })
        )?.admissionsContactMembershipId;

  if (namedMembershipId) {
    const named = await db.membership.findFirst({
      where: {
        id: namedMembershipId,
        schoolId,
        status: "ACTIVE",
        role: { in: [...CONTACTABLE_ROLES] },
      },
      select: { userId: true },
    });
    if (named) return [named.userId];
  }

  const admins = await db.membership.findMany({
    where: { schoolId, status: "ACTIVE", leftAt: null, role: "ADMIN" },
    select: { userId: true },
  });
  return admins.map((a) => a.userId);
}

export async function openEnquiry(
  ctx: ActiveContext,
  input: { schoolId: string; kind: EnquiryKind; jobPostingId?: string | null; body: string },
): Promise<EnquiryResult> {
  const body = input.body.trim().slice(0, MAX_BODY);
  if (!body) return { ok: false, errorKey: "enquiries.sayWhatYouWantToAsk" };

  // The door matches the knocker: admissions for parents, vacancies for
  // teachers. Staff of the school ITSELF have their own desks already.
  if (input.kind === "ADMISSION") {
    if (ctx.role !== "PARENT") throw new AccessError("access.onlyAParentAsksAboutAdmission");
  } else if (input.kind === "JOB") {
    // The job board switched off on the platform (15 Oct 2026): a vacancy is "not here", an admission enquiry is untouched.
    await assertFeatureOn("JOB_BOARD", ctx);
    if (ctx.role !== "TEACHER") throw new AccessError("access.onlyATeacherAsksAboutAVacancy");
    if (ctx.schoolId === input.schoolId) {
      return { ok: false, errorKey: "enquiries.thisIsYourOwnSchool" };
    }
  } else {
    throw new AccessError("access.thatIsNotAKindOfEnquiry");
  }

  // An existing open thread absorbs the message FIRST, before any door
  // check: the writer could say the same words through the thread's reply
  // box, which no closure of the profile or the vacancy revokes — only
  // closing the THREAD does. The door predicates below gate new threads.
  const normalizedPostingId = input.kind === "JOB" ? (input.jobPostingId ?? null) : null;
  const open = await db.enquiry.findFirst({
    where: {
      schoolId: input.schoolId,
      kind: input.kind,
      jobPostingId: normalizedPostingId,
      fromUserId: ctx.user.id,
      status: "OPEN",
    },
    select: { id: true, subject: true },
  });
  if (open) {
    await db.enquiryMessage.create({
      data: {
        schoolId: input.schoolId,
        enquiryId: open.id,
        authorUserId: ctx.user.id,
        body,
      },
    });
    await announce(input.schoolId, input.kind, normalizedPostingId, open.id, ctx, open.subject);
    return { ok: true, enquiryId: open.id };
  }

  // The same predicates the insert policy enforces, checked first so refusal
  // is a sentence rather than a database error.
  let schoolName: string;
  let subject = "";
  let jobPostingId: string | null = null;
  if (input.kind === "ADMISSION") {
    const school = await db.school.findFirst({
      where: { id: input.schoolId, profilePublishedAt: { not: null }, removedAt: null },
      select: { name: true },
    });
    if (!school) return { ok: false, errorKey: "enquiries.notTakingEnquiries" };
    schoolName = school.name;
  } else {
    const posting = await db.jobPosting.findFirst({
      where: { id: input.jobPostingId ?? "", schoolId: input.schoolId, status: "OPEN" },
      select: { title: true },
    });
    if (!posting) return { ok: false, errorKey: "enquiries.vacancyNoLongerOpen" };
    // Separate fetch, not the required `school` include — an include RLS
    // refuses is a Prisma crash, and this path must refuse with a sentence.
    const school = await db.school.findFirst({
      where: { id: input.schoolId, removedAt: null },
      select: { name: true },
    });
    if (!school) return { ok: false, errorKey: "enquiries.notTakingEnquiries" };
    schoolName = school.name;
    subject = posting.title;
    jobPostingId = input.jobPostingId ?? null;
  }

  // `$tenantTransaction`, not `db.$transaction`, for the reason remarks.ts
  // spells out — and the outreach insert policies key on `app.user_id`,
  // which this binds along with the schools.
  const enquiry = await db.$tenantTransaction(async (rawTx) => {
    const tx = rawTx as typeof db;
    const created = await tx.enquiry.create({
      data: {
        schoolId: input.schoolId,
        kind: input.kind,
        jobPostingId,
        fromUserId: ctx.user.id,
        schoolName,
        subject,
      },
    });
    await tx.enquiryMessage.create({
      data: {
        schoolId: input.schoolId,
        enquiryId: created.id,
        authorUserId: ctx.user.id,
        body,
      },
    });
    return created;
  });

  await announce(input.schoolId, input.kind, jobPostingId, enquiry.id, ctx, subject);

  await audit({
    schoolId: input.schoolId,
    actorUserId: ctx.user.id,
    action: "enquiry.open",
    targetType: "Enquiry",
    targetId: enquiry.id,
    meta: { kind: input.kind, ...(subject ? { subject } : {}) },
  });

  return { ok: true, enquiryId: enquiry.id };
}

/** Tell the school side somebody is at the door (or spoke again). */
async function announce(
  schoolId: string,
  kind: EnquiryKind,
  jobPostingId: string | null,
  enquiryId: string,
  ctx: ActiveContext,
  subject: string,
): Promise<void> {
  const recipients = await contactUserIds(schoolId, kind, jobPostingId);
  const fromName = ctx.user.preferredName ?? ctx.user.name;
  /**
   * ⚠ DELIVERED UNDER THE TARGET SCHOOL'S BINDING, deliberately unlike the
   * global feed's best-effort `notify(...).catch()`. There the comment is
   * the record and the notification a nicety; here the notification IS the
   * feature — an enquiry the contact is never told about is a parent
   * writing into a void, which is the exact failure this module exists to
   * remove. The Notification row lives in the recipient's own tenant
   * (`schoolId` is theirs), so binding that school for the insert is the
   * same move `audit()` makes for the same reason, with the same invariant:
   * the schoolId is server-resolved, never client input.
   */
  await forSchool(schoolId, async () => {
    await Promise.all(
      recipients.map((userId) =>
        notify({
          userId,
          schoolId,
          kind: "ENQUIRY",
          titleKey: kind === "ADMISSION" ? "notif.admissionEnquiry" : "notif.vacancyEnquiry",
          body: subject ? `${fromName} — ${subject}` : fromName,
          url: `/enquiries/${enquiryId}`,
        }),
      ),
    );
  });
}

type EnquiryRow = {
  id: string;
  schoolId: string;
  kind: string;
  jobPostingId: string | null;
  fromUserId: string;
  status: string;
  schoolName: string;
  subject: string;
};

/**
 * May this session see this enquiry, and from which side?
 *
 * The OPENER, always. On the school side: admins and the principal always,
 * and a TEACHER only while they are the named contact the thread belongs to
 * — the admissions contact for an ADMISSION thread, the posting's hiring
 * contact for a JOB one.
 */
async function accessSide(
  ctx: ActiveContext,
  enquiry: EnquiryRow,
): Promise<"opener" | "school" | null> {
  if (enquiry.fromUserId === ctx.user.id) return "opener";
  if (ctx.schoolId !== enquiry.schoolId || !ctx.membershipId) return null;
  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") return "school";
  if (ctx.role !== "TEACHER") return null;

  if (enquiry.kind === "ADMISSION") {
    const school = await db.school.findFirst({
      where: { id: enquiry.schoolId, admissionsContactMembershipId: ctx.membershipId },
      select: { id: true },
    });
    return school ? "school" : null;
  }
  if (!enquiry.jobPostingId) return null;
  const posting = await db.jobPosting.findFirst({
    where: { id: enquiry.jobPostingId, hiringContactMembershipId: ctx.membershipId },
    select: { id: true },
  });
  return posting ? "school" : null;
}

export type EnquiryThread = {
  id: string;
  kind: string;
  status: string;
  schoolId: string;
  schoolName: string;
  subject: string;
  side: "opener" | "school";
  fromName: string;
  createdAt: Date;
  /** Whether the target still accepts NEW enquiries — shown when closed. */
  messages: { id: string; body: string; mine: boolean; authorName: string; createdAt: Date }[];
};

export async function readEnquiry(ctx: ActiveContext, enquiryId: string): Promise<EnquiryThread> {
  const enquiry = await db.enquiry.findFirst({
    where: { id: enquiryId },
    select: {
      id: true,
      schoolId: true,
      kind: true,
      jobPostingId: true,
      fromUserId: true,
      status: true,
      schoolName: true,
      subject: true,
      createdAt: true,
      fromUser: { select: { name: true, preferredName: true } },
      messages: {
        select: {
          id: true,
          body: true,
          authorUserId: true,
          readBy: true,
          createdAt: true,
          author: { select: { name: true, preferredName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!enquiry) throw new AccessError("access.thereIsNoSuchEnquiry");
  const side = await accessSide(ctx, enquiry);
  if (!side) throw new AccessError("access.thisEnquiryIsNotYours");

  // The school side's read marker. The opener's "seen" is the notification —
  // marking a row read from their side would be a cross-tenant UPDATE.
  if (side === "school") {
    const unread = enquiry.messages.filter(
      (m) => !readJson<string[]>(m.readBy, []).includes(ctx.user.id),
    );
    await Promise.all(
      unread.map((m) =>
        db.enquiryMessage.update({
          where: { id: m.id },
          data: { readBy: writeJson([...readJson<string[]>(m.readBy, []), ctx.user.id]) },
        }),
      ),
    );
  }

  return {
    id: enquiry.id,
    kind: enquiry.kind,
    status: enquiry.status,
    schoolId: enquiry.schoolId,
    schoolName: enquiry.schoolName,
    subject: enquiry.subject,
    side,
    fromName: enquiry.fromUser.preferredName ?? enquiry.fromUser.name,
    createdAt: enquiry.createdAt,
    messages: enquiry.messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.authorUserId === ctx.user.id,
      authorName: m.author.preferredName ?? m.author.name,
      createdAt: m.createdAt,
    })),
  };
}

export async function replyToEnquiry(
  ctx: ActiveContext,
  enquiryId: string,
  body: string,
): Promise<EnquiryResult> {
  const text = body.trim().slice(0, MAX_BODY);
  if (!text) return { ok: false, errorKey: "enquiries.sayWhatYouWantToAsk" };

  const enquiry = await db.enquiry.findFirst({
    where: { id: enquiryId },
    select: {
      id: true,
      schoolId: true,
      kind: true,
      jobPostingId: true,
      fromUserId: true,
      status: true,
      schoolName: true,
      subject: true,
    },
  });
  if (!enquiry) throw new AccessError("access.thereIsNoSuchEnquiry");
  const side = await accessSide(ctx, enquiry);
  if (!side) throw new AccessError("access.thisEnquiryIsNotYours");
  if (enquiry.status !== "OPEN") return { ok: false, errorKey: "enquiries.thisThreadIsClosed" };

  await db.enquiryMessage.create({
    data: {
      schoolId: enquiry.schoolId,
      enquiryId: enquiry.id,
      authorUserId: ctx.user.id,
      body: text,
      // The writer has read their own words.
      readBy: writeJson([ctx.user.id]),
    },
  });

  if (side === "opener") {
    await announce(
      enquiry.schoolId,
      enquiry.kind as EnquiryKind,
      enquiry.jobPostingId,
      enquiry.id,
      ctx,
      enquiry.subject,
    );
  } else {
    await notify({
      userId: enquiry.fromUserId,
      schoolId: enquiry.schoolId,
      kind: "ENQUIRY",
      titleKey: "notif.enquiryReply",
      body: enquiry.subject ? `${enquiry.schoolName} — ${enquiry.subject}` : enquiry.schoolName,
      url: `/enquiries/${enquiry.id}`,
    });
  }

  return { ok: true, enquiryId: enquiry.id };
}

/** The school's act that ends a conversation, from either desk's view. */
export async function closeEnquiry(ctx: ActiveContext, enquiryId: string): Promise<EnquiryResult> {
  const enquiry = await db.enquiry.findFirst({
    where: { id: enquiryId },
    select: {
      id: true,
      schoolId: true,
      kind: true,
      jobPostingId: true,
      fromUserId: true,
      status: true,
      schoolName: true,
      subject: true,
    },
  });
  if (!enquiry) throw new AccessError("access.thereIsNoSuchEnquiry");
  const side = await accessSide(ctx, enquiry);
  if (side !== "school") throw new AccessError("access.onlyTheSchoolClosesAnEnquiry");
  if (enquiry.status !== "OPEN") return { ok: false, errorKey: "enquiries.thisThreadIsClosed" };

  await db.enquiry.update({
    where: { id: enquiry.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await audit({
    schoolId: enquiry.schoolId,
    actorUserId: ctx.user.id,
    action: "enquiry.close",
    targetType: "Enquiry",
    targetId: enquiry.id,
  });

  return { ok: true, enquiryId: enquiry.id };
}

export type EnquiryListItem = {
  id: string;
  kind: string;
  status: string;
  schoolName: string;
  subject: string;
  /** The vacancy a JOB enquiry is about, so one posting's page can list what it drew. */
  jobPostingId: string | null;
  fromName: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unread: boolean;
};

/**
 * Both sides of one person's desk: enquiries they OPENED (any role), and —
 * for staff — the school's inbox as far as their role reaches. Admins and
 * the principal see the whole inbox; a teacher sees the threads whose named
 * contact they are.
 */
export async function listEnquiries(
  ctx: ActiveContext,
): Promise<{ sent: EnquiryListItem[]; inbox: EnquiryListItem[] }> {
  const shape = (
    rows: {
      id: string;
      kind: string;
      status: string;
      schoolName: string;
      subject: string;
      jobPostingId: string | null;
      fromUser: { name: string; preferredName: string | null };
      createdAt: Date;
      messages: { body: string; authorUserId: string; readBy: string; createdAt: Date }[];
    }[],
    side: "opener" | "school",
  ): EnquiryListItem[] =>
    rows
      .map((e) => {
        const last = e.messages[0];
        return {
          id: e.id,
          kind: e.kind,
          status: e.status,
          schoolName: e.schoolName,
          subject: e.subject,
          jobPostingId: e.jobPostingId,
          fromName: e.fromUser.preferredName ?? e.fromUser.name,
          lastMessageAt: last?.createdAt ?? e.createdAt,
          lastMessagePreview: last?.body.slice(0, 140) ?? "",
          unread:
            side === "school"
              ? Boolean(last && !readJson<string[]>(last.readBy, []).includes(ctx.user.id))
              : // The opener's unread: the school spoke last and the opener
                // has no read marker — the notification is their marker, so
                // "the other side spoke last" is the honest signal.
                Boolean(last && last.authorUserId !== ctx.user.id),
        };
      })
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  const messageSelect = {
    select: { body: true, authorUserId: true, readBy: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  };
  const rowSelect = {
    id: true,
    kind: true,
    status: true,
    schoolName: true,
    subject: true,
    jobPostingId: true,
    createdAt: true,
    fromUser: { select: { name: true, preferredName: true } },
    messages: messageSelect,
  };

  const sentRows = await db.enquiry.findMany({
    where: { fromUserId: ctx.user.id },
    select: rowSelect,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  let inboxRows: typeof sentRows = [];
  if (ctx.schoolId && ctx.membershipId) {
    if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") {
      inboxRows = await db.enquiry.findMany({
        where: { schoolId: ctx.schoolId },
        select: rowSelect,
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    } else if (ctx.role === "TEACHER") {
      const school = await db.school.findFirst({
        where: { id: ctx.schoolId, admissionsContactMembershipId: ctx.membershipId },
        select: { id: true },
      });
      inboxRows = await db.enquiry.findMany({
        where: {
          schoolId: ctx.schoolId,
          OR: [
            ...(school ? [{ kind: "ADMISSION" }] : []),
            { jobPosting: { hiringContactMembershipId: ctx.membershipId } },
          ],
        },
        select: rowSelect,
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    }
  }

  return { sent: shape(sentRows, "opener"), inbox: shape(inboxRows, "school") };
}

/**
 * The opener's existing open thread on one question, so a profile or vacancy
 * page can offer "open the conversation" instead of a second composer.
 */
export async function findMyOpenEnquiry(
  ctx: ActiveContext,
  schoolId: string,
  kind: EnquiryKind,
  jobPostingId: string | null,
): Promise<string | null> {
  const existing = await db.enquiry.findFirst({
    where: { schoolId, kind, jobPostingId, fromUserId: ctx.user.id, status: "OPEN" },
    select: { id: true },
  });
  return existing?.id ?? null;
}

/** Does this person have any enquiries at all? Drives the nav entry. */
export async function anyEnquiries(ctx: ActiveContext): Promise<boolean> {
  const sent = await db.enquiry.findFirst({
    where: { fromUserId: ctx.user.id },
    select: { id: true },
  });
  if (sent) return true;
  if (!ctx.schoolId || !ctx.membershipId) return false;
  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") {
    return Boolean(
      await db.enquiry.findFirst({ where: { schoolId: ctx.schoolId }, select: { id: true } }),
    );
  }
  if (ctx.role !== "TEACHER") return false;
  const named = await db.enquiry.findFirst({
    where: {
      schoolId: ctx.schoolId,
      OR: [
        {
          kind: "ADMISSION",
          school: { admissionsContactMembershipId: ctx.membershipId },
        },
        { jobPosting: { hiringContactMembershipId: ctx.membershipId } },
      ],
    },
    select: { id: true },
  });
  return Boolean(named);
}
