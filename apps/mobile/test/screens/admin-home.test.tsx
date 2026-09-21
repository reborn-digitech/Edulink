import { fireEvent, screen } from "@testing-library/react-native";
import { AdminHome } from "@/screens/staff/admin-home";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OVERVIEW = {
  school: { name: "ZZ School", code: "ZZ-1234", timezone: "Asia/Kolkata", todayKey: "2026-09-07" },
  academicYear: { id: "y1", name: "2026-27" },
  runningTerm: { id: "t1", name: "Term 1" },
  nextUp: { name: "Diwali break", startDateKey: "2026-11-08" },
  checklist: {
    done: 2,
    total: 3,
    complete: false,
    steps: [
      { id: "year", done: true, href: "/admin/calendar", titleKey: "admin.setUpYear", descriptionKey: "admin.setupProgress", ctaKey: "admin.setUpYear", blockedBy: null },
      { id: "teachers", done: false, href: "/admin/invites/new?role=TEACHER", titleKey: "admin.invitePeople", descriptionKey: "admin.setupProgress", ctaKey: "admin.invitePeople", blockedBy: null },
      { id: "verify", done: false, href: "/account/verify", titleKey: "meta.confirmEmail", descriptionKey: "admin.setupProgress", ctaKey: "meta.confirmEmail", blockedBy: null },
    ],
  },
  counts: { teachers: 8, students: 120, classes: 4, pendingInvites: 3, registersTakenToday: 3, examSeries: 2, examSeriesPublished: 1, reportCardsPublished: 0 },
  attendanceTakenPercent: 75,
  staffingGap: { slots: 5, classes: 2 },
  jobStory: { attention: false, entries: [] },
};

beforeEach(() => mockRouter.push.mockClear());

describe("the admin's overview", () => {
  it("loads, then shows the school, the checklist, the counts and the staffing gap", async () => {
    const gate = gated();
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    await screen.findByText("Lessons without a teacher");
    expect(screen.getByText("ZZ School · School code ZZ-1234")).toBeTruthy();
    expect(screen.getByText("2 of 3 done — you can come back to this any time.")).toBeTruthy();
    expect(screen.getByText("8 teachers · 120 pupils · 4 classes")).toBeTruthy();
    expect(screen.getByText("3 pending")).toBeTruthy();
    expect(screen.getByLabelText("Attendance marked: 3 of 4 today")).toBeTruthy();
    expect(screen.getByText("5 lessons across 2 classes have no teacher yet. Assign a teacher, or post a vacancy to hire one.")).toBeTruthy();
  });

  it("every door is the app's own screen: a checklist step with its role, its section for a step with no screen, the editor, exams and invitations", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW) });
    await fireEvent.press(await screen.findByRole("button", { name: "Invite people, Setup progress" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/invites", params: { role: "TEACHER" } });
    await fireEvent.press(screen.getByRole("button", { name: "Confirm your email, Setup progress" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/account" });
    await fireEvent.press(screen.getByRole("button", { name: "Open the timetable" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/timetable-editor");
    await fireEvent.press(screen.getByRole("button", { name: "Schedule exams" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/exams");
    await fireEvent.press(screen.getByRole("button", { name: "Invite people" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
    // A step already done is not a door.
    expect(screen.queryByRole("button", { name: "Set up the year, Setup progress" })).toBeNull();
  });

  it("a school with nothing yet is told to start the year and invite a teacher", async () => {
    await mountStaff(<AdminHome />, "ADMIN", {
      "GET /api/v1/admin/overview": () =>
        json({ ...OVERVIEW, academicYear: null, runningTerm: null, nextUp: null, counts: { ...OVERVIEW.counts, teachers: 0, classes: 0, registersTakenToday: 0, pendingInvites: 0, examSeries: 0 }, attendanceTakenPercent: null, staffingGap: { slots: 0, classes: 0 } }),
    });
    expect(await screen.findByText("Start your academic year")).toBeTruthy();
    expect(screen.getByText("No teachers yet")).toBeTruthy();
    expect(screen.getByLabelText("Attendance marked: No classes yet")).toBeTruthy();
    expect(screen.queryByText("Lessons without a teacher")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Set up the year" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/calendar");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("alert");
    expect(calls().filter((c) => c.line === "GET /api/v1/admin/overview").length).toBeGreaterThanOrEqual(2);
  });
});

const FILINGS = "GET /api/v1/office/filings";
const filings = (identityMissing: string[], ready: number) => ({
  identity: { udiseCode: null, board: "CBSE", affiliationNumber: null, district: "Pune", block: null, medium: "English", managementType: "PRIVATE_UNAIDED", state: "Maharashtra", city: "Pune", postalCode: "411001" },
  identityMissing,
  pupils: { total: 48, ready, missing: ready < 48 ? { gender: 48 - ready } : {}, withoutLocalName: 0 },
  staff: { total: 10, ready: 10, missing: {} },
  grades: [{ gradeLevel: "3", pupils: 48 }],
  academicYearName: "2026-27",
});

describe("filings on the office's overview", () => {
  it("while the identity has a blank or a pupil lacks a field, names the gap and opens the filings", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW), [FILINGS]: () => json(filings(["udiseCode"], 40)) });
    expect(await screen.findByText("Filings")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "40 of 48 pupils have every UDISE+ field, Still blank: UDISE+ code" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/filings");
  });

  it("draws no card when the identity is whole and every pupil is ready", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW), [FILINGS]: () => json(filings([], 48)) });
    await screen.findByText("Lessons without a teacher");
    await screen.findByText("Admissions").catch(() => undefined);
    expect(screen.queryByText("Filings")).toBeNull();
    expect(screen.queryByText(/pupils have every UDISE\+ field/)).toBeNull();
  });
});

describe("admissions on the office's overview", () => {
  const CYCLES = "GET /api/v1/office/admissions/cycles";
  const cycle = (status: string) => ({
    id: "czz000000000000000cycle1",
    academicYearId: "czz0000000000000000year1",
    name: "ZZ Admissions 2026-27",
    grades: [{ grade: "1", seats: 5 }],
    documents: [],
    testRequired: false,
    notice: "",
    feeStructureId: null,
    opensAt: null,
    closesAt: null,
    status,
    academicYearName: "2026-27",
    feeStructureName: null,
    seats: [{ grade: "1", seats: 5, applied: 3, offered: 1, accepted: 1, admitted: 0, waitlisted: 0 }],
    counts: { SUBMITTED: 3, OFFERED: 1, ACCEPTED: 1, ADMITTED: 0, DECLINED: 0, WAITLISTED: 0, WITHDRAWN: 0 },
    updatedAt: "2026-09-18T05:00:00.000Z",
  });

  it("while a cycle is open, counts the pipeline and opens it on that cycle", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW), [CYCLES]: () => json({ cycles: [cycle("OPEN")], years: [], structures: [] }) });
    expect(await screen.findByText("Admissions")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Admissions 2026-27, 3 submitted · 1 offered · 1 accepted" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/applications", params: { cycleId: "czz000000000000000cycle1" } });
  });

  it("draws no card when no cycle is open", async () => {
    await mountStaff(<AdminHome />, "ADMIN", { "GET /api/v1/admin/overview": () => json(OVERVIEW), [CYCLES]: () => json({ cycles: [cycle("CLOSED")], years: [], structures: [] }) });
    await screen.findByText("Lessons without a teacher");
    expect(screen.queryByText("Admissions")).toBeNull();
    expect(screen.queryByText("ZZ Admissions 2026-27")).toBeNull();
  });
});
