import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { expertAddSlotSchema, expertAvailabilitySchema } from "@edulink/contracts";
import { ExpertAvailability, utcInstant } from "@/screens/expert/availability";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SLOTS = expertAvailabilitySchema.parse({
  slots: [
    { id: "sl2", startsAt: "2030-01-12T14:00:00.000Z", endsAt: "2030-01-12T15:00:00.000Z", note: null, bookedAt: null, booking: null },
    { id: "sl1", startsAt: "2030-01-10T09:00:00.000Z", endsAt: "2030-01-10T10:00:00.000Z", note: "ZZ Careers talk", bookedAt: null, booking: null },
    { id: "sl3", startsAt: "2030-01-10T11:00:00.000Z", endsAt: "2030-01-10T12:00:00.000Z", note: null, bookedAt: "2026-09-01T00:00:00.000Z", booking: { id: "b1", topic: "ZZ Robotics", schoolName: "ZZ School" } },
  ],
});
const PATH = "/api/v1/shared/expert/availability";

describe("the expert's availability", () => {
  it("turns a day and a time into a UTC instant, and refuses anything else", () => {
    expect(utcInstant("2030-01-10", "09:05")).toBe("2030-01-10T09:05:00.000Z");
    expect(utcInstant("2030-01-10", "24:00")).toBeNull();
    expect(utcInstant("10/01/2030", "09:00")).toBeNull();
    expect(utcInstant("2030-02-30", "09:00")).toBe("2030-03-02T09:00:00.000Z");
  });

  it("loads, then groups the windows by day with the booked one locked", async () => {
    const gate = gated();
    await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(SLOTS));
    await screen.findByText("09:00 – 10:00");
    expect(screen.getByText("ZZ Careers talk")).toBeTruthy();
    expect(screen.getByText("11:00 – 12:00")).toBeTruthy();
    expect(screen.getByText("ZZ Robotics")).toBeTruthy();
    expect(screen.getByText("Booked by ZZ School")).toBeTruthy();
    expect(screen.getByText("14:00 – 15:00")).toBeTruthy();
    expect(screen.getAllByRole("header", { name: /\/01\/2030/ })).toHaveLength(2);
    // Two free windows may be removed; the booked one may not.
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
  });

  it("offers a window with the body the contract takes, and refuses an end before the start", async () => {
    const { calls } = await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: () => json(SLOTS), [`POST ${PATH}`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Date"), "2030-01-20");
    await fireEvent.changeText(screen.getByLabelText("Starts"), "10:00");
    await fireEvent.changeText(screen.getByLabelText("Ends"), "09:00");
    await fireEvent.press(screen.getByRole("button", { name: "Offer this time" }));
    expect(screen.getByText("The end cannot be before the start.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Ends"), "11:30");
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ Science fair");
    await fireEvent.press(screen.getByRole("button", { name: "Offer this time" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(1));
    expect(expertAddSlotSchema.parse(calls().find((c) => c.line === `POST ${PATH}`)!.body)).toEqual({ startsAt: "2030-01-20T10:00:00.000Z", endsAt: "2030-01-20T11:30:00.000Z", note: "ZZ Science fair" });
    // The form clears and the list is asked again.
    await waitFor(() => expect(screen.getByLabelText("Date")).toHaveDisplayValue(""));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a missing date or time is caught before the server is asked", async () => {
    const { calls } = await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: () => json(SLOTS) });
    await fireEvent.press(await screen.findByRole("button", { name: "Offer this time" }));
    expect(screen.getAllByText("Some of this needs another look.").length).toBe(3);
    expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(0);
  });

  it("withdraws a free window only after a confirm step, and Keep steps back", async () => {
    const { calls } = await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: () => json(SLOTS), [`DELETE ${PATH}/sl1`]: () => json({ ok: true }) });
    await screen.findByText("09:00 – 10:00");
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove" })[0]!);
    expect(screen.getByRole("button", { name: "Withdraw this time" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByRole("button", { name: "Withdraw this time" })).toBeNull();
    expect(calls().filter((c) => c.line.startsWith("DELETE"))).toHaveLength(0);
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove" })[0]!);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw this time" }));
    await waitFor(() => expect(calls().some((c) => c.line === `DELETE ${PATH}/sl1`)).toBe(true));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a refused withdrawal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: () => json(SLOTS), [`DELETE ${PATH}/sl1`]: refused("ZZ a school has just booked it", 409) });
    await screen.findByText("09:00 – 10:00");
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove" })[0]!);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw this time" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ a school has just booked it");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `DELETE ${PATH}/sl1`)).toHaveLength(2));
  });

  it("no windows yet: says so, and the door is the form", async () => {
    await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: () => json({ slots: [] }) });
    expect(await screen.findByText("You have not offered any times yet.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Offer this time" })).toHaveLength(2);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ExpertAvailability />, "EXPERT", { [`GET ${PATH}`]: refused("ZZ not now") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
