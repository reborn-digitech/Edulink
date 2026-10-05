/**
 * THE PLAN ITEMS' ZZ FIXTURE (R-2, the risks batch's package 5A, 5 October 2026), run by `npm run zz:fixtures`
 * after the colleges, their academics and the college office (which makes Vidya's current year).
 *
 *   ZZ Vidya College:
 *     - the reading-room register today, signed by zz.cadmin's desk: zz.cstudent01 in and out, zz.faculty01 in
 *       and out, zz.cstudent02 still inside — /library/reading-room;
 *     - "ZZ Student Council": zz.cstudent01 (President) and zz.cstudent02 (Secretary), kept on /bulletin/council;
 *       the council's notice published by the registrar, and zz.cstudent01's waiting for review;
 *     - the appointment letter templates in English, Hindi and Marathi (prefix AL), and zz.faculty02's letter
 *       from the English one — /admin/certificates/appointments, /account/letters.
 *
 * Every id is fixed (src/lib/api-catalog/plan-items-fixture.ts). Re-run safe: rows are written by their id; the
 * register's times move with today; the letter keeps its serial.
 */
import type { PrismaClient } from "@prisma/client";
import { PLAN_ITEMS_FIXTURE as F } from "../src/lib/api-catalog/plan-items-fixture";
import { allAppointmentPresets, fill, fillRows, staffDataFor, wordsFor } from "../src/lib/certificate-rules";

const DOMAIN = "zz.test";
const MINUTE = 60_000;
/** A day key in India for an instant. */
const istKey = (d: Date) => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

