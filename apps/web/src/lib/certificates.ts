import "server-only";
import { randomBytes } from "node:crypto";
import type { CertificateIssueInput, CertificateKind, CertificateLayout, CertificateRow, CertificateTemplateSave, CertificateTemplatesView, IssuedCertificateView } from "./certificate-types";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { audit } from "./audit";
import { notifyGuardians } from "./notify";
import { stayAttendance } from "./school-record";
import { markRequestIssued, requestPurpose } from "./certificate-requests";
import { ageInYears, dateKeyInZone, todayKey } from "./dates";
import { allPresets, BLANK, dataFor, fill, fillRows, parseLayout, parseRows, placeholderKeys, PLACEHOLDER_KEYS, wordsFor, type PupilFacts } from "./certificate-rules";
import type { WordsLocale } from "./words";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { normaliseLocale } from "@edulink/i18n";
import { paperSignatures, signOnIssue } from "./signatures";
import { translator, type TranslationKey } from "./i18n/dictionary";

/**
 * Certificates: the office designs a template once and issues it many times.
 *
 * A TEMPLATE is wording — a heading, an opening, numbered rows of label and
 * placeholder, a closing — in the language the document is written in, with
 * a layout and a serial prefix. AN ISSUED CERTIFICATE is a document: the
 * wording filled from the pupil's record and frozen, a serial per prefix and
 * academic year handed out under a lock, and a code anyone can verify it by
 * without learning anything about the pupil. Revoking keeps the document and
 * marks it, because a paper already handed over cannot be unprinted.
 */
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
/** Designing a template is setting the school up, which is the admin's; the head reads the templates and issues from them. */
function admin(ctx: ActiveContext): Office {
  const caller = office(ctx);
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  return caller;
}

const DOC_LOCALES: WordsLocale[] = ["en", "hi", "mr"];
const asLocale = (v: string): WordsLocale => (DOC_LOCALES.includes(v as WordsLocale) ? (v as WordsLocale) : "en");

/* -------------------------------------------------------------------------- */
/* Templates                                                                    */
/* -------------------------------------------------------------------------- */

function templateView(t: { id: string; kind: string; name: string; locale: string; title: string; intro: string; rowsJson: string; outro: string; layoutJson: string; serialPrefix: string; active: boolean; updatedAt: Date; _count: { certificates: number } }) {
  const words = wordsFor(asLocale(t.locale));
  return { id: t.id, kind: t.kind as CertificateKind, name: t.name, locale: asLocale(t.locale), title: t.title, intro: t.intro, rows: parseRows(t.rowsJson), outro: t.outro, layout: parseLayout(t.layoutJson, words), serialPrefix: t.serialPrefix, active: t.active, issuedCount: t._count.certificates, updatedAt: t.updatedAt.toISOString() };
}

/** The sample pupil the editor shows and its preview is filled with, in one language. */
function samplePupil(school: { name: string; code: string; addressLine: string | null; city: string | null }, locale: WordsLocale) {
  const words = wordsFor(locale);
  const sw = (key: string) => words(`certificateSample.${key}`);
  return dataFor(
    {
      name: sw("name"),
      studentCode: "STU-2026-0042",
      birthdateKey: "2016-03-10",
      ageYears: 10,
      record: { fatherName: sw("father"), motherName: sw("mother"), placeOfBirth: sw("place"), nationality: sw("nationality"), religion: sw("religion"), caste: sw("caste"), category: sw("category"), motherTongue: sw("motherTongue"), addressLine: sw("address"), city: sw("city"), postalCode: "411001", admissionNumber: "GR-1042", admissionDateKey: "2022-06-15", admittedToGrade: "1", previousSchool: sw("previousSchool"), penNumber: "27250100001" },
      className: sw("className"),
      gradeLevel: "4",
      school: { name: school.name, code: school.code, address: [school.addressLine, school.city].filter(Boolean).join(", ") || null },
      yearName: "2026–27",
      leaving: { leftOnKey: "2027-04-30", reason: "TRANSFERRED", conduct: "GOOD", destination: sw("destination"), attendance: "192 / 210", lastClass: sw("className") },
      issue: { dateKey: todayKey("UTC"), serial: "TC/2026–27/0001", purpose: sw("purpose"), remark: BLANK },
    },
    locale,
    words,
  );
}

