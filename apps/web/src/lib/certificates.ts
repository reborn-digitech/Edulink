import "server-only";
import { randomBytes } from "node:crypto";
import type { CertificateIssueInput, CertificateKind, CertificateLayout, CertificateRow, CertificateTemplateSave, CertificateTemplatesView, IssuedCertificateView } from "./certificate-types";
import { db } from "./db";
import { forJoinCode } from "./tenant-context";
import { examDocumentByCode } from "./exam-document-check";
import { consentApplies } from "./student-consent";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { lockTcRegister, registerMax, stayAttendance } from "./school-record";
import { answerRequest, claimRequestForIssue, requestPurpose } from "./certificate-requests";
import { ageInYears, dateKeyInZone, todayKey } from "./dates";
import { allAppointmentPresets, allCollegePresets, allPresets, BLANK, dataFor, fill, fillRows, isStaffKind, parseLayout, parseRows, placeholderFitsKind, placeholderKeys, PLACEHOLDER_KEYS, staffDataFor, STAFF_CERTIFICATE_KINDS, wordsFor, writtenTokens, type PupilFacts, type StaffFacts } from "./certificate-rules";
import type { WordsLocale } from "./words";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { normaliseLocale } from "@edulink/i18n";
import { paperSignatures, signOnIssue } from "./signatures";
import { translator, type TranslationKey } from "./i18n/dictionary";
import { collegeFacts } from "./college-records";
import { isCollegeKind } from "./institution";

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
  // A college is offered its own presets beside the school's (4 Oct 2026).
  const college = isCollegeKind((await db.school.findUnique({ where: { id: caller.schoolId }, select: { kind: true } }))?.kind ?? "SCHOOL");
  // The appointment letter (risks batch 5A, 5 Oct 2026) is offered at a school and a college alike.
  return { templates: rows.map(templateView), presets: [...(college ? [...allPresets(), ...allCollegePresets()] : allPresets()), ...allAppointmentPresets()], placeholders };
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
  // Every bracketed token, not only those the pattern reads (TA-577): one it cannot read would print as typed.
  const unknown = [...new Set([input.title, input.intro, input.outro, ...input.rows.map((r) => r.value)].flatMap(writtenTokens))].filter((key) => !known.has(key));
  if (unknown.length > 0) throw new AccessError("certificates.unknownDetails", "FORBIDDEN", { list: unknown.map((k) => `[[${k}]]`).join(", ") });
  // A staff paper names the staff record and a pupil's paper the pupil's (risks batch 5A): the other's details would print a dash.
  const misfit = [...new Set([input.title, input.intro, input.outro, ...input.rows.map((r) => r.value)].flatMap(placeholderKeys))].filter((key) => !placeholderFitsKind(key, input.kind));
  if (misfit.length > 0) throw new AccessError("certificates.unknownDetails", "FORBIDDEN", { list: misfit.map((k) => `[[${k}]]`).join(", ") });
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
    college: await collegeFacts(schoolId, studentMembershipId),
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
  // An appointment letter goes to a member of staff, through its own door (issueAppointmentLetter).
  if (isStaffKind(template.kind)) throw new AccessError("appointmentLetters.refusePupilDoor");
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
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // Issued from an ask: the ask is claimed first, under its own lock, so two presses make one paper (QA-12).
    if (input.requestId) {
      const claim = await claimRequestForIssue(tx, caller.schoolId, input.requestId, input.studentMembershipId);
      if (claim.issuedCertificateId) return { already: true as const, id: claim.issuedCertificateId };
    }
    // The year's row is the lock: two issues at once take numbers in turn.
    await tx.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
    const { serial, number, academicYearId } = await (async () => {
      if (prefix !== "TC") {
        const last = await tx.issuedCertificate.findFirst({ where: { schoolId: caller.schoolId, academicYearId: year.id, serial: { startsWith: `${prefix}/` } }, orderBy: { number: "desc" }, select: { number: true } });
        const n = (last?.number ?? 0) + 1;
        return { serial: `${prefix}/${year.name}/${String(n).padStart(4, "0")}`, number: n, academicYearId: year.id };
      }
      // THE TC REGISTER (school-record.ts, LIFECYCLE-6): one series with the leaving records. A transfer
      // certificate for a pupil whose departure is recorded prints that record's serial, unless another
      // paper already carries it; anything else takes the next number across both papers.
      await lockTcRegister(tx, caller.schoolId);
      const record = template.kind === "TC" ? await tx.schoolRecord.findFirst({ where: { schoolId: caller.schoolId, studentMembershipId: input.studentMembershipId, serial: { startsWith: "TC/" } }, select: { serial: true } }) : null;
      const shared = record?.serial && !(await tx.issuedCertificate.findFirst({ where: { schoolId: caller.schoolId, serial: record.serial }, select: { id: true } })) ? record.serial : null;
      if (shared) {
        const yearName = shared.slice("TC/".length, shared.lastIndexOf("/"));
        const sharedYear = yearName === year.name ? year.id : ((await tx.academicYear.findFirst({ where: { schoolId: caller.schoolId, name: yearName }, select: { id: true } }))?.id ?? null);
        return { serial: shared, number: Number(shared.slice(shared.lastIndexOf("/") + 1)), academicYearId: sharedYear };
      }
      const n = (await registerMax(tx, caller.schoolId, `TC/${year.name}/`)) + 1;
      return { serial: `TC/${year.name}/${String(n).padStart(4, "0")}`, number: n, academicYearId: year.id };
    })();
    const data = { ...dataFor({ ...facts, issue: { ...facts.issue, serial } }, locale, words) };
    const intro = fill(template.intro, data);
    const rows = fillRows(parseRows(template.rowsJson), data);
    const outro = fill(template.outro, data);
    const missing = [...new Set([...intro.missing, ...rows.missing, ...outro.missing])];
    const title = fill(template.title, data).text;
    const created = await tx.issuedCertificate.create({
      data: {
        schoolId: caller.schoolId,
        templateId: template.id,
        studentMembershipId: input.studentMembershipId,
        // The name as this paper prints it, kept with the paper.
        studentName: facts.name,
        academicYearId,
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
    if (input.requestId) await answerRequest(tx, caller.schoolId, input.requestId, created.id);
    return { already: false as const, ...created };
  });
  // The other press made the paper a moment ago: answered with it, and nothing is audited, signed or told twice.
  if (outcome.already) return certificateView(ctx, outcome.id);
  const issued = outcome;

  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.issue", targetType: "IssuedCertificate", targetId: issued.id, meta: { kind: template.kind, locale, serial: issued.serial, templateId: template.id, requestId: input.requestId ?? null } });
  // The issuer's own signature on the lines that are theirs, a wait on the lines that are somebody else's, and the seal.
  await signOnIssue(ctx, { kind: "CERTIFICATE", id: issued.id, schoolId: caller.schoolId, title: issued.title, studentName: facts.name }, parseLayout(template.layoutJson, words));
  // An adult at a college: the paper is theirs, and their guardian is neither told nor shown it (mayRead; campaign S-2).
  if (!(await consentApplies(input.studentMembershipId))) await notifyGuardians(input.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "SYSTEM",
    titleKey: "pupilRecord.certificateIssued",
    titleVars: { name: childName },
    bodyKey: "pupilRecord.certificateIssuedBody",
    bodyVars: { title: issued.title, serial: issued.serial },
    url: `/certificates/${issued.id}`,
    meta: { certificateId: issued.id },
  }));
  await tellHolder(input.studentMembershipId, { schoolId: caller.schoolId, titleKey: "pupilRecord.certificateIssuedYou", bodyKey: "pupilRecord.certificateIssuedBody", bodyVars: { title: issued.title, serial: issued.serial }, certificateId: issued.id });
  return certificateView(ctx, issued.id);
}

