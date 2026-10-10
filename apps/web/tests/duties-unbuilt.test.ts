/**
 * A DUTY WITH NO DESK IS NOT GIVEN (A3-inventory-12, audit of 5 October 2026).
 *
 * The clinical coordinator (health sciences, pharmacy) and the studio
 * coordinator (architecture) had no door and a page that said their records
 * were coming, yet the registrar could hand them out — at a pharmacy college,
 * a built stream, too. Now a duty carries whether its desk is built
 * (DUTY_BUILT in packages/contracts); no stream offers an unbuilt one, so the
 * panel does not list it, setDuties refuses to give it, and one already held
 * is dropped by the next save as A3-S-2's prune does.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DUTIES, DUTY_BUILT, STREAMS, STREAM_PRESETS } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { offeredDuties, setDuties } from "@/lib/duties";
import { streamPreset } from "@/lib/streams";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-dutyunbuilt-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", admin: "", facultyM: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function asAdmin(): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ DutyUnbuilt Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ DutyUnbuilt Pharmacy ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["PHARMACY"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  ids.admin = (await db.user.create({ data: { name: "ZZ DutyUnbuilt Admin", email: MAIL("admin") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" } });
  const faculty = await db.user.create({ data: { name: "ZZ DutyUnbuilt Faculty", email: MAIL("faculty") }, select: { id: true } });
  ids.facultyM = (await db.membership.create({ data: { userId: faculty.id, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a duty whose desk is not built", () => {
  it("is offered by no stream, and a built one by the streams DUTY_STREAMS names", () => {
    // The studio desk is built since 10 Oct 2026 (R-56, the studio half), so the rule is read from DUTY_BUILT rather than a fixed list.
    const unbuilt = DUTIES.filter((d) => !DUTY_BUILT[d]);
    expect(unbuilt).not.toContain("STUDIO_COORDINATOR");
    for (const s of STREAMS) for (const d of unbuilt) expect(STREAM_PRESETS[s].duties).not.toContain(d);
    expect(STREAM_PRESETS.ARCHITECTURE.duties).toContain("STUDIO_COORDINATOR");
    expect(streamPreset(["PHARMACY", "HEALTH_SCIENCES", "ARCHITECTURE"]).duties).toEqual(expect.arrayContaining(["LAB_INCHARGE", "ANTI_RAGGING_SQUAD", "STUDIO_COORDINATOR"]));
  });

  // The clinical desk is built since 10 Oct 2026 (R-56, the clinical half), so a pharmacy college now offers it; the refusal
  // and the drop are shown on a duty no stream of the college offers, which is the same rule (setDuties, A3-S-2's prune).
  it("is offered at a pharmacy college once built; a duty the college's streams do not offer is refused when given, and is dropped from a teacher who holds it", async () => {
    expect(await offeredDuties(ids.college)).toContain("CLINICAL_COORDINATOR");
    expect(await offeredDuties(ids.college)).not.toContain("PRACTICE_TEACHING_COORDINATOR");
    const admin = await asAdmin();
    await expect(setDuties(admin, ids.facultyM, ["PRACTICE_TEACHING_COORDINATOR"])).rejects.toMatchObject({ key: "duties.refuseNotOffered" });
    // A teacher given it before: the panel re-sends what it was drawn with, and the save takes it off.
    await db.membership.update({ where: { id: ids.facultyM }, data: { dutiesJson: JSON.stringify(["LAB_INCHARGE", "PRACTICE_TEACHING_COORDINATOR"]) } });
    const saved = await setDuties(admin, ids.facultyM, ["LAB_INCHARGE", "PRACTICE_TEACHING_COORDINATOR"]);
    expect(saved.duties).toEqual(["LAB_INCHARGE"]);
    expect(saved.offered).not.toContain("PRACTICE_TEACHING_COORDINATOR");
  });
});
