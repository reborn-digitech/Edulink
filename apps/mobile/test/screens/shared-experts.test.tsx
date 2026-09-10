import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Experts } from "@/screens/shared/experts";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SLOT = "czz00000000000000000slot1";
const EXPERTS = {
  specialisms: ["Maths", "Robotics"],
  experts: [
    {
      id: "e1",
      name: "ZZ Expert",
      headline: "ZZ Careers adviser",
      bio: "Fifteen years in engineering.",
      organisation: "ZZ Org",
      specialisms: ["Maths", "Robotics"],
      verified: true,
      offering: "BOTH",
      mentorCapacity: 3,
      mentoringOpen: true,
      openSlots: [{ id: SLOT, startsAt: "2030-01-10T09:30:00.000Z", endsAt: "2030-01-10T10:30:00.000Z", note: "ZZ Bring questions" }],
    },
  ],
  bookings: [{ id: "b1", topic: "ZZ Talk", status: "CONFIRMED", startsAt: "2030-01-12T09:30:00.000Z", endsAt: "2030-01-12T10:30:00.000Z", expertName: "ZZ Booked", schoolName: "ZZ School", unread: 2 }],
};
const PATH = "GET /api/v1/staff/experts";
const BOOK = "POST /api/v1/staff/experts/book";

describe("the expert marketplace", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows the bookings and the experts, and books a time with a topic", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Experts />, "ADMIN", { [PATH]: gate.answer, [BOOK]: () => json({ bookingId: "b2" }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(EXPERTS));
    await screen.findByText("ZZ Careers adviser");
    expect(screen.getByRole("header", { name: "ZZ Expert" })).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("ZZ Org")).toBeTruthy();
    expect(screen.getAllByText("Robotics").length).toBeGreaterThan(0);
    expect(screen.getByText("Both · up to 3 at a time")).toBeTruthy();
    expect(screen.getByText("ZZ Bring questions")).toBeTruthy();
    expect(screen.getByText("ZZ Booked")).toBeTruthy();
    expect(screen.getByText("2 new")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Book" }));
    const confirm = screen.getByRole("button", { name: "Confirm booking" });
    expect(confirm).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("What would you like to discuss with ZZ Expert?"), "ZZ Robotics talk");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm booking" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/staff/experts/book")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/staff/experts/book")?.body).toEqual({ slotId: SLOT, topic: "ZZ Robotics talk" });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm booking" })).toBeNull());
  });

  it("the filters and the search ask the API; a booking opens in the app", async () => {
    const { calls } = await mountStaff(<Experts />, "TEACHER", { [PATH]: () => json(EXPERTS) });
    await screen.findByText("ZZ Careers adviser");
    await fireEvent.press(screen.getByRole("radio", { name: "Mentoring one child at a time" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/experts?offering=MENTORING")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "Robotics" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/experts?offering=MENTORING&specialism=Robotics")).toBe(true));
    await fireEvent.changeText(screen.getByLabelText("Search"), "robot");
    await fireEvent(screen.getByLabelText("Search"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/experts?q=robot&offering=MENTORING&specialism=Robotics")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Booked/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/booking", params: { bookingId: "b1" } });
  });

  it("with nobody listed, says so, and the door is Mentoring", async () => {
    await mountStaff(<Experts />, "ADMIN", { [PATH]: () => json({ specialisms: [], experts: [], bookings: [] }) });
    expect(await screen.findByText("No experts listed yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Mentoring" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/mentoring");
  });

  it("a refused booking is an alert", async () => {
    await mountStaff(<Experts />, "ADMIN", { [PATH]: () => json(EXPERTS), [BOOK]: refused("ZZ taken", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Book" }));
    await fireEvent.changeText(screen.getByLabelText("What would you like to discuss with ZZ Expert?"), "ZZ Robotics talk");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm booking" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ taken");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Experts />, "ADMIN", { [PATH]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/experts")).length).toBe(2));
  });
});
