import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import {
  practiceAnswerBodySchema,
  practiceAnsweredSchema,
  practiceBeganSchema,
  practiceNextSchema,
  practiceRevealBodySchema,
  practiceRevealedSchema,
  practiceRevisionAnswerBodySchema,
  practiceRevisionAnsweredSchema,
  practiceRevisionQuestionSchema,
  practiceRevisionSchema,
} from "@edulink/contracts";
import { PracticeQuiz } from "@/screens/practice/quiz";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { gated, json, mountStaff, offline, refused, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ATTEMPT = "czz00000000000000000att1";
const SET = "czz00000000000000000set1";
const TOPIC = { slug: "zz-fractions", name: "ZZ Fractions", chapter: "ZZ Chapter 1", subject: "MATHS", classLevel: 5, questionCount: 3, level: 1, tierCount: 0, badgeEarned: false, completed: false };
const Q1 = { questionId: "zzq1", stem: "ZZ What is half of 8?", choices: ["4", "2", "8"], difficulty: 1, askedCount: 0, totalCount: 3 };
const Q2 = { questionId: "zzq2", stem: "ZZ What is a quarter of 8?", choices: ["2", "4"], difficulty: 2, askedCount: 1, totalCount: 3 };
const BEGAN = practiceBeganSchema.parse({ attemptId: ATTEMPT, resumed: false, topic: TOPIC, assignment: null, question: Q1 });
const result = (over: Record<string, unknown> = {}) => practiceAnsweredSchema.parse({ replayed: false, result: { correct: true, answerIndex: 0, solution: "ZZ 8 ÷ 2 = 4.", newLevel: 1, finished: false, badgeAwarded: false, ...over } });
const NEXT_Q2 = practiceNextSchema.parse({ question: Q2 });
const NEXT_DONE = practiceNextSchema.parse({ question: null });

const P = "/api/v1/practice";
const buzz = () => (Haptics.notificationAsync as unknown as jest.Mock).mock.calls.map((c) => c[0]);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.back.mockClear();
  mockRouter.params = { mode: "topic", slug: "zz-fractions" };
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  jest.spyOn(Haptics, "notificationAsync").mockClear();
});

