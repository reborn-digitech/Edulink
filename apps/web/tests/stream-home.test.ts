/**
 * THE FIGURES ON THE REGISTRAR'S AND THE PRINCIPAL'S TILES (5 Oct 2026, the UX
 * builder): the quarter's end, the filings whose window falls in it counted by
 * hand for an arts college, an autonomous engineering one and a law college,
 * and the live figures of a ZZ law college of this suite's own (removed
 * afterwards) — its people, its moot court, its NSS unit, the tiles its
 * streams do not draw left without a figure — and the shell's stream gate on
 * the practical record's menu entry.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { presetUnion } from "@edulink/contracts";
import { filingsDueThisQuarter, homeFigures, quarterEnd } from "@/lib/stream-home";
import { NAV } from "@/lib/nav";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", users: [] as string[] };

describe("the quarter and the filings due in it", () => {
  it("ends a quarter on its last day", () => {
    expect(quarterEnd("2026-10-05")).toBe("2026-12-31");
    expect(quarterEnd("2027-02-10")).toBe("2027-03-31");
    expect(quarterEnd("2027-04-01")).toBe("2027-06-30");
    expect(quarterEnd("2024-08-31")).toBe("2024-09-30");
  });

  it("counts the rows whose window touches today … the quarter's end, by the college's kind and streams", () => {
    const arts = { kind: "COLLEGE", aicteApprovalRef: null, naacGrade: "B++", iqacOn: true, streams: ["ARTS", "SCIENCE", "COMMERCE"] };
    const engineering = { kind: "AUTONOMOUS_COLLEGE", aicteApprovalRef: null, naacGrade: null, iqacOn: true, streams: ["ENGINEERING"] };
    const law = { kind: "COLLEGE", aicteApprovalRef: "ZZ/1", naacGrade: null, iqacOn: true, streams: ["LAW"] };
    // 5 October … 31 December: AISHE and NIRF (November to January) and the affiliating university's winter exams.
    expect(filingsDueThisQuarter(arts, "2026-10-05")).toBe(3);
    // An autonomous college sits no university exams.
    expect(filingsDueThisQuarter(engineering, "2026-10-05")).toBe(2);
    // 10 February … 31 March: an affiliated engineering college has AICTE's extension, the affiliation return and the summer exams.
    expect(filingsDueThisQuarter({ ...engineering, kind: "COLLEGE" }, "2027-02-10")).toBe(3);
    // A law college is not reminded of AICTE's extension, whatever reference it holds.
    expect(filingsDueThisQuarter(law, "2027-02-10")).toBe(2);
    // AISHE's window (November to January) is over by 10 February.
    expect(filingsDueThisQuarter(arts, "2027-02-10")).toBe(2);
  });
});

describe("a law college's home figures", () => {
  beforeAll(async () => {
    const school = await db.school.create({ data: { name: `ZZ SH Law ${STAMP}`, slug: `zz-sh-law-${STAMP}`, code: `ZSH${String(STAMP).slice(-6)}`, contactEmail: `zz-sh-law-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", streamsJson: JSON.stringify(["LAW"]) }, select: { id: true } });
    ids.school = school.id;
    await db.schoolModule.createMany({ data: ["ACADEMICS", "IQAC", "PLACEMENT", "EXAMS", "ADMISSIONS", "SCHOLARSHIPS"].map((module) => ({ schoolId: school.id, module })) });
    const member = async (role: string, n: number) => {
      const u = await db.user.create({ data: { name: `ZZ SH ${role} ${n}`, email: `zz-sh-${role.toLowerCase()}-${n}-${STAMP}@test.invalid` }, select: { id: true } });
      ids.users.push(u.id);
      return (await db.membership.create({ data: { userId: u.id, schoolId: school.id, role, status: "ACTIVE" }, select: { id: true } })).id;
    };
    const s1 = await member("STUDENT", 1);
    await member("STUDENT", 2);
    await member("FACULTY", 3);
    await member("HOD", 4);
    const today = todayKey("Asia/Kolkata");
    await db.mootCourt.create({ data: { schoolId: school.id, name: "ZZ SH Moot", at: today, kind: "INTRA" } });
    await db.corpsEnrolment.create({ data: { schoolId: school.id, corps: "NSS", studentMembershipId: s1, enrolledOn: today } });
  });

  afterAll(async () => {
    if (ids.school) await db.school.delete({ where: { id: ids.school } });
    if (ids.users.length) await db.user.deleteMany({ where: { id: { in: ids.users } } });
    await db.$disconnect();
  });

  it("counts its people, its moot court and its NSS unit, and draws no tile its streams do not bring", async () => {
    const preset = presetUnion(["LAW"]);
    const f = await homeFigures(ids.school, { tiles: preset.homeTiles, modulesOn: ["ACADEMICS", "IQAC", "PLACEMENT", "EXAMS", "ADMISSIONS", "SCHOLARSHIPS"], streams: ["LAW"] });
    expect(f.tiles.people).toEqual({ key: "streams.figure.people", values: { students: 2, faculty: 2 } });
    expect(f.tiles.mootCourt).toEqual({ key: "streams.figure.mootCourt", values: { count: 1 } });
    expect(f.tiles.internships).toEqual({ key: "streams.figure.internships", values: { count: 0 } });
    expect(f.tiles.academics?.values).toEqual({ programmes: 0, divisions: 0 });
    expect(f.tiles.iqac?.key).toBe("streams.figure.iqac");
    expect(f.tiles.labs).toBeUndefined();
    expect(f.tiles.teachingPractice).toBeUndefined();
    expect(f.tiles.nba).toBeUndefined();
    expect(f.nss).toEqual({ enrolled: 1, hours: 0 });
  });

  it("gives a switched-off module's tile no figure", async () => {
    const f = await homeFigures(ids.school, { tiles: presetUnion(["LAW"]).homeTiles, modulesOn: ["ACADEMICS"], streams: ["LAW"] });
    expect(f.tiles.exams).toBeUndefined();
    expect(f.tiles.iqac).toBeUndefined();
    expect(f.tiles.internships).toBeUndefined();
    expect(f.tiles.mootCourt?.values).toEqual({ count: 1 });
  });
});

describe("the menu's stream gate", () => {
  it("keeps the practical record for the streams with labs", () => {
    for (const role of ["FACULTY", "HOD"] as const) {
      const entry = NAV[role].find((i) => i.href.endsWith("/practicals"));
      expect(entry?.streams).toBeDefined();
      expect(entry!.streams).toContain("SCIENCE");
      expect(entry!.streams).toContain("PHARMACY");
      expect(entry!.streams).not.toContain("LAW");
      expect(entry!.streams).not.toContain("ARTS");
    }
  });
});
