import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { FacultyStudiosScreen, StudentStudiosScreen } from "@/screens/college/studios";
import { DUTY_SCREENS } from "@/screens/college/duties";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * Studios and juries on the phone (R-56, the studio half, 10 Oct 2026): a
 * FACULTY member reads the studios and juries, marks a sheet they sit on and
 * the chair signs it (GET /api/v1/faculty/studios, POST …/juries/{id}/marks,
 * POST …/juries/{id}/sign); a STUDENT reads their studios and sends a note
 * for an open stage (GET /api/v1/family/studios, POST …/{id}/submissions).
 * The More entries show at a college with the architecture stream; the
 * duty card opens the faculty screen.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const FAC = "/api/v1/faculty/studios";
const STU = "/api/v1/family/studios";
const atArch = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE", streams: ["ARCHITECTURE"], ...extra });
const withToasts = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

const stages = [
  { stage: "BRIEF_ISSUED", on: "2026-08-03", state: "DONE", waiting: 0 },
  { stage: "INTERIM_PINUP", on: "2026-09-14", state: "DONE", waiting: 1 },
  { stage: "FINAL_SUBMISSION", on: "2026-10-26", state: "AHEAD", waiting: 3 },
  { stage: "JURY", on: "2026-11-02", state: "AHEAD", waiting: 1 },
];
const studio = {
  id: id("studio1"),
  offeringId: id("off1"),
  courseCode: "AR301",
  courseName: "Architectural Design III",
  termId: id("term1"),
  termName: "Odd 2026",
  title: "ZZ A primary school for Aundh",
  brief: "ZZ Twelve classrooms on a 4,000 m² plot.",
  maxMarks: 100,
  coordinatorMembershipId: id("m1"),
  coordinatorName: "ZZ Rohit",
  facultyName: "ZZ Rohit",
  briefIssuedOn: "2026-08-03",
  interimOn: "2026-09-14",
  finalOn: "2026-10-26",
  juryOn: "2026-11-02",
  stages,
  students: [],
  juries: [],
};
const jury = (over: Record<string, unknown> = {}) => ({
  id: id("jury1"),
  studioId: id("studio1"),
  on: "2026-11-02",
  title: "Final jury",
  panel: [
    { membershipId: id("m1"), name: "ZZ Rohit", chair: true },
    { membershipId: id("m2"), name: "ZZ Gayatri", chair: false },
  ],
  externalJurors: [{ role: "ACADEMIC", institution: "School of Planning" }],
  signedAt: null,
  signedByName: null,
  marked: 1,
  students: 2,
  past: false,
  studioTitle: "ZZ A primary school for Aundh",
  courseCode: "AR301",
  maxMarks: 100,
  canMark: true,
  canSign: true,
  canPost: false,
  sheet: [
    { studentMembershipId: id("stu1"), name: "ZZ Ananya", marks: 74, band: "A_PLUS", remark: "ZZ confident parti", entered: true },
    { studentMembershipId: id("stu2"), name: "ZZ Devansh", marks: null, band: null, remark: "", entered: false },
  ],
  components: [],
  ...over,
});
const facultyPage = (over: Record<string, unknown> = {}) => ({ offered: true, studios: [{ ...studio, mine: { teaches: true, coordinates: true, juror: true, heads: false } }], juries: [jury()], ...over });
const studentPage = (over: Record<string, unknown> = {}) => ({
  today: "2026-10-11",
  offered: true,
  studios: [
    {
      id: id("studio1"),
      title: "ZZ A primary school for Aundh",
      courseCode: "AR301",
      courseName: "Architectural Design III",
      termName: "Odd 2026",
      brief: "ZZ Twelve classrooms on a 4,000 m² plot.",
      maxMarks: 100,
      coordinatorName: "ZZ Rohit",
      stages: stages.map(({ stage, on, state }) => ({ stage, on, state })),
      submissions: [{ stage: "INTERIM_PINUP", state: "LATE", submittedAt: "2026-09-15T16:00:00.000Z", note: "ZZ Two schemes; the sections follow.", fileId: null, fileName: null }],
      canSubmit: true,
      results: [{ juryId: id("jury0"), on: "2026-09-16", title: "Interim jury", marks: 62, band: "B_PLUS", remark: "ZZ under-resolved at the entrance" }],
    },
  ],
  ...over,
});

beforeEach(() => mockPush.mockClear());

