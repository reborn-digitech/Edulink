/**
 * THE CHECK OF SUNRISE, THE FULL DEMO SCHOOL (owner's batch of 27 October 2026,
 * item 4), kept beside scripts/demo-schools.ts so a rebuilt demo is checked the
 * same way every time, never by hand.
 *
 *   node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json scripts/demo-school-check.ts
 *       … --facts                 the facts only (no server needed)
 *       … --part=item4a|item4b    one builder's blocks only
 *       … --out=<file>            also write every line as JSON
 *
 * 1. THE FACTS, read from the rows (ok / GAP lines), one block per builder.
 * 2. THE WALK against the running dev server (BASE, default
 *    http://localhost:3000), after /api/health answers 200: a session minted
 *    for each person with `npm run zz:token -- ROLE email --tag=<this run's
 *    tag>`, each page read with the session as the cookie and each door with
 *    it as a bearer, judged by the HTTP status and the streamed digest
 *    (scripts/streamed-status.ts): 200 is expected; anything else is a
 *    failure. A page's raw dictionary key is listed too. The public pages a
 *    school's own domain serves are read by host (`<slug>.localhost`, as the
 *    middleware serves them in development) with no session.
 *
 * Reads only: no door that writes, and none that records a reading (the
 * payroll's file exports and the UPI pay page are audited each time and are
 * left out on purpose). The sessions it mints are purged at the end.
 */
import { execFileSync } from "node:child_process";
import { request } from "node:http";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { en } from "@edulink/i18n/en";
import { streamedStatus } from "./streamed-status";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const BASE = process.env.BASE ?? "http://localhost:3000";
const TAG = `dsc-${process.pid}`;
const DOMAIN = "demo.relay.test";
const SLUG = "sunrise-public-school";
const argv = process.argv.slice(2);
const flag = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

type Line = { ok: boolean; part: string; what: string; detail: string };
/** One person's walk: the pages (cookie) and the doors (bearer) they may open. */
type Walk = { part: string; label: string; role: string; email: string; pages: string[]; doors: string[] };
/** A page a school's own domain serves, read by host with no session. */
type Public = { part: string; host: string; path: string };
type Result = { part: string; who: string; kind: "page" | "door" | "public"; path: string; status: number; loc: string | null; streamed: boolean; rawKeys: string[]; ms: number };

const FACTS: { part: string; run: () => Promise<Line[]> }[] = [];
const WALKS: { part: string; make: () => Promise<{ walks: Walk[]; publicPages: Public[] }> }[] = [];
const fact = (part: string, out: Line[]) => (what: string, ok: boolean, detail = "") => out.push({ ok, part, what, detail });

/* ========================================================================== */
// owner-batch-item4a ─────────────────────────────────────────────────────────────────────────────────────────
/**
 * Sunrise's bus, hostel and library (scripts/demo-schools.ts buildCampusModules).
 *
 * FACTS: the routes, stops in QA-46 order, the bus with its driver and
 * attendant, riders in every class, the driver's consent, a week of ended
 * trips with ticks and the track, the route incident and fees; the two houses
 * and wardens, ten boarders, a week of roll calls, the leave out and the ask,
 * the mess bill, the visitor and the menu; forty titles with Devanagari among
 * them, fifteen loans with overdue and fines, the copies out marked ISSUED,
 * two reservations, the librarian and the reading-room register.
 *
 * THE WALK: the office (admin, head), every DRIVER, WARDEN and LIBRARIAN at
 * the school, the staff who borrow, and every rider's, boarder's and
 * borrower's family — the pupil and each guardian. PAGES: the role's home,
 * every NAV entry of the three modules (a module role's whole NAV), as a
 * guardian once per child (`?child=`), and the detail pages (a trip, a
 * title, a member, a boarder's health, the family's fees). DOORS: every GET
 * of the API catalog whose module is TRANSPORT, HOSTEL or LIBRARY and whose
 * access names the role, filled with Sunrise's own ids; a family door is
 * opened for the children it concerns (the bus for a rider, the hostel for a
 * boarder), and a door with no Sunrise sample is said on a SKIP line.
 */
const A4_MODULES = ["TRANSPORT", "HOSTEL", "LIBRARY"] as const;
const A4_HOME: Record<string, string> = { ADMIN: "/admin", PRINCIPAL: "/principal", TEACHER: "/teacher", STUDENT: "/student", PARENT: "/parent", DRIVER: "/driver", LIBRARIAN: "/library", WARDEN: "/hostel" };
const a4mail = (local: string) => `sunrise.${local}@${DOMAIN}`;
type A4School = { id: string; today: string; on: Set<string> };
type A4Child = { id: string; tags: Set<string> };
type A4Person = { role: string; email: string; pages: Set<string>; children: A4Child[] };

async function a4School(): Promise<A4School> {
  const { todayKey } = await import("../src/lib/dates");
  const s = await db.school.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true, timezone: true } });
  const on = new Set((await db.schoolModule.findMany({ where: { schoolId: s.id }, select: { module: true } })).map((m) => m.module));
  return { id: s.id, today: todayKey(s.timezone), on };
}
const a4Seats = (s: A4School) => db.transportAllotment.findMany({ where: { schoolId: s.id, fromDateKey: { lte: s.today }, OR: [{ toDateKey: null }, { toDateKey: { gte: s.today } }] }, select: { studentMembershipId: true, student: { select: { enrollments: { where: { status: "ACTIVE" }, select: { classId: true } } } } }, orderBy: { createdAt: "asc" } });

