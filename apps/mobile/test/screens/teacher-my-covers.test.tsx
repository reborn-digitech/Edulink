import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { myCoversSchema } from "@edulink/contracts";
import { MyCovers } from "@/screens/teacher/my-covers";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/staff/substitutions/me";

const MINE = myCoversSchema.parse({
  dateKey: "2026-09-17",
  items: [
    { slotId: "sl2", periodName: "Period 2", position: 1, startMinute: 580, endMinute: 620, classId: "c2", className: "ZZ 5B", subject: "English", room: null, absentName: "ZZ Anita", note: "Take the reader" },
    { slotId: "sl3", periodName: null, position: 2, startMinute: null, endMinute: null, classId: "c3", className: "ZZ 6A", subject: "Science", room: "Lab", absentName: "ZZ Bala", note: null },
  ],
});

/** The answer echoes the date asked for, so the arrows can be seen to move the day. */
const answers = (): Answers => ({
  [`GET ${PATH}`]: ({ url }) => json({ ...MINE, dateKey: url.searchParams.get("date") ?? MINE.dateKey }),
});

describe("the lessons I am covering", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("lists each lesson with its period, room, whose it is and the office's note", async () => {
    const { calls } = await mountStaff(<MyCovers />, "TEACHER", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("English · ZZ 5B");
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByText("Period 2 · 09:40–10:20 · For ZZ Anita")).toBeTruthy();
    expect(screen.getByText("Note: Take the reader")).toBeTruthy();
    expect(screen.getByText("Science · ZZ 6A")).toBeTruthy();
    expect(screen.getByText("Period 3 · Lab · For ZZ Bala")).toBeTruthy();
    expect(screen.getByText("Thu, Sep 17")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });

  it("the day arrows ask the API for that day, and Today comes back", async () => {
    const { calls } = await mountStaff(<MyCovers />, "TEACHER", answers());
    await screen.findByText("English · ZZ 5B");
    await fireEvent.press(screen.getByRole("button", { name: "Next day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-18`)).toBe(true));
    await screen.findByText("Fri, Sep 18");
    await fireEvent.press(screen.getByRole("button", { name: "Today" }));
    await screen.findByText("Thu, Sep 17");
    await fireEvent.press(screen.getByRole("button", { name: "Previous day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-16`)).toBe(true));
  });

  it("a day with nothing to cover is an empty state with a door to the timetable", async () => {
    await mountStaff(<MyCovers />, "TEACHER", { [`GET ${PATH}`]: () => json({ ...MINE, items: [] }) });
    await screen.findByText("No covers today");
    expect(screen.getByText("When the office asks you to take a colleague's lesson, it shows here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open the timetable" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/timetable");
  });
});
