import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { Safety } from "@/screens/staff/safety";
import { gated, json, mountStaff, refused, type Answer, type Answers } from "./staff-harness";

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
const deciding = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <Safety />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/admin/safety": answer, ...answers },
  );

beforeEach(() => mockRouter.push.mockClear());

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

  it("the reported post and the reported person open the app's own screens", async () => {
    await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": answer });
    await fireEvent.press(await screen.findByRole("button", { name: "Open it" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p1" } });
    await fireEvent.press(screen.getByRole("button", { name: "Pause their access" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/people" });
  });

  it("taking it down needs the note the author will read, then posts it and says so", async () => {
    const { calls } = await deciding({ "POST /api/v1/office/safety/take-down": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Take it down" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    expect(screen.getByRole("button", { name: "Take it down" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Why is it coming down? The author sees this."), "ZZ Please repost without the name.");
    await fireEvent.press(screen.getByRole("button", { name: "Take it down" }));
    expect(await screen.findByText("Taken down and the author told")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/safety/take-down")?.body).toEqual({ targetType: "POST", targetId: "p1", note: "ZZ Please repost without the name." });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/safety?tab=open").length).toBe(2));
  });

  it("nothing wrong closes the reports with a note only staff see; cancelling sends nothing", async () => {
    const { calls } = await deciding({ "POST /api/v1/office/safety/dismiss": () => json({ ok: true }) });
    await screen.findByText("ZZ Person");
    const [onPost, onPerson] = screen.getAllByRole("button", { name: "Nothing wrong — close it" });
    await fireEvent.press(onPost!);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(onPerson!);
    await fireEvent.changeText(screen.getByLabelText("Why is this alright? Only staff see this."), "ZZ Checked with the class teacher.");
    await fireEvent.press(screen.getByRole("button", { name: "Close the reports" }));
    expect(await screen.findByText("1 report closed")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/safety/dismiss")?.body).toEqual({ targetType: "USER", targetId: "m9", note: "ZZ Checked with the class teacher." });
  });

  it("a refused decision is the server's sentence, and the note stays", async () => {
    await deciding({ "POST /api/v1/office/safety/take-down": refused("That content no longer exists.", 404) });
    await fireEvent.press(await screen.findByRole("button", { name: "Take it down" }));
    await fireEvent.changeText(screen.getByLabelText("Why is it coming down? The author sees this."), "ZZ note");
    await fireEvent.press(screen.getByRole("button", { name: "Take it down" }));
    expect(await screen.findByText("That content no longer exists.")).toBeTruthy();
    expect(screen.getByLabelText("Why is it coming down? The author sees this.")).toHaveDisplayValue("ZZ note");
  });

  it("the resolved and audit tabs ask the API; an action with no wording shows its raw key", async () => {
    const { calls } = await mountStaff(<Safety />, "ADMIN", { "GET /api/v1/admin/safety": answer });
    await screen.findByText("ZZ A post");
    await fireEvent.press(screen.getByRole("radio", { name: "Resolved" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/safety?tab=closed")).toBe(true));
    expect(await screen.findByText("This content is no longer available")).toBeTruthy();
    expect(screen.getByText("ZZ taken down.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Take it down" })).toBeNull();
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