/** The student is told of their own paper, at issue and at withdrawal, at a school and at a college alike (TA-527). */
async function tellHolder(studentMembershipId: string, n: { schoolId: string; titleKey: TranslationKey; bodyKey: TranslationKey; bodyVars: Record<string, string>; certificateId: string }): Promise<void> {
  const holder = await db.membership.findUnique({ where: { id: studentMembershipId }, select: { userId: true } });
  if (!holder) return;
  await notify({ userId: holder.userId, schoolId: n.schoolId, kind: "SYSTEM", titleKey: n.titleKey, bodyKey: n.bodyKey, bodyVars: n.bodyVars, url: `/certificates/${n.certificateId}`, meta: { certificateId: n.certificateId } }).catch((error) => console.error("[certificates] holder notice failed", error));
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                      */
/* -------------------------------------------------------------------------- */

export async function mayReadCertificate(ctx: ActiveContext, cert: { schoolId: string; studentMembershipId: string; kind?: string }): Promise<boolean> {
  return mayRead(ctx, cert);
}

async function mayRead(ctx: ActiveContext, cert: { schoolId: string; studentMembershipId: string; kind?: string }): Promise<boolean> {
  // A staff paper (an appointment letter; risks batch 5A): the office and the member of staff it was issued to, nobody else.
  if (cert.kind && isStaffKind(cert.kind)) {
    if (!ctx.schoolId || ctx.schoolId !== cert.schoolId) return false;
    return ctx.role === "ADMIN" || ctx.role === "PRINCIPAL" || ctx.membershipId === cert.studentMembershipId;
  }
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
  // A former pupil, as an alumnus of this school: the papers of their own stay (G-6).
  if (ctx.role === "ALUMNUS") return Boolean(await db.membership.findFirst({ where: { id: cert.studentMembershipId, userId: ctx.user.id, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true } }));
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
    // Not an adult's at a college: mayRead refuses their guardian each paper, so the list does too (campaign S-2).
    const all = (await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentMembershipId: true } })).map((g) => g.studentMembershipId);
    for (const id of all) if (!(await consentApplies(id))) ids.push(id);
  } else if (ctx.role === "STUDENT" && ctx.membershipId) {
    ids = [ctx.membershipId];
  } else if (ctx.role === "ALUMNUS" && ctx.schoolId) {
    // A former pupil: the papers of their stay at this school (G-6).
    ids = (await db.membership.findMany({ where: { userId: ctx.user.id, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true } })).map((m) => m.id);
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
  if (!(await consentApplies(cert.studentMembershipId))) await notifyGuardians(cert.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "SYSTEM",
    titleKey: "pupilRecord.certificateRevoked",
    titleVars: { name: childName },
    bodyKey: "pupilRecord.certificateRevokedBody",
    bodyVars: { serial: cert.serial },
    url: `/certificates/${cert.id}`,
    meta: { certificateId: cert.id },
  }));
  await tellHolder(cert.studentMembershipId, { schoolId: caller.schoolId, titleKey: "pupilRecord.certificateRevokedYou", bodyKey: "pupilRecord.certificateRevokedBody", bodyVars: { serial: cert.serial }, certificateId: cert.id });
  return certificateView(ctx, cert.id);
}

