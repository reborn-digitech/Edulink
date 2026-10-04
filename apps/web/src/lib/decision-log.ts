import "server-only";
import type { Prisma } from "@prisma/client";
import { DECISION_KINDS, type DecisionEntry, type DecisionKind, type Decisions, type DecisionsQuery } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";
import { readJson } from "./json";
import { addDaysToKey, formatDateKey, isDateKey, zonedStartOfDay } from "./dates";
import { translator, type Translate, type TranslationKey } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";

/**
 * The head's decision log.
 *
 * NOTHING IS WRITTEN HERE. Every decision a head makes — leave, a PEN change,
 * a record change, a certificate, a join, an admission offer — already writes
 * an append-only audit row at the moment it is made (audit.ts). This file
 * reads those rows back for the person who made them and turns each into one
 * sentence: "Approved Asha Patil's leave, 3–5 Oct, cover: R. Desai". A second
 * table of decisions would be a stored copy with two writers; the audit row
 * is the record, and this is a view of it.
 *
 * WHOSE ROWS. A PRINCIPAL reads their own: `actorUserId` is theirs. An ADMIN
 * reads the head's — every active principal's rows at the school — and
 * never their own, so the office's log is of the head's decisions, as the
 * page says. A join is the one action written with the PUPIL as its actor
 * (the row is about their membership) and the decider under `approvedBy` in
 * the meta, so joins are matched on that instead.
 *
 * ONE QUERY PER TARGET TYPE, never one per row: a page of thirty rows
 * touching six kinds of target is at most eight queries, however long the
 * page. A target that has since gone (a withdrawn application, a deleted
 * class) still gets its sentence, with "a person no longer on record" where
 * the name would be.
 */

/** The audit actions each kind lists. A new decision joins the log by being named here. */
export const DECISION_ACTIONS: Record<DecisionKind, readonly string[]> = {
  leave: ["leave.approve", "leave.decline"],
  pen: ["pen.decide"],
  record: ["pupilRecord.change.apply", "pupilRecord.change.decline"],
  certificate: ["certificate.issue", "certificate.requestDecline", "paper.sign", "paper.sign.decline"],
  join: ["student.join", "student.join.decline"],
  admission: ["admissions.offer", "admissions.decide", "admissions.admit", "college.admissions.supernumerary"],
  // The college (4 Oct 2026): the principal's word on what the regulations reserve for the head.
  grace: ["exam.grace.approve", "exam.grace.refuse"],
  condonation: ["academics.condonation.approve", "academics.condonation.refuse"],
  concession: ["college.fees.concessionApprove", "college.fees.concessionRefuse"],
  lateRegistration: ["academics.late.approve", "academics.late.refuse"],
};

const KIND_OF_ACTION = new Map<string, DecisionKind>(
  DECISION_KINDS.flatMap((kind) => DECISION_ACTIONS[kind].map((action) => [action, kind] as const)),
);

const DECLINES = new Set(["leave.decline", "pupilRecord.change.decline", "certificate.requestDecline", "paper.sign.decline", "student.join.decline", "exam.grace.refuse", "academics.condonation.refuse", "college.fees.concessionRefuse", "academics.late.refuse"]);

type Row = { id: string; action: string; targetType: string | null; targetId: string | null; meta: string; createdAt: Date };

const CURSOR = /^c[a-z0-9]{20,}$/;

/** The rows the log reads for this caller: the head's own, or for the office every head's. */
async function actorsFor(ctx: ActiveContext): Promise<{ userIds: string[]; own: boolean }> {
  if (ctx.role === "PRINCIPAL") return { userIds: [ctx.user.id], own: true };
  if (ctx.role === "ADMIN" && ctx.schoolId) {
    const heads = await db.membership.findMany({
      where: { schoolId: ctx.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null },
      select: { userId: true },
    });
    return { userIds: heads.map((h) => h.userId), own: false };
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

function whereFor(schoolId: string, userIds: string[], query: DecisionsQuery, timezone: string): Prisma.AuditLogWhereInput {
  const kinds: DecisionKind[] = query.kind ? [query.kind] : [...DECISION_KINDS];
  const actions = kinds.flatMap((k) => [...DECISION_ACTIONS[k]]);
  const joinsIncluded = actions.includes("student.join");
  const createdAt: Prisma.DateTimeFilter = {};
  if (query.from && isDateKey(query.from)) createdAt.gte = zonedStartOfDay(query.from, timezone);
  if (query.to && isDateKey(query.to)) createdAt.lt = zonedStartOfDay(addDaysToKey(query.to, 1), timezone);
  return {
    schoolId,
    action: { in: actions },
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    OR: [
      { actorUserId: { in: userIds } },
      // A join's actor is the pupil; the decider is in the meta (join-requests.ts).
      ...(joinsIncluded ? userIds.map((id) => ({ action: "student.join", meta: { contains: `"approvedBy":"${id}"` } })) : []),
    ],
  };
}

export async function listDecisions(ctx: ActiveContext, query: DecisionsQuery): Promise<Decisions> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  const { userIds, own } = await actorsFor(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const t = translator(normaliseLocale(ctx.user.prefs?.locale));
  const locale = normaliseLocale(ctx.user.prefs?.locale);

  if (userIds.length === 0) return { items: [], nextCursor: null, total: 0, own };

  const where = whereFor(ctx.schoolId, userIds, query, school.timezone);
  const cursor = query.cursor && CURSOR.test(query.cursor) ? { id: query.cursor } : undefined;
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(cursor ? { cursor, skip: 1 } : {}),
      select: { id: true, action: true, targetType: true, targetId: true, meta: true, createdAt: true },
    }),
    db.auditLog.count({ where }),
  ]);
  const page = rows.slice(0, query.limit);
  const nextCursor = rows.length > query.limit ? page[page.length - 1]!.id : null;
  const sentences = await resolveSentences(ctx.schoolId, page, t, locale);
  const items: DecisionEntry[] = page.map((row) => ({
    id: row.id,
    at: row.createdAt.toISOString(),
    kind: KIND_OF_ACTION.get(row.action) ?? "leave",
    action: row.action,
    approved: approvedBy(row),
    sentence: sentences.get(row.id) ?? row.action,
  }));
  return { items, nextCursor, total, own };
}

