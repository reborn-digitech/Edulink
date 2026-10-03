/**
 * The library module (module LIBRARY, role LIBRARIAN; 3 October 2026),
 * through its /api/v1 doors with primed sessions, at two ZZ schools of this
 * suite's own: Shelf has the library on, Bare keeps it off.
 *
 * What is proved: every door answers MODULE_OFF where the school has the
 * library off (a guardian's too); the catalogue refuses a second ISBN and a
 * taken accession; a member holds no more than their kind's limit and a copy
 * is lent once; a late return writes the overdue fine — a demand on the
 * pupil's ledger under the office's fine head, which a waiver (with its
 * reason, audited) waives with it, and a counter due for staff, which the
 * office alone records as settled; the queue is served in order and a held
 * copy goes to nobody else; renewals stop at the limit, at lateness and at a
 * queue; overdue notices and the "due tomorrow" push go once; the
 * stock-take counts what was seen; the import adds nothing the second time;
 * and a guardian reads their own child's library and nobody else's.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError } from "@/lib/tenancy";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { remindDueTomorrow, overdueFine, accessionsOf } from "@/lib/library";
import { normaliseIsbn } from "@edulink/contracts";
import { GET as settingsGet, POST as settingsPost } from "@/app/api/v1/library/settings/route";
import { GET as titlesGet, POST as titlesPost } from "@/app/api/v1/library/titles/route";
import { GET as titleGet } from "@/app/api/v1/library/titles/[titleId]/route";
import { POST as issuePost } from "@/app/api/v1/library/issues/route";
import { POST as returnPost } from "@/app/api/v1/library/returns/route";
import { POST as renewPost } from "@/app/api/v1/library/renewals/route";
import { GET as overdueGet } from "@/app/api/v1/library/overdue/route";
import { POST as noticesPost } from "@/app/api/v1/library/overdue/notices/route";
import { GET as queueGet, POST as reservePost } from "@/app/api/v1/library/reservations/route";
import { POST as cancelPost } from "@/app/api/v1/library/reservations/[reservationId]/cancel/route";
import { GET as finesGet } from "@/app/api/v1/library/fines/route";
import { POST as waivePost } from "@/app/api/v1/library/fines/[fineId]/waive/route";
import { POST as settlePost } from "@/app/api/v1/library/fines/[fineId]/settle/route";
import { GET as stockGet, POST as stockPost } from "@/app/api/v1/library/stocktake/route";
import { POST as seenPost } from "@/app/api/v1/library/stocktake/seen/route";
import { POST as importPost } from "@/app/api/v1/library/import/route";
import { GET as lookupGet } from "@/app/api/v1/library/lookup/route";
import { GET as membersGet } from "@/app/api/v1/library/members/route";
import { GET as reportsGet } from "@/app/api/v1/library/reports/route";
import { GET as mineGet } from "@/app/api/v1/library/mine/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { shelf: "", bare: "", admin: "", librarian: "", teacher: "", principal: "", parent: "", stranger: "", bareAdmin: "", p1: "", p2: "", p3: "", teacherM: "", p1User: "", head: "", year: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
type Who = "ADMIN" | "LIBRARIAN" | "TEACHER" | "PRINCIPAL" | "PARENT" | "STRANGER" | "BARE_ADMIN" | "PUPIL1" | "PUPIL2";
async function as(who: Who) {
  __resetCookies();
  __setHeaders({});
  const at = {
    ADMIN: [ids.admin, ids.shelf, "ADMIN"],
    LIBRARIAN: [ids.librarian, ids.shelf, "LIBRARIAN"],
    TEACHER: [ids.teacher, ids.shelf, "TEACHER"],
    PRINCIPAL: [ids.principal, ids.shelf, "PRINCIPAL"],
    PARENT: [ids.parent, null, "PARENT"],
    STRANGER: [ids.stranger, null, "PARENT"],
    BARE_ADMIN: [ids.bareAdmin, ids.bare, "ADMIN"],
    PUPIL1: [ids.p1User, ids.shelf, "STUDENT"],
    PUPIL2: ["", ids.shelf, "STUDENT"],
  } as const;
  const [userId, schoolId, role] = at[who];
  const uid = who === "PUPIL2" ? (await db.membership.findUniqueOrThrow({ where: { id: ids.p2 }, select: { userId: true } })).userId : userId;
  await createSession(uid, { schoolId, role: role as never });
}
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
const today = () => todayKey("Asia/Kolkata");

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ Library ${tag} ${STAMP}`, slug: `zz-lib-${tag.toLowerCase()}-${STAMP}`, code: `ZL${tag[0]}${SUFFIX}`, contactEmail: `zz-lib-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.shelf = (await mkSchool("Shelf")).id;
  ids.bare = (await mkSchool("Bare")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.shelf, module: "LIBRARY" }, { schoolId: ids.bare, module: "ALUMNI" }] });
  const mk = (who: string, minor = false) => db.user.create({ data: { name: `ZZ Lib ${who}`, email: `zz-lib-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: minor }, select: { id: true } });
  const [admin, librarian, teacher, principal, parent, stranger, bareAdmin, u1, u2, u3, u4] = await Promise.all([mk("Admin"), mk("Librarian"), mk("Teacher"), mk("Principal"), mk("Parent"), mk("Stranger"), mk("BareAdmin"), mk("Pupil1", true), mk("Pupil2", true), mk("Pupil3", true), mk("Pupil4", true)]);
  Object.assign(ids, { admin: admin.id, librarian: librarian.id, teacher: teacher.id, principal: principal.id, parent: parent.id, stranger: stranger.id, bareAdmin: bareAdmin.id, p1User: u1.id });
  await db.membership.createMany({
    data: [
      { userId: admin.id, schoolId: ids.shelf, role: "ADMIN", status: "ACTIVE" },
      { userId: librarian.id, schoolId: ids.shelf, role: "LIBRARIAN", status: "ACTIVE" },
      { userId: principal.id, schoolId: ids.shelf, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: bareAdmin.id, schoolId: ids.bare, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  ids.teacherM = (await db.membership.create({ data: { userId: teacher.id, schoolId: ids.shelf, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = (u: string, n: number, schoolId = ids.shelf) => db.membership.create({ data: { userId: u, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZLP${n}${STAMP}` }, select: { id: true } });
  ids.p1 = (await pupil(u1.id, 1)).id;
  ids.p2 = (await pupil(u2.id, 2)).id;
  ids.p3 = (await pupil(u3.id, 3)).id;
  const bareChild = await pupil(u4.id, 4, ids.bare);
  const klass = await db.class.create({ data: { schoolId: ids.shelf, name: `ZZ Lib 6A ${STAMP}`, gradeLevel: "6", joinCode: `ZLC${SUFFIX}` }, select: { id: true } });
  await db.enrollment.createMany({ data: [ids.p1, ids.p2, ids.p3].map((m) => ({ schoolId: ids.shelf, classId: klass.id, studentMembershipId: m, status: "ACTIVE" })) });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.p1, studentSchoolId: ids.shelf, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: stranger.id, studentMembershipId: bareChild.id, studentSchoolId: ids.bare, status: "ACTIVE" } });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.shelf, name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.head = (await db.feeHead.create({ data: { schoolId: ids.shelf, name: "Library fines", code: "LIB", kind: "OTHER" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.shelf, ids.bare] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.shelf, ids.bare] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the module switch", () => {
  it("answers MODULE_OFF at a school with the library off, for the office and for a guardian whose child is there", async () => {
    await as("BARE_ADMIN");
    const res = await titlesGet(get("/api/v1/library/titles"));
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
    await as("STRANGER");
    const mine = await mineGet(get("/api/v1/library/mine"));
    expect(mine.status).toBe(403);
    expect((await body(mine)).code).toBe("MODULE_OFF");
  });

  it("is the gate's too: a door of the library refuses a school with it off, and the librarian reaches no other module's door", async () => {
    await expect(gateRequest("GET /api/v1/library/titles", { role: "ADMIN", schoolId: ids.bare })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/library/titles", { role: "LIBRARIAN", schoolId: ids.shelf })).resolves.toBe("pass");
    await expect(gateRequest("POST /api/v1/library/issues", { role: "LIBRARIAN", schoolId: ids.shelf })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/hostel/hostels", { role: "LIBRARIAN", schoolId: ids.shelf })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/library/mine", { role: "LIBRARIAN", schoolId: ids.shelf })).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the catalogue", () => {
  it("keeps ISBNs and accessions unique, and only the desk adds to it", async () => {
    expect(normaliseIsbn("978-0-306-40615-7")).toBe("9780306406157");
    expect(normaliseIsbn("0-306-40615-2")).toBe("0306406152");
    expect(normaliseIsbn("978-0-306-40615-8")).toBeNull();
    await as("TEACHER");
    expect((await titlesPost(json("/api/v1/library/titles", { title: "ZZ Nope" }))).status).toBe(403);
    await as("LIBRARIAN");
    const made = await titlesPost(json("/api/v1/library/titles", { title: "ZZ Owls at Night", author: "ZZ A", isbn: "978-0-306-40615-7", copies: [{ accession: "ZL-1" }, { accession: "ZL-2", rack: "R1" }] }));
    expect(made.status).toBe(200);
    const view = await body<{ title: { id: string; isbn: string; copies: number; available: number }; copies: { accession: string }[] }>(made);
    expect(view.title.isbn).toBe("9780306406157");
    expect(view.title.copies).toBe(2);
    expect(view.title.available).toBe(2);
    expect(view.copies.map((c) => c.accession)).toEqual(["ZL-1", "ZL-2"]);
    expect((await titlesPost(json("/api/v1/library/titles", { title: "ZZ Owls again", isbn: "9780306406157" }))).status).toBe(403);
    const taken = await titlesPost(json("/api/v1/library/titles", { title: "ZZ Other", copies: [{ accession: "ZL-1" }] }));
    expect(taken.status).toBe(403);
    expect((await body(taken)).error).toContain("ZL-1");
    expect((await titlesPost(json("/api/v1/library/titles", { title: "ZZ Bad", isbn: "12345" }))).status).toBe(422);
    // A pupil finds it; the lookup reads a scanned accession.
    await as("PUPIL1");
    const found = await body<{ items: { title: string }[] }>(await titlesGet(get("/api/v1/library/titles?q=owls")));
    expect(found.items.map((t) => t.title)).toEqual(["ZZ Owls at Night"]);
    await as("LIBRARIAN");
    const look = await body<{ kind: string; copy: { status: string } }>(await lookupGet(get("/api/v1/library/lookup?code=zl-2")));
    expect(look.kind).toBe("COPY");
    expect(look.copy.status).toBe("AVAILABLE");
  });
});

async function newTitle(title: string, accessions: string[]): Promise<string> {
  await as("LIBRARIAN");
  const res = await titlesPost(json("/api/v1/library/titles", { title, copies: accessions.map((accession) => ({ accession })) }));
  expect(res.status).toBe(200);
  return (await body<{ title: { id: string } }>(res)).title.id;
}

describe("lending", () => {
  it("holds a pupil to their limit and lends a copy once", async () => {
    await newTitle("ZZ Limit One", ["ZLA-1", "ZLA-2", "ZLA-3"]);
    await as("ADMIN");
    expect((await settingsPost(json("/api/v1/library/settings", { pupilLimit: 2, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 200, fineHeadId: ids.head }))).status).toBe(200);
    await as("LIBRARIAN");
    expect((await settingsPost(json("/api/v1/library/settings", { pupilLimit: 9, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 200, fineHeadId: null }))).status).toBe(403);
    const one = await issuePost(json("/api/v1/library/issues", { accession: "ZLA-1", membershipId: ids.p2 }));
    expect(one.status).toBe(200);
    expect((await body<{ dueOn: string }>(one)).dueOn).toBe(addDaysToKey(today(), 14));
    expect((await issuePost(json("/api/v1/library/issues", { accession: "ZLA-1", membershipId: ids.p3 }))).status).toBe(403);
    expect((await issuePost(json("/api/v1/library/issues", { accession: "ZLA-2", membershipId: ids.p2 }))).status).toBe(200);
    const third = await issuePost(json("/api/v1/library/issues", { accession: "ZLA-3", membershipId: ids.p2 }));
    expect(third.status).toBe(403);
    expect((await body(third)).error).toContain("2");
    // Two desks at once on one book: one loan.
    const [a, b] = await Promise.all([issuePost(json("/api/v1/library/issues", { accession: "ZLA-3", membershipId: ids.p3 })), issuePost(json("/api/v1/library/issues", { accession: "ZLA-3", membershipId: ids.teacherM }))]);
    expect([a.status, b.status].sort()).toEqual([200, 403]);
    expect(await db.libraryIssue.count({ where: { copy: { accession: "ZLA-3", schoolId: ids.shelf }, returnedAt: null } })).toBe(1);
    // Back on the shelf, both ZLA-1 and ZLA-2 for the next test.
    expect((await returnPost(json("/api/v1/library/returns", { accession: "ZLA-1" }))).status).toBe(200);
    expect((await returnPost(json("/api/v1/library/returns", { accession: "ZLA-2" }))).status).toBe(200);
    expect((await returnPost(json("/api/v1/library/returns", { accession: "ZLA-3" }))).status).toBe(200);
    expect((await returnPost(json("/api/v1/library/returns", { accession: "ZLA-3" }))).status).toBe(403);
  });

  it("writes the overdue fine on a late return as a demand on the pupil's ledger, and a waiver with a reason waives both", async () => {
    expect(overdueFine("2026-10-01", "2026-10-04", 200)).toEqual({ days: 3, paise: 600 });
    expect(overdueFine("2026-10-04", "2026-10-01", 200)).toEqual({ days: 0, paise: 0 });
    await as("LIBRARIAN");
    const loan = await body<{ id: string }>(await issuePost(json("/api/v1/library/issues", { accession: "ZLA-1", membershipId: ids.p1 })));
    await db.libraryIssue.update({ where: { id: loan.id }, data: { dueOn: addDaysToKey(today(), -3) } });
    const overdue = await body<{ items: { id: string; overdueDays: number }[] }>(await overdueGet());
    expect(overdue.items.find((i) => i.id === loan.id)?.overdueDays).toBe(3);
    const back = await body<{ fine: { id: string; paise: number; reason: string; onLedger: boolean; status: string } }>(await returnPost(json("/api/v1/library/returns", { accession: "ZLA-1" })));
    expect(back.fine).toMatchObject({ paise: 600, reason: "OVERDUE", onLedger: true, status: "DUE" });
    const fine = await db.libraryFine.findUniqueOrThrow({ where: { id: back.fine.id }, select: { demandId: true } });
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: fine.demandId! } });
    expect(demand).toMatchObject({ studentMembershipId: ids.p1, academicYearId: ids.year, netPaise: 600, grossPaise: 600, status: "OPEN", instalmentId: null });
    expect(JSON.parse(demand.linesJson)[0]).toMatchObject({ headId: ids.head, code: "LIB" });
    expect((await waivePost(json("/x", {}), params("fineId", back.fine.id))).status).toBe(422);
    await as("TEACHER");
    expect((await waivePost(json("/x", { reason: "ZZ first time" }), params("fineId", back.fine.id))).status).toBe(403);
    await as("LIBRARIAN");
    const waived = await waivePost(json("/x", { reason: "ZZ first time" }), params("fineId", back.fine.id));
    expect((await body(waived)).status).toBe("WAIVED");
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: fine.demandId! } })).status).toBe("WAIVED");
    expect(await db.auditLog.count({ where: { schoolId: ids.shelf, action: "library.fine.waive", targetId: back.fine.id } })).toBe(1);
  });

  it("keeps a member of staff's fine as a counter due, which the office alone records as settled", async () => {
    await as("LIBRARIAN");
    const loan = await body<{ id: string }>(await issuePost(json("/api/v1/library/issues", { accession: "ZLA-2", membershipId: ids.teacherM })));
    await db.libraryIssue.update({ where: { id: loan.id }, data: { dueOn: addDaysToKey(today(), -1) } });
    const back = await body<{ fine: { id: string; onLedger: boolean; paise: number } }>(await returnPost(json("/api/v1/library/returns", { accession: "ZLA-2" })));
    expect(back.fine).toMatchObject({ onLedger: false, paise: 200 });
    expect((await settlePost(json("/x", {}), params("fineId", back.fine.id))).status).toBe(403);
    await as("ADMIN");
    expect((await body(await settlePost(json("/x", {}), params("fineId", back.fine.id)))).status).toBe("PAID");
    const dues = await body<{ items: { id: string }[] }>(await finesGet(get("/api/v1/library/fines")));
    expect(dues.items.map((f) => f.id)).not.toContain(back.fine.id);
  });

  it("serves the queue in order: a returned copy is held for the first, and lent to nobody else", async () => {
    const titleId = await newTitle("ZZ One Copy", ["ZLQ-1"]);
    await as("LIBRARIAN");
    expect((await issuePost(json("/api/v1/library/issues", { accession: "ZLQ-1", membershipId: ids.p3 }))).status).toBe(200);
    await as("PARENT");
    const first = await body<{ id: string; position: number; ready: boolean }>(await reservePost(json("/api/v1/library/reservations", { titleId, childId: ids.p1 })));
    expect(first).toMatchObject({ position: 1, ready: false });
    // Reserving again is the same place.
    expect((await body<{ id: string }>(await reservePost(json("/api/v1/library/reservations", { titleId, childId: ids.p1 })))).id).toBe(first.id);
    await as("PUPIL2");
    const second = await body<{ id: string; position: number }>(await reservePost(json("/api/v1/library/reservations", { titleId })));
    expect(second.position).toBe(2);
    // Renewing while others wait is refused.
    await as("LIBRARIAN");
    const loan = await db.libraryIssue.findFirstOrThrow({ where: { copy: { accession: "ZLQ-1", schoolId: ids.shelf }, returnedAt: null }, select: { id: true } });
    expect((await renewPost(json("/api/v1/library/renewals", { issueId: loan.id }))).status).toBe(403);
    const back = await body<{ heldFor: { memberName: string } | null }>(await returnPost(json("/api/v1/library/returns", { accession: "ZLQ-1" })));
    expect(back.heldFor?.memberName).toBe("ZZ Lib Pupil1");
    const refused = await issuePost(json("/api/v1/library/issues", { accession: "ZLQ-1", membershipId: ids.p2 }));
    expect(refused.status).toBe(403);
    expect((await body(refused)).error).toContain("ZZ Lib Pupil1");
    const queue = await body<{ items: { id: string; ready: boolean }[] }>(await queueGet());
    expect(queue.items.find((r) => r.id === first.id)?.ready).toBe(true);
    // The family was told it is ready.
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "library.notifReadyTitle" } })).toBeGreaterThan(0);
    expect((await issuePost(json("/api/v1/library/issues", { accession: "ZLQ-1", membershipId: ids.p1 }))).status).toBe(200);
    expect((await db.libraryReservation.findUniqueOrThrow({ where: { id: first.id } })).fulfilledAt).not.toBeNull();
    await returnPost(json("/api/v1/library/returns", { accession: "ZLQ-1" }));
    expect((await db.libraryReservation.findUniqueOrThrow({ where: { id: second.id } })).readyCopyId).not.toBeNull();
    // The pupil leaves the queue; the held copy goes back on the shelf.
    await as("PUPIL2");
    expect((await body(await cancelPost(json("/x", {}), params("reservationId", second.id)))).ready).toBe(false);
    await as("LIBRARIAN");
    const view = await body<{ title: { available: number; waiting: number } }>(await titleGet(get(`/api/v1/library/titles/${titleId}`), params("titleId", titleId)));
    expect(view.title).toMatchObject({ available: 1, waiting: 0 });
  });

  it("renews within the school's limit, and never a late loan", async () => {
    await newTitle("ZZ Renewable", ["ZLR-1"]);
    await as("LIBRARIAN");
    const loan = await body<{ id: string }>(await issuePost(json("/api/v1/library/issues", { accession: "ZLR-1", membershipId: ids.p3 })));
    const renewed = await body<{ renewedCount: number; dueOn: string }>(await renewPost(json("/api/v1/library/renewals", { issueId: loan.id })));
    expect(renewed.renewedCount).toBe(1);
    expect((await renewPost(json("/api/v1/library/renewals", { issueId: loan.id }))).status).toBe(403);
    await db.libraryIssue.update({ where: { id: loan.id }, data: { renewedCount: 0, dueOn: addDaysToKey(today(), -1) } });
    const late = await renewPost(json("/api/v1/library/renewals", { issueId: loan.id }));
    expect(late.status).toBe(403);
    await db.libraryIssue.update({ where: { id: loan.id }, data: { dueOn: addDaysToKey(today(), 5) } });
  });
});

describe("notices", () => {
  it("tells an overdue borrower and their guardians once a day", async () => {
    await newTitle("ZZ Late Again", ["ZLN-1"]);
    await as("LIBRARIAN");
    const loan = await body<{ id: string }>(await issuePost(json("/api/v1/library/issues", { accession: "ZLN-1", membershipId: ids.p1 })));
    await db.libraryIssue.update({ where: { id: loan.id }, data: { dueOn: addDaysToKey(today(), -2) } });
    const first = await body<{ sent: number; already: number }>(await noticesPost());
    expect(first.sent).toBeGreaterThanOrEqual(1);
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "library.notifOverdueTitle" } })).toBe(1);
    const again = await body<{ sent: number; already: number }>(await noticesPost());
    expect(again.sent).toBe(0);
    expect(again.already).toBe(first.sent);
    await returnPost(json("/api/v1/library/returns", { accession: "ZLN-1" }));
  });

  it("pushes 'due tomorrow' once, at schools with the library on", async () => {
    await as("LIBRARIAN");
    const loan = await body<{ id: string }>(await issuePost(json("/api/v1/library/issues", { accession: "ZLN-1", membershipId: ids.teacherM })));
    await db.libraryIssue.update({ where: { id: loan.id }, data: { dueOn: addDaysToKey(today(), 1) } });
    const run = await remindDueTomorrow(new Date(), { schoolId: ids.shelf });
    expect(run.sent).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.teacher, titleKey: "library.notifDueTitle" } })).toBe(1);
    expect((await remindDueTomorrow(new Date(), { schoolId: ids.shelf })).sent).toBe(0);
    expect((await remindDueTomorrow(new Date(), { schoolId: ids.bare })).sent).toBe(0);
  });
});

describe("the stock-take, the import and the reports", () => {
  it("counts the copies seen since it started", async () => {
    await as("LIBRARIAN");
    expect((await seenPost(json("/x", { accession: "ZL-1" }))).status).toBe(403);
    const started = await body<{ startedAt: string; total: number; seen: number }>(await stockPost(json("/x", { action: "START" })));
    expect(started.startedAt).not.toBeNull();
    const seen = await body<{ seen: number; unseen: { accession: string }[] }>(await seenPost(json("/x", { accession: "ZL-1" })));
    expect(seen.seen).toBe(1);
    expect(seen.unseen.map((c) => c.accession)).not.toContain("ZL-1");
    expect((await body<{ seen: number }>(await seenPost(json("/x", { accession: "ZL-1" })))).seen).toBe(1);
    const finished = await body<{ startedAt: string | null }>(await stockPost(json("/x", { action: "FINISH" })));
    expect(finished.startedAt).toBeNull();
    expect((await body<{ startedAt: string | null }>(await stockGet())).startedAt).toBeNull();
  });

  it("imports a pasted sheet, and the same sheet again adds nothing", async () => {
    expect(accessionsOf("B-0098", 3)).toEqual(["B-0098", "B-0099", "B-0100"]);
    expect(accessionsOf("A1; A7", 0)).toEqual(["A1", "A7"]);
    expect(accessionsOf("", 2)).toBeNull();
    const sheet = "Title\tAuthor\tISBN\tCopies\tAccession\tLanguage\nZZ Imported One\tZZ X\t0-306-40615-2\t2\tZLI-10\tMarathi\nZZ Imported Two\tZZ Y\t\t1\tZL-1\t\n\tZZ no title\t\t\t\t\n";
    await as("LIBRARIAN");
    const first = await body<{ titlesCreated: number; copiesCreated: number; skipped: { reason: string }[] }>(await importPost(json("/x", { text: sheet })));
    expect(first.titlesCreated).toBe(2);
    expect(first.copiesCreated).toBe(2);
    expect(first.skipped.map((s) => s.reason).sort()).toEqual(["ACCESSION_TAKEN", "NO_TITLE"]);
    const t = await db.libraryTitle.findFirstOrThrow({ where: { schoolId: ids.shelf, isbn: "0306406152" }, select: { language: true } });
    expect(t.language).toBe("MR");
    const again = await body<{ titlesCreated: number; titlesMatched: number; copiesCreated: number }>(await importPost(json("/x", { text: sheet })));
    expect(again).toMatchObject({ titlesCreated: 0, titlesMatched: 2, copiesCreated: 0 });
    expect((await body<{ noHeader: boolean }>(await importPost(json("/x", { text: "a,b\n1,2" })))).noHeader).toBe(true);
  });

  it("reports the year's loans, and the head reads them but cannot lend", async () => {
    await as("PRINCIPAL");
    const r = await body<{ totals: { titles: number; onLoan: number }; issuesByMonth: { count: number }[]; mostBorrowed: { title: string }[] }>(await reportsGet());
    expect(r.totals.titles).toBeGreaterThanOrEqual(6);
    expect(r.issuesByMonth).toHaveLength(12);
    expect(r.issuesByMonth[11]!.count).toBeGreaterThanOrEqual(10);
    expect(r.mostBorrowed.length).toBeGreaterThan(0);
    expect((await issuePost(json("/api/v1/library/issues", { accession: "ZL-1", membershipId: ids.p3 }))).status).toBe(403);
    expect((await membersGet(get("/api/v1/library/members?q=pupil"))).status).toBe(200);
    expect((await settingsGet()).status).toBe(200);
  });
});

describe("a member's own library", () => {
  it("is their own: a pupil, a teacher, a guardian for their child — and nobody else's child", async () => {
    await as("PARENT");
    const child = await body<{ membershipId: string; loans: { title: string }[]; fines: { status: string }[] }>(await mineGet(get(`/api/v1/library/mine?childId=${ids.p1}`)));
    expect(child.membershipId).toBe(ids.p1);
    expect(child.loans.map((l) => l.title)).toContain("ZZ One Copy");
    expect(child.fines.map((f) => f.status)).toContain("WAIVED");
    expect((await mineGet(get(`/api/v1/library/mine?childId=${ids.p2}`))).status).toBe(404);
    await as("STRANGER");
    expect((await mineGet(get(`/api/v1/library/mine?childId=${ids.p1}`))).status).toBe(404);
    await as("TEACHER");
    expect((await body<{ membershipId: string }>(await mineGet(get("/api/v1/library/mine")))).membershipId).toBe(ids.teacherM);
    await as("LIBRARIAN");
    expect((await mineGet(get("/api/v1/library/mine"))).status).toBe(403);
  });
});
