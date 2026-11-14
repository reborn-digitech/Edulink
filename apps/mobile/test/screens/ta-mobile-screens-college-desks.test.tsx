/**
 * The testing analysis of 13 November 2026, batch mobile-screens-college: the college desks on the
 * phone. Each case is named with its finding.
 *
 * TA-589: two consent grants pressed in quick succession could leave the phone showing a grant off
 * that the server held on. TA-351: a company registered from the recruiter's phone was always
 * recorded under the sector "Other". TA-350: an offer declined, an application withdrawn, a
 * candidate rejected and a condonation refused by one tap with no question. TA-352: the phone
 * refused the accounts desk its concessions and no-dues screens with ACADEMICS off, though their
 * doors need no module. TA-476: the empty teaching-practice desk said to post a student teacher
 * "below", where the phone has no form. TA-477: the stream-records card printed the NCTE and BCI
 * figures without their denominator and always in the ok tone. TA-491: a moot with one team (the
 * college's team at an inter-college or national moot) could not be recorded. TA-492: a
 * management college's placement and internships tiles showed no figure and opened nothing.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { RoleCode } from "@edulink/contracts";
import { Screen, ToastProvider } from "@/components";
import { HodHomeScreen } from "@/screens/academics/hod";
import { ConcessionsScreen } from "@/screens/college-office/concessions";
import { NoDuesDeskScreen } from "@/screens/college-office/no-dues";
import { StudentConsentScreen } from "@/screens/college/consent";
import { TeachingPracticeScreen } from "@/screens/college/duty-desks";
import { MootCourtsScreen } from "@/screens/college/moot-courts";
import { StreamRecordsScreen } from "@/screens/college/stream-records";
import { StreamTilesCard } from "@/screens/college/stream-tiles";
import { RecruiterDriveScreen, RecruiterPlacementHome } from "@/screens/placement/recruiter";
import { StudentPlacementScreen } from "@/screens/placement/student";
import { TpoDriveScreen } from "@/screens/placement/tpo-drive";
import { gated, json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const iso = "2026-10-04T05:00:00.000Z";
const atCollege = (role: RoleCode, modules: string[], extra: Record<string, unknown> = {}) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role, institutionKind: "COLLEGE" }], modules, institutionKind: "COLLEGE", ...extra });
const posts = (calls: () => { line: string }[], line: string) => calls().filter((c) => c.line === line).length;
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

/* ------------------------------------------------------------------ consent */

const GRANTS = ["ATTENDANCE", "RESULTS", "MONEY", "HOSTEL_TRANSPORT", "PLACEMENT", "MESSAGES"];
const consent = (on: string[]) => ({ applies: true, grants: GRANTS.map((grant) => ({ grant, on: on.includes(grant), grantedAt: on.includes(grant) ? iso : null })), guardians: [{ name: "ZZ Sunil Pathak" }] });

describe("what an adult student lets their family see", () => {
  it("TA-589: while one grant is on its way no other can be pressed, so an earlier answer arriving last cannot draw a later grant off", async () => {
    const first = gated();
    const { calls } = await mountStaff(<StudentConsentScreen />, "STUDENT", { "GET /api/v1/student/consent": () => json(consent([])), "POST /api/v1/student/consent": first.answer }, { me: atCollege("STUDENT", ["ACADEMICS"]) });
    const grants = await screen.findAllByRole("button", { name: "Let them see it" });
    await fireEvent.press(grants[2]!);
    await waitFor(() => expect(posts(calls, "POST /api/v1/student/consent")).toBe(1));
    // Before the fix ATTENDANCE stayed pressable, and its write's answer could be overtaken by MONEY's older one.
    expect(screen.getAllByRole("button", { name: "Let them see it" })[0]).toBeDisabled();
    await fireEvent.press(screen.getAllByRole("button", { name: "Let them see it" })[0]!);
    await settle();
    expect(posts(calls, "POST /api/v1/student/consent")).toBe(1);
    await act(async () => first.open(() => json(consent(["MONEY"]))));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Let them see it" })[0]).toBeEnabled());
  });
});

/* ---------------------------------------------------------------- placement */

