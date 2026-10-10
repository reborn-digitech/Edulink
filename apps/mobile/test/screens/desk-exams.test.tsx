import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ExamSessionScreen } from "@/screens/exams/session";
import { ExamAfterScreen } from "@/screens/exams/after";
import { ExamCellHome } from "@/screens/exams/controller-home";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[] = ["ACADEMICS", "EXAMS"]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const iso = "2026-10-04T05:00:00.000Z";
const form = (id: string, over: Record<string, unknown> = {}) => ({ id, studentMembershipId: `m-${id}`, name: `ZZ Student ${id}`, code: `ZZ-${id}`, status: "SUBMITTED", eligible: true, noDues: true, courses: [{ courseId: "c1", code: "ZZ101", name: "ZZ Physics", kind: "REGULAR" }, { courseId: "c2", code: "ZZ090", name: "ZZ Maths", kind: "BACKLOG" }], feePaise: 50_000, lateFeePaise: 0, feeDemandId: null, demandStatus: null, submittedAt: iso, lockedAt: null, refusalReason: null, waiverReason: null, hallTicket: null, ...over });
const run = (id: string, number: number, status: string) => ({ id, number, status, computedAt: iso, publishedAt: status === "PUBLISHED" ? iso : null, reason: null, students: 40, passed: 36, atkt: 2, failed: 2, passRatePercent: 90 });
const session = (over: Record<string, unknown> = {}) => ({ id: "x1", name: "ZZ Winter 2026", kind: "REGULAR", termId: "t1", termName: "ZZ Odd semester", status: "FORMS", formOpensAt: iso, formClosesAt: iso, feePerCoursePaise: 10_000, feePerBacklogPaise: 20_000, photocopyFeePaise: 0, revalFeePaise: 0, lateFeeSlabs: [], feeHeadId: null, autonomous: false, canWrite: true, published: false, courses: [], forms: [form("f1"), form("f2", { status: "APPROVED", hallTicket: { id: "h1", number: "ZZHT001" } }), form("f3", { status: "DRAFT" })], schedule: [], malpractice: [], remuneration: [], staff: [], runs: [], graces: [], notes: [], marks: [], ...over });

