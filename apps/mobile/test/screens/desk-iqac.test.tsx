import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { GrievancesDeskScreen } from "@/screens/iqac/grievances";
import { SurveysDeskScreen } from "@/screens/iqac/surveys";
import { FilingsDeskScreen } from "@/screens/iqac/filings";
import { ResearchRegisterScreen } from "@/screens/iqac/research";
import { PredictorScreen } from "@/screens/iqac/predictor";
import { FacultyRecordsScreen } from "@/screens/iqac/faculty-records";
import { FacultyProfileScreen } from "@/screens/iqac/faculty-profile";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[] = ["ACADEMICS", "IQAC"]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const iso = "2026-10-04T05:00:00.000Z";
const grievance = (id: string, over: Record<string, unknown> = {}) => ({ id, kind: "EXAMINATION", text: "ZZ my marks were added wrong", by: "ZZ Riya", status: "OPEN", filedAt: iso, dueOn: "2026-10-25", overdue: false, response: "", ombudspersonNote: "", committee: "GRIEVANCE", fileId: null, ...over });
const desk = (canAct: boolean, items = [grievance("g1"), grievance("g2", { status: "RESOLVED", response: "ZZ retotalled" })]) => ({ items, summary: { month: "2026-10", filed: 2, resolved: 1, withinLimit: 1, overdue: 0, escalated: 0, open: 1 }, canAct });

