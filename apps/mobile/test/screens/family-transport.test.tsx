import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, press, refused, renderFamily } from "./family-helpers";
import { FamilyTransport } from "@/screens/family/transport";

const PATH = "/api/v1/family/transport";
const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const SEAT = { routeName: "ZZ Route 1", stopName: "ZZ Karve Statue", boards: true, alights: true, morningMinute: 440, eveningMinute: 960, busRegistration: "MH 12 ZZ 1001", driverName: null, driverPhone: null };
const stop = (id: string, order: number, name: string, minute: number, extra: Record<string, unknown> = {}) => ({ id, order, name, lat: 18.5 + order / 100, lng: 73.8, scheduledMinute: minute, passedAt: null, mine: false, ...extra });
const LIVE = {
  id: "czz0000000000000000trip01",
  direction: "MORNING",
  status: "LIVE",
  startedAt: "2026-10-05T01:40:00.000Z",
  endedAt: null,
  lastPosition: { at: "2026-10-05T01:42:00.000Z", lat: 18.505, lng: 73.8, speed: 5, accuracy: 10 },
  staleMinutes: 4,
  eta: { earliest: "2026-10-05T01:52:00.000Z", latest: "2026-10-05T01:58:00.000Z" },
  stops: [stop("s1", 1, "ZZ Paud Phata corner", 430, { passedAt: "2026-10-05T01:41:00.000Z" }), stop("s2", 2, "ZZ Karve Statue", 440, { mine: true })],
  boardedAt: null,
  alightedAt: null,
};
const view = (extra: Record<string, unknown> = {}) => ({ studentMembershipId: ID.child, childName: "ZZ Asha", schoolName: "ZZ School", moduleOn: true, seat: SEAT, nearAlerts: true, trip: LIVE, ...extra });

describe("a child's bus for the family (transport, 3 Oct 2026)", () => {
  it("is loading while the bus is on its way to the screen", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the bus, the stop and its times, the live trip on the map, how stale it is and when to expect it", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view() });
    expect(await screen.findByText("ZZ Asha's bus")).toBeTruthy();
    expect(screen.getByText("Bus MH 12 ZZ 1001")).toBeTruthy();
    expect(screen.getByText("ZZ Route 1 · ZZ Karve Statue")).toBeTruthy();
    expect(screen.getByText("Picked up at 07:20")).toBeTruthy();
    expect(screen.getByText("Set down at 16:00")).toBeTruthy();
    expect(screen.getByText("The bus is on its way")).toBeTruthy();
    expect(screen.getByText("Last seen 4 minutes ago")).toBeTruthy();
    expect(screen.getByText(/^Expected at ZZ Karve Statue between /)).toBeTruthy();
    expect(screen.getByTestId("transport-map")).toBeTruthy();
    expect(screen.getByText(/Your stop/)).toBeTruthy();
    // No driver unless the school says so.
    expect(screen.queryByText(/^Driver:/)).toBeNull();
  });

  it("names the driver and their number when the school allows it", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view({ seat: { ...SEAT, driverName: "ZZ Ganesh", driverPhone: "+919800000001" }, trip: { ...LIVE, staleMinutes: null, eta: null, stops: [stop("s1", 1, "ZZ Paud Phata corner", 430), stop("s2", 2, "ZZ Karve Statue", 440, { mine: true, passedAt: "2026-10-05T01:50:00.000Z" })], boardedAt: "2026-10-05T01:50:30.000Z" } }) });
    expect(await screen.findByText("Driver: ZZ Ganesh")).toBeTruthy();
    expect(screen.getByRole("button", { name: "+919800000001" })).toBeTruthy();
    expect(screen.getByText(/^The bus passed ZZ Karve Statue at /)).toBeTruthy();
    expect(screen.getByText(/^On the bus at /)).toBeTruthy();
  });

  it("switches the near-stop alert for this child", async () => {
    const { fetch } = await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view(), [`${PATH}/alerts`]: () => ({ nearAlerts: false }) });
    await press(await screen.findByRole("switch", { name: "Tell me when the bus is near" }));
    await waitFor(() => expect(calls(fetch, `${PATH}/alerts`)).toHaveLength(1));
    expect(bodyOf(calls(fetch, `${PATH}/alerts`)[0]!)).toEqual({ childId: ID.child, nearAlerts: false });
  });

  it("says what went wrong when the switch is refused", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view(), [`${PATH}/alerts`]: refused(403, "ZZ not yours") });
    await press(await screen.findByRole("switch", { name: "Tell me when the bus is near" }));
    expect(await screen.findByText("ZZ not yours")).toBeTruthy();
  });

  it("says when the child has no seat", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view({ seat: null, trip: null }) });
    expect(await screen.findByText("ZZ Asha has no seat on a school bus")).toBeTruthy();
  });

  it("says when there is no trip today", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view({ trip: null }) });
    expect(await screen.findByText("No trip today")).toBeTruthy();
  });

  it("says when the child's school has transport off", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: () => view({ moduleOn: false, seat: null, trip: null }) });
    expect(await screen.findByText("Transport is not switched on")).toBeTruthy();
  });

  it("shows a pupil their own bus with no alert switch, and an ended trip as ended", async () => {
    const { fetch } = await renderFamily(<FamilyTransport />, ME_STUDENT, { [PATH]: () => view({ trip: { ...LIVE, status: "ENDED", endedAt: "2026-10-05T02:00:00.000Z", staleMinutes: null, eta: null } }) });
    expect(await screen.findByText("This trip has ended")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(calls(fetch, PATH)[0]!.url.search).toBe("");
  });

  it("says so when the read fails", async () => {
    await renderFamily(<FamilyTransport />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByText("ZZ broke")).toBeTruthy();
  });
});