describe("one exam session on the controller's phone (the parity batch, 10 Oct 2026)", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = { sessionId: "x1" };
  });

  it("counts the forms and the hall tickets, approves a submitted form with the fee waived and a reason, and refuses another", async () => {
    const { calls } = await mountStaff(<ExamSessionScreen />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell/sessions/x1": () => json(session({ forms: [form("f1"), form("f4", { name: "ZZ Student f4", noDues: false }), form("f2", { status: "APPROVED", hallTicket: { id: "h1", number: "ZZHT001" } })] })),
      "POST /api/v1/exam-cell/forms/f1/decide": () => json({ ok: true, id: "f1", count: null }),
      "POST /api/v1/exam-cell/forms/f4/decide": () => json({ ok: true, id: "f4", count: null }),
    }, { me: atCollege("EXAM_CONTROLLER") });
    expect(await screen.findByText("Forms waiting (2)")).toBeTruthy();
    expect(screen.getByText("Hall tickets")).toBeTruthy();
    expect(screen.getAllByText(/ZZ101, ZZ090 \(backlog\)/).length).toBe(2);
    expect(screen.getByText(/No-dues not complete/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Approve: ZZ Student f1" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Waive the fee" }));
    const approve = screen.getByRole("button", { name: "Approve" });
    expect(approve.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ scholarship holder");
    await fireEvent.press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/forms/f1/decide")?.body).toEqual({ approve: true, waiveFee: true, reason: "ZZ scholarship holder" }));
    expect(await screen.findByText("Form approved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refuse: ZZ Student f4" }));
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ library dues");
    await fireEvent.press(screen.getByRole("button", { name: "Refuse" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/forms/f4/decide")?.body).toEqual({ approve: false, reason: "ZZ library dues" }));
  });

  it("moves the session on after one ask, with the next status alone", async () => {
    const { calls } = await mountStaff(<ExamSessionScreen />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell/sessions/x1": () => json(session({ forms: [] })),
      "POST /api/v1/exam-cell/sessions/x1/status": () => json({ ok: true, id: "x1", count: null }),
    }, { me: atCollege("EXAM_CONTROLLER") });
    await fireEvent.press(await screen.findByRole("button", { name: "Lock forms and start sittings" }));
    expect(screen.getByText("Lock forms and start sittings? A session only moves forward.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Lock forms and start sittings" })[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/sessions/x1/status")?.body).toEqual({ status: "CONDUCT" }));
    expect(await screen.findByText("The session has moved on.")).toBeTruthy();
  });

  it("publishes a first draft run, and says a correcting run waits for the principal", async () => {
    const { calls } = await mountStaff(<ExamSessionScreen />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell/sessions/x1": () => json(session({ status: "ASSESSMENT", forms: [], runs: [run("r1", 1, "DRAFT")] })),
      "POST /api/v1/exam-cell/sessions/x1/results/publish": () => json({ ok: true, id: "r1", count: 40 }),
    }, { me: atCollege("EXAM_CONTROLLER") });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish: Run 1" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/sessions/x1/results/publish")?.body).toEqual({ runId: "r1" }));
    expect(await screen.findByText("Results published; the students are told.")).toBeTruthy();
    await mountStaff(<ExamSessionScreen />, "EXAM_CONTROLLER", { "GET /api/v1/exam-cell/sessions/x1": () => json(session({ status: "PUBLISHED", published: true, forms: [], runs: [run("r1", 1, "PUBLISHED"), run("r2", 2, "DRAFT")] })) }, { me: atCollege("EXAM_CONTROLLER") });
    expect(await screen.findByText("Run 2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Publish: Run 2" })).toBeNull();
    expect(screen.getByText("This run corrects a published result: the principal publishes it.")).toBeTruthy();
  });

  it("the home opens a session and the after-results screen", async () => {
    await mountStaff(<ExamCellHome />, "EXAM_CONTROLLER", { "GET /api/v1/exam-cell": () => json({ autonomous: false, canWrite: true, canApproveGrace: false, signatureSet: true, terms: [], feeHeads: [], sessions: [{ id: "x1", name: "ZZ Winter 2026", kind: "REGULAR", termId: "t1", termName: "ZZ Odd", status: "FORMS", formOpensAt: null, formClosesAt: null, forms: 3, submitted: 1, approved: 1, publishedAt: null }], graceWaiting: [] }) }, { me: atCollege("EXAM_CONTROLLER") });
    await fireEvent.press(await screen.findByText("ZZ Winter 2026"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/exam-session", params: { sessionId: "x1" } });
    await fireEvent.press(screen.getByRole("button", { name: "After results" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/exam-after");
  });
});

const reval = (id: string, over: Record<string, unknown> = {}) => ({ id, sessionId: "x1", sessionName: "ZZ Winter 2026", courseId: "c1", courseCode: "ZZ101", studentMembershipId: "m1", studentName: "ZZ Riya", kind: "REVAL", feePaise: 50_000, demandStatus: "PAID", status: "ASKED", outcome: null, oldExternalMilli: 42_000, newExternalMilli: null, askedAt: iso, decidedAt: null, correction: null, ...over });

describe("after results on the controller's phone", () => {
  it("decides a revaluation with the new mark, and lists the open backlogs with their last day", async () => {
    const { calls } = await mountStaff(<ExamAfterScreen />, "EXAM_CONTROLLER", {
      "GET /api/v1/exam-cell/after": () => json({ autonomous: false, canWrite: true, revaluations: [reval("v1"), reval("v2", { kind: "PHOTOCOPY", status: "DECIDED", outcome: "PROVIDED" })], backlogs: [{ id: "b1", studentMembershipId: "m2", studentName: "ZZ Aman", courseId: "c2", courseCode: "ZZ090", courseName: "ZZ Maths", status: "OPEN", attempts: 2, firstFailedAt: iso, lastDay: "2033-10-04", clearedAt: null }], documents: [], credits: [], abcConnected: false, students: [], convocations: [] }),
      "POST /api/v1/exam-cell/revaluations/v1/decide": () => json({ ok: true, id: "v1", count: null }),
    }, { me: atCollege("EXAM_CONTROLLER") });
    expect(await screen.findByText("Waiting for a decision (1)")).toBeTruthy();
    expect(screen.getByText("Decided (1)")).toBeTruthy();
    expect(screen.getByText(/2 attempts · may be sat until /)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Decide: ZZ Riya" }));
    expect(screen.queryByRole("radio", { name: "Photocopy given" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Marks changed" }));
    await fireEvent.changeText(screen.getByLabelText("Marks"), "48");
    await fireEvent.press(screen.getByRole("button", { name: "Decide" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/exam-cell/revaluations/v1/decide")?.body).toEqual({ outcome: "CHANGED", marks: 48 }));
    expect(await screen.findByText("Decided.")).toBeTruthy();
  });
});
