import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { StudentPlacementScreen } from "@/screens/placement/student";
import { RecruiterDriveScreen, RecruiterPlacementHome } from "@/screens/placement/recruiter";
import { TpoHome } from "@/screens/placement/tpo";
import { TpoDriveScreen } from "@/screens/placement/tpo-drive";
import { json, me, mountStaff } from "./staff-harness";
import { BackCtx } from "@/components/chrome";
import { shouldRetry } from "@/lib/query";

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

  it("tells a minor their application waits for the guardian, never that the company sees it (A3-journeys-20)", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement()),
      "POST /api/v1/student/placement/drives/d1/apply": () => json(application({ id: "a9", driveId: "d1", status: "APPLIED", results: [], consentAt: null })),
    }, { me: atCollege("STUDENT", ON) });
    await fireEvent.press(await screen.findByRole("switch", { name: "I agree to share my profile and record with ZZ Zeta Analytics for this drive." }));
    await fireEvent.press(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("Applied. Your guardian is asked to consent; the company sees nothing until they do.")).toBeTruthy();
    expect(screen.queryByText("Applied. The company sees your profile and record for this drive.")).toBeNull();
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
    // Asked first (TA-350): the confirm button carries the same word.
    await fireEvent.press(screen.getAllByRole("button", { name: "Withdraw" })[0]!);
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
    // Declining is asked first (TA-350); the confirm button is the last "Decline".
    const declines = screen.getAllByRole("button", { name: "Decline" });
    await fireEvent.press(declines[declines.length - 1]!);
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
    // The sectors are the recruiter's to choose (TA-351), never "Other" by default.
    expect(screen.getByRole("button", { name: "Register your company" }).props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByText("IT and software"));
    await fireEvent.press(screen.getByRole("button", { name: "Register your company" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/recruiter/company")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/recruiter/company")?.body).toEqual({ name: "ZZ Zeta Analytics", identifier: "27AAZCZ0001Z1ZX", sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ Nikhil, 98000 00000" });
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
    expect(await screen.findByText("Students who qualify at the college: 2.")).toBeTruthy();
    expect(screen.getByText("ZZ Riya")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Round 1: Through" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/drives/d2/results")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/drives/d2/results")?.body).toEqual({ round: 1, results: [{ studentMembershipId: "m1", outcome: "PASSED" }] });
    expect(await screen.findByText("Outcomes saved: 1; the students are told.")).toBeTruthy();
  });

  it("says a closed drive is not found", async () => {
    mockRouter.params = { driveId: "d9" };
    await mountStaff(<RecruiterDriveScreen />, "RECRUITER", { "GET /api/v1/recruiter/drives/d9": () => json({ error: "That drive is not one you can see, or it has closed.", code: "NOT_FOUND" }, 404) }, { me: recruiterMe });
    expect(await screen.findByText("That drive is not one you can see, or it has closed.")).toBeTruthy();
  });

  it("leaves the skeleton for the not-found sentence at once, offering the way back and no retry (A3-states-14)", async () => {
    mockRouter.params = { driveId: "d9" };
    const onBack = jest.fn();
    const { calls } = await mountStaff(
      <BackCtx.Provider value={{ onBack }}>
        <RecruiterDriveScreen />
      </BackCtx.Provider>,
      "RECRUITER",
      { "GET /api/v1/recruiter/drives/d9": () => json({ error: "That drive is not one you can see, or it has closed.", code: "NOT_FOUND" }, 404) },
      { me: recruiterMe, retry: shouldRetry },
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    // The app's policy asks once: a 404 is the server's answer, not a flicker
    // (the old one retried after a second, and a loaded run saw only the skeleton).
    expect(await screen.findByText("That drive is not one you can see, or it has closed.", {}, { timeout: 500 })).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(calls().filter((c) => c.line === "GET /api/v1/recruiter/drives/d9")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    const backs = screen.getAllByRole("button", { name: "Back" });
    await fireEvent.press(backs[backs.length - 1]!);
    expect(onBack).toHaveBeenCalled();
  });
});

describe("the TPO on the phone (4 Oct 2026)", () => {
  it("shows the season and the drives", async () => {
    const table = { batchYear: 2027, finalYear: 3, placed: 1, higherStudies: 0, entrepreneurs: 0, placementIndex: 0.333, medianSalaryRupees: 650_000, offers: 1, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: 1 };
    await mountStaff(<TpoHome />, "TPO", { "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table, drives: [drive("d1")], requirementsWaiting: 1, internshipsWaiting: 2, unverifiedCompanies: 1, canEdit: true }) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("₹6.5 lakh a year")).toBeTruthy();
    expect(screen.getByText("2 internships to approve")).toBeTruthy();
    // One unchecked company reads singular (A3-journeys-40).
    expect(screen.getByText("1 company to check")).toBeTruthy();
    expect(screen.getByText("ZZ Analyst d1")).toBeTruthy();
  });

  it("says why the season reads 0 when nobody's programme ends in the batch (B-29)", async () => {
    const table = { batchYear: 2027, finalYear: 0, placed: 0, higherStudies: 0, entrepreneurs: 0, placementIndex: null, medianSalaryRupees: null, offers: 0, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: null };
    await mountStaff(<TpoHome />, "TPO", { "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table, drives: [drive("d1")], requirementsWaiting: 0, internshipsWaiting: 0, unverifiedCompanies: 0, canEdit: true }) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText(/No student's programme ends in 2027/)).toBeTruthy();
  });

  it("is the college role home, saying so, while placement is off", async () => {
    await mountStaff(<TpoHome />, "TPO", {}, { me: atCollege("TPO", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("Placement is not switched on")).toBeTruthy();
  });
});

describe("the TPO's drive on the phone (5 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());
  const view = (applications: unknown[], over: Record<string, unknown> = {}) => ({ ...drive("d2", { status: "SHORTLISTING", applicants: applications.length }), rule: { cgpaMin: 6, noLiveBacklogs: true, programmeIds: [], batchYear: 2027, genders: [] }, requirementId: null, poolSchools: [], eligibleCount: 4, invitedAt: iso, closedAt: null, applications, recruiterRating: null, recruiterFeedback: null, canEdit: true, ...over });

  it("opens a drive from the home, and records the next round for each candidate, one press each", async () => {
    await mountStaff(<TpoHome />, "TPO", { "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table: { batchYear: 2027, finalYear: 3, placed: 0, higherStudies: 0, entrepreneurs: 0, placementIndex: null, medianSalaryRupees: null, offers: 0, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: null }, drives: [drive("d2")], requirementsWaiting: 0, internshipsWaiting: 0, unverifiedCompanies: 0, canEdit: true }) }, { me: atCollege("TPO", ON) });
    await fireEvent.press(await screen.findByText("ZZ Analyst d2"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/placement-drive", params: { driveId: "d2" } });

    mockRouter.params = { driveId: "d2" };
    const fresh = application({ id: "a2", studentMembershipId: "m2", studentName: "ZZ Kabir", status: "APPLIED", results: [] });
    const waiting = application({ id: "a3", studentMembershipId: "m3", studentName: "ZZ Minor Meera", status: "APPLIED", results: [], consentAt: null });
    const { calls } = await mountStaff(<TpoDriveScreen />, "TPO", {
      "GET /api/v1/placement/drives/d2": () => json(view([application(), fresh, waiting])),
      "POST /api/v1/placement/drives/d2/results": () => json({ saved: 1, told: 1 }),
    }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("ZZ Riya")).toBeTruthy();
    // ZZ Riya passed the shortlist: round 1 is next. ZZ Kabir is up for the shortlist. A minor waiting for a guardian is not offered a round.
    expect(screen.getByRole("button", { name: "Shortlist (round 0): Through" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /: Through$/ })).toHaveLength(2);
    expect(screen.getByText(/Waiting for your consent/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Round 1: Through" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/drives/d2/results")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/drives/d2/results")?.body).toEqual({ round: 1, results: [{ studentMembershipId: "m1", outcome: "PASSED" }] });
    expect(await screen.findByText("Outcomes saved: 1; the students are told.")).toBeTruthy();
  });

  it("offers no buttons on a pooled drive the college only guests, and shows a refusal as the server says it", async () => {
    mockRouter.params = { driveId: "d2" };
    let posted = false;
    await mountStaff(<TpoDriveScreen />, "TPO", {
      "GET /api/v1/placement/drives/d2": () => json(view([application({ results: [] })], { hosted: false, hostName: "ZZ Shastri" })),
      "POST /api/v1/placement/drives/d2/results": () => {
        posted = true;
        return json({ error: "x" }, 403);
      },
    }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("ZZ Riya")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Through/ })).toBeNull();
    expect(posted).toBe(false);
    mockRouter.params = { driveId: "d9" };
    await mountStaff(<TpoDriveScreen />, "TPO", { "GET /api/v1/placement/drives/d9": () => json({ error: "ZZ That drive is not this college's.", code: "NOT_FOUND" }, 404) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("ZZ That drive is not this college's.")).toBeTruthy();
  });

  // A3-journeys-18 (risks batch, 5 Oct 2026): an offer far above the drive's package is the server's 409 with its
  // sentence under the package field; the TPO checks the figure and confirms, which posts again with confirmedHigh.
  it("records an offer, and a figure far above the drive's package asks for a confirm with the server's sentence", async () => {
    mockRouter.params = { driveId: "d2" };
    const SENTENCE = "₹20 lakh is more than one and a half times this drive's highest package (₹7 lakh). Check the figure, then confirm it.";
    const bodies: unknown[] = [];
    const { calls } = await mountStaff(<TpoDriveScreen />, "TPO", {
      "GET /api/v1/placement/drives/d2": () => json(view([application()])),
      "POST /api/v1/placement/drives/d2/offers": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { confirmedHigh?: boolean };
        bodies.push(body);
        return body.confirmedHigh ? json({ ...offer, driveId: "d2", packageRupees: 2_000_000 }) : json({ error: SENTENCE, code: "CONFLICT", issues: { packageRupees: SENTENCE } }, 409);
      },
    }, { me: atCollege("TPO", ON) });
    await fireEvent.press(await screen.findByRole("button", { name: "Record an offer: ZZ Riya" }));
    await fireEvent.changeText(screen.getByLabelText("Package (lakh a year)"), "20");
    await fireEvent.press(screen.getByRole("button", { name: "Record the offer" }));
    expect(await screen.findByText(SENTENCE)).toBeTruthy();
    expect(bodies[0]).toEqual({ studentMembershipId: "m1", packageRupees: 2_000_000, letterFileId: null });
    await fireEvent.press(screen.getByRole("button", { name: "The figure is right: record it" }));
    expect(await screen.findByText("Offer recorded for ZZ Riya; they are told.")).toBeTruthy();
    expect(bodies[1]).toEqual({ studentMembershipId: "m1", packageRupees: 2_000_000, letterFileId: null, confirmedHigh: true });
    expect(calls().filter((c) => c.line === "POST /api/v1/placement/drives/d2/offers")).toHaveLength(2);
  });

  it("offers no offer form on a drive the college only guests, nor to a candidate who has one", async () => {
    mockRouter.params = { driveId: "d2" };
    await mountStaff(<TpoDriveScreen />, "TPO", { "GET /api/v1/placement/drives/d2": () => json(view([application(), application({ id: "a4", studentMembershipId: "m4", studentName: "ZZ Kiran", offer: { ...offer, driveId: "d2", studentMembershipId: "m4", studentName: "ZZ Kiran" } })], { hosted: false })) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("ZZ Riya")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Record an offer/ })).toBeNull();
    await mountStaff(<TpoDriveScreen />, "TPO", { "GET /api/v1/placement/drives/d2": () => json(view([application({ id: "a4", studentMembershipId: "m4", studentName: "ZZ Kiran", offer: { ...offer, driveId: "d2", studentMembershipId: "m4", studentName: "ZZ Kiran" } })])) }, { me: atCollege("TPO", ON) });
    expect(await screen.findByText("ZZ Kiran")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Record an offer/ })).toBeNull();
  });
});
