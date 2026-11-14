import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { TpoDrivesScreen } from "@/screens/placement/tpo-drives";
import { TpoDriveScreen } from "@/screens/placement/tpo-drive";
import { TpoStudentsScreen } from "@/screens/placement/tpo-students";
import { TpoCompaniesScreen, identifierCheck } from "@/screens/placement/tpo-companies";
import { PlacementTableScreen } from "@/screens/placement/analytics";
import { SupervisionScreen } from "@/screens/placement/supervision";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[] = ["ACADEMICS", "PLACEMENT", "IQAC"]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const iso = "2026-10-04T05:00:00.000Z";
const summary = (id: string, over: Record<string, unknown> = {}) => ({ id, title: `ZZ Analyst ${id}`, companyId: "c1", companyName: "ZZ Zeta Analytics", companyVerified: true, kind: "ON_CAMPUS", status: "OPEN", packageMinRupees: 600_000, packageMaxRupees: 700_000, hostName: "ZZ Vidya College", hosted: true, nextAt: null, applicants: 1, offers: 0, createdAt: iso, ...over });
const view = (id: string, over: Record<string, unknown> = {}) => ({ ...summary(id), jd: "", bond: "", rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }], schedule: [], venues: "", rule: { cgpaMin: null, noLiveBacklogs: false, programmeIds: [], batchYear: null, genders: [] }, requirementId: null, poolSchools: [], eligibleCount: 3, invitedAt: null, closedAt: null, applications: [], recruiterRating: null, recruiterFeedback: null, canEdit: true, ...over });

describe("the TPO's drives on the phone (the parity batch, 10 Oct 2026)", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = {};
  });

  it("lists the live drives first and the closed ones after, and opens one", async () => {
    await mountStaff(<TpoDrivesScreen />, "TPO", { "GET /api/v1/placement/drives": () => json({ drives: [summary("d1"), summary("d2", { status: "CLOSED", hosted: false, hostName: "ZZ Shastri College" })], canEdit: true }) }, { me: atCollege("TPO") });
    expect(await screen.findByText("Live (1)")).toBeTruthy();
    expect(screen.getByText("Closed (1)")).toBeTruthy();
    expect(screen.getByText(/guest of ZZ Shastri College/)).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Analyst d1"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/placement-drive", params: { driveId: "d1" } });
  });

  it("says placement is off where the college has not switched it on", async () => {
    await mountStaff(<TpoDrivesScreen />, "TPO", {}, { me: atCollege("TPO", ["ACADEMICS"]) });
    expect(await screen.findByText("Placement is not switched on")).toBeTruthy();
  });

  it("moves a hosted drive on after one ask, with the next status alone in the body", async () => {
    mockRouter.params = { driveId: "d1" };
    const { calls } = await mountStaff(<TpoDriveScreen />, "TPO", {
      "GET /api/v1/placement/drives/d1": () => json(view("d1")),
      "POST /api/v1/placement/drives/d1": () => json(view("d1", { status: "SHORTLISTING" })),
    }, { me: atCollege("TPO") });
    await fireEvent.press(await screen.findByRole("button", { name: "Move to: Shortlisting" }));
    expect(screen.getByText("Move this drive to \"Shortlisting\"? It cannot go back.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Move to: Shortlisting" })[0]!);
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/drives/d1")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/drives/d1")?.body).toEqual({ status: "SHORTLISTING" });
    expect(await screen.findByText("The drive is now: Shortlisting.")).toBeTruthy();
  });

  it("offers no step on a drive the college only guests", async () => {
    mockRouter.params = { driveId: "d2" };
    await mountStaff(<TpoDriveScreen />, "TPO", { "GET /api/v1/placement/drives/d2": () => json(view("d2", { hosted: false, canEdit: false })) }, { me: atCollege("TPO") });
    expect(await screen.findByText("Students who qualify at the college: 3.")).toBeTruthy();
    expect(screen.queryByText("Move the drive on")).toBeNull();
  });
});

