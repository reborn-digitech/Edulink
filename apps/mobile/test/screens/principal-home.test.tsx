import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { gated, json, mountStaff, offline, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const cls = (classId: string, name: string, percent: number | null) => ({
  classId,
  name,
  section: null,
  gradeLevel: "6",
  pupils: 30,
  sessionsTaken: 20,
  attendance: { counts: { PRESENT: 500, LATE: 10, ABSENT: 30, EXCUSED: 5 }, marks: 545, percent },
  progress: { percent: 70, pupilsCounted: 28, pupilsWithNoMarks: 2 },
  reportCards: [],
});

const OVERVIEW = {
  span: 30,
  window: { fromDateKey: "2026-08-08", toDateKey: "2026-09-07" },
  summary: { pupils: 120, classes: 2, attendancePercent: 91.4, registersMissingToday: 2, pendingLeave: 1, concerns: 1 },
  academicYear: { id: "y1", name: "2026-27" },
  runningTerm: { id: "t1", name: "Term 1", endDateKey: "2026-12-18" },
  concerns: [cls("c2", "ZZ Class B", 68.2)],
  classes: [cls("c1", "ZZ Class A", 95.1), cls("c2", "ZZ Class B", 68.2)],
  reviews: [{ membershipId: "m2", name: "ZZ Teacher", allTime: { responseCount: 12, byQuestion: { q1: 4.2 }, overall: 4.3 }, latest: { overall: 4.3, count: 12 }, previous: null, delta: null }],
};

const FILINGS = "GET /api/v1/office/filings";
const filings = (identityMissing: string[], ready: number) => ({
  identity: { udiseCode: null, board: "CBSE", affiliationNumber: null, district: "Pune", block: null, medium: "English", managementType: "PRIVATE_UNAIDED", state: "Maharashtra", city: "Pune", postalCode: "411001" },
  identityMissing,
  pupils: { total: 48, ready, missing: ready < 48 ? { gender: 48 - ready } : {}, withoutLocalName: 0 },
  staff: { total: 10, ready: 10, missing: {} },
  grades: [{ gradeLevel: "3", pupils: 48 }],
  academicYearName: "2026-27",
});

describe("filings on the head's dashboard", () => {
  it("while a pupil lacks a UDISE+ field, names the count and opens the filings; nothing when all are ready", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [FILINGS]: () => json(filings([], 45)) });
    expect(await screen.findByText("Filings")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "45 of 48 pupils have every UDISE+ field" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/filings");
  });

  it("draws no card when the identity is whole and every pupil is ready", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [FILINGS]: () => json(filings([], 48)) });
    await screen.findByText("Classes worth a look");
    expect(screen.queryByText("Filings")).toBeNull();
  });
});

const PEN_CHANGES = "GET /api/v1/office/pen-changes";
describe("PEN corrections on the head's dashboard", () => {
  it("while one waits, counts it and opens the pupil records; nothing when none does", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [PEN_CHANGES]: () => json({ items: [], pending: 2 }) });
    expect(await screen.findByText("PEN corrections")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "2 waiting, Corrections the office has proposed to pupils\u2019 PENs, and where each stands." }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });

  it("draws no card when nothing waits", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [PEN_CHANGES]: () => json({ items: [], pending: 0 }) });
    await screen.findByText("ZZ Class A");
    expect(screen.queryByText("PEN corrections")).toBeNull();
  });
});

const RECORD_CHANGES = "GET /api/v1/office/record-changes";
describe("families' asks on the head's dashboard", () => {
  it("while one waits, counts it and opens the pupil records; nothing when none does", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [RECORD_CHANGES]: () => json({ items: [], pending: 1 }) });
    expect(await screen.findByText("Changes families have asked for")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "1 waiting, A family cannot change a record itself. Approve to put their values on the record, or decline." }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });

  it("draws no card when nothing waits", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), [RECORD_CHANGES]: () => json({ items: [], pending: 0 }) });
    await screen.findByText("ZZ Class A");
    expect(screen.queryByText("Changes families have asked for")).toBeNull();
  });
});

