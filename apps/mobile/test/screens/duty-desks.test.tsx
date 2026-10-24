import { fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { CorpsScreen, ExamSquadScreen, LabDeskScreen, PracticalsScreen, ResearchDeskScreen, TeachingPracticeScreen } from "@/screens/college/duty-desks";
import { DUTY_SCREENS, DutyCard } from "@/screens/college/duties";
import { todayKey } from "@/screens/teacher/support";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff, refused } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * The duties' desks on the phone (S2, 5 Oct 2026): the lab in-charge, the
 * practical record, teaching practice, the NSS and NCC units, the research
 * dean and the exam flying squad — each drawn from a mocked answer, refused
 * without the duty (asking nothing of the server), each write's body, and the
 * More entries that show only with the duty.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const meAs = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS", "IQAC", "EXAMS"], institutionKind: "COLLEGE", streams: ["ARTS", "SCIENCE", "EDUCATION"], ...extra });
const gets = (calls: () => { line: string }[], prefix: string) => calls().filter((c) => c.line.startsWith(`GET ${prefix}`)).length;

const student = (n: number, name: string) => ({ studentMembershipId: id(`stu${n}`), name, rollNumber: n });
const row = (n: number, studentN: number, studentName: string, experimentNo: number, extra: Record<string, unknown> = {}) => ({
  id: id(`rec${n}`),
  studentMembershipId: id(`stu${studentN}`),
  studentName,
  experimentNo,
  title: "ZZ Ohm's law",
  performedOn: "2026-09-30",
  marks: 8,
  signed: false,
  signedByName: null,
  signedAt: null,
  ...extra,
});

const labDesk = {
  inventoryOn: true,
  labs: [{ roomId: id("room1"), name: "ZZ Physics Lab", capacity: 30, stock: [{ itemCode: "BEAKER", itemName: "ZZ Beaker", unit: "pcs", quantity: 40 }], assets: [{ tagNumber: "ZZ-OSC-1", name: "ZZ Oscilloscope", status: "IN_USE", condition: "GOOD" }] }],
  divisions: [{ divisionId: id("div1"), name: "ZZ BSc I A", programmeCode: "BSCPHY", yearOfStudy: 1, academicYear: "2026–27", students: 2, batches: [{ id: id("bat1"), name: "A", capacity: 20, members: [{ studentMembershipId: id("stu1"), name: "ZZ Asha", rollNumber: 1 }] }], unbatched: [] }],
  toSign: [
    { ...row(1, 1, "ZZ Asha", 1), offeringId: id("off1"), courseCode: "PHY101" },
    { ...row(2, 2, "ZZ Bilal", 1), offeringId: id("off1"), courseCode: "PHY101" },
  ],
  breakages: [{ id: id("brk1"), at: "2026-10-01T10:00:00.000Z", itemCode: "BEAKER", itemName: "ZZ Beaker", quantity: 2, location: "ZZ Physics Lab", note: "ZZ dropped", byName: "ZZ Neha" }],
};