/** What anyone with the printed code may learn: that the paper is real, from which school, and when — never whose. */
export async function verifyByCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(clean)) return { valid: false, kind: null, serial: null, title: null, schoolName: null, issuedAt: null, revokedAt: null };
  // No join to the school: a signed-out connection reads the certificate row alone, and the
  // document's own snapshot carries the school's name as it was when the paper was printed.
  // Bound by the code itself (IssuedCertificate is CODE_READABLE in gen-rls.ts): with no
  // tenant and no code bound the policy shows nothing, and every printed QR read "not valid".
  const cert = await forJoinCode(clean, () => db.issuedCertificate.findUnique({ where: { code: clean }, select: { kind: true, serial: true, locale: true, issuedAt: true, revokedAt: true, dataJson: true } }));
  if (!cert) {
    // A college's grade card, transcript or degree typed into the same check
    // (A3-journeys-21): found by its code alone, named by `examKind`.
    const paper = await examDocumentByCode(clean);
    if (paper && paper.kind && paper.kind !== "HALL_TICKET") {
      return { valid: paper.valid, kind: null, serial: paper.serial, title: null, schoolName: paper.schoolName, issuedAt: paper.issuedAt, revokedAt: paper.revokedAt, examKind: paper.kind };
    }
    return { valid: false, kind: null, serial: null, title: null, schoolName: null, issuedAt: null, revokedAt: null };
  }
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
  MIGRATION: "certificateDefaults.titleMigration",
  PROVISIONAL: "certificateDefaults.titleProvisional",
  COURSE_COMPLETION: "certificateDefaults.titleCourseCompletion",
  APPOINTMENT: "certificateDefaults.titleAppointment",
};