const student = (id: string, over: Record<string, unknown> = {}) => ({ studentMembershipId: id, name: `ZZ Student ${id}`, record: { cgpa: 7.5, liveBacklogs: 0, attendancePct: 85, programmeId: "p1", programmeName: "ZZ BSc Physics", batchYear: 2027, gender: null, category: null }, optedOut: false, dreamFlag: false, higherStudies: false, entrepreneur: false, consentAt: iso, offers: 1, acceptedRupees: 650_000, softSkillsCompleted: 0, ...over });

describe("the placement roll on the phone", () => {
  it("shows each student's record and choices, narrows by name, and grants the dream flag through the idempotent door", async () => {
    const { calls } = await mountStaff(<TpoStudentsScreen />, "TPO", {
      "GET /api/v1/placement/students": () => json({ students: [student("m1"), student("m2", { name: "ZZ Riya Nair", optedOut: true, offers: 0, acceptedRupees: null, consentAt: null })], canEdit: true }),
      "POST /api/v1/placement/students/m1/dream": () => json({ changed: true }),
    }, { me: atCollege("TPO") });
    expect(await screen.findByText("2 of 2 students")).toBeTruthy();
    expect(screen.getByText(/accepted ₹6.5 lakh a year/)).toBeTruthy();
    expect(screen.getByText(/Opted out · Not consented yet|Not consented yet · Opted out/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Grant the dream flag: ZZ Student m1" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/placement/students/m1/dream")?.body).toEqual({ on: true }));
    expect(await screen.findByText("The dream flag is granted.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search"), "riya");
    expect(screen.getByText("1 of 2 students")).toBeTruthy();
    expect(screen.queryByText("ZZ Student m1")).toBeNull();
  });
});