describe("the principal's dashboard", () => {
  it("loads, then shows what can be fixed today and the classes", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    await screen.findByText("Classes worth a look");
    expect(screen.getAllByText("ZZ Class B")).toHaveLength(2);
    expect(screen.getByLabelText("Attendance not marked today: 2")).toBeTruthy();
    expect(screen.getByLabelText("Attendance: 91%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /1 leave request waiting/ })).toBeTruthy();
    expect(screen.getByText("Classes worth a look")).toBeTruthy();
    expect(screen.getByText("ZZ Teacher")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/overview?days=30")).toBe(true);
  });

  it("the window picker asks the API for another span", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW) });
    await screen.findByText("ZZ Class A");
    await fireEvent.press(screen.getByRole("radio", { name: "7 days" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/overview?days=7")).toBe(true));
    expect(screen.getByRole("radio", { name: "7 days" })).toBeChecked();
  });

  it("with no classes, says so", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json({ ...OVERVIEW, classes: [], concerns: [], summary: { ...OVERVIEW.summary, classes: 0 } }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
  });

  it("the syllabus card reads the coverage report when the overview does not carry the figures, and opens it", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", {
      "GET /api/v1/staff/principal/overview": () => json(OVERVIEW),
      "GET /api/v1/office/syllabus/coverage": () => json({ yearName: "2026-27", yearElapsedPercent: 40, overallPercent: 35, classesBehind: 2, rows: [] }),
    });
    await screen.findByText("ZZ Class A");
    const card = await screen.findByRole("button", { name: "Syllabus coverage, 2 classes behind · 40% of the year gone" });
    expect(screen.getByText("35%")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/office/syllabus/coverage")).toBe(true);
    await fireEvent.press(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/syllabus-coverage");
  });

  it("the syllabus card takes the overview's own figures when it carries them, and asks for nothing more", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", {
      "GET /api/v1/staff/principal/overview": () => json({ ...OVERVIEW, syllabus: { overallPercent: 60, classesBehind: 0, yearElapsedPercent: 55 } }),
      "GET /api/v1/office/syllabus/coverage": () => json({ yearName: "2026-27", yearElapsedPercent: 40, overallPercent: 35, classesBehind: 2, rows: [] }),
    });
    await screen.findByText("ZZ Class A");
    expect(await screen.findByRole("button", { name: "Syllabus coverage, Nobody is behind · 55% of the year gone" })).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.queryByText("35%")).toBeNull();
    expect(calls().some((c) => c.line === "GET /api/v1/office/syllabus/coverage")).toBe(false);
  });

  it("the syllabus card says there is no syllabus yet when the overview carries null, and still opens the report", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json({ ...OVERVIEW, syllabus: null }) });
    await screen.findByText("ZZ Class A");
    await fireEvent.press(await screen.findByRole("button", { name: "Syllabus coverage, No syllabus yet" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/syllabus-coverage");
    expect(calls().some((c) => c.line === "GET /api/v1/office/syllabus/coverage")).toBe(false);
  });

  it("a refusal is an alert with a retry; a dropped connection too", async () => {
    let failures = 0;
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", {
      "GET /api/v1/staff/principal/overview": (req) => (failures++ === 0 ? refused("The dashboard could not be loaded.")(req) : offline(req)),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("The dashboard could not be loaded.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/principal/overview")).length).toBe(2));
    // The first failure's alert is still on screen when the retry is sent: wait for the words, not for an alert.
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Network request failed"));
  });
});

describe("the college at a glance on the head's home (G-4, campaign 2026-10-04)", () => {
  const GLANCE = {
    school: { name: "ZZ Vidya College", affiliatingUniversity: "ZZ University" },
    today: "2026-10-04",
    term: { id: "t1", name: "ZZ Odd term" },
    faculty: { total: 3, present: 2, onLeave: 1, absent: 0, unmarked: 0, closed: false },
    fees: { year: "2026-27", demandPaise: 7_850_000, collectedPaise: 1_825_000, outstandingPaise: 6_025_000, defaulters: 2 },
    scholarships: null,
    hostel: null,
    grievances: { open: 2, overdue: 1 },
    incidentsOpen: 0,
    predictor: { cgpa: 2.91, grade: "B+", nextGrade: "A", distance: 0.1 },
    lectures: [{ departmentId: "d1", name: "ZZ Physics", lectures: 4, marked: 3, presentPercent: 81 }],
    approvals: [
      { key: "lateRegistration", count: 1, href: "/admin/academics/registration" },
      { key: "grace", count: 0, href: "/exam-cell" },
    ],
  };
  const college = (role: "PRINCIPAL") => ({
    user: { id: "u1", name: "ZZ Head", preferredName: null, email: "head@zz.test", avatarKey: null, isMinor: false, locale: "en" },
    active: { schoolId: "s1", role, membershipId: "m1" },
    contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role, institutionKind: "COLLEGE" }],
    modules: ["ACADEMICS"],
    institutionKind: "COLLEGE",
  });

  it("at a college: what waits for the head first, each opened on the web, then the numbers", async () => {
    const { Linking } = jest.requireActual<typeof import("react-native")>("react-native");
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW), "GET /api/v1/principal/college": () => json(GLANCE) }, { me: college("PRINCIPAL") });
    expect(await screen.findByText("Waiting for your word")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /1 late registrations asked by the office/ }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/academics\/registration$/));
    // A queue at zero is not listed.
    expect(screen.queryByText(/grace-mark proposals/)).toBeNull();
    expect(screen.getByLabelText("Faculty present: 2 of 3")).toBeTruthy();
    expect(screen.getByText("Faculty present: 1 on leave, 0 absent, 0 not marked")).toBeTruthy();
    open.mockRestore();
  });

  it("at a school: no college card and no request for one", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW) });
    expect(await screen.findByText("ZZ Class A")).toBeTruthy();
    expect(screen.queryByText("Waiting for your word")).toBeNull();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/principal/college"))).toBe(false);
  });
});