const record = { cgpa: 7.5, liveBacklogs: 0, attendancePct: 85, programmeId: "p1", programmeName: "ZZ BSc Physics", batchYear: 2027, gender: null, category: null };
const PLACEMENT_ON = ["ALUMNI", "ACADEMICS", "PLACEMENT"];
const drive = (did: string, over: Record<string, unknown> = {}) => ({ id: did, title: `ZZ Analyst ${did}`, companyId: "c1", companyName: "ZZ Zeta Analytics", companyVerified: true, kind: "ON_CAMPUS", status: "OPEN", packageMinRupees: 600_000, packageMaxRupees: 700_000, hostName: "ZZ Vidya College", hosted: true, nextAt: null, applicants: 1, offers: 0, createdAt: iso, jd: "", bond: "", venues: "", rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }], schedule: [], ...over });
const application = (over: Record<string, unknown> = {}) => ({ id: "a1", driveId: "d2", studentMembershipId: "m1", studentName: "ZZ Riya", schoolName: "ZZ Vidya College", appliedAt: iso, consentAt: iso, status: "SHORTLISTED", round: null, record, skills: ["Python"], results: [{ round: 0, outcome: "PASSED", feedback: "", feedbackShared: true, at: iso }], offer: null, ...over });
const offer = { id: "o1", driveId: "d3", driveTitle: "ZZ Analyst d3", companyName: "ZZ Zeta Analytics", studentMembershipId: "m1", studentName: "ZZ Riya", packageRupees: 650_000, hasLetter: false, letterFileId: null, acceptedAt: null, declinedAt: null, joinedAt: null, dreamException: false, createdAt: iso };
const placement = {
  batchYear: 2027,
  profile: { skills: ["Python"], certifications: [], projects: [], optedOut: false, dreamFlag: false, higherStudies: false, entrepreneur: false, consentAt: iso },
  record,
  drives: [{ drive: drive("d2"), eligible: true, failed: [], application: application() }],
  offers: [offer],
  internships: [],
  internshipCredits: 0,
  prep: [],
  mentorSlots: [],
};

