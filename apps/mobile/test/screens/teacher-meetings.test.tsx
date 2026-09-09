import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { publishSlotsSchema, staffMeetingsSchema } from "@edulink/contracts";
import { TeacherMeetings } from "@/screens/teacher/meetings";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SLOT2 = "czz00000000000000000s2";
const MEETINGS = staffMeetingsSchema.parse({
  timezone: "Asia/Kolkata",
  slots: [
    { id: ID.slot1, startsAt: "2026-09-11T09:30:00.000Z", endsAt: "2026-09-11T09:45:00.000Z", location: "Room 4", note: null, booking: { childName: "ZZ Asha", parentName: "ZZ Meera", note: "About maths" } },
    { id: SLOT2, startsAt: "2026-09-11T09:45:00.000Z", endsAt: "2026-09-11T10:00:00.000Z", location: null, note: null, booking: null },
  ],
});

describe("the teacher's meetings", () => {
  it("loads, then shows the slots in the school's zone with who booked them", async () => {
    const gate = gated();
    await mountStaff(<TeacherMeetings />, "TEACHER", { "GET /api/v1/staff/meetings": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(MEETINGS));
    await screen.findByText(/^Booked for ZZ Asha by ZZ Meera — “About maths”$/);
    // 09:30Z is 3 pm in Kolkata; the row names the slot's start and end in that zone.
    expect(screen.getByText(/3:00.*3:15.*· Room 4$/)).toBeTruthy();
    expect(screen.getByLabelText("Booked: 1")).toBeTruthy();
    expect(screen.getByLabelText("Still open: 1")).toBeTruthy();
    expect(screen.getAllByText("Still open").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(2);
  });

  it("offers a run of slots with the body the contract takes, and refuses an empty day first", async () => {
    const { calls } = await mountStaff(<TeacherMeetings />, "TEACHER", {
      "GET /api/v1/staff/meetings": () => json(MEETINGS),
      "POST /api/v1/staff/meetings": () => json({ created: 6 }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Offer these times" }));
    expect(screen.getByText("Pick a day and a start time.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/meetings")).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Day"), "2026-09-18");
    await fireEvent.changeText(screen.getByLabelText("Where"), "Room 7");
    await fireEvent.press(screen.getByRole("button", { name: "Offer these times" }));
    await screen.findByText("6 slots offered. Families can book them now.");
    const post = calls().find((c) => c.line === "POST /api/v1/staff/meetings")!;
    expect(publishSlotsSchema.parse(post.body)).toEqual({ date: "2026-09-18", time: "15:00", durationMinutes: 15, count: 6, location: "Room 7" });
    expect(screen.getByLabelText("Day")).toHaveDisplayValue("");
  });

  it("cancelling asks first, then withdraws the slot by id; keep backs out", async () => {
    const { calls } = await mountStaff(<TeacherMeetings />, "TEACHER", {
      "GET /api/v1/staff/meetings": () => json(MEETINGS),
      "POST /api/v1/staff/meetings/cancel": () => json({ ok: true }),
    });
    await screen.findByText(/^Booked for ZZ Asha/);
    await fireEvent.press(screen.getAllByRole("button", { name: "Cancel" })[1]!);
    expect(screen.getByText("Cancel this slot? The family is told straight away.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByText("Cancel this slot? The family is told straight away.")).toBeNull();
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/meetings/cancel")).toHaveLength(0);
    await fireEvent.press(screen.getAllByRole("button", { name: "Cancel" })[1]!);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/staff/meetings/cancel")?.body).toEqual({ slotId: SLOT2 }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/meetings")).toHaveLength(2));
  });

  it("no slots yet points at the form", async () => {
    await mountStaff(<TeacherMeetings />, "TEACHER", { "GET /api/v1/staff/meetings": () => json({ ...MEETINGS, slots: [] }) });
    await screen.findByText("No slots offered yet. Offer a run above.");
    const doors = screen.getAllByRole("button", { name: "Offer these times" });
    expect(doors).toHaveLength(2);
    await fireEvent.press(doors[1]!);
    expect(screen.getByLabelText("Day")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherMeetings />, "TEACHER", { "GET /api/v1/staff/meetings": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/meetings").length).toBe(2));
  });
});
