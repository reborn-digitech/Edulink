/**
 * The office's and the campus desks' phone screens (testing analysis of 13 November 2026, batch
 * mobile-screens-office): TA-159, TA-160, TA-161, TA-163, TA-353, TA-354, TA-355, TA-487, TA-500 and TA-520.
 */
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { DriverHome } from "@/screens/driver/home";
import { WardenHome } from "@/screens/hostel/warden";
import { instantOf, whenOf } from "@/screens/hostel/words";
import { LibraryDesk } from "@/screens/library/desk";
import { AdmissionSlots } from "@/screens/staff/admission-slots";
import { AdminHome } from "@/screens/staff/admin-home";
import { FeePupil } from "@/screens/staff/fee-pupil";
import { LeaveDesk } from "@/screens/staff/leave";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { Safety } from "@/screens/staff/safety";
import { __setOutboxStore, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { __resetTripPositions } from "@/lib/trip-positions";
import { CYCLE, slot, SLOT1 } from "./admissions-fixtures";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));
const mockStart = jest.fn(async () => "started");
const mockStop = jest.fn(async () => {});
jest.mock("@/lib/trip-location-platform", () => ({
  currentPlace: async () => ({ lat: 18.5, lng: 73.8, accuracy: 12 }),
  startTracking: (...args: unknown[]) => mockStart(...(args as [])),
  stopTracking: () => mockStop(),
  locationAllowed: async () => true,
}));

const offlineReplay = jest.fn(async () => {
  throw new TypeError("Network request failed");
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
  mockStart.mockClear();
  mockStop.mockClear();
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __resetTripPositions();
  offlineReplay.mockClear();
  __setReplayFetch(offlineReplay as unknown as typeof fetch);
});

/* ---- the driver ------------------------------------------------------------------------------------------------- */

const TRIP = "czz0000000000000000trip01";
const SEAT = "czz00000000000000000seat1";
const stop = (id: string, order: number, name: string, minute: number) => ({ id, order, name, lat: 18.5 + order / 100, lng: 73.8, morningMinute: minute, eveningMinute: null, radiusM: 150, scheduledMinute: minute, passedAt: null });
const liveTrip = (extra: Record<string, unknown> = {}) => ({
  id: TRIP,
  dateKey: "2026-10-05",
  direction: "MORNING",
  status: "LIVE",
  scheduledMinute: 430,
  startedAt: "2026-10-05T01:40:00.000Z",
  endedAt: null,
  startReason: null,
  busRegistration: "MH 12 ZZ 1001",
  routeId: "czz0000000000000000route1",
  routeName: "ZZ Route 1",
  driverName: "ZZ Ganesh",
  lastPosition: null,
  lowBattery: false,
  riders: 1,
  boarded: 0,
  stops: [stop("czz00000000000000000stop1", 1, "ZZ Paud Phata corner", 430), stop("czz00000000000000000stop2", 2, "ZZ Karve Statue", 440)],
  track: [],
  roster: [{ allotmentId: SEAT, studentMembershipId: "czz000000000000000pupil01", name: "ZZ Asha", className: "Grade 3 · A", stopId: "czz00000000000000000stop2", stopName: "ZZ Karve Statue", rides: true, boardedAt: null, alightedAt: null }],
  canStart: false,
  ...extra,
});
const today = (trips: unknown[], needed: boolean) => ({ dateKey: "2026-10-05", consent: { needed, textKey: "transport.consentBody", consentedAt: needed ? null : "2026-10-04T10:00:00.000Z" }, trips });
const driver = { ...me("DRIVER" as RoleCode), modules: ["TRANSPORT"] };

