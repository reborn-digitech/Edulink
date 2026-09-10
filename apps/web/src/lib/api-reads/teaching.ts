import "server-only";
import type { TeachingGradebook, TeachingRemarkPeople, TeachingReportCards } from "@edulink/contracts";
import { db } from "@/lib/db";
import type { ActiveContext } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { getGradebook } from "@/lib/grading";
import { readAttachments } from "@/lib/files";
import type { Attachment } from "@/lib/json";
import { assessmentsFor, assertMayWriteCards, cardsForClass } from "@/lib/report-cards";
import { currentTerms } from "@/lib/terms";
import { nameCarriesSection } from "@/lib/class-names";
import { studentsForTeacher, teachersForStudent } from "@/lib/remarks";

/**
 * The /api/v1/teaching reads: the same src/lib calls the web's pages make,
 * shaped for the phone. Rules stay where the suites prove them — grading.ts,
 * report-cards.ts, remarks.ts; this file only reads what a page would read.
 */

type Staff = ActiveContext & { schoolId: string; membershipId: string; role: "TEACHER" | "ADMIN" | "PRINCIPAL" };

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/**
 * A page that refuses somebody answers 404 — "a screen somebody may not use
 * should not confirm that it exists" (the report-card page's catch, and the
 * gradebook page's). The sentence is kept; only the status changes.
 */