describe("the lab in-charge's desk", () => {
  it("shows the labs with their stock, the batch rosters and the breakages, and signs the ticked rows", async () => {
    const { calls } = await mountStaff(<LabDeskScreen />, "FACULTY", { "GET /api/v1/duties/lab": () => json(labDesk), "POST /api/v1/stream-records/practicals/sign": () => json({ count: 1 }) }, { me: meAs("FACULTY", { duties: ["LAB_INCHARGE"] }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ Physics Lab · 30 seats")).toBeTruthy();
    expect(screen.getByText("ZZ Beaker (BEAKER): 40 pcs\nZZ-OSC-1 · ZZ Oscilloscope")).toBeTruthy();
    expect(screen.getByText("Batch A: ZZ Asha")).toBeTruthy();
    expect(screen.getByText("ZZ Beaker (BEAKER) · 2")).toBeTruthy();
    const bilal = "PHY101 · exp. 1, ZZ Ohm's law · ZZ Bilal · 30/09/2026";
    await userEvent.setup().press(screen.getByRole("checkbox", { name: bilal }));
    await fireEvent.press(screen.getByRole("button", { name: "Sign the ticked rows" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/stream-records/practicals/sign")?.body).toEqual({ recordIds: [id("rec1")] }));
    await waitFor(() => expect(gets(calls, "/api/v1/duties/lab")).toBe(2));
    await fireEvent.press(screen.getByRole("button", { name: "Open the practical record" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/practicals");
  });

  // R-24 (risks batch, 5 Oct 2026): a division says the day a re-split made now would take effect, when the read carries it.
  it("says from which day a change to a division's batches applies", async () => {
    const divs = [{ ...labDesk.divisions[0], changesFrom: "2026-10-06" }, { ...labDesk.divisions[0], divisionId: id("div2"), name: "ZZ BSc I B", changesFrom: null }];
    await mountStaff(<LabDeskScreen />, "FACULTY", { "GET /api/v1/duties/lab": () => json({ ...labDesk, divisions: divs }) }, { me: meAs("FACULTY", { duties: ["LAB_INCHARGE"] }) });
    expect(await screen.findByText("Batch A: ZZ Asha\nA change made now applies from 06/10/2026; the lab already marked keeps the batches it was marked with.")).toBeTruthy();
    expect(screen.getByText("Batch A: ZZ Asha\nNo batch lab is marked yet, so a change applies from the start.")).toBeTruthy();
  });

  it("lets the office read the rows without signing, and refuses a teacher without the duty", async () => {
    await mountStaff(<LabDeskScreen />, "ADMIN", { "GET /api/v1/duties/lab": () => json({ ...labDesk, inventoryOn: false, labs: [], divisions: [], breakages: [] }) }, { me: meAs("ADMIN") });
    expect(await screen.findByText("PHY101 · exp. 1, ZZ Ohm's law · ZZ Asha · 30/09/2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign the ticked rows" })).toBeNull();
    expect(screen.getByText("The college does not keep its stores in the app, so breakages are not written off here.")).toBeTruthy();
    const { calls } = await mountStaff(<LabDeskScreen />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["NSS_OFFICER"] }) });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
    expect(gets(calls, "/api/v1/duties")).toBe(0);
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });

  it("says the module is off, and shows the server's refusal", async () => {
    await mountStaff(<LabDeskScreen />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["LAB_INCHARGE"], modules: ["IQAC"] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    await mountStaff(<LabDeskScreen />, "PRINCIPAL", { "GET /api/v1/duties/lab": refused("ZZ the desk is closed", 403) }, { me: meAs("PRINCIPAL") });
    expect(await screen.findByText("ZZ the desk is closed")).toBeTruthy();
  });
});

const sheet = (offeringId: string, extra: Record<string, unknown> = {}) => ({
  offerings: [
    { offeringId: id("off1"), courseCode: "PHY101", courseName: "ZZ Mechanics", divisionName: "ZZ A", facultyName: "ZZ Neha", practicalHours: 2, mine: true },
    { offeringId: id("off2"), courseCode: "CHE101", courseName: "ZZ Chemistry", divisionName: null, facultyName: "ZZ Ravi", practicalHours: 2, mine: false },
  ],
  offeringId,
  students: [{ ...student(1, "ZZ Asha"), batchName: "A" }, { ...student(2, "ZZ Bilal"), batchName: null }],
  records: [row(1, 1, "ZZ Asha", 1, { signed: true, signedByName: "ZZ Neha", signedAt: "2026-10-01T10:00:00.000Z" }), row(2, 2, "ZZ Bilal", 1, { marks: null })],
  canWrite: true,
  canSign: true,
  ...extra,
});

describe("the practical record", () => {
  it("shows the record by student, opens another course, records an experiment for the ticked students and signs", async () => {
    const { calls } = await mountStaff(
      <PracticalsScreen />,
      "FACULTY",
      {
        "GET /api/v1/stream-records/practicals": ({ url }) => json(sheet(url.searchParams.get("offeringId") ?? id("off1"))),
        "POST /api/v1/stream-records/practicals": () => json({ count: 1 }),
        "POST /api/v1/stream-records/practicals/sign": () => json({ count: 1 }),
      },
      { me: meAs("FACULTY") },
    );
    expect(await screen.findByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.getByText("1 · ZZ Asha · Batch A")).toBeTruthy();
    expect(screen.getByText("Exp. 1: 8 · Signed by ZZ Neha")).toBeTruthy();
    expect(screen.getByText("Exp. 1: ✓")).toBeTruthy();
    expect(screen.getByLabelText("Experiment number")).toHaveDisplayValue("2");
    // The record of one experiment: a title, Bilal unticked, a mark for Asha.
    await fireEvent.changeText(screen.getByLabelText("Experiment"), "ZZ Pendulum");
    await fireEvent.changeText(screen.getByLabelText("Marks for ZZ Asha"), "9");
    await fireEvent.press(screen.getByRole("checkbox", { name: "ZZ Bilal" }));
    await fireEvent.press(screen.getByRole("button", { name: "Record the experiment" }));
    await waitFor(() =>
      expect(calls().find((c) => c.line === "POST /api/v1/stream-records/practicals")?.body).toEqual({ offeringId: id("off1"), experimentNo: 2, title: "ZZ Pendulum", performedOn: todayKey(), entries: [{ studentMembershipId: id("stu1"), marks: 9 }] }),
    );
    // Bilal's unsigned row is the one to sign.
    await fireEvent.press(screen.getByRole("button", { name: "Sign the ticked rows" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/stream-records/practicals/sign")?.body).toEqual({ recordIds: [id("rec2")] }));
    await fireEvent.press(screen.getByRole("radio", { name: "CHE101" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/stream-records/practicals?offeringId=${id("off2")}`)).toBe(true));
  });

  it("holds the form back on a mark above 100, and hides the forms the sheet does not grant", async () => {
    await mountStaff(<PracticalsScreen />, "FACULTY", { "GET /api/v1/stream-records/practicals": () => json(sheet(id("off1"))) }, { me: meAs("FACULTY") });
    await fireEvent.changeText(await screen.findByLabelText("Marks for ZZ Bilal"), "120");
    expect(screen.getByText("Marks are a whole number from 0 to 100.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record the experiment" })).toBeDisabled();
    await mountStaff(<PracticalsScreen />, "PRINCIPAL", { "GET /api/v1/stream-records/practicals": () => json(sheet(id("off1"), { canWrite: false, canSign: false })) }, { me: meAs("PRINCIPAL") });
    expect(await screen.findByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record the experiment" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign the ticked rows" })).toBeNull();
  });

  it("says when there is no course with practicals, and refuses a student", async () => {
    await mountStaff(<PracticalsScreen />, "HOD", { "GET /api/v1/stream-records/practicals": () => json({ offerings: [], offeringId: null, students: [], records: [], canWrite: false, canSign: false }) }, { me: meAs("HOD") });
    expect(await screen.findByText("No course with practicals")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to my teaching" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)");
    const { calls } = await mountStaff(<PracticalsScreen />, "STUDENT", {}, { me: meAs("STUDENT") });
    expect(await screen.findByText("This is for the course's teacher, the head of its department or a lab in-charge.")).toBeTruthy();
    expect(gets(calls, "/api/v1/stream-records")).toBe(0);
  });
});

const summary = { year: 2026, practiceSchools: 1, postings: 1, students: 1, lessonsPlanned: 20, lessonsObserved: 1, weeks: 4, minimumWeeks: 20, meetingMinimum: 0, bySchool: [], perStudent: [] };
const practice = {
  offered: true,
  canManage: true,
  canObserve: true,
  schools: [{ id: id("sch1"), name: "ZZ Model School", udise: "27000000001", contact: "ZZ Head", postings: 1 }],
  postings: [
    {
      id: id("pst1"),
      studentMembershipId: id("stu1"),
      studentName: "ZZ Asha",
      practiceSchoolId: id("sch1"),
      practiceSchoolName: "ZZ Model School",
      from: "2026-01-05",
      to: "2099-12-31",
      weeks: 4,
      lessonsPlanned: 20,
      observations: [{ id: id("obs1"), at: "2026-09-15", observerName: "ZZ Neha", grade: "B", note: "ZZ steady" }],
    },
  ],
  students: [],
  summary,
};

describe("teaching practice", () => {
  it("shows the schools and postings, and records a watched lesson", async () => {
    const { calls } = await mountStaff(
      <TeachingPracticeScreen />,
      "FACULTY",
      { "GET /api/v1/duties/teaching-practice": () => json(practice), [`POST /api/v1/duties/teaching-practice/postings/${id("pst1")}/observations`]: () => json({ id: id("obs2") }) },
      { me: meAs("FACULTY", { duties: ["PRACTICE_TEACHING_COORDINATOR"] }) },
    );
    expect(await screen.findByText("ZZ Asha · ZZ Model School")).toBeTruthy();
    expect(screen.getByText("UDISE 27000000001 · ZZ Head · 1 postings")).toBeTruthy();
    expect(screen.getByText("15/09/2026, watched by ZZ Neha · Grade B · ZZ steady")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "A" }));
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ confident");
    await fireEvent.press(screen.getByRole("button", { name: "Record the lesson: ZZ Asha" }));
    await waitFor(() => expect(calls().find((c) => c.line.startsWith("POST /api/v1/duties/teaching-practice"))?.body).toEqual({ at: todayKey(), grade: "A", note: "ZZ confident" }));
    await waitFor(() => expect(gets(calls, "/api/v1/duties/teaching-practice")).toBe(2));
  });

  it("reads without forms for the head, says when the college has no education stream, and refuses without the duty", async () => {
    await mountStaff(<TeachingPracticeScreen />, "PRINCIPAL", { "GET /api/v1/duties/teaching-practice": () => json({ ...practice, offered: false, canManage: false, canObserve: false, postings: [], schools: [] }) }, { me: meAs("PRINCIPAL") });
    expect(await screen.findByText("Teaching practice is kept by a college with the education stream; yours has none.")).toBeTruthy();
    expect(screen.getByText("The coordinator posts student teachers here.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Record the lesson/ })).toBeNull();
    await mountStaff(<TeachingPracticeScreen />, "HOD", {}, { me: meAs("HOD", { duties: ["LAB_INCHARGE"] }) });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
  });
});

const corpsDesk = (corps: "NSS" | "NCC", extra: Record<string, unknown> = {}) => ({
  corps,
  year: 2026,
  canEdit: true,
  enrolled: [
    { studentMembershipId: id("stu1"), name: "ZZ Asha", unit: "ZZ Unit 1", enrolledOn: "2026-07-01", hours: 120 },
    { studentMembershipId: id("stu2"), name: "ZZ Bilal", unit: "", enrolledOn: "2026-07-02", hours: 10 },
  ],
  students: [],
  activities: [{ id: id("act1"), title: "ZZ Tree planting", at: "2026-08-15", hours: 4, camp: true, participants: 2 }],
  summary: { enrolled: 2, activities: 1, camps: 1, participations: 2, students: 2, hours: 8, perStudent: [] },
  hoursPerYear: 120,
  ...extra,
});

describe("the NSS and NCC units", () => {
  it("shows the volunteers with their hours and the activities, and records an activity", async () => {
    const { calls } = await mountStaff(<CorpsScreen corps="NSS" />, "FACULTY", { "GET /api/v1/duties/nss": () => json(corpsDesk("NSS")), "POST /api/v1/duties/nss/activities": () => json({ id: id("act2") }) }, { me: meAs("FACULTY", { duties: ["NSS_OFFICER"] }) });
    expect(await screen.findByText("ZZ Unit 1 · 2026-07-01 · Hours: 120 · Year met")).toBeTruthy();
    expect(screen.getByText("2026-08-15 · 4 hours · 2 took part · Camp")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Activity"), "ZZ Blood camp");
    await fireEvent.changeText(screen.getByLabelText("Hours each"), "2.5");
    await fireEvent.press(screen.getByRole("switch", { name: "It was a camp" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "ZZ Bilal" }));
    await fireEvent.press(screen.getByRole("button", { name: "Record the activity" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/duties/nss/activities")?.body).toEqual({ title: "ZZ Blood camp", at: todayKey(), hours: 2.5, camp: true, participantMembershipIds: [id("stu1")] }));
    await waitFor(() => expect(gets(calls, "/api/v1/duties/nss")).toBe(2));
  });

  it("holds back hours that are not a number, and reads the NCC unit from its own door", async () => {
    const { calls } = await mountStaff(<CorpsScreen corps="NCC" />, "HOD", { "GET /api/v1/duties/ncc": () => json(corpsDesk("NCC")), "POST /api/v1/duties/ncc/activities": () => json({ id: id("act2") }) }, { me: meAs("HOD", { duties: ["NCC_OFFICER"] }) });
    expect(screen.getByText("NCC unit")).toBeTruthy();
    await fireEvent.changeText(await screen.findByLabelText("Activity"), "ZZ Drill");
    await fireEvent.changeText(screen.getByLabelText("Hours each"), "lots");
    expect(screen.getByText("Hours are a number, such as 4 or 2.5.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record the activity" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Hours each"), "3");
    await fireEvent.press(screen.getByRole("button", { name: "Record the activity" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/duties/ncc/activities")?.body).toMatchObject({ title: "ZZ Drill", hours: 3, camp: false }));
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/duties/nss"))).toBe(false);
  });

  it("reads without the form for the head, and refuses the NSS officer the NCC unit", async () => {
    await mountStaff(<CorpsScreen corps="NSS" />, "PRINCIPAL", { "GET /api/v1/duties/nss": () => json(corpsDesk("NSS", { canEdit: false, enrolled: [], activities: [] })) }, { me: meAs("PRINCIPAL") });
    expect(await screen.findByText("The officer enrols students here.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record the activity" })).toBeNull();
    await mountStaff(<CorpsScreen corps="NCC" />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["NSS_OFFICER"] }) });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
  });
});

const research = {
  items: [
    { id: id("res1"), kind: "PUBLICATION", title: "ZZ On pendulums", indexing: "SCOPUS", year: 2026, amountLakhs: null, facultyName: "ZZ Neha" },
    { id: id("res2"), kind: "PROJECT", title: "ZZ Solar cells", indexing: "NONE", year: 2025, amountLakhs: 4.5, facultyName: null },
  ],
  perFaculty: [{ membershipId: id("mem1"), name: "ZZ Neha", publications: 1, books: 0, projects: 1, amountLakhs: 4.5, apiScoreInputs: { teaching: 40, research: 30, service: 10 }, apiScore: 80 }],
  byYear: [{ year: 2026, publications: 1, projects: 0, amountLakhs: 0 }],
};

describe("the research dean's desk", () => {
  it("reads the teachers' research and the register", async () => {
    await mountStaff(<ResearchDeskScreen />, "FACULTY", { "GET /api/v1/duties/research": () => json(research) }, { me: meAs("FACULTY", { duties: ["RESEARCH_DEAN"] }) });
    expect(await screen.findByText("ZZ Neha · API score 80")).toBeTruthy();
    expect(screen.getByText("Publication · 2026 · ZZ Neha")).toBeTruthy();
    expect(screen.getByText("Funded project · 2025 · 4.5 lakhs")).toBeTruthy();
    expect(screen.getByText("2026: 1 publications, 0 projects, 0 lakhs")).toBeTruthy();
  });

  it("is refused without the duty and while IQAC is off", async () => {
    await mountStaff(<ResearchDeskScreen />, "FACULTY", {}, { me: meAs("FACULTY") });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
    await mountStaff(<ResearchDeskScreen />, "ADMIN", {}, { me: meAs("ADMIN", { modules: ["ACADEMICS"] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
  });
});

const squad = {
  papers: [{ scheduleId: id("sch9"), sessionName: "ZZ Oct 2026", courseCode: "PHY101", courseName: "ZZ Mechanics", at: "2026-10-05T04:30:00.000Z", durationMin: 180, halls: [{ id: id("hall1"), name: "ZZ Hall 1" }], visits: 0 }],
  visits: [{ id: id("vis1"), scheduleId: id("sch9"), courseCode: "PHY101", hallName: "ZZ Hall 1", at: "2026-10-05T05:00:00.000Z", byName: "ZZ Neha", members: "ZZ Neha, ZZ Ravi", flagged: true, note: "ZZ chits found" }],
  cases: [{ id: id("case1"), courseCode: "PHY101", sessionName: "ZZ Oct 2026", reportedOn: "2026-10-05", studentName: "ZZ Bilal", decided: false, decision: null }],
};

describe("the exam flying squad", () => {
  it("shows the papers, visits and cases, and logs a visit that found something only with a note", async () => {
    const { calls } = await mountStaff(<ExamSquadScreen />, "FACULTY", { "GET /api/v1/duties/exam-squad": () => json(squad), "POST /api/v1/duties/exam-squad/visits": () => json({ id: id("vis2") }) }, { me: meAs("FACULTY", { duties: ["EXAM_SQUAD"] }) });
    expect(await screen.findByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.getByText("Something found · ZZ Neha, ZZ Ravi · ZZ chits found")).toBeTruthy();
    expect(screen.getByText("PHY101 · ZZ Oct 2026 · 05/10/2026 · ZZ Bilal")).toBeTruthy();
    expect(screen.getByText("Waiting for the committee")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Who went"), "ZZ Neha");
    await fireEvent.press(screen.getByRole("switch", { name: "Something was found (the exam controllers are told)" }));
    expect(screen.getByText("Say in the note what was found.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log the visit" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ phone in a bag");
    await fireEvent.press(screen.getByRole("button", { name: "Log the visit" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/duties/exam-squad/visits")?.body).toEqual({ scheduleId: id("sch9"), examRoomId: id("hall1"), members: "ZZ Neha", flagged: true, note: "ZZ phone in a bag" }));
    await waitFor(() => expect(gets(calls, "/api/v1/duties/exam-squad")).toBe(2));
  });

  it("sends a paper with no hall as no room", async () => {
    const { calls } = await mountStaff(<ExamSquadScreen />, "HOD", { "GET /api/v1/duties/exam-squad": () => json({ ...squad, papers: [{ ...squad.papers[0], halls: [] }], visits: [], cases: [] }), "POST /api/v1/duties/exam-squad/visits": () => json({ id: id("vis2") }) }, { me: meAs("HOD", { duties: ["EXAM_SQUAD"] }) });
    expect(await screen.findByText("No visit logged yet.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Log the visit" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/duties/exam-squad/visits")?.body).toEqual({ scheduleId: id("sch9"), examRoomId: null, members: "", flagged: false, note: "" }));
  });

  it("lets the exam controller read without the duty and without the form, and refuses a teacher without it", async () => {
    await mountStaff(<ExamSquadScreen />, "EXAM_CONTROLLER", { "GET /api/v1/duties/exam-squad": () => json(squad) }, { me: meAs("EXAM_CONTROLLER") });
    expect(await screen.findByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Log the visit" })).toBeNull();
    const { calls } = await mountStaff(<ExamSquadScreen />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["LAB_INCHARGE"] }) });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
    expect(gets(calls, "/api/v1/duties")).toBe(0);
  });
});

describe("the desks in More and on the duty card", () => {
  const DESKS = [
    ["LAB_INCHARGE", "duties.lab.title"],
    ["PRACTICE_TEACHING_COORDINATOR", "duties.teachingPractice.title"],
    ["NSS_OFFICER", "duties.corps.nssTitle"],
    ["NCC_OFFICER", "duties.corps.nccTitle"],
    ["RESEARCH_DEAN", "duties.research.title"],
    ["EXAM_SQUAD", "duties.examSquad.title"],
  ] as const;
  const ALL = ["ACADEMICS", "IQAC", "EXAMS"];
  const labels = (role: "FACULTY" | "HOD" | "EXAM_CONTROLLER", duties: string[], modules = ALL) => menuFor(role, modules, duties).flatMap((g) => g.items.map((i) => i.labelKey as string));

  it("lists each desk for a FACULTY or HOD only with its duty, and the practical record for every teacher", () => {
    for (const role of ["FACULTY", "HOD"] as const) {
      for (const [duty, key] of DESKS) {
        expect({ role, duty, shown: labels(role, [duty]).includes(key) }).toEqual({ role, duty, shown: true });
        expect({ role, duty, shown: labels(role, []).includes(key) }).toEqual({ role, duty, shown: false });
        expect({ role, duty, others: labels(role, DESKS.filter(([d]) => d !== duty).map(([d]) => d)).includes(key) }).toEqual({ role, duty, others: false });
      }
      expect(labels(role, [])).toContain("streamRecords.practicals.title");
      expect(labels(role, [], ["IQAC"])).not.toContain("streamRecords.practicals.title");
    }
    // …and only while the duty's module is on.
    expect(labels("FACULTY", ["NSS_OFFICER"], ["ACADEMICS"])).not.toContain("duties.corps.nssTitle");
    expect(labels("FACULTY", ["EXAM_SQUAD"], ["ACADEMICS", "IQAC"])).not.toContain("duties.examSquad.title");
  });

  it("gives the exam controller the squad's desk without the duty", () => {
    expect(labels("EXAM_CONTROLLER", [])).toContain("duties.examSquad.title");
    expect(labels("EXAM_CONTROLLER", [], ["ACADEMICS"])).not.toContain("duties.examSquad.title");
  });

  it("opens each desk from the duty card, the clinical and studio desks among them", async () => {
    // The clinical desk is built since 10 Oct 2026 (R-56, the clinical half): screens/college/clinical.tsx, test/screens/clinical.test.tsx.
    expect(DUTY_SCREENS.CLINICAL_COORDINATOR).toEqual({ screen: "/(app)/clinical-desk", module: "ACADEMICS" });
    // The studio desk is built since 10 Oct 2026 (R-56, the studio half): screens/college/studios.tsx, test/screens/studios.test.tsx.
    expect(DUTY_SCREENS.STUDIO_COORDINATOR).toEqual({ screen: "/(app)/studios", module: "ACADEMICS" });
    await mountStaff(<DutyCard />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["LAB_INCHARGE"] }) });
    expect(await screen.findByText("Looks after a laboratory, its equipment and its stock.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^Open / }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/lab-desk");
    // An HOD holding the studio duty opens the studios and juries screen from the card (R-56, the studio half, 10 Oct 2026).
    mockPush.mockClear();
    await mountStaff(<DutyCard />, "HOD", {}, { me: meAs("HOD", { duties: ["STUDIO_COORDINATOR"] }) });
    expect(await screen.findByText("Runs the design studios and their juries.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^Open / }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/studios");
  });
});