/**
 * What the template editor picks from: every detail a certificate can carry,
 * in the group an office would look for it under, named in each of the
 * three languages and filled for the sample pupil in each. The editor names
 * a detail in the READER's language, labels a new row in the DOCUMENT's, and
 * fills its preview in the document's — three different languages at once
 * in a school that reads English and issues in Marathi. The web editor's
 * alone: the API's view (templatesView) is as it was.
 */
export type PaletteGroup = "PUPIL" | "FAMILY" | "ADMISSION" | "SCHOOL" | "LEAVING" | "ISSUE";
export type PaletteEntry = { key: string; group: PaletteGroup; labels: Record<WordsLocale, string>; samples: Record<WordsLocale, string> };
const FAMILY_KEYS = new Set(["pupil.fatherName", "pupil.motherName", "pupil.parentage"]);
const ADMISSION_KEYS = new Set(["pupil.admissionNumber", "pupil.admissionDate", "pupil.admittedToGrade", "pupil.previousSchool", "pupil.penNumber"]);
function groupOf(key: string): PaletteGroup {
  if (FAMILY_KEYS.has(key)) return "FAMILY";
  if (ADMISSION_KEYS.has(key)) return "ADMISSION";
  if (key.startsWith("pupil.")) return "PUPIL";
  if (key.startsWith("record.")) return "LEAVING";
  if (key.startsWith("issue.")) return "ISSUE";
  return "SCHOOL";
}
export async function templatePalette(ctx: ActiveContext): Promise<PaletteEntry[]> {
  const caller = office(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true, code: true, addressLine: true, city: true } });
  const locales: WordsLocale[] = ["en", "hi", "mr"];
  const samples = Object.fromEntries(locales.map((l) => [l, samplePupil(school, l)])) as Record<WordsLocale, ReturnType<typeof samplePupil>>;
  const each = (pick: (l: WordsLocale) => string) => Object.fromEntries(locales.map((l) => [l, pick(l)])) as Record<WordsLocale, string>;
  return PLACEHOLDER_KEYS.map((key) => ({
    key,
    group: groupOf(key),
    labels: each((l) => wordsFor(l)(`certificatePlaceholders.${key.replace(".", "_")}`)),
    samples: each((l) => samples[l][key] ?? BLANK),
  }));
}

/** The school's templates, the presets in every language, and the placeholders with a sample pupil's values. */
export async function templatesView(ctx: ActiveContext): Promise<CertificateTemplatesView> {
  const caller = office(ctx);
  const [rows, school] = await Promise.all([
    db.certificateTemplate.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ active: "desc" }, { kind: "asc" }, { name: "asc" }], include: { _count: { select: { certificates: true } } } }),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true, code: true, addressLine: true, city: true, locale: true } }),
  ]);
  const locale = asLocale(school.locale);
  const words = wordsFor(locale);
  const sample = samplePupil(school, locale);
  // The dictionary's keys cannot hold a dot, so "pupil.name" is looked up as "pupil_name".
  const placeholders = PLACEHOLDER_KEYS.map((key) => ({ key, label: words(`certificatePlaceholders.${key.replace(".", "_")}`), sample: sample[key] ?? BLANK }));
  return { templates: rows.map(templateView), presets: allPresets(), placeholders };
}