describe("the driver's phone as the bus's GPS", () => {
  it("TA-160: a live trip does not start the location before the person has said yes to the location sentence", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(today([liveTrip()], true)) }, { me: driver });
    expect(await screen.findByText("Your location during trips")).toBeTruthy();
    expect(await screen.findByText("Trip running")).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("TA-160: the attendant's phone, which lists the live trip another started, does not send its place as the bus's", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(today([liveTrip({ startedByMe: false })], false)) }, { me: driver });
    expect(await screen.findByText("Trip running")).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(mockStart).not.toHaveBeenCalled();
    expect(screen.queryByText("Sending the bus's location")).toBeNull();
  });

  it("TA-520: a tick made with no signal reaches the server before End", async () => {
    const replay = jest.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
    const { fetch } = await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(today([liveTrip()], false)), [`POST /api/v1/transport/trips/${TRIP}/end`]: () => json({ status: "ENDED", endedAt: "2026-10-05T02:00:00.000Z" }) }, { me: driver });
    expect(await screen.findByText("Trip running")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Mark ZZ Asha on the bus" }));
    // The tick's own try found no signal and is over; the signal comes back as the bus reaches the gate.
    await waitFor(() => expect(offlineReplay.mock.calls.some((args) => String((args as unknown[])[0]).includes(`/trips/${TRIP}/boardings`))).toBe(true));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    __setReplayFetch(replay as unknown as typeof fetch);
    fireEvent.press(screen.getByRole("button", { name: "End trip" }));
    expect(await screen.findByText("End this trip? The bus's location stops being sent.")).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "End trip" });
    await userEvent.setup().press(buttons[buttons.length - 1]!);
    const endAt = () => fetch.mock.calls.findIndex(([input]) => String(input).endsWith(`/trips/${TRIP}/end`));
    await waitFor(() => expect(endAt()).toBeGreaterThanOrEqual(0));
    const boardingCall = replay.mock.calls.findIndex((args) => String((args as unknown[])[0]).includes(`/trips/${TRIP}/boardings`));
    expect(boardingCall).toBeGreaterThanOrEqual(0);
    expect(replay.mock.invocationCallOrder[boardingCall]!).toBeLessThan(fetch.mock.invocationCallOrder[endAt()]!);
  });
});

/* ---- the warden ------------------------------------------------------------------------------------------------- */

const HOSTEL = "czz000000000000000hostel1";
const AL1 = "czz00000000000000000allot1";
const AL2 = "czz00000000000000000allot2";
const hostels = { hostels: [{ id: HOSTEL, name: "ZZ Tilak House", kind: "MIXED", capacity: 9, wardenMembershipId: "m1", wardenName: "ZZ Head", messAttendance: false, beds: 4, occupied: 2, rooms: [] }], wardens: [], canManage: false, canAllot: true };
const sheet = {
  hostelId: HOSTEL,
  hostelName: "ZZ Tilak House",
  dateKey: "2026-10-04",
  slot: "NIGHT",
  taken: null,
  entries: [
    { allotmentId: AL1, membershipId: "m-p1", name: "ZZ Asha", roomNumber: "101", bed: 1, status: "PRESENT", onLeave: false },
    { allotmentId: AL2, membershipId: "m-p2", name: "ZZ Bela", roomNumber: "101", bed: 2, status: "PRESENT", onLeave: false },
  ],
};
const warden = { ...me("WARDEN" as RoleCode), modules: ["HOSTEL"] };

