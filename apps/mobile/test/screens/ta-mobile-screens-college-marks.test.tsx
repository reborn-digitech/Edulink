/**
 * The testing analysis of 13 November 2026, batch mobile-screens-college: the phone's marks and
 * evaluation forms. Each case is named with its finding.
 *
 * TA-056: a mistyped internal mark ("7..5") became NaN, which JSON writes as null, which the
 * server stores as absent, under "Marks saved". TA-154: marks typed under one component stayed in
 * the fields when another was chosen, and Save wrote them to the second. TA-339: a course file's
 * stored resource opened the file route with no token. TA-151: the jury sheet re-sent every row
 * from what the card held when first drawn, so one juror's save turned the others' marks into
 * "absent". TA-153: an internship's evaluation re-sent the grade, the visit and the viva from what
 * the card held when first drawn, so blanks erased what a colleague had recorded.
 */
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { API_BASE } from "@/lib/api";
import { OfferingScreen, markTypingProblem } from "@/screens/academics/offering";
import { FacultyStudiosScreen } from "@/screens/college/studios";
import { SupervisionScreen } from "@/screens/placement/supervision";
import { json, me, mountStaff } from "./staff-harness";

const mockOpenBrowser = jest.fn();
jest.mock("expo-web-browser", () => ({ openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...args) }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const OFFERING = id("zzoffering1");
const UNIT = id("zzcomponent1");
const ASSIGN = id("zzcomponent2");
const S1 = id("zzstudent1");
const S2 = id("zzstudent2");
const atCollege = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS", "PLACEMENT"], institutionKind: "COLLEGE", ...extra });
const MARKS = `/api/v1/academics/offerings/${OFFERING}/internal/marks`;

type Node = { props?: Record<string, unknown>; children?: unknown[] };
/** The host element that carries the screen's pull-to-refresh. */
function refreshable(node: Node): Node | null {
  if (node.props && typeof node.props.onRefresh === "function") return node;
  const control = node.props?.refreshControl as Node | undefined;
  if (control?.props && typeof control.props.onRefresh === "function") return control;
  for (const child of node.children ?? []) {
    if (child && typeof child === "object") {
      const found = refreshable(child as Node);
      if (found) return found;
    }
  }
  return null;
}
/** Pull to refresh, as a person does: the screen's own refresh control. */
async function pullToRefresh() {
  const control = refreshable(screen.root as unknown as Node);
  expect(control).not.toBeNull();
  await act(async () => {
    (control!.props!.onRefresh as () => void)();
  });
}

const component = (cid: string, name: string, kind: string, maxMarks: number) => ({ id: cid, name, kind, maxMarks, weight: maxMarks, coCodes: [], enteredCount: 1, moderated: false, moderatedByName: null, released: false });
const internal = {
  offeringId: OFFERING,
  courseCode: "PHY101",
  courseName: "ZZ Mechanics",
  internalMax: 40,
  weightTotal: 40,
  components: [component(UNIT, "ZZ Unit test", "UNIT_TEST", 20), component(ASSIGN, "ZZ Assignment", "ASSIGNMENT", 20)],
  students: [
    { studentMembershipId: S1, name: "ZZ Ishaan", rollNumber: 1, marks: { [UNIT]: 18, [ASSIGN]: 16 }, total: 34 },
    { studentMembershipId: S2, name: "ZZ Omkar", rollNumber: 2, marks: { [ASSIGN]: 15 }, total: 15 },
  ],
  locked: null,
  canEnter: true,
  canModerate: false,
  canRelease: false,
  canLock: false,
};
const file = (items: unknown[]) => ({ offeringId: OFFERING, courseCode: "PHY101", courseName: "ZZ Mechanics", facultyName: "ZZ Neha", outcomes: [], plan: [], taught: 0, expected: 0, behind: false, termElapsedPercent: 10, items, review: null, attainment: { targetPercent: 60, cos: [], pos: [] }, canEdit: true, canReview: false });

async function openMarks() {
  const mounted = await mountStaff(
    <OfferingScreen offeringId={OFFERING} initialTab="marks" />,
    "FACULTY",
    {
      [`GET /api/v1/academics/offerings/${OFFERING}/course-file`]: () => json(file([])),
      [`GET /api/v1/academics/offerings/${OFFERING}/internal`]: () => json(internal),
      [`POST ${MARKS}`]: () => json({ saved: 1, skipped: [] }),
    },
    { me: atCollege("FACULTY") },
  );
  expect(await screen.findByLabelText("2 ZZ Omkar")).toBeTruthy();
  return mounted;
}

describe("internal marks on the phone", () => {
  it("TA-056: a mark that is not a number ('7..5') is never sent as absent; the field says why and Save waits", async () => {
    const { calls } = await openMarks();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("2 ZZ Omkar"), "7..5");
    expect(screen.getByText("Type a mark from 0 to 20, with at most one decimal place.")).toBeTruthy();
    await user.press(screen.getByRole("button", { name: "Save" }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Before the fix the body carried { marks: null } for ZZ Omkar, the server's absent, and the screen said "Marks saved.".
    expect(calls().filter((c) => c.line === `POST ${MARKS}`)).toHaveLength(0);
    expect(screen.queryByText("Marks saved.")).toBeNull();
    // A real mark, corrected in the same box, goes as a number.
    await user.clear(screen.getByLabelText("2 ZZ Omkar"));
    await user.type(screen.getByLabelText("2 ZZ Omkar"), "7.5");
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${MARKS}`)?.body).toEqual({ componentId: UNIT, entries: [{ studentMembershipId: S2, marks: 7.5 }] }));
  });

  it("TA-056: the typing rule — blank and AB pass, a pasted '7,5', a lone '.', two decimals or over the maximum do not", () => {
    expect(markTypingProblem("", 20)).toBe(false);
    expect(markTypingProblem("ab", 20)).toBe(false);
    expect(markTypingProblem("12.5", 20)).toBe(false);
    expect(markTypingProblem("20", 20)).toBe(false);
    for (const bad of ["7..5", "7.5.", ".", "7,5", "12.55", "21", "-1", "1e1"]) expect(markTypingProblem(bad, 20)).toBe(true);
  });

  it("TA-154: marks typed under one component are not shown over, or saved to, another chosen before saving", async () => {
    const { calls } = await openMarks();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("2 ZZ Omkar"), "12");
    await user.press(screen.getByRole("radio", { name: "ZZ Assignment (20)" }));
    // The assignment's own stored mark is drawn, not the unit test's typing.
    expect(screen.getByLabelText("2 ZZ Omkar").props.value).toBe("15");
    await user.press(screen.getByRole("button", { name: "Save" }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Before the fix this posted { componentId: ASSIGN, entries: [{ S2, 12 }] }, overwriting the hidden 15.
    expect(calls().filter((c) => c.line === `POST ${MARKS}` && (c.body as { componentId: string }).componentId === ASSIGN)).toHaveLength(0);
    // Back on the unit test, the typing is still there and saves to it.
    await user.press(screen.getByRole("radio", { name: "ZZ Unit test (20)" }));
    expect(screen.getByLabelText("2 ZZ Omkar").props.value).toBe("12");
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${MARKS}`)?.body).toEqual({ componentId: UNIT, entries: [{ studentMembershipId: S2, marks: 12 }] }));
  });
});

