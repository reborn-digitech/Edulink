import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { WardenHome, shiftDateKey } from "@/screens/hostel/warden";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { json, me, mountStaff, offline } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const meWith = (modules: string[]) => ({ ...me("WARDEN" as RoleCode), modules });
const HOSTEL = "czz000000000000000hostel1";
const A1 = "czz00000000000000000allot1";
const A2 = "czz00000000000000000allot2";
const hostels = (n = 1) => ({
  hostels: Array.from({ length: n }, (_, i) => ({ id: i ? `czz00000000000000hostel${i + 1}` : HOSTEL, name: i ? "ZZ Rani House" : "ZZ Tilak House", kind: "MIXED", capacity: 9, wardenMembershipId: "m1", wardenName: "ZZ Head", messAttendance: false, beds: 4, occupied: 2, rooms: [] })),
  wardens: [],
  canManage: false,
  canAllot: true,
});
const sheet = (taken: boolean) => ({
  hostelId: HOSTEL,
  hostelName: "ZZ Tilak House",
  dateKey: "2026-10-04",
  slot: "NIGHT",
  taken: taken ? { at: "2026-10-04T15:30:00.000Z", byName: "ZZ Sudhir" } : null,
  entries: [
    { allotmentId: A1, membershipId: "m-p1", name: "ZZ Asha", roomNumber: "101", bed: 1, status: "PRESENT", onLeave: false },
    { allotmentId: A2, membershipId: "m-p2", name: "ZZ Bela", roomNumber: "101", bed: 2, status: "ON_LEAVE", onLeave: true },
  ],
});
const leave = (status: string, extra: Record<string, unknown> = {}) => ({ id: "czz00000000000000000leav1", allotmentId: A1, membershipId: "m-p1", name: "ZZ Asha", className: "ZZ 5A", hostelName: "ZZ Tilak House", roomNumber: "101", kind: "HOME", fromAt: "2026-10-10T10:30:00.000Z", toAt: "2026-10-12T12:30:00.000Z", destination: "ZZ Pune", reason: "", status, requestedByName: "ZZ Asha", consentAt: null, consentByName: null, decidedAt: null, decidedByName: null, decisionNote: null, outAt: null, inAt: null, late: false, isMinor: true, ...extra });

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __setReplayFetch((async () => {
    throw new TypeError("Network request failed");
  }) as unknown as typeof fetch);
});

