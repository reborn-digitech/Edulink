import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { contestBankSchema, contestBankTopicSchema } from "@edulink/contracts";
import { QuestionBank } from "@/screens/operator/question-bank";
import { gated, json, mountStaff, refused, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const BANK_PATH = "/api/v1/appadmin/bank";
const TOPIC_PATH = "/api/v1/appadmin/bank/t1";
const ADD = "/api/v1/appadmin/bank/t1/questions";
const EDIT = "/api/v1/appadmin/bank/t1/questions/q1";
const BANK = contestBankSchema.parse({
  translationOn: true,
  topics: [
    { id: "t1", subject: "MATHS", classLevel: 6, chapter: "Chapter 1", name: "ZZ Fractions", questionCount: 2 },
    { id: "t2", subject: "SCIENCE", classLevel: 7, chapter: "Chapter 3", name: "ZZ Light", questionCount: 1 },
  ],
});
const TOPIC = contestBankTopicSchema.parse({
  translationOn: true,
  topic: { id: "t1", subject: "MATHS", classLevel: 6, chapter: "Chapter 1", name: "ZZ Fractions" },
  questions: [
    { id: "q1", difficulty: 2, stem: "ZZ What is 1/2 + 1/4?", choices: ["3/4", "2/6", "1/8", "1"], answerIndex: 0, solution: "ZZ Make the bottoms match: 2/4 + 1/4.", languages: ["hi", "mr"] },
    { id: "q2", difficulty: 3, stem: "ZZ Which is bigger, 2/3 or 3/5?", choices: ["2/3", "3/5"], answerIndex: 0, solution: "ZZ Cross-multiply.", languages: [] },
  ],
});
const mount = (answers: Parameters<typeof mountStaff>[2]) => mountStaff(<QuestionBank />, "ADMIN", answers, { me: CURATOR });

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = {};
});

