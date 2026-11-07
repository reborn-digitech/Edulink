import * as Sharing from "expo-sharing";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigProviderSchema } from "@edulink/contracts";
import { ProviderSessions } from "@/screens/shared/provider-sessions";
import { EARNINGS, GATE, PAYOUT, SAVED_PAYEE } from "./gig-fixtures";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/gigs/slots";
const DUTY = { deliveredOneToOnes: 3, heldWorkshops: 1, oneToOnesThisMonth: 1, workshopsThisQuarter: 0, startOneToOnes: 10, startWorkshops: 2, monthlyOneToOnes: 2, quarterlyWorkshops: 1 };
const booking = (over: Record<string, unknown>) => ({ id: "b1", pupilName: "ZZ Asha", schoolName: "ZZ School", purpose: "ZZ How do bridges stand?", status: "CONFIRMED", paid: false, rating: null, feedback: null, ...over });
const slot = (over: Record<string, unknown>) => ({ id: "s1", kind: "ONE_TO_ONE", title: "ZZ Ask an engineer", startsAt: "2030-10-07T10:00:00.000Z", endsAt: "2030-10-07T10:30:00.000Z", meetingUrl: "https://meet.zz.test/a", seats: 1, seatsTaken: 1, pricePaise: 0, cancelled: false, started: false, bookings: [booking({})], ...over });
const view = (over: Record<string, unknown> = {}) => gigProviderSchema.parse({ enabled: true, kind: "EXPERT", timeZone: "Asia/Kolkata", duty: DUTY, gate: GATE, slots: [slot({})], ...over });
/** The expert's two extra cards answer, so the provider screen under test is whole. */
const SIDE = { "GET /api/v1/expert/payout": () => json(PAYOUT()), "GET /api/v1/expert/earnings": () => json(EARNINGS()) };

describe("a provider's sessions", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows an expert what they have given and offers a one-to-one at the hour typed", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: gate.answer, [`POST ${PATH}`]: () => json({ slotId: "s9" }, 201) });
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
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: () => json(view({ slots: [] })), [`POST ${PATH}`]: () => json({ slotId: "s9" }, 201) });
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

  it("a workshop seat's price is sent only past the four conditions, which are shown as a checklist with the one not met", async () => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: () => json(view({ slots: [], gate: { ...GATE, mentoringOffer: true, canCharge: true } })), [`POST ${PATH}`]: () => json({ slotId: "s9" }, 201) });
    expect((await screen.findAllByText("Before you can charge for a workshop seat")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("✓ Identity papers verified by the operator").length).toBeGreaterThan(0);
    expect(screen.getAllByText("✓ A free one-to-one offered in the coming 30 days").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("button", { name: "Workshop" }));
    await fireEvent.changeText(screen.getByLabelText("What it is about"), "ZZ Build a paper bridge");
    await fireEvent.changeText(screen.getByLabelText("Date"), "2030-11-06");
    await fireEvent.changeText(screen.getByLabelText("Time"), "10:00");
    await fireEvent.changeText(screen.getByLabelText("Price of a seat (₹)"), "100");
    await fireEvent.changeText(screen.getByLabelText("Meeting link"), "https://meet.zz.test/w");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toMatchObject({ kind: "WORKSHOP", pricePaise: 10000 }));
  });

  it("the condition not met is shown unticked, a priced time and a paid seat are marked, and the expert's earnings are read", async () => {
    await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: () => json(view({ slots: [slot({ id: "s2", kind: "WORKSHOP", title: "ZZ Build a paper bridge", seats: 20, seatsTaken: 2, pricePaise: 10000, bookings: [booking({ id: "b2", paid: true })] })] })) });
    expect(await screen.findByText(/₹100 a seat past the free allowance/)).toBeTruthy();
    expect(screen.getByText("Paid seat")).toBeTruthy();
    expect(screen.getAllByText("○ A free one-to-one offered in the coming 30 days").length).toBeGreaterThan(0);
    // Get paid: nothing saved yet, so the form is open.
    expect(await screen.findByText("Not linked yet")).toBeTruthy();
    expect(screen.getByLabelText("Name of the payee")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    // Earnings: the held seat, net of the commission and the GST on it.
    expect(await screen.findByText("₹82.30 to you of ₹100, after ₹15 commission and ₹2.70 GST on it", { exact: false })).toBeTruthy();
    expect(screen.getAllByText("On hold").length).toBeGreaterThan(0);
    expect(screen.getByText("No invoice yet.")).toBeTruthy();
  });

  it("saving the payee details sends the body the contract takes and shows the summary with the last four digits only", async () => {
    const saved = PAYOUT(SAVED_PAYEE, { readyToLink: true });
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: () => json(view({ slots: [] })), "POST /api/v1/expert/payout": () => json(saved) });
    await fireEvent.changeText(await screen.findByLabelText("Name of the payee"), "ZZ Meenakshi Rao");
    await fireEvent.changeText(screen.getByLabelText("PAN number"), "abcde1234f");
    await fireEvent.changeText(screen.getByLabelText("Bank account number"), "1234 5678 9012 3456");
    await fireEvent.changeText(screen.getByLabelText("IFSC code"), "hdfc0001234");
    await fireEvent.changeText(screen.getByLabelText("Address (house, street, area)"), "ZZ 12 Lake Road");
    await fireEvent.changeText(screen.getByLabelText("Town or city"), "ZZ Pune");
    await fireEvent.changeText(screen.getByLabelText("PIN code"), "411001");
    await fireEvent.changeText(screen.getByLabelText("Mobile number"), "9800000001");
    await fireEvent.changeText(screen.getByLabelText("GST state code"), "27");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    expect(screen.getByText("Not linked yet")).toBeTruthy();
    expect(screen.getByText("Not linked with Razorpay yet")).toBeTruthy();
    expect(screen.getByText(/Bank account ending 3456 · HDFC0001234/)).toBeTruthy();
    expect(screen.getByText("PAN ending 234F")).toBeTruthy();
    expect(screen.getByText("ZZ 12 Lake Road, ZZ Pune, 411001")).toBeTruthy();
    expect(screen.queryByText(/1234 5678 9012 3456/)).toBeNull();
    expect(screen.queryByText(/ABCDE1234F/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Link with Razorpay" })).not.toBeDisabled();
    const call = calls().find((c) => c.line === "POST /api/v1/expert/payout");
    expect(call?.body).toEqual({ payeeName: "ZZ Meenakshi Rao", bankAccount: "1234 5678 9012 3456", ifsc: "hdfc0001234", pan: "abcde1234f", addressLine: "ZZ 12 Lake Road", city: "ZZ Pune", postalCode: "411001", phone: "9800000001", gstStateCode: "27", gstin: null });
  });

  it("an invoice is fetched as a PDF and handed to the share sheet", async () => {
    const earnings = EARNINGS({ paidOutPaise: 8230, payouts: [{ id: "po1", netPaise: 8230, paymentsCount: 1, status: "PAID", reference: "UTR123456789012", paidAt: "2030-10-20T10:00:00.000Z", createdAt: "2030-10-13T10:00:00.000Z", invoiceId: "inv1", invoiceNumber: "SG/2030-31/0001" }], invoices: [{ id: "inv1", number: "SG/2030-31/0001", issuedAt: "2030-10-20T10:00:00.000Z", taxableValuePaise: 1500, cgstPaise: 135, sgstPaise: 135, igstPaise: 0, totalPaise: 1770, payoutId: "po1" }] }, { status: "PAID_OUT", paidOutAt: "2030-10-20T10:00:00.000Z", payoutId: "po1" });
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, "GET /api/v1/expert/earnings": () => json(earnings), [`GET ${PATH}`]: () => json(view({ slots: [] })), "GET /api/v1/expert/invoices/inv1/pdf": () => new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { status: 200, headers: { "content-type": "application/pdf" } }) });
    expect(await screen.findByText(/SG\/2030-31\/0001 · .* · ₹17\.70/)).toBeTruthy();
    expect(screen.getByText(/UTR123456789012/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Invoice PDF: SG/2030-31/0001" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(calls().filter((c) => c.line === "GET /api/v1/expert/invoices/inv1/pdf")).toHaveLength(1);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/SG 2030-31 0001\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" }));
  });

  it("a time and a seat are taken back with a reason", async () => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", {
      ...SIDE,
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
      ...SIDE,
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
    const first = await mountStaff(<ProviderSessions />, "TEACHER", { [`GET ${PATH}`]: () => json(view({ kind: "TEACHER", gate: null, slots: [] })) });
    expect(await screen.findByText("Given so far: 3. This month 1 of the 2 half-hours asked.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Workshop" })).toBeNull();
    await first.unmount();
    await mountStaff(<ProviderSessions />, "TEACHER", { [`GET ${PATH}`]: () => json({ enabled: false, kind: "TEACHER", timeZone: "Asia/Kolkata", duty: null, gate: null, slots: [] }) });
    expect(await screen.findByText("Your school has not switched on teachers' guidance. Ask the office.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("a refusal is an alert, and so is a list that cannot be read", async () => {
    const first = await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: () => json(view()), [`POST ${PATH}`]: refused("ZZ Give an https link to your meeting room.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Date"), "2030-11-05");
    await fireEvent.changeText(screen.getByLabelText("Time"), "15:30");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Give an https link to your meeting room.");
    await first.unmount();
    await mountStaff(<ProviderSessions />, "EXPERT", { ...SIDE, [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
  });
});