async function orNotFound<T>(work: Promise<T>): Promise<T> {
  try {
    return await work;
  } catch (error) {
    if (error instanceof AccessError && error.code === "FORBIDDEN") throw new AccessError(error.key, "NOT_FOUND", error.vars);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* The gradebook                                                               */
/* -------------------------------------------------------------------------- */

/**
 * /teacher/assignments/[assignmentId]: `getGradebook`, and beside each row the
 * work the pupil handed in — the page's marking is done with the work open in
 * another tab; on a phone it has to sit on the same card. A draft hand-in (not
 * yet submitted) is the pupil's, not the teacher's, so only handed-in work shows.
 */
export async function teachingGradebook(ctx: Staff & { role: "TEACHER" | "ADMIN" }, assignmentId: string): Promise<TeachingGradebook> {
  const book = await orNotFound(getGradebook(ctx, assignmentId));
  const submissions = await db.submission.findMany({
    where: { assignmentId: book.assignment.id, submittedAt: { not: null } },
    select: { studentMembershipId: true, body: true, attachments: true },
  });
  const workBy = new Map(submissions.map((s) => [s.studentMembershipId, { body: s.body, attachments: readAttachments(s.attachments) }]));
  const a = book.assignment;
  return {
    assignment: {
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      pointsMilli: a.pointsMilli,
      dueAt: iso(a.dueAt),
      publishedAt: iso(a.publishedAt),
      classId: a.classId,
      className: a.className,
      attachments: a.attachments,
    },
    rows: book.rows.map((row) => ({
      membershipId: row.membershipId,
      name: row.name,
      fullName: row.fullName,
      avatarKey: row.avatarKey,
      submittedAt: iso(row.submittedAt),
      submissionStatus: row.submissionStatus,
      late: row.late,
      scoreMilli: row.scoreMilli,
      letter: row.letter,
      comment: row.comment,
      gradedAt: iso(row.gradedAt),
      work: row.submittedAt ? (workBy.get(row.membershipId) ?? { body: "", attachments: [] }) : null,
    })),
    stats: book.stats,
  };
}

/* -------------------------------------------------------------------------- */
/* Handouts from the phone                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The web stores a handout's bytes in the same request that creates the
 * assignment; the phone uploads first and names the id. An id that was merely
 * seen must not become an attachment — files.ts would then grant the class
 * access to it — so every one must be a ticket THIS person holds, unspent (the
 * bulletin's rule). Size and type are the sniffed ones on the ticket, never
 * the caller's word; the name is display only.
 */
export async function ticketedHandouts(userId: string, handouts: { fileId: string; name: string }[]): Promise<Attachment[]> {
  if (handouts.length === 0) return [];
  const ids = [...new Set(handouts.map((h) => h.fileId))];
  const tickets = await db.uploadTicket.findMany({ where: { fileId: { in: ids }, userId, consumedAt: null }, select: { fileId: true, mime: true, size: true } });
  if (tickets.length !== ids.length || ids.length !== handouts.length) throw new AccessError("access.fileNotYours", "NOT_FOUND");
  const byId = new Map(tickets.map((t) => [t.fileId, t]));
  return handouts.map((h) => {
    const ticket = byId.get(h.fileId)!;
    return { fileId: h.fileId, name: h.name.slice(0, 200).replace(/[\r\n]/g, ""), size: ticket.size, mime: ticket.mime };
  });
}

/** Spent once: a ticket attached to one record cannot attach the same file to another. */
export async function spendTickets(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;
  await db.uploadTicket.updateMany({ where: { fileId: { in: fileIds } }, data: { consumedAt: new Date() } });
}

/* -------------------------------------------------------------------------- */
/* The report-card builder                                                     */
/* -------------------------------------------------------------------------- */

/** /teacher/classes/[classId]/report-cards: the papers, the terms, the titles built so far and the cards under one. */
export async function teachingReportCards(ctx: Staff, classId: string, title?: string): Promise<TeachingReportCards> {
  const klass = await orNotFound(assertMayWriteCards(ctx, classId));
  const [assessments, all, terms] = await Promise.all([assessmentsFor(ctx, classId), cardsForClass(ctx, classId), currentTerms(ctx.schoolId)]);
  const titles = [...new Set(all.map((c) => c.title))];
  const selected = title && titles.includes(title) ? title : (titles[0] ?? null);
  const cards = selected ? all.filter((c) => c.title === selected) : [];
  const heading = [klass.name, klass.section && !nameCarriesSection(klass.name, klass.section) ? `Section ${klass.section}` : null].filter(Boolean).join(" · ");
  return {
    class: { id: klass.id, name: klass.name, heading },
    assessments: assessments.map((a) => ({
      assignmentId: a.assignmentId,
      title: a.title,
      category: a.category,
      subject: a.subject,
      seriesId: a.seriesId,
      seriesName: a.seriesName,
      seriesKind: a.seriesKind,
      termId: a.termId,
      gradedCount: a.gradedCount,
      classSize: a.classSize,
    })),
    terms: terms.map((x) => ({ id: x.id, name: x.name, current: x.current })),
    titles,
    selectedTitle: selected,
    cards: cards.map((card) => ({
      id: card.id,
      title: card.title,
      status: card.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      remark: card.remark,
      overallPercentMilli: card.overallPercentMilli,
      attendancePresent: card.attendancePresent,
      attendanceTotal: card.attendanceTotal,
      studentName: card.student.user.preferredName ?? card.student.user.name,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Writing about a pupil                                                       */
/* -------------------------------------------------------------------------- */

/**
 * /remarks/new, for the three roles that may open a thread: a teacher picks a
 * pupil from the classes they teach; a pupil picks one of their teachers; a
 * guardian picks a child, then one of that child's teachers. The page's own
 * reads, in the page's order.
 */
export async function remarkPeople(ctx: ActiveContext): Promise<TeachingRemarkPeople> {
  if (ctx.role === "TEACHER") {
    if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");
    const students = await studentsForTeacher(ctx.schoolId, ctx.membershipId);
    return { role: "TEACHER", selfOnly: false, students, pupils: [] };
  }
  if (ctx.role === "STUDENT") {
    if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");
    const teachers = await teachersForStudent(ctx.schoolId, ctx.membershipId);
    return { role: "STUDENT", selfOnly: true, students: [], pupils: [{ membershipId: ctx.membershipId, name: "", teachers }] };
  }
  if (ctx.role === "PARENT") {
    const links = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: { studentMembershipId: true, studentSchoolId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
    });
    const pupils = await Promise.all(
      links.map(async (link) => ({
        membershipId: link.studentMembershipId,
        name: link.student.user.preferredName ?? link.student.user.name,
        teachers: await teachersForStudent(link.studentSchoolId, link.studentMembershipId),
      })),
    );
    return { role: "PARENT", selfOnly: false, students: [], pupils };
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

/** The three roles the compose page admits; everyone else is refused before a body is read. */
export function assertMayStartThread(ctx: ActiveContext): void {
  if (ctx.role !== "TEACHER" && ctx.role !== "STUDENT" && ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
}