describe("a course file's stored resource", () => {
  afterEach(() => mockOpenBrowser.mockReset());

  it("TA-339: opens through a signed five-minute link, never the bare file route", async () => {
    const FILE = "zz-handout.pdf";
    mockOpenBrowser.mockResolvedValue({ type: "opened" });
    const { calls } = await mountStaff(
      <OfferingScreen offeringId={OFFERING} />,
      "FACULTY",
      {
        [`GET /api/v1/academics/offerings/${OFFERING}/course-file`]: () => json(file([{ id: id("zzitem1"), kind: "NOTES", title: "ZZ Handout", url: null, fileId: FILE, coCodes: [], createdAt: "2026-08-01T05:00:00.000Z" }])),
        [`POST /api/v1/files/${FILE}/link`]: () => json({ url: `/api/files/${FILE}?t=123.abc`, expiresAt: "2026-11-14T10:05:00.000Z" }),
      },
      { me: atCollege("FACULTY") },
    );
    await fireEvent.press(await screen.findByText("ZZ Handout"));
    await waitFor(() => expect(mockOpenBrowser).toHaveBeenCalledWith(`${API_BASE}/api/files/${FILE}?t=123.abc`));
    expect(calls().some((c) => c.line === `POST /api/v1/files/${FILE}/link`)).toBe(true);
  });
});

