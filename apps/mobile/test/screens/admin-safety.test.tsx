import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Safety } from "@/screens/staff/safety";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const AT = "2026-09-08T09:00:00.000Z";
const VISIT = { id: "v1", reason: "ZZ support ticket", startedAt: AT, expiresAt: "2026-09-08T10:00:00.000Z", endedAt: null, operatorName: "ZZ Operator", live: true };
const POST_REPORT = {
  targetType: "POST",
  targetId: "p1",
  target: { kind: "POST", available: true, title: "ZZ A post", body: "ZZ named another pupil.", status: "APPROVED", authorName: "ZZ Author", authorRole: "STUDENT", createdAt: AT, href: "/bulletin/p1" },
  reportIds: ["r1", "r2"],
  count: 2,
  reasons: [{ reason: "BULLYING", count: 2 }],
  details: [{ reason: "BULLYING", detail: "ZZ this is unkind.", reporterName: "ZZ Reporter", at: AT }],
  firstAt: AT,
  latestAt: AT,
  status: "OPEN",
  resolutionNote: null,
};
const USER_REPORT = {
  targetType: "USER",
  targetId: "m9",
  target: { kind: "USER", available: true, name: "ZZ Person", roles: ["STUDENT"], href: "/admin/directory/m9", suspended: false },
  reportIds: ["r3"],
  count: 1,
  reasons: [{ reason: "SPAM", count: 1 }],
  details: [],
  firstAt: AT,
  latestAt: AT,
  status: "OPEN",
  resolutionNote: null,
};
const CLOSED_REPORT = { ...POST_REPORT, target: { kind: "POST", available: false }, status: "ACTIONED", resolutionNote: "ZZ taken down." };
const AUDIT = [
  { id: "a1", action: "compliance.export", actorName: "ZZ Head", targetType: null, targetId: null, meta: {}, ip: null, at: AT },
  { id: "a2", action: "zz.custom", actorName: "ZZ Office", targetType: "class", targetId: "c1", meta: { n: 1 }, ip: "127.0.0.1", at: AT },
];
/** By tab, the way the endpoint answers. */
const answer: Answer = ({ url }) => {
  const tab = url.searchParams.get("tab") ?? "open";
  return json({ openCount: 2, visits: [VISIT], reports: tab === "open" ? [POST_REPORT, USER_REPORT] : tab === "closed" ? [CLOSED_REPORT] : [], audit: tab === "audit" ? AUDIT : [] });
};

describe("the safety centre", () => {
  it("loads, then shows who opened the school, the open reports and what was reported", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => answer({ url: new URL("http://api.test/api/v1/admin/safety?tab=open"), init: {} }) as Response);
    await screen.findByText("ZZ A post");
    expect(screen.getByText("2 things to deal with")).toBeTruthy();
    expect(screen.getByText("ZZ Operator")).toBeTruthy();
    expect(screen.getByText("2 reports · a post")).toBeTruthy();
    expect(screen.getByText("Unkind or bullying ×2")).toBeTruthy();
    expect(screen.getByText("ZZ named another pupil.")).toBeTruthy();
    expect(screen.getByText("ZZ Reporter · Unkind or bullying")).toBeTruthy();
    expect(screen.getByText("1 report · a person")).toBeTruthy();
    expect(screen.getByText("ZZ Person")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/safety?tab=open")).toBe(true);
  });

  it("deciding a report and opening the content are the web's", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": answer });
    await fireEvent.press(await screen.findByRole("button", { name: "Open it" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/bulletin/p1`);
    await fireEvent.press(screen.getByRole("button", { name: "Take it down" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/safety`);
    await fireEvent.press(screen.getByRole("button", { name: "Pause their access" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/directory/m9`);
    open.mockRestore();
  });

  it("the resolved and audit tabs ask the API; an action with no wording shows its raw key", async () => {
    const { calls } = await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": answer });
    await screen.findByText("ZZ A post");
    await fireEvent.press(screen.getByRole("radio", { name: "Resolved" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/safety?tab=closed")).toBe(true));
    expect(await screen.findByText("This content is no longer available")).toBeTruthy();
    expect(screen.getByText("ZZ taken down.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Audit log" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/safety?tab=audit")).toBe(true));
    expect(await screen.findByText("Exported a compliance file")).toBeTruthy();
    expect(screen.getByText("zz.custom")).toBeTruthy();
    expect(screen.getByText("2 of 2 entries")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Sensitive" }));
    expect(screen.getByText("1 of 2 entries")).toBeTruthy();
    expect(screen.queryByText("zz.custom")).toBeNull();
  });

  it("nothing reported says so, with a door to the audit log", async () => {
    await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": () => json({ openCount: 0, visits: [], reports: [], audit: [] }) });
    expect(await screen.findByText("Nothing reported")).toBeTruthy();
    expect(screen.getByText("Nothing needs your attention")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Audit log" }));
    expect(await screen.findByText("Nothing logged yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "To deal with" }));
    expect(await screen.findByText("Nothing reported")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/safety")).length).toBe(2));
  });
});