function kindLabel(kind: CertificateKind, locale: string): string {
  return translator(normaliseLocale(locale))(KIND_LABEL_KEY[kind] ?? "certificates.kindCustom");
}

export type { CertificateLayout, CertificateRow };

/* -------------------------------------------------------------------------- */
/* Appointment letters (R-2, the risks batch of 5 October 2026)                */
/* -------------------------------------------------------------------------- */

/**
 * AN APPOINTMENT LETTER is the certificate engine's staff paper: a template of
 * kind APPOINTMENT (presets in English, Hindi and Marathi, prefix AL), filled
 * from the member of staff's record — the legal name, the designation (the
 * staff record's, else the membership's title), the department at a college,
 * the staff number, the day they joined, the qualification and the nature of
 * the appointment — and numbered under the same academic-year lock as every
 * other paper. The row's `studentMembershipId` holds the member of staff's
 * membership (the column is the recipient's); `mayRead` lets only the office
 * and that member of staff read it. They are told, and keep their letters at
 * /account/letters.
 */
// SUPPORT (owner-batch-item2a): the office may issue a support worker's appointment letter too, and print it for them.
const STAFF_ROLES: readonly Role[] = ["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "SUPPORT"];

async function staffFactsFor(schoolId: string, membershipId: string, issue: StaffFacts["issue"]): Promise<StaffFacts> {
  const [member, school, year] = await Promise.all([
    db.membership.findFirst({ where: { id: membershipId, schoolId, role: { in: [...STAFF_ROLES] } }, select: { title: true, joinedAt: true, user: { select: { name: true } }, staffRecord: { select: { staffNumber: true, designation: true, qualification: true, joinedOn: true, appointmentType: true, academicQualification: true } } } }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, addressLine: true, city: true, region: true, postalCode: true, timezone: true } }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { name: true } }),
  ]);
  if (!member) throw new AccessError("appointmentLetters.refuseNotStaff", "NOT_FOUND");
  const head = await db.department.findFirst({ where: { schoolId, hodMembershipId: membershipId }, select: { name: true } });
  const dept = head ?? (await db.departmentFaculty.findUnique({ where: { membershipId }, select: { department: { select: { name: true } } } }))?.department ?? null;
  const r = member.staffRecord;
  const joined = r?.joinedOn ? r.joinedOn.toISOString().slice(0, 10) : dateKeyInZone(member.joinedAt, school.timezone);
  return {
    name: member.user.name,
    designation: r?.designation ?? member.title ?? null,
    department: dept?.name ?? null,
    staffNumber: r?.staffNumber ?? null,
    joinedOnKey: joined,
    qualification: r?.qualification ?? r?.academicQualification ?? null,
    appointmentType: r?.appointmentType ?? null,
    school: { name: school.name, address: [school.addressLine, school.city, school.region, school.postalCode].filter(Boolean).join(", ") || null },
    yearName: year?.name ?? null,
    issue,
  };
}

