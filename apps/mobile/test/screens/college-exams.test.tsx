import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import * as Sharing from "expo-sharing";
import type { RoleCode } from "@edulink/contracts";
import { CollegeExamsScreen } from "@/screens/exams/mine";
import { ExamDutiesScreen } from "@/screens/exams/duties";
import { ExamCellHome } from "@/screens/exams/controller-home";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => {
  mockRouter.push.mockClear();
  (Sharing.shareAsync as jest.Mock).mockClear();
});

const at = "2026-10-04T05:00:00.000Z";
const ID = (n: number) => `czzexphone${String(n).padStart(11, "0")}`;
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const result = {
  studentMembershipId: ID(1),
  name: "ZZ Ishaan Pathak",
  code: "ZZV-001",
  sgpa: 8,
  creditsAttempted: 8,
  creditsEarned: 8,
  status: "PASS",
  cls: "DISTINCTION",
  courses: [{ courseId: ID(5), code: "PHY201", name: "ZZ Waves", credits: 4, internalMilli: 32000, externalMilli: 44000, graceMilli: 0, totalMilli: 76000, maxMilli: 100000, grade: "A", points: 8, status: "PASS" }],
};

function mine(over: Record<string, unknown> = {}) {
  return {
    name: "ZZ Ishaan Pathak",
    canAct: true,
    forms: [
      {
        id: ID(10),
        sessionId: ID(20),
        sessionName: "ZZ Winter 2026",
        status: "DRAFT",
        courses: [
          { courseId: ID(1), code: "PHY101", name: "ZZ Mechanics", kind: "REGULAR" },
          { courseId: ID(6), code: "CHE201", name: "ZZ Organic", kind: "BACKLOG" },
        ],
        eligible: true,
        eligibilityNote: null,
        noDues: false,
        noDuesLines: [{ desk: "LIBRARY", cleared: false, owedPaise: 5000, itemsOut: 1 }],
        feePaise: 0,
        lateFeePaise: 0,
        demandStatus: null,
        opensAt: at,
        closesAt: at,
        windowOpen: true,
        refusalReason: null,
        backlogsToAdd: [{ courseId: ID(7), code: "PHY203", name: "ZZ Astronomy" }],
      },
    ],
    tickets: [{ id: ID(30), number: "HT0001", sessionName: "ZZ Winter 2026" }],
    seating: [{ courseCode: "PHY101", courseName: "ZZ Mechanics", at, roomName: "ZZ Hall B", seatNo: 3 }],
    results: [{ sessionId: ID(21), sessionName: "ZZ Summer 2026", publishedAt: at, revaluationOpenUntil: "2026-10-19", result }],
    cgpa: 8,
    creditsEarned: 8,
    documents: [{ id: ID(40), kind: "GRADE_CARD", serial: "GC/2026/0001", code: "ZZEXGC0001", studentMembershipId: ID(1), studentName: "ZZ Ishaan Pathak", issuedAt: at, revokedAt: null }],
    revaluations: [{ id: ID(50), sessionId: ID(21), sessionName: "ZZ Summer 2026", courseId: ID(5), courseCode: "PHY201", studentMembershipId: ID(1), studentName: "ZZ Ishaan Pathak", kind: "REVAL", feePaise: 40000, demandStatus: "OPEN", status: "ASKED", outcome: null, oldExternalMilli: null, newExternalMilli: null, askedAt: at, decidedAt: null }],
    backlogs: [{ id: ID(60), studentMembershipId: ID(1), studentName: "ZZ Ishaan Pathak", courseId: ID(6), courseCode: "CHE201", courseName: "ZZ Organic", status: "OPEN", attempts: 1, firstFailedAt: at, lastDay: "2033-05-20", clearedAt: null }],
    credits: [{ id: ID(70), studentMembershipId: ID(1), studentName: "ZZ Ishaan Pathak", termId: ID(80), termName: "ZZ Even term", credits: 8, apaarId: null, abcRef: null, status: "PENDING", pushedAt: null }],
    ...over,
  };
}
const ok = { ok: true, id: ID(99), count: null };