describe("one-way steps on the placement screens", () => {
  it("TA-350: declining an offer and withdrawing from a drive are asked first, and nothing is sent until confirmed", async () => {
    const { calls } = await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement),
      "POST /api/v1/student/placement/offers/o1": () => json({ ...offer, declinedAt: iso }),
      "POST /api/v1/student/placement/drives/d2/withdraw": () => json(application({ status: "WITHDRAWN" })),
    }, { me: atCollege("STUDENT", PLACEMENT_ON) });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline" }));
    await settle();
    // Before the fix the offer was declined by this one tap.
    expect(posts(calls, "POST /api/v1/student/placement/offers/o1")).toBe(0);
    expect(screen.getByText("Decline the offer for ZZ Analyst d3? Only the placement cell can put it back.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Decline the offer for ZZ Analyst d3? Only the placement cell can put it back.")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await settle();
    expect(posts(calls, "POST /api/v1/student/placement/drives/d2/withdraw")).toBe(0);
    expect(screen.getByText("Withdraw from ZZ Zeta Analytics's drive? You can apply again only while the drive is open.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(posts(calls, "POST /api/v1/student/placement/drives/d2/withdraw")).toBe(1));
    await fireEvent.press(screen.getByRole("button", { name: "Decline" }));
    const declines = screen.getAllByRole("button", { name: "Decline" });
    await fireEvent.press(declines[declines.length - 1]!);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/student/placement/offers/o1")?.body).toEqual({ accept: false }));
  });

  it("TA-350: a recruiter's and the cell's 'Not through' is asked first", async () => {
    mockRouter.params = { driveId: "d2" };
    const recruiterMe = { ...me("RECRUITER"), contexts: [], active: { schoolId: null, role: "RECRUITER", membershipId: null } };
    const recruiterDrive = { id: "d2", title: "ZZ Analyst d2", status: "SHORTLISTING", kind: "ON_CAMPUS", collegeName: "ZZ Vidya College", packageMinRupees: 600_000, packageMaxRupees: 700_000, rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }], schedule: [], venues: "", eligibleCount: 2, recruiterRating: null, recruiterFeedback: null, applicants: [application()] };
    const recruiter = await mountStaff(<RecruiterDriveScreen />, "RECRUITER", { "GET /api/v1/recruiter/drives/d2": () => json(recruiterDrive), "POST /api/v1/placement/drives/d2/results": () => json({ saved: 1, told: 1 }) }, { me: recruiterMe });
    await fireEvent.press(await screen.findByRole("button", { name: "Not through" }));
    await settle();
    expect(posts(recruiter.calls, "POST /api/v1/placement/drives/d2/results")).toBe(0);
    expect(screen.getByText("Record ZZ Riya as not through? They are told at once, and the phone cannot change it.")).toBeTruthy();
    const confirms = screen.getAllByRole("button", { name: "Not through" });
    await fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(recruiter.calls().find((c) => c.line === "POST /api/v1/placement/drives/d2/results")?.body).toEqual({ round: 1, results: [{ studentMembershipId: "m1", outcome: "REJECTED" }] }));

    const view = { ...drive("d2", { status: "ROUNDS" }), rule: { cgpaMin: null, noLiveBacklogs: false, programmeIds: [], batchYear: null, genders: [] }, requirementId: null, poolSchools: [], eligibleCount: 3, invitedAt: null, closedAt: null, applications: [application()], recruiterRating: null, recruiterFeedback: null, canEdit: true };
    const cell = await mountStaff(<TpoDriveScreen />, "TPO", { "GET /api/v1/placement/drives/d2": () => json(view), "POST /api/v1/placement/drives/d2/results": () => json({ saved: 1, told: 1 }) }, { me: atCollege("TPO", PLACEMENT_ON) });
    await fireEvent.press(await screen.findByRole("button", { name: "Not through" }));
    await settle();
    expect(posts(cell.calls, "POST /api/v1/placement/drives/d2/results")).toBe(0);
    expect(screen.getByText("Record ZZ Riya as not through? They are told at once, and the phone cannot change it.")).toBeTruthy();
  });

  it("TA-351: the recruiter's registration carries the sectors chosen, and cannot be sent with none", async () => {
    const { calls } = await mountStaff(<RecruiterPlacementHome />, "RECRUITER", {
      "GET /api/v1/recruiter/me": () => json({ name: "ZZ Nikhil Rao", companyName: "ZZ Zeta Analytics", createdAt: iso, emailVerified: true }),
      "GET /api/v1/recruiter/drives": () => json({ drives: [], company: null }),
      "POST /api/v1/recruiter/company": () => json({ company: { id: "c1", name: "ZZ Zeta Analytics", identifier: "27AAZCZ0001Z1ZX", sectors: ["IT_SOFTWARE", "CONSULTING"], pointOfContact: "ZZ", verifiedAt: null, recruiters: 1, firstVisitYear: null, drives: 0 }, colleagues: [] }),
    }, { me: { ...me("RECRUITER"), contexts: [], active: { schoolId: null, role: "RECRUITER", membershipId: null } } });
    await fireEvent.changeText(await screen.findByLabelText("GSTIN or CIN"), "27AAZCZ0001Z1ZX");
    await fireEvent.changeText(screen.getByLabelText("Point of contact (name, phone or email)"), "ZZ Nikhil, 98000 00000");
    // Before the fix there was no sector to choose and the button went with ["OTHER"].
    expect(screen.getByRole("button", { name: "Register your company" })).toBeDisabled();
    await fireEvent.press(screen.getByText("IT and software"));
    await fireEvent.press(screen.getByText("Consulting"));
    await fireEvent.press(screen.getByRole("button", { name: "Register your company" }));
    await waitFor(() => expect((calls().find((c) => c.line === "POST /api/v1/recruiter/company")?.body as { sectors: string[] } | undefined)?.sectors).toEqual(["IT_SOFTWARE", "CONSULTING"]));
  });
});

/* ------------------------------------------------------------------ the HOD */