FACTS.push({
  part: "item4a",
  run: async () => {
    const { addDaysToKey } = await import("../src/lib/dates");
    const out: Line[] = [];
    const check = fact("item4a", out);
    const school = await a4School();
    const s = school.id;
    // Transport.
    const routes = await db.transportRoute.findMany({ where: { schoolId: s, active: true }, select: { id: true, name: true, stops: { orderBy: { order: "asc" }, select: { morningMinute: true, eveningMinute: true } } } });
    check("transport: two active routes", routes.length >= 2, routes.map((r) => r.name).join("; "));
    check("transport: eight stops", routes.reduce((a, r) => a + r.stops.length, 0) >= 8, `${routes.reduce((a, r) => a + r.stops.length, 0)}`);
    check("transport: stop times in order, the morning rising and the evening falling (QA-46)", routes.every((r) => r.stops.every((st, i) => i === 0 || ((st.morningMinute ?? 0) >= (r.stops[i - 1]!.morningMinute ?? 0) && (st.eveningMinute ?? 0) <= (r.stops[i - 1]!.eveningMinute ?? 0)))));
    const assignments = await db.busAssignment.findMany({ where: { schoolId: s, toDateKey: null }, select: { routeId: true, driver: { select: { user: { select: { email: true } } } }, attendant: { select: { user: { select: { email: true } } } } } });
    check("transport: each route on a bus, sunrise.driver01 driving, an attendant riding", routes.every((r) => assignments.some((a) => a.routeId === r.id && a.driver.user.email === a4mail("driver01") && a.attendant)), assignments.map((a) => `${a.driver.user.email} + ${a.attendant?.user.email ?? "none"}`).join("; "));
    const seats = await a4Seats(school);
    const classes = new Set(seats.flatMap((x) => x.student.enrollments.map((e) => e.classId)));
    check("transport: twelve riders across the six classes", seats.length >= 12 && classes.size >= 6, `${seats.length} riders in ${classes.size} classes`);
    const driver = await db.membership.findFirst({ where: { schoolId: s, role: "DRIVER", user: { email: a4mail("driver01") } }, select: { id: true } });
    check("transport: the driver's yes to the location sentence", Boolean(driver) && (await db.transportConsent.count({ where: { membershipId: driver!.id } })) === 1);
    const week = { gte: addDaysToKey(school.today, -8), lt: school.today };
    const ended = await db.trip.count({ where: { schoolId: s, status: "ENDED", dateKey: week } });
    const ticks = await db.tripBoarding.count({ where: { schoolId: s, boardedAt: { not: null }, trip: { dateKey: week } } });
    const track = await db.tripPosition.count({ where: { schoolId: s, trip: { dateKey: week } } });
    check("transport: a week of trips ended, with the ticks and the bus's track", ended >= 24 && ticks > 0 && track > 0, `${ended} trips, ${ticks} boardings, ${track} positions`);
    check("transport: an incident on a route", (await db.incident.count({ where: { schoolId: s, place: { contains: "Route" } } })) >= 1);
    const routeFees = await db.feeDemand.count({ where: { schoolId: s, raisedKey: { startsWith: "ROUTE:" }, status: { not: "CANCELLED" } } });
    check("transport: the route fee raised for every rider (raisedKey ROUTE:…)", routeFees >= seats.length && routeFees > 0, `${routeFees} demands`);
    // Hostel.
    const houses = await db.hostel.findMany({ where: { schoolId: s }, select: { name: true, kind: true, wardenMembershipId: true } });
    check("hostel: a boys' and a girls' house, each with a warden", houses.some((h) => h.kind === "BOYS" && h.wardenMembershipId) && houses.some((h) => h.kind === "GIRLS" && h.wardenMembershipId), houses.map((h) => `${h.name} ${h.kind}`).join("; "));
    const wardens = (await db.membership.findMany({ where: { schoolId: s, role: "WARDEN", status: "ACTIVE" }, select: { user: { select: { email: true } } } })).map((w) => w.user.email);
    check("hostel: sunrise.warden and sunrise.warden2", [a4mail("warden"), a4mail("warden2")].every((e) => wardens.includes(e)), wardens.join(", "));
    const boarders = await db.hostelAllotment.count({ where: { schoolId: s, status: "ACTIVE" } });
    check("hostel: ten boarders", boarders >= 10, `${boarders}`);
    const calls = await db.hostelRollCall.count({ where: { schoolId: s, dateKey: { gte: addDaysToKey(school.today, -7), lt: school.today } } });
    check("hostel: a week of roll calls, both slots, both houses", calls >= 28, `${calls}`);
    check("hostel: a boarder out through the gate on approved leave", (await db.hostelLeave.count({ where: { schoolId: s, status: "APPROVED", outAt: { not: null }, inAt: null } })) >= 1);
    check("hostel: a leave ask waiting for the warden", (await db.hostelLeave.count({ where: { schoolId: s, status: { in: ["PENDING", "AWAITING_CONSENT"] } } })) >= 1);
    const month = school.today.slice(0, 7);
    const mess = await db.feeDemand.count({ where: { schoolId: s, raisedKey: `MESS:${month}`, status: { not: "CANCELLED" } } });
    check(`hostel: this month's mess bill for every boarder (raisedKey MESS:${month})`, mess >= boarders && mess > 0, `${mess} demands`);
    check("hostel: a visitor in the book", (await db.hostelVisitor.count({ where: { schoolId: s } })) >= 1);
    check("hostel: the week's mess menu", (await db.messMenu.count({ where: { schoolId: s } })) >= 28);
    // Library.
    const titles = await db.libraryTitle.findMany({ where: { schoolId: s }, select: { title: true, language: true } });
    const devanagari = titles.filter((t) => /[ऀ-ॿ]/.test(t.title)).length;
    check("library: forty titles across languages, Devanagari among them", titles.length >= 40 && devanagari > 0 && new Set(titles.map((t) => t.language)).size >= 3, `${titles.length} titles, ${devanagari} in Devanagari, ${[...new Set(titles.map((t) => t.language))].join(",")}`);
    const loans = await db.libraryIssue.count({ where: { schoolId: s } });
    const overdue = await db.libraryIssue.count({ where: { schoolId: s, returnedAt: null, dueOn: { lt: school.today } } });
    const fines = await db.libraryFine.count({ where: { schoolId: s } });
    check("library: fifteen loans, some overdue, with fines", loans >= 15 && overdue >= 1 && fines >= 1, `${loans} loans, ${overdue} overdue, ${fines} fines`);
    const out1 = await db.libraryIssue.findMany({ where: { schoolId: s, returnedAt: null }, select: { copy: { select: { status: true } } } });
    check("library: every copy out is ISSUED", out1.every((x) => x.copy.status === "ISSUED"), `${out1.length} out`);
    check("library: two open reservations", (await db.libraryReservation.count({ where: { schoolId: s, fulfilledAt: null, cancelledAt: null } })) >= 2);
    check("library: sunrise.librarian at the desk", (await db.membership.count({ where: { schoolId: s, role: "LIBRARIAN", status: "ACTIVE", user: { email: a4mail("librarian") } } })) === 1);
    check("library: the reading-room register", (await db.readingRoomVisit.count({ where: { schoolId: s } })) >= 1);
    return out;
  },
});

