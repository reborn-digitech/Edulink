/**
 * qb-C (31 October 2026): THE QA PASS'S CAMPUS-FORM, TRANSPORT AND DEMO FINDINGS (docs/qa/campaign-2026-10-31).
 *
 * QB-12  an e-resource is corrected by its name in any capitals or spacing (LibraryEResource.nameKey, unique per
 *        school): "zz qbc diksha", "ZZ QBC  DIKSHA" and "ZZ QBC DIKSHA" are one row, through the form and the door,
 *        and two adds of one name at once leave one row.
 * QB-13  an ISBN-10 and the ISBN-13 of one book are one title: the list's lines are read as ISBN-13, a title the desk
 *        keeps under an ISBN-10 is found by its ISBN-13, and a new title is stored as its ISBN-13.
 * QB-11  (the ISBN copy) "1 title added", never "1 titles added"; an empty paste says what is wanted beside the box.
 * QB-14  a room change asked for a bed the room lacks is 422 and a taken bed 409, both about `bed`, at the door and on
 *        the form; two moves of one place at once give one move and a 409 "has just been moved", and a press after
 *        the move is told the same.
 * QB-16  a family's bus page shows the next run by the school's clock: at 03:00 the morning (07:35), not the evening;
 *        after the morning ends, the evening; after both, the evening's end. The clock is pinned.
 * QB-15  the demo roster's paths behind a platform switch are marked, the table is every feature layout's own, and the
 *        marking is idempotent.
 *
 * One ZZ school of this file's own (LIBRARY, HOSTEL, TRANSPORT on, open every day), removed after by id with
 * everything under it.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { PrismaClient } from "@prisma/client";
import { eResourceNameKey, isbn13, isbnForms, normaliseIsbn } from "@edulink/contracts";
import { FORM_IDLE } from "@/lib/form-state";
import { createSession, type ActiveContext } from "@/lib/session";
import { translator } from "@/lib/i18n/dictionary";
import { changeRoom, importIsbnList, saveEResource } from "@/lib/college-campus";
import { familyTransport, nextRunOf } from "@/lib/transport";
import { eResourceSaveAction, isbnListAction } from "@/app/(app)/library/actions";
import { moveBoarderAction } from "@/app/(app)/hostel/actions";
import { POST as eResourcePost } from "@/app/api/v1/library/eresources/route";
import { POST as roomChangePost } from "@/app/api/v1/hostel/room-change/route";
import { FEATURE_GATED_PAGES, featureLegend, featuresOfPath, gatedPathsIn, markFeatureGated, strayMarksIn } from "../scripts/demo-feature-paths";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const t = translator("en");
const ids: Record<string, string> = {};
const user: Record<string, string> = {};
const member: Record<string, string> = {};
let schoolId = "";

const ctx = (key: string, role: ActiveContext["role"]): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key]!, schoolId, role, user: { id: user[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-qbc-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: role === "STUDENT", isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
async function as(who: string, role: string, route: string) {
  __resetCookies();
  __setHeaders({ "x-edulink-route": route });
  await createSession(user[who]!, { schoolId, role: role as never });
}
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const json = (body: unknown) => new Request("http://localhost/api/v1/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ QBC School ${STAMP}`, slug: `zz-qbc-${STAMP}`, code: `ZQC${SUFFIX}`, contactEmail: `zz-qbc-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "SCHOOL", isTestFixture: true, teachingDays: "0,1,2,3,4,5,6" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["LIBRARY", "HOSTEL", "TRANSPORT"].map((module) => ({ schoolId, module })) });
  const person = async (key: string, role: string) => {
    user[key] = (await db.user.create({ data: { name: `ZZ QBC ${key} ${STAMP}`, email: `zz-qbc-${key.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, isMinor: role === "STUDENT" }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: user[key]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZQ${key}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  };
  for (const [key, role] of [["admin", "ADMIN"], ["librarian", "LIBRARIAN"], ["warden", "WARDEN"], ["driver", "DRIVER"], ["p1", "STUDENT"], ["p2", "STUDENT"], ["p3", "STUDENT"]] as const) await person(key, role);

  // A house: room A of two beds (pupil 1 in bed 1, pupil 2 in bed 2), room B of three beds (pupil 3 in bed 1).
  ids.house = (await db.hostel.create({ data: { schoolId, name: "ZZ QBC house", kind: "MIXED", capacity: 5 }, select: { id: true } })).id;
  ids.roomA = (await db.hostelRoom.create({ data: { schoolId, hostelId: ids.house!, number: "A", beds: 2 }, select: { id: true } })).id;
  ids.roomB = (await db.hostelRoom.create({ data: { schoolId, hostelId: ids.house!, number: "B", beds: 3 }, select: { id: true } })).id;
  const board = async (key: string, who: string, room: string, bed: number) =>
    (ids[key] = (await db.hostelAllotment.create({ data: { schoolId, membershipId: member[who]!, roomId: ids[room]!, bed, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: member[who]!, activeBedKey: `${ids[room]}:${bed}`, allottedByUserId: user.admin! }, select: { id: true } })).id);
  await board("p1Place", "p1", "roomA", 1);
  await board("p2Place", "p2", "roomA", 2);
  await board("p3Place", "p3", "roomB", 1);

  // A route both ways: one stop, the morning at 07:35 and the evening at 14:40 (Sunrise's Route 1 shape); a bus and its
  // driver on it; pupil 1 rides it.
  ids.route = (await db.transportRoute.create({ data: { schoolId, name: "ZZ QBC Route", kind: "FIXED", direction: "BOTH" }, select: { id: true } })).id;
  ids.stop = (await db.transportStop.create({ data: { schoolId, routeId: ids.route!, order: 1, name: "ZZ QBC Gate", lat: 18.5, lng: 73.8, morningMinute: 455, eveningMinute: 880 }, select: { id: true } })).id;
  ids.bus = (await db.bus.create({ data: { schoolId, registration: `MH 12 QB ${SUFFIX.slice(-4)}`, capacity: 30 }, select: { id: true } })).id;
  await db.busAssignment.create({ data: { schoolId, busId: ids.bus!, routeId: ids.route!, driverMembershipId: member.driver!, fromDateKey: "2026-07-01" } });
  await db.transportAllotment.create({ data: { schoolId, studentMembershipId: member.p1!, routeId: ids.route!, stopId: ids.stop!, fromDateKey: "2026-07-01" } });
});

afterEach(() => {
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  await db.session.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.notification.deleteMany({ where: { userId: { in: Object.values(user) } } });
  await db.user.deleteMany({ where: { id: { in: Object.values(user) } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* QB-12                                                                       */
