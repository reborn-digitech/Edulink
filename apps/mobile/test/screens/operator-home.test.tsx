import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { operatorAuditSchema, operatorContentTeamSchema, operatorDashboardSchema, operatorExpertsSchema, operatorOverviewSchema } from "@edulink/contracts";
import { API_BASE } from "@/lib/api";
import { OperatorHome } from "@/screens/operator/home";
import { ToastProvider } from "@/components";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
});

/** The operator: no school, no role, the flag on the account. */
const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const OVERVIEW = operatorOverviewSchema.parse({
  counts: { live: 2, removed: 1, noAdmin: 1, unverified: 1, appAdmins: 3, expertsWaiting: 1 },
  schools: [
    { id: "s1", name: "ZZ Northgate", city: "Pune", country: "India", code: "NORTH-7X9K", gradeLow: "1", gradeHigh: "10", createdAt: ago(3 * 86_400_000), removedAt: null, verifiedAt: ago(2 * 86_400_000), pendingAdminInvites: 0 },
    { id: "s2", name: "ZZ Riverside", city: null, country: null, code: "RIVER-1A2B", gradeLow: null, gradeHigh: null, createdAt: ago(2 * 3_600_000), removedAt: null, verifiedAt: null, pendingAdminInvites: 1 },
  ],
  jobs: [
    { name: "digest:weekly", schedule: "0 7 * * 5", describeKey: "root.jobDescDigest", lastRun: { startedAt: ago(3_600_000), finishedAt: ago(3_500_000), ok: true, summary: '{"digests":4}', error: null }, lastSuccessAt: ago(3_600_000), overdue: false, lastFailed: false, running: false },
    { name: "files:reclaim", schedule: "30 3 * * *", describeKey: "root.jobDescReclaim", lastRun: { startedAt: ago(9 * 86_400_000), finishedAt: ago(9 * 86_400_000), ok: false, summary: "{}", error: "ZZ disk full" }, lastSuccessAt: null, overdue: true, lastFailed: true, running: false },
    { name: "notifications:tidy", schedule: "0 4 * * *", describeKey: "root.jobDescTidy", lastRun: null, lastSuccessAt: null, overdue: true, lastFailed: false, running: false },
  ],
});

const EXPERTS = operatorExpertsSchema.parse({
  items: [
    { profileId: "p1", name: "ZZ Mentor", email: "m@zz.test", headline: "Robotics coach", organisation: "ZZ Labs", specialisms: ["Robotics", "Physics"], offering: "MENTORING", mentorCapacity: 3, activeMentorships: 0, publishedAt: null, verifiedAt: null, createdAt: ago(86_400_000) },
    { profileId: "p2", name: "ZZ Listed", email: null, headline: "Chess", organisation: null, specialisms: [], offering: "SESSIONS", mentorCapacity: null, activeMentorships: 1, publishedAt: ago(30 * 86_400_000), verifiedAt: null, createdAt: ago(40 * 86_400_000) },
  ],
});

const TEAM = operatorContentTeamSchema.parse({
  items: [
    { id: "u-op", name: "ZZ Operator", email: "op@zz.test", disabled: false, isOperator: true, you: true },
    { id: "u2", name: "ZZ Curator", email: "cur@zz.test", disabled: true, isOperator: false, you: false },
  ],
});

const AUDIT = operatorAuditSchema.parse({
  items: [
    { id: "a1", at: ago(60_000), action: "superuser.school.create", actionKey: "audit.superuserSchoolCreate", actorName: "ZZ Operator", system: false, schoolName: "ZZ Northgate", ip: "10.0.0.1", summary: null },
    { id: "a2", at: ago(120_000), action: "superuser.zz.custom", actionKey: null, actorName: null, system: true, schoolName: null, ip: null, summary: "head@zz.test · ADMIN" },
  ],
  total: 2,
  actions: ["superuser.school.create", "superuser.zz.custom"],
});

/** The dashboard's read (2026-10-02): the tiles and the two schools due within a week. */
const DASHBOARD = operatorDashboardSchema.parse({
  month: "2026-10",
  tiles: { live: 2, trial: 1, dueSoon: 1, pastDue: 1, suspended: 0, pupils: 340, messages: 1200, messageCap: 7000, storageMb: 90, storageCapMb: null, jobsOverdue: 2, owedThisMonthPaise: 25_000 },
  partners: [{ id: "cp1", name: "ZZ Partner", percentTenths: 125, schools: 2, owedThisMonthPaise: 25_000 }],
  plans: [{ id: "p1", code: "starter", name: "Starter" }],
  rows: [],
  dueSoon: [
    { id: "s3", name: "ZZ Hillside", dueAt: "2026-09-27", daysToDue: -5, status: "ACTIVE" },
    { id: "s4", name: "ZZ Lakeside", dueAt: "2026-10-05", daysToDue: 3, status: "TRIAL" },
  ],
});