/* decision 0008 (7 Nov 2026): a provider's series are listed with their rule and taken back with a reason; offering one is the web's. */
describe("a provider's series", () => {
  it("lists a weekly series and a dated one with their sessions ahead, and takes one back with a reason", async () => {
    const series = [
      { id: "ser1", kind: "WORKSHOP", title: "ZZ Bridges, every week", rule: { mode: "WEEKLY", weekdays: [1, 3], time: "17:00", from: "2030-10-07", until: "2030-10-20" }, minutes: 60, seats: 20, pricePaise: 0, sessions: 4, remaining: 4, cancelled: false },
      { id: "ser2", kind: "ONE_TO_ONE", title: "ZZ Three dated half hours", rule: { mode: "DATES", startsAt: ["2030-10-07T10:00:00.000Z", "2030-10-14T10:00:00.000Z", "2030-10-21T10:00:00.000Z"] }, minutes: 30, seats: 1, pricePaise: 0, sessions: 3, remaining: 0, cancelled: true },
    ];
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", {
      ...SIDE,
      [`GET ${PATH}`]: () => json(view({ series })),
      [`POST /api/v1/gigs/series/ser1/cancel`]: () => json({ cancelled: 4 }),
    });
    expect(await screen.findByText("ZZ Bridges, every week")).toBeTruthy();
    expect(screen.getByText(/Every week on Mon, Wed, 17:00, until 2030-10-20 · 4 sessions, 4 still ahead/)).toBeTruthy();
    expect(screen.getByText(/3 dated sessions · 3 sessions, 0 still ahead/)).toBeTruthy();
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel the series: ZZ Bridges, every week" }));
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ The bridge is closed");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel the series" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/gigs/series/ser1/cancel")?.body).toEqual({ reason: "ZZ The bridge is closed" }));
  });
});