WALKS.push({
  part: "item4a",
  make: async () => {
    const { NAV } = await import("../src/lib/nav");
    const { ENDPOINTS } = await import("../src/lib/api-catalog");
    const { doorForKind } = await import("../src/lib/api-catalog/types");
    const { addDaysToKey } = await import("../src/lib/dates");
    const school = await a4School();
    const s = school.id;
    const people = new Map<string, A4Person>();
    const add = (role: string, email: string | null, pages: string[] = [], child?: { id: string; tag: string }) => {
      if (!email) return;
      const key = `${role} ${email}`;
      const p = people.get(key) ?? { role, email, pages: new Set<string>(), children: [] };
      people.set(key, p);
      for (const x of pages) p.pages.add(x);
      if (child) {
        const had = p.children.find((c) => c.id === child.id);
        if (had) had.tags.add(child.tag);
        else p.children.push({ id: child.id, tags: new Set([child.tag]) });
      }
    };
    const family = async (membershipId: string, tag: string, parentPages: (child: string) => string[]) => {
      const m = await db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { user: { select: { email: true } } } });
      add("STUDENT", m.user.email, [], { id: membershipId, tag });
      for (const g of await db.guardianship.findMany({ where: { studentMembershipId: membershipId, status: "ACTIVE" }, select: { parent: { select: { email: true } } } })) add("PARENT", g.parent.email, parentPages(membershipId), { id: membershipId, tag });
    };

    // The ids the detail pages and the doors are filled with.
    const trip = await db.trip.findFirst({ where: { schoolId: s, status: "ENDED" }, orderBy: [{ dateKey: "desc" }, { direction: "asc" }], select: { id: true } });
    const bus = await db.busAssignment.findFirst({ where: { schoolId: s, toDateKey: null }, select: { busId: true } });
    const firstHouse = await db.hostel.findFirst({ where: { schoolId: s }, orderBy: { name: "asc" }, select: { id: true } });
    const places = await db.hostelAllotment.findMany({ where: { schoolId: s, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { id: true, membershipId: true } });
    const godaan = await db.libraryTitle.findFirst({ where: { schoolId: s, title: { contains: "गोदान" } }, select: { id: true } });
    const periodical = await db.libraryTitle.findFirst({ where: { schoolId: s, category: "PERIODICAL" }, select: { id: true } });
    const copy = await db.libraryCopy.findFirst({ where: { schoolId: s }, orderBy: { accession: "asc" }, select: { accession: true } });
    const issues = await db.libraryIssue.findMany({ where: { schoolId: s }, orderBy: { issuedAt: "asc" }, select: { returnedAt: true, member: { select: { membershipId: true, kind: true } } } });
    const outMember = issues.find((i) => i.returnedAt === null)?.member.membershipId ?? null;

    // The office reads all three; the detail pages besides the NAV's.
    const office = [
      ...(trip ? [`/admin/transport/trips/${trip.id}`] : []), "/admin/incidents",
      "/hostel", "/hostel/rollcall", "/hostel/leave", "/hostel/night", "/hostel/expulsions", "/hostel/rooms", "/hostel/visitors", "/hostel/menu", "/hostel/incidents",
      "/library/catalogue", "/library/overdue", "/library/reservations", "/library/fines", "/library/stocktake", "/library/reports", "/library/reading-room",
      ...(godaan ? [`/library/titles/${godaan.id}`] : []), ...(outMember ? [`/library/members/${outMember}`] : []),
    ];
    add("ADMIN", a4mail("admin"), office);
    add("PRINCIPAL", a4mail("principal"), office);
    // The module roles, every one at the school.
    const staff = await db.membership.findMany({ where: { schoolId: s, role: { in: ["DRIVER", "WARDEN", "LIBRARIAN"] }, status: "ACTIVE", leftAt: null }, select: { role: true, user: { select: { email: true } } }, orderBy: { user: { email: "asc" } } });
    for (const m of staff) add(m.role, m.user.email, m.role === "WARDEN" && places[0] ? [`/hostel/health/${places[0].id}`] : m.role === "LIBRARIAN" ? [...(godaan ? [`/library/titles/${godaan.id}`] : []), ...(outMember ? [`/library/members/${outMember}`] : [])] : []);
    // The families: riders, boarders, borrowers; a member of staff who borrows.
    for (const seat of [...new Set((await a4Seats(school)).map((x) => x.studentMembershipId))]) await family(seat, "transport", (c) => [`/parent/fees?child=${c}`]);
    for (const p of places) await family(p.membershipId, "hostel", (c) => [`/parent/fees?child=${c}`]);
    for (const i of issues) {
      if (i.member.kind === "PUPIL") await family(i.member.membershipId, "library", () => []);
      else {
        const m = await db.membership.findUniqueOrThrow({ where: { id: i.member.membershipId }, select: { role: true, user: { select: { email: true } } } });
        add(m.role, m.user.email);
      }
    }

    // A catalog door filled for one person (and, for a guardian or a pupil, one child), or the reason it is not opened.
    const forChild = (role: string, path: string, child: A4Child | null) => (role === "PARENT" ? (child ? `${path}${path.includes("?") ? "&" : "?"}childId=${child.id}` : null) : path);
    const fill = (path: string, role: string, child: A4Child | null): string | { skip: string } => {
      const need = (tag: string) => (role === "STUDENT" || role === "PARENT") && !child?.tags.has(tag);
      switch (path) {
        case "/api/v1/admin/transport/buses/{busId}/roster": return bus ? `/api/v1/admin/transport/buses/${bus.busId}/roster?format=csv` : { skip: "no bus on a route" };
        case "/api/v1/admin/transport/trips/{tripId}": return trip ? `/api/v1/admin/transport/trips/${trip.id}` : { skip: "no ended trip" };
        case "/api/v1/family/transport": return need("transport") ? { skip: "the child does not ride" } : forChild(role, path, child) ?? { skip: "no child" };
        case "/api/v1/hostel/rollcall": return firstHouse ? `${path}?hostelId=${firstHouse.id}&slot=NIGHT&date=${addDaysToKey(school.today, -1)}` : { skip: "no house" };
        case "/api/v1/hostel/leave": return `${path}?status=ALL`;
        case "/api/v1/hostel/boarders/{allotmentId}/health": return places[0] ? `/api/v1/hostel/boarders/${places[0].id}/health` : { skip: "no boarder" };
        case "/api/v1/family/hostel":
        case "/api/v1/hostel/menu": return need("hostel") ? { skip: "the child does not board" } : forChild(role, path, child) ?? { skip: "no child" };
        case "/api/v1/library/titles": return forChild(role, `${path}?q=Malgudi`, child) ?? { skip: "no child" };
        case "/api/v1/library/titles/{titleId}": return godaan ? forChild(role, `/api/v1/library/titles/${godaan.id}`, child) ?? { skip: "no child" } : { skip: "no title" };
        case "/api/v1/library/titles/{titleId}/volumes": return periodical ? `/api/v1/library/titles/${periodical.id}/volumes` : { skip: "no periodical" };
        case "/api/v1/library/lookup": return copy ? `${path}?code=${encodeURIComponent(copy.accession)}` : { skip: "no copy" };
        case "/api/v1/library/members": return `${path}?q=Kulkarni`;
        case "/api/v1/library/members/{membershipId}": return outMember ? `/api/v1/library/members/${outMember}` : { skip: "no loan out" };
        case "/api/v1/library/fines": return `${path}?status=ALL`;
        case "/api/v1/library/mine": return forChild(role, path, child) ?? { skip: "no child" };
        default: return path.includes("{") ? { skip: "no Sunrise sample for this path" } : path;
      }
    };
    // owner-batch-item5 (27 Oct 2026): the catalog says which doors are a college's alone (`kinds`; the gate answers a
    // school 404 there), so every module door the catalog lets a school use is walked — the e-resources among them —
    // and only those naming other kinds are said on a SKIP line.
    const skips = new Map<string, number>();
    const doors = ENDPOINTS.filter((e) => e.method === "GET" && e.module && (A4_MODULES as readonly string[]).includes(e.module)).filter((e) => {
      if (doorForKind(e, "SCHOOL")) return true;
      skips.set(`${e.path}: a door for ${(e.kinds ?? []).join(" or ")} alone by the catalog, not a school's`, 0);
      return false;
    });
    const walks: Walk[] = [];
    for (const p of people.values()) {
      const nav = (NAV[p.role as keyof typeof NAV] ?? []).filter((i) => (!i.kinds || i.kinds.includes("SCHOOL")) && (!i.module || school.on.has(i.module)));
      const mine = ["DRIVER", "WARDEN", "LIBRARIAN"].includes(p.role) ? nav : nav.filter((i) => i.module && (A4_MODULES as readonly string[]).includes(i.module));
      const navPages = p.role === "PARENT" ? p.children.flatMap((c) => mine.map((i) => `${i.href}?child=${c.id}`)) : mine.map((i) => i.href);
      const pages = [...new Set([A4_HOME[p.role] ?? "/", ...navPages, ...p.pages])];
      const doorPaths: string[] = [];
      for (const d of doors) {
        if (!Array.isArray(d.access) || !d.access.includes(p.role as never)) continue;
        const kids: (A4Child | null)[] = p.role === "PARENT" ? p.children : p.role === "STUDENT" ? [p.children[0] ?? null] : [null];
        for (const child of kids) {
          const filled = fill(d.path, p.role, child);
          if (typeof filled === "string") doorPaths.push(filled);
          else skips.set(`${p.role} ${d.path}: ${filled.skip}`, (skips.get(`${p.role} ${d.path}: ${filled.skip}`) ?? 0) + 1);
        }
      }
      walks.push({ part: "item4a", label: `${p.role} ${p.children.length ? `(${[...new Set(p.children.flatMap((c) => [...c.tags]))].join("+")})` : ""}`.trim(), role: p.role, email: p.email, pages, doors: [...new Set(doorPaths)] });
    }
    for (const [k, n] of skips) console.log(`  SKIP  [item4a] ${k}${n ? ` (${n}×)` : ""}`);
    return { walks, publicPages: [] };
  },
});
// owner-batch-item4a end
/* ========================================================================== */

