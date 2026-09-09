import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { staffExamsSchema } from "@edulink/contracts";
import { TeacherExams } from "@/screens/teacher/exams";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SLOT2 = "czz00000000000000000s2";
const EXAMS = staffExamsSchema.parse({
  classes: [
    {
      id: ID.class1,
      name: "ZZ 5A",
      gradeLevel: "5",
      series: [
        {
          id: ID.series1,
          name: "ZZ Term 1",
          kind: "MID_TERM",
          publishedAt: "2026-09-01T00:00:00.000Z",
          slots: [
            { id: ID.slot1, subject: "ZZ Maths", dateKey: "2026-09-15", startMinute: 540, endMinute: 660, maxMarks: 80 },
            { id: SLOT2, subject: "ZZ Science", dateKey: "2026-09-16", startMinute: null, endMinute: null, maxMarks: 50 },
          ],
        },
      ],
    },
    { id: ID.class2, name: "ZZ 6B", gradeLevel: null, series: [] },
  ],
});

beforeEach(() => mockRouter.push.mockClear());

describe("the teacher's exams", () => {
  it("loads, then shows each series and its papers; a paper opens the marks grid with the class and paper picked", async () => {
    const gate = gated();
    await mountStaff(<TeacherExams />, "TEACHER", { "GET /api/v1/staff/exams": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(EXAMS));
    await screen.findByText("ZZ Term 1");
    expect(screen.getByText("Mid-term · ZZ 5A · 5")).toBeTruthy();
    expect(screen.getByText("Published")).toBeTruthy();
    expect(screen.getByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText(/09:00–11:00 · Out of 80$/)).toBeTruthy();
    expect(screen.getByText(/^[A-Za-z]+ 16 · Out of 50$|^16 [A-Za-z]+ · Out of 50$/)).toBeTruthy();
    expect(screen.getByLabelText("Papers: 2")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Maths"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/marks", params: { classId: ID.class1, slotId: ID.slot1 } });
  });

  it("a class with no papers says so and offers the report cards on the web; an admin sees the same", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<TeacherExams />, "ADMIN", { "GET /api/v1/staff/exams": () => json(EXAMS) });
    await screen.findByText("ZZ Term 1");
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ 6B" }));
    expect(await screen.findByText("No papers for this class yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Report cards" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/exams?tab=cards`);
    open.mockRestore();
  });

  it("no classes at all has a door to messages", async () => {
    await mountStaff(<TeacherExams />, "TEACHER", { "GET /api/v1/staff/exams": () => json({ classes: [] }) });
    await screen.findByText("No classes assigned yet");
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherExams />, "TEACHER", { "GET /api/v1/staff/exams": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/exams").length).toBe(2));
  });
});
