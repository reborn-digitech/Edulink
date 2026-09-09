import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { OperatorHome } from "@/screens/operator/home";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

/** The operator: no school, no role, the flag on the account. */
const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const OVERVIEW = {
  counts: { live: 2, removed: 1, noAdmin: 1, appAdmins: 3, expertsWaiting: 1 },
  schools: [
    { id: "s1", name: "ZZ Northgate", city: "Pune", country: "India", code: "NORTH-7X9K", gradeLow: "1", gradeHigh: "10", createdAt: ago(3 * 86_400_000), removedAt: null, pendingAdminInvites: 0 },
    { id: "s2", name: "ZZ Riverside", city: null, country: null, code: "RIVER-1A2B", gradeLow: null, gradeHigh: null, createdAt: ago(2 * 3_600_000), removedAt: null, pendingAdminInvites: 1 },
  ],
  jobs: [
    { name: "digest:weekly", schedule: "0 7 * * 5", describeKey: "root.jobDescDigest", lastRun: { startedAt: ago(3_600_000), finishedAt: ago(3_500_000), ok: true, summary: '{"digests":4}', error: null }, lastSuccessAt: ago(3_600_000), overdue: false, lastFailed: false, running: false },
    { name: "files:reclaim", schedule: "30 3 * * *", describeKey: "root.jobDescReclaim", lastRun: { startedAt: ago(9 * 86_400_000), finishedAt: ago(9 * 86_400_000), ok: false, summary: "{}", error: "ZZ disk full" }, lastSuccessAt: null, overdue: true, lastFailed: true, running: false },
    { name: "notifications:tidy", schedule: "0 4 * * *", describeKey: "root.jobDescTidy", lastRun: null, lastSuccessAt: null, overdue: true, lastFailed: false, running: false },
  ],
};

const EXPERTS = {
  items: [
    { profileId: "p1", name: "ZZ Mentor", email: "m@zz.test", headline: "Robotics coach", organisation: "ZZ Labs", specialisms: ["Robotics", "Physics"], offering: "MENTORING", mentorCapacity: 3, activeMentorships: 0, publishedAt: null, verifiedAt: null, createdAt: ago(86_400_000) },
    { profileId: "p2", name: "ZZ Listed", email: null, headline: "Chess", organisation: null, specialisms: [], offering: "TALKS", mentorCapacity: null, activeMentorships: 1, publishedAt: ago(30 * 86_400_000), verifiedAt: null, createdAt: ago(40 * 86_400_000) },
  ],
};

const AUDIT = {
  items: [
    { id: "a1", at: ago(60_000), action: "superuser.school.create", actorName: "ZZ Operator", system: false, schoolName: "ZZ Northgate", ip: "10.0.0.1", summary: null },
    { id: "a2", at: ago(120_000), action: "superuser.invite.admin", actorName: null, system: true, schoolName: null, ip: null, summary: "head@zz.test · ADMIN" },
  ],
};

const answers = (overview: unknown = OVERVIEW) => ({
  "GET /api/v1/operator/overview": () => json(overview),
  "GET /api/v1/operator/experts": () => json(EXPERTS),
  "GET /api/v1/operator/audit": () => json(AUDIT),
});

describe("the operator's home", () => {
  it("loads, then shows the name, the Server badge, the counts and the schools with their codes and invite warnings", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<OperatorHome />, "ADMIN", { ...answers(), "GET /api/v1/operator/overview": gate.answer }, { me: OPERATOR });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    await screen.findByText("ZZ Northgate");
    expect(screen.getByText("ZZ Operator")).toBeTruthy();
    expect(screen.getByText("Server")).toBeTruthy();
    expect(screen.getByLabelText("Live: 2")).toBeTruthy();
    expect(screen.getByLabelText("Admin invite pending: 1")).toBeTruthy();
    expect(screen.getByLabelText("Content team: 3")).toBeTruthy();
    expect(screen.getByLabelText("Waiting for you: 1")).toBeTruthy();
    expect(screen.getByText(/Pune, India · Join code NORTH-7X9K · joined 3 days ago/)).toBeTruthy();
    expect(screen.getByText(/No address · Join code RIVER-1A2B · joined 2 hours ago/)).toBeTruthy();
    expect(screen.getByText("1 invite pending")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/operator/overview")).toBe(true);
  });

  it("a school opens on the web; the state chips and the search ask the API", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<OperatorHome />, "ADMIN", answers(), { me: OPERATOR });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Northgate,/ }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/s1`);
    await fireEvent.press(screen.getByRole("radio", { name: "Removed" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?state=removed")).toBe(true));
    fireEvent.changeText(screen.getByLabelText("Search"), "river");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?q=river&state=removed")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Server administration" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root`);
    open.mockRestore();
  });

  it("jobs: the three tiles, a pill per job, the error in its note", async () => {
    await mountStaff(<OperatorHome />, "ADMIN", answers(), { me: OPERATOR });
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

  it("experts and the log each fetch when their chip is pressed, and open the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<OperatorHome />, "ADMIN", answers(), { me: OPERATOR });
    await screen.findByText("ZZ Northgate");
    expect(calls().some((c) => c.line === "GET /api/v1/operator/experts")).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "Experts" }));
    expect(await screen.findByText("ZZ Mentor")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/operator/experts")).toBe(true);
    expect(screen.getByText("1 waiting · 1 listed")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText("On the marketplace")).toBeTruthy();
    expect(screen.getByText("Robotics coach · ZZ Labs · Robotics, Physics")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Mentor,/ }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/experts`);
    await fireEvent.press(screen.getByRole("radio", { name: "Server log" }));
    expect(await screen.findByText("superuser.school.create")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/operator/audit")).toBe(true);
    expect(screen.getByText(/^ZZ Operator · ZZ Northgate · /)).toBeTruthy();
    expect(screen.getByText(/^System · head@zz.test · ADMIN · /)).toBeTruthy();
    open.mockRestore();
  });

  it("no schools: the door is the web's new-school form; a narrowed search clears itself", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<OperatorHome />, "ADMIN", answers({ ...OVERVIEW, schools: [] }), { me: OPERATOR });
    expect(await screen.findByText("No schools yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add a school" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/new`);
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Live" })).toBeChecked());
    expect(calls().some((c) => c.line === "GET /api/v1/operator/overview?state=all")).toBe(true);
    open.mockRestore();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<OperatorHome />, "ADMIN", { ...answers(), "GET /api/v1/operator/overview": refused("Not now.") }, { me: OPERATOR });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/operator/overview")).length).toBe(2));
  });
});