/** Create, or replace by id. The name is unique per school; a template issued from may still be reworded, because issued documents keep their own wording. */
export async function saveTemplate(ctx: ActiveContext, input: CertificateTemplateSave, templateId?: string) {
  const caller = admin(ctx);
  /**
   * A CODE THE CERTIFICATE CANNOT FILL IS REFUSED, AND NAMED. It used to be
   * saved, and printed a dash on every paper issued from the template with
   * nobody told why. The web's editor has refused it since e3a344a; this
   * is the same refusal for the phone and for anything else that calls the
   * API. A template saved before this with such a code in it still opens
   * and still issues — it is refused when it is next saved.
   */
  const known = new Set<string>(PLACEHOLDER_KEYS);
  const unknown = [...new Set([input.title, input.intro, input.outro, ...input.rows.map((r) => r.value)].flatMap(placeholderKeys))].filter((key) => !known.has(key));
  if (unknown.length > 0) throw new AccessError("certificates.unknownDetails", "FORBIDDEN", { list: unknown.map((k) => `[[${k}]]`).join(", ") });
  const data = { kind: input.kind, name: input.name, locale: input.locale, title: input.title, intro: input.intro, rowsJson: JSON.stringify(input.rows), outro: input.outro, layoutJson: JSON.stringify(input.layout), serialPrefix: input.serialPrefix.toUpperCase(), active: input.active };
  const clash = await db.certificateTemplate.findFirst({ where: { schoolId: caller.schoolId, name: input.name, ...(templateId ? { id: { not: templateId } } : {}) }, include: { _count: { select: { certificates: true } } } });
  if (clash) {
    // The same template sent again, word for word, is the one that stands; a different one under a taken name is refused.
    const same = !templateId && (Object.keys(data) as (keyof typeof data)[]).every((k) => clash[k] === data[k]);
    if (same) return templateView(clash);
    throw new AccessError("certificates.nameTaken");
  }
  let row;
  if (templateId) {
    const existing = await db.certificateTemplate.findFirst({ where: { id: templateId, schoolId: caller.schoolId }, select: { id: true } });
    if (!existing) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
    row = await db.certificateTemplate.update({ where: { id: existing.id }, data, include: { _count: { select: { certificates: true } } } });
  } else {
    row = await db.certificateTemplate.create({ data: { schoolId: caller.schoolId, createdByUserId: caller.user.id, ...data }, include: { _count: { select: { certificates: true } } } });
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.template", targetType: "CertificateTemplate", targetId: row.id, meta: { kind: input.kind, locale: input.locale, rows: input.rows.length, created: !templateId } });
  return templateView(row);
}

/** Retire a template: it is offered no more; the certificates issued from it stand. */
export async function archiveTemplate(ctx: ActiveContext, templateId: string) {
  const caller = admin(ctx);
  const existing = await db.certificateTemplate.findFirst({ where: { id: templateId, schoolId: caller.schoolId }, select: { id: true, active: true } });
  if (!existing) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (existing.active) await db.certificateTemplate.update({ where: { id: existing.id }, data: { active: false } });
  return { ok: true as const };
}

/* -------------------------------------------------------------------------- */
/* Issuing                                                                      */
/* -------------------------------------------------------------------------- */

/** A date-only value (a birthday, an admission date) is stored at UTC midnight; its day is the UTC slice. An instant — a leaving, a joining — is read in the school's zone instead. */
const key = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

/** Everything a template may name about one pupil, gathered once. */
async function factsFor(schoolId: string, studentMembershipId: string, issue: PupilFacts["issue"], leftOn: string | undefined): Promise<PupilFacts> {
  const [pupil, school, year] = await Promise.all([
    db.membership.findFirst({
      where: { id: studentMembershipId, schoolId, role: "STUDENT" },
      select: { studentCode: true, gradeLevel: true, joinedAt: true, leftAt: true, user: { select: { name: true, birthdate: true, penNumber: true } }, pupilRecord: true, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true, gradeLevel: true } } }, take: 1 }, schoolRecord: true, scheduledDeparture: true },
    }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, code: true, addressLine: true, city: true, region: true, postalCode: true, timezone: true } }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { name: true } }),
  ]);
  if (!pupil) throw new AccessError("certificates.notAPupil", "NOT_FOUND");
  const klass = pupil.enrollments[0]?.class ?? null;
  const r = pupil.pupilRecord;
  // The leaving block: the departure recorded, the one scheduled, or the date typed at issue.
  const departure = pupil.schoolRecord;
  const scheduled = pupil.scheduledDeparture;
  const leftOnKey = departure ? dateKeyInZone(departure.leftAt, school.timezone) : scheduled ? scheduled.leaveOnKey : (leftOn ?? null);
  // Attendance over the WHOLE stay, to the leaving day or today — the leaving
  // certificate's own figure, so a pupil who left in an earlier year has one.
  const today = todayKey(school.timezone);
  const stay = await stayAttendance(schoolId, studentMembershipId, leftOnKey && leftOnKey < today ? leftOnKey : today, { joinedAt: pupil.joinedAt, admissionDate: r?.admissionDate ?? null, timezone: school.timezone });
  const attendance = stay.marked > 0 ? `${stay.present} / ${stay.marked}` : null;
  // The day of issue in the school's zone, as a UTC-midnight instant to age a UTC-midnight birthday against.
  const issuedOn = new Date(`${issue.dateKey}T00:00:00Z`);
  return {
    // The legal name, as the leaving certificate and the filings print it; a formal paper is not the place for a preferred one.
    name: pupil.user.name,
    studentCode: pupil.studentCode,
    birthdateKey: key(pupil.user.birthdate),
    ageYears: pupil.user.birthdate ? ageInYears(pupil.user.birthdate, issuedOn) : null,
    record: r
      ? { fatherName: r.fatherName, motherName: r.motherName, placeOfBirth: r.placeOfBirth, nationality: r.nationality, religion: r.religion, caste: r.caste, category: r.category, motherTongue: r.motherTongue, addressLine: r.addressLine, city: r.city, postalCode: r.postalCode, admissionNumber: r.admissionNumber, admissionDateKey: key(r.admissionDate), admittedToGrade: r.admittedToGrade, previousSchool: r.previousSchool, penNumber: pupil.user.penNumber ?? r.penNumber }
      : null,
    className: klass?.name ?? departure?.className ?? null,
    gradeLevel: klass?.gradeLevel ?? pupil.gradeLevel ?? null,
    school: { name: school.name, code: school.code, address: [school.addressLine, school.city, school.region, school.postalCode].filter(Boolean).join(", ") || null },
    yearName: year?.name ?? null,
    leaving: leftOnKey || departure || scheduled
      ? {
          leftOnKey,
          reason: departure?.reason ?? scheduled?.reason ?? null,
          conduct: departure?.conduct ?? scheduled?.conduct ?? null,
          destination: departure?.destination ?? scheduled?.destination ?? null,
          attendance,
          lastClass: departure?.className ?? klass?.name ?? null,
        }
      : { leftOnKey: null, reason: null, conduct: null, destination: null, attendance, lastClass: klass?.name ?? null },
    issue,
  };
}

