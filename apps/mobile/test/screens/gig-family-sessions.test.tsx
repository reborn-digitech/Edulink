import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigFamilySessionsSchema } from "@edulink/contracts";
import { FamilySessions, POLL } from "@/screens/family/sessions";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/gigs/sessions";
const seat = (over: Record<string, unknown>) => ({ id: "b1", kind: "ONE_TO_ONE", title: "ZZ Ask an engineer", startsAt: "2030-10-07T10:00:00.000Z", endsAt: "2030-10-07T10:30:00.000Z", providerName: "ZZ Dr Rao", providerKind: "EXPERT", purpose: "ZZ How do bridges stand?", status: "CONFIRMED", meetingUrl: "https://meet.zz.test/a", lateCancel: false, rating: null, paid: false, pricePaise: 0, payment: null, canConsent: false, canPay: false, canCancel: true, canRate: false, canReportUnheld: false, ...over });
const OPEN = { id: "s2", kind: "WORKSHOP", title: "ZZ Build a paper bridge", startsAt: "2030-10-10T10:00:00.000Z", endsAt: "2030-10-10T11:00:00.000Z", seatsLeft: 19, providerName: "ZZ Dr Rao", providerKind: "EXPERT", providerHeadline: "ZZ Careers in engineering", pricePaise: 0, freeSeat: true };
const view = (bookings: unknown[], open: unknown[] = [OPEN], over: Record<string, unknown> = {}) =>
  gigFamilySessionsSchema.parse({ freeCancelHours: 12, paymentsOn: true, children: [{ id: "m-child", name: "ZZ Asha", schoolName: "ZZ School", timeZone: "Asia/Kolkata", allowance: { ONE_TO_ONE: { allowed: 2, used: 1, left: 1 }, WORKSHOP: { allowed: 2, used: 0, left: 2 } }, bookings, open, ...over }] });
/** A paid seat's order, as the booking hands it back under devbox. */
const CHECKOUT = { paymentId: "sp1", bookingId: "b9", orderId: "order_devbox1", keyId: "devbox", amountPaise: 10000, currency: "INR", transport: "devbox", title: "ZZ Build a paper bridge", pupilName: "ZZ Asha", payerName: "ZZ Guardian", payerEmail: null };
const STATUS = (status: string) => ({ paymentId: "sp1", bookingId: "b9", status, amountPaise: 10000, bookingStatus: status === "INITIATED" ? "PENDING_PAYMENT" : "CONFIRMED", refundedAt: null, reason: null, checkout: status === "INITIATED" ? CHECKOUT : null });