// owner-batch-item4b ─────────────────────────────────────────────────────────────────────────────────────────
/** Sunrise's inventory, payroll, website, alumni, review rounds and online fees (scripts/demo-schools-item4b.ts). */
const sp = (local: string) => `sunrise.${local}@${DOMAIN}`;
const prevMonth = (m: string) => {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
};
const thisMonthKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

async function sunrise() {
  return db.school.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true } });
}
async function memberId(email: string, role: string): Promise<string | null> {
  const s = await sunrise();
  return (await db.membership.findFirst({ where: { schoolId: s.id, role, user: { email } }, select: { id: true } }))?.id ?? null;
}

FACTS.push({
  part: "item4b",
  run: async () => {
    const out: Line[] = [];
    const check = fact("item4b", out);
    const s = (await sunrise()).id;
    // Inventory
    const [items, bills, billScans, issuesToStaff, counted, assets, custodians, ask] = await Promise.all([
      db.inventoryItem.count({ where: { schoolId: s } }),
      db.purchaseRecord.count({ where: { schoolId: s } }),
      db.purchaseRecord.count({ where: { schoolId: s, billFileId: { not: null } } }),
      db.stockMovement.count({ where: { schoolId: s, kind: "ISSUE", toMembershipId: { not: null } } }),
      db.stockMovement.count({ where: { schoolId: s, reference: "stock-take" } }),
      db.asset.count({ where: { schoolId: s } }),
      db.asset.count({ where: { schoolId: s, custodianMembershipId: { not: null } } }),
      db.inventoryRequest.count({ where: { schoolId: s, status: "PENDING" } }),
    ]);
    check("inventory: 25 items", items === 25, `${items}`);
    check("inventory: two purchase records, each with its scanned bill", bills === 2 && billScans === 2, `${bills} records, ${billScans} with a bill`);
    check("inventory: issues to staff (their My items)", issuesToStaff >= 10, `${issuesToStaff}`);
    check("inventory: a stock count adjusted the main store", counted >= 1, `${counted} adjustment(s)`);
    check("inventory: five tagged assets, three with a custodian", assets === 5 && custodians === 3, `${assets} assets, ${custodians} with a custodian`);
    check("inventory: a waiting ask", ask >= 1, `${ask}`);
    const stockBad = await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "InventoryStock" st WHERE st."schoolId" = ${s} AND st."quantity" <> (SELECT coalesce(sum(m."delta"), 0) FROM "StockMovement" m WHERE m."itemId" = st."itemId" AND m."location" = st."location")`;
    check("inventory: every place's stock is the sum of its movements", Number(stockBad[0]?.n ?? 0) === 0, `${stockBad[0]?.n ?? 0} off`);

    // Payroll
    const staff = await db.membership.findMany({ where: { schoolId: s, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER", "DRIVER", "LIBRARIAN", "WARDEN", "SUPPORT"] }, status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { email: true } }, salaries: { select: { paymentMode: true, upiSealed: true, bankAccountSealed: true } } } });
    const without = staff.filter((m) => m.salaries.length === 0).map((m) => m.user.email ?? m.id);
    check("payroll: every member of staff has a salary", without.length === 0, without.length ? `none for ${without.join(", ")}` : `${staff.length} people`);
    const modes = staff.map((m) => m.salaries[0]?.paymentMode).filter(Boolean);
    check("payroll: UPI for two, sealed", staff.filter((m) => m.salaries.some((x) => x.paymentMode === "UPI" && x.upiSealed)).length === 2, `${modes.filter((m) => m === "UPI").length} UPI`);
    check("payroll: bank for the rest, sealed", staff.filter((m) => m.salaries.some((x) => x.paymentMode === "BANK" && x.bankAccountSealed)).length === staff.length - 3, `${modes.filter((m) => m === "BANK").length} bank`);
    const worker = await db.membership.findFirst({ where: { schoolId: s, role: "SUPPORT", user: { email: sp("support01") } }, select: { id: true, staffRecord: { select: { designation: true, contactPhone: true } }, salaries: { select: { paymentMode: true } } } });
    check("payroll: sunrise.support01 is SUPPORT, a cleaner, paid in cash", Boolean(worker && worker.staffRecord?.designation === "Cleaner" && worker.salaries.every((x) => x.paymentMode === "CASH")), worker ? `${worker.staffRecord?.designation}, ${worker.salaries.map((x) => x.paymentMode).join("/")}` : "missing");
    const now = thisMonthKey();
    const last = await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month: prevMonth(now) } }, select: { id: true, status: true, sharedWithPrincipal: true, exports: { select: { kind: true } } } });
    check(`payroll: ${prevMonth(now)} PAID and shared with the head`, last?.status === "PAID" && last.sharedWithPrincipal, last ? `${last.status}, shared ${last.sharedWithPrincipal}` : "no run");
    check("payroll: its bank, UPI and PF files cut", Boolean(last && ["BANK_ADVICE", "UPI_ADVICE", "PF_ECR"].every((k) => last.exports.some((e) => e.kind === k))), last ? last.exports.map((e) => e.kind).join(", ") : "");
    if (last) {
      const [due, paid, upi, cash] = await Promise.all([
        db.payslip.count({ where: { runId: last.id, netPaise: { gt: 0 } } }),
        db.salaryPayment.count({ where: { runId: last.id, voidedAt: null } }),
        db.salaryPayment.count({ where: { runId: last.id, voidedAt: null, mode: "UPI", reference: { not: null } } }),
        db.salaryPayment.count({ where: { runId: last.id, voidedAt: null, mode: "CASH", slip: { membershipId: worker?.id ?? "" } } }),
      ]);
      check("payroll: one live payment for every slip with money due", due === paid && due > 0, `${paid} of ${due}`);
      check("payroll: two UPI payments with a UTR, the cleaner's in cash", upi === 2 && cash === 1, `${upi} UPI, ${cash} cash`);
    }
    const draft = await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month: now } }, select: { status: true, headcount: true } });
    check(`payroll: ${now} DRAFT`, draft?.status === "DRAFT", draft ? `${draft.status}, ${draft.headcount} slips` : "no run");
    check("payroll: an advance recorded and an ask waiting", (await db.staffAdvance.count({ where: { schoolId: s, status: "RECORDED" } })) >= 1 && (await db.staffAdvance.count({ where: { schoolId: s, status: "REQUESTED" } })) >= 1);

    // Website
    const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: s, liveAt: { not: null } }, select: { pagesHtml: true } });
    const paths = live ? Object.keys(JSON.parse(live.pagesHtml) as Record<string, unknown>) : [];
    check("website: published, six pages (home and five more)", Boolean(live) && paths.length === 5, live ? `home + ${paths.join(", ")}` : "nothing live");
    const [domain, shares, visitDays, photos] = await Promise.all([
      db.schoolSiteDomain.findFirst({ where: { schoolId: s }, select: { domain: true, status: true } }),
      db.schoolSiteShare.count({ where: { schoolId: s, revokedAt: null, expiresAt: { gt: new Date() } } }),
      db.schoolSiteVisit.groupBy({ by: ["dateKey"], where: { schoolId: s } }),
      db.schoolSiteFile.count({ where: { schoolId: s, kind: "IMAGE", name: { startsWith: "sunrise-teacher-" } } }),
    ]);
    check("website: the domain waits for its DNS", domain?.status === "PENDING_DNS", domain ? `${domain.domain} ${domain.status}` : "none");
    check("website: one open review link", shares === 1, `${shares}`);
    check("website: visits on three days or more", visitDays.length >= 3, `${visitDays.length} days`);
    check("website: the eight teachers' photos", photos === 8, `${photos}`);

    // Alumni
    const alumni = await db.membership.findMany({ where: { schoolId: s, role: "ALUMNUS", status: "ACTIVE", leftAt: null, user: { email: { in: [1, 2, 3, 4, 5].map((n) => sp(`alumni0${n}`)) } } }, select: { id: true, user: { select: { isMinor: true } }, alumniProfile: { select: { listed: true, mentor: true } } } });
    check("alumni: five adult alumni, each listed", alumni.length === 5 && alumni.every((a) => !a.user.isMinor && a.alumniProfile?.listed), `${alumni.length} alumni, ${alumni.filter((a) => a.alumniProfile?.listed).length} listed`);
    check("alumni: a mentor", alumni.some((a) => a.alumniProfile?.mentor));
    const p49 = await db.membership.findFirst({ where: { schoolId: s, role: "ALUMNUS", user: { email: sp("pupil49") } }, select: { id: true, alumniProfile: { select: { listed: true } } } });
    check("alumni: sunrise.pupil49 an alumnus, not listed (a minor)", Boolean(p49) && !p49?.alumniProfile?.listed);
    const alumniIds = (await db.membership.findMany({ where: { schoolId: s, role: "ALUMNUS" }, select: { id: true } })).map((m) => m.id);
    const posts = await db.post.count({ where: { schoolId: s, authorMembershipId: { in: alumniIds }, status: "APPROVED" } });
    check("alumni: a post by each of the six", posts >= 6, `${posts}`);

    // Review rounds
    const head = await memberId(sp("principal"), "PRINCIPAL");
    const rounds = await db.reviewRound.findMany({ where: { schoolId: s, createdByMembershipId: head ?? "" }, select: { audience: true, status: true, _count: { select: { responses: true } } } });
    check("reviews: a parents' round closed with answers", rounds.some((r) => r.audience === "PARENTS" && r.status === "CLOSED" && r._count.responses > 0), rounds.map((r) => `${r.audience} ${r.status} ${r._count.responses}`).join("; "));
    check("reviews: a pupils' round open with answers", rounds.some((r) => r.audience === "STUDENTS" && r.status === "OPEN" && r._count.responses > 0));

    // Online fees in test mode
    const gateway = await db.feeGatewayAccount.findUnique({ where: { schoolId: s }, select: { mode: true, keyId: true } });
    check("fees: the school's gateway in TEST mode", gateway?.mode === "TEST" && gateway.keyId.startsWith("rzp_test_"), gateway ? `${gateway.keyId} ${gateway.mode}` : "none");
    const pays = await db.feePayment.findMany({ where: { schoolId: s, method: { in: ["ONLINE", "UPI"] }, payer: { email: { in: ["parent35", "parent44", "parent03", "parent28"].map(sp) } } }, select: { method: true, status: true, payer: { select: { email: true } }, receipt: { select: { id: true } } } });
    const want = [["parent35", "ONLINE", "PAID"], ["parent44", "ONLINE", "FAILED"], ["parent03", "UPI", "CLAIMED"], ["parent28", "UPI", "PAID"]] as const;
    for (const [who, method, status] of want) {
      const p = pays.find((x) => x.payer?.email === sp(who) && x.method === method);
      check(`fees: ${method} by ${who} ${status}${status === "PAID" ? " with a receipt" : ""}`, Boolean(p && p.status === status && (status !== "PAID" || p.receipt)), p ? `${p.status}${p.receipt ? ", receipt" : ""}` : "none");
    }
    return out;
  },
});

WALKS.push({
  part: "item4b",
  make: async () => {
    const s = (await sunrise()).id;
    const now = thisMonthKey();
    const last = prevMonth(now);
    const worker = await memberId(sp("support01"), "SUPPORT");
    const driver = await memberId(sp("driver01"), "DRIVER");
    const paid = await db.feePayment.findFirst({ where: { schoolId: s, method: "ONLINE", status: "PAID", payer: { email: sp("parent35") } }, select: { id: true, studentMembershipId: true, receipt: { select: { id: true } } } });
    const failed = await db.feePayment.findFirst({ where: { schoolId: s, method: "ONLINE", status: "FAILED", payer: { email: sp("parent44") } }, select: { id: true } });
    const claimed = await db.feePayment.findFirst({ where: { schoolId: s, method: "UPI", payer: { email: sp("parent03") } }, select: { id: true } });
    const confirmed = await db.feePayment.findFirst({ where: { schoolId: s, method: "UPI", payer: { email: sp("parent28") } }, select: { id: true, receipt: { select: { id: true } } } });
    const reviewer = await db.reviewResponse.findFirst({ where: { schoolId: s, round: { audience: "STUDENTS", status: "OPEN" } }, select: { respondentUserId: true } });
    const reviewerEmail = reviewer ? (await db.user.findUnique({ where: { id: reviewer.respondentUserId }, select: { email: true } }))?.email ?? null : null;
    const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: s, liveAt: { not: null } }, select: { pagesHtml: true } });
    const sitePaths = live ? Object.keys(JSON.parse(live.pagesHtml) as Record<string, unknown>) : [];
    const W = (label: string, role: string, email: string, pages: (string | null)[], doors: (string | null)[]): Walk => ({ part: "item4b", label, role, email, pages: pages.filter((x): x is string => Boolean(x)), doors: doors.filter((x): x is string => Boolean(x)) });
    const walks: Walk[] = [
      W("ADMIN", "ADMIN", sp("admin"), [
        "/admin/inventory", "/admin/inventory/items", "/admin/inventory/purchases", "/admin/inventory/movements", "/admin/inventory/assets", "/admin/inventory/assets/SPS-A-0001", "/admin/inventory/requests", "/admin/inventory/reports", "/admin/inventory/setup",
        "/admin/payroll", "/admin/payroll/salaries", "/admin/payroll/structures", "/admin/payroll/settings", "/admin/payroll/advances", `/admin/payroll/runs/${last}`, `/admin/payroll/runs/${now}`, worker ? `/admin/payroll/statement/${worker}` : null,
        "/admin/people", "/admin/people/support",
        "/admin/website", "/admin/website?s=about", "/admin/website?s=look", "/admin/website?s=home", "/admin/website?s=publish", "/admin/website/domain", `/sites/${SLUG}`, ...sitePaths.map((p) => `/sites/${SLUG}/${p.replace(/^\//, "")}`),
        "/admin/alumni", "/admin/reviews",
        "/admin/fees", "/admin/fees/settings", "/admin/fees/claims", "/admin/fees/dues", paid ? `/admin/fees/pupils/${paid.studentMembershipId}` : null, paid?.receipt ? `/fees/receipts/${paid.receipt.id}` : null,
        "/account/items", "/account/payslips",
      ], [
        "/api/v1/admin/inventory", "/api/v1/admin/inventory/setup", "/api/v1/admin/inventory/items", "/api/v1/admin/inventory/movements", "/api/v1/admin/inventory/purchases", "/api/v1/admin/inventory/assets", "/api/v1/admin/inventory/assets/SPS-A-0001", "/api/v1/admin/inventory/requests", "/api/v1/admin/inventory/reports",
        "/api/v1/admin/payroll", "/api/v1/admin/payroll/structures", "/api/v1/admin/payroll/salaries", `/api/v1/admin/payroll/runs/${last}`, `/api/v1/admin/payroll/runs/${now}`, "/api/v1/admin/payroll/advances", worker ? `/api/v1/admin/payroll/statement/${worker}` : null, worker ? `/api/v1/admin/payroll/runs/${last}/slips/${worker}/pdf` : null, driver ? `/api/v1/admin/payroll/runs/${last}/slips/${driver}/pdf` : null,
        "/api/v1/admin/site", "/api/v1/admin/site/versions", "/api/v1/admin/site/shares", "/api/v1/admin/site/enquiries", "/api/v1/admin/site/visits", "/api/v1/admin/site/files", "/api/v1/admin/site/summary", "/api/v1/admin/site/domain",
        "/api/v1/admin/alumni", "/api/v1/admin/reviews",
        "/api/v1/fees/overview", "/api/v1/fees/settings", "/api/v1/fees/claims", "/api/v1/fees/dues", paid ? `/api/v1/fees/pupils/${paid.studentMembershipId}` : null, paid?.receipt ? `/api/v1/fees/receipts/${paid.receipt.id}` : null,
        "/api/v1/account/inventory", "/api/v1/account/payslips",
      ]),
      W("PRINCIPAL", "PRINCIPAL", sp("principal"), ["/admin/payroll", `/admin/payroll/runs/${last}`, "/admin/inventory", "/admin/website", `/sites/${SLUG}`, "/admin/reviews", "/account/payslips"], ["/api/v1/admin/payroll", `/api/v1/admin/payroll/runs/${last}`, "/api/v1/admin/site", "/api/v1/admin/reviews", "/api/v1/account/payslips"]),
      W("TEACHER (grade 9, a projector and lab issues)", "TEACHER", sp("teacher5"), ["/account/items", "/account/payslips", "/account/payslips/statement"], ["/api/v1/account/inventory", "/api/v1/account/payslips", `/api/v1/account/payslips/${last}/pdf`]),
      W("TEACHER (PE, an advance)", "TEACHER", sp("subject2"), ["/account/items", "/account/payslips"], ["/api/v1/account/inventory", "/api/v1/account/payslips"]),
      W("SUPPORT (the cleaner)", "SUPPORT", sp("support01"), ["/account/payslips", "/account"], ["/api/v1/account/payslips", `/api/v1/account/payslips/${last}/pdf`, "/api/v1/me"]),
      W("DRIVER (paid by UPI)", "DRIVER", sp("driver01"), ["/account/payslips"], ["/api/v1/account/payslips"]),
      W("ALUMNUS (adult, mentor)", "ALUMNUS", sp("alumni01"), ["/alumni", "/alumni/directory", "/alumni/staff", "/bulletin"], ["/api/v1/alumni/home", "/api/v1/alumni/directory", "/api/v1/alumni/staff"]),
      W("ALUMNUS (sunrise.pupil49, a minor)", "ALUMNUS", sp("pupil49"), ["/alumni", "/alumni/directory"], ["/api/v1/alumni/home", "/api/v1/alumni/directory"]),
      W("PARENT (online, paid)", "PARENT", sp("parent35"), ["/parent/fees", paid?.receipt ? `/fees/receipts/${paid.receipt.id}` : null], ["/api/v1/fees/family", paid ? `/api/v1/fees/family/payments/${paid.id}` : null, "/api/v1/family/fees/plans", "/api/v1/family/fees/calendar"]),
      W("PARENT (online, failed)", "PARENT", sp("parent44"), ["/parent/fees"], ["/api/v1/fees/family", failed ? `/api/v1/fees/family/payments/${failed.id}` : null]),
      W("PARENT (UPI claim waiting)", "PARENT", sp("parent03"), ["/parent/fees"], ["/api/v1/fees/family", claimed ? `/api/v1/fees/family/payments/${claimed.id}` : null]),
      W("PARENT (UPI claim confirmed)", "PARENT", sp("parent28"), ["/parent/fees", confirmed?.receipt ? `/fees/receipts/${confirmed.receipt.id}` : null], ["/api/v1/fees/family", confirmed ? `/api/v1/fees/family/payments/${confirmed.id}` : null]),
      ...(reviewerEmail ? [W("STUDENT (answered the open round)", "STUDENT", reviewerEmail, ["/reviews"], ["/api/v1/family/reviews"])] : []),
      W("STUDENT (grade 5, not answered yet)", "STUDENT", sp("pupil01"), ["/reviews"], ["/api/v1/family/reviews"]),
    ];
    const host = `${SLUG}.localhost`;
    const publicPages: Public[] = ["/", ...sitePaths.map((p) => (p.startsWith("/") ? p : `/${p}`))].map((path) => ({ part: "item4b", host, path }));
    return { walks, publicPages };
  },
});
// owner-batch-item4b end ─────────────────────────────────────────────────────────────────────────────────────