describe("the companies on the phone", () => {
  it("says what the format check makes of each identifier, and marks one checked", async () => {
    expect(identifierCheck("27AAPFU0939F1ZV")).toEqual({ key: "deskParity.identifierGstin", ok: true });
    expect(identifierCheck("U72200MH2015PTC123456")).toEqual({ key: "deskParity.identifierCin", ok: true });
    expect(identifierCheck("NOT-A-NUMBER")).toEqual({ key: "deskParity.identifierBad", ok: false });
    const company = (id: string, over: Record<string, unknown> = {}) => ({ id, name: `ZZ Company ${id}`, identifier: "27AAPFU0939F1ZV", sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ", verifiedAt: null, recruiters: 1, firstVisitYear: 2024, drives: 2, ...over });
    const { calls } = await mountStaff(<TpoCompaniesScreen />, "TPO", {
      "GET /api/v1/placement/companies": () => json({ companies: [company("c1"), company("c2", { identifier: "BAD", verifiedAt: iso })] }),
      "POST /api/v1/placement/companies/c1/verify": () => json(company("c1", { verifiedAt: iso })),
    }, { me: atCollege("TPO") });
    expect(await screen.findByText(/27AAPFU0939F1ZV · GSTIN, form checked/)).toBeTruthy();
    expect(screen.getByText(/BAD · Not a valid GSTIN or CIN/)).toBeTruthy();
    expect(screen.getByText("Checked")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Mark as checked: ZZ Company c1" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/companies/c1/verify")).toBe(true));
    expect(await screen.findByText("ZZ Company c1 is marked as checked.")).toBeTruthy();
  });

  it("TA-090: the TPO invites a checked company's first recruiter by address; a company with a recruiter, or an unchecked one, offers no invitation", async () => {
    const company = (id: string, over: Record<string, unknown> = {}) => ({ id, name: `ZZ Company ${id}`, identifier: "27AAPFU0939F1ZV", sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ", verifiedAt: iso, recruiters: 0, firstVisitYear: 2024, drives: 1, ...over });
    const { calls } = await mountStaff(<TpoCompaniesScreen />, "TPO", {
      "GET /api/v1/placement/companies": () => json({ companies: [company("c1"), company("c2", { recruiters: 1 }), company("c3", { verifiedAt: null })] }),
      "POST /api/v1/placement/companies/c1/invite-recruiter": () => json(company("c1")),
    }, { me: atCollege("TPO") });
    expect(await screen.findByRole("button", { name: "Invite a recruiter: ZZ Company c1" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Invite a recruiter: ZZ Company c2" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Invite a recruiter: ZZ Company c3" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Their recruiter account's email"), " recruiter@zz.test ");
    await fireEvent.press(screen.getByRole("button", { name: "Invite a recruiter: ZZ Company c1" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/companies/c1/invite-recruiter")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/companies/c1/invite-recruiter")?.body).toEqual({ email: "recruiter@zz.test" });
    expect(await screen.findByText("If that address is a recruiter's account, they are invited. They work on the company's drives once they accept.")).toBeTruthy();
  });

  it("gives the IQAC no button, only the state", async () => {
    await mountStaff(<TpoCompaniesScreen />, "ADMIN", { "GET /api/v1/placement/companies": () => json({ companies: [{ id: "c1", name: "ZZ Company", identifier: "27AAPFU0939F1ZV", sectors: [], pointOfContact: "", verifiedAt: null, recruiters: 0, firstVisitYear: null, drives: 0 }] }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("Not checked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Mark as checked/ })).toBeNull();
  });
});

describe("the placement table on the phone", () => {
  it("shows N, X, Y, Z, the index and the median for each batch, and whether the season is published", async () => {
    const table = (batchYear: number) => ({ batchYear, finalYear: 40, placed: 30, higherStudies: 4, entrepreneurs: 1, placementIndex: 0.875, medianSalaryRupees: 650_000, offers: 35, byCompany: [], byProgramme: [{ programmeId: "p1", programmeName: "ZZ BSc Physics", finalYear: 40, placed: 30 }], byCategory: [], bands: [{ band: "5_TO_8", count: 20 }, { band: "UNDER_3", count: 0 }], bySector: [{ sector: "IT_SOFTWARE", companies: 3, offers: 20 }], offersPerStudent: 1.17 });
    await mountStaff(<PlacementTableScreen />, "IQAC", { "GET /api/v1/placement/analytics": () => json({ tables: [table(2027), table(2026)], seasons: [{ batchYear: 2026, placed: 30, higherStudies: 4, entrepreneurs: 1, medianSalaryRupees: 650_000, computedAt: iso }] }) }, { me: atCollege("IQAC") });
    expect(await screen.findByText("Batch of 2027")).toBeTruthy();
    expect(screen.getByText("Batch of 2026")).toBeTruthy();
    expect(screen.getAllByText("0.88").length).toBe(2);
    expect(screen.getByText("Published as the season's row.")).toBeTruthy();
    expect(screen.getByText(/Not published yet/)).toBeTruthy();
    expect(screen.getAllByText("5 to 8 lakh").length).toBe(2);
    expect(screen.getAllByText("75%").length).toBe(2);
  });
});

const internship = (id: string, over: Record<string, unknown> = {}) => ({ id, studentMembershipId: "m1", studentName: "ZZ Riya", companyName: "ZZ Zeta Analytics", kind: "INDUSTRY", from: "2026-11-01", to: "2026-12-15", hours: 240, credits: null, windowSemester: 4, supervisorName: "ZZ Sup", facultyMembershipId: null, facultyName: null, diary: [], hasReport: false, reportFileId: null, industryGrade: null, facultyVisitAt: null, vivaMarks: null, status: "PROPOSED", needsDeclaration: false, hasDeclaration: false, declarationFileId: null, creditedAt: null, ...over });
const rule = { creditsMin: 14, creditsMax: 20, hoursMin: 600, hoursMax: 700, windows: [2, 4, 6] };
const people = { schoolId: "s1", schools: [{ id: "s1", name: "ZZ Vidya College" }], people: [{ userId: "u2", membershipId: "f1", name: "ZZ Dr Faculty", avatarKey: null, role: "FACULTY", detail: null }, { userId: "u3", membershipId: "m9", name: "ZZ Student", avatarKey: null, role: "STUDENT", detail: null }] };

describe("students' work on the phone: internships and projects", () => {
  it("the TPO approves a proposal naming a supervisor from the people the inbox lists, and refuses another with a reason", async () => {
    const { calls } = await mountStaff(<SupervisionScreen />, "TPO", {
      "GET /api/v1/placement/internships": () => json({ internships: [internship("i1"), internship("i2", { studentName: "ZZ Aman" })], creditsTotal: null, rule, canDecide: true }),
      "GET /api/v1/shared/people": () => json(people),
      "POST /api/v1/placement/internships/i1/decide": () => json(internship("i1", { status: "APPROVED", facultyMembershipId: "f1", facultyName: "ZZ Dr Faculty" })),
      "POST /api/v1/placement/internships/i2/decide": () => json(internship("i2", { status: "REFUSED" })),
    }, { me: atCollege("TPO") });
    expect(await screen.findByText("Waiting for a decision (2)")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Approve: ZZ Riya" }));
    expect(await screen.findByRole("radio", { name: "ZZ Dr Faculty" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "ZZ Student" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/placement/internships/i1/decide")?.body).toEqual({ approve: true, facultyMembershipId: "f1", reason: "" }));
    expect(await screen.findByText("The internship is approved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refuse: ZZ Aman" }));
    const refuse = screen.getByRole("button", { name: "Refuse" });
    expect(refuse.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ outside the window");
    await fireEvent.press(screen.getByRole("button", { name: "Refuse" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/placement/internships/i2/decide")?.body).toEqual({ approve: false, facultyMembershipId: null, reason: "ZZ outside the window" }));
  });

  it("a faculty member evaluates a supervisee's internship without credits, and records a review on a project they guide", async () => {
    const project = { id: "p1", title: "ZZ Solar tracker", guideMembershipId: "m1", guideName: "ZZ Head", students: [{ membershipId: "m5", name: "ZZ Riya" }], reviews: [], marks: null, createdAt: iso };
    const { calls } = await mountStaff(<SupervisionScreen />, "FACULTY", {
      "GET /api/v1/placement/internships": () => json({ internships: [internship("i3", { status: "SUBMITTED", hasReport: true, facultyMembershipId: "m1", facultyName: "ZZ Head" })], creditsTotal: null, rule, canDecide: false }),
      "GET /api/v1/placement/projects": () => json({ projects: [project], canCreate: false }),
      "POST /api/v1/placement/internships/i3/evaluate": () => json(internship("i3", { status: "EVALUATED", industryGrade: "A", vivaMarks: 80 })),
      "POST /api/v1/placement/projects/p1/review": () => json({ ...project, reviews: [{ on: "2026-10-10", byName: "ZZ Head", note: "ZZ On track", marks: null }] }),
    }, { me: atCollege("FACULTY") });
    expect(await screen.findByText("Students' work")).toBeTruthy();
    await fireEvent.press(await screen.findByRole("button", { name: "Evaluate: ZZ Riya" }));
    expect(screen.queryByText(/Waiting for a decision/)).toBeNull();
    expect(screen.queryByLabelText("Credits")).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "A" }));
    await fireEvent.changeText(screen.getByLabelText("Viva marks"), "80");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/placement/internships/i3/evaluate")?.body).toEqual({ industryGrade: "A", vivaMarks: 80 }));
    expect(await screen.findByText("The evaluation is saved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Record a review: ZZ Solar tracker" }));
    await fireEvent.changeText(screen.getByLabelText("Review"), "ZZ On track");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/projects/p1/review")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/projects/p1/review")?.body).toMatchObject({ note: "ZZ On track", marks: null, final: false });
    expect(await screen.findByText("The review is recorded.")).toBeTruthy();
  });

  it("refuses a viva mark outside 0 to 100 before asking the server", async () => {
    const { calls } = await mountStaff(<SupervisionScreen />, "HOD", {
      "GET /api/v1/placement/internships": () => json({ internships: [internship("i3", { status: "APPROVED" })], creditsTotal: null, rule, canDecide: true }),
      "GET /api/v1/placement/projects": () => json({ projects: [], canCreate: true }),
      "GET /api/v1/shared/people": () => json(people),
    }, { me: atCollege("HOD") });
    await fireEvent.press(await screen.findByRole("button", { name: "Evaluate: ZZ Riya" }));
    await fireEvent.changeText(screen.getByLabelText("Viva marks"), "120");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("The viva marks are 0 to 100.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });
});
