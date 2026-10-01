import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { myCoversSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { MyCovers } from "@/screens/teacher/my-covers";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/staff/substitutions/me";

const MINE = myCoversSchema.parse({
  dateKey: "2026-09-17",
  items: [
    { id: "czz00000000000000000cv2", slotId: "sl2", periodName: "Period 2", position: 1, startMinute: 580, endMinute: 620, classId: "c2", className: "ZZ 5B", subject: "English", room: null, absentName: "ZZ Anita", note: "Take the reader" },
    { id: "czz00000000000000000cv3", slotId: "sl3", periodName: null, position: 2, startMinute: null, endMinute: null, classId: "c3", className: "ZZ 6A", subject: "Science", room: "Lab", absentName: "ZZ Bala", note: null, acknowledgedAt: "2026-09-17T03:00:00.000Z" },
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

describe("my answer to a cover", () => {
  const ACK = "POST /api/v1/teaching/covers/czz00000000000000000cv2/acknowledge";
  const DECLINE = "POST /api/v1/teaching/covers/czz00000000000000000cv2/decline";
  const page = () => (
    <ToastProvider>
      <MyCovers />
    </ToastProvider>
  );

  it("a cover already taken shows Taken and no take button; a fresh one offers both answers; taking posts to acknowledge and rereads", async () => {
    const { calls } = await mountStaff(page(), "TEACHER", { ...answers(), [ACK]: () => json({ changed: true, state: "ACKNOWLEDGED" }) });
    await screen.findByText("English · ZZ 5B");
    expect(screen.getByText("Taken")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "I’ll take it: Science · ZZ 6A" })).toBeNull();
    expect(screen.getByRole("button", { name: "I can’t: Science · ZZ 6A" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "I’ll take it: English · ZZ 5B" }));
    expect(await screen.findByText("Noted — the lesson is yours.")).toBeTruthy();
    expect(calls().some((c) => c.line === ACK)).toBe(true);
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });

  it("declining asks why, refuses a blank, posts the reason and says the office was told; a declined cover shows the reason", async () => {
    const { calls } = await mountStaff(page(), "TEACHER", {
      [`GET ${PATH}`]: () => json({ ...MINE, items: [MINE.items[0]!, { ...MINE.items[1]!, acknowledgedAt: null, declinedAt: "2026-09-17T04:00:00.000Z", declineReason: "A duty at the gate" }] }),
      [DECLINE]: () => json({ changed: true, state: "DECLINED" }),
    });
    await screen.findByText("English · ZZ 5B");
    expect(screen.getByText("Declined")).toBeTruthy();
    expect(screen.getByText("You said: A duty at the gate")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "I can’t: English · ZZ 5B" }));
    await fireEvent.press(screen.getByRole("button", { name: "Tell the office" }));
    expect(screen.getByText("Say why in a few words, so the office can plan.")).toBeTruthy();
    expect(calls().some((c) => c.line === DECLINE)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Why you cannot take it"), "  A clash with my own lesson ");
    await fireEvent.press(screen.getByRole("button", { name: "Tell the office" }));
    expect(await screen.findByText("The office has been told.")).toBeTruthy();
    const sent = calls().find((c) => c.line === DECLINE);
    expect(sent?.body).toEqual({ reason: "A clash with my own lesson" });
  });

  it("a refusal from the server is shown and nothing changes", async () => {
    await mountStaff(page(), "TEACHER", { ...answers(), [ACK]: refused("That cover is not one of yours.", 404) });
    await fireEvent.press(await screen.findByRole("button", { name: "I’ll take it: English · ZZ 5B" }));
    expect(await screen.findByText("That cover is not one of yours.")).toBeTruthy();
  });
});
