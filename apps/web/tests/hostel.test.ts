/**
 * The hostel module (module HOSTEL, role WARDEN; 3 October 2026), through
 * its /api/v1 doors with primed sessions, at two ZZ schools of this suite's
 * own: Hall has the hostel on, Plain keeps it off.
 *
 * What is proved: every door answers MODULE_OFF where the hostel is off (a
 * guardian's too); a pupil holds one bed and a bed one pupil; a minor's own
 * ask for leave waits for a guardian before the warden may decide it, a
 * guardian's own ask is their consent, a pupil of age needs nobody's; the
 * gate's late return is flagged to the wardens, the office and the family;
 * a roll call is taken once per slot, its replay is the same call, and an
 * absent boarder's guardians are told; a guardian reads their own child's
 * room and leave and nobody else's; the visitor book, the menu, the hostel's
 * incidents in the school's log, and the warden's read of a health card,
 * which the family sees.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError } from "@/lib/tenancy";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { translator } from "@/lib/i18n/dictionary";
import { gateIn, listLeave, messSheet } from "@/lib/hostel";
import { listIncidents } from "@/lib/incidents";
import { GET as hostelsGet, POST as hostelsPost } from "@/app/api/v1/hostel/hostels/route";
import { POST as roomsPost } from "@/app/api/v1/hostel/rooms/route";
import { POST as allotPost } from "@/app/api/v1/hostel/allotments/route";
import { POST as endPost } from "@/app/api/v1/hostel/allotments/[allotmentId]/end/route";
import { GET as rollGet, POST as rollPost } from "@/app/api/v1/hostel/rollcall/route";
import { GET as leaveGet } from "@/app/api/v1/hostel/leave/route";
import { POST as decidePost } from "@/app/api/v1/hostel/leave/[leaveId]/decide/route";
import { POST as outPost } from "@/app/api/v1/hostel/leave/[leaveId]/out/route";
import { GET as visitorsGet, POST as visitorsPost } from "@/app/api/v1/hostel/visitors/route";
import { POST as visitorOutPost } from "@/app/api/v1/hostel/visitors/[visitorId]/out/route";
import { GET as menuGet, POST as menuPost } from "@/app/api/v1/hostel/menu/route";
import { POST as messPost } from "@/app/api/v1/hostel/mess/route";
import { GET as incidentsGet, POST as incidentsPost } from "@/app/api/v1/hostel/incidents/route";
import { GET as healthGet } from "@/app/api/v1/hostel/boarders/[allotmentId]/health/route";
import { GET as overviewGet } from "@/app/api/v1/hostel/overview/route";
import { GET as familyGet } from "@/app/api/v1/family/hostel/route";
import { POST as askPost } from "@/app/api/v1/family/hostel/leave/route";
import { POST as consentPost } from "@/app/api/v1/family/hostel/leave/[leaveId]/consent/route";
import { POST as cancelPost } from "@/app/api/v1/family/hostel/leave/[leaveId]/cancel/route";
import { GET as readsGet } from "@/app/api/v1/family/students/[membershipId]/health/reads/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { hall: "", plain: "", admin: "", warden: "", wardenM: "", principal: "", parent: "", stranger: "", plainAdmin: "", p1: "", p2: "", p3: "", p1User: "", p2User: "", hostel: "", room1: "", room2: "", a1: "", a2: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
type Who = "ADMIN" | "WARDEN" | "PRINCIPAL" | "PARENT" | "STRANGER" | "PLAIN_ADMIN" | "PUPIL1" | "PUPIL2";
async function as(who: Who) {
  __resetCookies();
  __setHeaders({});
  const at: Record<Who, [string, string | null, string]> = {
    ADMIN: [ids.admin, ids.hall, "ADMIN"],
    WARDEN: [ids.warden, ids.hall, "WARDEN"],
    PRINCIPAL: [ids.principal, ids.hall, "PRINCIPAL"],
    PARENT: [ids.parent, null, "PARENT"],
    STRANGER: [ids.stranger, null, "PARENT"],
    PLAIN_ADMIN: [ids.plainAdmin, ids.plain, "ADMIN"],
    PUPIL1: [ids.p1User, ids.hall, "STUDENT"],
    PUPIL2: [ids.p2User, ids.hall, "STUDENT"],
  };
  const [userId, schoolId, role] = at[who];
  await createSession(userId, { schoolId, role: role as never });
}
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
const today = () => todayKey("Asia/Kolkata");
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ Hostel ${tag} ${STAMP}`, slug: `zz-hos-${tag.toLowerCase()}-${STAMP}`, code: `ZH${tag[0]}${SUFFIX}`, contactEmail: `zz-hos-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.hall = (await mkSchool("Hall")).id;
  ids.plain = (await mkSchool("Plain")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.hall, module: "HOSTEL" }, { schoolId: ids.plain, module: "ALUMNI" }] });
  const mk = (who: string, minor = false) => db.user.create({ data: { name: `ZZ Hos ${who}`, email: `zz-hos-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: minor }, select: { id: true } });
  const [admin, warden, principal, parent, stranger, plainAdmin, u1, u2, u3, u4] = await Promise.all([mk("Admin"), mk("Warden"), mk("Principal"), mk("Parent"), mk("Stranger"), mk("PlainAdmin"), mk("Pupil1", true), mk("Pupil2", false), mk("Pupil3", true), mk("Pupil4", true)]);
  Object.assign(ids, { admin: admin.id, warden: warden.id, principal: principal.id, parent: parent.id, stranger: stranger.id, plainAdmin: plainAdmin.id, p1User: u1.id, p2User: u2.id });
  await db.membership.createMany({
    data: [
      { userId: admin.id, schoolId: ids.hall, role: "ADMIN", status: "ACTIVE" },
      { userId: principal.id, schoolId: ids.hall, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: plainAdmin.id, schoolId: ids.plain, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  ids.wardenM = (await db.membership.create({ data: { userId: warden.id, schoolId: ids.hall, role: "WARDEN", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = (u: string, n: number, schoolId = ids.hall) => db.membership.create({ data: { userId: u, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZHP${n}${STAMP}` }, select: { id: true } });
  ids.p1 = (await pupil(u1.id, 1)).id;
  ids.p2 = (await pupil(u2.id, 2)).id;
  ids.p3 = (await pupil(u3.id, 3)).id;
  const plainChild = await pupil(u4.id, 4, ids.plain);
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.p1, studentSchoolId: ids.hall, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: stranger.id, studentMembershipId: plainChild.id, studentSchoolId: ids.plain, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.hall, ids.plain] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.hall, ids.plain] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the module switch", () => {
  it("answers MODULE_OFF at a school with the hostel off, for the office and for a guardian whose child is there", async () => {
    await as("PLAIN_ADMIN");
    const res = await hostelsGet();
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
    await as("STRANGER");
    const fam = await familyGet(get("/api/v1/family/hostel"));
    expect(fam.status).toBe(403);
    expect((await body(fam)).code).toBe("MODULE_OFF");
    await expect(gateRequest("GET /api/v1/hostel/leave", { role: "ADMIN", schoolId: ids.plain })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/hostel/leave", { role: "WARDEN", schoolId: ids.hall })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/library/titles", { role: "WARDEN", schoolId: ids.hall })).rejects.toBeInstanceOf(AccessError);
  });
});

describe("houses, rooms and beds", () => {
  it("are made by the office (the house) and the warden (rooms), and the head only reads", async () => {
    await as("WARDEN");
    expect((await hostelsPost(json("/x", { name: "ZZ Tilak House", kind: "BOYS", capacity: 6 }))).status).toBe(403);
    await as("ADMIN");
    const made = await body<{ hostels: { id: string; name: string }[] }>(await hostelsPost(json("/x", { name: "ZZ Tilak House", kind: "BOYS", capacity: 6, wardenMembershipId: ids.wardenM })));
    ids.hostel = made.hostels[0]!.id;
    expect((await hostelsPost(json("/x", { name: "ZZ Tilak House", kind: "GIRLS", capacity: 2 }))).status).toBe(403);
    await as("WARDEN");
    const r1 = await body<{ hostels: { rooms: { id: string; number: string }[] }[] }>(await roomsPost(json("/x", { hostelId: ids.hostel, number: "101", floor: "1", beds: 2, kind: "SHARED" })));
    ids.room1 = r1.hostels[0]!.rooms.find((r) => r.number === "101")!.id;
    const r2 = await body<{ hostels: { rooms: { id: string; number: string }[]; wardenName: string }[] }>(await roomsPost(json("/x", { hostelId: ids.hostel, number: "102", floor: "1", beds: 2 })));
    ids.room2 = r2.hostels[0]!.rooms.find((r) => r.number === "102")!.id;
    expect(r2.hostels[0]!.wardenName).toBe("ZZ Hos Warden");
    await as("PRINCIPAL");
    expect((await hostelsGet()).status).toBe(200);
    expect((await roomsPost(json("/x", { hostelId: ids.hostel, number: "103", beds: 1 }))).status).toBe(403);
  });

  it("gives a pupil one bed and a bed one pupil", async () => {
    await as("WARDEN");
    const from = today();
    const a1 = await allotPost(json("/x", { membershipId: ids.p1, roomId: ids.room1, bed: 1, fromDate: from }));
    expect(a1.status).toBe(200);
    ids.a1 = (await body<{ allotmentId: string }>(a1)).allotmentId;
    expect((await allotPost(json("/x", { membershipId: ids.p1, roomId: ids.room2, bed: 1, fromDate: from }))).status).toBe(403);
    expect((await allotPost(json("/x", { membershipId: ids.p3, roomId: ids.room1, bed: 1, fromDate: from }))).status).toBe(403);
    expect((await allotPost(json("/x", { membershipId: ids.p3, roomId: ids.room1, bed: 3, fromDate: from }))).status).toBe(403);
    ids.a2 = (await body<{ allotmentId: string }>(await allotPost(json("/x", { membershipId: ids.p2, roomId: ids.room1, bed: 2, fromDate: from })))).allotmentId;
    // A room cannot shrink under a boarder.
    expect((await roomsPost(json("/x", { id: ids.room1, hostelId: ids.hostel, number: "101", beds: 1 }))).status).toBe(403);
    // Pupil 3 in room 2, then out again: the bed and the pupil are free.
    const a3 = await body<{ allotmentId: string }>(await allotPost(json("/x", { membershipId: ids.p3, roomId: ids.room2, bed: 1, fromDate: from })));
    expect((await endPost(json("/x", { toDate: addDaysToKey(from, -1) }), params("allotmentId", a3.allotmentId))).status).toBe(403);
    expect((await body<{ toDate: string }>(await endPost(json("/x", { toDate: from }), params("allotmentId", a3.allotmentId)))).toDate).toBe(from);
    const again = await allotPost(json("/x", { membershipId: ids.p3, roomId: ids.room2, bed: 1, fromDate: from }));
    expect(again.status).toBe(200);
    await endPost(json("/x", { toDate: from }), params("allotmentId", (await body<{ allotmentId: string }>(again)).allotmentId));
  });
});

describe("leave", () => {
  it("needs a guardian's consent for a minor's own ask before the warden may decide it", async () => {
    await as("PUPIL1");
    const ask = await askPost(json("/x", { kind: "HOME", fromAt: inHours(1), toAt: inHours(30), destination: "ZZ Home, Pune", reason: "ZZ cousin's wedding" }));
    expect(ask.status).toBe(200);
    const leave = await body<{ id: string; status: string; isMinor: boolean }>(ask);
    expect(leave).toMatchObject({ status: "AWAITING_CONSENT", isMinor: true });
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "hostel.notifConsentTitle" } })).toBe(1);
    await as("WARDEN");
    const early = await decidePost(json("/x", { approve: true }), params("leaveId", leave.id));
    expect(early.status).toBe(403);
    // A stranger may not answer for somebody else's child.
    await as("STRANGER");
    expect((await consentPost(json("/x", { approve: true }), params("leaveId", leave.id))).status).toBe(404);
    await as("PARENT");
    expect((await body(await consentPost(json("/x", { approve: true }), params("leaveId", leave.id)))).status).toBe("PENDING");
    expect((await body(await consentPost(json("/x", { approve: true }), params("leaveId", leave.id)))).status).toBe("PENDING");
    await as("WARDEN");
    const approved = await body<{ status: string; consentByName: string }>(await decidePost(json("/x", { approve: true, note: "ZZ back by Sunday" }), params("leaveId", leave.id)));
    expect(approved).toMatchObject({ status: "APPROVED", consentByName: "ZZ Hos Parent" });
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "hostel.notifLeaveApproved" } })).toBe(1);
    // Not out before the leave begins (QA-45): it starts in an hour, past the quarter-hour's grace. Before the fix: 200.
    const tooEarly = await outPost(json("/x", {}), params("leaveId", leave.id));
    expect(tooEarly.status).toBe(403);
    expect((await body<{ error: string }>(tooEarly)).error).toBe(translator("en")("hostel.refuseOutEarly"));
    expect((await db.hostelLeave.findUniqueOrThrow({ where: { id: leave.id } })).outAt).toBeNull();
    // Ten minutes before the start is within the grace.
    await db.hostelLeave.update({ where: { id: leave.id }, data: { fromAt: new Date(Date.now() + 10 * 60_000) } });
    // Out at the gate, and back after the leave ended: late, told to the wardens, the office and the family.
    expect((await body(await outPost(json("/x", {}), params("leaveId", leave.id)))).outAt).not.toBeNull();
    const warden = (await getSession())!;
    const back = await gateIn(warden, leave.id, new Date(Date.now() + 31 * 3_600_000));
    expect(back.late).toBe(true);
    expect(await db.notification.count({ where: { userId: ids.admin, titleKey: "hostel.notifLateTitle" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "hostel.notifLateTitle" } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.hall, action: "hostel.leave.approve", targetId: leave.id } })).toBe(1);
  });

  it("takes a guardian's own ask as their consent, and a pupil of age needs nobody's", async () => {
    await as("PARENT");
    const byParent = await body<{ id: string; status: string; consentAt: string | null }>(await askPost(json("/x", { childId: ids.p1, kind: "LOCAL", fromAt: inHours(2), toAt: inHours(5), destination: "ZZ Dentist" })));
    expect(byParent.status).toBe("PENDING");
    expect(byParent.consentAt).not.toBeNull();
    expect((await cancelPost(json("/x", {}), params("leaveId", byParent.id))).status).toBe(200);
    await as("PUPIL2");
    const adult = await body<{ status: string }>(await askPost(json("/x", { kind: "MEDICAL", fromAt: inHours(2), toAt: inHours(4), destination: "ZZ Clinic" })));
    expect(adult.status).toBe("PENDING");
    expect((await askPost(json("/x", { kind: "HOME", fromAt: inHours(5), toAt: inHours(2), destination: "ZZ" }))).status).toBe(422);
    await as("WARDEN");
    const open = await body<{ items: { status: string }[] }>(await leaveGet(get("/api/v1/hostel/leave?status=OPEN")));
    expect(open.items.map((l) => l.status)).toContain("PENDING");
    expect(open.items.map((l) => l.status)).not.toContain("CANCELLED");
  });
});

describe("roll call", () => {
  it("is taken once per slot; the same sheet replayed is the same call; an absent boarder's guardians are told", async () => {
    await as("WARDEN");
    const sheet = await body<{ taken: unknown; entries: { allotmentId: string; status: string }[] }>(await rollGet(get(`/api/v1/hostel/rollcall?hostelId=${ids.hostel}&slot=NIGHT`)));
    expect(sheet.taken).toBeNull();
    expect(sheet.entries.map((e) => e.allotmentId).sort()).toEqual([ids.a1, ids.a2].sort());
    const take = { hostelId: ids.hostel, dateKey: today(), slot: "NIGHT", clientId: `zz-roll-${STAMP}`, entries: [{ allotmentId: ids.a1, status: "ABSENT" }, { allotmentId: ids.a2, status: "PRESENT" }] };
    const first = await body<{ rollCallId: string; absent: number; replay: boolean }>(await rollPost(json("/x", take)));
    expect(first).toMatchObject({ absent: 1, replay: false });
    const replay = await body<{ rollCallId: string; replay: boolean }>(await rollPost(json("/x", take)));
    expect(replay).toMatchObject({ rollCallId: first.rollCallId, replay: true });
    const other = await rollPost(json("/x", { ...take, clientId: `zz-roll-other-${STAMP}` }));
    expect(other.status).toBe(403);
    expect(await db.hostelRollCall.count({ where: { hostelId: ids.hostel } })).toBe(1);
    const told = await db.notification.findFirst({ where: { userId: ids.parent, titleKey: "hostel.notifAbsentTitle" }, select: { kind: true } });
    expect(told?.kind).toBe("ATTENDANCE");
    // Tomorrow's call is refused today; a stranger to the hostel is refused on the sheet.
    expect((await rollPost(json("/x", { ...take, dateKey: addDaysToKey(today(), 1), clientId: `zz-roll-t-${STAMP}` }))).status).toBe(403);
    expect((await rollPost(json("/x", { ...take, slot: "MORNING", clientId: `zz-roll-m-${STAMP}`, entries: [{ allotmentId: ids.hostel, status: "PRESENT" }] }))).status).toBe(403);
    const taken = await body<{ taken: { byName: string }; entries: { allotmentId: string; status: string }[] }>(await rollGet(get(`/api/v1/hostel/rollcall?hostelId=${ids.hostel}&slot=NIGHT`)));
    expect(taken.taken.byName).toBe("ZZ Hos Warden");
    expect(taken.entries.find((e) => e.allotmentId === ids.a1)?.status).toBe("ABSENT");
  });
});

describe("the family", () => {
  it("reads their own child's room, tonight's roll call, leave and menu — and nobody else's", async () => {
    await as("WARDEN");
    const menu = [1, 2, 3, 4, 5, 6, 7].flatMap((weekday) => [{ weekday, meal: "DINNER", items: "ZZ Dal, rice" }, { weekday, meal: "BREAKFAST", items: "" }]);
    const saved = await body<{ hostels: { entries: unknown[] }[] }>(await menuPost(json("/x", { hostelId: ids.hostel, entries: menu })));
    expect(saved.hostels[0]!.entries).toHaveLength(7);
    await as("PARENT");
    const fam = await body<{ child: { membershipId: string }; allotment: { roomNumber: string; bed: number; wardenName: string }; tonight: { status: string }; leave: unknown[]; menuToday: { meal: string; items: string }[]; canConsent: boolean }>(await familyGet(get(`/api/v1/family/hostel?childId=${ids.p1}`)));
    expect(fam.child.membershipId).toBe(ids.p1);
    expect(fam.allotment).toMatchObject({ roomNumber: "101", bed: 1, wardenName: "ZZ Hos Warden" });
    expect(fam.tonight.status).toBe("ABSENT");
    expect(fam.leave.length).toBe(2);
    expect(fam.menuToday).toEqual([{ meal: "DINNER", items: "ZZ Dal, rice" }]);
    expect(fam.canConsent).toBe(true);
    expect((await familyGet(get(`/api/v1/family/hostel?childId=${ids.p2}`))).status).toBe(404);
    expect((await body<{ hostels: unknown[] }>(await menuGet(get("/api/v1/hostel/menu")))).hostels).toHaveLength(1);
    await as("STRANGER");
    expect((await familyGet(get(`/api/v1/family/hostel?childId=${ids.p1}`))).status).toBe(404);
    await as("PUPIL2");
    const own = await body<{ child: { membershipId: string }; canConsent: boolean }>(await familyGet(get("/api/v1/family/hostel")));
    expect(own.child.membershipId).toBe(ids.p2);
    expect(own.canConsent).toBe(false);
  });
});

describe("the warden's book", () => {
  it("signs visitors in and out", async () => {
    await as("WARDEN");
    const v = await body<{ items: { id: string; outAt: string | null; name: string }[] }>(await visitorsPost(json("/x", { allotmentId: ids.a1, name: "ZZ Uncle", relation: "uncle" })));
    const visitor = v.items.find((x) => x.name === "ZZ Uncle")!;
    expect(visitor.outAt).toBeNull();
    const out = await body<{ items: { id: string; outAt: string | null }[] }>(await visitorOutPost(json("/x", {}), params("visitorId", visitor.id)));
    expect(out.items.find((x) => x.id === visitor.id)?.outAt).not.toBeNull();
    expect((await body<{ items: unknown[] }>(await visitorsGet(get("/x")))).items.length).toBe(1);
  });

  it("refuses mess attendance where the house does not keep it", async () => {
    await as("WARDEN");
    expect((await messPost(json("/x", { hostelId: ids.hostel, dateKey: today(), meal: "DINNER", entries: [{ allotmentId: ids.a1, present: true }] }))).status).toBe(403);
  });

  it("records a boarder's incident in the school's own log, tagged with the hostel", async () => {
    await as("WARDEN");
    const list = await body<{ items: { title: string; hostelName: string }[] }>(await incidentsPost(json("/x", { allotmentId: ids.a1, kind: "ILLNESS", title: "ZZ Fever at night", body: "ZZ 101°F at 23:00.", actionTaken: "ZZ Paracetamol, the doctor called." })));
    expect(list.items[0]).toMatchObject({ title: "ZZ Fever at night", hostelName: "ZZ Tilak House" });
    await as("ADMIN");
    const office = (await getSession())!;
    const log = await listIncidents(office, { status: "OPEN", page: 1 });
    expect(JSON.stringify(log)).toContain("ZZ Fever at night");
    expect((await incidentsGet()).status).toBe(200);
  });

  it("reads a boarder's health card for the warden, and the family sees that the warden read it", async () => {
    await db.healthCard.create({ data: { schoolId: ids.hall, studentMembershipId: ids.p1, allergies: "ZZ Peanuts", contactsJson: "[]" } });
    await as("WARDEN");
    const h = await body<{ allergies: string; hasCard: boolean }>(await healthGet(get("/x"), params("allotmentId", ids.a1)));
    expect(h).toMatchObject({ allergies: "ZZ Peanuts", hasCard: true });
    await as("ADMIN");
    expect((await healthGet(get("/x"), params("allotmentId", ids.a1))).status).toBe(403);
    await as("PARENT");
    const reads = await body<{ reads: { readerRole: string; readerName: string }[] }>(await readsGet(get("/x"), params("membershipId", ids.p1)));
    expect(reads.reads[0]).toMatchObject({ readerRole: "WARDEN", readerName: "ZZ Hos Warden" });
  });

  it("gives the office its overview", async () => {
    await as("ADMIN");
    const o = await body<{ hostels: { beds: number; occupied: number }[]; absentees: { name: string }[]; lateReturns: unknown[]; visitorsToday: number; pendingLeave: number }>(await overviewGet());
    expect(o.hostels[0]).toMatchObject({ beds: 4, occupied: 2 });
    expect(o.absentees.map((a) => a.name)).toEqual(["ZZ Hos Pupil1"]);
    expect(o.lateReturns).toHaveLength(1);
    expect(o.visitorsToday).toBe(1);
    expect(o.pendingLeave).toBe(1);
    const today_ = await listLeave((await getSession())!, "TODAY");
    expect(Array.isArray(today_.items)).toBe(true);
  });
});

describe("mess attendance", () => {
  it("is kept only where the office switched it on for the house, and marking again overwrites the meal", async () => {
    await as("ADMIN");
    await hostelsPost(json("/x", { id: ids.hostel, name: "ZZ Tilak House", kind: "BOYS", capacity: 6, wardenMembershipId: ids.wardenM, messAttendance: true }));
    await as("WARDEN");
    const day = today();
    expect((await body<{ saved: number }>(await messPost(json("/x", { hostelId: ids.hostel, dateKey: day, meal: "DINNER", entries: [{ allotmentId: ids.a1, present: true }, { allotmentId: ids.a2, present: false }] })))).saved).toBe(2);
    await messPost(json("/x", { hostelId: ids.hostel, dateKey: day, meal: "DINNER", entries: [{ allotmentId: ids.a2, present: true }] }));
    const sheet = await messSheet((await getSession())!, ids.hostel, day, "DINNER");
    expect(Object.fromEntries(sheet.map((r) => [r.allotmentId, r.present]))).toEqual({ [ids.a1]: true, [ids.a2]: true });
    expect((await messPost(json("/x", { hostelId: ids.hostel, dateKey: addDaysToKey(day, 1), meal: "DINNER", entries: [{ allotmentId: ids.a1, present: true }] }))).status).toBe(403);
  });
});