function newCode(): string {
  // Ten characters from an alphabet without look-alikes; printed on the paper.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

/** Issue one certificate to one pupil from a template: filled, numbered under a lock, frozen, told to the family. */
export async function issueCertificate(ctx: ActiveContext, input: CertificateIssueInput): Promise<IssuedCertificateView> {
  const caller = office(ctx);
  const template = await db.certificateTemplate.findFirst({ where: { id: input.templateId, schoolId: caller.schoolId } });
  if (!template) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (!template.active) throw new AccessError("certificates.templateRetired");
  const year = await db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { id: true, name: true } });
  if (!year) throw new AccessError("certificates.noYear");
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const locale = asLocale(template.locale);
  const words = wordsFor(locale);
  const prefix = template.serialPrefix.toUpperCase();
  const dateKey = todayKey(school.timezone);

  // Everything the document names is read before the lock is taken: a
  // query on the shared client while the transaction holds the year's row
  // would run on another connection, outside the tenant's context.
  // Issued from an ask: the ask's purpose stands unless the office wrote one.
  const purpose = input.purpose?.trim() || (input.requestId ? await requestPurpose(caller.schoolId, input.requestId) : null);
  const facts = await factsFor(caller.schoolId, input.studentMembershipId, { dateKey, serial: "", purpose, remark: input.remark?.trim() || null }, input.leftOn);
  const issued = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // The year's row is the lock: two issues at once take numbers in turn.
    await tx.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
    const last = await tx.issuedCertificate.findFirst({ where: { schoolId: caller.schoolId, academicYearId: year.id, serial: { startsWith: `${prefix}/` } }, orderBy: { number: "desc" }, select: { number: true } });
    const number = (last?.number ?? 0) + 1;
    const serial = `${prefix}/${year.name}/${String(number).padStart(4, "0")}`;
    const data = { ...dataFor({ ...facts, issue: { ...facts.issue, serial } }, locale, words) };
    const intro = fill(template.intro, data);
    const rows = fillRows(parseRows(template.rowsJson), data);
    const outro = fill(template.outro, data);
    const missing = [...new Set([...intro.missing, ...rows.missing, ...outro.missing])];
    const title = fill(template.title, data).text;
    return tx.issuedCertificate.create({
      data: {
        schoolId: caller.schoolId,
        templateId: template.id,
        studentMembershipId: input.studentMembershipId,
        // The name as this paper prints it, kept with the paper.
        studentName: facts.name,
        academicYearId: year.id,
        kind: template.kind,
        locale,
        serial,
        number,
        title,
        intro: intro.text,
        rowsJson: JSON.stringify(rows.rows),
        outro: outro.text,
        layoutJson: template.layoutJson,
        dataJson: JSON.stringify({ ...data, missing }),
        purpose,
        remark: input.remark?.trim() || null,
        code: newCode(),
        issuedByUserId: caller.user.id,
      },
      select: { id: true, serial: true, title: true },
    });
  });

  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.issue", targetType: "IssuedCertificate", targetId: issued.id, meta: { kind: template.kind, locale, serial: issued.serial, templateId: template.id, requestId: input.requestId ?? null } });
  if (input.requestId) await markRequestIssued(caller.schoolId, input.requestId, issued.id);
  // The issuer's own signature on the lines that are theirs, a wait on the lines that are somebody else's, and the seal.
  await signOnIssue(ctx, { kind: "CERTIFICATE", id: issued.id, schoolId: caller.schoolId, title: issued.title, studentName: facts.name }, parseLayout(template.layoutJson, words));
  await notifyGuardians(input.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "SYSTEM",
    titleKey: "pupilRecord.certificateIssued",
    titleVars: { name: childName },
    bodyKey: "pupilRecord.certificateIssuedBody",
    bodyVars: { title: issued.title, serial: issued.serial },
    url: `/certificates/${issued.id}`,
    meta: { certificateId: issued.id },
  }));
  return certificateView(ctx, issued.id);
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                      */
/* -------------------------------------------------------------------------- */