function approvedBy(row: Row): boolean {
  if (DECLINES.has(row.action)) return false;
  const meta = readJson<Record<string, unknown>>(row.meta, {});
  if (row.action === "pen.decide") return meta.approved === true;
  if (row.action === "admissions.decide") return meta.to !== "DECLINED";
  return true;
}

const personName = (u: { name: string; preferredName: string | null } | null | undefined, t: Translate) => u?.preferredName ?? u?.name ?? t("decisions.someone");

const CERT_KIND_KEY: Record<string, TranslationKey> = {
  TC: "certificates.kindTc",
  NIRGAM: "certificates.kindNirgam",
  BONAFIDE: "certificates.kindBonafide",
  CHARACTER: "certificates.kindCharacter",
  STUDY: "certificates.kindStudy",
  CUSTOM: "certificates.kindCustom",
};
const APPLICATION_STATUS_KEY: Record<string, TranslationKey> = {
  SUBMITTED: "admissions.statusSubmitted",
  OFFERED: "admissions.statusOffered",
  ACCEPTED: "admissions.statusAccepted",
  ADMITTED: "admissions.statusAdmitted",
  DECLINED: "admissions.statusDeclined",
  WAITLISTED: "admissions.statusWaitlisted",
  WITHDRAWN: "admissions.statusWithdrawn",
};

/**
 * Every name a page of rows needs, in one query per target type, then the
 * sentence per row. The ids are collected first so that a page naming the
 * same teacher ten times reads her once.
 */