/* -------------------------------------------------------------------------- */

describe("QB-12: an e-resource is corrected by its name in any capitals or spacing", () => {
  it("the key is the name trimmed, its spaces collapsed, in lower case", () => {
    expect(["ZZ DIKSHA", "zz diksha", "  ZZ   DIKSHA ", "ZZ\tDiksha"].map(eResourceNameKey)).toEqual(["zz diksha", "zz diksha", "zz diksha", "zz diksha"]);
    expect(eResourceNameKey("दीक्षा  ई-पुस्तकें")).toBe("दीक्षा ई-पुस्तकें");
  });

  it("the QA steps: added on the form, then sent as 'zz qbc diksha' and 'ZZ QBC  DIKSHA' through the door, then as typed: one row, corrected each time", async () => {
    await as("librarian", "LIBRARIAN", "POST /library/e-resources");
    expect((await eResourceSaveAction(FORM_IDLE, form({ back: "/library/e-resources", name: "ZZ QBC DIKSHA", url: "https://diksha.gov.in/", kind: "EBOOK" }))).ok).toBe(true);
    await as("librarian", "LIBRARIAN", "POST /api/v1/library/eresources");
    for (const [name, url] of [["zz qbc diksha", "https://diksha.gov.in/moved"], ["ZZ QBC  DIKSHA", "https://diksha.gov.in/again"], ["ZZ QBC DIKSHA", "https://diksha.gov.in/last"]]) {
      const res = await eResourcePost(json({ name, url, kind: "EBOOK" }));
      expect(res.status, name).toBe(200);
      expect(((await res.json()) as { name: string }).name, name).toBe("ZZ QBC DIKSHA");
    }
    const rows = await db.libraryEResource.findMany({ where: { schoolId, nameKey: "zz qbc diksha" } });
    expect(rows.map((r) => [r.name, r.url])).toEqual([["ZZ QBC DIKSHA", "https://diksha.gov.in/last"]]);
  });

  it("two adds of one name at once, in different capitals, leave one row", async () => {
    const results = await Promise.allSettled([
      saveEResource(ctx("librarian", "LIBRARIAN"), { name: "ZZ QBC N-LIST", url: "https://nlist.inflibnet.ac.in/a", kind: "NLIST" }),
      saveEResource(ctx("admin", "ADMIN"), { name: "zz qbc n-list", url: "https://nlist.inflibnet.ac.in/b", kind: "NLIST" }),
    ]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    expect(await db.libraryEResource.count({ where: { schoolId, nameKey: "zz qbc n-list" } })).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* QB-13 and the ISBN copy of QB-11                                            */
/* -------------------------------------------------------------------------- */

describe("QB-13: an ISBN-10 and the ISBN-13 of one book are one title", () => {
  it("the forms: 0306406152 is 9780306406157, and back", () => {
    expect(isbn13(normaliseIsbn("0-306-40615-2")!)).toBe("9780306406157");
    expect(isbnForms("9780306406157")).toEqual(["9780306406157", "0306406152"]);
    expect(isbnForms("0306406152")).toEqual(["9780306406157", "0306406152"]);
    // An ISBN-10 whose check digit is X, and a 979 number with no ISBN-10.
    expect(isbnForms(normaliseIsbn("080442957X")!)).toEqual(["9780804429573", "080442957X"]);
    expect(isbnForms("9791090636071")).toEqual(["9791090636071"]);
  });

  it("the QA steps: the ISBN-13 added, then it, its hyphenated form and its ISBN-10 together are all already in the catalogue", async () => {
    await as("librarian", "LIBRARIAN", "POST /library/catalogue");
    const first = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "9780306406157, ZZ QBC Optics, ZZ Author, ZZ Press, 2019" }));
    expect(first).toMatchObject({ ok: true, message: "1 title added, 0 already in the catalogue." });
    const again = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "9780306406157, ZZ QBC Optics\n978-0-306-40615-7, ZZ QBC Optics\n0306406152, ZZ QBC Optics" }));
    expect(again).toMatchObject({ ok: true, message: t("campusForms.isbnAddedMany", { added: 0, already: 3 }) });
    expect(await db.libraryTitle.count({ where: { schoolId, title: "ZZ QBC Optics" } })).toBe(1);
  });

  it("a title the desk keeps under an ISBN-10 is found by its ISBN-13; a new book from an ISBN-10 is stored as its ISBN-13; a book twice in one list is added once", async () => {
    await db.libraryTitle.create({ data: { schoolId, isbn: "080442957X", title: "ZZ QBC Kept as ten" } });
    const r = await importIsbnList(ctx("admin", "ADMIN"), "9780804429573, ZZ QBC Kept as ten\n0-14-303103-1, ZZ QBC Fresh\n9780143031031, ZZ QBC Fresh");
    expect(r).toEqual({ added: 1, already: 2, invalid: [] });
    expect((await db.libraryTitle.findMany({ where: { schoolId, title: { startsWith: "ZZ QBC" } }, select: { isbn: true }, orderBy: { isbn: "asc" } })).map((x) => x.isbn)).toEqual(["080442957X", "9780143031031", "9780306406157"]);
  });

  it("QB-11: one title is 'title', many 'titles', with the failing ISBNs named; an empty paste says what is wanted beside the box", async () => {
    await as("librarian", "LIBRARIAN", "POST /library/catalogue");
    const named = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "9780545010221, ZZ QBC Seven\n9780545010222, ZZ QBC Broken" }));
    expect(named).toMatchObject({ ok: true, message: "1 title added, 0 already in the catalogue. These ISBNs fail their check digit: 9780545010222." });
    const many = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "9780439064873, ZZ QBC Two\n9780439136365, ZZ QBC Three" }));
    expect(many).toMatchObject({ ok: true, message: "2 titles added, 0 already in the catalogue." });
    const empty = await isbnListAction(FORM_IDLE, form({ back: "/library/catalogue", text: "   \n  " }));
    expect(empty).toMatchObject({ ok: false, field: "text", message: t("campusForms.isbnEmpty") });
    expect(empty.message).not.toBe(t("refusal.notValid"));
    for (const lang of ["hi", "mr"] as const) {
      expect(translator(lang)("campusForms.isbnAddedOne", { already: 0 })).not.toContain("campusForms");
      expect(translator(lang)("campusForms.isbnEmpty")).not.toBe(t("campusForms.isbnEmpty"));
    }
  });
});