async function mayRead(ctx: ActiveContext, cert: { schoolId: string; studentMembershipId: string }): Promise<boolean> {
  if (ctx.role === "PARENT") {
    try {
      await assertGuardianAccess(ctx.user.id, cert.studentMembershipId);
      return true;
    } catch {
      return false;
    }
  }
  if (!ctx.schoolId || ctx.schoolId !== cert.schoolId) return false;
  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") return true;
  if (ctx.role === "STUDENT") return ctx.membershipId === cert.studentMembershipId;
  if (ctx.role === "TEACHER" && ctx.membershipId) {
    const teaches = await db.classTeacher.findFirst({ where: { schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId, class: { enrollments: { some: { studentMembershipId: cert.studentMembershipId, status: "ACTIVE" } } } }, select: { id: true } });
    return Boolean(teaches);
  }
  return false;
}

/** One certificate as it will be printed; a reader who may not see it gets 404. */
export async function certificateView(ctx: ActiveContext, certificateId: string): Promise<IssuedCertificateView> {
  const cert = await db.issuedCertificate.findFirst({
    where: { id: certificateId, ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}) },
    include: { student: { select: { user: { select: { name: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } }, school: { select: { name: true, code: true, logoPath: true, addressLine: true, city: true, region: true, postalCode: true, contactPhone: true, contactEmail: true, brandPrimary: true } } },
  });
  if (!cert || !(await mayRead(ctx, cert))) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const issuedBy = cert.issuedByUserId ? await db.user.findUnique({ where: { id: cert.issuedByUserId }, select: { name: true, preferredName: true } }) : null;
  let missing: string[] = [];
  /**
   * THE HEAD OF THE PAPER IS THE PAPER'S, as its body always was. The values
   * the body was filled from are kept with it; the class and the school's
   * name above the body were read live, so a pupil who had left showed no
   * class on their own transfer certificate, and a school renamed in June
   * renamed the head of March's paper while the body and the public check
   * went on saying the old name.
   */
  let printed: Record<string, unknown> = {};
  try {
    printed = JSON.parse(cert.dataJson) as Record<string, unknown>;
    missing = ((printed as { missing?: string[] }).missing ?? []).filter((m): m is string => typeof m === "string");
  } catch {
    missing = [];
  }
  const signed = await paperSignatures(ctx, { kind: "CERTIFICATE", id: cert.id, schoolId: cert.schoolId });
  const asPrinted = (key: string): string | null => (typeof printed[key] === "string" && (printed[key] as string).trim() ? (printed[key] as string) : null);
  return {
    id: cert.id,
    kind: cert.kind as CertificateKind,
    locale: asLocale(cert.locale),
    serial: cert.serial,
    title: cert.title,
    intro: cert.intro,
    rows: parseRows(cert.rowsJson),
    outro: cert.outro,
    layout: parseLayout(cert.layoutJson, wordsFor(asLocale(cert.locale))),
    purpose: cert.purpose,
    remark: cert.remark,
    studentMembershipId: cert.studentMembershipId,
    // The legal name on the paper, as it was printed: the paper's own copy,
    // and the account's only for a paper older than the copy.
    studentName: cert.studentName ?? cert.student.user.name,
    className: asPrinted("class.name") ?? asPrinted("record.lastClass") ?? cert.student.enrollments[0]?.class.name ?? null,
    school: { ...cert.school, name: asPrinted("school.name") ?? cert.school.name },
    code: cert.code,
    signatures: signed.signatures,
    seal: signed.seal,
    issuedAt: cert.issuedAt.toISOString(),
    issuedByName: issuedBy ? (issuedBy.preferredName ?? issuedBy.name) : null,
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    revokedReason: cert.revokedReason,
    missing,
    canRevoke: (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") && !cert.revokedAt,
  };
}

const listRow = (c: { id: string; kind: string; locale: string; serial: string; title: string; studentMembershipId: string; studentName: string | null; issuedAt: Date; revokedAt: Date | null; student: { user: { name: string } } }) => ({
  id: c.id, kind: c.kind as CertificateKind, locale: asLocale(c.locale), serial: c.serial, title: c.title, studentMembershipId: c.studentMembershipId, studentName: c.studentName ?? c.student.user.name, issuedAt: c.issuedAt.toISOString(), revokedAt: c.revokedAt?.toISOString() ?? null,
});

/** The office's list, newest first, optionally one pupil's. */
export async function listCertificates(ctx: ActiveContext, membershipId?: string) {
  const caller = office(ctx);
  const rows = await db.issuedCertificate.findMany({ where: { schoolId: caller.schoolId, ...(membershipId ? { studentMembershipId: membershipId } : {}) }, orderBy: { issuedAt: "desc" }, take: 500, include: { student: { select: { user: { select: { name: true } } } } } });
  return { items: rows.map(listRow) };
}

/** A pupil's own certificates, or every child's for a guardian. */
export async function familyCertificates(ctx: ActiveContext) {
  let ids: string[] = [];
  if (ctx.role === "PARENT") {
    ids = (await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentMembershipId: true } })).map((g) => g.studentMembershipId);
  } else if (ctx.role === "STUDENT" && ctx.membershipId) {
    ids = [ctx.membershipId];
  } else {
    throw new AccessError("access.notAllowed");
  }
  if (ids.length === 0) return { items: [] };
  const rows = await db.issuedCertificate.findMany({ where: { studentMembershipId: { in: ids } }, orderBy: { issuedAt: "desc" }, take: 200, include: { student: { select: { user: { select: { name: true } } } } } });
  return { items: rows.map(listRow) };
}