describe("the faculty's studios screen", () => {
  it("lists the studios with their stages and the juries, saves a sheet's marks and signs it", async () => {
    const { calls } = await mountStaff(withToasts(<FacultyStudiosScreen />), "FACULTY", { [`GET ${FAC}`]: () => json(facultyPage()), [`POST ${FAC}/juries/${id("jury1")}/marks`]: () => json({ saved: 2 }), [`POST ${FAC}/juries/${id("jury1")}/sign`]: () => json({ signed: true, changed: true }) }, { me: atArch("FACULTY") });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ A primary school for Aundh")).toBeTruthy();
    expect(screen.getByText(/Interim pin-up: .*2026 · Done · 1 waiting/)).toBeTruthy();
    expect(screen.getByText(/Panel: ZZ Rohit \(chair\), ZZ Gayatri/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("ZZ Devansh: Marks (of 100)"), "58.5");
    await fireEvent.changeText(screen.getByLabelText("ZZ Devansh: Remark"), "ZZ late but complete");
    await fireEvent.press(screen.getByRole("button", { name: "Save the marks" }));
    await waitFor(() =>
      expect(calls().find((c) => c.line === `POST ${FAC}/juries/${id("jury1")}/marks`)?.body).toEqual({
        entries: [
          { studentMembershipId: id("stu1"), marks: 74, remark: "ZZ confident parti" },
          { studentMembershipId: id("stu2"), marks: 58.5, remark: "ZZ late but complete" },
        ],
      }),
    );
    expect(await screen.findByText("The marks are saved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign the sheet" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${FAC}/juries/${id("jury1")}/sign`)).toBe(true));
    expect(await screen.findByText("The sheet is signed; the students are told.")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${FAC}`).length).toBe(3));
  });

  it("draws a signed sheet read-only with the band, and says so at a college without the stream", async () => {
    await mountStaff(<FacultyStudiosScreen />, "HOD", { [`GET ${FAC}`]: () => json(facultyPage({ juries: [jury({ canMark: false, canSign: false, signedAt: "2026-11-02T10:00:00.000Z", signedByName: "ZZ Rohit", marked: 2 })] })) }, { me: atArch("HOD") });
    expect(await screen.findByText("74 / 100 · A+ (excellent)")).toBeTruthy();
    expect(screen.getByText("Not entered")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save the marks" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign the sheet" })).toBeNull();
    await mountStaff(<FacultyStudiosScreen />, "FACULTY", { [`GET ${FAC}`]: () => json(facultyPage({ offered: false, studios: [], juries: [] })) }, { me: atArch("FACULTY", { streams: ["SCIENCE"] }) });
    expect(await screen.findByText("Studios are kept by a college with the architecture stream; yours has none.")).toBeTruthy();
    expect(screen.getByText("No studio of yours yet")).toBeTruthy();
  });

  it("asks nothing of the server for a role it is not for, or with ACADEMICS off", async () => {
    const a = await mountStaff(<FacultyStudiosScreen />, "TEACHER", {}, { me: atArch("TEACHER") });
    expect(await screen.findByText("Studios and juries are for a college's teachers.")).toBeTruthy();
    expect(a.calls().filter((c) => c.line.startsWith(`GET ${FAC}`)).length).toBe(0);
    const b = await mountStaff(<FacultyStudiosScreen />, "FACULTY", {}, { me: atArch("FACULTY", { modules: [] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    expect(b.calls().filter((c) => c.line.startsWith(`GET ${FAC}`)).length).toBe(0);
  });
});

describe("the student's studios screen", () => {
  it("shows the stages, what was sent, the signed result, and sends a note for an open stage", async () => {
    const { calls } = await mountStaff(withToasts(<StudentStudiosScreen />), "STUDENT", { [`GET ${STU}`]: () => json(studentPage()), [`POST ${STU}/${id("studio1")}/submissions`]: () => json({ id: id("sub1"), state: "SUBMITTED" }) }, { me: atArch("STUDENT") });
    expect(await screen.findByText("ZZ A primary school for Aundh")).toBeTruthy();
    expect(screen.getByText(/Due .*2026 · Late/)).toBeTruthy();
    expect(screen.getByText(/62 \/ 100 · B\+ \(good\)/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Final submission: Note"), "ZZ Developed scheme with sections.");
    await fireEvent.press(screen.getAllByRole("button", { name: "Submit" })[1]!);
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${STU}/${id("studio1")}/submissions`)?.body).toEqual({ stage: "FINAL_SUBMISSION", note: "ZZ Developed scheme with sections.", fileId: null, submit: true }));
    expect(await screen.findByText("Your work is submitted.")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${STU}`).length).toBe(2));
  });

  it("says when there is no studio, and asks nothing for a guardian", async () => {
    await mountStaff(<StudentStudiosScreen />, "STUDENT", { [`GET ${STU}`]: () => json(studentPage({ studios: [] })) }, { me: atArch("STUDENT") });
    expect(await screen.findByText("No studio yet")).toBeTruthy();
    const a = await mountStaff(<StudentStudiosScreen />, "PARENT", {}, { me: atArch("PARENT") });
    expect(await screen.findByText("This page is for a college's students.")).toBeTruthy();
    expect(a.calls().filter((c) => c.line.startsWith(`GET ${STU}`)).length).toBe(0);
  });
});

describe("the entries", () => {
  it("show in More at an architecture college only, and the duty card opens the faculty screen", () => {
    const fac = menuFor("FACULTY", ["ACADEMICS"], [], ["ARCHITECTURE"]).flatMap((g) => g.items);
    expect(fac.find((i) => i.screen === "/(app)/studios")).toBeTruthy();
    expect(menuFor("FACULTY", ["ACADEMICS"], [], ["SCIENCE"]).flatMap((g) => g.items).find((i) => i.screen === "/(app)/studios")).toBeUndefined();
    expect(menuFor("HOD", ["ACADEMICS"], [], ["ARCHITECTURE"]).flatMap((g) => g.items).find((i) => i.screen === "/(app)/studios")).toBeTruthy();
    expect(menuFor("STUDENT", ["ACADEMICS"], [], ["ARCHITECTURE"]).flatMap((g) => g.items).find((i) => i.screen === "/(app)/student-studios")).toBeTruthy();
    expect(menuFor("STUDENT", ["ACADEMICS"], [], ["LAW"]).flatMap((g) => g.items).find((i) => i.screen === "/(app)/student-studios")).toBeUndefined();
    expect(DUTY_SCREENS.STUDIO_COORDINATOR).toEqual({ screen: "/(app)/studios", module: "ACADEMICS" });
  });
});
