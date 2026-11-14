/**
 * The owner's decision on TA-266 of the testing analysis of 13 November 2026 (option 1, 14 Nov 2026): a new
 * programme whose regulator is NCTE starts at 80 % attendance, not 75; the office can still type another figure and
 * programmes that exist keep theirs. For NCTE alone the form's "follows from" sentence is replaced by one saying that
 * 80 % is NCTE's 2014 rule for the course work of the B.Ed. and the four-year integrated B.Ed., that the school
 * internship's 90 % is not tracked here, and to check the programme's own rule; it claims nothing for the D.El.Ed.,
 * the M.Ed. or ITEP. The hint, the contract's comment, docs/college.md and the office guide say the same.
 *
 * One ZZ college of this suite's own, made through the operator's createSchool with EDUCATION and ENGINEERING and
 * removed after, with an ADMIN and a department.
 */
import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { REGULATORS, defaultAttendanceThreshold } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { translator } from "@/lib/i18n/dictionary";
import { isEligible } from "@/lib/academics-rules";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

import { saveProgramme } from "@/lib/academics";
import { ProgrammeRegulatorFields } from "@/components/academics/programme-regulator-fields";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

(globalThis as { React?: typeof React }).React = React;
const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta266-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", admin: "", dept: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const en = translator("en");
const hi = translator("hi");
const mr = translator("mr");
const read = (path: string) => readFileSync(path, "utf8");
const esc = (s: string) => s.replace(/'/g, "&#x27;");

async function admin(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" as never });
  return (await getSession()) as ActiveContext;
}
const base = (code: string) => ({ departmentId: ids.dept, code, name: `ZZ ${code}`, level: "UG" as const, durationYears: 2, intake: 50, exitPoints: [] });
const rowOf = (code: string) => db.programme.findFirst({ where: { schoolId: ids.college, code }, select: { id: true, regulator: true, attendanceThreshold: true, stream: true } });
const render = (props: Parameters<typeof ProgrammeRegulatorFields>[0]) =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ProgrammeRegulatorFields, props)));

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ TA266 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ TA266 College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "AUTONOMOUS_COLLEGE", streams: ["EDUCATION", "ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA266 Admin", email: MAIL("admin") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" } });
  ids.dept = (await db.department.create({ data: { schoolId: ids.college, code: "EDU", name: "ZZ Education" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-266: a new NCTE programme starts at 80 %", () => {
  it("TA-266: NCTE's starting figure is 80; every other council's is unchanged", () => {
    expect(Object.fromEntries(REGULATORS.map((r) => [r, defaultAttendanceThreshold(r)]))).toEqual({ AICTE: 75, UGC: 75, PCI: 80, BCI: 70, NCTE: 80, COA: 75, NMC: 75, ICAR: 75, DCI: 75, INC: 80, OTHER: 75 });
  });

  it("TA-266: a B.Ed. saved with the education stream and no figure stores NCTE at 80, and a student teacher at 79 % is a defaulter", async () => {
    await saveProgramme(await admin(), { ...base("ZZBED"), stream: "EDUCATION" });
    const row = await rowOf("ZZBED");
    expect(row).toMatchObject({ regulator: "NCTE", attendanceThreshold: 80, stream: "EDUCATION" });
    // The defaulter rule reads the stored figure: 79 % is under it, 77 % too (eligible at 75 before), 80 % is not.
    expect(isEligible(79, row!.attendanceThreshold, false)).toBe(false);
    expect(isEligible(77, row!.attendanceThreshold, false)).toBe(false);
    expect(isEligible(80, row!.attendanceThreshold, false)).toBe(true);
  });

  it("TA-266: the office can still type another figure, and a programme that exists keeps its own on an edit", async () => {
    const ctx = await admin();
    await saveProgramme(ctx, { ...base("ZZDELED"), stream: "EDUCATION", attendanceThreshold: 75 });
    expect(await rowOf("ZZDELED")).toMatchObject({ regulator: "NCTE", attendanceThreshold: 75 });
    const old = await db.programme.create({ data: { schoolId: ids.college, departmentId: ids.dept, code: "ZZMED", name: "ZZ M.Ed.", level: "PG", durationYears: 2, intake: 50, regulator: "NCTE", stream: "EDUCATION", attendanceThreshold: 75, exitPoints: "[]" }, select: { id: true } });
    // The correction form starts on the programme's own figure and sends it back.
    await saveProgramme(ctx, { ...base("ZZMED"), id: old.id, level: "PG", name: "ZZ M.Ed.", stream: "EDUCATION", regulator: "NCTE", attendanceThreshold: 75 });
    expect(await rowOf("ZZMED")).toMatchObject({ regulator: "NCTE", attendanceThreshold: 75 });
  });
});

describe("TA-266: the form's sentence for NCTE", () => {
  it("TA-266: the education stream fills 80 and says NCTE's 2014 B.Ed. rule, the internship's 90 % not tracked, instead of 'follows from NCTE'", () => {
    const html = render({ streams: ["EDUCATION"], streamLabels: { EDUCATION: "Education" } });
    expect(html).toMatch(/name="attendanceThreshold"[^>]*value="80"/);
    expect(html).toContain(esc(en("streams.thresholdNcte", { threshold: 80 })));
    expect(html).not.toContain(en("streams.thresholdFollows", { regulator: "NCTE", threshold: 80 }));
    expect(html).not.toContain(en("streams.thresholdFollows", { regulator: "NCTE", threshold: 75 }));
  });

  it("TA-266: an NCTE programme's correction keeps its own figure and shows the same sentence; other councils keep 'follows from'", () => {
    const html = render({ stream: "EDUCATION", initialRegulator: "NCTE", initialThreshold: 75 });
    expect(html).toMatch(/name="attendanceThreshold"[^>]*value="75"/);
    expect(html).toContain(esc(en("streams.thresholdNcte", { threshold: 80 })));
    const eng = render({ streams: ["ENGINEERING"], streamLabels: { ENGINEERING: "Engineering" } });
    expect(eng).toContain(en("streams.thresholdFollows", { regulator: "AICTE", threshold: 75 }));
    expect(eng).not.toContain(esc(en("streams.thresholdNcte", { threshold: 80 })));
  });

  it("TA-266: the hint names teacher education among the 80s, and the form uses it", () => {
    const component = read("src/components/academics/programme-regulator-fields.tsx");
    expect(component).toContain('hint={t("academics.fieldThresholdHintTeacherEd")}');
    expect(component).toContain('t("streams.thresholdNcte"');
    expect(en("academics.fieldThresholdHintTeacherEd")).toBe("Left blank: the regulator's — 75; pharmacy, nursing and teacher education 80; law 70.");
  });

  it("TA-266: the NCTE sentence names only the B.Ed. and the four-year integrated B.Ed., dated 2014, and claims nothing for the D.El.Ed., the M.Ed. or ITEP", () => {
    const s = en("streams.thresholdNcte", { threshold: 80 });
    for (const part of ["NCTE", "2014", "B.Ed.", "four-year integrated B.Ed.", "80 %", "90 %", "not tracked here", "own rule"]) expect(s).toContain(part);
    for (const part of ["D.El.Ed", "M.Ed", "ITEP"]) expect(s).not.toContain(part);
  });

  it("TA-266: the new sentences are in en, hi and mr, Hindi with the danda and Marathi with a full stop", () => {
    for (const key of ["streams.thresholdNcte", "academics.fieldThresholdHintTeacherEd"] as const) {
      for (const tr of [en, hi, mr]) expect(tr(key, { threshold: 80 })).not.toBe(key);
      expect(hi(key, { threshold: 80 })).not.toBe(en(key, { threshold: 80 }));
      expect(mr(key, { threshold: 80 })).not.toBe(en(key, { threshold: 80 }));
      expect(hi(key, { threshold: 80 }).endsWith("।")).toBe(true);
      expect(mr(key, { threshold: 80 }).endsWith(".")).toBe(true);
      expect(mr(key, { threshold: 80 })).not.toContain("स्कूल");
    }
    for (const tr of [hi, mr]) expect(tr("streams.thresholdNcte", { threshold: 80 })).toMatch(/2014[\s\S]*80 %[\s\S]*90 %/);
  });
});

describe("TA-266: the notes say the same", () => {
  it("TA-266: the contract's comment, docs/college.md and the office guide name teacher education at 80, the internship's 90 % as not tracked and the excused shortfall as a known gap", () => {
    const contract = read("../../packages/contracts/src/v1/academics.ts");
    expect(contract).not.toMatch(/everyone else 75 \(UGC, AICTE, NCTE/);
    expect(contract).toMatch(/NCTE 80/);
    const college = read("../../docs/college.md");
    expect(college).toMatch(/TA-266/);
    expect(college).toMatch(/90 %[^\n]*not tracked/);
    expect(college).toMatch(/excused[^\n]*below 80/);
    const guide = read("../../docs/guide/office-college.md");
    expect(guide).not.toContain("(left blank: the regulator's; 75, pharmacy 80, law 70)");
    expect(guide).toContain("(left blank: the regulator's; 75, pharmacy, nursing and teacher education 80, law 70)");
    expect(guide).toMatch(/90 %[^\n]*not tracked/);
  });
});