/** Marks the document revoked with a reason; the paper stays on the list and the verify page says so. */
export async function revokeCertificate(ctx: ActiveContext, certificateId: string, reason: string): Promise<IssuedCertificateView> {
  const caller = office(ctx);
  const cert = await db.issuedCertificate.findFirst({ where: { id: certificateId, schoolId: caller.schoolId }, select: { id: true, revokedAt: true, serial: true, studentMembershipId: true } });
  if (!cert) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  // Already revoked: nothing changes and the document is answered as it stands.
  if (cert.revokedAt) return certificateView(ctx, cert.id);
  await db.issuedCertificate.update({ where: { id: cert.id }, data: { revokedAt: new Date(), revokedReason: reason.trim().slice(0, 200) } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.revoke", targetType: "IssuedCertificate", targetId: cert.id, meta: { serial: cert.serial } });
  // The family holds the paper: they are told it no longer stands, as they were told when it was issued.
  await notifyGuardians(cert.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "SYSTEM",
    titleKey: "pupilRecord.certificateRevoked",
    titleVars: { name: childName },
    bodyKey: "pupilRecord.certificateRevokedBody",
    bodyVars: { serial: cert.serial },
    url: `/certificates/${cert.id}`,
    meta: { certificateId: cert.id },
  }));
  return certificateView(ctx, cert.id);
}

