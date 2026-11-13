/**
 * The peer-visit file picker: TA-305 of the testing analysis of 13 November 2026 in lib/peer-visits.ts.
 *
 *   TA-305  The picker listed every IQAC file of the college, a grievance's attachment among them with
 *           its kind (RAGGING, HARASSMENT) as its title, and an evidence line could cite one; the
 *           evidence list has kept grievance files from the IQAC since campaign S-9.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after) with the
 * IQAC on, a NAAC visit, one evidence file and one grievance attachment.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { ActiveContext } from "@/lib/session";
import { addVisitItem, visitDetail } from "@/lib/peer-visits";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqv-${who}-${STAMP}@test.invalid`;
const ids = { school: "", iqac: "", iqacM: "", visit: "", grievanceFile: "", evidenceFile: "" };

function ctx(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: ids.iqacM,
    schoolId: ids.school,
    role: "IQAC" as ActiveContext["role"],
    user: { id: ids.iqac, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA IQAC Visits ${STAMP}`, slug: `zz-taiqv-${STAMP}`, code: `ZTQV${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.iqac = (await db.user.create({ data: { name: "ZZ TA Iqac Visits", email: MAIL("iqac"), prefs: "{}" }, select: { id: true } })).id;
  ids.iqacM = (await db.membership.create({ data: { userId: ids.iqac, schoolId: ids.school, role: "IQAC", status: "ACTIVE" }, select: { id: true } })).id;
  const cycle = (await db.accreditationCycle.create({ data: { schoolId: ids.school, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2021-06-01", windowTo: "2026-05-31", createdByUserId: ids.iqac }, select: { id: true } })).id;
  ids.visit = (await db.peerTeamVisit.create({ data: { schoolId: ids.school, framework: "NAAC", cycleId: cycle, year: 2026, title: "ZZ peer team", fromDate: "2026-12-01", toDate: "2026-12-03", createdByUserId: ids.iqac }, select: { id: true } })).id;
  ids.evidenceFile = (await db.iqacFile.create({ data: { schoolId: ids.school, fileId: `${randomUUID()}.pdf`, title: "ZZ IQAC minutes", purpose: "EVIDENCE", uploadedByUserId: ids.iqac, uploadedByMembershipId: ids.iqacM }, select: { id: true } })).id;
  ids.grievanceFile = (await db.iqacFile.create({ data: { schoolId: ids.school, fileId: `${randomUUID()}.pdf`, title: "HARASSMENT", purpose: "GRIEVANCE", uploadedByUserId: ids.iqac, uploadedByMembershipId: ids.iqacM }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-305: no grievance file in the visit's picker", () => {
  it("TA-305: the picker lists the evidence file and not the grievance attachment", async () => {
    const d = await visitDetail(ctx(), ids.visit);
    expect(d.options.files.map((f) => f.id)).toContain(ids.evidenceFile);
    expect(d.options.files.map((f) => f.id)).not.toContain(ids.grievanceFile);
    expect(d.options.files.some((f) => f.label === "HARASSMENT")).toBe(false);
  }, 60_000);

  it("TA-305: an evidence line citing the grievance attachment is refused, one citing the evidence file is taken", async () => {
    await expect(addVisitItem(ctx(), ids.visit, { kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ a complaint", linkKind: "FILE", linkId: ids.grievanceFile, note: "" })).rejects.toMatchObject({ key: "peerVisit.refuseLink" });
    const d = await addVisitItem(ctx(), ids.visit, { kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ the cell's minutes", linkKind: "FILE", linkId: ids.evidenceFile, note: "" });
    expect(d.evidence.filter((e) => e.linkKind === "FILE")).toHaveLength(1);
  }, 60_000);
});
