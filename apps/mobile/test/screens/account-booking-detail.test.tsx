import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { accountBookingSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { BookingDetail } from "@/screens/expert/booking-detail";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const BOOKING = accountBookingSchema.parse({
  id: "b1",
  topic: "ZZ Bridges talk",
  status: "CONFIRMED",
  startsAt: "2030-10-01T09:30:00.000Z",
  endsAt: "2030-10-01T10:30:00.000Z",
  note: "ZZ Bring a model",
  schoolName: "ZZ School",
  expertName: "ZZ Expert",
  viewerIsExpert: true,
  canCancel: true,
  messages: [{ id: "m1", body: "ZZ Hello from the school", createdAt: "2026-09-09T10:00:00.000Z", authorName: "ZZ Teacher", authorAvatar: null, mine: false }],
});
const PATH = "/api/v1/account/bookings/b1";

const mount = (answers: Answers, role: RoleCode = "EXPERT") =>
  mountStaff(
    <ToastProvider>
      <BookingDetail />
    </ToastProvider>,
    role,
    answers,
  );

describe("a booking", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = { bookingId: "b1" };
  });

  it("loads, then shows what, when (in UTC) and the conversation; a message is sent", async () => {
    const gate = gated();
    const { calls } = await mount({ [`GET ${PATH}`]: gate.answer, [`POST ${PATH}/messages`]: () => json({ ok: true }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BOOKING));
    expect(await screen.findByRole("header", { name: "ZZ Bridges talk" })).toBeTruthy();
    expect(screen.getByText(/^ZZ School · /)).toBeTruthy();
    expect(screen.getAllByText(/9:30/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("All times are stored in UTC.")).toBeTruthy();
    expect(screen.getByText("ZZ Bring a model")).toBeTruthy();
    expect(screen.getByText("ZZ Hello from the school")).toBeTruthy();
    expect(screen.getByText(/^ZZ Teacher · /)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Write a message…"), " ZZ See you then ");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Message sent")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/messages`)?.body).toEqual({ body: "ZZ See you then" });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("cancelling asks first, and keeping the booking asks nothing", async () => {
    const { calls } = await mount({ [`GET ${PATH}`]: () => json(BOOKING), [`POST ${PATH}/cancel`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Cancel this booking" }));
    expect(screen.getByText(/^This frees the time for another school/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep the booking" }));
    expect(screen.queryByText(/^This frees the time/)).toBeNull();
    expect(calls().some((c) => c.line === `POST ${PATH}/cancel`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel this booking" }));
    await fireEvent.press(screen.getByRole("button", { name: "Yes, cancel it" }));
    expect(await screen.findByText("This booking was cancelled")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/cancel`)).toHaveLength(1);
  });

  it("a cancelled booking, seen by the school: the expert named, no reply box, nothing to cancel", async () => {
    await mount({ [`GET ${PATH}`]: () => json({ ...BOOKING, status: "CANCELLED", canCancel: false, viewerIsExpert: false, messages: [] }) }, "TEACHER");
    expect(await screen.findByText(/^ZZ Expert · /)).toBeTruthy();
    expect(screen.getByText("This booking was cancelled")).toBeTruthy();
    expect(screen.getByText("No messages yet. Say hello.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel this booking" })).toBeNull();
  });

  it("a refused message is said in the server's words", async () => {
    await mount({ [`GET ${PATH}`]: () => json(BOOKING), [`POST ${PATH}/messages`]: refused("ZZ This booking was cancelled.", 403) });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), "ZZ Hello");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("ZZ This booking was cancelled.")).toBeTruthy();
  });

  it("with no booking named, says so, and the door is the bookings", async () => {
    mockRouter.params = {};
    await mount({});
    expect(await screen.findByText("Booking not found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Bookings" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ [`GET ${PATH}`]: refused("ZZ Booking not found", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Booking not found");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