const answers = (overrides: Answers = {}): Answers => ({
  "GET /api/v1/operator/overview": () => json(OVERVIEW),
  "GET /api/v1/operator/dashboard": () => json(DASHBOARD),
  "GET /api/v1/operator/experts": () => json(EXPERTS),
  "GET /api/v1/operator/content-team": () => json(TEAM),
  "GET /api/v1/operator/audit": () => json(AUDIT),
  ...overrides,
});

const mount = (overrides: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <OperatorHome />
    </ToastProvider>,
    "ADMIN",
    answers(overrides),
    { me: OPERATOR },
  );

describe("the operator's home", () => {
  it("loads, then shows the name, the Server badge, the counts and the schools with their codes and invite warnings", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/operator/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    await screen.findByText("ZZ Northgate");
    expect(screen.getByText("ZZ Operator")).toBeTruthy();
    expect(screen.getByText("Server")).toBeTruthy();
    expect(screen.getByLabelText("Live: 2")).toBeTruthy();
    expect(screen.getByLabelText("Admin invite pending: 1")).toBeTruthy();
    expect(screen.getByLabelText("Awaiting check: 1")).toBeTruthy();
    expect(screen.getByLabelText("Content team: 3")).toBeTruthy();
    expect(screen.getByLabelText("Waiting for you: 1")).toBeTruthy();
    expect(screen.getByText(/Pune, India · Join code NORTH-7X9K · joined 3 days ago/)).toBeTruthy();
    expect(screen.getByText(/No address · Join code RIVER-1A2B · joined 2 hours ago/)).toBeTruthy();
    // The school that registered itself wears both: not yet checked, and its admin still to accept.
    expect(screen.getByText("1 invite pending")).toBeTruthy();
    expect(screen.getAllByText("Awaiting check").length).toBeGreaterThanOrEqual(2);
    expect(calls().some((c) => c.line === "GET /api/v1/operator/overview")).toBe(true);
  });

  it("the dashboard: the tiles, the schools due within a week opening their pages, and onboarding sent to the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mount();
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByLabelText("On trial: 1")).toBeTruthy();
    expect(screen.getByLabelText("Due within 30 days: 1")).toBeTruthy();
    expect(screen.getByLabelText("Past due: 1")).toBeTruthy();
    expect(screen.getByLabelText("Pupils on the platform: 340")).toBeTruthy();
    expect(screen.getByLabelText("Texts this month: 1200 of 7000")).toBeTruthy();
    expect(screen.getByLabelText("Storage: 90 MB")).toBeTruthy();
    expect(screen.getByLabelText("Jobs overdue: 2")).toBeTruthy();
    expect(screen.getByLabelText("Commission owed this month: ₹250")).toBeTruthy();
    expect(screen.getByText("Due within a week")).toBeTruthy();
    expect(screen.getByText("27/09/2026 · 5 days overdue")).toBeTruthy();
    expect(screen.getByText("05/10/2026 · Due in 3 days")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Hillside, 27\/09\/2026/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/operator-school", params: { schoolId: "s3" } });
    expect(screen.getByText("Onboarding a school is done on the web, where one form takes everything at once.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Onboard a school" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/onboard`);
    open.mockRestore();
  });

  it("nothing due within a week says so", async () => {
    await mount({ "GET /api/v1/operator/dashboard": () => json({ ...DASHBOARD, dueSoon: [] }) });
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByText("Nothing falls due within a week.")).toBeTruthy();
  });

  it("a refused dashboard is an alert with a retry beside the list, which still loads", async () => {
    let refuse = true;
    const { calls } = await mount({ "GET /api/v1/operator/dashboard": () => (refuse ? json({ error: "ZZ dashboard down", code: "SERVER" }, 500) : json(DASHBOARD)) });
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByText("ZZ dashboard down")).toBeTruthy();
    refuse = false;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Due within a week")).toBeTruthy();
    expect(calls().filter((c) => c.line === "GET /api/v1/operator/dashboard").length).toBe(2);
  });

  it("a school opens its own page and Add a school opens the form, both here; the state chips and the search ask the API", async () => {
    const { calls } = await mount();
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Northgate,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/operator-school", params: { schoolId: "s1" } });
    await fireEvent.press(screen.getByRole("button", { name: "Add a school" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/operator-new-school");
    // No door to the web is left on the console.
    expect(screen.queryByRole("button", { name: "Server administration" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Awaiting check" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?state=unverified")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "Removed" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?state=removed")).toBe(true));
    await fireEvent.changeText(screen.getByLabelText("Search"), "river");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?q=river&state=removed")).toBe(true));
  });

  it("jobs: the three tiles, a pill per job, the error in its note", async () => {
    await mount();
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Jobs" }));
    expect(await screen.findByText("digest:weekly")).toBeTruthy();
    expect(screen.getByLabelText("On time: 1")).toBeTruthy();
    expect(screen.getByLabelText("Overdue: 2")).toBeTruthy();
    expect(screen.getByLabelText("Last run failed: 0")).toBeTruthy();
    expect(screen.getByText("2 jobs are overdue.")).toBeTruthy();
    // The tile's label and the pill: "On time" once each, "Overdue" on the tile and on two jobs.
    expect(screen.getAllByText("On time").length).toBe(2);
    expect(screen.getAllByText("Overdue").length).toBe(3);
    expect(screen.getByText("Sends every family one message a week saying what happened.")).toBeTruthy();
    expect(screen.getByText("Error: ZZ disk full")).toBeTruthy();
    expect(screen.getByText(/^Last run: Never/)).toBeTruthy();
    expect(screen.getByText("Counted: digests 4")).toBeTruthy();
  });

  it("no jobs: the setup note, and the door is a refresh here rather than the web", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/overview": () => json({ ...OVERVIEW, jobs: [] }) });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Jobs" }));
    expect(await screen.findByText("Nothing in the app runs these on its own. On the server, once:")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/overview").length).toBe(2));
  });

  it("experts: fetched when the chip is pressed; listing asks first, then posts the standing and says so", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/experts/p1/standing": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    expect(calls().some((c) => c.line === "GET /api/v1/operator/experts")).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "Experts" }));
    expect(await screen.findByText("ZZ Mentor")).toBeTruthy();
    expect(screen.getByText("1 waiting · 1 listed")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText("Listed")).toBeTruthy();
    expect(screen.getByText("Robotics coach · ZZ Labs")).toBeTruthy();
    expect(screen.getByText("Robotics, Physics")).toBeTruthy();
    expect(screen.getByText("m@zz.test")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "List them: ZZ Mentor" }));
    expect(screen.getByText("List ZZ Mentor? Every school on this server will be able to find and book them.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/experts/p1/standing")?.body).toEqual({ published: true, verified: false }));
    expect(await screen.findByText("ZZ Mentor is now listed")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/experts").length).toBe(2));
  });

  it("experts: Keep backs out without a write; take off and identity checked post their pair; a refusal is the server's sentence", async () => {
    const { calls } = await mount({
      "POST /api/v1/operator/experts/p2/standing": (req) =>
        (JSON.parse(String(req.init.body)) as { published: boolean }).published ? json({ ok: true }) : refused("ZZ That profile cannot be taken off right now.", 422)(req),
    });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Experts" }));
    await screen.findByText("ZZ Listed");
    await fireEvent.press(screen.getByRole("button", { name: "List and mark checked: ZZ Mentor" }));
    expect(screen.getByText("List ZZ Mentor and mark their identity checked? Only if you have checked who they are.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Mark identity checked: ZZ Listed" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/experts/p2/standing")?.body).toEqual({ published: true, verified: true }));
    expect(await screen.findByText("Marked as identity checked")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Take off the list: ZZ Listed" }));
    expect(screen.getByText("Take ZZ Listed off the list? Schools stop finding them; what is already agreed stays.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/operator/experts/p2/standing").map((c) => c.body)).toContainEqual({ published: false, verified: false }));
    expect(await screen.findByText("ZZ That profile cannot be taken off right now.")).toBeTruthy();
  });

  it("content team: the members with their badges; appoint by email, dismiss after a confirm, and the content area opens here", async () => {
    const { calls } = await mount({
      "POST /api/v1/operator/content-team": () => json({ ok: true }),
      "DELETE /api/v1/operator/content-team/u2": () => json({ ok: true }),
    });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Content team" }));
    expect(await screen.findByText("ZZ Curator")).toBeTruthy();
    expect(screen.getByText("ZZ Operator (you)")).toBeTruthy();
    expect(screen.getByText("operator")).toBeTruthy();
    expect(screen.getByText("disabled")).toBeTruthy();

    expect(screen.getByRole("button", { name: "Appoint" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Email of an existing account"), " new@zz.test ");
    await fireEvent.press(screen.getByRole("button", { name: "Appoint" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/content-team")?.body).toEqual({ email: "new@zz.test" }));
    expect(await screen.findByText("Appointed. They can sign in and open the content area now.")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Dismiss: ZZ Curator" }));
    expect(screen.getByText("Remove ZZ Curator from the content team? Their account is untouched — only the flag goes.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().some((c) => c.line === "DELETE /api/v1/operator/content-team/u2")).toBe(true));
    expect(await screen.findByText("Dismissed. The flag is gone; the account remains.")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Open the content area" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/appadmin");
  });

  it("content team: nobody yet is an empty state with a door; a refused appointment stays under the field", async () => {
    await mount({
      "GET /api/v1/operator/content-team": () => json({ items: [] }),
      "POST /api/v1/operator/content-team": refused("No account with that email. Ask them to register first, then appoint them here.", 422),
    });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Content team" }));
    expect(await screen.findByText("Nobody holds the content-team flag yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Appoint by email" })).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email of an existing account"), "nobody@zz.test");
    await fireEvent.press(screen.getByRole("button", { name: "Appoint" }));
    expect(await screen.findByText("No account with that email. Ask them to register first, then appoint them here.")).toBeTruthy();
  });

  it("the server log: labelled rows, the family chips and live accounts apply at once, the search and dates with Filter", async () => {
    const { calls } = await mount();
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Server log" }));
    expect(await screen.findByText("Added a school to this server")).toBeTruthy();
    expect(screen.getByText("superuser.zz.custom")).toBeTruthy();
    expect(screen.getByText(/^ZZ Operator · ZZ Northgate · /)).toBeTruthy();
    expect(screen.getByText(/^System · head@zz.test · ADMIN · /)).toBeTruthy();
    expect(screen.getByText("Showing 1–2 of 2")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/operator/audit")).toBe(true);

    await fireEvent.press(screen.getByRole("radio", { name: "Operator actions" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/audit?action=superuser.")).toBe(true));
    await fireEvent.press(screen.getByRole("switch", { name: "Only accounts that still exist" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/audit?action=superuser.&live=1")).toBe(true));

    await fireEvent.changeText(screen.getByLabelText("Search by person, school, email or IP"), "ZZ");
    await fireEvent.changeText(screen.getByLabelText("From"), "yesterday");
    expect(await screen.findByText("Write the date as year-month-day, e.g. 2026-09-01.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Filter" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("From"), "2026-09-01");
    await fireEvent.press(screen.getByRole("button", { name: "Filter" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/audit?action=superuser.&q=ZZ&from=2026-09-01&live=1")).toBe(true));

    await fireEvent.press(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Every action" })).toBeChecked());
    expect(screen.getByLabelText("From").props.value).toBe("");
  });

  it("the server log pages older and newer; an empty log's door is adding a school", async () => {
    const many = { ...AUDIT, total: 120 };
    const { calls } = await mount({ "GET /api/v1/operator/audit": ({ url }) => json(url.searchParams.get("q") === "none" ? { ...AUDIT, items: [], total: 0 } : many) });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Server log" }));
    expect(await screen.findByText("Showing 1–2 of 120")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Newer" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Older" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/audit?page=2")).toBe(true));
    expect(await screen.findByText("Showing 51–52 of 120")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Search by person, school, email or IP"), "none");
    await fireEvent.press(screen.getByRole("button", { name: "Filter" }));
    expect(await screen.findByText("Nothing matches these filters.")).toBeTruthy();
  });

  it("an empty, unfiltered log offers adding a school", async () => {
    await mount({ "GET /api/v1/operator/audit": () => json({ items: [], total: 0, actions: [] }) });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("radio", { name: "Server log" }));
    expect(await screen.findByText("Nothing recorded yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add a school" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/operator-new-school");
  });

  it("no schools: the door is the new-school form here; a narrowed search clears itself", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/overview": () => json({ ...OVERVIEW, schools: [] }) });
    expect(await screen.findByText("No schools yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add a school" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/operator-new-school");
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Live" })).toBeChecked());
    expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?state=all")).toBe(true);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/overview": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/operator/overview")).length).toBe(2));
  });
});