describe("the warden's roll call", () => {
  it("TA-159: a look at Leave and back keeps the marks, and the save sends them", async () => {
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      { "GET /api/v1/hostel/hostels": () => json(hostels), "GET /api/v1/hostel/rollcall": () => json(sheet), "GET /api/v1/hostel/leave": () => json({ items: [] }), "POST /api/v1/hostel/rollcall": () => json({ rollCallId: "r1", present: 1, onLeave: 0, absent: 1, replay: false }) },
      { me: warden },
    );
    expect(await screen.findByText("ZZ Tilak House · 04/10/2026")).toBeTruthy();
    await userEvent.setup().press(screen.getAllByRole("radio", { name: "Absent" })[0]!);
    await userEvent.setup().press(screen.getByRole("radio", { name: "Leave" }));
    await userEvent.setup().press(screen.getByRole("radio", { name: "Roll call" }));
    expect(await screen.findByText("ZZ Tilak House · 04/10/2026")).toBeTruthy();
    expect(screen.getAllByRole("radio", { name: "Absent" })[0]).toBeChecked();
    await userEvent.setup().press(screen.getByRole("button", { name: "Save the roll call" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/hostel/rollcall")).toBe(true));
    expect((calls().find((c) => c.line === "POST /api/v1/hostel/rollcall")!.body as { entries: unknown[] }).entries).toEqual([
      { allotmentId: AL1, status: "ABSENT" },
      { allotmentId: AL2, status: "PRESENT" },
    ]);
  });

  it("TA-159: pulling down reads the sheet again", async () => {
    const { calls } = await mountStaff(<WardenHome />, "WARDEN", { "GET /api/v1/hostel/hostels": () => json(hostels), "GET /api/v1/hostel/rollcall": () => json(sheet) }, { me: warden });
    expect(await screen.findByText("ZZ Tilak House · 04/10/2026")).toBeTruthy();
    const reads = () => calls().filter((c) => c.line.startsWith("GET /api/v1/hostel/rollcall")).length;
    const before = reads();
    // The screen's pull to refresh, as the scroll view's refresh control is handed it.
    const refreshOf = (node: unknown): (() => void) | null => {
      const n = node as { props?: Record<string, unknown>; children?: unknown[] } | null;
      if (!n || typeof n !== "object") return null;
      if (typeof n.props?.onRefresh === "function") return n.props.onRefresh as () => void;
      const control = n.props?.refreshControl as { props?: { onRefresh?: unknown } } | undefined;
      if (typeof control?.props?.onRefresh === "function") return control.props.onRefresh as () => void;
      for (const child of n.children ?? []) {
        const found = refreshOf(child);
        if (found) return found;
      }
      return null;
    };
    const onRefresh = refreshOf(screen.container);
    expect(onRefresh).not.toBeNull();
    await act(async () => {
      onRefresh!();
    });
    await waitFor(() => expect(reads()).toBeGreaterThan(before));
  });
});

/* ---- the leave desk --------------------------------------------------------------------------------------------- */

const pending = (kind: string, countedDays: number) => ({
  id: `l-${kind}`,
  status: "PENDING",
  kind,
  fromDateKey: "2026-11-14",
  toDateKey: "2026-11-16",
  reason: "ZZ reason",
  decisionNote: null,
  applicantName: `ZZ Applicant ${kind}`,
  applicantMembershipId: "m5",
  nominatedName: null,
  decidedByName: null,
  decidedAt: null,
  balance: { entitlement: 12, used: 8, pending: 2, remaining: 2, yearName: "2026-27" },
  dutyClasses: 0,
  countedDays,
  suggestions: { lessonCount: 0, candidates: [], groups: [] },
});

describe("the leave desk's count", () => {
  it("TA-161: sick leave from a Saturday to the Monday counts the server's two school days, and unpaid leave none: neither is 'over'", async () => {
    await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": () => json({ pending: [pending("SICK", 2), pending("UNPAID", 0)], decided: [], staff: [] }) });
    expect(await screen.findByText("ZZ Applicant SICK")).toBeTruthy();
    expect(screen.getByText("ZZ Applicant UNPAID")).toBeTruthy();
    expect(screen.getAllByText("8 of 12 used this year · 2 left")).toHaveLength(2);
    expect(screen.queryByText(/days over/)).toBeNull();
  });
});

/* ---- the sittings ----------------------------------------------------------------------------------------------- */

describe("an entrance-test sitting", () => {
  it("TA-163: one tap on Cancel asks first and posts nothing", async () => {
    mockRouter.params = { id: CYCLE };
    const { calls } = await mountStaff(
      <ToastProvider>
        <AdmissionSlots />
      </ToastProvider>,
      "ADMIN",
      { [`GET /api/v1/office/admissions/cycles/${CYCLE}/slots`]: () => json({ slots: [slot(SLOT1)] }), [`POST /api/v1/office/admissions/slots/${SLOT1}/cancel`]: () => json({ ok: true, released: 2 }) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Cancel" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(calls().some((c) => c.line === `POST /api/v1/office/admissions/slots/${SLOT1}/cancel`)).toBe(false);
    expect(screen.getByText("Cancel this sitting? The families booked on it are released and told.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByText("Cancel this sitting? The families booked on it are released and told.")).toBeNull();
    expect(calls().some((c) => c.line === `POST /api/v1/office/admissions/slots/${SLOT1}/cancel`)).toBe(false);
  });
});

/* ---- the fees counter and settings ----------------------------------------------------------------------------- */

const PUPIL = "czz000000000000000pupil1";
const LEDGER = {
  pupil: { studentMembershipId: PUPIL, name: "ZZ Asha", studentCode: "ZZ-P-01", gradeLevel: "5", className: "ZZ 5A", leftAt: null },
  year: { id: "y1", name: "2026-27" },
  plan: { structureId: "st1", structureName: "ZZ Grade 5 fees" },
  demands: [{ id: "d1", label: "ZZ Term 1", dueDateKey: "2026-06-15", grossPaise: 500_000, concessionPaise: 0, netPaise: 500_000, paidPaise: 0, outstandingPaise: 500_000, status: "OPEN", overdue: true, lines: [] }],
  concessions: [],
  payments: [],
  totals: { netPaise: 500_000, paidPaise: 0, outstandingPaise: 500_000, overduePaise: 500_000 },
  heads: [{ id: "h1", name: "Tuition" }],
  structures: [{ id: "st1", name: "ZZ Grade 5 fees", gradeLevel: "5" }],
  todayKey: "2026-09-17",
};

describe("the counter", () => {
  it("TA-353: an amount corrected after a lost answer goes under its own client id; the same payment sent again keeps its id", async () => {
    mockRouter.params = { studentMembershipId: PUPIL };
    let answers = 0;
    const { calls } = await mountStaff(
      <ToastProvider>
        <FeePupil />
      </ToastProvider>,
      "ADMIN",
      {
        [`GET /api/v1/fees/pupils/${PUPIL}`]: () => json(LEDGER),
        "POST /api/v1/fees/payments": () => {
          answers += 1;
          if (answers <= 2) throw new TypeError("Network request failed");
          return json({ paymentId: "czz0000000000000000pay02", receiptId: "r2", serial: "ZZ/2026/000002", already: false });
        },
      },
    );
    await screen.findByText("Take a payment");
    await fireEvent.changeText(screen.getByLabelText("Amount (₹)"), "5000");
    await fireEvent.press(screen.getByRole("button", { name: "Record and issue receipt" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/fees/payments")).toHaveLength(1));
    await fireEvent.press(await screen.findByRole("button", { name: "Record and issue receipt" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/fees/payments")).toHaveLength(2));
    await fireEvent.changeText(screen.getByLabelText("Amount (₹)"), "3000");
    await fireEvent.press(await screen.findByRole("button", { name: "Record and issue receipt" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/fees/payments")).toHaveLength(3));
    const ids = calls()
      .filter((c) => c.line === "POST /api/v1/fees/payments")
      .map((c) => (c.body as { clientId: string; amountPaise: number }).clientId);
    expect(ids[1]).toBe(ids[0]);
    expect(ids[2]).not.toBe(ids[0]);
  });
});

/* ---- the safety centre ------------------------------------------------------------------------------------------ */

describe("the audit trail's words", () => {
  it("TA-354: a row is worded from the server's key, and a failed two-step code is marked sensitive", async () => {
    const AT = "2026-09-08T09:00:00.000Z";
    const audit = [
      { id: "a1", action: "fees.counterPayment", actorName: "ZZ Office", targetType: null, targetId: null, meta: {}, ip: null, at: AT, actionKey: "audit.feesCounterPayment", sensitive: false },
      { id: "a2", action: "auth.totp.failed", actorName: "ZZ Head", targetType: null, targetId: null, meta: {}, ip: null, at: AT },
    ];
    await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": ({ url }) => json({ openCount: 0, visits: [], reports: [], audit: url.searchParams.get("tab") === "audit" ? audit : [] }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Audit log" }));
    expect(await screen.findByText("Recorded a fee payment at the counter")).toBeTruthy();
    expect(screen.queryByText("fees.counterPayment")).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Sensitive" }));
    expect(screen.getByText("1 of 2 entries")).toBeTruthy();
    expect(screen.queryByText("Recorded a fee payment at the counter")).toBeNull();
  });
});

/* ---- the library's stock-take ----------------------------------------------------------------------------------- */

describe("the stock-take", () => {
  it("TA-355: Finish asks first, the copies not seen stay listed after it, and the scan box empties after a lookup", async () => {
    let started = true;
    const unseen = [{ accession: "ZZ-0007", title: "ZZ Rivers", rack: "ZZ-A4", status: "AVAILABLE" }];
    const st = () => json({ startedAt: started ? "2026-10-04T04:30:00.000Z" : null, total: 30, seen: 29, unseen });
    const { calls } = await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      {
        "GET /api/v1/library/stocktake": st,
        "POST /api/v1/library/stocktake": () => {
          started = false;
          return st();
        },
        "GET /api/v1/library/lookup": () => json({ kind: "NONE", copy: null, member: null, title: null }),
      },
      { me: { ...me("LIBRARIAN" as RoleCode), modules: ["LIBRARY"] } },
    );
    await userEvent.setup().type(await screen.findByLabelText("Code"), "ZZ-0002");
    await userEvent.setup().press(screen.getByRole("button", { name: "Find" }));
    expect(screen.getByLabelText("Code")).toHaveDisplayValue("");
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Stock-take" }));
    await userEvent.setup().press(await screen.findByRole("button", { name: "Finish the stock-take" }));
    expect(calls().some((c) => c.line === "POST /api/v1/library/stocktake")).toBe(false);
    await userEvent.setup().press(await screen.findByRole("button", { name: "Finish the stock-take" }));
    expect(await screen.findByText("The stock-take is finished: 29 of 30 seen.")).toBeTruthy();
    expect(screen.getByText("ZZ-0007 · ZZ Rivers")).toBeTruthy();
  });
});

/* ---- the college homes ------------------------------------------------------------------------------------------ */

describe("a college's office and head on the phone", () => {
  const OVERVIEW = {
    school: { name: "ZZ Vidya", code: "ZZ-1234", timezone: "Asia/Kolkata", todayKey: "2026-09-07" },
    academicYear: { id: "y1", name: "2026-27" },
    runningTerm: { id: "t1", name: "Term 1" },
    nextUp: null,
    checklist: {
      done: 1,
      total: 2,
      complete: false,
      steps: [
        { id: "classes", done: true, href: "/admin/classes/new", titleKey: "checklist.classesTitle", descriptionKey: "checklist.classesSetUpMany", descriptionVars: { count: 4 }, ctaKey: "checklist.classesMoreCta", blockedBy: null },
        { id: "teachers", done: false, href: "/admin/invites/new?role=TEACHER", titleKey: "checklist.teachersTitle", descriptionKey: "checklist.invitesWaitingMany", descriptionVars: { count: 3 }, ctaKey: "checklist.teachersCta", blockedBy: null },
      ],
    },
    counts: { teachers: 0, students: 120, classes: 4, pendingInvites: 0, registersTakenToday: 0, examSeries: 0, examSeriesPublished: 0, reportCardsPublished: 0 },
    attendanceTakenPercent: null,
    staffingGap: { slots: 0, classes: 0 },
    jobStory: { attention: false, entries: [] },
  };

  it("TA-487: the registrar's home draws no school checklist, 'No teachers yet' or exam series", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW) }, { me: { ...me("ADMIN"), institutionKind: "COLLEGE" } });
    expect(await screen.findByText("ZZ Vidya · College code ZZ-1234")).toBeTruthy();
    expect(screen.queryByText("Finish setting up")).toBeNull();
    expect(screen.queryByText("No teachers yet")).toBeNull();
    expect(screen.queryByText("Exams and report cards")).toBeNull();
  });

  it("TA-487: the head's home at a college draws no school register or syllabus card", async () => {
    const cls = { classId: "c1", name: "ZZ Class A", section: null, gradeLevel: "6", pupils: 30, sessionsTaken: 20, attendance: { counts: { PRESENT: 500, LATE: 10, ABSENT: 30, EXCUSED: 5 }, marks: 545, percent: 91 }, progress: { percent: 70, pupilsCounted: 28, pupilsWithNoMarks: 2 }, reportCards: [] };
    const PRINCIPAL = {
      span: 30,
      window: { fromDateKey: "2026-08-08", toDateKey: "2026-09-07" },
      summary: { pupils: 120, classes: 1, attendancePercent: 91.4, registersMissingToday: 2, pendingLeave: 1, concerns: 0 },
      academicYear: { id: "y1", name: "2026-27" },
      runningTerm: null,
      concerns: [],
      classes: [cls],
      reviews: [],
      syllabus: { overallPercent: 40, classesBehind: 1, yearElapsedPercent: 50 },
    };
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(PRINCIPAL) }, { me: { ...me("PRINCIPAL"), institutionKind: "COLLEGE" } });
    expect(await screen.findByRole("button", { name: /1 leave request waiting/ })).toBeTruthy();
    expect(screen.queryByLabelText("Attendance not marked today: 2")).toBeNull();
    expect(screen.queryByText("ZZ Class A")).toBeNull();
    expect(screen.queryByText(/Syllabus/)).toBeNull();
  });
});

/* ---- a hostel leave's clock ------------------------------------------------------------------------------------- */

describe("a hostel leave's times", () => {
  it("TA-500: typed times are read on the school's clock and printed on it, whatever the phone's zone", () => {
    expect(instantOf("19/12/2026 16:00", "America/New_York")).toBe("2026-12-19T21:00:00.000Z");
    expect(instantOf("2026-07-04 09:30", "America/New_York")).toBe("2026-07-04T13:30:00.000Z");
    expect(instantOf("19/12/2026 16:00", "Asia/Kolkata")).toBe("2026-12-19T10:30:00.000Z");
    expect(whenOf("2026-12-19T21:00:00.000Z", "en", "America/New_York")).toMatch(/^19\/12\/2026, 4:00\sPM$/);
    expect(instantOf("31/02/2026 16:00", "Asia/Kolkata")).toBeNull();
  });
});
