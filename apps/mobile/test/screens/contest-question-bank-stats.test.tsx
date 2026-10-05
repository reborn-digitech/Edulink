import { screen } from "@testing-library/react-native";
import { bankStatsSchema, contestBankTopicSchema } from "@edulink/contracts";
import { QuestionBank } from "@/screens/operator/question-bank";
import { json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
const TOPIC_PATH = "/api/v1/appadmin/bank/t1";
const STATS_PATH = "/api/v1/appadmin/bank/stats";
const TOPIC = contestBankTopicSchema.parse({
  translationOn: true,
  topic: { id: "t1", subject: "MATHS", classLevel: 6, chapter: "Chapter 1", name: "ZZ Fractions" },
  questions: [
    { id: "q1", difficulty: 2, stem: "ZZ What is 1/2 + 1/4?", choices: ["3/4", "2/6"], answerIndex: 0, solution: "ZZ Make the bottoms match.", languages: ["hi", "mr"], reviewed: { hi: true, mr: false }, stats: { asked: 40, correct: 30, correctRate: 75, avgSeconds: 12 } },
    { id: "q2", difficulty: 3, stem: "ZZ Which is bigger?", choices: ["2/3", "3/5"], answerIndex: 0, solution: "ZZ Cross-multiply.", languages: [], reviewed: { hi: false, mr: false }, stats: null },
  ],
});
const STATS = bankStatsSchema.parse({
  questionId: "q1",
  asked: 40,
  correct: 30,
  correctRate: 75,
  avgSeconds: 12,
  byGrade: [
    { grade: 6, asked: 30, correct: 24, correctRate: 80, avgSeconds: 11 },
    { grade: 0, asked: 10, correct: 6, correctRate: 60, avgSeconds: 15 },
  ],
  updatedAt: "2026-10-01T04:20:00.000Z",
});
const mount = (answers: Parameters<typeof mountStaff>[2]) => mountStaff(<QuestionBank />, "ADMIN", answers, { me: CURATOR });

describe("the question bank's review flags and statistics", () => {
  it("a chapter's rows say which translations were read and how the question is doing", async () => {
    mockRouter.params = { topicId: "t1" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC) });
    expect(await screen.findByText("Level 2 · EN · HI · MR · Hindi read · 40 answered · 75% right · 12 s")).toBeTruthy();
    expect(screen.getByText("Level 3 · EN")).toBeTruthy();
  });

  it("one question shows its flags, then its numbers whole and by grade, with when they were counted", async () => {
    mockRouter.params = { topicId: "t1", questionId: "q1" };
    const { calls } = await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`GET ${STATS_PATH}`]: () => json(STATS) });
    expect(await screen.findByText("Hindi read")).toBeTruthy();
    expect(screen.queryByText("Marathi read")).toBeNull();
    expect(await screen.findByLabelText("40 answered: 40")).toBeTruthy();
    expect(screen.getByLabelText("75% right: 75%")).toBeTruthy();
    expect(screen.getByLabelText("12 s on average: 12")).toBeTruthy();
    expect(screen.getByText("Grade 6")).toBeTruthy();
    expect(screen.getByText("Grade not recorded")).toBeTruthy();
    expect(screen.getByText("10 answered · 60% right · 15 s")).toBeTruthy();
    expect(screen.getByText(/^Counted 01\/10\/2026 · Counted every night; today's answers appear tomorrow\.$/)).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${STATS_PATH}?questionId=q1`)).toBe(true);
  });

  it("a question nobody has answered says so; a refused count is an alert with a retry", async () => {
    mockRouter.params = { topicId: "t1", questionId: "q2" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`GET ${STATS_PATH}`]: () => json({ ...STATS, questionId: "q2", asked: 0, correct: 0, correctRate: null, avgSeconds: null, byGrade: [], updatedAt: null }) });
    expect(await screen.findByText("No child has answered this question yet.")).toBeTruthy();
    mockRouter.params = { topicId: "t1", questionId: "q1" };
    await mount({ [`GET ${TOPIC_PATH}`]: () => json(TOPIC), [`GET ${STATS_PATH}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
