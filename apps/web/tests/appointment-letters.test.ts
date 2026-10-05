/**
 * Appointment letters on the certificate engine (R-2, risks batch 5A, 5 October 2026), through their /api/v1
 * doors and the engine's own, at a ZZ school of this suite's own.
 *
 * What is proved: the presets come in English, Hindi and Marathi; a staff template naming a pupil's detail,
 * or a pupil's naming a staff detail, is refused; a letter is filled from the staff record (designation,
 * staff number, the day of joining in figures and words, the nature of the appointment) with the AL prefix
 * and serials under the year's lock — two at once take two numbers; a pupil cannot be sent one and the
 * pupil's door will not issue one; the member of staff is told, lists and reads their own letter (and its
 * PDF) and nobody else on the staff can; a family is never offered the kind; a Hindi letter reads in Hindi.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { allAppointmentPresets } from "@/lib/certificate-rules";
import { certificateView, issueAppointmentLetter } from "@/lib/certificates";
import { POST as templatePost, GET as templatesGet } from "@/app/api/v1/office/certificate-templates/route";
import { POST as pupilIssuePost } from "@/app/api/v1/office/certificates/route";
import { GET as officeLettersGet, POST as officeLettersPost } from "@/app/api/v1/office/appointment-letters/route";
import { GET as myLettersGet } from "@/app/api/v1/account/appointment-letters/route";
import { GET as myLetterPdf } from "@/app/api/v1/account/appointment-letters/[certificateId]/pdf/route";
import { GET as familyRequestsGet, POST as familyRequestsPost } from "@/app/api/v1/family/certificate-requests/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);

const u: Record<string, string> = {};
const m: Record<string, string> = {};
const id: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(who: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId: id.school!, role: role as never });
}
const preset = (locale: "en" | "hi" | "mr") => {
  const p = allAppointmentPresets().find((x) => x.locale === locale)!;
  return { kind: p.kind, locale: p.locale, title: p.title, intro: p.intro, rows: p.rows, outro: p.outro, layout: p.layout, serialPrefix: p.serialPrefix, name: `ZZ ${p.name} ${locale}`, active: true };
};
type Letter = { id: string; serial: string; title: string; intro: string; rows: { label: string; value: string }[]; studentName: string; kind: string; missing: string[] };

beforeAll(async () => {
  id.school = (await db.school.create({ data: { name: `ZZ Letters School ${STAMP}`, slug: `zz-letters-${STAMP}`, code: `ZLT${SUFFIX}`, contactEmail: `zz-letters-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "Pune" }, select: { id: true } })).id;
  id.year = (await db.academicYear.create({ data: { schoolId: id.school, name: "2026-27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const people: [string, string][] = [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["t1", "TEACHER"], ["t2", "TEACHER"], ["s1", "STUDENT"]];
  for (const [who, role] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Letters ${who}`, email: `zz-letters-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId: id.school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZLS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  await db.staffRecord.create({ data: { schoolId: id.school, membershipId: m.t1!, staffNumber: "ZZ-T-001", designation: "Assistant teacher, Mathematics", qualification: "M.Sc., B.Ed.", joinedOn: new Date("2026-06-15T00:00:00Z"), appointmentType: "REGULAR" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: id.school! } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("templates", () => {
  it("offers the appointment letter in three languages and saves it", async () => {
    await as("admin", "ADMIN");
    const view = await body<{ presets: { kind: string; locale: string }[] }>(await templatesGet());
    expect(view.presets.filter((p) => p.kind === "APPOINTMENT").map((p) => p.locale).sort()).toEqual(["en", "hi", "mr"]);
    for (const locale of ["en", "hi"] as const) {
      const res = await templatePost(json("/api/v1/office/certificate-templates", preset(locale)));
      expect(res.status).toBe(200);
      id[`tpl_${locale}`] = (await body<{ id: string }>(res)).id;
    }
  });

  it("refuses a staff paper naming a pupil's detail, and a pupil's paper naming a staff detail", async () => {
    await as("admin", "ADMIN");
    const staffWithPupil = { ...preset("en"), name: "ZZ Mixed staff", intro: "[[staff.name]] teaches [[pupil.name]]." };
    expect((await templatePost(json("/api/v1/office/certificate-templates", staffWithPupil))).status).toBe(403);
    const pupilWithStaff = { ...preset("en"), kind: "BONAFIDE", name: "ZZ Mixed pupil", serialPrefix: "ZB", intro: "[[pupil.name]] is taught by [[staff.name]]." };
    expect((await templatePost(json("/api/v1/office/certificate-templates", pupilWithStaff))).status).toBe(403);
  });
});

describe("issuing", () => {
  it("fills the letter from the staff record, numbered AL under the year", async () => {
    await as("admin", "ADMIN");
    const res = await officeLettersPost(json("/api/v1/office/appointment-letters", { templateId: id.tpl_en, staffMembershipId: m.t1 }));
    expect(res.status).toBe(201);
    const letter = await body<Letter>(res);
    id.letter1 = letter.id;
    expect(letter).toMatchObject({ kind: "APPOINTMENT", serial: "AL/2026-27/0001", studentName: "ZZ Letters t1", title: "Letter of appointment" });
    expect(letter.intro).toContain("ZZ Letters t1 is appointed to ZZ Letters School");
    expect(letter.intro).toContain("Assistant teacher, Mathematics");
    const values = letter.rows.map((r) => r.value);
    expect(values).toEqual(expect.arrayContaining(["ZZ Letters t1", "Assistant teacher, Mathematics", "ZZ-T-001", "Regular", "M.Sc., B.Ed."]));
    expect(values.find((v) => v.startsWith("15/06/2026"))).toBeTruthy();
    // The department is a college's: a dash at a school, and said.
    expect(letter.missing).toEqual(["staff.department"]);
  });

  it("takes two numbers for two letters at once", async () => {
    await as("admin", "ADMIN");
    const ctx = (await getSession())!;
    const both = await Promise.all([issueAppointmentLetter(ctx, { templateId: id.tpl_en!, staffMembershipId: m.t2! }), issueAppointmentLetter(ctx, { templateId: id.tpl_en!, staffMembershipId: m.t2! })]);
    expect(both.map((l) => l.serial).sort()).toEqual(["AL/2026-27/0002", "AL/2026-27/0003"]);
  });

  it("is not sent to a pupil, and the pupil's door will not issue it", async () => {
    await as("admin", "ADMIN");
    expect((await officeLettersPost(json("/api/v1/office/appointment-letters", { templateId: id.tpl_en, staffMembershipId: m.s1 }))).status).toBe(404);
    expect((await pupilIssuePost(json("/api/v1/office/certificates", { templateId: id.tpl_en, studentMembershipId: m.s1 }))).status).toBe(403);
  });

  it("reads in Hindi from the Hindi template", async () => {
    await as("principal", "PRINCIPAL");
    const res = await officeLettersPost(json("/api/v1/office/appointment-letters", { templateId: id.tpl_hi, staffMembershipId: m.t1 }));
    const letter = await body<Letter>(res);
    expect(letter.title).toBe("नियुक्ति पत्र");
    expect(letter.intro.endsWith("।")).toBe(true);
    expect(letter.rows.map((r) => r.value)).toContain("नियमित");
  });
});

describe("reading", () => {
  it("tells the member of staff, who lists and reads their own letters", async () => {
    expect(await db.notification.count({ where: { userId: u.t1!, titleKey: "appointmentLetters.notifIssued" } })).toBe(2);
    await as("t1", "TEACHER");
    const mine = await body<{ items: { id: string; kind: string }[] }>(await myLettersGet());
    expect(mine.items).toHaveLength(2);
    expect(mine.items.every((i) => i.kind === "APPOINTMENT")).toBe(true);
    const view = await certificateView((await getSession())!, id.letter1!);
    expect(view.serial).toBe("AL/2026-27/0001");
    const pdf = await myLetterPdf(get(`/api/v1/account/appointment-letters/${id.letter1}/pdf`), { params: Promise.resolve({ certificateId: id.letter1! }) });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
  });

  it("is nobody else's on the staff", async () => {
    await as("t2", "TEACHER");
    await expect(certificateView((await getSession())!, id.letter1!)).rejects.toThrow();
    expect((await myLetterPdf(get(`/api/v1/account/appointment-letters/${id.letter1}/pdf`), { params: Promise.resolve({ certificateId: id.letter1! }) })).status).toBe(404);
    await as("admin", "ADMIN");
    const office = await body<{ letters: { id: string }[]; templates: unknown[]; staff: { membershipId: string }[] }>(await officeLettersGet());
    expect(office.letters).toHaveLength(4);
    expect(office.staff.map((s) => s.membershipId)).not.toContain(m.s1);
  });

  it("is never offered to a family to ask for", async () => {
    await as("s1", "STUDENT");
    const view = await body<{ kinds: string[] }>(await familyRequestsGet(get("/api/v1/family/certificate-requests")));
    expect(view.kinds).not.toContain("APPOINTMENT");
    expect((await familyRequestsPost(json("/api/v1/family/certificate-requests", { kind: "APPOINTMENT", purpose: "ZZ a job" }))).status).toBe(403);
  });
});
