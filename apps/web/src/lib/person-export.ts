import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { forSchool } from "./tenant-context";
import { listContexts, type ActiveContext } from "./session";
import { childHeader, selectChild, studentProfile } from "./api-reads/family";
import { feesFamilyRead } from "./api-reads/fees";
import { getAttendanceSummary } from "./attendance";
import { examMarksFor } from "./exams";
import { childWork, getStudentWork } from "./grading";
import { cardsForChild, getCard, myCards } from "./report-cards";
import { getThread, listThreads } from "./remarks";
import { getConversation, listConversations } from "./conversations";
import { healthCardFor } from "./health";
import { familyIncidents } from "./incidents";
import { pupilRecordFor } from "./pupil-records";
import { familySessions } from "./gig-sessions";
import { fileToken } from "./marks-export";
import { maySelfRead } from "./self-read";
import { pupilFees } from "./fees-family";
import { familyCertificates } from "./certificates";
import { familyRequests } from "./certificate-requests";

/**
 * A person's own data as one document — the DPDP Act's section 11, the
 * right to know what is held. A pupil takes their own; a guardian takes one
 * child's per call, because two children are two people and the file is
 * named for one.
 *
 * NOTHING HERE IS A NEW READ. Every section is the function the family's
 * own endpoint calls for the same page, with the same gate — a guardian's
 * child re-checked through the guardianship, a pupil's own membership from
 * the session — so the document says exactly what the pages say and no more:
 * the parent's copy of a hand-in carries no essay (childWork never did), the
 * pupil's carries a health card only from the age their school lets them read
 * it (an adult at a college always), and a file is its id and name, never the
 * bytes. The export is audited, once, because it is the one door that hands
 * a child's whole record out at a time.
 */
export type Reader = ActiveContext & { role: "STUDENT" | "PARENT" };

export type PersonExport = {
  format: "relay-person-export";
  version: 1;
  exportedAt: string;
  exportedBy: { userId: string; role: "STUDENT" | "PARENT" };
  subject: { studentMembershipId: string; name: string; schoolId: string; schoolName: string };
  /** Which sections the document carries; the parent-only ones are absent from a pupil's. */
  sections: string[];
  [section: string]: unknown;
};

export type PersonExportFile = { filename: string; document: PersonExport };

type Subject = { studentMembershipId: string; userId: string; name: string; schoolId: string; schoolName: string; profile: unknown };

/** Whose data, and the school it sits in, by the same rule as every family page. */
async function subjectOf(ctx: Reader, studentMembershipId?: string | null): Promise<Subject> {
  if (ctx.role === "STUDENT") {
    const self = ctx as ActiveContext & { role: "STUDENT"; schoolId: string; membershipId: string };
    const m = await db.membership.findUniqueOrThrow({ where: { id: self.membershipId }, select: { userId: true, schoolId: true, school: { select: { name: true } }, user: { select: { name: true, preferredName: true } } } });
    return { studentMembershipId: self.membershipId, userId: m.userId, name: m.user.preferredName ?? m.user.name, schoolId: m.schoolId, schoolName: m.school.name, profile: await studentProfile(self) };
  }
  // selectChild is where the guardian's claim is checked: another family's child is not found; no child named means the first.
  const { selectedId, link } = await selectChild(ctx, studentMembershipId ?? undefined);
  return { studentMembershipId: selectedId, userId: link.student.user.id, name: link.student.user.preferredName ?? link.student.user.name, schoolId: link.student.school.id, schoolName: link.student.school.name, profile: childHeader(selectedId, link) };
}

/** A section that may be empty rather than missing: a page that shows nothing still shows. */
async function section<T>(work: () => Promise<T>): Promise<T | { unavailable: true }> {
  try {
    return await work();
  } catch {
    // A page that refuses this reader today (a feature the school has not switched on) leaves a marker, not a hole.
    return { unavailable: true };
  }
}

