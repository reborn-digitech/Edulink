import { screen } from "@testing-library/react-native";
import { practiceBeganSchema } from "@edulink/contracts";
import { PracticeQuiz } from "@/screens/practice/quiz";
import { __setOutboxStore, memoryOutbox } from "@/lib/outbox";
import { __stopOutboxRunner } from "@/lib/outbox-runner";
import { json, mountStaff } from "./staff-harness";

/**
 * The quiz bank's figure builder (10 Oct 2026): a served question that carries a figure shows it above
 * the stem, with its words as the accessibility label, read from /api/files with the bearer header; a
 * question without one shows no frame.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ATTEMPT = "czz00000000000000000att1";
const TOPIC = { slug: "zz-light", name: "ZZ Light", chapter: "ZZ Chapter 9", subject: "SCIENCE", classLevel: 8, questionCount: 2, level: 1, tierCount: 0, badgeEarned: false, completed: false };
const FIGURE = { fileId: "0f0e0d0c-0b0a-4908-8706-050403020100.png", alt: "ZZ A convex lens with its principal axis and focus marked." };
const began = (image: typeof FIGURE | null) =>
  practiceBeganSchema.parse({
    attemptId: ATTEMPT,
    resumed: false,
    topic: TOPIC,
    assignment: null,
    question: { questionId: "zzq1", stem: "ZZ Where does the ray cross the axis?", choices: ["At F", "At O"], difficulty: 1, askedCount: 0, totalCount: 2, image },
  });

beforeEach(() => {
  mockRouter.params = { mode: "topic", slug: "zz-light" };
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
});

describe("a practice question's figure", () => {
  it("is drawn above the stem with its words as the label", async () => {
    await mountStaff(<PracticeQuiz />, "STUDENT", { "POST /api/v1/practice/attempts": () => json(began(FIGURE)) });
    await screen.findByText("ZZ Where does the ray cross the axis?");
    expect(screen.getByTestId("question-figure")).toBeTruthy();
    const image = await screen.findByLabelText(FIGURE.alt);
    const source = image.props.source as { uri: string; headers?: Record<string, string> } | { uri: string; headers?: Record<string, string> }[];
    const first = Array.isArray(source) ? source[0]! : source;
    expect(first.uri).toMatch(/\/api\/files\/0f0e0d0c-0b0a-4908-8706-050403020100\.png$/);
  });

  it("leaves no frame when the question has none", async () => {
    await mountStaff(<PracticeQuiz />, "STUDENT", { "POST /api/v1/practice/attempts": () => json(began(null)) });
    await screen.findByText("ZZ Where does the ray cross the axis?");
    expect(screen.queryByTestId("question-figure")).toBeNull();
  });
});

describe("a revision question's figure", () => {
  it("comes back with the question", async () => {
    mockRouter.params = { mode: "revision" };
    await mountStaff(<PracticeQuiz />, "STUDENT", {
      "GET /api/v1/practice/revision": () => json({ items: [{ questionId: "zzq1", topicSlug: "zz-light", topicName: "ZZ Light", subject: "SCIENCE" }] }),
      "GET /api/v1/practice/revision/question": () => json({ questionId: "zzq1", topicSlug: "zz-light", stem: "ZZ Where does the ray cross the axis?", choices: ["At F", "At O"], difficulty: 1, image: FIGURE }),
    });
    await screen.findByText("ZZ Where does the ray cross the axis?");
    expect(await screen.findByLabelText(FIGURE.alt)).toBeTruthy();
  });
});
