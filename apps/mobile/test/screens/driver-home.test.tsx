import { fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { DriverHome } from "@/screens/driver/home";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { __resetTripPositions, BOARDINGS_TAG } from "@/lib/trip-positions";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));
// The phone's GPS is the device's: the suite stands in for it (lib/trip-location-platform.native.ts is untested off a device).
const mockPlace = { current: { lat: 18.5, lng: 73.8, accuracy: 12 } as { lat: number; lng: number; accuracy: number | null } | null };
const mockStart = jest.fn(async () => "started");
const mockStop = jest.fn(async () => {});
jest.mock("@/lib/trip-location-platform", () => ({
  currentPlace: async () => mockPlace.current,
  startTracking: (...args: unknown[]) => mockStart(...(args as [])),
  stopTracking: () => mockStop(),
  locationAllowed: async () => true,
}));

const meWith = (modules: string[]) => ({ ...me("DRIVER" as RoleCode), modules });
const TRIP = "czz0000000000000000trip01";
const SEAT = "czz00000000000000000seat1";
const stop = (id: string, order: number, name: string, minute: number, passedAt: string | null = null) => ({ id, order, name, lat: 18.5 + order / 100, lng: 73.8, morningMinute: minute, eveningMinute: null, radiusM: 150, scheduledMinute: minute, passedAt });
function trip(status: "SCHEDULED" | "LIVE" | "ENDED" | "MISSED", extra: Record<string, unknown> = {}) {
  return {
    id: TRIP,
    dateKey: "2026-10-05",
    direction: "MORNING",
    status,
    scheduledMinute: 430,
    startedAt: status === "LIVE" ? "2026-10-05T01:40:00.000Z" : null,
    endedAt: null,
    startReason: null,
    busRegistration: "MH 12 ZZ 1001",
    routeId: "czz0000000000000000route1",
    routeName: "ZZ Route 1",
    driverName: "ZZ Ganesh",
    lastPosition: status === "LIVE" ? { at: "2026-10-05T01:41:00.000Z", lat: 18.5, lng: 73.8, speed: 5, accuracy: 10 } : null,
    lowBattery: false,
    riders: 1,
    boarded: 0,
    stops: [stop("czz00000000000000000stop1", 1, "ZZ Paud Phata corner", 430, status === "LIVE" ? "2026-10-05T01:41:00.000Z" : null), stop("czz00000000000000000stop2", 2, "ZZ Karve Statue", 440)],
    track: [],
    roster: [{ allotmentId: SEAT, studentMembershipId: "czz000000000000000pupil01", name: "ZZ Asha", className: "Grade 3 · A", stopId: "czz00000000000000000stop2", stopName: "ZZ Karve Statue", rides: true, boardedAt: null, alightedAt: null }],
    canStart: status === "SCHEDULED" || status === "MISSED",
    ...extra,
  };
}
const day = (trips: unknown[], needed = false) => ({ dateKey: "2026-10-05", consent: { needed, textKey: "transport.consentBody", consentedAt: needed ? null : "2026-10-04T10:00:00.000Z" }, trips });

beforeEach(() => {
  mockStart.mockClear();
  mockStop.mockClear();
  mockPlace.current = { lat: 18.5, lng: 73.8, accuracy: 12 };
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __resetTripPositions();
  // The outbox's replays find no network, so a queued tick stays to be read.
  __setReplayFetch((async () => {
    throw new TypeError("Network request failed");
  }) as unknown as typeof fetch);
});