export async function personExport(ctx: Reader, studentMembershipId?: string | null): Promise<PersonExportFile> {
  const subject = await subjectOf(ctx, studentMembershipId);
  const id = subject.studentMembershipId;

  const document: PersonExport = {
    format: "relay-person-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: { userId: ctx.user.id, role: ctx.role },
    subject: { studentMembershipId: id, name: subject.name, schoolId: subject.schoolId, schoolName: subject.schoolName },
    sections: [],
  };
  const put = (name: string, value: unknown) => {
    document[name] = value;
    document.sections.push(name);
  };

  // ---- what both a pupil and a guardian read ------------------------------
  put("profile", subject.profile);
  put("record", await section(() => pupilRecordFor(ctx, id)));
  put("memberships", (await listContexts(subject.userId)).memberships);
  put("attendance", (await getAttendanceSummary(subject.schoolId, id, "0000-01-01", "9999-12-31")).days);
  put("marks", (await examMarksFor(ctx)).filter((m) => m.studentMembershipId === id));
  const cardRows = ctx.role === "STUDENT" ? await myCards(ctx) : (await cardsForChild(ctx, id)).filter((c) => c.status === "PUBLISHED");
  const cards = [];
  for (const row of cardRows) {
    const card = await getCard(ctx, row.id);
    if (card) cards.push(card);
  }
  put("reportCards", cards);
  put("assignments", ctx.role === "STUDENT" ? await getStudentWork(ctx) : await childWork(ctx.user.id, id));
  const threads = (await listThreads(ctx)).filter((t) => t.studentMembershipId === id);
  put("remarks", await Promise.all(threads.map((t) => getThread(ctx, t.id))));
  const rooms = (await listConversations(ctx)).filter((c) => c.schoolId === subject.schoolId);
  put("conversations", await Promise.all(rooms.map((c) => getConversation(ctx, c.id))));
  put(
    "consents",
    await forSchool(subject.schoolId, () =>
      db.competitionEntry.findMany({
        where: { studentMembershipId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, rank: true, parentConsentAt: true, createdAt: true, competition: { select: { title: true, organizerName: true } } },
      }),
    ),
  );
  put("sessions", await section(async () => (await familySessions(ctx)).children.find((c) => c.id === id)?.bookings ?? []));

  // ---- the health card, incidents and fees: a guardian's pages, and the pupil's own where the school lets them read
  // them (TA-110): health and incidents from the self-read age (an adult at a college always), fees while the
  // school shows a pupil of their age their dues — the same gates as /student/health, /incidents and /fees.
  if (ctx.role === "PARENT") {
    put("health", await section(() => healthCardFor(ctx, id)));
    put("incidents", await section(async () => (await familyIncidents(ctx, id)).incidents));
    put("fees", await section(async () => (await feesFamilyRead(ctx, id)).child));
  } else {
    if (await maySelfRead(ctx, id)) {
      put("health", await section(() => healthCardFor(ctx, id)));
      put("incidents", await section(async () => (await familyIncidents(ctx, id)).incidents));
    }
    const fees = await pupilFees(ctx);
    if (fees.allowed) put("fees", fees);
  }
  // ---- the papers issued and the papers asked for, for either reader (an adult's guardian is refused the export).
  put("certificates", (await familyCertificates(ctx)).items.filter((c) => c.studentMembershipId === id));
  put("certificateRequests", await section(async () => (await familyRequests(ctx, ctx.role === "PARENT" ? id : undefined)).items));

  await audit({
    schoolId: subject.schoolId,
    actorUserId: ctx.user.id,
    action: "family.export",
    targetType: "Membership",
    targetId: id,
    meta: { role: ctx.role, sections: document.sections },
  });

  const date = document.exportedAt.slice(0, 10);
  return { filename: `relay-export-${fileToken(subject.name)}-${date}.json`, document };
}

/** Documents a person may take in an hour: one is a whole record, and five is a family checking it twice. */
export const PERSON_EXPORT_BUDGET = { limit: 5, windowMs: 60 * 60 * 1000 };