describe("the warden's hostel on the phone (3 Oct 2026)", () => {
  it("says the hostel is off when the school has not switched it on", async () => {
    await mountStaff(<WardenHome />, "WARDEN", {}, { me: meWith(["ALUMNI"]) });
    expect(await screen.findByText("Hostel is not switched on")).toBeTruthy();
  });

  it("takes tonight's roll call with an absent boarder and sends the whole sheet", async () => {
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      { "GET /api/v1/hostel/hostels": () => json(hostels()), "GET /api/v1/hostel/rollcall": () => json(sheet(false)), "POST /api/v1/hostel/rollcall": () => json({ rollCallId: "r1", present: 0, onLeave: 1, absent: 1, replay: false }) },
      { me: meWith(["HOSTEL"]) },
    );
    expect(await screen.findByText("ZZ Tilak House · 04/10/2026")).toBeTruthy();
    const absent = screen.getAllByRole("radio", { name: "Absent" });
    await userEvent.setup().press(absent[0]!);
    await userEvent.setup().press(screen.getByRole("button", { name: "Save the roll call" }));
    expect(await screen.findByText("Roll call saved: 0 present, 1 on leave, 1 absent.")).toBeTruthy();
    const body = calls().find((c) => c.line === "POST /api/v1/hostel/rollcall")?.body as { entries: unknown[]; slot: string; clientId: string };
    expect(body.slot).toBe("NIGHT");
    expect(body.entries).toEqual([
      { allotmentId: A1, status: "ABSENT" },
      { allotmentId: A2, status: "ON_LEAVE" },
    ]);
    expect(body.clientId).toMatch(/-NIGHT$/);
  });

  it("keeps the roll call in the outbox when there is no network", async () => {
    await mountStaff(<WardenHome />, "WARDEN", { "GET /api/v1/hostel/hostels": () => json(hostels()), "GET /api/v1/hostel/rollcall": () => json(sheet(false)), "POST /api/v1/hostel/rollcall": offline }, { me: meWith(["HOSTEL"]) });
    await userEvent.setup().press(await screen.findByRole("button", { name: "Save the roll call" }));
    expect(await screen.findByText(/saved on your device/)).toBeTruthy();
    await waitFor(async () => expect((await listQueued(`hostel-roll:${HOSTEL}`)).length).toBe(1));
  });

  it("shows a taken roll call read-only, and switches hostels and slots", async () => {
    const { calls } = await mountStaff(<WardenHome />, "WARDEN", { "GET /api/v1/hostel/hostels": () => json(hostels(2)), "GET /api/v1/hostel/rollcall": () => json(sheet(true)) }, { me: meWith(["HOSTEL"]) });
    expect(await screen.findByText(/Taken .* by ZZ Sudhir\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save the roll call" })).toBeNull();
    await userEvent.setup().press(screen.getByRole("radio", { name: "Morning" }));
    await waitFor(() => expect(calls().some((c) => c.line.includes("slot=MORNING"))).toBe(true));
    await userEvent.setup().press(screen.getByRole("radio", { name: "ZZ Rani House" }));
    await waitFor(() => expect(calls().some((c) => c.line.includes("hostelId=czz00000000000000hostel2"))).toBe(true));
  });

  it("approves leave, then signs the boarder out and back in at the gate", async () => {
    let state = leave("PENDING");
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      {
        "GET /api/v1/hostel/hostels": () => json(hostels()),
        "GET /api/v1/hostel/rollcall": () => json(sheet(false)),
        "GET /api/v1/hostel/leave": () => json({ items: [state] }),
        [`POST /api/v1/hostel/leave/${state.id}/decide`]: () => json((state = leave("APPROVED"))),
        [`POST /api/v1/hostel/leave/${state.id}/out`]: () => json((state = leave("APPROVED", { outAt: "2026-10-10T10:35:00.000Z" }))),
        [`POST /api/v1/hostel/leave/${state.id}/in`]: () => json((state = leave("APPROVED", { outAt: "2026-10-10T10:35:00.000Z", inAt: "2026-10-12T14:00:00.000Z", late: true }))),
      },
      { me: meWith(["HOSTEL"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Leave" }));
    await userEvent.setup().press(await screen.findByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Leave approved; the family is told.")).toBeTruthy();
    expect(calls().find((c) => c.line.endsWith("/decide"))?.body).toEqual({ approve: true, note: "" });
    await userEvent.setup().press(await screen.findByRole("button", { name: "Sign out at the gate" }));
    expect(await screen.findByText("ZZ Asha signed out.")).toBeTruthy();
    await userEvent.setup().press(await screen.findByRole("button", { name: "Sign back in" }));
    expect(await screen.findByText("ZZ Asha is back, late: the office and the family are told.")).toBeTruthy();
  });

  it("shows a minor's ask waiting for a guardian, with nothing to press", async () => {
    await mountStaff(<WardenHome />, "WARDEN", { "GET /api/v1/hostel/hostels": () => json(hostels()), "GET /api/v1/hostel/rollcall": () => json(sheet(false)), "GET /api/v1/hostel/leave": () => json({ items: [leave("AWAITING_CONSENT")] }) }, { me: meWith(["HOSTEL"]) });
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Leave" }));
    expect(await screen.findByText("Waiting for a guardian's consent")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("signs a visitor in and out", async () => {
    let items: object[] = [];
    const visitor = (out: string | null) => ({ id: "czz00000000000000000vist1", allotmentId: A1, boarderName: "ZZ Asha", hostelName: "ZZ Tilak House", roomNumber: "101", name: "ZZ Uncle", relation: "uncle", note: "", inAt: "2026-10-04T10:30:00.000Z", outAt: out, allowedByName: "ZZ Sudhir" });
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      {
        "GET /api/v1/hostel/hostels": () => json(hostels()),
        "GET /api/v1/hostel/rollcall": () => json(sheet(false)),
        "GET /api/v1/hostel/visitors": () => json({ dateKey: "2026-10-04", items }),
        "POST /api/v1/hostel/visitors": () => json({ dateKey: "2026-10-04", items: (items = [visitor(null)]) }),
        "POST /api/v1/hostel/visitors/czz00000000000000000vist1/out": () => json({ dateKey: "2026-10-04", items: (items = [visitor("2026-10-04T11:30:00.000Z")]) }),
      },
      { me: meWith(["HOSTEL"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Visitors" }));
    expect(await screen.findByText("No visitors.")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Visitor's name"), "ZZ Uncle");
    await userEvent.setup().type(screen.getByLabelText("Relation"), "uncle");
    await userEvent.setup().press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("ZZ Uncle signed in.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/hostel/visitors")?.body).toEqual({ allotmentId: A1, name: "ZZ Uncle", relation: "uncle" });
    await userEvent.setup().press(await screen.findByRole("button", { name: "Sign them out" }));
    expect(await screen.findByText("Signed out.")).toBeTruthy();
  });

  it("shows tonight at the gate: the curfew, who is away and due back by when, and signs one out and back in (5 Oct 2026)", async () => {
    const row = (state: string, extra: Record<string, unknown> = {}) => ({ leaveId: "czz00000000000000000leav1", name: "ZZ Asha", hostelName: "ZZ Tilak House", roomNumber: "101", kind: "LOCAL", fromAt: "2026-10-04T11:30:00.000Z", toAt: "2026-10-04T14:30:00.000Z", backBy: "2026-10-04T15:30:00.000Z", curfew: true, outAt: null, inAt: null, state, ...extra });
    let leaves = [row("NOT_OUT")];
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      {
        "GET /api/v1/hostel/hostels": () => json(hostels()),
        "GET /api/v1/hostel/rollcall": () => json(sheet(false)),
        "GET /api/v1/hostel/night": () => json({ dateKey: "2026-10-04", college: true, hostels: [{ id: HOSTEL, name: "ZZ Tilak House", curfewMinute: 1290, nightOutAllowed: false }], leaves }),
        "POST /api/v1/hostel/leave/czz00000000000000000leav1/out": () => {
          leaves = [row("OUT", { outAt: "2026-10-04T11:35:00.000Z" })];
          return json(leave("APPROVED", { outAt: "2026-10-04T11:35:00.000Z" }));
        },
        "POST /api/v1/hostel/leave/czz00000000000000000leav1/in": () => json(leave("APPROVED", { outAt: "2026-10-04T11:35:00.000Z", inAt: "2026-10-04T15:00:00.000Z" })),
      },
      { me: meWith(["HOSTEL"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Tonight" }));
    expect(await screen.findByText("Curfew 21:30 · No night-outs")).toBeTruthy();
    expect(screen.getByText("Not gone out")).toBeTruthy();
    expect(screen.getByText(/^Due back by the curfew, /)).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Sign out at the gate" }));
    expect(await screen.findByText("ZZ Asha signed out.")).toBeTruthy();
    await userEvent.setup().press(await screen.findByRole("button", { name: "Sign back in" }));
    expect(await screen.findByText("ZZ Asha is back.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "The night before" }));
    await waitFor(() => expect(calls().some((c) => c.line.includes("/api/v1/hostel/night?date=2026-10-03"))).toBe(true));
  });

  it("says nobody is away tonight and offers the leave list", async () => {
    await mountStaff(
      <WardenHome />,
      "WARDEN",
      { "GET /api/v1/hostel/hostels": () => json(hostels()), "GET /api/v1/hostel/rollcall": () => json(sheet(false)), "GET /api/v1/hostel/night": () => json({ dateKey: "2026-10-04", college: false, hostels: [], leaves: [] }), "GET /api/v1/hostel/leave": () => json({ items: [] }) },
      { me: meWith(["HOSTEL"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Tonight" }));
    expect(await screen.findByText("Nobody is away")).toBeTruthy();
    expect(screen.getByText("A school's hostel keeps no curfew: a return is late only after the leave's end.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Leave and the gate" }));
    expect(await screen.findByText("No leave here.")).toBeTruthy();
  });

  it("counts date keys across a month's end", () => {
    expect(shiftDateKey("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("says when the office has made no hostel", async () => {
    await mountStaff(<WardenHome />, "WARDEN", { "GET /api/v1/hostel/hostels": () => json({ hostels: [], wardens: [], canManage: false, canAllot: true }) }, { me: meWith(["HOSTEL"]) });
    expect(await screen.findByText("The school office has not made a hostel yet.")).toBeTruthy();
  });
});