describe("sessions and workshops, for a family", () => {
  beforeEach(() => mockRouter.push.mockClear());
  // The pay step's poll, shortened so a test sees two asks in a moment.
  beforeAll(() => {
    POLL.intervalMs = 20;
    POLL.maxMs = 60_000;
  });

  it("loads, then shows the allowance, a confirmed seat with its link, and what is open", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<FamilySessions />, "PARENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view([seat({})])));
    expect(await screen.findByText("Free this school year: 1 of 2 one-to-ones and 2 of 2 workshop seats left.")).toBeTruthy();
    expect(screen.getByRole("header", { name: "ZZ Asha · ZZ School" })).toBeTruthy();
    expect(screen.getByText("Confirmed")).toBeTruthy();
    expect(screen.getByText("Given up less than 12 hours before the start, a confirmed seat still counts against the free allowance.")).toBeTruthy();
    expect(screen.getByText(/19 seats left/)).toBeTruthy();
    expect(screen.getByText("ZZ Careers in engineering")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Join the meeting: ZZ Ask an engineer" }));
    expect(open).toHaveBeenCalledWith("https://meet.zz.test/a");
    open.mockRestore();
  });

  it("a guardian answers their child's ask, and books a seat with what is wanted from it", async () => {
    const { calls } = await mountStaff(<FamilySessions />, "PARENT", {
      [`GET ${PATH}`]: () => json(view([seat({ status: "PENDING_CONSENT", meetingUrl: null, canConsent: true })])),
      [`POST ${PATH}/b1/consent`]: () => json({ status: "CONFIRMED" }),
      [`POST ${PATH}/book`]: () => json({ bookingId: "b9", status: "CONFIRMED" }, 201),
    });
    expect(await screen.findByText("Waiting for a guardian")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Join the meeting/ })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Agree: ZZ Ask an engineer" }));
    expect(await screen.findByText("Confirmed.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/b1/consent`)?.body).toEqual({ approve: true });
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ Ask an engineer" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${PATH}/b1/consent`)).toHaveLength(2));
    expect(calls().filter((c) => c.line === `POST ${PATH}/b1/consent`)[1]?.body).toEqual({ approve: false });

    await fireEvent.press(screen.getByRole("button", { name: "Book this: ZZ Build a paper bridge" }));
    await fireEvent.changeText(screen.getByLabelText("What do you want from it?"), "ZZ She builds things from card");
    await fireEvent.press(screen.getByRole("button", { name: "Book this" }));
    expect(await screen.findByText("Booked.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/book`)?.body).toEqual({ slotId: "s2", studentMembershipId: "m-child", purpose: "ZZ She builds things from card" });
  });

  it("past the allowance a priced seat is bought: the booking hands back the order, the pay step watches it until the money arrives, and the seat is then confirmed", async () => {
    let asked = 0;
    const { calls } = await mountStaff(<FamilySessions />, "PARENT", {
      [`GET ${PATH}`]: () => json(view([], [{ ...OPEN, pricePaise: 10000, freeSeat: false }])),
      [`POST ${PATH}/book`]: () => json({ bookingId: "b9", status: "PENDING_PAYMENT", checkout: CHECKOUT }, 201),
      "GET /api/v1/gigs/payments/sp1": () => {
        asked += 1;
        return json(STATUS(asked < 2 ? "INITIATED" : "HELD"));
      },
    });
    expect(await screen.findByText("₹100 a seat past the free allowance")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Pay ₹100: ZZ Build a paper bridge" }));
    await fireEvent.changeText(screen.getByLabelText("What do you want from it?"), "ZZ She builds things from card at home.");
    await fireEvent.press(screen.getByRole("button", { name: "Pay ₹100" }));
    expect(await screen.findByText("Pay for the seat · ₹100")).toBeTruthy();
    expect(screen.getByText(/Devbox: there is no payment page/)).toBeTruthy();
    expect(await screen.findByText("Paid. The seat is confirmed.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "GET /api/v1/gigs/payments/sp1").length).toBeGreaterThanOrEqual(2);
    expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBeGreaterThanOrEqual(2);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText("Pay for the seat · ₹100")).toBeNull();
  });

  it("a seat waiting for payment is paid from its own row, a paid seat says so, and a refund is read", async () => {
    const { calls } = await mountStaff(<FamilySessions />, "PARENT", {
      [`GET ${PATH}`]: () => json(view([seat({ id: "b9", kind: "WORKSHOP", status: "PENDING_PAYMENT", meetingUrl: null, paid: true, pricePaise: 10000, canPay: true }), seat({ id: "b8", kind: "WORKSHOP", status: "CANCELLED", meetingUrl: null, paid: true, pricePaise: 10000, payment: { paymentId: "sp8", status: "REFUNDED", amountPaise: 10000, refundedAt: "2030-10-01T00:00:00.000Z" }, canCancel: false })])),
      [`POST ${PATH}/b9/checkout`]: () => json({ checkout: CHECKOUT }),
      "GET /api/v1/gigs/payments/sp1": () => json(STATUS("INITIATED")),
    });
    expect(await screen.findByText("Waiting for payment")).toBeTruthy();
    expect(screen.getByText("₹100 refunded")).toBeTruthy();
    expect(screen.getAllByText(/Paid seat/).length).toBe(2);
    await fireEvent.press(screen.getByRole("button", { name: "Pay ₹100: ZZ Ask an engineer" }));
    expect(await screen.findByText("Pay for the seat · ₹100")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/b9/checkout`)).toHaveLength(1);
  });

  it("a pupil asks, and is told a guardian must agree", async () => {
    await mountStaff(<FamilySessions />, "STUDENT", { [`GET ${PATH}`]: () => json(view([])), [`POST ${PATH}/book`]: () => json({ bookingId: "b9", status: "PENDING_CONSENT" }, 201) });
    expect(await screen.findByText("No session yet.")).toBeTruthy();
    expect(screen.queryByRole("header", { name: "ZZ Asha · ZZ School" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Ask for this: ZZ Build a paper bridge" }));
    await fireEvent.changeText(screen.getByLabelText("What do you want from it?"), "ZZ I want to build one");
    await fireEvent.press(screen.getByRole("button", { name: "Ask for this" }));
    expect(await screen.findByText("Asked. A guardian must agree before it is confirmed.")).toBeTruthy();
  });

  it("a seat given up late is said to still count; one not held is reported; one held is rated", async () => {
    const { calls } = await mountStaff(<FamilySessions />, "PARENT", {
      [`GET ${PATH}`]: () => json(view([seat({}), seat({ id: "b2", title: "ZZ Not held", meetingUrl: null, canCancel: false, canReportUnheld: true }), seat({ id: "b3", title: "ZZ Held", status: "DELIVERED", meetingUrl: null, canCancel: false, canRate: true })], [])),
      [`POST ${PATH}/b1/cancel`]: () => json({ status: "CANCELLED", lateCancel: true }),
      [`POST ${PATH}/b2/unheld`]: () => json({ status: "UNHELD" }),
      [`POST ${PATH}/b3/rate`]: () => json({ ok: true }),
    });
    expect(await screen.findByText("Nothing is open just now.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Give up the seat: ZZ Ask an engineer" }));
    expect(await screen.findByText("The seat is given up. It was close to the start, so it still counts against the free allowance.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/b1/cancel`)?.body).toEqual({ reason: "" });
    await fireEvent.press(screen.getByRole("button", { name: "It was not held: ZZ Not held" }));
    expect(await screen.findByText("Noted. It no longer counts against the allowance.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "4" }));
    await fireEvent.changeText(screen.getByLabelText("Anything to add?"), "ZZ Clear and kind");
    await fireEvent.press(screen.getByRole("button", { name: "Rate it: ZZ Held" }));
    expect(await screen.findByText("Thank you.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/b3/rate`)?.body).toEqual({ rating: 4, feedback: "ZZ Clear and kind" });
  });

  it("a refusal is an alert; a family with no pupil on a roll is shown the way to its messages", async () => {
    await mountStaff(<FamilySessions />, "PARENT", { [`GET ${PATH}`]: () => json(view([])), [`POST ${PATH}/book`]: refused("ZZ The last seat has just been taken.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Book this: ZZ Build a paper bridge" }));
    await fireEvent.press(screen.getByRole("button", { name: "Book this" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ The last seat has just been taken.");
  });

  it("with no child, and when the list cannot be read", async () => {
    const first = await mountStaff(<FamilySessions />, "PARENT", { [`GET ${PATH}`]: () => json({ freeCancelHours: 12, paymentsOn: false, children: [] }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
    await first.unmount();
    await mountStaff(<FamilySessions />, "PARENT", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