describe("a condonation refused on the phone", () => {
  it("TA-350: Refuse is asked first, and nothing is sent until confirmed", async () => {
    const COND = id("zzcondonation1");
    const condonation = { id: COND, studentMembershipId: id("zzstudent2"), studentName: "ZZ Omkar", termId: id("zzterm1"), termName: "ZZ Odd term", offeringId: id("zzoffering1"), courseCode: "PHY101", ground: "MEDICAL", note: "ZZ Dengue", hasDocument: false, documentFileId: null, status: "ASKED", percent: 65, floor: 65, createdAt: iso, decidedAt: null, decisionNote: null };
    const term = { id: id("zzterm1"), name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: true };
    const { calls } = await mountStaff(<HodHomeScreen />, "HOD", {
      "GET /api/v1/academics/hod-home": () => json({ department: { id: id("zzdept1"), code: "PHY", name: "ZZ Physics" }, term, load: [], ratio: [], offerings: [], defaulters: 0, condonationsWaiting: 1, mentoringGroups: 0, mentees: 0, resultsAvailable: false, projects: [] }),
      "GET /api/v1/academics/condonations": () => json({ items: [condonation], canDecide: true }),
      [`POST /api/v1/academics/condonations/${COND}/decide`]: () => json({ ...condonation, status: "REFUSED" }),
    }, { me: atCollege("HOD", ["ACADEMICS"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "Refuse" }));
    await settle();
    expect(calls().some((c) => c.line.endsWith("/decide"))).toBe(false);
    expect(screen.getByText("Refuse ZZ Omkar's condonation? They are told at once, and it cannot be undone here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refuse" }));
    await waitFor(() => expect(calls().find((c) => c.line.endsWith("/decide"))?.body).toEqual({ decision: "REFUSE", note: "" }));
  });
});

/* ---------------------------------------------------------- the accounts desk */