/* ----------------------------------------------------------------- the jury */

const FAC = "/api/v1/faculty/studios";
const JURY = id("jury1");
const row = (sid: string, name: string, marks: number | null, remark = "") => ({ studentMembershipId: sid, name, marks, band: null, remark, entered: marks !== null });
const jury = (sheet: ReturnType<typeof row>[]) => ({
  id: JURY,
  studioId: id("studio1"),
  on: "2026-11-02",
  title: "Final jury",
  panel: [
    { membershipId: id("m2"), name: "ZZ Gayatri", chair: true },
    { membershipId: id("m1"), name: "ZZ Head", chair: false },
  ],
  externalJurors: [],
  signedAt: null,
  signedByName: null,
  marked: sheet.filter((r) => r.marks !== null).length,
  students: sheet.length,
  past: false,
  studioTitle: "ZZ A primary school for Aundh",
  courseCode: "AR301",
  maxMarks: 100,
  canMark: true,
  canSign: false,
  canPost: false,
  sheet,
  components: [],
});
const page = (sheet: ReturnType<typeof row>[]) => ({ offered: true, studios: [], juries: [jury(sheet)] });

describe("the jury sheet", () => {
  it("TA-151: a juror whose card was drawn before a colleague's marks sends only the row they touched, never null over the colleague's marks", async () => {
    let gets = 0;
    const { calls } = await mountStaff(
      <ToastProvider>
        <FacultyStudiosScreen />
      </ToastProvider>,
      "FACULTY",
      {
        // Drawn in the morning with nothing marked; by the refresh the HOD has marked all three on the web.
        [`GET ${FAC}`]: () => json(gets++ === 0 ? page([row(S1, "ZZ Ananya", null), row(S2, "ZZ Devansh", null), row(id("zzstudent3"), "ZZ Meera", null)]) : page([row(S1, "ZZ Ananya", 74, "ZZ confident"), row(S2, "ZZ Devansh", 61), row(id("zzstudent3"), "ZZ Meera", 80)])),
        [`POST ${FAC}/juries/${JURY}/marks`]: () => json({ saved: 1 }),
      },
      { me: atCollege("FACULTY", { streams: ["ARCHITECTURE"] }) },
    );
    expect(await screen.findByLabelText("ZZ Devansh: Remark")).toBeTruthy();
    await pullToRefresh();
    await waitFor(() => expect(gets).toBe(2));
    // The refreshed sheet is drawn: the colleague's marks are in the fields.
    await waitFor(() => expect(screen.getByLabelText("ZZ Devansh: Marks (of 100)").props.value).toBe("61"));
    await fireEvent.changeText(screen.getByLabelText("ZZ Devansh: Remark"), "ZZ strong section");
    await fireEvent.press(screen.getByRole("button", { name: "Save the marks" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${FAC}/juries/${JURY}/marks`)).toBe(true));
    const body = calls().find((c) => c.line === `POST ${FAC}/juries/${JURY}/marks`)!.body as { entries: { studentMembershipId: string; marks: number | null; remark: string }[] };
    // Before the fix: three entries, every marks null (the card's first drawing), the colleague's 74, 61 and 80 erased.
    expect(body.entries).toEqual([{ studentMembershipId: S2, marks: 61, remark: "ZZ strong section" }]);
  });

  it("TA-151: a student who was absent is recorded with the row's Absent switch, and a row left empty is never sent as absent", async () => {
    const S3 = id("zzstudent3");
    const { calls } = await mountStaff(
      <ToastProvider>
        <FacultyStudiosScreen />
      </ToastProvider>,
      "FACULTY",
      {
        // ZZ Meera is already entered absent by a colleague; ZZ Ananya and ZZ Devansh have no entry yet.
        [`GET ${FAC}`]: () => json(page([row(S1, "ZZ Ananya", null), row(S2, "ZZ Devansh", null), { ...row(S3, "ZZ Meera", null), entered: true }])),
        [`POST ${FAC}/juries/${JURY}/marks`]: () => json({ saved: 2 }),
      },
      { me: atCollege("FACULTY", { streams: ["ARCHITECTURE"] }) },
    );
    // The hint tells the juror to switch Absent on; it no longer says to leave the marks empty.
    expect(await screen.findByText(/Switch on Absent for a student who was absent/)).toBeTruthy();
    expect(screen.queryByText(/Leave the marks empty/)).toBeNull();
    // A colleague's absent entry shows as Absent.
    expect(screen.getByRole("switch", { name: "ZZ Meera: Absent" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "ZZ Ananya: Absent" })).not.toBeChecked();
    // Ananya was absent; Devansh's marks were typed and then cleared, so his row is left as it is.
    await fireEvent.press(screen.getByRole("switch", { name: "ZZ Ananya: Absent" }));
    expect(screen.getByRole("switch", { name: "ZZ Ananya: Absent" })).toBeChecked();
    await fireEvent.changeText(screen.getByLabelText("ZZ Devansh: Marks (of 100)"), "55");
    await fireEvent.changeText(screen.getByLabelText("ZZ Devansh: Marks (of 100)"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Save the marks" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${FAC}/juries/${JURY}/marks`)).toBe(true));
    const body = calls().find((c) => c.line === `POST ${FAC}/juries/${JURY}/marks`)!.body as { entries: { studentMembershipId: string; marks: number | null; remark: string }[] };
    // Before the repair there was no Absent switch, and a cleared row was sent with no marks, as absent.
    expect(body.entries).toEqual([{ studentMembershipId: S1, marks: null, remark: "" }]);
  });
});

