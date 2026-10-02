import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigSchoolSessionsSchema } from "@edulink/contracts";
import { OfficeSessions } from "@/screens/staff/sessions";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/gigs/school";
const BOOKING = { id: "b1", pupilName: "ZZ Asha", kind: "ONE_TO_ONE", title: "ZZ Ask an engineer", startsAt: "2030-10-07T10:00:00.000Z", providerName: "ZZ Dr Rao", providerKind: "EXPERT", status: "CONFIRMED", purpose: "ZZ How do bridges stand?", paid: false, canCancel: true };
const view = (over: Record<string, unknown> = {}) => gigSchoolSessionsSchema.parse({ guidanceOn: true, canSwitch: true, timeZone: "Asia/Kolkata", bookings: [BOOKING, { ...BOOKING, id: "b2", pupilName: "ZZ Bela", status: "DELIVERED", canCancel: false }], ...over });

describe("the office's sessions", () => {
  it("loads, lists every booking with no link, and cancels one with a reason", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<OfficeSessions />, "ADMIN", { [`GET ${PATH}`]: gate.answer, [`POST /api/v1/gigs/sessions/b1/cancel`]: () => json({ status: "CANCELLED", lateCancel: false }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view()));
    expect(await screen.findByText("ZZ Asha · ZZ Ask an engineer")).toBeTruthy();
    expect(screen.getByText("ZZ Bela · ZZ Ask an engineer")).toBeTruthy();
    expect(screen.getByText("Held")).toBeTruthy();
    expect(screen.queryByText(/meet\./)).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Cancel: / })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel: ZZ Asha, ZZ Ask an engineer" }));
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ The school trip is that day");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("Cancelled.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/gigs/sessions/b1/cancel")?.body).toEqual({ reason: "ZZ The school trip is that day" });
  });

  it("the admin turns teachers' guidance off and on; a switch the server says cannot be turned is shown locked", async () => {
    const first = await mountStaff(<OfficeSessions />, "ADMIN", { [`GET ${PATH}`]: () => json(view({ bookings: [] })), [`POST ${PATH}/guidance`]: () => json({ guidanceOn: false }) });
    expect(await screen.findByText("No pupil has a session yet.")).toBeTruthy();
    const toggle = screen.getByRole("switch", { name: "Let our teachers offer free one-to-one guidance to our pupils" });
    expect(toggle).toBeChecked();
    await fireEvent.press(toggle);
    expect(await screen.findByText("Switched off. Nothing already booked is cancelled.")).toBeTruthy();
    expect(first.calls().find((c) => c.line === `POST ${PATH}/guidance`)?.body).toEqual({ on: false });
    await first.unmount();
    const second = await mountStaff(<OfficeSessions />, "PRINCIPAL", { [`GET ${PATH}`]: () => json(view({ guidanceOn: false, canSwitch: false })) });
    const locked = await screen.findByRole("switch", { name: "Let our teachers offer free one-to-one guidance to our pupils" });
    expect(locked).not.toBeChecked();
    expect(locked).toBeDisabled();
    await fireEvent.press(locked);
    await waitFor(() => expect(second.calls().some((c) => c.line === `POST ${PATH}/guidance`)).toBe(false));
  });

  it("a refusal is an alert, and so is a list that cannot be read", async () => {
    const first = await mountStaff(<OfficeSessions />, "ADMIN", { [`GET ${PATH}`]: () => json(view()), [`POST /api/v1/gigs/sessions/b1/cancel`]: refused("ZZ Give a reason, of at least five letters.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Cancel: ZZ Asha, ZZ Ask an engineer" }));
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Give a reason, of at least five letters.");
    await first.unmount();
    await mountStaff(<OfficeSessions />, "ADMIN", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
