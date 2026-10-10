import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ExpulsionsScreen } from "@/screens/hostel/expulsions";
import { SquadRoundsScreen } from "@/screens/hostel/squad";
import { EResourcesScreen } from "@/screens/library/e-resources";
import { MyItemsScreen } from "@/screens/shared/my-items";
import { StreamRecordsScreen } from "@/screens/college/stream-records";
import { OfficeAcademicsScreen, OfficeAdmissionsScreen, OfficeAlumniScreen, OfficeHostelScreen, OfficeTransportScreen } from "@/screens/staff/office-college";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[] = ["ACADEMICS", "HOSTEL", "LIBRARY", "INVENTORY", "TRANSPORT", "ALUMNI", "ADMISSIONS"]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const iso = "2026-10-04T05:00:00.000Z";
const expulsion = (id: string, over: Record<string, unknown> = {}) => ({ id, allotmentId: "al1", membershipId: "m1", name: "ZZ Rohan", hostelName: "ZZ Boys hostel", roomNumber: "12", reason: "ZZ repeated ragging after a warning", incidentId: null, effectiveOn: "2026-10-20", status: "ASKED", proposedByName: "ZZ Warden", proposedAt: iso, decidedAt: null, decisionNote: null, ...over });

describe("hostel expulsions on the phone (the parity batch, 10 Oct 2026)", () => {
  it("the warden proposes one for a boarder found by name, and takes it back after one ask", async () => {
    let proposed = false;
    const { calls } = await mountStaff(<ExpulsionsScreen />, "WARDEN", {
      "GET /api/v1/hostel/expulsions": () => json({ items: proposed ? [expulsion("e1")] : [], canPropose: true, canDecide: false }),
      "GET /api/v1/hostel/boarders": () => json({ items: [{ allotmentId: "al1", membershipId: "m1", name: "ZZ Rohan", className: null, hostelId: "h1", hostelName: "ZZ Boys hostel", roomId: "r1", roomNumber: "12", bed: 2, fromDate: "2026-07-01", toDate: null, onLeave: false, feeDemandId: null }] }),
      "POST /api/v1/hostel/expulsions": () => {
        proposed = true;
        return json(expulsion("e1"));
      },
      "POST /api/v1/hostel/expulsions/e1/withdraw": () => json({ ok: true }),
    }, { me: atCollege("WARDEN") });
    expect(await screen.findByText("No expulsion proposed")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Propose an expulsion" }));
    await fireEvent.changeText(screen.getByLabelText("Boarder"), "roh");
    await fireEvent.press(await screen.findByText("ZZ Rohan"));
    await fireEvent.changeText(screen.getByLabelText("The reason"), "ZZ repeated ragging after a warning");
    await fireEvent.press(screen.getByRole("button", { name: "Send to the principal" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/hostel/expulsions")?.body).toMatchObject({ allotmentId: "al1", reason: "ZZ repeated ragging after a warning", incidentId: null }));
    expect(await screen.findByText("Proposed. The principal is told.")).toBeTruthy();
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw: ZZ Rohan" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/hostel/expulsions/e1/withdraw")).toBe(true));
    expect(await screen.findByText("Withdrawn.")).toBeTruthy();
  });

  it("the principal approves one with a note after one ask", async () => {
    const { calls } = await mountStaff(<ExpulsionsScreen />, "PRINCIPAL", {
      "GET /api/v1/hostel/expulsions": () => json({ items: [expulsion("e1")], canPropose: false, canDecide: true }),
      "POST /api/v1/hostel/expulsions/e1/decide": () => json({ ok: true }),
    }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText("With the principal")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Propose an expulsion" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Approve: ZZ Rohan" }));
    await fireEvent.changeText(screen.getByLabelText("Note (optional)"), "ZZ after the committee's hearing");
    await fireEvent.press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/hostel/expulsions/e1/decide")?.body).toEqual({ approve: true, note: "ZZ after the committee's hearing" }));
    expect(await screen.findByText("Decided.")).toBeTruthy();
  });
});

