import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { teachingGradebookSchema, teachingGradesBodySchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { AssignmentDetail, fileSize, markProblem } from "@/screens/teacher/assignment-detail";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
/* expo-image draws natively; here it is a View that keeps its props, so a picture is found by its name. */
jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});

const A = "czz00000000000000000a1";
const GET = `GET /api/v1/teaching/assignments/${A}`;
const GRADES = `POST /api/v1/teaching/assignments/${A}/grades`;
const PUBLISH = "POST /api/v1/staff/assignments/publish";

const BOOK = teachingGradebookSchema.parse({
  assignment: {
    id: A,
    title: "ZZ Fractions worksheet",
    body: "ZZ Show your working.",
    category: "Homework",
    pointsMilli: 20_000,
    dueAt: "2026-09-20T10:30:00.000Z",
    publishedAt: null,
    classId: ID.class1,
    className: "ZZ 5A",
    attachments: [{ fileId: "zz-sheet.pdf", name: "ZZ sheet.pdf", size: 2048, mime: "application/pdf" }],
  },
  rows: [
    {
      membershipId: ID.pupil1,
      name: "ZZ Asha",
      fullName: "ZZ Asha Rao",
      avatarKey: null,
      submittedAt: "2026-09-08T10:00:00.000Z",
      submissionStatus: "SUBMITTED",
      late: false,
      scoreMilli: null,
      letter: null,
      comment: null,
      gradedAt: null,
      work: { body: "ZZ my working", attachments: [{ fileId: "zz-photo.jpg", name: "ZZ photo.jpg", size: 1_500_000, mime: "image/jpeg" }] },
    },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, submittedAt: null, submissionStatus: null, late: false, scoreMilli: 15_000, letter: null, comment: "ZZ good", gradedAt: "2026-09-08T10:00:00.000Z", work: null },
  ],
  stats: { total: 2, submitted: 1, graded: 1, averagePercent: 75 },
});
const PUBLISHED = teachingGradebookSchema.parse({ ...BOOK, assignment: { ...BOOK.assignment, publishedAt: "2026-09-01T08:00:00.000Z" } });

const detail = () => (
  <ToastProvider>
    <AssignmentDetail />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { assignmentId: A };
});