describe("the driver's home (transport, 3 Oct 2026)", () => {
  it("says transport is off when the school has not switched it on", async () => {
    await mountStaff(<DriverHome />, "DRIVER", {}, { me: meWith(["ALUMNI"]) });
    expect(await screen.findByText("Transport is not switched on")).toBeTruthy();
  });

  it("asks once for the yes to the location sentence and sends it", async () => {
    const { calls } = await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([trip("SCHEDULED")], true)), "POST /api/v1/transport/consent": () => json({ consentedAt: "2026-10-05T01:00:00.000Z", textKey: "transport.consentBody" }) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("Your location during trips")).toBeTruthy();
    expect(screen.getByText(/collected only between Start trip and End trip/)).toBeTruthy();
    // No Start before the yes.
    expect(screen.queryByRole("button", { name: "Start trip" })).toBeNull();
    await userEvent.setup().press(screen.getByRole("button", { name: "I agree" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/transport/consent")).toBe(true));
  });

  it("starts at the stop with the phone's place, and begins sending the bus's position", async () => {
    const { calls } = await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([trip("SCHEDULED")])), [`POST /api/v1/transport/trips/${TRIP}/start`]: () => json({ ok: true }) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("MH 12 ZZ 1001, Morning trip")).toBeTruthy();
    expect(screen.getByTestId("transport-map")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Start trip" }));
    await waitFor(() => expect(mockStart).toHaveBeenCalledWith(TRIP, expect.objectContaining({ title: "Trip running" })));
    const sent = calls().find((c) => c.line === `POST /api/v1/transport/trips/${TRIP}/start`);
    expect(sent?.body).toEqual({ lat: 18.5, lng: 73.8, accuracy: 12 });
  });

  it("away from the stop, says so and starts with the driver's reason", async () => {
    let n = 0;
    const { calls } = await mountStaff(
      <DriverHome />,
      "DRIVER",
      {
        "GET /api/v1/transport/today": () => json(day([trip("MISSED")])),
        [`POST /api/v1/transport/trips/${TRIP}/start`]: () => (n++ === 0 ? json({ error: "You are not at the first stop. Give a reason to start the trip from here.", code: "FORBIDDEN" }, 403) : json({ ok: true })),
      },
      { me: meWith(["TRANSPORT"]) },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Start trip" }));
    expect(await screen.findByText("You are not at the first stop. Give a reason to start the trip from here.")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Why are you starting away from the first stop?"), "Road closed at the corner");
    await userEvent.setup().press(screen.getByRole("button", { name: "Start with this reason" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST /api/v1/transport/trips/${TRIP}/start`)).toHaveLength(2));
    expect(calls().filter((c) => c.line === `POST /api/v1/transport/trips/${TRIP}/start`)[1]!.body).toEqual({ reason: "Road closed at the corner" });
  });

  it("with no location, asks for a reason instead", async () => {
    mockPlace.current = null;
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([trip("SCHEDULED")])) }, { me: meWith(["TRANSPORT"]) });
    await userEvent.setup().press(await screen.findByRole("button", { name: "Start trip" }));
    expect(await screen.findByText(/Location is off for this app/)).toBeTruthy();
    expect(screen.getByLabelText("Why are you starting away from the first stop?")).toBeTruthy();
  });

  it("while live: sends positions, ticks a pupil through the outbox, and ends only when asked twice", async () => {
    const { calls } = await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([trip("LIVE", { lowBattery: true })])), [`POST /api/v1/transport/trips/${TRIP}/end`]: () => json({ ok: true, endedAt: "2026-10-05T02:00:00.000Z" }) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("Trip running")).toBeTruthy();
    expect(screen.getByText("Battery low: the office can see it.")).toBeTruthy();
    await waitFor(() => expect(mockStart).toHaveBeenCalledWith(TRIP, expect.anything()));
    await userEvent.setup().press(screen.getByRole("button", { name: "Mark ZZ Asha on the bus" }));
    await waitFor(async () => expect(await listQueued(BOARDINGS_TAG)).toHaveLength(1));
    expect(JSON.parse((await listQueued(BOARDINGS_TAG))[0]!.body)).toMatchObject({ allotmentId: SEAT, boarded: true });
    expect(screen.getByRole("button", { name: "Mark ZZ Asha on the bus" }).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByRole("button", { name: "End trip" }));
    expect(await screen.findByText("End this trip? The bus's location stops being sent.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST /api/v1/transport/trips/${TRIP}/end`)).toBe(false);
    const buttons = screen.getAllByRole("button", { name: "End trip" });
    await userEvent.setup().press(buttons[buttons.length - 1]!);
    await waitFor(() => expect(calls().some((c) => c.line === `POST /api/v1/transport/trips/${TRIP}/end`)).toBe(true));
    await waitFor(() => expect(mockStop).toHaveBeenCalled());
  });

  it("an ended trip reads its ticks and offers no start", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([trip("ENDED", { roster: [{ ...trip("ENDED").roster[0], boardedAt: "2026-10-05T01:45:00.000Z" }] })])) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText(/^On the bus /)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Start trip" })).toBeNull();
  });

  it("says when there are no trips today", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json(day([])) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("No trips for you today")).toBeTruthy();
  });

  it("on a Sunday says there is no school, not that trips are missing or missed (B-11)", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json({ ...day([]), dateKey: "2026-10-04", noSchool: { holidayName: null } }) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("No school today.")).toBeTruthy();
    expect(screen.getByText("No trips run on a day the school is shut.")).toBeTruthy();
    expect(screen.queryByText("No trips for you today")).toBeNull();
    expect(screen.queryByRole("button", { name: "Start trip" })).toBeNull();
  });

  it("on a closing holiday names it", async () => {
    await mountStaff(<DriverHome />, "DRIVER", { "GET /api/v1/transport/today": () => json({ ...day([]), noSchool: { holidayName: "ZZ Gandhi Jayanti" } }) }, { me: meWith(["TRANSPORT"]) });
    expect(await screen.findByText("No school today — ZZ Gandhi Jayanti.")).toBeTruthy();
  });
});