/** Issue one appointment letter to one member of staff: filled from their record, numbered under the year's lock, frozen, the member told. */
export async function issueAppointmentLetter(ctx: ActiveContext, input: { templateId: string; staffMembershipId: string; purpose?: string; remark?: string }): Promise<IssuedCertificateView> {
  const caller = office(ctx);
  const template = await db.certificateTemplate.findFirst({ where: { id: input.templateId, schoolId: caller.schoolId } });
  if (!template) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (!template.active) throw new AccessError("certificates.templateRetired");
  if (!isStaffKind(template.kind)) throw new AccessError("appointmentLetters.refuseNotAppointment");
  const year = await db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { id: true, name: true } });
  if (!year) throw new AccessError("certificates.noYear");
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const locale = asLocale(template.locale);
  const words = wordsFor(locale);
  const prefix = template.serialPrefix.toUpperCase();
  const purpose = input.purpose?.trim() || null;
  const remark = input.remark?.trim() || null;
  // Read before the lock, as the pupil's paper is: a query on the shared client inside it would run outside the tenant.
  const facts = await staffFactsFor(caller.schoolId, input.staffMembershipId, { dateKey: todayKey(school.timezone), serial: "", purpose, remark });
  const issued = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // The year's row is the lock every paper's serial is taken under.
    await tx.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
    const last = await tx.issuedCertificate.findFirst({ where: { schoolId: caller.schoolId, academicYearId: year.id, serial: { startsWith: `${prefix}/` } }, orderBy: { number: "desc" }, select: { number: true } });
    const number = (last?.number ?? 0) + 1;
    const serial = `${prefix}/${year.name}/${String(number).padStart(4, "0")}`;
    const data = staffDataFor({ ...facts, issue: { ...facts.issue, serial } }, locale, words);
    const intro = fill(template.intro, data);
    const rows = fillRows(parseRows(template.rowsJson), data);
    const outro = fill(template.outro, data);
    const missing = [...new Set([...intro.missing, ...rows.missing, ...outro.missing])];
    return tx.issuedCertificate.create({
      data: {
        schoolId: caller.schoolId,
        templateId: template.id,
        studentMembershipId: input.staffMembershipId,
        studentName: facts.name,
        academicYearId: year.id,
        kind: template.kind,
        locale,
        serial,
        number,
        title: fill(template.title, data).text,
        intro: intro.text,
        rowsJson: JSON.stringify(rows.rows),
        outro: outro.text,
        layoutJson: template.layoutJson,
        dataJson: JSON.stringify({ ...data, missing }),
        purpose,
        remark,
        code: newCode(),
        issuedByUserId: caller.user.id,
      },
      select: { id: true, serial: true, title: true, studentMembershipId: true },
    });
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "certificate.issue", targetType: "IssuedCertificate", targetId: issued.id, meta: { kind: template.kind, locale, serial: issued.serial, templateId: template.id, staffMembershipId: input.staffMembershipId } });
  await signOnIssue(ctx, { kind: "CERTIFICATE", id: issued.id, schoolId: caller.schoolId, title: issued.title, studentName: facts.name }, parseLayout(template.layoutJson, words));
  // The member of staff is told; the letter is theirs to read and print.
  const staffUser = await db.membership.findUnique({ where: { id: issued.studentMembershipId }, select: { userId: true } });
  if (staffUser) await notify({ userId: staffUser.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "appointmentLetters.notifIssued", bodyKey: "appointmentLetters.notifIssuedBody", bodyVars: { serial: issued.serial }, url: `/account/letters/${issued.id}` });
  return certificateView(ctx, issued.id);
}

/** The office's desk: the APPOINTMENT templates, the staff a letter may go to, and the letters issued, newest first. */
export async function appointmentLettersView(ctx: ActiveContext) {
  const caller = office(ctx);
  const [templates, staff, letters] = await Promise.all([
    db.certificateTemplate.findMany({ where: { schoolId: caller.schoolId, active: true, kind: { in: STAFF_CERTIFICATE_KINDS } }, orderBy: { name: "asc" }, select: { id: true, name: true, locale: true } }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, status: "ACTIVE", leftAt: null, role: { in: [...STAFF_ROLES] } }, orderBy: { user: { name: "asc" } }, take: 1000, select: { id: true, role: true, title: true, user: { select: { name: true } }, staffRecord: { select: { designation: true } } } }),
    db.issuedCertificate.findMany({ where: { schoolId: caller.schoolId, kind: { in: STAFF_CERTIFICATE_KINDS } }, orderBy: { issuedAt: "desc" }, take: 500, include: { student: { select: { user: { select: { name: true } } } } } }),
  ]);
  return {
    templates: templates.map((t) => ({ id: t.id, name: t.name, locale: asLocale(t.locale) })),
    staff: staff.map((m) => ({ membershipId: m.id, name: m.user.name, role: m.role, designation: m.staffRecord?.designation ?? m.title ?? null })),
    letters: letters.map(listRow),
  };
}

/** A member of staff's own letters at the school they are signed in to, newest first. */
export async function myAppointmentLetters(ctx: ActiveContext) {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !STAFF_ROLES.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  const rows = await db.issuedCertificate.findMany({ where: { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, kind: { in: STAFF_CERTIFICATE_KINDS } }, orderBy: { issuedAt: "desc" }, take: 100, include: { student: { select: { user: { select: { name: true } } } } } });
  return { items: rows.map(listRow) };
}