/* ========================================================================== */
/* the walk                                                                    */
/* ========================================================================== */

const KEYS = new Set(Object.keys(flatten(en as unknown as Record<string, unknown>)));
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, true> {
  const out: Record<string, true> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(out, flatten(v as Record<string, unknown>, key));
    else out[key] = true;
  }
  return out;
}
function visibleText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
}
function rawKeys(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+){1,5}\b/g)) if (KEYS.has(m[0])) found.add(m[0]);
  return [...found];
}

function mint(role: string, email: string): string {
  const out = execFileSync("npm", ["run", "-s", "zz:token", "--", role, email, `--tag=${TAG}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const token = out.trim().split("\n").pop()!.trim();
  if (!/^[A-Za-z0-9_-]{30,}$/.test(token)) throw new Error(`zz:token ${role} ${email}: ${out}`);
  return token;
}
function purge(): string {
  // zz-token says what it purged on stderr: passed through, so the walk's log carries it.
  return execFileSync("npm", ["run", "-s", "zz:token", "--", "--purge", `--tag=${TAG}`], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

async function fetchOne(path: string, headers: Record<string, string>): Promise<{ status: number; loc: string | null; body: string; ms: number }> {
  const started = Date.now();
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers, redirect: "manual", signal: AbortSignal.timeout(180_000) });
      const type = res.headers.get("content-type") ?? "";
      const body = type.includes("pdf") ? "" : await res.text();
      return { status: res.status, loc: res.headers.get("location"), body, ms: Date.now() - started };
    } catch (e) {
      if (attempt >= 1) return { status: 0, loc: String((e as Error).message), body: "", ms: Date.now() - started };
    }
  }
}

/** A page as the school's own domain serves it in development: `<slug>.localhost`, by the Host header, no session. */
function fetchByHost(host: string, path: string): Promise<{ status: number; loc: string | null; body: string; ms: number }> {
  const started = Date.now();
  const url = new URL(BASE);
  return new Promise((resolve) => {
    const req = request({ hostname: url.hostname, port: url.port || 80, path, method: "GET", headers: { host: `${host}:${url.port || 80}` }, timeout: 180_000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c: string) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, loc: (res.headers.location as string | undefined) ?? null, body, ms: Date.now() - started }));
    });
    req.on("error", (e) => resolve({ status: 0, loc: e.message, body: "", ms: Date.now() - started }));
    req.end();
  });
}

async function main() {
  const part = flag("part");
  const out = flag("out");
  const facts: Line[] = [];
  for (const f of FACTS.filter((x) => !part || x.part === part)) facts.push(...(await f.run()));
  console.log("-- facts");
  for (const l of facts) console.log(`  ${l.ok ? "ok " : "GAP"} [${l.part}] ${l.what}${l.detail ? ` — ${l.detail}` : ""}`);
  const gaps = facts.filter((l) => !l.ok).length;

  const results: Result[] = [];
  if (!argv.includes("--facts")) {
    const health = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(30_000) }).then((r) => r.status).catch(() => 0);
    if (health !== 200) {
      console.log(`-- walk: NOT WALKED (${BASE}/api/health answered ${health || "nothing"})`);
    } else {
      console.log(`-- walk (${BASE}, tag ${TAG})`);
      try {
        for (const w of WALKS.filter((x) => !part || x.part === part)) {
          const { walks, publicPages } = await w.make();
          for (const p of walks) {
            const token = mint(p.role, p.email);
            const judge = (kind: Result["kind"], path: string, r: { status: number; loc: string | null; body: string; ms: number }) => {
              const st = kind === "door" ? { status: r.status, loc: r.loc, streamed: false } : streamedStatus(r.status, r.body, r.loc);
              results.push({ part: p.part, who: `${p.label} ${p.email}`, kind, path, status: st.status, loc: st.loc, streamed: st.streamed, rawKeys: kind === "page" && st.status === 200 ? rawKeys(visibleText(r.body)) : [], ms: r.ms });
            };
            for (const path of p.pages) judge("page", path, await fetchOne(path, { cookie: `edulink_session=${token}; __Host-edulink_session=${token}` }));
            for (const path of p.doors) judge("door", path, await fetchOne(path, { authorization: `Bearer ${token}` }));
            process.stderr.write(`    ${p.label.padEnd(50)} ${p.pages.length} page(s), ${p.doors.length} door(s)\n`);
          }
          for (const pg of publicPages) {
            const r = await fetchByHost(pg.host, pg.path);
            const st = streamedStatus(r.status, r.body, r.loc);
            results.push({ part: pg.part, who: `public ${pg.host}`, kind: "public", path: pg.path, status: st.status, loc: st.loc, streamed: st.streamed, rawKeys: st.status === 200 ? rawKeys(visibleText(r.body)) : [], ms: r.ms });
          }
        }
      } finally {
        process.stderr.write(`    ${purge()}\n`);
      }
      for (const r of results) console.log(`  ${r.status === 200 ? "200" : "BAD"} ${r.kind.padEnd(6)} ${String(r.status).padEnd(3)} ${r.who.padEnd(70)} ${r.path}${r.loc && r.status !== 200 ? ` → ${r.loc}` : ""}${r.streamed ? " (streamed)" : ""}${r.rawKeys.length ? ` KEYS ${r.rawKeys.join(",")}` : ""} ${r.ms} ms`);
    }
  }
  const failures = results.filter((r) => r.status !== 200).length;
  const keyPages = results.filter((r) => r.rawKeys.length).length;
  if (out) writeFileSync(out, JSON.stringify({ facts, results }, null, 1));
  console.log(`\n${gaps} fact gap(s); ${results.length} read (${results.filter((r) => r.kind === "page").length} pages, ${results.filter((r) => r.kind === "door").length} doors, ${results.filter((r) => r.kind === "public").length} public), ${failures} not 200, ${keyPages} with a raw key.`);
  if (gaps || failures) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
