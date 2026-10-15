/**
 * A college's streams and the duties on a college teacher's role (the
 * owner's decision of 5 October 2026).
 *
 * One ZZ college of this suite's own, made through the operator's
 * createSchool with two streams (ENGINEERING and PHARMACY) and removed after,
 * with an office, two faculty members, an HOD and a student; a ZZ school for
 * the refusals. What is proved: a college is refused with no stream (and an
 * unknown one) and made with two, starting with its streams' modules; the
 * preset is the union over the streams; a new programme's regulator and
 * attendance rule follow the stream; the registrar sets a teacher's duties
 * within what the streams offer, audited once; the duty gate lets a FACULTY or
 * HOD through a duty's door only holding the duty — at the session's gate, in
 * `permits` (which the API sweep's expected() reads with each actor's duties)
 * and on the page — and the anti-ragging register shows a complaint's state
 * and never its words; /api/v1/me carries the streams and the duties.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { antiRaggingRegisterSchema, isProfessionalStream, meSchema, presetUnion, STREAM_PRESETS, STREAMS, type StreamCode } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest, modulePagePermitted, endpointFor } from "@/lib/role-gate";
import { permits } from "@/lib/api-catalog/types";
import { AccessError } from "@/lib/access-error";
import { createSchool } from "@/lib/superuser";
import { onboardSchool } from "@/lib/subscriptions";
import { enabledModules } from "@/lib/modules";
import { checkStreams, hasStream, professional, streamPreset, streamsOf } from "@/lib/streams";
import { hasDuty, myDuties, offeredDuties, requireDuty, setDuties } from "@/lib/duties";
import { saveProgramme } from "@/lib/academics";
import { actionKey } from "@/lib/safety-labels";
import { translator } from "@/lib/i18n/dictionary";
import { tv } from "@/lib/stream-words";
import { streamLabel } from "@/lib/institution";
import { GET as meGet } from "@/app/api/v1/me/route";
import { GET as registerGet } from "@/app/api/v1/duties/anti-ragging/route";
import { POST as dutiesPost } from "@/app/api/v1/admin/people/[membershipId]/duties/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-streams-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", school: "", onboarded: "", admin: "", adminM: "", faculty: "", facultyM: "", faculty2: "", faculty2M: "", hod: "", hodM: "", student: "", studentM: "", dept: "", grievance: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const BASE = { contactEmail: MAIL("contact"), timezone: "Asia/Kolkata" };

async function as(userId: string, role: string, schoolId: string | null, route: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession().catch(() => null);
  return ctx as ActiveContext;
}
const REGISTER = "GET /api/v1/duties/anti-ragging";

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ Streams Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { ...BASE, name: `ZZ Streams College ${STAMP}`, kind: "AUTONOMOUS_COLLEGE", streams: ["PHARMACY", "ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  ids.school = (await db.school.create({ data: { name: `ZZ Streams School ${STAMP}`, slug: `zz-streams-school-${STAMP}`, code: `ZST${String(STAMP).slice(-6)}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ Streams ${who}`, email: MAIL(who.toLowerCase()) }, select: { id: true } });
  const member = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  ids.adminM = (await member(ids.admin, "ADMIN")).id;
  ids.faculty = (await user("Faculty")).id;
  ids.facultyM = (await member(ids.faculty, "FACULTY")).id;
  ids.faculty2 = (await user("Faculty2")).id;
  ids.faculty2M = (await member(ids.faculty2, "FACULTY")).id;
  ids.hod = (await user("Hod")).id;
  ids.hodM = (await member(ids.hod, "HOD")).id;
  ids.student = (await user("Student")).id;
  ids.studentM = (await member(ids.student, "STUDENT")).id;
  ids.dept = (await db.department.create({ data: { schoolId: ids.college, code: "MECH", name: "ZZ Mechanical" }, select: { id: true } })).id;
  ids.grievance = (await db.grievance.create({ data: { schoolId: ids.college, byMembershipId: ids.studentM, kind: "RAGGING", committeeKind: "ANTI_RAGGING", text: `ZZ secret words ${STAMP}`, dueOn: "2026-10-01" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.college, ids.school, ids.onboarded].filter(Boolean);
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the presets", () => {
  it("give every stream its council's regulator first, and the union is every stream's, in order", () => {
    expect(STREAM_PRESETS.ENGINEERING.regulators[0]).toBe("AICTE");
    expect(STREAM_PRESETS.PHARMACY.regulators[0]).toBe("PCI");
    expect(STREAM_PRESETS.LAW.regulators[0]).toBe("BCI");
    expect(STREAM_PRESETS.EDUCATION.regulators[0]).toBe("NCTE");
    expect(STREAM_PRESETS.ARCHITECTURE.regulators[0]).toBe("COA");
    expect(STREAM_PRESETS.HEALTH_SCIENCES.regulators[0]).toBe("NMC");
    expect(STREAM_PRESETS.AGRICULTURE.regulators[0]).toBe("ICAR");
    for (const s of ["ARTS", "SCIENCE", "COMMERCE", "VOCATIONAL"] as const) expect(STREAM_PRESETS[s].regulators[0]).toBe("UGC");
    // Every stream starts with the six, a professional one adds placement, engineering and pharmacy the stores.
    for (const s of STREAMS) for (const m of ["ALUMNI", "ACADEMICS", "EXAMS", "ADMISSIONS", "SCHOLARSHIPS", "IQAC"]) expect(STREAM_PRESETS[s].modulesOn).toContain(m);
    for (const s of STREAMS) expect(STREAM_PRESETS[s].modulesOn.includes("PLACEMENT")).toBe(isProfessionalStream(s));
    expect(STREAMS.filter((s) => STREAM_PRESETS[s].modulesOn.includes("INVENTORY"))).toEqual(["ENGINEERING", "PHARMACY"]);
    // The anti-ragging squad and the research dean are every stream's; studio coordination would be architecture's alone,
    // and is no stream's while its desk is not built (A3-inventory-12, tests/duties-unbuilt.test.ts).
    for (const s of STREAMS) expect(STREAM_PRESETS[s].duties).toEqual(expect.arrayContaining(["ANTI_RAGGING_SQUAD", "RESEARCH_DEAN"]));
    // The studio desk is built since 10 Oct 2026 (R-56, the studio half): architecture offers the duty.
    expect(STREAMS.filter((s) => STREAM_PRESETS[s].duties.includes("STUDIO_COORDINATOR"))).toEqual(["ARCHITECTURE"]);

    const vidya = streamPreset(["COMMERCE", "ARTS", "SCIENCE"]);
    expect(vidya.regulators).toEqual(["UGC"]);
    expect(vidya.modulesOn).not.toContain("PLACEMENT");
    expect(vidya.homeTiles.slice(0, 6)).toEqual(["people", "academics", "exams", "admissions", "scholarships", "iqac"]);
    expect(vidya.duties).toContain("LAB_INCHARGE");
    const both = presetUnion(["PHARMACY", "ENGINEERING"]);
    expect(both.regulators).toEqual(["AICTE", "PCI"]);
    expect(both.filings).toEqual(expect.arrayContaining(["AICTE_DISCLOSURE", "AFFILIATION_RETURN", "AISHE", "NIRF"]));
    expect(both.homeTiles).toEqual(expect.arrayContaining(["labs", "placement", "nba"]));
    expect(new Set(both.homeTiles).size).toBe(both.homeTiles.length);
    // Words change only where every stream agrees: a pharmacy college's lab is a practical, an engineering-and-pharmacy college's stays a lab.
    expect(presetUnion(["PHARMACY"]).vocabulary).toEqual({ lab: "practical" });
    expect(both.vocabulary).toEqual({});
    // Health sciences keeps its clinical postings and logbooks since the clinical desk (R-56, 10 Oct 2026): agriculture's alone remain.
    expect(presetUnion(["HEALTH_SCIENCES", "AGRICULTURE"]).notBuilt).toEqual(["FARM", "FIELD_WORK"]);
    expect(professional(["ARTS"])).toBe(false);
    expect(professional(["ARTS", "LAW"])).toBe(true);
  });

  it("say the words by stream, and name each stream, in every language", () => {
    const en = translator("en");
    const hi = translator("hi");
    expect(tv("lecture", ["ARCHITECTURE"], en, true)).toBe(en("streams.word.studioMany"));
    expect(tv("lecture", ["ARCHITECTURE", "ENGINEERING"], en, true)).toBe(en("streams.word.lectureMany"));
    expect(tv("department", ["LAW"], hi)).toBe(hi("streams.word.faculty"));
    for (const s of STREAMS) expect(streamLabel(s, hi)).not.toBe(streamLabel(s, en));
    expect(streamLabel("NOT_A_STREAM", en)).toBe("NOT_A_STREAM");
  });
});

describe("a college is made with its streams", () => {
  it("is refused with none or with an unknown one, and a school ignores the list", async () => {
    expect(checkStreams("COLLEGE", [])).toBe("streams.refuseNone");
    expect(checkStreams("AUTONOMOUS_COLLEGE", ["ARTS", "ROCKETRY"])).toBe("streams.refuseUnknown");
    expect(checkStreams("SCHOOL", [])).toBeNull();
    const before = await db.school.count({ where: { name: { startsWith: "ZZ Streams None" } } });
    expect(await createSchool(operator(), { ...BASE, name: `ZZ Streams None ${STAMP}`, kind: "COLLEGE" })).toEqual({ ok: false, errorKey: "streams.refuseNone" });
    expect(await createSchool(operator(), { ...BASE, name: `ZZ Streams None ${STAMP}`, kind: "COLLEGE", streams: ["ROCKETRY"] })).toEqual({ ok: false, errorKey: "streams.refuseUnknown" });
    expect(await onboardSchool(operator(), { ...BASE, name: `ZZ Streams None ${STAMP}`, kind: "COLLEGE", trial: true, adminEmail: MAIL("none-admin") })).toEqual({ ok: false, errorKey: "streams.refuseNone" });
    expect(await db.school.count({ where: { name: { startsWith: "ZZ Streams None" } } })).toBe(before);
  });

  it("is made with two, stores them in STREAMS order, starts with their modules and is audited with them", async () => {
    expect(await streamsOf(ids.college)).toEqual(["ENGINEERING", "PHARMACY"]);
    expect(await hasStream(ids.college, "PHARMACY")).toBe(true);
    expect(await hasStream(ids.college, "LAW")).toBe(false);
    // No ASSISTANT: a new tenant starts with the assistant module off since 15 Oct 2026 (the platform feature decides it).
    expect(await enabledModules(ids.college)).toEqual(["INVENTORY", "ALUMNI", "ACADEMICS", "EXAMS", "IQAC", "PLACEMENT", "ADMISSIONS", "SCHOLARSHIPS"]);
    const row = await db.auditLog.findFirst({ where: { action: "superuser.school.create", targetId: ids.college }, select: { meta: true } });
    expect(JSON.parse(String(row?.meta ?? "{}"))).toMatchObject({ streams: ["ENGINEERING", "PHARMACY"] });
    // The guided onboarding takes the same list.
    const onboarded = await onboardSchool(operator(), { ...BASE, name: `ZZ Streams Onboarded ${STAMP}`, kind: "COLLEGE", streams: ["LAW", "ARTS"], trial: true, adminEmail: MAIL("onboard-admin") });
    expect(onboarded.ok).toBe(true);
    ids.onboarded = onboarded.ok ? onboarded.schoolId : "";
    expect(await streamsOf(ids.onboarded)).toEqual(["ARTS", "LAW"]);
    expect(await enabledModules(ids.onboarded)).toContain("PLACEMENT");
    expect(await enabledModules(ids.onboarded)).not.toContain("INVENTORY");
    // A school keeps none, whatever it is sent.
    expect(await streamsOf(ids.school)).toEqual([]);
  });
});

describe("a programme's stream", () => {
  it("defaults the regulator and the attendance rule, and must be one of the college's", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.college, null);
    const save = (code: string, extra: Record<string, unknown>) => saveProgramme(admin, { departmentId: ids.dept, code, name: `ZZ ${code}`, level: "UG", durationYears: 4, intake: 60, exitPoints: [], ...extra } as never);
    const eng = await save("ZZBTME", { stream: "ENGINEERING" });
    const pharm = await save("ZZBPH", { stream: "PHARMACY" });
    const own = await save("ZZBPH2", { stream: "PHARMACY", regulator: "AICTE" });
    const rows = await db.programme.findMany({ where: { id: { in: [eng.id, pharm.id, own.id] } }, select: { code: true, regulator: true, attendanceThreshold: true, stream: true }, orderBy: { code: "asc" } });
    expect(rows).toEqual([
      { code: "ZZBPH", regulator: "PCI", attendanceThreshold: 80, stream: "PHARMACY" },
      { code: "ZZBPH2", regulator: "AICTE", attendanceThreshold: 75, stream: "PHARMACY" },
      { code: "ZZBTME", regulator: "AICTE", attendanceThreshold: 75, stream: "ENGINEERING" },
    ]);
    await expect(save("ZZLLB", { stream: "LAW" })).rejects.toMatchObject({ key: "streams.refuseNotOurs", status: 422 });
    await expect(save("ZZNONE", {})).rejects.toMatchObject({ key: "streams.refuseNoRegulator", status: 422 });
  });
});

describe("duties", () => {
  it("are set by the registrar within what the streams offer, once in the audit log, and refused elsewhere", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.college, null);
    // A pharmacy college offers the clinical coordinator since its desk is built (R-56, 10 Oct 2026); the studio
    // coordinator stays unoffered here (architecture's alone), which the refusals below rely on.
    expect(await offeredDuties(ids.college)).toEqual(["LAB_INCHARGE", "CLINICAL_COORDINATOR", "NSS_OFFICER", "NCC_OFFICER", "ANTI_RAGGING_SQUAD", "RESEARCH_DEAN", "EXAM_SQUAD"]);
    const set = await setDuties(admin, ids.facultyM, ["ANTI_RAGGING_SQUAD", "LAB_INCHARGE"]);
    expect(set).toMatchObject({ role: "FACULTY", duties: ["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"] });
    await setDuties(admin, ids.facultyM, ["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"]);
    expect(await db.auditLog.count({ where: { action: "people.duties.set", targetId: ids.facultyM } })).toBe(1);
    await expect(setDuties(admin, ids.faculty2M, ["STUDIO_COORDINATOR"])).rejects.toMatchObject({ key: "duties.refuseNotOffered" });
    await expect(setDuties(admin, ids.studentM, ["LAB_INCHARGE"])).rejects.toMatchObject({ key: "duties.refuseNotTeacher" });
    await expect(setDuties({ ...admin, role: "PRINCIPAL" }, ids.faculty2M, [])).rejects.toBeInstanceOf(AccessError);
    expect(actionKey("people.duties.set")).toBe("audit.peopleDutiesSet");
    // Through the door: a duty the streams do not offer is a 422 on the field.
    await as(ids.admin, "ADMIN", ids.college, `POST /api/v1/admin/people/${ids.faculty2M}/duties`);
    const refused = await dutiesPost(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ duties: ["STUDIO_COORDINATOR"] }) }), { params: Promise.resolve({ membershipId: ids.faculty2M }) });
    expect(refused.status).toBe(422);
    const cleared = await dutiesPost(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ duties: [] }) }), { params: Promise.resolve({ membershipId: ids.faculty2M }) });
    expect(cleared.status).toBe(200);
  });

  it("open a duty's door to a FACULTY or HOD only holding it, at the gate, in permits and on the page", async () => {
    const door = endpointFor("GET", "/api/v1/duties/anti-ragging")!;
    expect(door.duties).toEqual(["ANTI_RAGGING_SQUAD"]);
    await expect(gateRequest(REGISTER, { role: "FACULTY", schoolId: ids.college, duties: [] })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    await expect(gateRequest(REGISTER, { role: "FACULTY", schoolId: ids.college, duties: ["LAB_INCHARGE"] })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest(REGISTER, { role: "FACULTY", schoolId: ids.college, duties: ["ANTI_RAGGING_SQUAD"] })).resolves.toBe("pass");
    await expect(gateRequest(REGISTER, { role: "HOD", schoolId: ids.college })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest(REGISTER, { role: "STUDENT", schoolId: ids.college })).resolves.toBe("pass"); // the older roles are the handler's to refuse (below)
    // The API sweep's expected() is `permits` with the actor's duties (actorPermits in scripts/api-sweep.ts).
    expect(permits(door, "FACULTY", ["ANTI_RAGGING_SQUAD"])).toBe(true);
    expect(permits(door, "FACULTY")).toBe(false);
    expect(permits(door, "HOD", ["LAB_INCHARGE"])).toBe(false);
    expect(permits(door, "ADMIN")).toBe(true);
    expect(permits(door, "STUDENT", ["ANTI_RAGGING_SQUAD"])).toBe(false);
    const sweep = readFileSync(join(process.cwd(), "scripts", "api-sweep.ts"), "utf8");
    expect(sweep).toContain("permits(e, role, dutiesOf[role] ?? [])");
    expect(sweep).toMatch(/const permitted = actorPermits\(e, role\)/);
    // The page: the NAV entry carries the duty.
    const on = await enabledModules(ids.college);
    expect(modulePagePermitted("FACULTY", "/duties/anti-ragging", on, ["ANTI_RAGGING_SQUAD"])).toBe(true);
    expect(modulePagePermitted("FACULTY", "/duties/anti-ragging", on, [])).toBe(false);
    expect(modulePagePermitted("HOD", "/duties/anti-ragging", on, ["LAB_INCHARGE"])).toBe(false);
  });

  it("serve the anti-ragging register to the squad member, the office and nobody else, with a complaint's state and never its words", async () => {
    const faculty = await as(ids.faculty, "FACULTY", ids.college, REGISTER);
    expect(await myDuties(faculty)).toEqual(["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"]);
    expect(await hasDuty(faculty, "ANTI_RAGGING_SQUAD")).toBe(true);
    await expect(requireDuty(faculty, "NSS_OFFICER")).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    const res = await registerGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    const register = antiRaggingRegisterSchema.parse(body);
    expect(register.complaints).toEqual([expect.objectContaining({ id: ids.grievance, status: "OPEN", dueOn: "2026-10-01", overdue: true })]);
    expect(register.hostelOn).toBe(false);
    expect(JSON.stringify(body)).not.toContain("secret words");
    expect(JSON.stringify(body)).not.toContain("ZZ Streams Student");

    for (const [userId, role] of [[ids.faculty2, "FACULTY"], [ids.hod, "HOD"], [ids.student, "STUDENT"]] as const) {
      await as(userId, role, ids.college, REGISTER);
      expect({ role, status: (await registerGet()).status }).toEqual({ role, status: 403 });
    }
    await as(ids.admin, "ADMIN", ids.college, REGISTER);
    expect((await registerGet()).status).toBe(200);
  });
});

describe("/api/v1/me", () => {
  it("carries the college's streams and the membership's duties", async () => {
    await as(ids.faculty, "FACULTY", ids.college, "GET /api/v1/me");
    const me = meSchema.parse(await (await meGet()).json());
    expect(me.streams).toEqual(["ENGINEERING", "PHARMACY"] satisfies StreamCode[]);
    expect(me.duties).toEqual(["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"]);
    await as(ids.student, "STUDENT", ids.college, "GET /api/v1/me");
    const student = meSchema.parse(await (await meGet()).json());
    expect(student.streams).toEqual(["ENGINEERING", "PHARMACY"]);
    expect(student.duties).toEqual([]);
  });
});