/* -------------------------------------------------------------------------- */
/* QB-14                                                                       */
/* -------------------------------------------------------------------------- */

type ApiBody = { error: string; code: string; issues?: Record<string, string> };

describe("QB-14: a room change's refusals are 409 and 422 about the bed, and the race loser is told the boarder has just moved", () => {
  it("a taken bed is 409 and a bed the room lacks 422, each about `bed`, nothing moved", async () => {
    await as("warden", "WARDEN", "POST /api/v1/hostel/room-change");
    const taken = await roomChangePost(json({ allotmentId: ids.p1Place, roomId: ids.roomB, bed: 1 }));
    expect(taken.status).toBe(409);
    expect((await taken.json()) as ApiBody).toMatchObject({ code: "CONFLICT", error: t("hostel.refuseBedTaken"), issues: { bed: t("hostel.refuseBedTaken") } });
    const noBed = await roomChangePost(json({ allotmentId: ids.p1Place, roomId: ids.roomA, bed: 3 }));
    expect(noBed.status).toBe(422);
    expect((await noBed.json()) as ApiBody).toMatchObject({ code: "BAD_REQUEST", error: t("hostel.refuseNoSuchBed", { beds: 2 }), issues: { bed: t("hostel.refuseNoSuchBed", { beds: 2 }) } });
    expect((await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.p1Place } })).status).toBe("ACTIVE");
  });

  it("the form says the same beside the bed box", async () => {
    await as("warden", "WARDEN", "POST /hostel/rooms");
    expect(await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Place!, bed: `${ids.roomB}:1` }))).toMatchObject({ ok: false, field: "bed", message: t("hostel.refuseBedTaken") });
    expect(await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p1Place!, bed: `${ids.roomA}:3` }))).toMatchObject({ ok: false, field: "bed", message: t("hostel.refuseNoSuchBed", { beds: 2 }) });
  });

  it("two moves of one place at once (to two free beds): one moves, the other is 409 'has just been moved'; one live place remains", async () => {
    await as("warden", "WARDEN", "POST /api/v1/hostel/room-change");
    const answers = await Promise.all([
      roomChangePost(json({ allotmentId: ids.p3Place, roomId: ids.roomB, bed: 2 })),
      roomChangePost(json({ allotmentId: ids.p3Place, roomId: ids.roomB, bed: 3 })),
    ]);
    const statuses = answers.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);
    const loser = answers.find((r) => r.status === 409)!;
    expect((await loser.json()) as ApiBody).toMatchObject({ code: "CONFLICT", error: t("campusForms.refuseJustMoved"), issues: { bed: t("campusForms.refuseJustMoved") } });
    const live = await db.hostelAllotment.findMany({ where: { membershipId: member.p3, status: "ACTIVE" }, select: { fromDate: true, roomId: true } });
    expect(live).toEqual([{ fromDate: today(), roomId: ids.roomB }]);
    expect((await db.hostelAllotment.findUniqueOrThrow({ where: { id: ids.p3Place } })).status).toBe("ENDED");
  });

  it("a press after the move, from the page drawn before it, is told the boarder has just been moved, not that they were not found", async () => {
    await as("warden", "WARDEN", "POST /hostel/rooms");
    expect(await moveBoarderAction(FORM_IDLE, form({ back: "/hostel/rooms", allotmentId: ids.p3Place!, bed: `${ids.roomB}:1` }))).toMatchObject({ ok: false, field: "bed", message: t("campusForms.refuseJustMoved") });
    // An id that was never a place here is still "not found".
    await expect(changeRoom(ctx("warden", "WARDEN"), { allotmentId: "czzqbcnosuchplace0000001", roomId: ids.roomB!, bed: 1 })).rejects.toMatchObject({ key: "hostel.refuseNoAllotment", code: "NOT_FOUND" });
  });
});

