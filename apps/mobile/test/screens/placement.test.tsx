import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { StudentPlacementScreen } from "@/screens/placement/student";
import { RecruiterDriveScreen, RecruiterPlacementHome } from "@/screens/placement/recruiter";
import { TpoHome } from "@/screens/placement/tpo";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const ON = ["ALUMNI", "ACADEMICS", "PLACEMENT"];
const iso = "2026-10-04T05:00:00.000Z";
const record = { cgpa: 7.5, liveBacklogs: 0, attendancePct: 85, programmeId: "p1", programmeName: "ZZ BSc Physics", batchYear: 2027, gender: null, category: null };
const drive = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: `ZZ Analyst ${id}`,
  companyId: "c1",
  companyName: "ZZ Zeta Analytics",
  companyVerified: true,
  kind: "ON_CAMPUS",
  status: "OPEN",
  packageMinRupees: 600_000,
  packageMaxRupees: 700_000,
  hostName: "ZZ Vidya College",
  hosted: true,
  nextAt: null,
  applicants: 1,
  offers: 0,
  createdAt: iso,
  jd: "",
  bond: "",
  venues: "",
  rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }],
  schedule: [],
  ...over,
});
const application = (over: Record<string, unknown> = {}) => ({ id: "a1", driveId: "d2", studentMembershipId: "m1", studentName: "ZZ Riya", schoolName: "ZZ Vidya College", appliedAt: iso, consentAt: iso, status: "SHORTLISTED", round: null, record, skills: ["Python"], results: [{ round: 0, outcome: "PASSED", feedback: "ZZ Strong basics", feedbackShared: true, at: iso }], offer: null, ...over });
const offer = { id: "o1", driveId: "d3", driveTitle: "ZZ Analyst d3", companyName: "ZZ Zeta Analytics", studentMembershipId: "m1", studentName: "ZZ Riya", packageRupees: 650_000, hasLetter: false, letterFileId: null, acceptedAt: null, declinedAt: null, joinedAt: null, dreamException: false, createdAt: iso };
const placement = (over: Record<string, unknown> = {}) => ({
  batchYear: 2027,
  profile: { skills: ["Python"], certifications: [], projects: [], optedOut: false, dreamFlag: false, higherStudies: false, entrepreneur: false, consentAt: iso },
  record,
  drives: [
    { drive: drive("d1"), eligible: true, failed: [], application: null },
    { drive: drive("d2"), eligible: true, failed: [], application: application() },
    { drive: drive("d4", { title: "ZZ Core d4" }), eligible: false, failed: [{ code: "CGPA", need: "8.00", have: "7.50" }, { code: "BACKLOGS", need: "0", have: "1" }], application: null },
  ],
  offers: [offer],
  internships: [{ id: "i1", studentMembershipId: "m1", studentName: "ZZ Riya", companyName: "ZZ Zeta Analytics", kind: "INDUSTRY", from: "2026-09-20", to: "2026-11-30", hours: 240, credits: null, windowSemester: 2, supervisorName: "ZZ Sup", facultyMembershipId: "f1", facultyName: "ZZ Faculty", diary: [], hasReport: false, reportFileId: null, industryGrade: null, facultyVisitAt: null, vivaMarks: null, status: "APPROVED", needsDeclaration: false, hasDeclaration: false, declarationFileId: null, creditedAt: null }],
  internshipCredits: 0,
  prep: [{ slug: "zz-placement-aptitude-percentages", name: "ZZ Percentages and profit", subject: "APTITUDE", questionCount: 3, level: 1 }],
  mentorSlots: [{ id: "g1", title: "ZZ Mock interview", startsAt: "2026-10-11T05:30:00.000Z", endsAt: "2026-10-11T06:00:00.000Z", mentorName: "ZZ Pooja", batchYear: 2025, seatsLeft: 1 }],
  ...over,
});

