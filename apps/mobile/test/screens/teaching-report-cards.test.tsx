import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { coScholasticSaveSchema, staffClassesSchema, teachingCardRemarkSchema, teachingCardsTitleSchema, teachingGenerateCardsSchema, teachingReportCardsSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { ReportCardBuilder } from "@/screens/teacher/report-cards";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const P1 = "czz0000000000000000pa1";
const P2 = "czz0000000000000000pa2";
const CARD1 = "czz0000000000000000ca1";
const CARD2 = "czz0000000000000000ca2";
const TERM1 = "czz0000000000000000te1";
const YEAR1 = "czz0000000000000000ye1";
const BASE = `/api/v1/teaching/classes/${ID.class1}/report-cards`;

const BUILDER = teachingReportCardsSchema.parse({
  class: { id: ID.class1, name: "ZZ 5A", heading: "ZZ 5A · Section A" },
  assessments: [
    { assignmentId: P1, title: "ZZ Maths paper", category: null, subject: "ZZ Maths", seriesId: ID.series1, seriesName: "ZZ Unit Test 1", seriesKind: "UNIT_TEST", termId: TERM1, gradedCount: 20, classSize: 24 },
    { assignmentId: P2, title: "ZZ Science paper", category: null, subject: "ZZ Science", seriesId: ID.series1, seriesName: "ZZ Unit Test 1", seriesKind: "UNIT_TEST", termId: TERM1, gradedCount: 0, classSize: 24 },
  ],
  terms: [{ id: TERM1, name: "ZZ Term 1", current: true }],
  titles: [],
  selectedTitle: null,
  cards: [],
  academicYear: { id: YEAR1, name: "ZZ 2026–27" },
  coScholastic: { areas: ["ZZ Discipline", "ZZ Art"], scale: [{ label: "A", descriptor: "Outstanding" }, { label: "B", descriptor: null }] },
});
const card = (id: string, studentName: string, extra: Record<string, unknown> = {}) => ({ id, title: "ZZ Term 1", status: "DRAFT", remark: null, overallPercentMilli: null, attendancePresent: 0, attendanceTotal: 0, studentName, ...extra });
const WITH_CARDS = teachingReportCardsSchema.parse({
  ...BUILDER,
  titles: ["ZZ Term 1", "ZZ Term 0"],
  selectedTitle: "ZZ Term 1",
  cards: [
    card(CARD1, "ZZ Asha", { overallPercentMilli: 81_500, overallLetter: "A2", attendancePresent: 40, attendanceTotal: 42, coScholastic: [{ area: "ZZ Discipline", grade: "B", note: null }] }),
    card(CARD2, "ZZ Bhavesh", { remark: "ZZ A steady term.", coScholastic: [{ area: "ZZ Discipline", grade: "A", note: "ZZ Always on time." }] }),
  ],
});
const PUBLISHED = teachingReportCardsSchema.parse({ ...WITH_CARDS, cards: WITH_CARDS.cards.map((c) => ({ ...c, status: "PUBLISHED" })) });

const builder = () => (
  <ToastProvider>
    <ReportCardBuilder />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { classId: ID.class1 };
  (Sharing.shareAsync as jest.Mock).mockClear();
});