async function resolveSentences(schoolId: string, rows: Row[], t: Translate, locale: string): Promise<Map<string, string>> {
  const ids = (type: string, actions?: readonly string[]) =>
    [...new Set(rows.filter((r) => r.targetType === type && r.targetId && (!actions || actions.includes(r.action))).map((r) => r.targetId!))];
  const metaOf = (row: Row) => readJson<Record<string, unknown>>(row.meta, {});

  const leaveIds = ids("LeaveRequest");
  const penIds = ids("PenChangeRequest");
  const membershipIds = ids("Membership");
  const certificateIds = [...new Set([...ids("IssuedCertificate"), ...ids("CERTIFICATE")])];
  const certificateRequestIds = ids("CertificateRequest");
  const joinRequestIds = ids("JoinRequest");
  const applicationIds = ids("Application");
  const cardSetIds = ids("REPORT_CARD_SET");
  const classIds = [...new Set(cardSetIds.map((id) => id.slice(0, id.indexOf("|"))).filter(Boolean))];
  const graceIds = ids("ExamGrace");
  const condonationIds = ids("AttendanceCondonation");
  const concessionIds = ids("FeeConcession");
  const lateIds = ids("LateRegistration");
  const collegeApplicationIds = ids("CollegeApplication");
  const studentOf = { select: { user: { select: { name: true, preferredName: true } } } } as const;
  // The college's four (4 Oct 2026): one query per target type, as above.
  const [graces, condonations, concessions, lates] = await Promise.all([
    graceIds.length ? db.examGrace.findMany({ where: { id: { in: graceIds }, schoolId }, select: { id: true, courseId: true, graceMilli: true, student: studentOf } }) : [],
    condonationIds.length ? db.attendanceCondonation.findMany({ where: { id: { in: condonationIds }, schoolId }, select: { id: true, student: studentOf } }) : [],
    concessionIds.length ? db.feeConcession.findMany({ where: { id: { in: concessionIds }, schoolId }, select: { id: true, student: studentOf } }) : [],
    lateIds.length ? db.lateRegistration.findMany({ where: { id: { in: lateIds }, schoolId }, select: { id: true, student: studentOf } }) : [],
  ]);
  const graceCourses = graces.length ? new Map((await db.course.findMany({ where: { id: { in: [...new Set(graces.map((g) => g.courseId))] }, schoolId }, select: { id: true, code: true } })).map((c) => [c.id, c.code])) : new Map<string, string>();
  const graceById = new Map(graces.map((g) => [g.id, g]));
  const studentNameOf = new Map<string, string>([...condonations, ...concessions, ...lates].map((r) => [r.id, personName(r.student.user, t)]));
  const collegeApplicantOf = new Map(
    (collegeApplicationIds.length ? await db.collegeApplication.findMany({ where: { id: { in: collegeApplicationIds }, schoolId }, select: { id: true, applicantName: true } }) : []).map((a) => [a.id, a.applicantName]),
  );

  const [leaves, covers, pens, memberships, certificates, certificateRequests, joins, applications, classes] = await Promise.all([
    leaveIds.length
      ? db.leaveRequest.findMany({ where: { id: { in: leaveIds }, schoolId }, select: { id: true, fromDateKey: true, toDateKey: true, teacher: { select: { user: { select: { name: true, preferredName: true } } } } } })
      : [],
    leaveIds.length
      ? db.attendanceCover.findMany({ where: { leaveRequestId: { in: leaveIds }, schoolId }, select: { leaveRequestId: true, covering: { select: { user: { select: { name: true, preferredName: true } } } } } })
      : [],
    penIds.length
      ? db.penChangeRequest.findMany({ where: { id: { in: penIds }, schoolId }, select: { id: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } })
      : [],
    membershipIds.length
      ? db.membership.findMany({ where: { id: { in: membershipIds }, schoolId }, select: { id: true, user: { select: { name: true, preferredName: true } } } })
      : [],
    certificateIds.length
      ? db.issuedCertificate.findMany({ where: { id: { in: certificateIds }, schoolId }, select: { id: true, kind: true, serial: true, studentName: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } })
      : [],
    certificateRequestIds.length
      ? db.certificateRequest.findMany({ where: { id: { in: certificateRequestIds }, schoolId }, select: { id: true, kind: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } })
      : [],
    joinRequestIds.length
      ? db.joinRequest.findMany({ where: { id: { in: joinRequestIds }, schoolId }, select: { id: true, user: { select: { name: true, preferredName: true } } } })
      : [],
    applicationIds.length
      ? db.application.findMany({ where: { id: { in: applicationIds }, schoolId }, select: { id: true, childName: true } })
      : [],
    classIds.length ? db.class.findMany({ where: { id: { in: classIds }, schoolId }, select: { id: true, name: true } }) : [],
  ]);

  const leaveById = new Map(leaves.map((l) => [l.id, l]));
  const coversByLeave = new Map<string, string[]>();
  for (const c of covers) {
    if (!c.leaveRequestId) continue;
    const list = coversByLeave.get(c.leaveRequestId) ?? [];
    const name = personName(c.covering.user, t);
    if (!list.includes(name)) list.push(name);
    coversByLeave.set(c.leaveRequestId, list);
  }
  const penById = new Map(pens.map((p) => [p.id, p]));
  const membershipById = new Map(memberships.map((m) => [m.id, m]));
  const certificateById = new Map(certificates.map((c) => [c.id, c]));
  const certificateRequestById = new Map(certificateRequests.map((c) => [c.id, c]));
  const joinById = new Map(joins.map((j) => [j.id, j]));
  const applicationById = new Map(applications.map((a) => [a.id, a]));
  const classById = new Map(classes.map((c) => [c.id, c.name]));

  const dates = (from: string, to: string) => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return from === to ? formatDateKey(from, opts, locale) : `${formatDateKey(from, opts, locale)}–${formatDateKey(to, opts, locale)}`;
  };
  const certKind = (kind: string) => t(CERT_KIND_KEY[kind] ?? "certificates.kindCustom");

  const out = new Map<string, string>();
  for (const row of rows) {
    const meta = metaOf(row);
    const id = row.targetId ?? "";
    let sentence: string;
    switch (row.action) {
      case "leave.approve":
      case "leave.decline": {
        const leave = leaveById.get(id);
        const name = personName(leave?.teacher.user, t);
        const when = leave ? dates(leave.fromDateKey, leave.toDateKey) : "";
        if (row.action === "leave.decline") sentence = t("decisions.leaveDeclined", { name, dates: when });
        else {
          const cover = coversByLeave.get(id) ?? [];
          sentence = cover.length > 0 ? t("decisions.leaveApproved", { name, dates: when, cover: cover.join(", ") }) : t("decisions.leaveApprovedNoCover", { name, dates: when });
        }
        break;
      }
      case "pen.decide": {
        const name = personName(penById.get(id)?.student.user, t);
        sentence = meta.approved === true ? t("decisions.penApproved", { name }) : t("decisions.penDeclined", { name });
        break;
      }
      case "pupilRecord.change.apply":
      case "pupilRecord.change.decline": {
        const name = personName(membershipById.get(id)?.user, t);
        const fields = Array.isArray(meta.fields) ? meta.fields.length : 0;
        sentence = row.action === "pupilRecord.change.apply" ? t("decisions.recordApplied", { name, count: fields }) : t("decisions.recordDeclined", { name });
        break;
      }
      case "certificate.issue": {
        const cert = certificateById.get(id);
        const name = cert?.studentName ?? personName(cert?.student.user, t);
        sentence = t("decisions.certificateIssued", { name, kind: certKind(cert?.kind ?? String(meta.kind ?? "CUSTOM")), serial: cert?.serial ?? String(meta.serial ?? "") });
        break;
      }
      case "certificate.requestDecline": {
        const req = certificateRequestById.get(id);
        sentence = t("decisions.certificateDeclined", { name: personName(req?.student.user, t), kind: certKind(req?.kind ?? String(meta.kind ?? "CUSTOM")) });
        break;
      }
      case "paper.sign":
      case "paper.sign.decline": {
        const signed = row.action === "paper.sign";
        if (row.targetType === "REPORT_CARD_SET") {
          const at = id.indexOf("|");
          const className = classById.get(id.slice(0, at)) ?? t("decisions.someone");
          const title = id.slice(at + 1);
          sentence = signed ? t("decisions.paperSignedCards", { title, className }) : t("decisions.paperDeclinedCards", { title, className });
        } else {
          const cert = certificateById.get(id);
          if (!cert) sentence = signed ? t("decisions.paperSignedCertificateGone") : t("decisions.paperDeclinedCertificateGone");
          else {
            const name = cert.studentName ?? personName(cert.student.user, t);
            sentence = signed ? t("decisions.paperSignedCertificate", { name }) : t("decisions.paperDeclinedCertificate", { name });
          }
        }
        break;
      }
      case "student.join": {
        sentence = t("decisions.joinApproved", { name: personName(membershipById.get(id)?.user, t) });
        break;
      }
      case "student.join.decline": {
        sentence = t("decisions.joinDeclined", { name: personName(joinById.get(id)?.user, t) });
        break;
      }
      case "admissions.offer":
      case "admissions.decide":
      case "admissions.admit": {
        const name = applicationById.get(id)?.childName ?? t("decisions.someone");
        if (row.action === "admissions.offer") sentence = t("decisions.admissionOffered", { name });
        else if (row.action === "admissions.admit") sentence = t("decisions.admissionAdmitted", { name });
        else sentence = t("decisions.admissionDecided", { name, status: t(APPLICATION_STATUS_KEY[String(meta.to)] ?? "admissions.statusSubmitted") });
        break;
      }
      case "exam.grace.approve":
      case "exam.grace.refuse": {
        const g = graceById.get(id);
        const vars = { name: personName(g?.student.user, t), course: (g && graceCourses.get(g.courseId)) ?? "—", marks: g ? g.graceMilli / 1000 : Number(meta.graceMilli ?? 0) / 1000 };
        sentence = row.action === "exam.grace.approve" ? t("decisions.graceApproved", vars) : t("decisions.graceRefused", vars);
        break;
      }
      case "academics.condonation.approve":
      case "academics.condonation.refuse": {
        const name = studentNameOf.get(id) ?? t("decisions.someone");
        sentence = row.action === "academics.condonation.approve" ? t("decisions.condonationApproved", { name }) : t("decisions.condonationRefused", { name });
        break;
      }
      case "college.fees.concessionApprove":
      case "college.fees.concessionRefuse": {
        const name = studentNameOf.get(id) ?? t("decisions.someone");
        sentence = row.action === "college.fees.concessionApprove" ? t("decisions.concessionApproved", { name }) : t("decisions.concessionRefused", { name });
        break;
      }
      case "college.admissions.supernumerary": {
        sentence = t("decisions.supernumeraryApproved", { name: collegeApplicantOf.get(id) ?? t("decisions.someone") });
        break;
      }
      case "academics.late.approve":
      case "academics.late.refuse": {
        const name = studentNameOf.get(id) ?? t("decisions.someone");
        sentence = row.action === "academics.late.approve" ? t("decisions.lateRegistrationApproved", { name }) : t("decisions.lateRegistrationRefused", { name });
        break;
      }
      default:
        sentence = row.action;
    }
    out.set(row.id, sentence);
  }
  return out;
}