describe("the accounts desk with ACADEMICS off", () => {
  it("TA-352: concessions and no-dues are the desk's whatever ACADEMICS says, as their doors need no module", async () => {
    const off = ["SCHOLARSHIPS", "PAYROLL"];
    const concessions = await mountStaff(<ConcessionsScreen />, "ACCOUNTS", { "GET /api/v1/accounts/concessions": () => json({ items: [] }), "GET /api/v1/accounts/settings": () => json({ concessionLimitPaise: 1_000_000 }) }, { me: atCollege("ACCOUNTS", off) });
    // Before the fix: "Academics is switched off", and the queue never asked for.
    expect(await screen.findByText("Nothing waits for the principal")).toBeTruthy();
    expect(concessions.calls().some((c) => c.line === "GET /api/v1/accounts/concessions")).toBe(true);
    const noDues = await mountStaff(<NoDuesDeskScreen />, "ACCOUNTS", { "GET /api/v1/accounts/no-dues": () => json({ items: [{ studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", completed: false, uncleared: ["ACCOUNTS"] }] }) }, { me: atCollege("ACCOUNTS", off) });
    expect(await screen.findByText("ZZ Ishaan Pathak")).toBeTruthy();
    expect(noDues.calls().some((c) => c.line.startsWith("GET /api/v1/accounts/no-dues?"))).toBe(true);
  });
});

/* --------------------------------------------------------- the stream desks */

const tpSummary = { year: 2026, practiceSchools: 0, postings: 0, students: 0, lessonsPlanned: 0, lessonsObserved: 0, weeks: 0, minimumWeeks: 20, meetingMinimum: 0, bySchool: [], perStudent: [] };

describe("the stream desks", () => {
  it("TA-476: the empty teaching-practice desk points the coordinator to the web, never to a form 'below'", async () => {
    await mountStaff(<TeachingPracticeScreen />, "FACULTY", { "GET /api/v1/duties/teaching-practice": () => json({ offered: true, canManage: true, canObserve: true, schools: [], postings: [], students: [], summary: tpSummary }) }, { me: atCollege("FACULTY", ["ACADEMICS"], { streams: ["EDUCATION"], duties: ["PRACTICE_TEACHING_COORDINATOR"] }) });
    expect(await screen.findByText("No student teacher is posted yet. Practice schools and postings are added on the web, under Teaching practice.")).toBeTruthy();
    expect(screen.queryByText(/below/)).toBeNull();
  });

  it("TA-477: the NCTE and BCI figures print their denominator, and fall short in the warn tone", async () => {
    const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
    await mountStaff(<StreamRecordsScreen />, "ADMIN", {
      "GET /api/v1/stream-records/summary": () =>
        json({
          year: 2026,
          streams: ["EDUCATION", "LAW"],
          labs: false,
          law: true,
          education: true,
          practical: { year: 2026, records: 0, signed: 0, unsigned: 0, students: 0, offerings: 0, batches: 0, batchMembers: 0, byCourse: [] },
          lawInternships: { year: 2026, internships: 4, byKind: { COURT: 2, FIRM: 1, LEGAL_AID: 1 }, weeks: 40, students: 2, meetingMinimum: 2, perStudent: [], mootCourts: { total: 0, INTRA: 0, INTER: 0, NATIONAL: 0, participants: 0 } },
          teachingPractice: { ...tpSummary, practiceSchools: 1, postings: 3, students: 3, meetingMinimum: 0 },
          corps: { year: 2026, nss: corps, ncc: corps, hoursPerYear: 120 },
        }),
    }, { me: atCollege("ADMIN", ["ACADEMICS"], { streams: ["EDUCATION", "LAW"] }) });
    // Before the fix: "0" and "2", both green.
    const ncte = await screen.findByText("0 / 3");
    const bci = screen.getByText("2 / 2");
    expect(StyleSheet.flatten(ncte.props.style).color).not.toBe(StyleSheet.flatten(bci.props.style).color);
  });

  it("TA-491: an inter-college moot with the college's one team can be recorded; an intra-college one still needs two", async () => {
    const PATH = "/api/v1/stream-records/moot-courts";
    const { calls } = await mountStaff(
      <ToastProvider>
        <MootCourtsScreen />
      </ToastProvider>,
      "FACULTY",
      { [`GET ${PATH}`]: () => json({ offered: true, canEdit: true, items: [], students: [] }), [`POST ${PATH}`]: () => json({ id: id("moot2") }) },
      { me: atCollege("FACULTY", ["ACADEMICS"], { streams: ["LAW"] }) },
    );
    await fireEvent.changeText(await screen.findByLabelText("Name of the moot"), "ZZ National Moot");
    await fireEvent.press(screen.getByRole("radio", { name: "National" }));
    await fireEvent.changeText(screen.getAllByLabelText("Team name")[0]!, "ZZ College team");
    // The empty second box can be taken away down to the one team (before the fix only while there were more than two).
    await fireEvent.press(screen.getByRole("button", { name: "Remove team 2" }));
    expect(screen.queryByText("Name at least two teams.")).toBeNull();
    const save = screen.getByRole("button", { name: "Record the moot court" });
    expect(save).toBeEnabled();
    await fireEvent.press(save);
    await waitFor(() => expect((calls().find((c) => c.line === `POST ${PATH}`)?.body as { kind: string; teams: unknown[] } | undefined)?.teams).toHaveLength(1));
    // Intra-college, one team is not enough.
    await fireEvent.changeText(await screen.findByLabelText("Name of the moot"), "ZZ Intra Moot");
    await fireEvent.changeText(screen.getAllByLabelText("Team name")[0]!, "ZZ Team A");
    expect(screen.getByText("Name at least two teams.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record the moot court" })).toBeDisabled();
  });
});

/* ---------------------------------------------------------- the stream tiles */

describe("a management college's tiles", () => {
  it("TA-492: placement and internships open the placement cell for the office and the head, and placement shows the drives open", async () => {
    const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
    const summaryDrive = (did: string, status: string) => ({ id: did, title: `ZZ ${did}`, companyId: "c1", companyName: "ZZ Co", companyVerified: true, kind: "ON_CAMPUS", status, packageMinRupees: 600_000, packageMaxRupees: 700_000, hostName: "ZZ Vidya College", hosted: true, nextAt: null, applicants: 0, offers: 0, createdAt: iso });
    await mountStaff(
      <Screen title="Overview">
        <StreamTilesCard role="ADMIN" />
      </Screen>,
      "ADMIN",
      {
        "GET /api/v1/stream-records/summary": () => json({ year: 2026, streams: ["MANAGEMENT"], labs: false, law: false, education: false, practical: { year: 2026, records: 0, signed: 0, unsigned: 0, students: 0, offerings: 0, batches: 0, batchMembers: 0, byCourse: [] }, lawInternships: { year: 2026, internships: 0, byKind: { COURT: 0, FIRM: 0, LEGAL_AID: 0 }, weeks: 0, students: 0, meetingMinimum: 0, perStudent: [], mootCourts: { total: 0, INTRA: 0, INTER: 0, NATIONAL: 0, participants: 0 } }, teachingPractice: tpSummary, corps: { year: 2026, nss: corps, ncc: corps, hoursPerYear: 120 } }),
        "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table: { batchYear: 2027, finalYear: 0, placed: 0, higherStudies: 0, entrepreneurs: 0, placementIndex: null, medianSalaryRupees: null, offers: 0, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: null }, drives: [summaryDrive("d1", "OPEN"), summaryDrive("d2", "ROUNDS"), summaryDrive("d3", "CLOSED")], requirementsWaiting: 0, internshipsWaiting: 0, unverifiedCompanies: 0, canEdit: true }),
      },
      { me: atCollege("ADMIN", ["ACADEMICS", "PLACEMENT"], { streams: ["MANAGEMENT"] }) },
    );
    // Before the fix both rows had no caption and no press.
    expect(await screen.findByText("Drives open: 2")).toBeTruthy();
    await fireEvent.press(screen.getByText("Drives open: 2"));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/placement-cell");
    mockRouter.push.mockClear();
    const internships = screen.getAllByText(/Internships/).find((n) => n.props.children === "Internships" || /^Internships/.test(String(n.props.children)));
    expect(internships).toBeTruthy();
    await fireEvent.press(internships!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/placement-cell");
  });

  it("TA-492: the drives open are the college's own, never another college's pooled drive it is a guest of", async () => {
    const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
    const summaryDrive = (did: string, status: string, hosted: boolean) => ({ id: did, title: `ZZ ${did}`, companyId: "c1", companyName: "ZZ Co", companyVerified: true, kind: hosted ? "ON_CAMPUS" : "POOLED", status, packageMinRupees: 600_000, packageMaxRupees: 700_000, hostName: hosted ? "ZZ Vidya College" : "ZZ Shastri College", hosted, nextAt: null, applicants: 0, offers: 0, createdAt: iso });
    await mountStaff(
      <Screen title="Overview">
        <StreamTilesCard role="PRINCIPAL" />
      </Screen>,
      "PRINCIPAL",
      {
        "GET /api/v1/stream-records/summary": () => json({ year: 2026, streams: ["MANAGEMENT"], labs: false, law: false, education: false, practical: { year: 2026, records: 0, signed: 0, unsigned: 0, students: 0, offerings: 0, batches: 0, batchMembers: 0, byCourse: [] }, lawInternships: { year: 2026, internships: 0, byKind: { COURT: 0, FIRM: 0, LEGAL_AID: 0 }, weeks: 0, students: 0, meetingMinimum: 0, perStudent: [], mootCourts: { total: 0, INTRA: 0, INTER: 0, NATIONAL: 0, participants: 0 } }, teachingPractice: tpSummary, corps: { year: 2026, nss: corps, ncc: corps, hoursPerYear: 120 } }),
        // One open drive of the college's own, and two pooled drives another college hosts and this one is a guest of.
        "GET /api/v1/placement/summary": () => json({ batchYear: 2027, table: { batchYear: 2027, finalYear: 0, placed: 0, higherStudies: 0, entrepreneurs: 0, placementIndex: null, medianSalaryRupees: null, offers: 0, byCompany: [], byProgramme: [], byCategory: [], bands: [], bySector: [], offersPerStudent: null }, drives: [summaryDrive("d1", "OPEN", true), summaryDrive("p1", "OPEN", false), summaryDrive("p2", "SHORTLISTING", false)], requirementsWaiting: 0, internshipsWaiting: 0, unverifiedCompanies: 0, canEdit: false }),
      },
      { me: atCollege("PRINCIPAL", ["ACADEMICS", "PLACEMENT"], { streams: ["MANAGEMENT"] }) },
    );
    // Before the repair the guest's pooled drives were counted too: "Drives open: 3".
    expect(await screen.findByText("Drives open: 1")).toBeTruthy();
    expect(screen.queryByText("Drives open: 3")).toBeNull();
  });
});