/* -------------------------------------------------------------------------- */
/* QB-16                                                                       */
/* -------------------------------------------------------------------------- */

describe("QB-16: a family's bus page shows the next run by the school's clock", () => {
  const run = (direction: "MORNING" | "EVENING", status: "SCHEDULED" | "LIVE" | "ENDED" | "MISSED", scheduledMinute: number | null) => ({ direction, status, scheduledMinute });
  const pick = (runs: ReturnType<typeof run>[]) => nextRunOf(runs, (r) => r)?.direction;

  it("the rule: LIVE first; else the earliest still waiting; else the run most lately due", () => {
    // Evening first, as the day's trips load (their direction sorts first): both waiting, the morning is next.
    expect(pick([run("EVENING", "SCHEDULED", 880), run("MORNING", "SCHEDULED", 455)])).toBe("MORNING");
    expect(pick([run("EVENING", "SCHEDULED", 880), run("MORNING", "ENDED", 455)])).toBe("EVENING");
    expect(pick([run("EVENING", "SCHEDULED", 880), run("MORNING", "MISSED", 455)])).toBe("EVENING");
    expect(pick([run("EVENING", "LIVE", 880), run("MORNING", "SCHEDULED", 455)])).toBe("EVENING");
    expect(pick([run("EVENING", "ENDED", 880), run("MORNING", "ENDED", 455)])).toBe("EVENING");
    expect(pick([run("EVENING", "MISSED", 880), run("MORNING", "ENDED", 455)])).toBe("EVENING");
    // No stop times: the morning before the evening.
    expect(pick([run("EVENING", "SCHEDULED", null), run("MORNING", "SCHEDULED", null)])).toBe("MORNING");
    expect(pick([])).toBeUndefined();
  });

  // Tuesday 3 November 2026 in Asia/Kolkata (UTC+05:30), the clock pinned.
  const DAY = "2026-11-03";
  const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00+05:30`);

  it("the QA step: at 03:00 on a school day, before any trip, the rider is shown the morning run, waiting", async () => {
    const view = await familyTransport(ctx("p1", "STUDENT"), null, at("03:00"));
    expect(view.trip).toMatchObject({ direction: "MORNING", status: "SCHEDULED" });
    expect(await db.trip.count({ where: { schoolId, dateKey: DAY } })).toBe(2);
  });

  it("once the morning run has ended, the evening; once both have, the evening's end", async () => {
    const morning = await db.trip.findFirstOrThrow({ where: { schoolId, dateKey: DAY, direction: "MORNING" }, select: { id: true } });
    await db.trip.update({ where: { id: morning.id }, data: { status: "ENDED", startedAt: at("07:30"), endedAt: at("08:20") } });
    expect((await familyTransport(ctx("p1", "STUDENT"), null, at("10:00"))).trip).toMatchObject({ direction: "EVENING", status: "SCHEDULED" });
    const evening = await db.trip.findFirstOrThrow({ where: { schoolId, dateKey: DAY, direction: "EVENING" }, select: { id: true } });
    await db.trip.update({ where: { id: evening.id }, data: { status: "ENDED", startedAt: at("14:40"), endedAt: at("15:10") } });
    expect((await familyTransport(ctx("p1", "STUDENT"), null, at("22:00"))).trip).toMatchObject({ direction: "EVENING", status: "ENDED" });
  });
});

/* -------------------------------------------------------------------------- */
/* QB-15                                                                       */
/* -------------------------------------------------------------------------- */

describe("QB-15: the roster marks the pages a platform switch closes", () => {
  it("the table is every feature layout's own: each layout or page under src/app/(app) that locks on a switch is in it with its switches, and nothing else is", () => {
    const root = join(__dirname, "..", "src", "app", "(app)");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/^(layout|page)\.tsx$/.test(name)) files.push(p);
      }
    };
    walk(root);
    const found = new Map<string, string[]>();
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const m = /(?:featurePageLock|requireFeatureSwitchPage)\(([^)]*)\)/.exec(text);
      if (!m) continue;
      const arg = m[1]!.trim();
      const features = arg === "SESSION_FEATURES" ? ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] : [...arg.matchAll(/"([A-Z_]+)"/g)].map((x) => x[1]!);
      // The route is the page's folders without the groups, cut before the first dynamic segment: the roster names
      // "a page and everything under it", so /student/practice-once/[assignmentId] is the prefix /student/practice-once.
      const segs = relative(root, file).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s));
      const dyn = segs.findIndex((s) => s.startsWith("["));
      const route = `/${(dyn === -1 ? segs : segs.slice(0, dyn)).join("/")}`;
      found.set(route, features);
    }
    expect(found.size).toBeGreaterThanOrEqual(15);
    expect(Object.fromEntries([...found].sort())).toEqual(Object.fromEntries(FEATURE_GATED_PAGES.map((g) => [g.prefix, [...g.features]]).sort()));
  });

  it("marks each gated path once, after its query too, and leaves the rest alone; a second pass changes nothing", () => {
    const text = "| Admin | /admin, /admin/vacancies, /enquiries |\n| Spare | /vacancies (applied), /expert, /expert/bookings/abc, /experts/bookings/<id>, /sessions?child=x, /admin/sessions, http://sunrise.localhost:3000/ |";
    const marked = markFeatureGated(text);
    expect(marked).toBe(
      "| Admin | /admin, /admin/vacancies (behind JOB_BOARD), /enquiries |\n| Spare | /vacancies (behind JOB_BOARD) (applied), /expert, /expert/bookings/abc (behind EXPERT_SESSIONS), /experts/bookings/<id> (behind EXPERT_SESSIONS), /sessions?child=x (behind EXPERT_SESSIONS or TEACHER_SESSIONS), /admin/sessions (behind EXPERT_SESSIONS or TEACHER_SESSIONS), http://sunrise.localhost:3000/ |",
    );
    expect(markFeatureGated(marked)).toBe(marked);
    expect(gatedPathsIn(text).every((g) => !g.marked)).toBe(true);
    expect(gatedPathsIn(marked).map((g) => [g.path, g.marked])).toEqual([["/admin/vacancies", true], ["/vacancies", true], ["/expert/bookings/abc", true], ["/experts/bookings/<id>", true], ["/sessions?child=x", true], ["/admin/sessions", true]]);
    expect(strayMarksIn(marked)).toEqual([]);
    expect(strayMarksIn("/admin (behind JOB_BOARD), /vacancies (behind QUESTION_BANK)")).toEqual(["/admin (behind JOB_BOARD)", "/vacancies (behind QUESTION_BANK)"]);
    expect(featuresOfPath("/expert")).toBeNull();
    expect(featuresOfPath("/expertise")).toBeNull();
  });

  it("the legend says what a mark means and how each switch stood", () => {
    const legend = featureLegend({ JOB_BOARD: false, ASSISTANT: true });
    expect(legend).toContain("ASSISTANT on, JOB_BOARD off");
    expect(markFeatureGated(legend)).toBe(legend);
  });
});
