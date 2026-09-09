import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { newAssignmentSchema, staffAssignmentsSchema } from "@edulink/contracts";
import { TeacherAssignments } from "@/screens/teacher/assignments";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const A1 = "czz00000000000000000a1";
const A2 = "czz00000000000000000a2";
const LIST = staffAssignmentsSchema.parse({
  year: { name: "2026-27", thisYearCount: 2, allCount: 5 },
  showingAllYears: false,
  classOptions: [
    { id: ID.class1, name: "ZZ 5A" },
    { id: ID.class2, name: "ZZ 6B" },
  ],
  filters: { classId: null, state: null },
  total: 2,
  assignments: [
    {
      id: A1,
      title: "ZZ Fractions worksheet",
      category: "Homework",
      pointsMilli: 20_000,
      dueAt: "2026-09-10T10:30:00.000Z",
      publishedAt: "2026-09-01T08:00:00.000Z",
      createdAt: "2026-09-01T08:00:00.000Z",
      class: { id: ID.class1, name: "ZZ 5A", color: null, students: 24 },
      submissions: 10,
      graded: 6,
    },
    {
      id: A2,
      title: "ZZ Reading log",
      category: null,
      pointsMilli: null,
      dueAt: null,
      publishedAt: null,
      createdAt: "2026-09-02T08:00:00.000Z",
      class: { id: ID.class2, name: "ZZ 6B", color: "#123456", students: 20 },
      submissions: 0,
      graded: 0,
    },
  ],
});

beforeEach(() => mockRouter.push.mockClear());

describe("the teacher's assignments", () => {
  it("loads, then shows the list with its class, due date, marking and drafts; filters ask the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<TeacherAssignments />, "TEACHER", { "GET /api/v1/staff/assignments": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(LIST));
    await screen.findByText("ZZ Fractions worksheet");
    expect(screen.getByText("2 pieces of work")).toBeTruthy();
    expect(screen.getByText(/^ZZ 5A · Homework · Points available: 20 · Due .* · 6 of 24 marked$/)).toBeTruthy();
    expect(screen.getByText("18 · To mark")).toBeTruthy();
    expect(screen.getByText("ZZ Reading log")).toBeTruthy();
    expect(screen.getByText(/^ZZ 6B · No due date · 0 of 20 marked$/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish now" })).toBeTruthy();
    expect(screen.getByLabelText("To mark: 1")).toBeTruthy();
    expect(screen.getByLabelText("Draft: 1")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "To mark" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/assignments?state=tomark")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ 6B" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/staff/assignments?classId=${ID.class2}&state=tomark`)).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "All years · 5" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/staff/assignments?years=all&classId=${ID.class2}&state=tomark`)).toBe(true));
  });

  it("a row opens the gradebook on the web; a draft publishes with its id", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<TeacherAssignments />, "ADMIN", {
      "GET /api/v1/staff/assignments": () => json(LIST),
      "POST /api/v1/staff/assignments/publish": () => json({ ok: true }),
    });
    await fireEvent.press(await screen.findByText("ZZ Fractions worksheet"));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/teacher/assignments/${A1}`);
    await fireEvent.press(screen.getByRole("button", { name: "Publish now" }));
    await screen.findByText(/^Published The class and their guardians have been told\./);
    expect(calls().find((c) => c.line === "POST /api/v1/staff/assignments/publish")?.body).toEqual({ assignmentId: A2 });
    open.mockRestore();
  });

  it("sets a new piece of work with the body the contract takes", async () => {
    const { calls } = await mountStaff(<TeacherAssignments />, "TEACHER", {
      "GET /api/v1/staff/assignments": () => json({ ...LIST, assignments: [LIST.assignments[0]] }),
      "POST /api/v1/staff/assignments": () => json({ assignmentId: A2, notified: 24 }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "New assignment" }));
    // Nothing sent with an empty title.
    await fireEvent.press(screen.getByRole("button", { name: "Publish now" }));
    expect(screen.getByText("Check the highlighted fields.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/assignments")).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Quiz on fractions");
    await fireEvent.press(screen.getByRole("radio", { name: "Quiz" }));
    await fireEvent.changeText(screen.getByLabelText("Due date"), "2026-09-20");
    await fireEvent.press(screen.getByRole("button", { name: "Publish now" }));
    await screen.findByText("Work set. 24 students and their guardians were told.");
    const post = calls().find((c) => c.line === "POST /api/v1/staff/assignments")!;
    const body = newAssignmentSchema.parse(post.body);
    expect(body).toMatchObject({ classId: ID.class1, title: "ZZ Quiz on fractions", body: "", category: "Quiz", points: 20, publish: true });
    expect(body.dueAt).toBe(new Date("2026-09-20T16:00:00").toISOString());
    expect(screen.queryByLabelText("Title")).toBeNull();
  });

  it("no classes, nothing set, nothing matching: each has a door", async () => {
    await mountStaff(<TeacherAssignments />, "TEACHER", { "GET /api/v1/staff/assignments": () => json({ ...LIST, year: null, classOptions: [], total: 0, assignments: [] }) });
    await screen.findByText("No classes assigned yet");
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");

    const { calls } = await mountStaff(<TeacherAssignments />, "TEACHER", {
      "GET /api/v1/staff/assignments": ({ url }) => json({ ...LIST, year: null, total: url.searchParams.get("state") ? 2 : 0, assignments: [] }),
    });
    await screen.findByText("No assignments yet");
    await fireEvent.press(screen.getByRole("button", { name: "Set some work" }));
    expect(screen.getByLabelText("Title")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Draft" }));
    await screen.findByText("Nothing matches");
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    await screen.findByText("No assignments yet");
    expect(calls().filter((c) => c.line === "GET /api/v1/staff/assignments")).toHaveLength(2);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherAssignments />, "TEACHER", { "GET /api/v1/staff/assignments": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/assignments")).length).toBe(2));
  });
});
