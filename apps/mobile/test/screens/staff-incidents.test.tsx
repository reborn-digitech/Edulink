import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { logQuery, StaffIncidents } from "@/screens/staff/incidents";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's; the screen reads an optional pupil filter from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = "czz000000000000000pupil1";
const INC1 = "czz0000000000000000000inc1";
const INC2 = "czz0000000000000000000inc2";
const GET = "GET /api/v1/staff/incidents";

const row = (over: Record<string, unknown> = {}) => ({
  id: INC1,
  studentMembershipId: PUPIL,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  reportedByName: "ZZ Teacher",
  kind: "INJURY",
  severity: "MINOR",
  occurredAt: "2026-09-18T05:00:00.000Z",
  place: "Playground",
  title: "ZZ Fell on the steps, grazed knee",
  guardiansNotifiedAt: "2026-09-18T05:01:00.000Z",
  status: "OPEN",
  closedAt: null,
  closedByName: null,
  noteCount: 2,
  ...over,
});
const list = (rows: unknown[], over: Record<string, unknown> = {}) => ({ rows, total: rows.length, page: 1, pageSize: 25, openCount: rows.filter((r) => (r as { status: string }).status === "OPEN").length, ...over });

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("the query string", () => {
  it("carries the status, the pupil when filtered, and the page past the first", () => {
    expect(logQuery("OPEN", undefined, 1)).toBe("?status=OPEN");
    expect(logQuery("ALL", PUPIL, 2)).toBe(`?status=ALL&studentMembershipId=${PUPIL}&page=2`);
  });
});

describe("the incident log for the school", () => {
  it("loads, then lists the open incidents with the pupil, the kind, the family line and the note count", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffIncidents />, "ADMIN", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(list([row(), row({ id: INC2, title: "ZZ Fever at eleven", kind: "ILLNESS", severity: "SERIOUS", guardiansNotifiedAt: null, noteCount: 0, className: null })])));
    expect(await screen.findByText("2 open")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/incidents?status=OPEN")).toBe(true);
    expect(screen.getByRole("tab", { name: "Open (2)" })).toBeTruthy();
    const first = screen.getByRole("button", { name: /^ZZ Fell on the steps, grazed knee, / });
    expect(first.props.accessibilityLabel).toContain("ZZ Asha · ZZ 5A · Injury · Family told ");
    expect(first.props.accessibilityLabel).toContain("· Follow-up 2");
    expect(screen.getByRole("button", { name: /^ZZ Fever at eleven, / }).props.accessibilityLabel).toContain("Illness or sick room · Family not told by the app");
    expect(screen.getByText("Serious")).toBeTruthy();
    expect(screen.getByText("Minor")).toBeTruthy();
    // No pupil in the route: the way to record one is the class roster.
    expect(screen.queryByRole("button", { name: "Record an incident" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a row opens the incident", async () => {
    await mountStaff(<StaffIncidents />, "TEACHER", { [GET]: () => json(list([row()])) });
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ Fell on the steps/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/incident", params: { incidentId: INC1 } });
  });

  it("the tabs change the status the server is asked for, and All shows each row's state", async () => {
    const { calls } = await mountStaff(<StaffIncidents />, "PRINCIPAL", {
      [GET]: ({ url }) => {
        const status = url.searchParams.get("status");
        if (status === "CLOSED") return json(list([row({ status: "CLOSED", closedAt: "2026-09-19T05:00:00.000Z", closedByName: "ZZ Office" })], { openCount: 1 }));
        if (status === "ALL") return json(list([row(), row({ id: INC2, title: "ZZ Old one", status: "CLOSED", closedAt: "2026-09-19T05:00:00.000Z", closedByName: "ZZ Office" })]));
        return json(list([row()]));
      },
    });
    expect(await screen.findByRole("button", { name: /^ZZ Fell on the steps/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole("tab", { name: "Closed" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/incidents?status=CLOSED")).toBe(true));
    await fireEvent.press(screen.getByRole("tab", { name: "All" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/incidents?status=ALL")).toBe(true));
    expect(await screen.findByRole("button", { name: /^ZZ Old one/ })).toBeTruthy();
    // The tab and the closed row's pill.
    expect(screen.getAllByText("Closed").length).toBeGreaterThanOrEqual(2);
  });

  it("with a pupil in the route it is that pupil's file, filtered, with the record button", async () => {
    mockRouter.params = { studentMembershipId: PUPIL, name: "ZZ Asha" };
    const { calls } = await mountStaff(<StaffIncidents />, "ADMIN", { [GET]: () => json(list([])) });
    expect(await screen.findByText("Nothing recorded")).toBeTruthy();
    expect(screen.getByText("The school has not recorded any incident or sick-room visit for ZZ Asha.")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET /api/v1/staff/incidents?status=OPEN&studentMembershipId=${PUPIL}`)).toBe(true);
    await fireEvent.press(screen.getAllByRole("button", { name: "Record an incident" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/incident-new", params: { membershipId: PUPIL, name: "ZZ Asha" } });
  });

  it("a teacher with nothing recorded is told so, with the roster as the door", async () => {
    await mountStaff(<StaffIncidents />, "TEACHER", { [GET]: () => json(list([])) });
    expect(await screen.findByText("No incidents")).toBeTruthy();
    expect(screen.getByText("Nothing has been recorded for the pupils in your classes.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Classes" })[1]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a second page is reachable", async () => {
    const { calls } = await mountStaff(<StaffIncidents />, "ADMIN", {
      [GET]: ({ url }) => json(list([row({ id: url.searchParams.get("page") === "2" ? INC2 : INC1, title: url.searchParams.get("page") === "2" ? "ZZ Page two" : "ZZ Page one" })], { total: 30, page: Number(url.searchParams.get("page") ?? 1) })),
    });
    expect(await screen.findByText("Page 1 of 2")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/incidents?status=OPEN&page=2")).toBe(true));
    expect(await screen.findByRole("button", { name: /^ZZ Page two/ })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<StaffIncidents />, "TEACHER", { [GET]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