/* ----------------------------------------------------- the internship's evaluation */

const internship = (over: Record<string, unknown> = {}) => ({ id: "i3", studentMembershipId: "m5", studentName: "ZZ Riya", companyName: "ZZ Zeta Analytics", kind: "INDUSTRY", from: "2026-07-01", to: "2026-08-15", hours: 240, credits: null, windowSemester: 4, supervisorName: "ZZ Sup", facultyMembershipId: "m1", facultyName: "ZZ Head", diary: [], hasReport: true, reportFileId: null, industryGrade: null, facultyVisitAt: null, vivaMarks: null, status: "SUBMITTED", needsDeclaration: false, hasDeclaration: false, declarationFileId: null, creditedAt: null, ...over });
const rule = { creditsMin: 14, creditsMax: 20, hoursMin: 600, hoursMax: 700, windows: [2, 4, 6] };

describe("evaluating an internship", () => {
  it("TA-153: a teacher entering only the visit sends only the visit, and the TPO's grade and viva recorded meanwhile are kept", async () => {
    let gets = 0;
    const { calls } = await mountStaff(
      <SupervisionScreen />,
      "FACULTY",
      {
        // Drawn with nothing recorded; by the refresh the TPO has recorded grade A and viva 78 on the web.
        "GET /api/v1/placement/internships": () => json({ internships: [gets++ === 0 ? internship() : internship({ status: "EVALUATED", industryGrade: "A", vivaMarks: 78 })], creditsTotal: null, rule, canDecide: false }),
        "GET /api/v1/placement/projects": () => json({ projects: [], canCreate: false }),
        "POST /api/v1/placement/internships/i3/evaluate": () => json(internship({ status: "EVALUATED", industryGrade: "A", vivaMarks: 78, facultyVisitAt: "2026-08-10T00:00:00.000Z" })),
      },
      { me: atCollege("FACULTY") },
    );
    expect(await screen.findByRole("button", { name: "Evaluate: ZZ Riya" })).toBeTruthy();
    await pullToRefresh();
    await waitFor(() => expect(screen.getByText(/Industry grade A/)).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Evaluate: ZZ Riya" }));
    // The form shows what the server holds now.
    expect(screen.getByLabelText("Viva marks").props.value).toBe("78");
    await fireEvent.changeText(screen.getByLabelText("Faculty visit on"), "2026-08-10");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/internships/i3/evaluate")).toBe(true));
    // Before the fix: { industryGrade: null, facultyVisitOn: "2026-08-10", vivaMarks: null }, which the door reads as "clear".
    expect(calls().find((c) => c.line === "POST /api/v1/placement/internships/i3/evaluate")?.body).toEqual({ facultyVisitOn: "2026-08-10" });
  });
});
