import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { practiceWorksheetQuerySchema, practiceWorksheetSchema, practiceWorksheetTopicsSchema } from "@edulink/contracts";
import { TeacherWorksheets } from "@/screens/teacher/worksheets";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const TOPICS = practiceWorksheetTopicsSchema.parse({
  topics: [
    { slug: "zz-fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5 },
    { slug: "zz-plants", name: "ZZ Plants", subject: "SCIENCE", classLevel: 5 },
    { slug: "zz-motion", name: "ZZ Motion", subject: "PHYSICS", classLevel: 9 },
  ],
  levels: ["Beginner", "Learner", "Amateur", "Expert", "Pro", "Master"].map((tierName, i) => ({ level: i + 1, tierName })),
  maxQuestions: 30,
});
const sheetFor = (url: URL) =>
  practiceWorksheetSchema.parse({
    topicName: "ZZ Fractions",
    subject: "MATHS",
    classLevel: 5,
    level: Number(url.searchParams.get("level")),
    tierName: "Amateur",
    seed: url.searchParams.get("seed"),
    questions: [
      { number: 1, stem: "ZZ What is half of 8?", choices: ["4", "2"], answerIndex: 0, solution: "ZZ 8 ÷ 2 = 4." },
      { number: 2, stem: "ZZ What is a quarter of 8?", choices: ["4", "2"], answerIndex: 1, solution: "" },
    ],
  });
const W = "/api/v1/practice/worksheets";

beforeEach(() => mockRouter.push.mockClear());

describe("worksheets", () => {
  it("loads, builds a paper from the chapter, rung and count, previews it with its key, prints on the web and reshuffles", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const gate = gated();
    const { calls } = await mountStaff(<TeacherWorksheets />, "TEACHER", {
      [`GET ${W}`]: gate.answer,
      [`GET ${W}/sheet`]: ({ url }) => json(sheetFor(url)),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(TOPICS));
    await screen.findByText("Build a worksheet");
    expect(screen.getByRole("radio", { name: "Class 5" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "ZZ Fractions" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "L3 · Amateur" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "ZZ Motion" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Build the worksheet" }));
    await screen.findByText("1. ZZ What is half of 8?");
    const first = calls().find((c) => c.line.startsWith(`GET ${W}/sheet?`))!;
    const query = practiceWorksheetQuerySchema.parse(Object.fromEntries(new URL(`http://x${first.line.slice(4)}`).searchParams));
    expect(query).toEqual({ slug: "zz-fractions", level: 3, count: 10, seed: expect.stringMatching(/^[a-z0-9]{1,6}$/) });
    expect(screen.getByText("ZZ Fractions · L3 Amateur")).toBeTruthy();
    expect(screen.getByText(`Class 5 · Maths · 2 questions · paper ${query.seed}`)).toBeTruthy();
    expect(screen.getAllByText("(A) 4").length).toBe(2);
    // The key stays folded until asked for.
    expect(screen.queryByText("1. (A) 4")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Show the answer key" }));
    expect(screen.getByText("1. (A) 4")).toBeTruthy();
    expect(screen.getByText("ZZ 8 ÷ 2 = 4.")).toBeTruthy();
    expect(screen.getByText("2. (B) 2")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Print or save as PDF" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/teacher/worksheets/print?slug=zz-fractions&level=3&count=10&seed=${query.seed}`);

    const random = jest.spyOn(Math, "random").mockReturnValue(0.5);
    await fireEvent.press(screen.getByRole("button", { name: "Reshuffle" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${W}/sheet?`)).length).toBe(2));
    expect(calls().filter((c) => c.line.startsWith(`GET ${W}/sheet?`)).at(-1)!.line).toBe(`GET ${W}/sheet?slug=zz-fractions&level=3&count=10&seed=${(0.5).toString(36).slice(2, 8)}`);
    random.mockRestore();
    open.mockRestore();
  });

  it("another class, subject, rung and count travel in the query; a count out of range is refused on the phone", async () => {
    const { calls } = await mountStaff(<TeacherWorksheets />, "TEACHER", {
      [`GET ${W}`]: () => json(TOPICS),
      [`GET ${W}/sheet`]: ({ url }) => json(sheetFor(url)),
    });
    await screen.findByText("Build a worksheet");
    await fireEvent.press(screen.getByRole("radio", { name: "Science" }));
    expect(screen.getByRole("radio", { name: "ZZ Plants" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "L5 · Pro" }));
    await fireEvent.changeText(screen.getByLabelText("Questions"), "40");
    await fireEvent.press(screen.getByRole("button", { name: "Build the worksheet" }));
    expect(screen.getByText("Choose between 1 and 30 questions.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith(`GET ${W}/sheet`))).toBe(false);

    await fireEvent.changeText(screen.getByLabelText("Questions"), "5");
    await fireEvent.press(screen.getByRole("button", { name: "Build the worksheet" }));
    await waitFor(() => expect(calls().some((c) => c.line.startsWith(`GET ${W}/sheet?slug=zz-plants&level=5&count=5&seed=`))).toBe(true));

    await fireEvent.press(screen.getByRole("radio", { name: "Class 9" }));
    expect(screen.getByRole("radio", { name: "ZZ Motion" })).toBeChecked();
  });

  it("a rung with nothing on it is the server's sentence with a retry", async () => {
    const { calls } = await mountStaff(<TeacherWorksheets />, "TEACHER", {
      [`GET ${W}`]: () => json(TOPICS),
      [`GET ${W}/sheet`]: refused("ZZ No questions at that level yet.", 404),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Build the worksheet" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ No questions at that level yet.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${W}/sheet`)).length).toBe(2));
  });

  it("with no chapters in the bank, says so, with the door to practice insights", async () => {
    await mountStaff(<TeacherWorksheets />, "TEACHER", { [`GET ${W}`]: () => json({ ...TOPICS, topics: [] }) });
    expect(await screen.findByText("The practice bank has no chapters yet, so there is nothing to print.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Practice insights" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/practice");
  });

  it("a refused list is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherWorksheets />, "TEACHER", { [`GET ${W}`]: refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${W}`).length).toBe(2));
  });
});
