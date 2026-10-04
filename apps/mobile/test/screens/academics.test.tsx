import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { FacultyHomeScreen } from "@/screens/academics/faculty";
import { LectureScreen } from "@/screens/academics/lecture";
import { OfferingScreen } from "@/screens/academics/offering";
import { MentoringScreen } from "@/screens/academics/mentoring";
import { HodHomeScreen } from "@/screens/academics/hod";
import { StudentAcademicsScreen } from "@/screens/academics/student";
import { RegistrationScreen } from "@/screens/academics/registration";
import { FamilyAcademicsScreen } from "@/screens/academics/family";
import { clock, projectionText, standingText } from "@/screens/academics/words";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { json, me, mountStaff, offline } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const LECTURE = id("zzlecture1");
const OFFERING = id("zzoffering1");
const TERM = id("zzterm1");
const S1 = id("zzstudent1");
const S2 = id("zzstudent2");
const COMP = id("zzcomponent1");
const GROUP = id("zzgroup1");
const COND = id("zzcondonation1");
const meAs = (role: RoleCode, modules: string[] = ["ACADEMICS"]) => ({ ...me(role), modules, institutionKind: "COLLEGE" });
const term = { id: TERM, name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: true };
const settings = { loadMinHours: 4, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 };
const lectureRow = { lectureId: LECTURE, offeringId: OFFERING, dateKey: "2026-10-05", startMinute: 540, endMinute: 590, kind: "LECTURE", courseCode: "PHY101", courseName: "ZZ Mechanics", divisionName: "ZZ FY A", roomName: "ZZ Room 101", registered: 2, marked: 0, substitute: false };
const offeringRow = { offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", divisionName: "ZZ FY A", registered: 2, planned: 12, taught: 6, behind: false, components: 2, moderated: 2, released: 1, locked: false, defaulters: 1 };
const attendance = (extra: Record<string, unknown> = {}) => ({ offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", held: 20, attended: 13, percent: 65, threshold: 75, remaining: 10, canMiss: -2, condoned: false, eligible: false, ...extra });
const registration = (extra: Record<string, unknown> = {}) => ({
  studentMembershipId: S1,
  name: "ZZ Ishaan",
  programme: { code: "BSCPHY", name: "ZZ BSc Physics", schemeName: "ZZ NEP 2024", semester: 1, yearOfStudy: 1, divisionName: "ZZ FY A", rollNumber: 1, prn: "ZZV2026001" },
  term,
  open: true,
  lateUntil: null,
  minCredits: 14,
  maxCredits: 26,
  chosenCredits: 4,
  offerings: [
    { offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", kind: "CORE", credits: 4, facultyName: "ZZ Neha", divisionName: "ZZ FY A", seatsLeft: null, chosen: true, required: true },
    { offeringId: id("zzoffering3"), courseCode: "PHY103", courseName: "ZZ Electronics", kind: "ELECTIVE", credits: 3, facultyName: "ZZ Medha", divisionName: null, seatsLeft: 27, chosen: false, required: false },
  ],
  exitPoints: [],
  creditsEarned: 0,
  ...extra,
});
const condonation = (status = "ASKED") => ({ id: COND, studentMembershipId: S2, studentName: "ZZ Omkar", termId: TERM, termName: "ZZ Odd term", offeringId: OFFERING, courseCode: "PHY101", ground: "MEDICAL", note: "ZZ Dengue", hasDocument: false, documentFileId: null, status, percent: 65, floor: 65, createdAt: "2026-10-01T05:00:00.000Z", decidedAt: null, decisionNote: null });

beforeEach(() => mockPush.mockClear());

describe("the academics helpers", () => {
  it("say the time, the projection and the standing", () => {
    const t = (k: string, v?: Record<string, string | number>) => `${k}${v ? JSON.stringify(v) : ""}`;
    expect(clock(540, 590)).toBe("09:00–09:50");
    expect(projectionText(t as never, { canMiss: 3, remaining: 8, held: 12 })).toContain("projectionMiss");
    expect(projectionText(t as never, { canMiss: 0, remaining: 8, held: 12 })).toContain("projectionNoMore");
    expect(projectionText(t as never, { canMiss: -2, remaining: 8, held: 12 })).toContain("projectionShort");
    expect(projectionText(t as never, { canMiss: 0, remaining: 0, held: 0 })).toContain("projectionNone");
    expect(standingText(t as never, { condoned: true, eligible: true, threshold: 75, percent: 60 })).toBe("academics.condoned");
    expect(standingText(t as never, { condoned: false, eligible: true, threshold: 75, percent: null })).toBe("academics.notYet");
  });
});

describe("a faculty member's day on the phone (4 Oct 2026)", () => {
  it("shows today's lectures and my courses, and opens a lecture to mark", async () => {
    await mountStaff(<FacultyHomeScreen />, "FACULTY", { "GET /api/v1/academics/faculty-home": () => json({ name: "ZZ Neha", departmentName: "ZZ Physics", term, today: { dateKey: "2026-10-05", closed: false, lectures: [lectureRow] }, offerings: [offeringRow], hours: 10, settings, mentoringGroups: 1, toModerate: [{ componentId: COMP, offeringId: OFFERING, courseCode: "CHE101", name: "ZZ Unit test", facultyName: "ZZ Samir" }] }) }, { me: meAs("FACULTY") });
    expect(await screen.findByText("09:00–09:50 · PHY101")).toBeTruthy();
    expect(screen.getByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.getByText("CHE101 · ZZ Unit test")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Mark the lecture" }));
    expect(mockPush).toHaveBeenCalledWith(`/(app)/lecture?id=${LECTURE}`);
    await userEvent.setup().press(screen.getByText("PHY101 · ZZ Mechanics"));
    expect(mockPush).toHaveBeenCalledWith(`/(app)/offering?id=${OFFERING}`);
  });

  it("says the module is off when the college has it off", async () => {
    await mountStaff(<FacultyHomeScreen />, "FACULTY", {}, { me: meAs("FACULTY", []) });
    expect(await screen.findByText(/is not switched on$/)).toBeTruthy();
  });
});

describe("marking a lecture", () => {
  beforeEach(() => __setOutboxStore(memoryOutbox()));
  afterEach(() => __setOutboxStore(null));
  const sheet = { lecture: lectureRow, threshold: 75, canMark: true, entries: [{ studentMembershipId: S1, name: "ZZ Ishaan", rollNumber: 1, status: null, percent: 90 }, { studentMembershipId: S2, name: "ZZ Omkar", rollNumber: 2, status: null, percent: 65 }] };

  it("sends the marks with a device client id", async () => {
    const { calls } = await mountStaff(<LectureScreen lectureId={LECTURE} />, "FACULTY", { [`GET /api/v1/academics/lectures/${LECTURE}`]: () => json(sheet), [`POST /api/v1/academics/lectures/${LECTURE}/attendance`]: () => json({ lectureId: LECTURE, present: 1, absent: 1, late: 0, replay: false, noticesSent: 0 }) }, { me: meAs("FACULTY") });
    expect(await screen.findByText("Register: 2 students")).toBeTruthy();
    const user = userEvent.setup();
    await user.press(screen.getAllByRole("radio", { name: "Absent" })[1]!);
    await user.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("The lecture is marked.")).toBeTruthy();
    const body = calls().find((c) => c.line.startsWith("POST"))?.body as { clientId: string; entries: { status: string }[] };
    expect(body.clientId.length).toBeGreaterThan(6);
    expect(body.entries.map((e) => e.status)).toEqual(["PRESENT", "ABSENT"]);
  });

  it("keeps the marks in the outbox with no signal", async () => {
    await mountStaff(<LectureScreen lectureId={LECTURE} />, "FACULTY", { [`GET /api/v1/academics/lectures/${LECTURE}`]: () => json(sheet), [`POST /api/v1/academics/lectures/${LECTURE}/attendance`]: offline }, { me: meAs("FACULTY") });
    await userEvent.setup().press(await screen.findByRole("button", { name: "Save" }));
    await waitFor(async () => expect((await listQueued(`lecture:${LECTURE}`)).length).toBe(1));
  });
});

describe("a course I teach", () => {
  const file = { offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", facultyName: "ZZ Neha", outcomes: [{ code: "CO1", text: "ZZ Apply laws" }], plan: [{ week: 1, topic: "ZZ Units", coCodes: ["CO1"], taughtOn: "2026-07-20" }], taught: 1, expected: 3, behind: true, termElapsedPercent: 60, items: [{ id: id("zzitem1"), kind: "LINK", title: "ZZ Notes", url: "https://example.org/zz", fileId: null, coCodes: ["CO1"], createdAt: "2026-08-01T05:00:00.000Z" }], review: null, attainment: { targetPercent: 60, cos: [{ code: "CO1", text: "ZZ Apply laws", assessed: 3, reached: 2, direct: 2, indirect: null, level: 2 }], pos: [] }, canEdit: true, canReview: false };
  const internal = { offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", internalMax: 40, weightTotal: 40, components: [{ id: COMP, name: "ZZ Unit test", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: ["CO1"], enteredCount: 2, moderated: false, moderatedByName: null, released: false }], students: [{ studentMembershipId: S1, name: "ZZ Ishaan", rollNumber: 1, marks: { [COMP]: 18 }, total: 18 }, { studentMembershipId: S2, name: "ZZ Omkar", rollNumber: 2, marks: {}, total: null }], locked: null, canEnter: true, canModerate: true, canRelease: false, canLock: false };

  it("reads the course file: the plan, its resources and the attainment", async () => {
    await mountStaff(<OfferingScreen offeringId={OFFERING} />, "FACULTY", { [`GET /api/v1/academics/offerings/${OFFERING}/course-file`]: () => json(file) }, { me: meAs("FACULTY") });
    expect(await screen.findByText("Week 1 · ZZ Units")).toBeTruthy();
    expect(screen.getByText("ZZ Notes")).toBeTruthy();
    expect(screen.getByText("Two or more weeks behind the term")).toBeTruthy();
  });

  it("enters a component's marks and countersigns", async () => {
    const { calls } = await mountStaff(
      <OfferingScreen offeringId={OFFERING} initialTab="marks" />,
      "FACULTY",
      {
        [`GET /api/v1/academics/offerings/${OFFERING}/course-file`]: () => json(file),
        [`GET /api/v1/academics/offerings/${OFFERING}/internal`]: () => json(internal),
        [`POST /api/v1/academics/offerings/${OFFERING}/internal/marks`]: () => json({ saved: 1, skipped: [] }),
        [`POST /api/v1/academics/internal/components/${COMP}/moderate`]: () => json({ changed: true }),
      },
      { me: meAs("FACULTY") },
    );
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("2 ZZ Omkar"), "12.5");
    await user.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Marks saved.")).toBeTruthy();
    expect(calls().find((c) => c.line.endsWith("/internal/marks"))?.body).toEqual({ componentId: COMP, entries: [{ studentMembershipId: S2, marks: 12.5 }] });
    await user.press(screen.getByRole("button", { name: "Countersign" }));
    expect(await screen.findByText("Countersigned.")).toBeTruthy();
  });
});

describe("mentoring", () => {
  it("writes a note on a mentee with a flag", async () => {
    const { calls } = await mountStaff(
      <MentoringScreen />,
      "FACULTY",
      {
        "GET /api/v1/academics/mentoring": () => json({ groups: [{ id: GROUP, name: "ZZ FY mentees", termId: TERM, facultyMembershipId: id("zzfaculty1"), facultyName: "ZZ Neha", members: [{ studentMembershipId: S2, name: "ZZ Omkar", flag: "SLOW" }], notes: [] }], canOrganise: false }),
        "POST /api/v1/academics/mentoring/notes": () => json({ id: id("zznote1") }),
      },
      { me: meAs("FACULTY") },
    );
    const user = userEvent.setup();
    expect(await screen.findByText("ZZ FY mentees")).toBeTruthy();
    await user.press(screen.getByRole("radio", { name: "Referred to counselling" }));
    await user.type(screen.getByLabelText("A note"), "ZZ Met after class");
    await user.press(screen.getByRole("button", { name: "Add note" }));
    expect(await screen.findByText("Note saved.")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("POST"))?.body).toEqual({ groupId: GROUP, studentMembershipId: S2, note: "ZZ Met after class", flag: "COUNSELLING" });
  });
});

describe("the HOD's department", () => {
  it("lists the department's courses and decides a condonation", async () => {
    const { calls } = await mountStaff(
      <HodHomeScreen />,
      "HOD",
      {
        "GET /api/v1/academics/hod-home": () => json({ department: { id: id("zzdept1"), code: "PHY", name: "ZZ Physics" }, term, load: [], ratio: [], offerings: [{ ...offeringRow, facultyName: "ZZ Neha" }], defaulters: 1, condonationsWaiting: 1, mentoringGroups: 1, mentees: 3, resultsAvailable: false, projects: [] }),
        "GET /api/v1/academics/condonations": () => json({ items: [condonation()], canDecide: true }),
        [`POST /api/v1/academics/condonations/${COND}/decide`]: () => json(condonation("HOD_APPROVED")),
      },
      { me: meAs("HOD") },
    );
    expect(await screen.findByText("ZZ Physics")).toBeTruthy();
    expect(await screen.findByText("ZZ Dengue")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Decision recorded.")).toBeTruthy();
    expect(calls().find((c) => c.line.endsWith("/decide"))?.body).toEqual({ decision: "APPROVE", note: "" });
  });
});

describe("a student's academics", () => {
  const mine = { registration: registration(), today: [], week: { termId: TERM, termName: "ZZ Odd term", weekdays: [1, 2, 3, 4, 5, 6], periods: [], cells: [] }, attendance: [attendance()], condonations: [], marks: [{ offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", components: [{ name: "ZZ Unit test", kind: "UNIT_TEST", maxMarks: 20, weight: 20, marks: 11 }] }], mentor: { groupName: "ZZ FY mentees", facultyName: "ZZ Neha" } };

  it("shows attendance with the projection and asks for condonation", async () => {
    const { calls } = await mountStaff(<StudentAcademicsScreen />, "STUDENT", { "GET /api/v1/academics/mine": () => json(mine), "POST /api/v1/academics/condonations": () => json(condonation()) }, { me: meAs("STUDENT") });
    expect(await screen.findByText("PHY101 · 65%")).toBeTruthy();
    expect(screen.getByText(/2 short even attending every one left/)).toBeTruthy();
    expect(screen.getByText("ZZ Unit test")).toBeTruthy();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("What happened"), "ZZ Dengue in August");
    await user.press(screen.getByRole("button", { name: "Ask for condonation" }));
    expect(await screen.findByText("Your request is with your head of department.")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("POST"))?.body).toEqual({ termId: TERM, offeringId: null, ground: "MEDICAL", note: "ZZ Dengue in August", documentFileId: null });
  });

  it("registers on an elective within the window", async () => {
    const { calls } = await mountStaff(<RegistrationScreen />, "STUDENT", { "GET /api/v1/academics/registration": () => json(registration()), "POST /api/v1/academics/registration": () => json(registration({ chosenCredits: 7 })) }, { me: meAs("STUDENT") });
    const user = userEvent.setup();
    await user.press(await screen.findByRole("switch", { name: "PHY103 · ZZ Electronics" }));
    await user.press(screen.getByRole("button", { name: "Save my registration" }));
    expect(await screen.findByText("Registration saved.")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("POST"))?.body).toEqual({ termId: TERM, offeringIds: [id("zzoffering3")] });
  });
});

describe("a guardian's view", () => {
  const PARENT = { ...meAs("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null }, contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }] };
  it("says when an adult has not shared attendance, and shows it when they have", async () => {
    let allowed = false;
    await mountStaff(<FamilyAcademicsScreen />, "PARENT", { "GET /api/v1/academics/family": () => json({ children: [{ studentMembershipId: S2, name: "ZZ Ananya" }], childId: S2, allowed, attendance: allowed ? [attendance({ percent: 85, attended: 17, eligible: true, canMiss: 1 })] : [] }) }, { me: PARENT });
    expect(await screen.findByText("Not shared with you")).toBeTruthy();
    allowed = true;
    await userEvent.setup().press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("PHY101 · 85%")).toBeTruthy();
  });
});