describe("the question bank", () => {
  it("loads, then shows the chapters by subject with their counts, and opens one", async () => {
    const gate = gated();
    const { calls } = await mount({ [`GET ${BANK_PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BANK));
    await screen.findByText("ZZ Fractions");
    expect(screen.getByText("Maths")).toBeTruthy();
    expect(screen.getByText("Science")).toBeTruthy();
    expect(screen.getByText("Class 6 · Chapter 1 · 2 questions")).toBeTruthy();
    expect(screen.getByText("Class 7 · Chapter 3 · 1 question")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${BANK_PATH}`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Fractions,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/question-bank", params: { topicId: "t1" } });
  });

  it("an empty bank says it is filled by the content scripts, and the door asks again", async () => {
    const { calls } = await mount({ [`GET ${BANK_PATH}`]: () => json({ translationOn: false, topics: [] }) });
    expect(await screen.findByText("No chapters yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${BANK_PATH}`)).toHaveLength(2));
  });

  it("a chapter lists its questions with their level and languages, and opens one", async () => {
    mockRouter.params = { topicId: "t1" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC) });
    expect(await screen.findByText("ZZ Fractions")).toBeTruthy();
    expect(screen.getByText("Class 6 · Chapter 1")).toBeTruthy();
    expect(screen.getByText("2 questions")).toBeTruthy();
    expect(screen.getByText("Level 2 · EN · HI · MR")).toBeTruthy();
    expect(screen.getByText("Level 3 · EN")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ What is 1\/2 \+ 1\/4\?,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/question-bank", params: { topicId: "t1", questionId: "q1" } });
  });

  it("adds a question: blank options dropped, the answer re-pointed at the option it marked, and the chapter re-reads", async () => {
    mockRouter.params = { topicId: "t1" };
    const { calls } = await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`POST ${ADD}`]: () => json({ questionId: "q9", translated: true }, 201) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a question" }));
    expect(await screen.findByText("Saving translates this to Hindi and Marathi automatically.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("The question"), "ZZ What is 2 + 2?");
    await fireEvent.changeText(screen.getByLabelText("Option 1"), "3");
    await fireEvent.changeText(screen.getByLabelText("Option 3"), "4");
    await fireEvent.press(screen.getByRole("radio", { name: "Option 3 is the correct answer" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Level 2 · Understand" }));
    await fireEvent.changeText(screen.getByLabelText("The worked solution"), "ZZ Count on from 2.");
    await fireEvent.press(screen.getByRole("button", { name: "Save question" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${ADD}`)?.body).toEqual({ difficulty: 2, stem: "ZZ What is 2 + 2?", choices: ["3", "4"], answerIndex: 1, solution: "ZZ Count on from 2." }));
    // Back on the chapter, which asks again.
    expect(await screen.findByText("Level 2 · EN · HI · MR")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${TOPIC_PATH}`)).toHaveLength(2));
  });

  it("marking an empty option as the answer is caught on the phone, and nothing is sent", async () => {
    mockRouter.params = { topicId: "t1" };
    const { calls } = await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a question" }));
    await fireEvent.changeText(await screen.findByLabelText("The question"), "ZZ What is 2 + 2?");
    await fireEvent.changeText(screen.getByLabelText("Option 2"), "4");
    await fireEvent.changeText(screen.getByLabelText("The worked solution"), "ZZ Count on.");
    await fireEvent.press(screen.getByRole("button", { name: "Save question" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mark which option is the correct answer.");
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("a refused question is the server's sentence; a server that fell over offers a retry", async () => {
    mockRouter.params = { topicId: "t1" };
    let answer: Answer = () => json({ error: "Give at least two options, none of them empty.", code: "BAD_REQUEST" }, 422);
    const { calls } = await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`POST ${ADD}`]: (req) => answer(req) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a question" }));
    await fireEvent.changeText(await screen.findByLabelText("The question"), "ZZ What is 2 + 2?");
    await fireEvent.changeText(screen.getByLabelText("Option 1"), "4");
    await fireEvent.changeText(screen.getByLabelText("The worked solution"), "ZZ Count on.");
    await fireEvent.press(screen.getByRole("button", { name: "Save question" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Give at least two options, none of them empty.");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    answer = refused("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Save question" }));
    // The first refusal's alert is still on screen until the second answer lands.
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("ZZ not now."));
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${ADD}`)).toHaveLength(3));
  });

  it("one question shows the options with the right one marked and the solution; editing it re-translates it", async () => {
    mockRouter.params = { topicId: "t1", questionId: "q1" };
    const { calls } = await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`POST ${EDIT}`]: () => json({ questionId: "q1", translated: false }) });
    expect(await screen.findByText("ZZ What is 1/2 + 1/4?")).toBeTruthy();
    expect(screen.getByText("Level 2 · Understand")).toBeTruthy();
    expect(screen.getByLabelText("3/4. Option 1 is the correct answer")).toBeTruthy();
    expect(screen.getByText("ZZ Make the bottoms match: 2/4 + 1/4.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByText("Edit question")).toBeTruthy();
    expect(screen.getByLabelText("The question")).toHaveDisplayValue("ZZ What is 1/2 + 1/4?");
    await fireEvent.changeText(screen.getByLabelText("The worked solution"), "ZZ Quarters: 2/4 + 1/4 = 3/4.");
    await fireEvent.press(screen.getByRole("button", { name: "Save question" }));
    await waitFor(() =>
      expect(calls().find((c) => c.line === `POST ${EDIT}`)?.body).toEqual({ difficulty: 2, stem: "ZZ What is 1/2 + 1/4?", choices: ["3/4", "2/6", "1/8", "1"], answerIndex: 0, solution: "ZZ Quarters: 2/4 + 1/4 = 3/4." }),
    );
    expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  });

  it("a chapter with no questions says so, and its door is adding one", async () => {
    mockRouter.params = { topicId: "t1" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json({ ...TOPIC, questions: [] }) });
    expect(await screen.findByText("No questions in this chapter")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add a question" }));
    expect(await screen.findByLabelText("The question")).toBeTruthy();
  });

  it("a question that is not in the chapter says so, and goes to the chapter", async () => {
    mockRouter.params = { topicId: "t1", questionId: "q404" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC) });
    expect(await screen.findByText("No such question.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Fractions" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/question-bank", params: { topicId: "t1" } });
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ [`GET ${BANK_PATH}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${BANK_PATH}`)).toHaveLength(2));
  });
});