describe("a student's placement on the phone (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("shows the record, each drive with why not, and applies only with the consent switched on", async () => {
    const { calls } = await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement()),
      "POST /api/v1/student/placement/drives/d1/apply": () => json(application({ id: "a9", driveId: "d1", status: "APPLIED", results: [] })),
    }, { me: atCollege("STUDENT", ON) });
    expect(await screen.findByText("ZZ Analyst d1 · ZZ Zeta Analytics")).toBeTruthy();
    expect(screen.getByText("• CGPA 7.50 is below 8.00")).toBeTruthy();
    expect(screen.getByText("• 1 live backlogs; this drive takes none")).toBeTruthy();
    expect(screen.getByText("Shortlisted")).toBeTruthy();
    expect(screen.getByText("Shortlist (round 0) · Through · ZZ Strong basics")).toBeTruthy();
    const apply = screen.getByRole("button", { name: "Apply" });
    expect(apply.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByRole("switch", { name: "I agree to share my profile and record with ZZ Zeta Analytics for this drive." }));
    await fireEvent.press(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/student/placement/drives/d1/apply")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/student/placement/drives/d1/apply")?.body).toEqual({ consent: true });
    expect(await screen.findByText("Applied. The company sees your profile and record for this drive.")).toBeTruthy();
  });

  it("answers an offer, withdraws an application, opens the practice and the mentors' times", async () => {
    const { calls } = await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement()),
      "POST /api/v1/student/placement/offers/o1": () => json({ ...offer, acceptedAt: iso }),
      "POST /api/v1/student/placement/drives/d2/withdraw": () => json(application({ status: "WITHDRAWN" })),
    }, { me: atCollege("STUDENT", ON) });
    expect(await screen.findByText(/ZZ Zeta Analytics · ₹6.5 lakh a year · waiting for an answer/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText("Offer accepted. Congratulations.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/student/placement/drives/d2/withdraw")).toBe(true));
    await fireEvent.press(screen.getByText("ZZ Percentages and profit"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/quiz", params: { mode: "topic", slug: "zz-placement-aptitude-percentages" } });
    await fireEvent.press(screen.getByRole("button", { name: "Book a time in Sessions" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/sessions");
  });

  it("says placement is off at a college that has not switched it on", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {}, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("Placement is not switched on")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
  });

  it("shows a refusal from the server in words", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement()),
      "POST /api/v1/student/placement/offers/o1": () => json({ error: "One offer each: a second needs the dream flag.", code: "CONFLICT" }, 409),
    }, { me: atCollege("STUDENT", ON) });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline" }));
    expect(await screen.findByText("One offer each: a second needs the dream flag.")).toBeTruthy();
  });
});

const recruiterMe = { ...me("RECRUITER"), contexts: [], active: { schoolId: null, role: "RECRUITER", membershipId: null } };
const company = { id: "c1", name: "ZZ Zeta Analytics", identifier: "27AAZCZ0001Z1ZX", sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ", verifiedAt: iso, recruiters: 1, firstVisitYear: null, drives: 0 };
const recruiterDrive = { id: "d2", title: "ZZ Analyst d2", status: "SHORTLISTING", kind: "ON_CAMPUS", collegeName: "ZZ Vidya College", packageMinRupees: 600_000, packageMaxRupees: 700_000, rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }], schedule: [], venues: "", eligibleCount: 2, recruiterRating: null, recruiterFeedback: null };

