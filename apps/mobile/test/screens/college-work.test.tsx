import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { CollegeWorkScreen, dueOf } from "@/screens/academics/college-work";
import { CollegeWorkItemScreen } from "@/screens/academics/college-work-item";
import { HIDDEN_SCREENS, menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => mockParams }));

/**
 * Homework at a college on the phone (R-48, the risks batch of 5 Oct 2026):
 * FACULTY and HOD list their offerings, open one, set a piece of work on it
 * (published or a draft; a past due date sent again meaning it), and on the
 * next screen publish a draft, mark the registered students in one batch and
 * post the marks into an internal component. The More entry is a college's.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const OFF = id("off1");
const WORK = id("work1");
const atCollege = (role: RoleCode) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE" });
const home = { offerings: [{ offeringId: OFF, courseCode: "PHY101", courseName: "ZZ Mechanics", termName: "ZZ Odd term", divisionName: null, registered: 2, mine: true, work: 1, toMark: 1 }] };
const offering = { offeringId: OFF, courseCode: "PHY101", courseName: "ZZ Mechanics", termName: "ZZ Odd term", divisionName: null, registered: 2, items: [{ id: WORK, title: "ZZ Lab report 1", category: "Lab report", pointsMilli: 20000, dueAt: null, publishedAt: "2026-10-01T10:00:00.000Z", submitted: 2, graded: 1, registered: 2 }], components: [{ id: id("comp1"), name: "ZZ Assignments", maxMarks: 10 }], locked: false };
const row = (n: number, over: Record<string, unknown> = {}) => ({ membershipId: id(`stu${n}`), name: `ZZ Student ${n}`, fullName: `ZZ Student ${n}`, avatarKey: null, submittedAt: "2026-10-02T10:00:00.000Z", submissionStatus: "SUBMITTED", late: false, scoreMilli: null, letter: null, comment: null, gradedAt: null, work: { body: `ZZ answers ${n}`, attachments: [] }, ...over });
const book = (over: Record<string, unknown> = {}) => ({
  assignment: { id: WORK, offeringId: OFF, title: "ZZ Lab report 1", body: "ZZ Write up experiment 1.", category: "Lab report", pointsMilli: 20000, dueAt: null, publishedAt: null, label: "PHY101 ZZ Mechanics", attachments: [] },
  rows: [row(1, { scoreMilli: 15000, comment: "ZZ good" }), row(2)],
  stats: { total: 2, submitted: 2, graded: 1, averagePercent: 75 },
  components: offering.components,
  locked: false,
  ...over,
});
const withToasts = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

beforeEach(() => {
  mockPush.mockClear();
  mockParams = {};
});

describe("the college homework screen", () => {
  it("lists the offerings, opens one and sets a piece of work on it", async () => {
    const { calls } = await mountStaff(
      withToasts(<CollegeWorkScreen />),
      "FACULTY",
      { "GET /api/v1/academics/work": () => json(home), [`GET /api/v1/academics/offerings/${OFF}/work`]: () => json(offering), [`POST /api/v1/academics/offerings/${OFF}/work`]: () => json({ assignmentId: id("work2"), notified: 2, handouts: 0 }, 201) },
      { me: atCollege("FACULTY") },
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("To mark: 1")).toBeTruthy();
    await fireEvent.press(screen.getByText("PHY101 · ZZ Mechanics"));
    expect(await screen.findByText("ZZ Lab report 1")).toBeTruthy();
    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Problem set 2");
    await fireEvent.changeText(screen.getByLabelText("Marks out of"), "10");
    await fireEvent.press(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST /api/v1/academics/offerings/${OFF}/work`)?.body).toEqual({ title: "ZZ Problem set 2", body: "", points: 10, publish: true }));
    expect(await screen.findByText("Published. The registered students have been told.")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Lab report 1"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/(app)/college-work-item", params: { assignmentId: WORK } });
    await fireEvent.press(screen.getByRole("button", { name: "All courses" }));
    expect(await screen.findByText("PHY101 · ZZ Mechanics")).toBeTruthy();
  });

  it("offers to set a past due date again, meaning it, after the server refuses it", async () => {
    let sent = 0;
    const { calls } = await mountStaff(
      withToasts(<CollegeWorkScreen />),
      "HOD",
      {
        "GET /api/v1/academics/work": () => json(home),
        [`GET /api/v1/academics/offerings/${OFF}/work`]: () => json({ ...offering, items: [] }),
        [`POST /api/v1/academics/offerings/${OFF}/work`]: () => (sent++ === 0 ? json({ error: "The due date has already passed; confirm it to set the work anyway.", code: "INVALID" }, 422) : json({ assignmentId: id("work3"), notified: 2, handouts: 0 }, 201)),
      },
      { me: atCollege("HOD") },
    );
    await fireEvent.press(await screen.findByText("PHY101 · ZZ Mechanics"));
    expect(await screen.findByText("No work set yet")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Late");
    await fireEvent.changeText(screen.getByLabelText("Due"), "2020-01-01");
    await fireEvent.press(screen.getByRole("button", { name: "Publish" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    await fireEvent.press(await screen.findByRole("button", { name: "The due date has passed, and I mean that date." }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST /api/v1/academics/offerings/${OFF}/work`)[1]?.body).toMatchObject({ title: "ZZ Late", publish: true, confirmPastDue: true, dueAt: dueOf("2020-01-01") }));
  });

  it("asks nothing of the server for a role it is not for", async () => {
    const a = await mountStaff(<CollegeWorkScreen />, "TEACHER", {}, { me: atCollege("TEACHER") });
    expect(screen.getByText("Work is set on a course you teach, or one in the department you head.")).toBeTruthy();
    expect(a.calls().filter((c) => c.line.startsWith("GET /api/v1/academics"))).toHaveLength(0);
  });

  it("with ACADEMICS off says so and offers More", async () => {
    await mountStaff(<CollegeWorkScreen />, "FACULTY", {}, { me: { ...me("FACULTY"), modules: [] } });
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });

  it("is in a college teacher's More, and a hidden screen", () => {
    for (const role of ["FACULTY", "HOD"] as const) expect(menuFor(role, ["ACADEMICS"]).flatMap((g) => g.items).some((i) => i.screen === "/(app)/college-work")).toBe(true);
    expect(menuFor("FACULTY", []).flatMap((g) => g.items).some((i) => i.screen === "/(app)/college-work")).toBe(false);
    expect(HIDDEN_SCREENS).toEqual(expect.arrayContaining(["college-work", "college-work-item"]));
    expect(dueOf("not a day")).toBeUndefined();
  });
});

describe("one piece of work", () => {
  it("publishes the draft, saves the marks as a batch and posts them into a component", async () => {
    mockParams = { assignmentId: WORK };
    const base = `/api/v1/academics/work/${WORK}`;
    const { calls } = await mountStaff(
      withToasts(<CollegeWorkItemScreen />),
      "FACULTY",
      { [`GET ${base}`]: () => json(book()), [`POST ${base}/publish`]: () => json({ ok: true }), [`POST ${base}/grades`]: () => json({ saved: 1, cleared: 0, rejected: 0 }), [`POST ${base}/internal`]: () => json({ posted: 2, notMarked: 0, componentId: id("comp1") }) },
      { me: atCollege("FACULTY") },
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("This work is a draft. Students cannot see it yet.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${base}/publish`)).toBe(true));
    expect(screen.getByText("ZZ answers 2")).toBeTruthy();
    const save = screen.getByRole("button", { name: "Save marks" });
    expect(save).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Student 2"), "99");
    expect(screen.getByText("1 mark is not a usable number.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Student 2"), "12.5");
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${base}/grades`)?.body).toEqual({ grades: [{ studentMembershipId: id("stu2"), score: 12.5, comment: "" }] }));
    await fireEvent.press(screen.getByRole("button", { name: "Post the marks" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${base}/internal`)?.body).toEqual({ componentId: id("comp1") }));
    expect(await screen.findByText("The marks are posted into the internal component.")).toBeTruthy();
  });

  it("says why nothing can be posted once the offering is locked", async () => {
    mockParams = { assignmentId: WORK };
    await mountStaff(<CollegeWorkItemScreen />, "HOD", { [`GET /api/v1/academics/work/${WORK}`]: () => json(book({ locked: true, components: [], assignment: { ...book().assignment, publishedAt: "2026-10-01T10:00:00.000Z" } })) }, { me: atCollege("HOD") });
    expect(await screen.findByText("This course's internal marks are locked, so nothing more can be posted.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Post the marks" })).toBeNull();
  });

  it("has a way back with no id", async () => {
    mockParams = {};
    await mountStaff(<CollegeWorkItemScreen />, "HOD", {}, { me: atCollege("HOD") });
    await fireEvent.press(screen.getByRole("button", { name: "All courses" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/college-work");
  });
});