describe("the report-card builder", () => {
  it("loads, then shows the class's papers under their exam with how many are marked", async () => {
    const gate = gated();
    await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BUILDER));
    await screen.findByText("ZZ 5A · Section A");
    expect(screen.getByRole("checkbox", { name: "ZZ Unit Test 1, Unit test · 2 papers" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "ZZ Maths, 20 of 24 marked" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "ZZ Science, 0 of 24 marked" })).toBeTruthy();
    expect(screen.getByText("unmarked")).toBeTruthy();
    expect(screen.getByLabelText("What this report is called")).toHaveDisplayValue("Term 1");
    expect(screen.getByRole("button", { name: "Generate for the class" })).toBeDisabled();
    // No cards yet: nothing to review.
    expect(screen.queryByText(/^3\. Review and publish/)).toBeNull();
  });

  it("a whole exam ticks its papers; generating sends the title and the papers the contract takes", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(BUILDER),
      [`POST ${BASE}/generate`]: () => json({ created: 2, updated: 0, skippedPublished: 1 }),
    });
    await fireEvent.press(await screen.findByRole("checkbox", { name: /^ZZ Unit Test 1/ }));
    expect(screen.getByRole("checkbox", { name: /^ZZ Maths/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^ZZ Science/ })).toBeChecked();
    // One paper off leaves the exam half-ticked.
    await fireEvent.press(screen.getByRole("checkbox", { name: /^ZZ Science/ }));
    expect(screen.getByRole("checkbox", { name: /^ZZ Unit Test 1/ })).toBePartiallyChecked();
    await fireEvent.press(screen.getByRole("checkbox", { name: /^ZZ Science/ }));
    await fireEvent.changeText(screen.getByLabelText("What this report is called"), "ZZ Term 1");
    await fireEvent.press(screen.getByRole("button", { name: "Generate for the class" }));
    expect(await screen.findByText("2 drafts ready. 1 already published and left alone.")).toBeTruthy();
    const post = calls().find((c) => c.line === `POST ${BASE}/generate`)!;
    expect(teachingGenerateCardsSchema.parse(post.body)).toEqual({ title: "ZZ Term 1", assignmentIds: [P1, P2], termId: null });
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${BASE}?title=ZZ%20Term%201`)).toBe(true));
  });

  it("built from a term, the term fixes the title and names its own papers: none are sent", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(BUILDER),
      [`POST ${BASE}/generate`]: () => json({ created: 2, updated: 0, skippedPublished: 0 }),
    });
    await fireEvent.press(await screen.findByRole("radio", { name: "Build from a term" }));
    // Nothing to tick, and nothing to build until a term is picked.
    expect(screen.queryByRole("checkbox", { name: /^ZZ Maths/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Generate for the class" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Term 1 · 2 in this term" }));
    expect(screen.getByLabelText("What this report is called")).toHaveDisplayValue("ZZ Term 1");
    expect(screen.getByLabelText("What this report is called")).not.toBeEnabled();
    await fireEvent.press(screen.getByRole("button", { name: "Generate for the class" }));
    await screen.findByText("2 drafts ready");
    expect(teachingGenerateCardsSchema.parse(calls().find((c) => c.line === `POST ${BASE}/generate`)!.body)).toEqual({ title: "ZZ Term 1", assignmentIds: [], termId: TERM1 });
  });

  it("the annual card takes the year's name and sends the year; without a year it says so and builds nothing", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(BUILDER),
      [`POST ${BASE}/generate`]: () => json({ created: 2, updated: 0, skippedPublished: 0 }),
    });
    await fireEvent.press(await screen.findByRole("radio", { name: "Build the annual card" }));
    expect(screen.getByText("Annual card: every term of ZZ 2026–27, combined by the terms' shares")).toBeTruthy();
    expect(screen.getByLabelText("What this report is called")).toHaveDisplayValue("ZZ 2026–27");
    await fireEvent.changeText(screen.getByLabelText("What this report is called"), "ZZ Annual");
    await fireEvent.press(screen.getByRole("button", { name: "Generate for the class" }));
    await screen.findByText("2 drafts ready");
    expect(teachingGenerateCardsSchema.parse(calls().find((c) => c.line === `POST ${BASE}/generate`)!.body)).toEqual({ title: "ZZ Annual", assignmentIds: [], academicYearId: YEAR1 });

    await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: () => json({ ...BUILDER, academicYear: null }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Build the annual card" }));
    expect(screen.getByText("No academic year is set up, so there is no annual card to build.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate for the class" })).toBeDisabled();
    // Back to the papers: the checkboxes return.
    await fireEvent.press(screen.getByRole("radio", { name: "Pick the papers yourself" }));
    expect(screen.getByRole("checkbox", { name: /^ZZ Maths/ })).toBeTruthy();
  });

  it("each draft's co-scholastic areas are graded on the school's scale with a note and saved together; a set with no areas says so", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(WITH_CARDS),
      [`POST ${BASE}/co-scholastic`]: () => json({ ok: true }),
    });
    await screen.findByText("3. Review and publish — ZZ Term 1");
    // The letter sits beside the percent.
    expect(screen.getByText("81.5% · A2 · 40 of 42 days")).toBeTruthy();
    expect(screen.getByLabelText("Note: ZZ Discipline — ZZ Bhavesh")).toHaveDisplayValue("ZZ Always on time.");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    await fireEvent.press(screen.getAllByRole("radio", { name: "A · Outstanding" })[0]!);
    await fireEvent.changeText(screen.getByLabelText("Note: ZZ Art — ZZ Asha"), "ZZ Paints well.");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Co-scholastic grades saved.")).toBeTruthy();
    expect(coScholasticSaveSchema.parse(calls().find((c) => c.line === `POST ${BASE}/co-scholastic`)!.body)).toEqual({
      cardId: CARD1,
      grades: [
        { area: "ZZ Discipline", grade: "A" },
        { area: "ZZ Art", grade: null, note: "ZZ Paints well." },
      ],
    });

    await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: () => json({ ...WITH_CARDS, coScholastic: { areas: [], scale: [] } }) });
    await screen.findByText("3. Review and publish — ZZ Term 1");
    expect(screen.getAllByText("The office has not set any co-scholastic areas.")).toHaveLength(2);
  });

  it("the whole set downloads as one PDF and goes to the share sheet", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(WITH_CARDS),
      [`GET ${BASE}/pdf`]: () => new Response(pdf, { status: 200, headers: { "content-type": "application/pdf" } }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Download every card as one PDF" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(calls().some((c) => c.line === `GET ${BASE}/pdf?title=ZZ%20Term%201`)).toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/ZZ Term 1 - ZZ 5A\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" }));
  });

  it("the drafts take a remark each, then publish together after a second tap", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", {
      [`GET ${BASE}`]: () => json(WITH_CARDS),
      [`POST ${BASE}/remark`]: () => json({ ok: true }),
      [`POST ${BASE}/publish`]: () => json({ published: 2 }),
    });
    await screen.findByText("3. Review and publish — ZZ Term 1");
    expect(screen.getByLabelText("Draft: 2")).toBeTruthy();
    expect(screen.getByLabelText("Published: 0")).toBeTruthy();
    expect(screen.getByText("81.5% · A2 · 40 of 42 days")).toBeTruthy();
    expect(screen.getByText("No marks yet")).toBeTruthy();
    expect(screen.getByLabelText("Remark for ZZ Bhavesh")).toHaveDisplayValue("ZZ A steady term.");
    expect(screen.queryByRole("button", { name: "Save remark" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Remark for ZZ Asha"), "ZZ A good term.");
    await fireEvent.press(screen.getByRole("button", { name: "Save remark" }));
    expect(await screen.findByText("Remark saved")).toBeTruthy();
    expect(teachingCardRemarkSchema.parse(calls().find((c) => c.line === `POST ${BASE}/remark`)!.body)).toEqual({ cardId: CARD1, remark: "ZZ A good term." });

    await fireEvent.press(screen.getByRole("button", { name: "Publish all 2" }));
    expect(screen.getByText("Send 2 report cards to the families now? Each child and their guardians are told.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${BASE}/publish`)).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("2 report cards sent out")).toBeTruthy();
    expect(teachingCardsTitleSchema.parse(calls().find((c) => c.line === `POST ${BASE}/publish`)!.body)).toEqual({ title: "ZZ Term 1" });
    // Another title built before is one chip away.
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Term 0" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${BASE}?title=ZZ%20Term%200`)).toBe(true));
  });

  it("a published set is withdrawn only after a second tap, and cancel sends nothing", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: () => json(PUBLISHED), [`POST ${BASE}/withdraw`]: () => json({ withdrawn: 2 }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw all" }));
    expect(screen.getByText("Take these cards back to draft? Families who opened them may already have read them.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().filter((c) => c.line === `POST ${BASE}/withdraw`)).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw all" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw all" }));
    expect(await screen.findByText("2 withdrawn")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${BASE}/withdraw`)?.body).toEqual({ title: "ZZ Term 1" });
    // A published card's remark is read, not edited.
    expect(screen.queryByLabelText("Remark for ZZ Bhavesh")).toBeNull();
    expect(screen.getByText("ZZ A steady term.")).toBeTruthy();
  });

  it("without a class it asks which one; with none it says so and the door is Classes", async () => {
    mockRouter.params = {};
    const CLASSES = staffClassesSchema.parse({ classes: [{ id: ID.class1, name: "ZZ 5A", subject: "Maths", room: null, color: null, students: 24, assignments: 3, registerTaken: true }], students: 24 });
    const { calls } = await mountStaff(builder(), "TEACHER", { "GET /api/v1/staff/classes": () => json(CLASSES), [`GET ${BASE}`]: () => json(BUILDER) });
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ 5A, Maths · 24 on the roll" }));
    await screen.findByText("ZZ 5A · Section A");
    expect(calls().some((c) => c.line === `GET ${BASE}`)).toBe(true);

    await mountStaff(builder(), "TEACHER", { "GET /api/v1/staff/classes": () => json({ classes: [], students: 0 }) });
    await screen.findByText("No classes assigned yet");
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a class with no scheduled papers says so, and the door is Exams", async () => {
    await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: () => json({ ...BUILDER, assessments: [], terms: [] }) });
    await screen.findByText("No papers for this class yet");
    await fireEvent.press(screen.getByRole("button", { name: "Exams" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/exams");
  });

  it("a refused generate and a refused load are alerts with a retry", async () => {
    const { calls } = await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: () => json(BUILDER), [`POST ${BASE}/generate`]: refused("ZZ nothing on those papers", 422) });
    await fireEvent.press(await screen.findByRole("checkbox", { name: /^ZZ Unit Test 1/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Generate for the class" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ nothing on those papers");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${BASE}/generate`)).toHaveLength(2));

    const load = await mountStaff(builder(), "TEACHER", { [`GET ${BASE}`]: refused("ZZ not your class", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not your class");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(load.calls().filter((c) => c.line === `GET ${BASE}`)).toHaveLength(2));
  });
});
