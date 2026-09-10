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
