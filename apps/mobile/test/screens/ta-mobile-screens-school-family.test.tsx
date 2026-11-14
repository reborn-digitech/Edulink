/**
 * The family's screens of the testing analysis of 13 November 2026, batch mobile-screens-school:
 * TA-167 (the child switcher vanishing on a refused read), TA-168 (an agenda row losing its child),
 * TA-565 (a just-uploaded picture drawn through a route that refuses it) and TA-543 (a report
 * card's grade points to one decimal).
 */
import { Share } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import { calls, child, ID, ME_PARENT, ME_STUDENT, renderFamily, press } from "./family-helpers";
import { FamilyPractice } from "@/screens/family/practice";
import { FamilyAttendance } from "@/screens/family/attendance";
import { FamilyFees } from "@/screens/family/fees";
import { FamilyAssignments } from "@/screens/family/assignments";
import { agendaTarget } from "@/screens/family/agenda";
import { FamilyExams } from "@/screens/family/exams";
import { screenFor } from "@/lib/links";

const mockPick = jest.fn();
jest.mock("expo-document-picker", () => ({ getDocumentAsync: (...args: unknown[]) => mockPick(...args) }));
/* expo-image draws natively; here it is a View that keeps its props, so a picture's source can be read. */
jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});
afterEach(() => mockPick.mockReset());