describe("the anti-ragging squad's rounds on the phone", () => {
  it("lists the rounds and the warden logs one, flagged", async () => {
    const { calls } = await mountStaff(<SquadRoundsScreen />, "WARDEN", {
      "GET /api/v1/hostel/squad-rounds": () => json({ items: [{ id: "q1", hostelId: "h1", hostelName: "ZZ Boys hostel", at: iso, members: "ZZ A, ZZ B", note: "", flagged: false }] }),
      "GET /api/v1/hostel/hostels": () => json({ hostels: [{ id: "h1", name: "ZZ Boys hostel", kind: "BOYS", capacity: 40, wardenMembershipId: "m1", wardenName: "ZZ Warden", messAttendance: false, beds: 40, occupied: 30, rooms: [] }], wardens: [], canManage: false, canAllot: true }),
      "POST /api/v1/hostel/squad-rounds": () => json({ id: "q2", hostelId: "h1", hostelName: "ZZ Boys hostel", at: iso, members: "ZZ A, ZZ C", note: "ZZ noise on the second floor", flagged: true }),
    }, { me: atCollege("WARDEN") });
    expect(await screen.findByText("Rounds (1)")).toBeTruthy();
    expect(screen.getByText("Nothing found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Log a round" }));
    await fireEvent.changeText(await screen.findByLabelText("Squad members"), "ZZ A, ZZ C");
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ noise on the second floor");
    await fireEvent.press(screen.getByRole("switch", { name: "Found something" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Log a round" })[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/hostel/squad-rounds")?.body).toMatchObject({ hostelId: "h1", members: "ZZ A, ZZ C", note: "ZZ noise on the second floor", flagged: true }));
    expect(await screen.findByText("The round is logged.")).toBeTruthy();
  });
});

describe("the college library for the desk", () => {
  it("shows each e-resource's open count and the borrowing terms", async () => {
    await mountStaff(<EResourcesScreen />, "LIBRARIAN", {
      "GET /api/v1/library/eresources": () => json({ items: [{ id: "e1", name: "ZZ N-LIST", url: "https://nlist.example", kind: "NLIST", clicks: 14, active: true }] }),
      "GET /api/v1/library/college-settings": () => json({ facultyLimit: 10, facultyLoanDays: 30, collegeStudentLimit: 3, collegeStudentLoanDays: 14, bookBankExtra: 2 }),
    }, { me: atCollege("LIBRARIAN") });
    expect(await screen.findByText("N-LIST · 14 opens")).toBeTruthy();
    expect(await screen.findByText("10 books for 30 days")).toBeTruthy();
    expect(screen.getByText("2 extra books")).toBeTruthy();
  });
});

