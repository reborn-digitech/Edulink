/**
 * The owner's decision on TA-304 of the testing analysis of 13 November 2026 (option 1, 14 November 2026).
 *
 *   TA-304  The IQAC read the ICC's and the anti-ragging committee's action-taken text through the committees
 *           door, opened their minutes through the file door and found them in its evidence list, while the
 *           grievance desk keeps the words of the same two committees' cases from it (G4-16). Now, for an ICC or
 *           anti-ragging committee, the IQAC sees that meetings were held and their dates and never the text or
 *           the minutes file: listCommittees leaves them out for it, the file rule refuses the minutes, and they
 *           cannot be listed or attached as evidence (the evidence list, a qualitative score, the entered
 *           figures, a peer visit's lines and its picker). The office and the head read everything as before.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after) with the IQAC
 * on: an ICC, an anti-ragging committee and the IQAC cell, each with one meeting and its minutes file.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { ActiveContext } from "@/lib/session";
import { listCommittees, listEvidence, saveEnteredInputs, scoreQualitative } from "@/lib/iqac";
import { authorizeFileRead } from "@/lib/files";
import { addVisitItem, visitDetail } from "@/lib/peer-visits";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta304-${who}-${STAMP}@test.invalid`;
const ids = { school: "", cycle: "", visit: "" };
const people: Record<string, { user: string; membership: string }> = {};
const files = { icc: `${randomUUID()}.pdf`, ragging: `${randomUUID()}.pdf`, cell: `${randomUUID()}.pdf` };
const fileRow = { icc: "", ragging: "", cell: "" };
const meeting = { icc: "", ragging: "", cell: "" };
const SECRET = "ZZ inquiry closed, warning issued to the respondent";

type Role = "IQAC" | "ADMIN" | "PRINCIPAL";
function ctx(role: Role): ActiveContext {
  const p = people[role]!;
  return {
    sessionId: "test",
    membershipId: p.membership,
    schoolId: ids.school,
    role: role as ActiveContext["role"],
    user: { id: p.user, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA 304 Minutes ${STAMP}`, slug: `zz-ta304-${STAMP}`, code: `Z304${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  for (const role of ["IQAC", "ADMIN", "PRINCIPAL"] as const) {
    const user = (await db.user.create({ data: { name: `ZZ TA 304 ${role}`, email: MAIL(role.toLowerCase()), prefs: "{}" }, select: { id: true } })).id;
    const membership = (await db.membership.create({ data: { userId: user, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
    people[role] = { user, membership };
  }
  const admin = people.ADMIN!;
  for (const [key, kind, name] of [["icc", "ICC", "ZZ Internal Complaints Committee"], ["ragging", "ANTI_RAGGING", "ZZ Anti-Ragging Committee"], ["cell", "IQAC", "ZZ IQAC cell"]] as const) {
    const committee = (await db.committee.create({ data: { schoolId: ids.school, kind, name, membersJson: JSON.stringify([{ name: "ZZ Member", role: "Chair", membershipId: null }]) }, select: { id: true } })).id;
    fileRow[key] = (await db.iqacFile.create({ data: { schoolId: ids.school, fileId: files[key], title: `${name} 2026-10-01`, purpose: "MINUTES", uploadedByUserId: admin.user, uploadedByMembershipId: admin.membership }, select: { id: true } })).id;
    meeting[key] = (await db.committeeMeeting.create({ data: { schoolId: ids.school, committeeId: committee, at: "2026-10-01", minutesFileId: files[key], actionTaken: key === "cell" ? "ZZ the cell's plan adopted" : SECRET, createdByUserId: admin.user }, select: { id: true } })).id;
  }
  ids.cycle = (await db.accreditationCycle.create({ data: { schoolId: ids.school, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2021-06-01", windowTo: "2026-05-31", createdByUserId: people.IQAC!.user }, select: { id: true } })).id;
  ids.visit = (await db.peerTeamVisit.create({ data: { schoolId: ids.school, framework: "NAAC", cycleId: ids.cycle, year: 2026, title: "ZZ peer team", fromDate: "2026-12-01", toDate: "2026-12-03", createdByUserId: people.IQAC!.user }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  if (ids.school) await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const meetingOf = (list: Awaited<ReturnType<typeof listCommittees>>, id: string) => list.items.flatMap((c) => c.meetings).find((m) => m.id === id);

describe("TA-304: an ICC or anti-ragging committee's minutes stay with the office and the head", () => {
  it("TA-304: the IQAC sees the two committees' meetings and dates, never the action taken or the minutes file; the cell's stay whole", async () => {
    const list = await listCommittees(ctx("IQAC"));
    for (const key of ["icc", "ragging"] as const) {
      const m = meetingOf(list, meeting[key]);
      expect(m, key).toBeDefined();
      expect(m!.at).toBe("2026-10-01");
      expect(m!.actionTaken).toBe("");
      expect(m!.minutesFileId).toBeNull();
    }
    expect(JSON.stringify(list)).not.toContain(SECRET);
    expect(JSON.stringify(list)).not.toContain(files.icc);
    expect(meetingOf(list, meeting.cell)).toMatchObject({ actionTaken: "ZZ the cell's plan adopted", minutesFileId: files.cell });
  }, 60_000);

  it("TA-304: the office and the head read every committee's action taken and minutes as before", async () => {
    for (const role of ["ADMIN", "PRINCIPAL"] as const) {
      const list = await listCommittees(ctx(role));
      expect(meetingOf(list, meeting.icc), role).toMatchObject({ actionTaken: SECRET, minutesFileId: files.icc });
      expect(meetingOf(list, meeting.ragging), role).toMatchObject({ actionTaken: SECRET, minutesFileId: files.ragging });
    }
  }, 60_000);

  it("TA-304: the file rule refuses the IQAC the two committees' minutes and serves it the cell's; the office and the head open all three", async () => {
    expect((await authorizeFileRead(files.icc, ctx("IQAC"))).allowed).toBe(false);
    expect((await authorizeFileRead(files.ragging, ctx("IQAC"))).allowed).toBe(false);
    expect((await authorizeFileRead(files.cell, ctx("IQAC"))).allowed).toBe(true);
    for (const role of ["ADMIN", "PRINCIPAL"] as const) for (const f of Object.values(files)) expect((await authorizeFileRead(f, ctx(role))).allowed, `${role} ${f}`).toBe(true);
  }, 60_000);

  it("TA-304: the evidence list holds the cell's minutes and never the two committees'", async () => {
    for (const role of ["IQAC", "ADMIN"] as const) {
      const listed = (await listEvidence(ctx(role))).items.map((f) => f.fileId);
      expect(listed, role).toContain(files.cell);
      expect(listed, role).not.toContain(files.icc);
      expect(listed, role).not.toContain(files.ragging);
    }
  }, 60_000);

  it("TA-304: a qualitative score or the entered figures citing the ICC's minutes are refused; the cell's minutes are taken", async () => {
    await expect(scoreQualitative(ctx("IQAC"), ids.cycle, "4.1.1", { score: 2, note: "", fileIds: [files.icc], evidence: [] })).rejects.toMatchObject({ key: "iqac.refuseFile" });
    await expect(saveEnteredInputs(ctx("IQAC"), ids.cycle, { values: [{ key: "COMPUTERS", value: 40 }], fileIds: [files.ragging] })).rejects.toMatchObject({ key: "iqac.refuseFile" });
    expect(await db.metricScore.count({ where: { cycleId: ids.cycle } })).toBe(0);
    await scoreQualitative(ctx("IQAC"), ids.cycle, "4.1.1", { score: 2, note: "", fileIds: [files.cell], evidence: [] });
    expect(await db.metricScore.count({ where: { cycleId: ids.cycle, metricCode: "4.1.1" } })).toBe(1);
  }, 120_000);

  it("TA-304: a peer visit's picker leaves the two committees' minutes out and a line citing them is refused", async () => {
    const d = await visitDetail(ctx("IQAC"), ids.visit);
    const picked = d.options.files.map((f) => f.id);
    expect(picked).toContain(fileRow.cell);
    expect(picked).not.toContain(fileRow.icc);
    expect(picked).not.toContain(fileRow.ragging);
    await expect(addVisitItem(ctx("IQAC"), ids.visit, { kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ the ICC's minutes", linkKind: "FILE", linkId: fileRow.icc, note: "" })).rejects.toMatchObject({ key: "peerVisit.refuseLink" });
    const after = await addVisitItem(ctx("IQAC"), ids.visit, { kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ the cell's minutes", linkKind: "FILE", linkId: fileRow.cell, note: "" });
    expect(after.evidence.filter((e) => e.linkKind === "FILE")).toHaveLength(1);
  }, 60_000);
});