describe("a college student's exams on the phone", () => {
  it("submits the form, adds a backlog, asks for a revaluation and hands the hall ticket and grade card to the share sheet", async () => {
    const { calls } = await mountStaff(<CollegeExamsScreen />, "STUDENT", {
      "GET /api/v1/exam-cell/mine": () => json(mine()),
      [`POST /api/v1/exam-cell/forms/${ID(10)}/submit`]: () => json(ok),
      "POST /api/v1/exam-cell/mine/backlogs": () => json(ok),
      "POST /api/v1/exam-cell/mine/revaluations": () => json({ error: "ZZ You have already asked for this.", code: "CONFLICT" }, 409),
      [`GET /api/v1/exam-cell/hall-tickets/${ID(30)}/pdf`]: () => new Response(PDF, { status: 200, headers: { "content-type": "application/pdf" } }),
      [`GET /api/v1/exam-cell/documents/${ID(40)}/pdf`]: () => new Response(PDF, { status: 200, headers: { "content-type": "application/pdf" } }),
    }, { me: atCollege("STUDENT", ["ACADEMICS", "EXAMS"]) });
    expect(await screen.findByText("Exam form: ZZ Winter 2026")).toBeTruthy();
    expect(screen.getByText("No-dues not complete: LIBRARY")).toBeTruthy();
    expect(screen.getByText("CGPA 8.00 · 8 credits earned")).toBeTruthy();
    expect(screen.getByText("SGPA 8.00 · Pass · First class with distinction")).toBeTruthy();
    expect(screen.getByText("Open · may be sat until 2033-05-20")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Submit my form" }));
    expect(await screen.findByText("Form submitted.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add backlog PHY203" }));
    expect(await screen.findByText("Backlog added to your form.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/mine/backlogs")?.body).toEqual({ sessionId: ID(20), courseId: ID(7) });
    await fireEvent.press(screen.getByRole("button", { name: "Revaluation: PHY201" }));
    expect(await screen.findByText("ZZ You have already asked for this.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Hall ticket HT0001" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/hall-ticket-HT0001\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" })));
    await fireEvent.press(screen.getByRole("button", { name: "Grade card GC/2026/0001" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/GC-2026-0001\.pdf$/), expect.anything()));
  });

  it("says when a PDF is refused", async () => {
    await mountStaff(<CollegeExamsScreen />, "STUDENT", {
      "GET /api/v1/exam-cell/mine": () => json(mine()),
      [`GET /api/v1/exam-cell/hall-tickets/${ID(30)}/pdf`]: () => json({ error: "ZZ Not yours.", code: "NOT_FOUND" }, 404),
    }, { me: atCollege("STUDENT", ["EXAMS"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "Hall ticket HT0001" }));
    expect(await screen.findByText("ZZ Not yours.")).toBeTruthy();
  });

  it("says the exam cell is off where the college has not switched it on, and when there is nothing yet", async () => {
    await mountStaff(<CollegeExamsScreen />, "STUDENT", {}, { me: atCollege("STUDENT", ["ACADEMICS"]) });
    expect(await screen.findByText("Exams is not switched on")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
    await mountStaff(<CollegeExamsScreen />, "STUDENT", { "GET /api/v1/exam-cell/mine": () => json(mine({ forms: [], results: [], tickets: [], seating: [], documents: [], revaluations: [], backlogs: [], credits: [] })) }, { me: atCollege("STUDENT", ["EXAMS"]) });
    expect(await screen.findByText("Nothing here yet")).toBeTruthy();
  });

  it("shows a guardian the child's results read only, and the other child's on a switch", async () => {
    const child = (n: number, name: string) => ({ guardianshipId: ID(90 + n), studentMembershipId: ID(n), studentUserId: ID(95 + n), name, schoolId: "s1", schoolName: "ZZ Vidya College", leftAt: null, relation: "PARENT" });
    const { calls } = await mountStaff(<CollegeExamsScreen />, "PARENT", {
      "GET /api/v1/family/children": () => json({ children: [child(1, "ZZ Ishaan Pathak"), child(2, "ZZ Ananya Pathak")] }),
      "GET /api/v1/exam-cell/mine": ({ url }) => (url.searchParams.get("childId") === ID(2) ? json({ error: "ZZ Ananya has not shared her results with you.", code: "FORBIDDEN" }, 403) : json(mine({ canAct: false }))),
    }, { me: { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null }, modules: ["EXAMS"] } });
    expect(await screen.findByText("College results")).toBeTruthy();
    expect(await screen.findByText("Exam form: ZZ Winter 2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Submit my form" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Revaluation: PHY201" })).toBeNull();
    await fireEvent.press(screen.getByText("ZZ Ananya Pathak"));
    expect(await screen.findByText("ZZ Ananya has not shared her results with you.")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET /api/v1/exam-cell/mine?childId=${ID(2)}`)).toBe(true);
  });
});

describe("a faculty member's exam duties on the phone", () => {
  it("lists the halls, papers, bundles and remuneration, and sends a paper to the web to be sealed", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ExamDutiesScreen />, "FACULTY", {
      "GET /api/v1/exam-cell/duties": () =>
        json({
          invigilation: [{ id: ID(1), sessionName: "ZZ Winter 2026", courseCode: "PHY101", at, roomName: "ZZ Hall B", status: "ASSIGNED" }],
          papers: [{ id: ID(2), sessionName: "ZZ Autonomous Winter 2026", courseCode: "BCOM101", at, status: "ASSIGNED" }],
          bundles: [{ id: ID(3), sessionName: "ZZ Autonomous Winter 2026", courseCode: "BCOM101", bundle: "ZZ-B1", count: 20, status: "ALLOTTED" }],
          remuneration: [{ sessionName: "ZZ Summer 2026", kind: "INVIGILATOR", count: 1, amountPaise: 40000 }],
        }),
    }, { me: atCollege("FACULTY", ["ACADEMICS", "EXAMS"]) });
    expect(await screen.findByText("PHY101 · ZZ Hall B")).toBeTruthy();
    expect(screen.getByText("ZZ-B1", { exact: false })).toBeTruthy();
    expect(screen.getByText("20 answer books · with you")).toBeTruthy();
    expect(screen.getByText("ZZ Summer 2026 · Invigilator")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open the exam cell on the web" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/faculty\/exams$/));
    open.mockRestore();
  });

  it("says when there are no duties, with the way to More", async () => {
    await mountStaff(<ExamDutiesScreen />, "HOD", { "GET /api/v1/exam-cell/duties": () => json({ invigilation: [], papers: [], bundles: [], remuneration: [] }) }, { me: atCollege("HOD", ["ACADEMICS", "EXAMS"]) });
    expect(await screen.findByText("No exam duties for you yet.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
  });
});

describe("the exam controller's home on the phone", () => {
  it("shows the sessions and the grace waiting, and opens the cell on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ExamCellHome />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell": () =>
        json({
          autonomous: false,
          canWrite: true,
          canApproveGrace: false,
          signatureSet: false,
          terms: [],
          feeHeads: [],
          sessions: [{ id: ID(20), name: "ZZ Winter 2026", kind: "REGULAR", termId: ID(80), termName: "ZZ Odd term", status: "FORMS", formOpensAt: at, formClosesAt: at, forms: 3, submitted: 1, approved: 1, publishedAt: null }],
          graceWaiting: [{ id: ID(21), sessionName: "ZZ Winter 2026", courseCode: "PHY101", studentName: "ZZ Ananya Pathak", marks: 4, reason: "ZZ ordinance", rule: "TO_PASS" }],
        }),
    }, { me: atCollege("EXAM_CONTROLLER", ["ACADEMICS", "EXAMS"]) });
    expect(await screen.findByText("Taking forms · 3 forms, 1 submitted, 1 approved")).toBeTruthy();
    expect(screen.getAllByText("ZZ Winter 2026")).toHaveLength(2);
    expect(screen.getByText("4 grace marks for ZZ Ananya Pathak in PHY101")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open the exam cell on the web" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/exam-cell$/));
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
    await fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
    open.mockRestore();
  });

  it("under a session in assessment or published, says where its latest run stands and when the principal must publish (5 Oct 2026)", async () => {
    const row = (id: number, name: string, status: string) => ({ id: ID(id), name, kind: "REGULAR", termId: ID(80), termName: "ZZ Odd term", status, formOpensAt: at, formClosesAt: at, forms: 3, submitted: 3, approved: 3, publishedAt: null });
    const run = (over: Record<string, unknown>) => ({ id: ID(40), number: 1, status: "PUBLISHED", computedAt: at, publishedAt: "2026-09-12T05:00:00.000Z", reason: null, students: 10, passed: 8, atkt: 1, failed: 1, passRatePercent: 80, ...over });
    const { calls } = await mountStaff(<ExamCellHome />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell": () => json({ autonomous: true, canWrite: true, canApproveGrace: false, signatureSet: true, terms: [], feeHeads: [], graceWaiting: [], sessions: [row(31, "ZZ Summer 2026", "PUBLISHED"), row(32, "ZZ Winter 2026", "ASSESSMENT"), row(33, "ZZ Forms 2027", "FORMS")] }),
      [`GET /api/v1/exam-cell/sessions/${ID(31)}/results`]: () => json({ run: run({}), rows: [] }),
      [`GET /api/v1/exam-cell/sessions/${ID(32)}/results`]: () => json({ run: run({ id: ID(41), number: 2, status: "DRAFT", publishedAt: null, reason: "ZZ revaluation" }), rows: [] }),
    }, { me: atCollege("EXAM_CONTROLLER", ["ACADEMICS", "EXAMS"]) });
    expect(await screen.findByText(/^Run 1 · Published · published /)).toBeTruthy();
    expect(screen.getAllByText("10 students: 8 passed, 1 ATKT, 1 failed (80%)")).toHaveLength(2);
    expect(await screen.findByText("Run 2 · Draft")).toBeTruthy();
    expect(screen.getByText("This run corrects a published result: the principal publishes it.")).toBeTruthy();
    // A session still taking forms has no result to read.
    expect(calls().some((c) => c.line.includes(`${ID(33)}/results`))).toBe(false);
  });

  it("with no sessions offers the web, and with EXAMS off says so as the role's home", async () => {
    await mountStaff(<ExamCellHome />, "EXAM_CONTROLLER", { "GET /api/v1/exam-cell": () => json({ autonomous: true, canWrite: true, canApproveGrace: false, signatureSet: true, terms: [], feeHeads: [], sessions: [], graceWaiting: [] }) }, { me: atCollege("EXAM_CONTROLLER", ["EXAMS"]) });
    expect(await screen.findByText("No sessions yet")).toBeTruthy();
    await mountStaff(<ExamCellHome />, "EXAM_CONTROLLER", {}, { me: atCollege("EXAM_CONTROLLER", ["ACADEMICS"]) });
    expect(await screen.findByText("Exams is not switched on")).toBeTruthy();
  });
});