describe("the grievance line on the phone (the parity batch, 10 Oct 2026)", () => {
  it("the IQAC reads the month and each grievance, with no act", async () => {
    await mountStaff(<GrievancesDeskScreen />, "IQAC", { "GET /api/v1/iqac/grievances": () => json(desk(false)) }, { me: atCollege("IQAC") });
    expect(await screen.findByText("Month 2026-10")).toBeTruthy();
    expect(screen.getByText("Open (1)")).toBeTruthy();
    expect(screen.getByText("Resolved (1)")).toBeTruthy();
    expect(screen.getByText("The office and the principal act on a grievance; the desk reads and counts.")).toBeTruthy();
    expect(screen.getByText("The committee's response: ZZ retotalled")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Resolve/ })).toBeNull();
  });

  it("the office resolves one with a note", async () => {
    const { calls } = await mountStaff(<GrievancesDeskScreen />, "ADMIN", { "GET /api/v1/iqac/grievances": () => json(desk(true)), "POST /api/v1/iqac/grievances/g1": () => json({ ok: true }) }, { me: atCollege("ADMIN") });
    await fireEvent.press(await screen.findByRole("button", { name: "Resolve: Examinations or marks" }));
    await fireEvent.changeText(screen.getByLabelText("What the evidence shows"), "ZZ retotalled, two marks added");
    await fireEvent.press(screen.getByRole("button", { name: "Resolve" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/iqac/grievances/g1")?.body).toEqual({ action: "RESOLVE", note: "ZZ retotalled, two marks added" }));
    expect(await screen.findByText("Done, and the student is told.")).toBeTruthy();
  });
});

const survey = (id: string, over: Record<string, unknown> = {}) => ({ id, kind: "SSS", title: `ZZ Survey ${id}`, opensOn: "2026-10-01", closesOn: "2026-10-31", offeringId: null, status: "OPEN", responses: 12, anonymous: true, atrPublishedAt: null, ...over });

describe("the surveys on the phone", () => {
  it("opens a survey's aggregates and closes it after one ask", async () => {
    const { calls } = await mountStaff(<SurveysDeskScreen />, "IQAC", {
      "GET /api/v1/iqac/surveys": () => json({ items: [survey("s1"), survey("s2", { status: "CLOSED", responses: 3 })], canEdit: true }),
      "GET /api/v1/iqac/surveys/s1": () => json({ survey: survey("s1"), questions: [{ code: "Q01", label: "ZZ The syllabus was covered", mean: 3.2, counts: [5, 4, 2, 1, 0] }], overall: 3.2, suppressed: false, atr: null }),
      "POST /api/v1/iqac/surveys/s1/close": () => json({ ok: true }),
    }, { me: atCollege("IQAC") });
    expect(await screen.findByText("Open or upcoming (1)")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Survey s1"));
    expect(await screen.findByText("Overall 3.20 of 4")).toBeTruthy();
    expect(screen.getByText("ZZ The syllabus was covered")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Close now: ZZ Survey s1" }));
    expect(screen.getByText(/Close "ZZ Survey s1" now\?/)).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Close now" })[0]!);
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/iqac/surveys/s1/close")).toBe(true));
    expect(await screen.findByText(/Closed\. Nobody can answer it now/)).toBeTruthy();
  });
});

const filing = (id: string, over: Record<string, unknown> = {}) => ({ id, kind: "AQAR", year: 2025, format: "PDF", generatedAt: iso, hash: "abcdef0123456789", status: "AWAITING_SIGNOFF", checked: true, principalNote: "", signedOffAt: null, figures: { students: 420 }, departmentId: null, ...over });

describe("the filings on the phone", () => {
  it("shows each filing's state and the principal signs one off", async () => {
    const { calls } = await mountStaff(<FilingsDeskScreen />, "PRINCIPAL", {
      "GET /api/v1/iqac/filings": () => json({ items: [filing("f1"), filing("f2", { kind: "NIRF", status: "FILED", format: "CSV" })], canGenerate: false, canSignOff: true }),
      "POST /api/v1/iqac/filings/f1/signoff": () => json({ ok: true }),
    }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText("AQAR (yearly, September) · 2025-26")).toBeTruthy();
    expect(screen.getByText("With the principal")).toBeTruthy();
    expect(screen.getByText("Filed")).toBeTruthy();
    expect(screen.getAllByText("420").length).toBe(2);
    await fireEvent.press(screen.getByRole("button", { name: "Sign off: AQAR (yearly, September) 2025-26" }));
    await fireEvent.press(screen.getByRole("button", { name: "Sign off" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/iqac/filings/f1/signoff")?.body).toEqual({ decision: "SIGN", note: "" }));
    expect(await screen.findByText("Signed off.")).toBeTruthy();
  });

  it("gives the IQAC the cards and no sign-off", async () => {
    await mountStaff(<FilingsDeskScreen />, "IQAC", { "GET /api/v1/iqac/filings": () => json({ items: [filing("f1")], canGenerate: true, canSignOff: false }) }, { me: atCollege("IQAC") });
    expect(await screen.findByText("With the principal")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Sign off/ })).toBeNull();
  });
});

const item = (id: string, over: Record<string, unknown> = {}) => ({ id, kind: "PUBLICATION", title: `ZZ Paper ${id}`, indexing: "SCOPUS", year: 2026, amountLakhs: null, facultyMembershipId: "m1", facultyName: "ZZ Head", departmentId: null, fileId: null, mine: true, ...over });

describe("the research register on the phone", () => {
  it("a teacher adds an item of their own and removes one after one ask", async () => {
    const { calls } = await mountStaff(<ResearchRegisterScreen />, "FACULTY", {
      "GET /api/v1/iqac/research": () => json({ items: [item("r1")], perTeacher: { teachers: 1, publications: 1, books: 0 }, scope: "MINE" }),
      "POST /api/v1/iqac/research": () => json(item("r2", { title: "ZZ New paper" })),
      "POST /api/v1/iqac/research/r1/remove": () => json({ ok: true }),
    }, { me: atCollege("FACULTY") });
    expect(await screen.findByText("ZZ Paper r1")).toBeTruthy();
    expect(screen.getByText("My research")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add to the register" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ New paper");
    await fireEvent.press(screen.getByRole("radio", { name: "Scopus" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Add to the register" })[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/iqac/research")?.body).toMatchObject({ kind: "PUBLICATION", title: "ZZ New paper", indexing: "SCOPUS", facultyMembershipId: null }));
    expect(await screen.findByText("Added to the register.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Remove: ZZ Paper r1" }));
    await fireEvent.press(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/iqac/research/r1/remove")).toBe(true));
  });

  it("the desk reads the college's register with the per-teacher line and the activities", async () => {
    await mountStaff(<ResearchRegisterScreen />, "IQAC", {
      "GET /api/v1/iqac/research": () => json({ items: [item("r1", { mine: false })], perTeacher: { teachers: 12, publications: 1.25, books: 0.5 }, scope: "COLLEGE" }),
      "GET /api/v1/iqac/activities": () => json({ items: [{ id: "a1", kind: "WORKSHOP", title: "ZZ Research ethics", at: "2026-09-20", participants: 60, staffParticipants: 4, theme: null, departmentId: null, fileId: null }], canEdit: true }),
    }, { me: atCollege("IQAC") });
    expect(await screen.findByText(/12 teachers · 1.25 publications and 0.50 books/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to the register" })).toBeNull();
    expect(await screen.findByText("ZZ Research ethics")).toBeTruthy();
  });
});

describe("the predictor, the faculty records and a teacher's public page on the phone", () => {
  it("the predictor shows the open cycle's criteria and opens one to its key indicators", async () => {
    const metric = { code: "1.1.1", ki: "1.1", kind: "QN", weight: 10, text: "ZZ metric", formula: null, window: "FIVE_YEARS", value: 3, score: 3, provisional: false, why: "", inputs: [], evidence: [], files: [], note: "", computedAt: iso, gainPerUnit: 0.01, unit: "course" };
    const cycle = { id: "cy1", framework: "AFFILIATED_UG", institutionType: "AFFILIATED_UG", windowFrom: "2021-06-01", windowTo: "2026-05-31", status: "OPEN", cgpa: 2.84, grade: "B+", computedAt: iso, metricCount: 90, scoredCount: 60 };
    await mountStaff(<PredictorScreen />, "IQAC", {
      "GET /api/v1/iqac/cycles": () => json({ items: [cycle], canEdit: true }),
      "GET /api/v1/iqac/cycles/cy1": () => json({ cycle, criteria: [{ code: "1", name: "ZZ Curricular aspects", weight: 100, score: 3.1, kis: [{ code: "1.1", name: "ZZ Curriculum planning", weight: 20, score: 3, metrics: [metric] }] }], nextBand: { grade: "A", min: 3.01, distance: 0.17 }, cheapest: [{ code: "1.1.1", text: "ZZ metric", gainPerUnit: 0.01, unit: "course" }], trend: [{ term: "ZZ Odd 2025", cgpa: 2.7, computedAt: iso }, { term: "ZZ Even 2026", cgpa: 2.84, computedAt: iso }], entered: [], canEdit: true }),
    }, { me: atCollege("IQAC") });
    expect((await screen.findAllByText("2.84")).length).toBe(2);
    expect(screen.getByText("0.17 below A, which starts at 3.01.")).toBeTruthy();
    await fireEvent.press(screen.getByText("1 ZZ Curricular aspects"));
    expect(await screen.findByText("1.1 ZZ Curriculum planning")).toBeTruthy();
    expect(screen.getByText("ZZ Even 2026")).toBeTruthy();
  });

  it("the faculty records read without a PAN, and search by name", async () => {
    const record = (id: string, name: string, complete = true) => ({ membershipId: id, name, role: "FACULTY", designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", netSetQualified: true, experienceYears: 8, joinedOn: "2018-07-01", departmentId: null, apaarFacultyId: null, panLast4: "1234", apiScore: 310, experienceBeforeYears: 2, apiScoreInputs: { teaching: 100, research: 110, service: 100 }, fdps: 3, publications: 7, complete });
    await mountStaff(<FacultyRecordsScreen />, "IQAC", { "GET /api/v1/iqac/faculty-records": () => json({ items: [record("m1", "ZZ Dr Anita"), record("m2", "ZZ Dr Bhushan", false)], canEdit: false, ratio: { students: 420, fullTime: 21 } }) }, { me: atCollege("IQAC") });
    expect(await screen.findByText("420 students to 21 full-time teachers")).toBeTruthy();
    expect(screen.getAllByText(/Assistant professor · Regular · Ph.D. · NET\/SET · 8 years · API 310 · 7 publications · 3 FDPs/).length).toBe(2);
    expect(screen.queryByText(/1234/)).toBeNull();
    expect(screen.getByText("Incomplete")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search"), "bhushan");
    expect(screen.queryByText("ZZ Dr Anita")).toBeNull();
  });

  it("a teacher puts their page up, and takes it down after one ask", async () => {
    const preview = { name: "ZZ Dr Anita", collegeName: "ZZ Vidya College", departmentName: "ZZ Physics", designation: "ASSISTANT_PROFESSOR", qualification: "PHD", netSetQualified: true, experienceYears: 8, research: [{ kind: "PUBLICATION", title: "ZZ Paper", year: 2026, indexing: "SCOPUS" }] };
    let up = false;
    const { calls } = await mountStaff(<FacultyProfileScreen />, "FACULTY", {
      "GET /api/v1/faculty/profile": () => json({ hasRecord: true, publishedAt: up ? iso : null, preview, url: up ? "https://zz.example/public/faculty/zz-vidya" : null }),
      "POST /api/v1/faculty/profile": ({ init }) => {
        up = (JSON.parse(String(init.body)) as { publish: boolean }).publish;
        return json({ hasRecord: true, publishedAt: up ? iso : null, preview, url: up ? "https://zz.example/public/faculty/zz-vidya" : null });
      },
    }, { me: atCollege("FACULTY") });
    expect(await screen.findByText("Not up")).toBeTruthy();
    expect(screen.getByText(/Assistant professor · Ph.D. · NET\/SET · 8 years/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Put it up" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/faculty/profile")?.body).toEqual({ publish: true }));
    expect(await screen.findByText("Your page is up, from today's rows.")).toBeTruthy();
    expect(await screen.findByText("Up")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Take it down" }));
    expect(screen.getByText(/Take your page down\?/)).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Take it down" })[0]!);
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/faculty/profile").length).toBe(2));
    expect(await screen.findByText("Your page is down.")).toBeTruthy();
  });
});
