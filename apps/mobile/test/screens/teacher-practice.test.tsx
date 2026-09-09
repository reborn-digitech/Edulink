import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { setPracticeSchema, staffPracticeSchema } from "@edulink/contracts";
import { TeacherPractice } from "@/screens/teacher/practice";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SET1 = "czz0000000000000000pa1";
const PRACTICE = staffPracticeSchema.parse({
  classes: [
    { id: ID.class1, name: "ZZ 5A", gradeLevel: "5" },
    { id: ID.class2, name: "ZZ 6B", gradeLevel: null },
  ],
  selectedClassId: ID.class1,
  heatmap: { pupilCount: 20, rows: [{ slug: "fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5, atLevel: [3, 0, 2, 0, 0, 0], tried: 5 }] },
  assignments: [
    {
      id: SET1,
      topicSlug: "fractions",
      topicName: "ZZ Fractions",
      subject: "MATHS",
      classLevel: 5,
      targetLevel: 3,
      targetTierName: "Amateur",
      note: "By Friday",
      dueAt: "2026-09-12T18:29:59.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
      reached: 2,
      pupilCount: 20,
      pupils: [
        { name: "ZZ Asha", level: 3, reached: true },
        { name: "ZZ Ravi", level: 0, reached: false },
      ],
    },
  ],
  weekly: { pupilCount: 20, practiced: 12, answers: 340, climbs: 7, misses: 40 },
  gaps: [{ slug: "decimals", name: "ZZ Decimals", subject: "MATHS", level: 2, stuckCount: 4 }],
  topicOptions: [
    { slug: "fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5 },
    { slug: "plants", name: "ZZ Plants", subject: "SCIENCE", classLevel: 5 },
  ],
});

beforeEach(() => mockRouter.push.mockClear());

describe("the teacher's practice insights", () => {
  it("loads, then shows the week, the gaps, the heatmap and the chapters set; another class asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<TeacherPractice />, "TEACHER", { "GET /api/v1/staff/practice": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PRACTICE));
    await screen.findByText("ZZ Decimals");
    expect(screen.getByLabelText("pupils practiced this week: 12/20")).toBeTruthy();
    expect(screen.getByLabelText("questions answered: 340")).toBeTruthy();
    expect(screen.getByText("4 pupils stuck at L2")).toBeTruthy();
    expect(screen.getByText("L1 3 · L3 2")).toBeTruthy();
    expect(screen.getByText("Maths · Pupils 5/20")).toBeTruthy();
    expect(screen.getByText(/^Target: Amateur · L3 · .* · By Friday$/)).toBeTruthy();
    expect(screen.getByText("2 of 20 reached")).toBeTruthy();
    expect(screen.getByText("ZZ Asha · L3")).toBeTruthy();
    expect(screen.getByText("ZZ Ravi · —")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ 6B" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/staff/practice?classId=${ID.class2}`)).toBe(true));
  });

  it("sets a chapter with the body the contract takes", async () => {
    const { calls } = await mountStaff(<TeacherPractice />, "TEACHER", {
      "GET /api/v1/staff/practice": () => json(PRACTICE),
      "POST /api/v1/staff/practice": () => json({ id: "czz0000000000000000pa2" }),
    });
    await screen.findByText("ZZ Decimals");
    await fireEvent.press(screen.getByRole("radio", { name: "Science" }));
    expect(screen.getByRole("radio", { name: "ZZ Plants" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: /^L4 · / }));
    await fireEvent.changeText(screen.getByLabelText("Note (optional)"), "ZZ read chapter 3 first");
    await fireEvent.changeText(screen.getByLabelText("Due date (optional)"), "2026-09-30");
    await fireEvent.press(screen.getByRole("button", { name: "Set practice" }));
    await screen.findByText("Chapter set. The class sees it on their practice page.");
    const post = calls().find((c) => c.line === "POST /api/v1/staff/practice")!;
    expect(setPracticeSchema.parse(post.body)).toEqual({ classId: ID.class1, topicSlug: "plants", targetLevel: 4, note: "ZZ read chapter 3 first", dueDate: "2026-09-30" });
    expect(screen.getByLabelText("Note (optional)")).toHaveDisplayValue("");
  });

  it("removing asks first, then archives by id", async () => {
    const { calls } = await mountStaff(<TeacherPractice />, "TEACHER", {
      "GET /api/v1/staff/practice": () => json(PRACTICE),
      "POST /api/v1/staff/practice/archive": () => json({ ok: true }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Remove" }));
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/practice/archive")).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Remove" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/staff/practice/archive")?.body).toEqual({ id: SET1 }));
  });

  it("no classes, and no chapters set: each has a door", async () => {
    await mountStaff(<TeacherPractice />, "TEACHER", { "GET /api/v1/staff/practice": () => json({ ...PRACTICE, classes: [], selectedClassId: null, heatmap: null, assignments: [], weekly: null, gaps: [], topicOptions: [] }) });
    await screen.findByText("No classes assigned yet");
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");

    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<TeacherPractice />, "TEACHER", { "GET /api/v1/staff/practice": () => json({ ...PRACTICE, assignments: [], topicOptions: [] }) });
    await screen.findByText("You have not set a chapter for this class yet.");
    await fireEvent.press(screen.getAllByRole("button", { name: "Worksheets" })[0]!);
    expect(open).toHaveBeenCalledWith(`${API_BASE}/teacher/worksheets`);
    // With no chapters to offer, setting one is the web's form.
    await fireEvent.press(screen.getByRole("button", { name: "Open on the web" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/teacher/practice`);
    open.mockRestore();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherPractice />, "TEACHER", { "GET /api/v1/staff/practice": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/practice")).length).toBe(2));
  });
});
