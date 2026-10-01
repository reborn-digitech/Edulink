import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { ReportCardRules, scaleProblems, wholePercent } from "@/screens/staff/report-card-rules";
import { json, mountStaff, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

const CONFIG = "/api/v1/office/report-card-config";
const LAYOUT = { font: "default", signerLeft: "NONE", signerRight: "PRINCIPAL", showSeal: false, showAttendance: true, showPractice: false, showCoScholastic: true, showGradePoints: false, showAddress: true, showSignatures: true, showRemark: true, useBrandColour: false, signatureLeft: "Class teacher", signatureRight: "Principal", headerNote: null, footerNote: null, paper: "A4" };
const view = (over: Record<string, unknown> = {}) => ({
  preset: "cbse",
  bands: [
    { label: "A1", minPercent: 91, points: 10, descriptor: "Outstanding" },
    { label: "B1", minPercent: 71, points: 8, descriptor: null },
    { label: "E", minPercent: 0, points: null, descriptor: null },
  ],
  coScholastic: { areas: ["Discipline", "Art"], scale: [{ label: "A", descriptor: "Outstanding" }, { label: "B", descriptor: null }] },
  kindWeights: { UNIT_TEST: 20, MID_TERM: 30, FINAL: 50 },
  layout: LAYOUT,
  presets: [
    { key: "cbse", name: "CBSE", bands: [{ label: "A1", minPercent: 91, points: 10, descriptor: "Outstanding" }, { label: "B1", minPercent: 71, points: 8, descriptor: null }, { label: "E", minPercent: 0, points: null, descriptor: null }] },
    { key: "simple", name: "ZZ Simple", bands: [{ label: "Pass", minPercent: 35, points: null, descriptor: null }, { label: "Fail", minPercent: 0, points: null, descriptor: null }] },
  ],
  terms: [
    { id: "t1", name: "ZZ Term 1", weightPercent: 40 },
    { id: "t2", name: "ZZ Term 2", weightPercent: 60 },
  ],
  ...over,
});

const mount = (role: "ADMIN" | "PRINCIPAL", answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <ReportCardRules />
    </ToastProvider>,
    role,
    answers,
  );

describe("the form's rules", () => {
  it("a weight is a whole number from 0 to 100, blank is null, anything else is undefined", () => {
    expect(wholePercent(" 40 ")).toBe(40);
    expect(wholePercent("")).toBeNull();
    expect(wholePercent("101")).toBeUndefined();
    expect(wholePercent("4.5")).toBeUndefined();
    expect(wholePercent("abc")).toBeUndefined();
  });

  it("says in words where the scale has a gap or two bands start together", () => {
    expect(scaleProblems([])).toEqual([]);
    expect(scaleProblems([{ label: "A", minPercent: 50 }, { label: "B", minPercent: 0 }])).toEqual([]);
    expect(scaleProblems([{ label: "A", minPercent: 50 }, { label: "B", minPercent: 50 }, { label: "C", minPercent: 10 }])).toEqual([
      { kind: "overlap", percent: 50, first: "A", second: "B" },
      { kind: "gap", from: 0, to: 9 },
    ]);
    expect(scaleProblems([{ label: "A", minPercent: null }])).toEqual([]);
  });
});

describe("the report card rules screen", () => {
  it("loads the rules into every section: the preset and its bands, the areas and scale, the weights with their totals, the layout", async () => {
    await mount("ADMIN", { [`GET ${CONFIG}`]: () => json(view()) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Grading scale");
    expect(screen.getByRole("radio", { name: "CBSE" })).toBeChecked();
    expect(screen.getByLabelText("Grade 1")).toHaveDisplayValue("A1");
    expect(screen.getByLabelText("From % 2")).toHaveDisplayValue("71");
    expect(screen.getByText("Every mark from 0 to 100 has a grade.")).toBeTruthy();
    expect(screen.getByLabelText("Area 1")).toHaveDisplayValue("Discipline");
    expect(screen.getByLabelText("Scale · Means 1")).toHaveDisplayValue("Outstanding");
    expect(screen.getByLabelText("Final")).toHaveDisplayValue("50");
    expect(screen.getAllByText("Total: 100").length).toBe(2);
    expect(screen.getByLabelText("ZZ Term 2")).toHaveDisplayValue("60");
    expect(screen.getByRole("switch", { name: "Attendance" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Practice annexure" })).not.toBeChecked();
    expect(screen.getAllByRole("radio", { name: "The principal" })[1]).toBeChecked();
    expect(screen.getAllByRole("radio", { name: "The principal" })[0]).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "A4" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save the rules" })).toBeTruthy();
  });

  it("the head reads and cannot change: no save, every control locked", async () => {
    await mount("PRINCIPAL", { [`GET ${CONFIG}`]: () => json(view()) });
    await screen.findByText("Grading scale");
    expect(screen.getByText(/^The school office sets this up/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save the rules" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add a band" })).toBeNull();
    expect(screen.getByRole("switch", { name: "Attendance" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "CBSE" })).toBeDisabled();
  });

  it("⚠ a weight that is not one is caught before anything is sent, and the scale's gap and overlap are said as it is typed", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${CONFIG}`]: () => json(view()) });
    await screen.findByText("Grading scale");
    await fireEvent.changeText(screen.getByLabelText("Mid-term"), "abc");
    await fireEvent.changeText(screen.getByLabelText("From % 3"), "10");
    expect(screen.getByText("Marks from 0 to 9 get no grade.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("From % 2"), "91");
    expect(screen.getByText(/^Two grades start at 91: A1 and B1\./)).toBeTruthy();
    expect(screen.getByText(/^Total: 70/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save the rules" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Some of this needs another look.");
    expect(screen.getAllByText("A weight is a whole number from 0 to 100.").length).toBe(1);
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("⚠ saves the whole document to the web's endpoint, a term's changed share to the term first; editing a band makes the preset custom; a preset chosen fills the bands", async () => {
    const { calls } = await mount("ADMIN", {
      [`GET ${CONFIG}`]: () => json(view()),
      "POST /api/v1/office/terms/t1/weight": () => json({ weightPercent: 50 }),
      [`POST ${CONFIG}`]: ({ init }) => json(JSON.parse(String(init.body))),
    });
    await screen.findByText("Grading scale");
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Simple" }));
    expect(screen.getByLabelText("Grade 1")).toHaveDisplayValue("Pass");
    await fireEvent.changeText(screen.getByLabelText("Descriptor 1"), "Passed");
    expect(screen.getByRole("radio", { name: "Custom" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Add a band" }));
    await fireEvent.changeText(screen.getByLabelText("Grade 3"), "Top");
    await fireEvent.changeText(screen.getByLabelText("From % 3"), "90");
    await fireEvent.changeText(screen.getByLabelText("Points 3"), "9.5");
    await fireEvent.press(screen.getByRole("button", { name: "Remove Fail" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add an area" }));
    await fireEvent.changeText(screen.getByLabelText("Area 3"), " Music ");
    await fireEvent.press(screen.getByRole("button", { name: "Remove Art" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add a grade" }));
    await fireEvent.changeText(screen.getByLabelText("Scale · Grade 3"), "C");
    await fireEvent.changeText(screen.getByLabelText("ZZ Term 1"), "50");
    await fireEvent.press(screen.getByRole("switch", { name: "Practice annexure" }));
    await fireEvent.press(screen.getAllByRole("radio", { name: "The class teacher" })[0]!);
    await fireEvent.changeText(screen.getByLabelText(/^Line under the school/), "  CBSE affiliation 12345  ");
    await fireEvent.press(screen.getByRole("radio", { name: "Letter" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the rules" }));
    await screen.findByText("Report card rules saved.");
    const lines = calls().filter((c) => c.line.startsWith("POST")).map((c) => c.line);
    expect(lines).toEqual(["POST /api/v1/office/terms/t1/weight", `POST ${CONFIG}`]);
    expect(calls().find((c) => c.line === "POST /api/v1/office/terms/t1/weight")!.body).toEqual({ weightPercent: 50 });
    expect(calls().find((c) => c.line === `POST ${CONFIG}`)!.body).toEqual({
      preset: "custom",
      bands: [
        { label: "Pass", minPercent: 35, points: null, descriptor: "Passed" },
        { label: "Top", minPercent: 90, points: 9.5, descriptor: null },
      ],
      coScholastic: { areas: ["Discipline", "Music"], scale: [{ label: "A", descriptor: "Outstanding" }, { label: "B", descriptor: null }, { label: "C", descriptor: null }] },
      kindWeights: { UNIT_TEST: 20, MID_TERM: 30, FINAL: 50 },
      layout: { ...LAYOUT, showPractice: true, signerLeft: "TEACHER", headerNote: "CBSE affiliation 12345", paper: "LETTER" },
    });
  });

  it("the server's refusal is shown; no terms says so; a blank among the shares is said", async () => {
    await mount("ADMIN", { [`GET ${CONFIG}`]: () => json(view({ terms: [] })), [`POST ${CONFIG}`]: () => json({ error: "ZZ two bands share a label.", code: "BAD_REQUEST" }, 422) });
    await screen.findByText("Grading scale");
    expect(screen.getByText(/^No terms in the current year yet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save the rules" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ two bands share a label.");
  });

  it("every term blank means equal shares; one blank among them is incomplete; shares off 100 are said", async () => {
    await mount("ADMIN", { [`GET ${CONFIG}`]: () => json(view({ terms: [{ id: "t1", name: "ZZ Term 1", weightPercent: null }, { id: "t2", name: "ZZ Term 2", weightPercent: null }] })) });
    await screen.findByText("Grading scale");
    expect(screen.getByText("Every term blank: equal shares.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("ZZ Term 1"), "30");
    expect(screen.getByText(/^Give every term a share, or none/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("ZZ Term 2"), "30");
    expect(screen.getByText("The shares add up to 60, not 100.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Unit tests"), "0");
    await fireEvent.changeText(screen.getByLabelText("Mid-term"), "0");
    await fireEvent.changeText(screen.getByLabelText("Final"), "0");
    expect(screen.getByText(/^Total: 0 All zero/)).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText("Final")).toHaveDisplayValue("0"));
  });
});
