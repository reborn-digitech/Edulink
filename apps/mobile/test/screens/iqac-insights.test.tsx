import { fireEvent, screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { IqacHome } from "@/screens/iqac/home";
import { InsightsScreen } from "@/screens/iqac/insights";
import { ScenariosScreen } from "@/screens/iqac/scenarios";
import { CollegeGlanceScreen } from "@/screens/college/glance";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff, refused } from "./staff-harness";

/**
 * Accreditation insights on the phone (5 Oct 2026): the next band's target with
 * its cheapest steps, the ranked metrics, the qualitative ones to score with
 * evidence, what the desk did last, each call to action opening the web page
 * where the change is made; the simulator's saved scenarios, read-only; and the
 * head's college card line. Every sentence in a response is the server's.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role, institutionKind: "COLLEGE" }], modules, institutionKind: "COLLEGE" });
const CYCLE = { id: "c1", framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2021-06-01", windowTo: "2026-05-31", status: "OPEN", cgpa: 1.42, grade: "D", computedAt: "2026-10-05T04:00:00.000Z", metricCount: 63, scoredCount: 43 };
const cta = (code: string, href: string, label: string) => ({ code, href, roles: ["IQAC"], label });
const SURVEYS = cta("SURVEYS", "/iqac/surveys", "Surveys, the IQAC");
const RECORDS = cta("FACULTY_RECORDS", "/admin/faculty-records", "Faculty records, the office");
const NOTE = "Shalaghar does not score for NAAC, NBA or NIRF; this is your own record read against the platform's benchmarks.";
const metric = (code: string, over: Record<string, unknown> = {}) => ({
  code, ki: "2.4", criterion: "2", kind: "QN", text: "Metric text", weight: 20, value: 10, score: 1.6, scored: true, lever: "phdNetTeachers", leverLabel: "Teachers with a PhD or NET/SET", leverValue: 4, unit: "teacher",
  nextStep: { units: 2, delta: 2, toValue: 20, toScore: 2, points: 0.008 }, toTop: null, pointsPerUnit: 0.004, sentence: `Sentence for ${code}.`, missing: [], cta: RECORDS, ...over,
});
const INSIGHTS = {
  cycle: CYCLE, scenarioId: null, scenarioName: null, cgpa: 1.42, grade: "D",
  paths: [
    { grade: "C", min: 1.51, distance: 0.09, points: 0.0931, reachable: true, sentence: "From D to C: 0.09 CGPA; the cheapest 2 steps give it.", steps: [{ code: "2.7.1", delta: 3, unit: "tenth", points: 0.05, sentence: "Raise 2.7.1 by 3 tenths.", cta: SURVEYS }, { code: "2.4.2", delta: 2, unit: "teacher", points: 0.0431, sentence: "Two more teachers with a PhD move 2.4.2.", cta: RECORDS }] },
    { grade: "B", min: 2.01, distance: 0.59, points: 0.4, reachable: false, sentence: "From D to B: 0.59 CGPA; the cheapest steps give 0.40.", steps: [{ code: "3.4.2", delta: 4, unit: "mou", points: 0.4, sentence: "Four more MoUs move 3.4.2.", cta: cta("COMMITTEES", "/admin/committees", "Committees, the office") }] },
  ],
  ranked: [metric("2.4.2"), metric("3.4.2", { sentence: "Four more MoUs move 3.4.2.", cta: cta("COMMITTEES", "/admin/committees", "Committees, the office") })],
  qualitative: [metric("7.2.1", { kind: "QL", scored: false, score: 0, sentence: "Score 7.2.1 with evidence.", cta: cta("QUALITATIVE", "/iqac/predictor", "The predictor, the IQAC") })],
  lastDone: [{ action: "iqac.research.add", label: "A research paper was added", at: "2026-10-04T09:00:00.000Z", by: "ZZ Vidya IQAC", cta: "RESEARCH", sinceCompute: true }],
  computedAt: "2026-10-05T04:00:00.000Z", notAScore: NOTE,
};
const openUrl = () => {
  const { Linking } = jest.requireActual<typeof import("react-native")>("react-native");
  return jest.spyOn(Linking, "openURL").mockResolvedValue(true);
};
beforeEach(() => mockRouter.push.mockClear());

describe("actionable insights on the phone", () => {
  it("shows the CGPA, the paths to the next bands, the ranked metrics and the qualitative ones, never as a promise", async () => {
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json(INSIGHTS) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("Predicted CGPA 1.42, band D.")).toBeTruthy();
    expect(screen.getByText(NOTE)).toBeTruthy();
    expect(screen.getByText("Towards C")).toBeTruthy();
    expect(screen.getByText("From D to C: 0.09 CGPA; the cheapest 2 steps give it.")).toBeTruthy();
    expect(screen.getByText("Two more teachers with a PhD move 2.4.2.")).toBeTruthy();
    // The band the cheapest steps do not reach says so.
    expect(screen.getByText("These steps alone do not reach B; the list below goes further.")).toBeTruthy();
    expect(screen.getByText("Metrics, cheapest first")).toBeTruthy();
    expect(screen.getByText("Sentence for 2.4.2.")).toBeTruthy();
    expect(screen.getByText("Score these with evidence")).toBeTruthy();
    expect(screen.getByText("Score 7.2.1 with evidence.")).toBeTruthy();
    expect(screen.getByText("A research paper was added")).toBeTruthy();
    expect(screen.getByText(/A recompute will show it\./)).toBeTruthy();
  });

  it("opens the web page of a step's call to action", async () => {
    const open = openUrl();
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json(INSIGHTS) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    await fireEvent.press(await screen.findByRole("button", { name: /Raise 2\.7\.1 by 3 tenths\./ }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/iqac\/surveys$/));
    await fireEvent.press(screen.getByRole("button", { name: /Score 7\.2\.1 with evidence\./ }));
    expect(open).toHaveBeenLastCalledWith(expect.stringMatching(/\/iqac\/predictor$/));
    await fireEvent.press(screen.getByRole("button", { name: /Try figures in the simulator/ }));
    expect(open).toHaveBeenLastCalledWith(expect.stringMatching(/\/iqac\/simulator$/));
    await fireEvent.press(screen.getByRole("button", { name: "Saved scenarios" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/iqac-scenarios");
    open.mockRestore();
  });

  it("names a scenario when the insights are its gap, and says so at the top band", async () => {
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json({ ...INSIGHTS, scenarioId: "sc1", scenarioName: "ZZ More PhDs", cgpa: 3.6, grade: "A++", paths: [], ranked: [], qualitative: [], lastDone: [] }) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("Scenario ZZ More PhDs: CGPA 3.60, band A++.")).toBeTruthy();
    expect(screen.getByText("The college is at the top band; there is nothing left to raise.")).toBeTruthy();
    expect(screen.queryByText("Metrics, cheapest first")).toBeNull();
  });

  it("says no cycle is open on a 404 and sends the IQAC to the predictor on the web", async () => {
    const open = openUrl();
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json({ error: "No cycle.", code: "NOT_FOUND" }, 404) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("No NAAC cycle yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open on the web" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/iqac\/predictor$/));
    open.mockRestore();
  });

  it("says another role's step as 'Ask: page — who' with no link, and opens the IQAC's own (A3-journeys-23)", async () => {
    const open = openUrl();
    const EXAMS = { code: "EXAMS", href: "/exam-cell", roles: ["EXAM_CONTROLLER"], label: "Exam cell and results — Exam controller" };
    const own = { ...SURVEYS, label: "Surveys — IQAC coordinator" };
    const d = { ...INSIGHTS, paths: [{ ...INSIGHTS.paths[0], steps: [{ code: "2.6.3", delta: 2, unit: "pct", points: 0.02, sentence: "Raise the pass percentage of 2.6.3.", cta: EXAMS }, { code: "2.7.1", delta: 3, unit: "tenth", points: 0.05, sentence: "Raise 2.7.1 by 3 tenths.", cta: own }] }], ranked: [], qualitative: [] };
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json(d) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("Raise the pass percentage of 2.6.3.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Raise the pass percentage of 2\.6\.3\./ })).toBeNull();
    expect(screen.getByText(/^Ask: Exam cell and results — Exam controller/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Raise 2\.7\.1 by 3 tenths\..*Surveys — IQAC coordinator.*Open on the web/ }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/iqac\/surveys$/));
    expect(open).not.toHaveBeenCalledWith(expect.stringMatching(/\/exam-cell$/));
    open.mockRestore();
  });

  it("says the who, the page and what was done in the phone's own words, from the codes, not the server's sentence (A3-states-16)", async () => {
    const d = {
      ...INSIGHTS,
      paths: [{ ...INSIGHTS.paths[0], steps: [{ code: "2.4.2", delta: 2, unit: "teacher", points: 0.0431, sentence: "Two more teachers with a PhD move 2.4.2.", cta: { code: "FACULTY_RECORDS", href: "/admin/faculty-records", roles: ["ADMIN"], label: "ACCOUNT-LANGUAGE LABEL" } }] }],
      ranked: [],
      qualitative: [],
      lastDone: [{ action: "iqac.metric.score", label: "ACCOUNT-LANGUAGE ACTION", labelKey: "audit.iqacMetricScore", at: "2026-10-04T09:00:00.000Z", by: "ZZ Vidya IQAC", cta: "QUALITATIVE", sinceCompute: false }],
    };
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": () => json(d) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText(/^Ask: Faculty records — College office/)).toBeTruthy();
    expect(screen.getByText("Scored a qualitative NAAC metric")).toBeTruthy();
    expect(screen.queryByText(/ACCOUNT-LANGUAGE/)).toBeNull();
  });

  it("shows any other refusal as it is said, with a retry", async () => {
    await mountStaff(<InsightsScreen />, "IQAC", { "GET /api/v1/iqac/insights": refused("Something went wrong") }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("the saved scenarios on the phone", () => {
  const scenario = (id: string, name: string, result: number, delta: number, grade: string) => ({ id, kind: "NAAC", name, cycleId: "c1", year: null, departmentId: null, by: "ZZ Vidya IQAC", at: "2026-10-05T05:00:00.000Z", result, savedResult: result, grade, today: 1.42, delta, canRemove: true });
  const mount = (items: unknown[]) => mountStaff(<ScenariosScreen />, "IQAC", { "GET /api/v1/iqac/scenarios": () => json({ items, canWrite: true }) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });

  it("lists each with its CGPA, band and signed difference from today, and asks for NAAC's only", async () => {
    const { calls } = await mount([scenario("s1", "ZZ More PhDs", 1.58, 0.16, "C"), scenario("s2", "ZZ Fewer teachers", 1.3, -0.12, "D"), scenario("s3", "ZZ Unchanged", 1.42, 0, "D")]);
    expect(await screen.findByText("ZZ More PhDs")).toBeTruthy();
    expect(screen.getByText("Today: CGPA 1.42")).toBeTruthy();
    expect(screen.getByText("1.58 · C")).toBeTruthy();
    expect(screen.getByText(/ZZ Vidya IQAC · 05\/10\/2026 · \+0\.16 against today/)).toBeTruthy();
    expect(screen.getByText(/-0\.12 against today/)).toBeTruthy();
    expect(screen.getByText(/Same as today/)).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/iqac/scenarios?kind=NAAC")).toBe(true);
  });

  it("says none is saved and points at the simulator on the web", async () => {
    const open = openUrl();
    await mount([]);
    expect(await screen.findByText("No scenario saved")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try figures in the simulator" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/iqac\/simulator$/));
    open.mockRestore();
  });

  it("says no cycle is open on a 404, and shows another refusal as it is said", async () => {
    await mountStaff(<ScenariosScreen />, "IQAC", { "GET /api/v1/iqac/scenarios": () => json({ error: "No cycle.", code: "NOT_FOUND" }, 404) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("No NAAC cycle is open, so there is no scenario to read.")).toBeTruthy();
  });

  it("a server fault is an alert", async () => {
    await mountStaff(<ScenariosScreen />, "IQAC", { "GET /api/v1/iqac/scenarios": refused("Something went wrong") }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });
});

describe("the entries to the screens", () => {
  const OVERVIEW = {
    cycle: CYCLE, nextBand: { grade: "C", min: 1.51, distance: 0.09 }, cheapest: [],
    counts: { research: 0, activities: 0, committees: 0, openSurveys: 0, openGrievances: 0, overdueGrievances: 0, filings: 0, awaitingSignoff: 0 }, calendar: [], nirf: { partial: 0, coveredMarks: 0, parameters: [] }, disclosurePublishedAt: null,
  };

  it("the IQAC home names the insights once, and the regulators' dates in the phone's words (A3-states-16)", async () => {
    const calendar = [{ code: "AISHE", label: "ACCOUNT-LANGUAGE AISHE", from: "2026-10-01", to: "2027-01-31", filing: "AISHE", filedThisYear: false }, { code: "AFFILIATION", label: "ACCOUNT-LANGUAGE AFFILIATION", from: "2026-11-01", to: "2026-12-31", filing: "AFFILIATION_RETURN", filedThisYear: true }];
    await mountStaff(<IqacHome />, "IQAC", { "GET /api/v1/iqac/overview": () => json({ ...OVERVIEW, calendar, cheapest: [{ code: "1.3.2", text: "ZZ metric", gainPerUnit: 0.004, unit: "mou" }] }) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("AISHE data capture")).toBeTruthy();
    expect(screen.getByText(/MoU/)).toBeTruthy();
    expect(screen.getByText("University affiliation return")).toBeTruthy();
    expect(screen.queryByText(/ACCOUNT-LANGUAGE/)).toBeNull();
    expect(screen.getAllByText("Actionable insights")).toHaveLength(1);
  });

  it("the IQAC home opens the insights and the scenarios", async () => {
    await mountStaff(<IqacHome />, "IQAC", { "GET /api/v1/iqac/overview": () => json(OVERVIEW) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "Actionable insights" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/iqac-insights");
    await fireEvent.press(screen.getByRole("button", { name: "Saved scenarios" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/iqac-scenarios");
  });

  it("More lists them for the IQAC and the head only while IQAC is on", () => {
    const shown = (role: RoleCode, modules: string[]) => menuFor(role, modules).flatMap((g) => g.items).map((i) => i.screen);
    expect(shown("IQAC", ["IQAC"])).toEqual(expect.arrayContaining(["/(app)/iqac-insights", "/(app)/iqac-scenarios"]));
    expect(shown("IQAC", [])).not.toContain("/(app)/iqac-insights");
    expect(shown("PRINCIPAL", ["IQAC"])).toContain("/(app)/iqac-insights");
    expect(shown("PRINCIPAL", [])).not.toContain("/(app)/iqac-insights");
  });
});

describe("the insights line on the head's college card", () => {
  const GLANCE = {
    school: { name: "ZZ Vidya College", affiliatingUniversity: "ZZ University" }, today: "2026-10-05", term: null, faculty: null, fees: null, scholarships: null, hostel: null, grievances: null, incidentsOpen: null, lectures: [], approvals: [],
    predictor: { cgpa: 1.42, grade: "D", nextGrade: "C", distance: 0.09 },
  };
  const mount = (insights: Parameters<typeof json>[0] | null, status = 200, predictor: unknown = GLANCE.predictor) =>
    mountStaff(<CollegeGlanceScreen />, "PRINCIPAL", { "GET /api/v1/principal/college": () => json({ ...GLANCE, predictor }), "GET /api/v1/iqac/insights": () => json(insights ?? { error: "No cycle.", code: "NOT_FOUND" }, status) }, { me: atCollege("PRINCIPAL", ["ACADEMICS", "IQAC"]) });

  it("says the distance to the next band and how many steps reach it, and opens the screen", async () => {
    await mount(INSIGHTS);
    expect(await screen.findByText("To C: 0.09 CGPA, 2 steps.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Insights, To C/ }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/iqac-insights");
  });

  it("says when the cheapest steps do not reach it, and when the college is at the top", async () => {
    await mount({ ...INSIGHTS, paths: [INSIGHTS.paths[1]] });
    expect(await screen.findByText("To B: 0.59 CGPA, more than the cheapest steps give.")).toBeTruthy();
  });

  it("says the top band reads as such", async () => {
    await mount({ ...INSIGHTS, paths: [] });
    expect(await screen.findByText("At the top band; nothing left to raise.")).toBeTruthy();
  });

  it("draws nothing without an open cycle", async () => {
    const { calls } = await mount(null, 404);
    expect(await screen.findByText("NAAC predictor: 0.09 short of C")).toBeTruthy();
    expect(screen.queryByText(/^Insights/)).toBeNull();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/iqac/insights"))).toBe(true);
  });

  it("asks for nothing where the predictor is off", async () => {
    const { calls } = await mount(INSIGHTS, 200, null);
    expect(await screen.findByText("ZZ Vidya College · ZZ University · No term running")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/iqac/insights"))).toBe(false);
  });
});