describe("one assignment's gradebook", () => {
  it("loads, then shows the draft bar, the instructions, the handouts, the figures and the roll", async () => {
    const gate = gated();
    await mountStaff(detail(), "TEACHER", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BOOK));
    await screen.findByText("ZZ Fractions worksheet");
    expect(screen.getByText(/^ZZ 5A · Homework · out of 20 · due /)).toBeTruthy();
    expect(screen.getByText("This is still a draft. Students cannot see it and nobody has been told.")).toBeTruthy();
    expect(screen.getByText("ZZ Show your working.")).toBeTruthy();
    expect(screen.getByText("ZZ sheet.pdf")).toBeTruthy();
    expect(screen.getByText("2 KB")).toBeTruthy();
    expect(screen.getByLabelText("Students: 2")).toBeTruthy();
    expect(screen.getByLabelText("Handed in: 1")).toBeTruthy();
    expect(screen.getByLabelText("Marked: 1")).toBeTruthy();
    expect(screen.getByLabelText("Class average: 75%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ZZ Asha, Handed in" })).toBeTruthy();
    expect(screen.getByText("—/20")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ZZ Bhavesh, Not handed in" })).toBeTruthy();
    expect(screen.getByText("15/20")).toBeTruthy();
  });

  it("marks one pupil at a time beside their work, then saves the batch the contract takes", async () => {
    const { calls } = await mountStaff(detail(), "TEACHER", { [GET]: () => json(BOOK), [GRADES]: () => json({ saved: 1, cleared: 1, rejected: 0 }) });
    // The first to mark is the first who handed in and has no mark.
    await fireEvent.press(await screen.findByRole("button", { name: "Start marking" }));
    expect(screen.getByText("1 of 2")).toBeTruthy();
    expect(screen.getByText("What they handed in")).toBeTruthy();
    expect(screen.getByText("ZZ my working")).toBeTruthy();
    expect(screen.getByLabelText("ZZ photo.jpg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous pupil" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "17.5");
    expect(screen.getByText("88%")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Comment for ZZ Asha"), "ZZ neat steps");
    expect(screen.getByText("1 not saved yet")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Next pupil" }));
    expect(screen.getByText("2 of 2")).toBeTruthy();
    expect(screen.getByText("Not handed in")).toBeTruthy();
    expect(screen.getByLabelText("Mark for ZZ Bhavesh")).toHaveDisplayValue("15");
    // Blank clears a mark.
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Bhavesh"), "");
    expect(screen.getByText("2 not saved yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    expect(await screen.findByText("Marks saved: 2")).toBeTruthy();
    expect(teachingGradesBodySchema.parse(calls().find((c) => c.line === GRADES)!.body)).toEqual({
      grades: [
        { studentMembershipId: ID.pupil1, score: 17.5, comment: "ZZ neat steps" },
        { studentMembershipId: ID.pupil2, score: null, comment: "ZZ good" },
      ],
    });
    await waitFor(() => expect(screen.queryByText(/not saved yet/)).toBeNull());
    // The last pupil's way on is back to the roll.
    await fireEvent.press(screen.getByRole("button", { name: "All pupils" }));
    expect(screen.getByRole("button", { name: "Start marking" })).toBeTruthy();
  });

  it("a mark far over the maximum is caught before the server is asked; letters never reach the field", async () => {
    const { calls } = await mountStaff(detail(), "TEACHER", { [GET]: () => json(BOOK) });
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Asha, Handed in" }));
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "45");
    expect(screen.getAllByText("1 mark is not a usable number.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save marks" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    expect(calls().filter((c) => c.line === GRADES)).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "abc");
    expect(screen.getByLabelText("Mark for ZZ Asha")).toHaveDisplayValue("");
  });

  it("a draft publishes only after a second tap", async () => {
    const { calls } = await mountStaff(detail(), "TEACHER", { [GET]: () => json(BOOK), [PUBLISH]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish now" }));
    expect(screen.getByText("Publish it now? The class and their guardians are told straight away.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().filter((c) => c.line === PUBLISH)).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Publish now" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Published. The class and their guardians have been told.")).toBeTruthy();
    expect(calls().find((c) => c.line === PUBLISH)?.body).toEqual({ assignmentId: A });
  });

  it("finds a pupil by name; nobody matching and nobody on the roll each have a door", async () => {
    await mountStaff(detail(), "TEACHER", { [GET]: () => json(PUBLISHED) });
    await screen.findByText("ZZ Fractions worksheet");
    expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull();
    await fireEvent.changeText(screen.getByPlaceholderText("Find a student…"), "bhav");
    expect(screen.queryByRole("button", { name: /^ZZ Asha/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^ZZ Bhavesh/ })).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText("Find a student…"), "qq");
    expect(screen.getByText("Nobody matches “qq”")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("button", { name: /^ZZ Asha/ })).toBeTruthy();

    await mountStaff(detail(), "TEACHER", { [GET]: () => json({ ...PUBLISHED, rows: [], stats: { total: 0, submitted: 0, graded: 0, averagePercent: null } }) });
    await screen.findByText("Nobody is in this class");
    await fireEvent.press(screen.getByRole("button", { name: "Class join code" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/classes/detail", params: { classId: ID.class1 } });
  });

  it("without an assignment it says so, and the door is the list", async () => {
    mockRouter.params = {};
    await mountStaff(detail(), "TEACHER", {});
    expect(screen.getByText("That assignment could not be found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All assignments" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/assignments");
  });

  it("a refused save and a refused load are alerts with a retry", async () => {
    const { calls } = await mountStaff(detail(), "TEACHER", { [GET]: () => json(BOOK), [GRADES]: refused("ZZ this year is closed", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Start marking" }));
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "10");
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ this year is closed");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === GRADES)).toHaveLength(2));
    // Nothing is lost: the mark is still on the card.
    expect(screen.getByLabelText("Mark for ZZ Asha")).toHaveDisplayValue("10");

    const load = await mountStaff(detail(), "TEACHER", { [GET]: refused("ZZ not your class", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not your class");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(load.calls().filter((c) => c.line === GET)).toHaveLength(2));
  });
});

describe("the gradebook's small rules", () => {
  it("blank is fine, a typo is not, over-marking up to twice the maximum is allowed", () => {
    expect(markProblem("", 20_000)).toBe(false);
    expect(markProblem("22", 20_000)).toBe(false);
    expect(markProblem("41", 20_000)).toBe(true);
    expect(markProblem("1.2.3", 20_000)).toBe(true);
    expect(markProblem("999", null)).toBe(false);
  });

  it("sizes read as a person reads them", () => {
    expect(fileSize(300)).toBe("1 KB");
    expect(fileSize(2048)).toBe("2 KB");
    expect(fileSize(1_500_000)).toBe("1.4 MB");
  });
});
