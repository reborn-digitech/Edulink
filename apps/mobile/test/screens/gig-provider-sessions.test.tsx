import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigProviderSchema } from "@edulink/contracts";
import { ProviderSessions } from "@/screens/shared/provider-sessions";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/gigs/slots";
const DUTY = { deliveredOneToOnes: 3, heldWorkshops: 1, oneToOnesThisMonth: 1, workshopsThisQuarter: 0, startOneToOnes: 10, startWorkshops: 2, monthlyOneToOnes: 2, quarterlyWorkshops: 1 };
const booking = (over: Record<string, unknown>) => ({ id: "b1", pupilName: "ZZ Asha", schoolName: "ZZ School", purpose: "ZZ How do bridges stand?", status: "CONFIRMED", rating: null, feedback: null, ...over });
const slot = (over: Record<string, unknown>) => ({ id: "s1", kind: "ONE_TO_ONE", title: "ZZ Ask an engineer", startsAt: "2030-10-07T10:00:00.000Z", endsAt: "2030-10-07T10:30:00.000Z", meetingUrl: "https://meet.zz.test/a", seats: 1, seatsTaken: 1, cancelled: false, started: false, bookings: [booking({})], ...over });
const view = (over: Record<string, unknown> = {}) => gigProviderSchema.parse({ enabled: true, kind: "EXPERT", timeZone: "Asia/Kolkata", duty: DUTY, slots: [slot({})], ...over });

describe("a provider's sessions", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows an expert what they have given and offers a one-to-one at the hour typed", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { [`GET ${PATH}`]: gate.answer, [`POST ${PATH}`]: () => json({ slotId: "s9" }, 201) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view()));
    expect(await screen.findByText("Given so far: 3 one-to-ones and 1 workshops. Your first 10 one-to-ones and 2 workshops are free.")).toBeTruthy();
    expect(screen.getByText("This month 1 of the 2 one-to-ones asked; this quarter 0 of the 1 workshops asked.")).toBeTruthy();
    expect(screen.getByText(/1 of 1 seats taken/)).toBeTruthy();
    expect(screen.getByText("ZZ Asha · ZZ School")).toBeTruthy();

    // With no date, nothing is sent and the form says what is missing.
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Give the date and the time it starts.");
    expect(calls().some((c) => c.line === `POST ${PATH}`)).toBe(false);

    await fireEvent.changeText(screen.getByLabelText("What it is about"), "ZZ Careers in design");
    await fireEvent.changeText(screen.getByLabelText("Date"), "2030-11-05");
    await fireEvent.changeText(screen.getByLabelText("Time"), "15:30");
    await fireEvent.changeText(screen.getByLabelText("Meeting link"), "https://meet.zz.test/new");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    expect(await screen.findByText("Offered.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ kind: "ONE_TO_ONE", title: "ZZ Careers in design", startsAt: new Date("2030-11-05T15:30:00").toISOString(), meetingUrl: "https://meet.zz.test/new" });
  });

  it("a workshop carries its length and its seats", async () => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { [`GET ${PATH}`]: () => json(view({ slots: [] })), [`POST ${PATH}`]: () => json({ slotId: "s9" }, 201) });
    expect(await screen.findByText("You have offered no time yet.")).toBeTruthy();
    expect(screen.queryByLabelText("Seats")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Workshop" }));
    await fireEvent.changeText(screen.getByLabelText("What it is about"), "ZZ Build a paper bridge");
    await fireEvent.changeText(screen.getByLabelText("Date"), "2030-11-06");
    await fireEvent.changeText(screen.getByLabelText("Time"), "10:00");
    await fireEvent.changeText(screen.getByLabelText("Minutes"), "90");
    await fireEvent.changeText(screen.getByLabelText("Seats"), "12");
    await fireEvent.changeText(screen.getByLabelText("Meeting link"), "https://meet.zz.test/w");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toMatchObject({ kind: "WORKSHOP", minutes: 90, seats: 12 }));
  });

  it("a time and a seat are taken back with a reason", async () => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", {
      [`GET ${PATH}`]: () => json(view()),
      [`POST ${PATH}/s1/cancel`]: () => json({ ok: true }),
      [`POST /api/v1/gigs/sessions/b1/cancel`]: () => json({ status: "CANCELLED", lateCancel: false }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Cancel this seat: ZZ Asha" }));
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ Too young for this one");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel this seat" }));
    expect(await screen.findByText("Cancelled.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/gigs/sessions/b1/cancel")?.body).toEqual({ reason: "ZZ Too young for this one" });
    await fireEvent.press(screen.getByRole("button", { name: "Cancel this time: ZZ Ask an engineer" }));
    await fireEvent.changeText(screen.getAllByLabelText("Reason")[0]!, "ZZ I am unwell that day");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel this time" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}/s1/cancel`)?.body).toEqual({ reason: "ZZ I am unwell that day" }));
  });

  it("once a time has begun a seat is marked held or not attended, and a rating is read", async () => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", {
      [`GET ${PATH}`]: () => json(view({ slots: [slot({ started: true, bookings: [booking({}), booking({ id: "b2", pupilName: "ZZ Bela", status: "DELIVERED", rating: 4, feedback: "ZZ Clear and kind" })] }), slot({ id: "s2", title: "ZZ Taken back", cancelled: true, bookings: [] })] })),
      [`POST /api/v1/gigs/sessions/b1/close`]: () => json({ ok: true }),
    });
    expect(await screen.findByText("Rated 4 of 5 · ZZ Clear and kind")).toBeTruthy();
    expect(screen.getByText("Cancelled")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Cancel this time/ })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Held: ZZ Asha" }));
    expect(await screen.findByText("Noted.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Did not come: ZZ Asha" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/gigs/sessions/b1/close").map((c) => c.body)).toEqual([{ outcome: "DELIVERED" }, { outcome: "MISSED" }]));
  });

  it("a teacher offers one-to-ones only, and is told when the school has not switched guidance on", async () => {
    const first = await mountStaff(<ProviderSessions />, "TEACHER", { [`GET ${PATH}`]: () => json(view({ kind: "TEACHER", slots: [] })) });
    expect(await screen.findByText("Given so far: 3. This month 1 of the 2 half-hours asked.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Workshop" })).toBeNull();
    await first.unmount();
    await mountStaff(<ProviderSessions />, "TEACHER", { [`GET ${PATH}`]: () => json({ enabled: false, kind: "TEACHER", timeZone: "Asia/Kolkata", duty: null, slots: [] }) });
    expect(await screen.findByText("Your school has not switched on teachers' guidance. Ask the office.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("a refusal is an alert, and so is a list that cannot be read", async () => {
    const first = await mountStaff(<ProviderSessions />, "EXPERT", { [`GET ${PATH}`]: () => json(view()), [`POST ${PATH}`]: refused("ZZ Give an https link to your meeting room.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Date"), "2030-11-05");
    await fireEvent.changeText(screen.getByLabelText("Time"), "15:30");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Give an https link to your meeting room.");
    await first.unmount();
    await mountStaff(<ProviderSessions />, "EXPERT", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
  });
});