describe("things issued to me, the stream records and the office's reads", () => {
  it("lists what is issued to me, the assets in my care and my asks", async () => {
    await mountStaff(<MyItemsScreen />, "TEACHER", { "GET /api/v1/account/inventory": () => json({ issued: [{ itemCode: "CHK", itemName: "ZZ Chalk", unit: "box", quantity: 2 }], assets: [{ tagNumber: "ZZ-PRJ-01", name: "ZZ Projector", location: "ZZ Room 4", condition: "GOOD" }], requests: [{ id: "r1", requesterMembershipId: "m1", requesterName: "ZZ Head", itemCode: "DUS", itemName: "ZZ Duster", quantity: 1, note: "", status: "PENDING", decisionNote: null, decidedAt: null, createdAt: iso }], items: [] }) }, { me: { ...me("TEACHER"), modules: ["INVENTORY"] } });
    expect(await screen.findByText("ZZ Chalk")).toBeTruthy();
    expect(screen.getByText("ZZ Projector")).toBeTruthy();
    expect(screen.getByText("Good")).toBeTruthy();
    expect(screen.getByText("1 × ZZ Duster")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
  });

  it("the stream records draw only the records the college's streams bring", async () => {
    const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
    await mountStaff(<StreamRecordsScreen />, "ADMIN", {
      "GET /api/v1/stream-records/summary": () => json({ year: 2026, streams: ["SCIENCE"], labs: true, law: false, education: false, practical: { year: 2026, records: 120, signed: 100, unsigned: 20, students: 60, offerings: 4, batches: 6, batchMembers: 60, byCourse: [{ courseCode: "ZZ101", courseName: "ZZ Physics lab", records: 120, signed: 100, students: 60 }] }, lawInternships: { year: 2026, internships: 0, byKind: { COURT: 0, FIRM: 0, LEGAL_AID: 0 }, weeks: 0, students: 0, meetingMinimum: 0, perStudent: [], mootCourts: { total: 0, INTRA: 0, INTER: 0, NATIONAL: 0, participants: 0 } }, teachingPractice: { year: 2026, practiceSchools: 0, postings: 0, students: 0, lessonsPlanned: 0, lessonsObserved: 0, weeks: 0, minimumWeeks: 20, meetingMinimum: 0, bySchool: [], perStudent: [] }, corps: { year: 2026, nss: corps, ncc: corps, hoursPerYear: 120 } }),
    }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("Labs and the practical record")).toBeTruthy();
    expect(screen.getByText("ZZ101 · ZZ Physics lab")).toBeTruthy();
    expect(screen.queryByText("Moot courts and law internships")).toBeNull();
    expect(screen.queryByText("NSS and NCC")).toBeNull();
  });

  it("transport, alumni, the hostel, academics and the admission rounds read at a glance", async () => {
    await mountStaff(<OfficeTransportScreen />, "ADMIN", { "GET /api/v1/admin/transport": () => json({ todayKey: "2026-10-10", settings: { showDriverToParents: false }, routes: [{ id: "rt1", name: "ZZ Route 1", direction: "BOTH", active: true, note: "", stops: [{ id: "st1", order: 1, name: "ZZ Corner", lat: 18.5, lng: 73.8, morningMinute: 420, eveningMinute: null, radiusM: 100 }], riders: 18 }], buses: [{ id: "b1", registration: "MH 12 ZZ 0001", capacity: 40, note: "", active: true }], assignments: [{ id: "as1", busId: "b1", busRegistration: "MH 12 ZZ 0001", routeId: "rt1", routeName: "ZZ Route 1", driverMembershipId: "d1", driverName: "ZZ Driver", attendantMembershipId: null, attendantName: null, fromDateKey: "2026-07-01", toDateKey: null, current: true }], drivers: [], feeHeads: [], canEdit: true }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("ZZ Route 1")).toBeTruthy();
    expect(screen.getByText(/18 riding/)).toBeTruthy();
    expect(screen.getByText(/Driver: ZZ Driver/)).toBeTruthy();

    await mountStaff(<OfficeAlumniScreen />, "PRINCIPAL", { "GET /api/v1/admin/alumni": () => json({ feedMode: "READ", batches: [{ year: 2024, count: 30, listed: 12 }], alumni: [{ membershipId: "a1", userId: "u9", name: "ZZ Alumnus", batchYear: 2024, lastClass: null, isMinor: false, listed: true, mentor: true, muted: false, muteReason: null }], notes: [] }) }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText("Batch of 2024")).toBeTruthy();
    expect(screen.getByText("30 alumni, 12 in the directory")).toBeTruthy();
    expect(screen.getByText("1 mentors · 0 paused")).toBeTruthy();

    await mountStaff(<OfficeHostelScreen />, "ADMIN", { "GET /api/v1/hostel/overview": () => json({ dateKey: "2026-10-10", hostels: [{ id: "h1", name: "ZZ Boys hostel", beds: 40, occupied: 30 }], leaveToday: [], outNow: 2, pendingLeave: 1, lateReturns: [], absentees: [{ hostelName: "ZZ Boys hostel", dateKey: "2026-10-09", slot: "NIGHT", name: "ZZ Rohan", roomNumber: "12" }], visitorsToday: 0 }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("30 of 40 beds taken")).toBeTruthy();
    expect(screen.getByText("ZZ Rohan")).toBeTruthy();

    await mountStaff(<OfficeAcademicsScreen />, "ADMIN", { "GET /api/v1/academics/structure": () => json({ settings: { loadMinHours: 8, loadMaxHours: 20, studentsPerFaculty: 20, menteesPerMentor: 25 }, departments: [{ id: "c1aaaaaaaaaaaaaaaaaaaaaa", code: "PHY", name: "ZZ Physics", hodMembershipId: null, hodName: null, condoneFloorPercent: 65, faculty: 6, students: 120 }], programmes: [{ id: "c2aaaaaaaaaaaaaaaaaaaaaa", departmentId: "c1aaaaaaaaaaaaaaaaaaaaaa", code: "BSCPHY", name: "ZZ BSc Physics", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", attendanceThreshold: 75, exitPoints: [], stream: "SCIENCE" }], programmeOutcomes: [], schemes: [], courses: [], terms: [{ id: "c3aaaaaaaaaaaaaaaaaaaaaa", name: "ZZ Odd semester", academicYear: "2026-27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-06-15", registrationClosesOn: "2026-07-15", registrationOpen: true }], rooms: [], divisions: [], periods: [], faculty: [], canEdit: true }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("PHY · ZZ Physics")).toBeTruthy();
    expect(screen.getByText(/No head named · 6 faculty · 120 students/)).toBeTruthy();
    expect(screen.getByText(/Undergraduate · 3 years · intake 60/)).toBeTruthy();
    expect(screen.getByText("Registration open")).toBeTruthy();

    await mountStaff(<OfficeAdmissionsScreen />, "ADMIN", { "GET /api/v1/college/admissions/rounds": () => json({ rounds: [{ id: "rd1", programmeId: null, intakeYear: 2026, kind: "CAP_1", name: "ZZ CAP 1", opensAt: iso, closesAt: iso, seats: { OPEN: 30 }, status: "OPEN", allotments: 25, applications: 40, admitted: 20 }] }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("ZZ CAP 1")).toBeTruthy();
    expect(screen.getByText(/CAP round 1 · Intake year 2026/)).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
  });

  it("each read says its module is off where the college has it off", async () => {
    await mountStaff(<OfficeTransportScreen />, "ADMIN", {}, { me: atCollege("ADMIN", ["ACADEMICS"]) });
    expect(await screen.findByText("Transport is not switched on")).toBeTruthy();
  });
});