/** What anyone with the printed code may learn: that the paper is real, from which school, and when — never whose. */
export async function verifyByCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(clean)) return { valid: false, kind: null, serial: null, title: null, schoolName: null, issuedAt: null, revokedAt: null };
  // No join to the school: a signed-out connection reads the certificate row alone, and the
  // document's own snapshot carries the school's name as it was when the paper was printed.
  const cert = await db.issuedCertificate.findUnique({ where: { code: clean }, select: { kind: true, serial: true, locale: true, issuedAt: true, revokedAt: true, dataJson: true } });
  if (!cert) return { valid: false, kind: null, serial: null, title: null, schoolName: null, issuedAt: null, revokedAt: null };
  let schoolName: string | null = null;
  try {
    schoolName = (JSON.parse(cert.dataJson) as Record<string, string | null>)["school.name"] ?? null;
  } catch {
    schoolName = null;
  }
  // The KIND'S name, never the filled title: a template's title may read
  // "Bonafide certificate of [[pupil.name]]", and the public check page is
  // for anyone holding the code — a landlord, a bank — who learns the paper
  // is real and nothing about the child. In the paper's own language.
  const kind = cert.kind as CertificateKind;
  return { valid: !cert.revokedAt, kind, serial: cert.serial, title: kindLabel(kind, cert.locale), schoolName, issuedAt: cert.issuedAt.toISOString(), revokedAt: cert.revokedAt?.toISOString() ?? null };
}

const KIND_LABEL_KEY: Record<CertificateKind, TranslationKey> = {
  TC: "certificates.kindTc",
  NIRGAM: "certificates.kindNirgam",
  BONAFIDE: "certificates.kindBonafide",
  CHARACTER: "certificates.kindCharacter",
  STUDY: "certificates.kindStudy",
  CUSTOM: "certificates.kindCustom",
};

function kindLabel(kind: CertificateKind, locale: string): string {
  return translator(normaliseLocale(locale))(KIND_LABEL_KEY[kind] ?? "certificates.kindCustom");
}

export type { CertificateLayout, CertificateRow };