describe("the recruiter on the phone (4 Oct 2026)", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = {};
  });

  it("registers the company first, by GSTIN or CIN", async () => {
    let registered = false;
    const { calls } = await mountStaff(<RecruiterPlacementHome />, "RECRUITER", {
      "GET /api/v1/recruiter/me": () => json({ name: "ZZ Nikhil Rao", companyName: "ZZ Zeta Analytics", createdAt: iso, emailVerified: false }),
      "GET /api/v1/recruiter/drives": () => json({ drives: [], company: registered ? company : null }),
      "POST /api/v1/recruiter/company": () => {
        registered = true;
        return json({ company, colleagues: [] });
      },
    }, { me: recruiterMe });
    expect(await screen.findByText(/Confirm your email address/)).toBeTruthy();
    const register = await screen.findByRole("button", { name: "Register your company" });
    expect(register.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("GSTIN or CIN"), "27AAZCZ0001Z1ZX");
    await fireEvent.changeText(screen.getByLabelText("Point of contact (name, phone or email)"), "ZZ Nikhil, 98000 00000");
    await fireEvent.press(screen.getByRole("button", { name: "Register your company" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/recruiter/company")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/recruiter/company")?.body).toEqual({ name: "ZZ Zeta Analytics", identifier: "27AAZCZ0001Z1ZX", sectors: ["OTHER"], pointOfContact: "ZZ Nikhil, 98000 00000" });
    expect(await screen.findByText("No drives yet")).toBeTruthy();
  });

  it("lists the company's live drives with the eligible count and opens one", async () => {
    await mountStaff(<RecruiterPlacementHome />, "RECRUITER", {
      "GET /api/v1/recruiter/me": () => json({ name: "ZZ Nikhil Rao", companyName: "ZZ Zeta Analytics", createdAt: iso, emailVerified: true }),
      "GET /api/v1/recruiter/drives": () => json({ drives: [{ ...recruiterDrive, applicantCount: 1 }], company }),
    }, { me: recruiterMe });
    expect(await screen.findByText("ZZ Vidya College · Shortlisting · 2 eligible · 1 applied")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Analyst d2"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/recruiter-drive", params: { driveId: "d2" } });
  });

  it("shows only the consented applicants and records the next round with a press", async () => {
    mockRouter.params = { driveId: "d2" };
    const { calls } = await mountStaff(<RecruiterDriveScreen />, "RECRUITER", {
      "GET /api/v1/recruiter/drives/d2": () => json({ ...recruiterDrive, applicants: [application()] }),
      "POST /api/v1/placement/drives/d2/results": () => json({ saved: 1, told: 1 }),
    }, { me: recruiterMe });
    expect(await screen.findByText("2 students qualify at the college.")).toBeTruthy();
    expect(screen.getByText("ZZ Riya")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Round 1: Through" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/drives/d2/results")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/drives/d2/results")?.body).toEqual({ round: 1, results: [{ studentMembershipId: "m1", outcome: "PASSED" }] });
    expect(await screen.findByText("1 outcomes saved; the students are told.")).toBeTruthy();
  });

  it("says a closed drive is not found", async () => {
    mockRouter.params = { driveId: "d9" };
    await mountStaff(<RecruiterDriveScreen />, "RECRUITER", { "GET /api/v1/recruiter/drives/d9": () => json({ error: "That drive is not one you can see, or it has closed.", code: "NOT_FOUND" }, 404) }, { me: recruiterMe });
    expect(await screen.findByText("That drive is not one you can see, or it has closed.")).toBeTruthy();
  });
});

describe("the TPO on the phone (4 Oct 2026)", () => {
  it("shows the season and the drives", async () => {
    const table = { batchYear: 2027, finalYear: 3, placed: 1, higherStudies: 0, entrepreneurs: 0, placementIndex: 0.333, medianSalaryRupees: 650_000, offers: 1, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: 1 };
    await mountStaff(<TpoHome />, "TPO", { "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table, drives: [drive("d1")], requirementsWaiting: 1, internshipsWaiting: 2, unverifiedCompanies: 0, canEdit: true }) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("₹6.5 lakh a year")).toBeTruthy();
    expect(screen.getByText("2 internships to approve")).toBeTruthy();
    expect(screen.getByText("ZZ Analyst d1")).toBeTruthy();
  });

  it("is the college role home, saying so, while placement is off", async () => {
    await mountStaff(<TpoHome />, "TPO", {}, { me: atCollege("TPO", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("Placement is not switched on")).toBeTruthy();
  });
});