const locked = () => new Response(JSON.stringify({ error: "This needs the Student plan, which you do not hold yet.", code: "PLAN_REQUIRED", plan: "STUDENT", feature: "QUESTION_BANK" }), { status: 402 });
const notGranted = () => new Response(JSON.stringify({ error: "ZZ this student has not shared it with you.", code: "FORBIDDEN" }), { status: 403 });
const TWO = [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bhavesh")];

/* ---------------------------------------------------------------- TA-167 */

describe("TA-167: the guardian's child switcher beside a refused read", () => {
  const progress = { children: TWO, childName: "ZZ Asha", weeklyCount: 7, topics: [{ slug: "zz-fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5, level: 2, seenCount: 5, correctCount: 4, tierCount: 1, cleanCompletion: false }] };

  it("TA-167: Practice keeps the switcher when the chosen child's read is a 402, and the other child can be reached again", async () => {
    await renderFamily(<FamilyPractice />, ME_PARENT, {
      "/api/v1/family/practice": (_init, url) => (url.searchParams.get("childId") === ID.child2 ? locked() : progress),
      "/api/v1/family/children": () => ({ children: TWO }),
    });
    expect(await screen.findByText("ZZ Fractions · Class 5")).toBeTruthy();
    await press(screen.getByRole("button", { name: "ZZ Bhavesh, ZZ School" }));
    await waitFor(() => expect(screen.queryByText("ZZ Fractions · Class 5")).toBeNull());
    await waitFor(() => expect(screen.getAllByText(/Student plan/).length).toBeGreaterThan(0));
    expect(screen.getByRole("button", { name: "ZZ Asha, ZZ School" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "ZZ Bhavesh, ZZ School" }).props as { accessibilityState?: { selected?: boolean } }).accessibilityState?.selected).toBe(true);
    await press(screen.getByRole("button", { name: "ZZ Asha, ZZ School" }));
    expect(await screen.findByText("ZZ Fractions · Class 5")).toBeTruthy();
  });

  it("TA-167: opened on a refused child, Attendance still draws the switcher from the guardian's list of children", async () => {
    // The screen opens on the first child, an adult at a college who has not shared attendance: a 403, no answer to list from.
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, {
      "/api/v1/family/attendance": () => notGranted(),
      "/api/v1/family/children": () => ({ children: TWO }),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ this student has not shared it with you.");
    expect(await screen.findByRole("button", { name: "ZZ Asha, ZZ School" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "ZZ Bhavesh, ZZ School" })).toBeTruthy();
    expect(calls(fetch, "/api/v1/family/children")).toHaveLength(1);
  });

  it("TA-167: Fees, opened on a refused child, still lets the guardian reach the other", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, {
      "/api/v1/fees/family": () => notGranted(),
      "/api/v1/family/children": () => ({ children: TWO }),
    });
    expect(await screen.findByRole("button", { name: "ZZ Bhavesh, ZZ School" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "ZZ Asha, ZZ School" })).toBeTruthy();
  });
});

/* ---------------------------------------------------------------- TA-168 */

describe("TA-168: an agenda row keeps the child it belongs to", () => {
  it("TA-168: a fee row opens Fees on that child, and a competition row opens the detail with that child", () => {
    expect(agendaTarget(`/parent/fees?child=${ID.child2}`)).toEqual({ pathname: "/(app)/fees", params: { child: ID.child2 } });
    expect(agendaTarget("/student/fees")).toEqual({ pathname: "/(app)/fees" });
    expect(agendaTarget(`/competitions/czz00000000000000000comp1?child=${ID.child2}`)).toEqual({ pathname: "/(app)/competitions/detail", params: { competitionId: "czz00000000000000000comp1", child: ID.child2 } });
    expect(screenFor(`/competitions/czz00000000000000000comp1?child=${ID.child2}`)).toEqual({ pathname: "/(app)/competitions/detail", params: { competitionId: "czz00000000000000000comp1", child: ID.child2 } });
    expect(screenFor("/competitions/czz00000000000000000comp1")).toEqual({ pathname: "/(app)/competitions/detail", params: { competitionId: "czz00000000000000000comp1" } });
  });
});

/* ---------------------------------------------------------------- TA-565 */

describe("TA-565: a picture just uploaded for a hand-in", () => {
  const ITEM = {
    id: ID.work,
    title: "ZZ Fractions sheet",
    body: "",
    category: "Homework",
    className: "ZZ 5A",
    classColor: null,
    pointsMilli: 10000,
    dueAt: "2030-01-01T10:00:00.000Z",
    submittedAt: null,
    submissionId: null,
    submissionBody: "",
    attachments: [],
    submissionAttachments: [],
    scoreMilli: null,
    comment: null,
    overdue: false,
  };

  it("TA-565: is drawn from the phone's own copy, not the file route that refuses an upload not yet attached", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/page.png", name: "page.png", mimeType: "image/png", size: 10 }] });
    await renderFamily(<FamilyAssignments />, ME_STUDENT, {
      "/api/v1/family/student/assignments": () => ({ todo: [ITEM], handedIn: [], marked: [] }),
      "/api/v1/uploads": () => new Response(JSON.stringify({ fileId: "file_8", mime: "image/png", size: 10 }), { status: 201 }),
    });
    await press(await screen.findByRole("button", { name: "Hand it in" }));
    await press(screen.getByRole("button", { name: "Choose a picture" }));
    const picture = await screen.findByLabelText("page.png");
    const source = (picture.props as { source: { uri: string; headers?: Record<string, string> } }).source;
    expect(source.uri).toBe("file:///cache/page.png");
    expect(source.uri).not.toContain("/api/files/");
  });
});

/* ---------------------------------------------------------------- TA-543 */

describe("TA-543: a report card's grade points", () => {
  const ROW = { id: ID.card, title: "ZZ Term 1 report", publishedAt: "2026-09-01T00:00:00.000Z", overallPercentMilli: 76700 };
  const EXAMS = { marks: [], upcoming: [], cards: [{ studentMembershipId: "m-pupil", name: null, rows: [ROW] }], termIsRunning: false, awaitingTermName: null };
  const cardWith = (gradePoints: number) => ({
    id: ID.card,
    status: "PUBLISHED",
    title: "ZZ Term 1 report",
    remark: null,
    studentMembershipId: "m-pupil",
    studentName: "ZZ Pupil",
    className: "ZZ 5A",
    classSection: null,
    fromDateKey: "2026-06-01",
    toDateKey: "2026-08-31",
    attendancePresent: 55,
    attendanceTotal: 60,
    attendancePercent: 92,
    overallPercent: 76.7,
    gradingMethod: "exams",
    publishedAt: "2026-09-01T00:00:00.000Z",
    authorName: "ZZ Teacher",
    items: [],
    school: { name: "ZZ School", logoPath: null },
    practice: null,
    overallLetter: "B1",
    gradePoints,
    scope: "TERM",
    subjects: [{ subject: "ZZ Maths", percent: 76.7, letter: "B1", points: 8, parts: [] }],
    coScholastic: [],
    scale: { bands: [{ label: "B1", minPercent: 71, points: 8, descriptor: null }], coScale: [] },
    layout: { showAttendance: true, showPractice: true, showCoScholastic: true, showGradePoints: true, showAddress: true, showSignatures: true, showRemark: true, useBrandColour: false, signatureLeft: "Class teacher", signatureRight: "Principal", headerNote: null, footerNote: null, paper: "A4" },
  });

  it.each([
    [7.67, "7.67"],
    [4.95, "4.95"],
  ])("TA-543: a mean of %s is printed %s on the card and in the shared text, as the web page and the PDF print it", async (points, shown) => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await renderFamily(<FamilyExams />, ME_STUDENT, { "/api/v1/family/exams": () => EXAMS, "/api/v1/family/report-cards": () => ({ groups: EXAMS.cards }), [`/api/v1/family/report-cards/${ID.card}`]: () => cardWith(points) });
    await press(await screen.findByRole("tab", { name: "Report cards (1)" }));
    await press(await screen.findByRole("button", { name: /ZZ Term 1 report/ }));
    expect(await screen.findByText("Scholastic")).toBeTruthy();
    expect(screen.getByText(shown)).toBeTruthy();
    await press(screen.getByRole("button", { name: "Share" }));
    const text = (share.mock.calls.at(-1)![0] as { message: string }).message;
    expect(text).toContain(`Grade points: ${shown}`);
    share.mockRestore();
  });
});