export async function buildPlanItems(db: PrismaClient): Promise<{ visits: number; councilMembers: number; notices: number; templates: number; letter: string | null } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true, name: true, addressLine: true, city: true, region: true, postalCode: true } });
  if (!vidya) return null;
  const v = vidya.id;
  const at = (email: string, role: string) => db.membership.findFirst({ where: { schoolId: v, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true, title: true, joinedAt: true, user: { select: { name: true } } } });
  const [admin, f1, f2, s1, s2] = await Promise.all([at(`zz.cadmin@${DOMAIN}`, "ADMIN"), at(`zz.faculty01@${DOMAIN}`, "FACULTY"), at(`zz.faculty02@${DOMAIN}`, "FACULTY"), at(`zz.cstudent01@${DOMAIN}`, "STUDENT"), at(`zz.cstudent02@${DOMAIN}`, "STUDENT")]);
  if (!admin || !f1 || !f2 || !s1 || !s2) return null;

  /* --------------------------------------------- the reading-room register */
  const now = Date.now();
  const visits: [number, string, number, number | null][] = [
    [1, s1.id, 180, 90],
    [2, f1.id, 60, 15],
    [3, s2.id, 30, null],
  ];
  for (const [n, membershipId, inAgo, outAgo] of visits) {
    const inAt = new Date(now - inAgo * MINUTE);
    const outAt = outAgo === null ? null : new Date(now - outAgo * MINUTE);
    const row = { schoolId: v, membershipId, dayKey: istKey(inAt), inAt, outAt, inByUserId: admin.userId, outByUserId: outAt ? admin.userId : null };
    await db.readingRoomVisit.upsert({ where: { id: F.visit(n) }, create: { id: F.visit(n), ...row }, update: row });
  }
  // One open visit per person: an older open one of the fixture's readers (another day's run) is closed where it began.
  await db.readingRoomVisit.updateMany({ where: { schoolId: v, membershipId: { in: [s1.id, f1.id, s2.id] }, outAt: null, id: { notIn: [F.visit(3)] } }, data: { outAt: new Date(now - 200 * MINUTE) } });

  /* ------------------------------------------------- the council and notices */
  const members = [
    { name: s1.user.name, role: "President", membershipId: s1.id },
    { name: s2.user.name, role: "Secretary", membershipId: s2.id },
  ];
  const council = { schoolId: v, kind: "STUDENT_COUNCIL", name: "ZZ Student Council", membersJson: JSON.stringify(members) };
  await db.committee.upsert({ where: { id: F.council }, create: { id: F.council, ...council }, update: council });
  const notices: [number, string, string, string, string, "APPROVED" | "PENDING"][] = [
    [1, admin.userId, admin.id, "ZZ Council: cultural week from Monday", "ZZ The student council invites every class to send two names for the cultural week committee by Friday.", "APPROVED"],
    [2, s1.userId, s1.id, "ZZ Council: suggestion box in the library", "ZZ Drop your ideas for the canteen and the library in the council's box at the library desk.", "PENDING"],
  ];
  for (const [n, authorUserId, authorMembershipId, title, body, status] of notices) {
    const post = { schoolId: v, authorUserId, authorMembershipId, scope: "SCHOOL", category: "COUNCIL", authorCommitteeId: F.council, title, body, audience: "ALL", status, reviewedAt: status === "APPROVED" ? new Date() : null, reviewedByMembershipId: status === "APPROVED" ? admin.id : null };
    await db.post.upsert({ where: { id: F.councilNotice(n) }, create: { id: F.councilNotice(n), ...post }, update: { title, body, status, category: "COUNCIL", authorCommitteeId: F.council } });
  }

  /* ------------------------------------------- appointment letter templates */
  const presets = allAppointmentPresets();
  for (const [n, locale] of [[1, "en"], [2, "hi"], [3, "mr"]] as const) {
    const p = presets.find((x) => x.locale === locale)!;
    const data = { kind: p.kind, name: `ZZ ${p.name}`, locale, title: p.title, intro: p.intro, rowsJson: JSON.stringify(p.rows), outro: p.outro, layoutJson: JSON.stringify(p.layout), serialPrefix: p.serialPrefix, active: true };
    await db.certificateTemplate.upsert({ where: { id: F.appointmentTemplate(n) }, create: { id: F.appointmentTemplate(n), schoolId: v, createdByUserId: admin.userId, ...data }, update: data });
  }

  /* ---------------------------------------- zz.faculty02's appointment letter */
  const year = await db.academicYear.findFirst({ where: { schoolId: v, isCurrent: true }, select: { id: true, name: true } });
  let letter: string | null = null;
  if (year) {
    const existing = await db.issuedCertificate.findUnique({ where: { id: F.appointmentLetter(1) }, select: { serial: true } });
    if (existing) letter = existing.serial;
    else {
      const last = await db.issuedCertificate.findFirst({ where: { schoolId: v, academicYearId: year.id, serial: { startsWith: "AL/" } }, orderBy: { number: "desc" }, select: { number: true } });
      const number = (last?.number ?? 0) + 1;
      const serial = `AL/${year.name}/${String(number).padStart(4, "0")}`;
      const [record, dept] = await Promise.all([
        db.staffRecord.findUnique({ where: { membershipId: f2.id }, select: { staffNumber: true, designation: true, qualification: true, joinedOn: true, appointmentType: true } }),
        db.departmentFaculty.findUnique({ where: { membershipId: f2.id }, select: { department: { select: { name: true } } } }),
      ]);
      const p = presets.find((x) => x.locale === "en")!;
      const dateKey = istKey(new Date());
      const d = staffDataFor(
        {
          name: f2.user.name,
          designation: record?.designation ?? f2.title ?? null,
          department: dept?.department.name ?? null,
          staffNumber: record?.staffNumber ?? null,
          joinedOnKey: (record?.joinedOn ?? f2.joinedAt).toISOString().slice(0, 10),
          qualification: record?.qualification ?? null,
          appointmentType: record?.appointmentType ?? null,
          school: { name: vidya.name, address: [vidya.addressLine, vidya.city, vidya.region, vidya.postalCode].filter(Boolean).join(", ") || null },
          yearName: year.name,
          issue: { dateKey, serial, purpose: null, remark: null },
        },
        "en",
        wordsFor("en"),
      );
      const intro = fill(p.intro, d);
      const rows = fillRows(p.rows, d);
      const outro = fill(p.outro, d);
      const missing = [...new Set([...intro.missing, ...rows.missing, ...outro.missing])];
      await db.issuedCertificate.create({
        data: { id: F.appointmentLetter(1), schoolId: v, templateId: F.appointmentTemplate(1), studentMembershipId: f2.id, studentName: f2.user.name, academicYearId: year.id, kind: "APPOINTMENT", locale: "en", serial, number, title: fill(p.title, d).text, intro: intro.text, rowsJson: JSON.stringify(rows.rows), outro: outro.text, layoutJson: JSON.stringify(p.layout), dataJson: JSON.stringify({ ...d, missing }), code: `ZZAL${String(number).padStart(6, "0")}`, issuedByUserId: admin.userId },
      });
      letter = serial;
    }
  }
  return { visits: visits.length, councilMembers: members.length, notices: notices.length, templates: 3, letter };
}
