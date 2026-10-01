import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { operatorMetricsSchema } from "@edulink/contracts";
import { OperatorMetrics, statusLine } from "@/screens/operator/metrics";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const METRICS = operatorMetricsSchema.parse({
  since: ago(2 * 3_600_000),
  at: ago(0),
  requests: [
    { group: "me", total: 120, byStatus: { "200": 118, "401": 2 }, p50Ms: 12.5, p95Ms: 48 },
    { group: "attendance", total: 9, byStatus: { "200": 9 }, p50Ms: 80, p95Ms: 210 },
  ],
  errors: [
    { kind: "forbidden", count: 7 },
    { kind: "unexpected", count: 1 },
  ],
  errorsLastHour: 1,
  p95Ms: 60,
  outboxReplays: 3,
  jobsOverdue: 0,
  errorTracker: false,
});
const EMPTY = { ...METRICS, requests: [], errors: [], errorsLastHour: 0, p95Ms: null, outboxReplays: 0, jobsOverdue: 2, errorTracker: true };

const mount = (overrides: Answers = {}) => mountStaff(<OperatorMetrics />, "ADMIN", { "GET /api/v1/operator/metrics": () => json(METRICS), ...overrides }, { me: OPERATOR });

describe("the server's counters, for the operator", () => {
  it("shows the four headline counts, the tracker's state, each timed group with its percentiles and statuses, and the failures by kind", async () => {
    await mount();
    expect(await screen.findByLabelText("Server errors, last hour: 1")).toBeTruthy();
    expect(screen.getByLabelText("p95: 60 ms")).toBeTruthy();
    expect(screen.getByLabelText("Outbox replays: 3")).toBeTruthy();
    expect(screen.getByLabelText("Jobs overdue: 0")).toBeTruthy();
    expect(screen.getByText("Counting since 2 hours ago")).toBeTruthy();
    expect(screen.getByText("log")).toBeTruthy();
    expect(screen.getByText(/^Unexpected errors go to the server log/)).toBeTruthy();
    expect(screen.getByText("me")).toBeTruthy();
    expect(screen.getByText("Requests: 120")).toBeTruthy();
    expect(screen.getByText("p50 12.5 ms · p95 48 ms")).toBeTruthy();
    expect(screen.getByText("By status: 200 · 118, 401 · 2")).toBeTruthy();
    expect(screen.getByText("Refused")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("Unexpected (500)")).toBeTruthy();
    expect(screen.getByText(/^Timed: GET \/api\/v1\/me/)).toBeTruthy();
  });

  it("with nothing counted yet: the empty state with a refresh door, the tracker on, and the overdue jobs in amber", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/metrics": () => json(EMPTY) });
    expect(await screen.findByText("Nothing counted yet")).toBeTruthy();
    expect(screen.getByText("SENTRY_DSN")).toBeTruthy();
    expect(screen.getByLabelText("Jobs overdue: 2")).toBeTruthy();
    expect(screen.getByLabelText("p95: —")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/metrics").length).toBe(2));
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/metrics": refused("This area belongs to whoever runs the server.", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("This area belongs to whoever runs the server.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/metrics").length).toBe(2));
  });

  it("statusLine orders the statuses and joins them", () => {
    expect(statusLine({ "500": 1, "200": 10, "403": 2 })).toBe("200 · 10, 403 · 2, 500 · 1");
    expect(statusLine({})).toBe("");
  });
});