describe("the practice player", () => {
  it("loads, then serves the question with its rung and the count; a right answer is marked in colour, words and a buzz, with the working; next serves the following one", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: gate.answer,
      [`POST ${P}/answer`]: () => json(result()),
      [`GET ${P}/next`]: () => json(NEXT_Q2),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BEGAN));
    await screen.findByText("ZZ What is half of 8?");
    expect(calls().find((c) => c.line === `POST ${P}/attempts`)?.body).toEqual({ slug: "zz-fractions", language: "en" });
    expect(screen.getByText("ZZ Fractions")).toBeTruthy();
    expect(screen.getByText("L1 · Remember")).toBeTruthy();
    expect(screen.getByText("1 of 3")).toBeTruthy();
    // The served question never carried the answer, so nothing is marked yet.
    expect(screen.queryByText("How it works")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "A. 4" }));
    expect(await screen.findByText("Got it right!")).toBeTruthy();
    expect(screen.getByText("ZZ 8 ÷ 2 = 4.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "A. 4, the right answer" })).toBeDisabled();
    expect(buzz()).toContain("success");
    const answer = calls().find((c) => c.line === `POST ${P}/answer`)!;
    expect(practiceAnswerBodySchema.parse(answer.body)).toEqual({ attemptId: ATTEMPT, questionId: "zzq1", chosenIndex: 0, clientId: expect.any(String), language: "en" });

    await fireEvent.press(screen.getByRole("button", { name: "Next question" }));
    await screen.findByText("ZZ What is a quarter of 8?");
    expect(calls().some((c) => c.line === `GET ${P}/next?attemptId=${ATTEMPT}&language=en`)).toBe(true);
    expect(screen.getByText("2 of 3")).toBeTruthy();
    expect(screen.getByText("L2 · Understand")).toBeTruthy();
  });

  it("a wrong answer buzzes an error and marks the right one; the last question ends in a summary with the next step", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json({ ...BEGAN, question: { ...Q2, askedCount: 2 } }),
      [`POST ${P}/answer`]: () => json(result({ correct: false, answerIndex: 0, solution: "ZZ 8 ÷ 4 = 2.", finished: true })),
      [`GET ${P}/next`]: () => json(NEXT_DONE),
    });
    await screen.findByText("3 of 3");
    await fireEvent.press(screen.getByRole("button", { name: "B. 4" }));
    expect(await screen.findByText("Not this time — the working is below.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "A. 2, the right answer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "B. 4, your answer" })).toBeTruthy();
    expect(buzz()).toContain("error");

    await fireEvent.press(screen.getByRole("button", { name: "Next question" }));
    expect(await screen.findByText("ZZ Fractions — finished")).toBeTruthy();
    expect(screen.getByLabelText("Answered this time: 1")).toBeTruthy();
    expect(screen.getByLabelText("Right: 0")).toBeTruthy();
    expect(screen.getByLabelText("Level: L1")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to practice" }));
    expect(mockRouter.back).toHaveBeenCalled();
    // A fresh run opens a new sitting: the finished one stays finished.
    await fireEvent.press(screen.getByRole("button", { name: "Start a fresh run" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${P}/attempts`)).toHaveLength(2));
  });

  it("finishing without peeking wins the badge", async () => {
    await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json({ ...BEGAN, question: { ...Q2, askedCount: 2 } }),
      [`POST ${P}/answer`]: () => json(result({ newLevel: 2, finished: true, badgeAwarded: true })),
      [`GET ${P}/next`]: () => json(NEXT_DONE),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "A. 2" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Next question" }));
    expect(await screen.findByText("ZZ Fractions — done, without peeking")).toBeTruthy();
    expect(screen.getByLabelText("Level: L2")).toBeTruthy();
  });

  it("showing the working asks first and says what it costs, then shows it and moves on", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json(BEGAN),
      [`POST ${P}/reveal`]: () => json(practiceRevealedSchema.parse({ solution: "ZZ halve it.", answerIndex: 0, badgeForfeited: true })),
      [`GET ${P}/next`]: () => json(NEXT_Q2),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Show me how it works" }));
    expect(screen.getByText("Showing the working means no badge for ZZ Fractions this run.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "I'll keep trying" }));
    expect(calls().filter((c) => c.line === `POST ${P}/reveal`)).toHaveLength(0);

    await fireEvent.press(screen.getByRole("button", { name: "Show me how it works" }));
    await fireEvent.press(screen.getByRole("button", { name: "Yes, show me" }));
    expect(await screen.findByText("ZZ halve it.")).toBeTruthy();
    expect(practiceRevealBodySchema.parse(calls().find((c) => c.line === `POST ${P}/reveal`)!.body)).toEqual({ attemptId: ATTEMPT, questionId: "zzq1", language: "en" });
    expect(screen.getByText(/^You have opened a solution in this run/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "A. 4, the right answer" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Skip to the next one" }));
    await screen.findByText("ZZ What is a quarter of 8?");
  });

  it("offline, the answer is kept on the device and sent later; the verdict arrives once the outbox flushes", async () => {
    let answerNow: Answer = offline;
    const { fetch, calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json(BEGAN),
      [`POST ${P}/answer`]: (req) => answerNow(req),
    });
    __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
    await fireEvent.press(await screen.findByRole("button", { name: "C. 8" }));
    expect(await screen.findByText("You're offline — your answer is saved")).toBeTruthy();
    expect(screen.getByText("1 waiting to send")).toBeTruthy();
    // A warning buzz (the setup's haptics mock names only Success and Error, so the pattern arrives unnamed).
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    const queued = await listQueued(`practice:${ATTEMPT}`);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.url).toBe(`${P}/answer`);
    const body = practiceAnswerBodySchema.parse(JSON.parse(queued[0]!.body));
    expect(body).toMatchObject({ attemptId: ATTEMPT, questionId: "zzq1", chosenIndex: 2 });
    // Nothing else can be tapped while the answer waits.
    expect(screen.getByRole("button", { name: "A. 4" })).toBeDisabled();

    answerNow = () => json(result({ correct: false }));
    expect(await flushOutbox()).toEqual({ sent: 1, failed: 0, remaining: 0 });
    expect(await screen.findByText("Not this time — the working is below.")).toBeTruthy();
    const posts = calls().filter((c) => c.line === `POST ${P}/answer`);
    // The replay and the re-ask carry the same tap: one client id throughout, so the server counts it once.
    expect(new Set(posts.map((c) => (c.body as { clientId: string }).clientId)).size).toBe(1);
    expect(screen.queryByText("You're offline — your answer is saved")).toBeNull();
    await waitFor(() => expect(screen.queryByText("1 waiting to send")).toBeNull());
  });

  it("the next question needs the server: offline, it says so and the same button retries", async () => {
    let nextNow: Answer = offline;
    await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json(BEGAN),
      [`POST ${P}/answer`]: () => json(result()),
      [`GET ${P}/next`]: (req) => nextNow(req),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "A. 4" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Next question" }));
    expect(await screen.findByText("The connection dropped. Try that again.")).toBeTruthy();
    nextNow = () => json(NEXT_Q2);
    await fireEvent.press(screen.getByRole("button", { name: "Next question" }));
    await screen.findByText("ZZ What is a quarter of 8?");
    expect(screen.queryByText("The connection dropped. Try that again.")).toBeNull();
  });

  it("an answer the server refuses is its sentence with a retry, never queued", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json(BEGAN),
      [`POST ${P}/answer`]: refused("ZZ That sitting is not yours.", 404),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "A. 4" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ That sitting is not yours.");
    expect(await listQueued()).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${P}/answer`)).toHaveLength(2));
  });

  it("a refused first load is an alert with a retry; with no network it says practice needs one", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", { [`POST ${P}/attempts`]: refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${P}/attempts`)).toHaveLength(2));

    await mountStaff(<PracticeQuiz />, "STUDENT", { [`POST ${P}/attempts`]: offline });
    expect(await screen.findByRole("alert")).toHaveTextContent(/^You're offline\. The questions come from the school's server/);
  });

  it("picking a chapter up half-way says so; the reading language switch re-serves the same sitting", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", { [`POST ${P}/attempts`]: () => json({ ...BEGAN, resumed: true, question: Q2 }) });
    expect(await screen.findByText("Picking up where you left off.")).toBeTruthy();
    expect(screen.getByText("2 of 3")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Hindi" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${P}/attempts`).map((c) => c.body)).toContainEqual({ slug: "zz-fractions", language: "hi" }));
  });

  it("a chapter the teacher set opens by its id, with the pupil's standing against the target", async () => {
    mockRouter.params = { mode: "assigned", assignmentId: SET };
    const assigned = { ...BEGAN, question: { ...Q2, askedCount: 2 }, assignment: { id: SET, targetLevel: 2, targetTierName: "Learner", myLevel: 1, reached: false, note: "ZZ by Friday", dueAt: null } };
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`POST ${P}/attempts`]: () => json(practiceBeganSchema.parse(assigned)),
      [`POST ${P}/answer`]: () => json(result({ newLevel: 2, finished: true })),
      [`GET ${P}/next`]: () => json(NEXT_DONE),
    });
    expect(await screen.findByText("Set by your teacher")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${P}/attempts`)?.body).toEqual({ assignmentId: SET, language: "en" });
    expect(screen.getByText("Target: Learner · L2")).toBeTruthy();
    expect(screen.getByText("Keep climbing")).toBeTruthy();
    expect(screen.getByText("You are on L1 · Remember · ZZ by Friday")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "A. 2" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Next question" }));
    await screen.findByText("ZZ Fractions — finished");
    expect(screen.getByText("Reached")).toBeTruthy();
    expect(screen.getByText("You are on L2 · Understand · ZZ by Friday")).toBeTruthy();
  });

  it("a guardian has no player: the child plays on their own sign-in", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "PARENT", {});
    expect(await screen.findByText("Practice questions are answered on the child's own sign-in. What they have done shows here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to practice" }));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(calls().some((c) => c.line.startsWith(`POST ${P}`))).toBe(false);
  });
});

describe("smart revision", () => {
  const QUEUE = practiceRevisionSchema.parse({ items: [{ questionId: "zzr1", topicSlug: "zz-plants", topicName: "ZZ Plants", subject: "SCIENCE" }] });
  const SERVED = practiceRevisionQuestionSchema.parse({ questionId: "zzr1", topicSlug: "zz-plants", stem: "ZZ What takes up water?", choices: ["roots", "leaves"], difficulty: 1 });

  beforeEach(() => {
    mockRouter.params = { mode: "revision" };
  });

  it("loads the queue, serves each missed question without its answer, marks it, and ends with the way back", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`GET ${P}/revision`]: gate.answer,
      [`GET ${P}/revision/question`]: () => json(SERVED),
      [`POST ${P}/revision/answer`]: () => json(practiceRevisionAnsweredSchema.parse({ result: { correct: true, answerIndex: 0, solution: "ZZ roots take up water.", newLevel: 1, finished: false, badgeAwarded: false } })),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(QUEUE));
    await screen.findByText("ZZ What takes up water?");
    expect(screen.getByText("ZZ Plants · Science")).toBeTruthy();
    expect(screen.getByText("1 of 1")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${P}/revision/question?questionId=zzr1&language=en`)).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "A. roots" }));
    expect(await screen.findByText("Got it right!")).toBeTruthy();
    expect(screen.getByText("ZZ roots take up water.")).toBeTruthy();
    expect(practiceRevisionAnswerBodySchema.parse(calls().find((c) => c.line === `POST ${P}/revision/answer`)!.body)).toEqual({ questionId: "zzr1", chosenIndex: 0, clientId: expect.any(String), language: "en" });
    await fireEvent.press(screen.getByRole("button", { name: "Next question" }));
    expect(await screen.findByText("Revision done — every waiting question retried.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to practice" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("offline, a revision answer waits in the outbox and the pupil can move on", async () => {
    await mountStaff(<PracticeQuiz />, "STUDENT", {
      [`GET ${P}/revision`]: () => json(QUEUE),
      [`GET ${P}/revision/question`]: () => json(SERVED),
      [`POST ${P}/revision/answer`]: offline,
    });
    await fireEvent.press(await screen.findByRole("button", { name: "B. leaves" }));
    expect(await screen.findByText("You're offline — your answer is saved")).toBeTruthy();
    const queued = await listQueued("practice:revision");
    expect(queued.map((q) => q.url)).toEqual([`${P}/revision/answer`]);
    expect(practiceRevisionAnswerBodySchema.parse(JSON.parse(queued[0]!.body))).toMatchObject({ questionId: "zzr1", chosenIndex: 1 });
    await fireEvent.press(screen.getByRole("button", { name: "Next question" }));
    expect(await screen.findByText("Revision done — every waiting question retried.")).toBeTruthy();
  });

  it("nothing to revise says so, with the way back", async () => {
    await mountStaff(<PracticeQuiz />, "STUDENT", { [`GET ${P}/revision`]: () => json({ items: [] }) });
    expect(await screen.findByText(/^Nothing to revise right now/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All practice" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("a refused queue is an alert with a retry", async () => {
    const { calls } = await mountStaff(<PracticeQuiz />, "STUDENT", { [`GET ${P}/revision`]: refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${P}/revision`)).length).toBe(2));
  });
});
