import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigContributionSchema } from "@edulink/contracts";
import { compact, TeacherContribution } from "@/screens/teacher/contribution";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";
import { MINE } from "./gig-fixtures";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const LIST = "/api/v1/gigs/questions";
const TOPICS = { topics: [{ id: "t1", name: "ZZ Shapes", subject: "MATHS", classLevel: 3, chapter: "ZZ Chapter 5" }, { id: "t2", name: "ZZ Plants", subject: "SCIENCE", classLevel: 4, chapter: "ZZ Chapter 2" }] };
const EN = { stem: "ZZ How many sides has a triangle?", choices: ["Two", "Three"], solution: "ZZ A triangle has three sides." };
const HI = { stem: "ZZ त्रिभुज की कितनी भुजाएँ होती हैं?", choices: ["दो", "तीन"], solution: "ZZ त्रिभुज की तीन भुजाएँ होती हैं।" };
const MR = { stem: "ZZ त्रिकोणाला किती बाजू असतात?", choices: ["दोन", "तीन"], solution: "ZZ त्रिकोणाला तीन बाजू असतात." };
const existing = (over: Record<string, unknown> = {}) => gigContributionSchema.parse({ id: "q1", topic: TOPICS.topics[0], difficulty: 2, answerIndex: 1, en: EN, hi: HI, mr: MR, status: "RETURNED", reviewNote: "ZZ Say which class this is for.", reviewedAt: "2026-09-30T10:00:00.000Z", submittedAt: "2026-09-30T09:00:00.000Z", questionId: null, earning: null, open: true, ...over });
const base = (over: Answers = {}, draftOn = false): Answers => ({ [`GET ${LIST}/topics`]: () => json(TOPICS), [`GET ${LIST}`]: () => json(MINE({ draftOn })), ...over });

const fill = async (language: string, text: { stem: string; choices: string[]; solution: string }, rows = [0, 1]) => {
  await fireEvent.changeText(screen.getByLabelText(`${language} · The question`), text.stem);
  for (const [i, row] of rows.entries()) await fireEvent.changeText(screen.getByLabelText(`${language} · Option ${row + 1}`), text.choices[i]!);
  await fireEvent.changeText(screen.getByLabelText(`${language} · The worked solution`), text.solution);
};

describe("one question for the bank", () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockRouter.params = {};
  });

  it("an option blank in all three languages is dropped and the answer re-pointed; a marked option that is blank is nothing to send", () => {
    const text = (choices: string[]) => ({ stem: " s ", solution: " x ", choices });
    expect(compact({ topicId: "t1", difficulty: 3, answerIndex: 2, en: text(["a", "", "c", ""]), hi: text(["अ", "", "क", ""]), mr: text(["अ", "", "क", ""]) })).toEqual({ difficulty: 3, answerIndex: 1, en: { stem: "s", solution: "x", choices: ["a", "c"] }, hi: { stem: "s", solution: "x", choices: ["अ", "क"] }, mr: { stem: "s", solution: "x", choices: ["अ", "क"] } });
    expect(compact({ topicId: "t1", difficulty: 1, answerIndex: 3, en: text(["a", "b", "", ""]), hi: text(["", "", "", ""]), mr: text(["", "", "", ""]) })).toBeNull();
  });

  it("loads, finds the chapter, takes the question in three languages and sends it", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<TeacherContribution />, "TEACHER", base({ [`GET ${LIST}/topics`]: gate.answer, [`POST ${LIST}`]: () => json({ contribution: existing({ status: "SUBMITTED", reviewNote: null }) }, 201) }));
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(TOPICS));
    // With no chapter chosen, nothing is sent.
    await fireEvent.press(await screen.findByRole("button", { name: "Send to the content team" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a chapter first.");
    await fireEvent.changeText(screen.getByLabelText("Find a chapter"), "shap");
    await fireEvent.press(await screen.findByRole("button", { name: /Class 3 · ZZ Shapes/ }));
    expect(screen.getByText(/^Chapter: .*Class 3 · ZZ Shapes$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Level 2" }));
    // The options are typed in the third and fourth rows; the fourth is the right one.
    await fill("English", EN, [2, 3]);
    await fill("Hindi", HI, [2, 3]);
    await fill("Marathi", MR, [2, 3]);
    await fireEvent.press(screen.getByRole("button", { name: "Option 4" }));
    await fireEvent.press(screen.getByRole("switch", { name: /^This is my own work/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Send to the content team" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/contributions"));
    expect(calls().find((c) => c.line === `POST ${LIST}`)?.body).toEqual({ topicId: "t1", difficulty: 2, answerIndex: 1, en: EN, hi: HI, mr: MR, terms: true });
    expect(screen.queryByRole("button", { name: "Draft the Hindi and Marathi from the English" })).toBeNull();
  });

  it("where the server has a translator, the Hindi and the Marathi are drafted into the boxes for the teacher to correct", async () => {
    const { calls } = await mountStaff(<TeacherContribution />, "TEACHER", base({ [`POST ${LIST}/draft`]: () => json({ hi: HI, mr: MR }) }, true));
    await screen.findByLabelText("English · The question");
    await fill("English", EN);
    await fireEvent.press(screen.getByRole("button", { name: "Draft the Hindi and Marathi from the English" }));
    expect(await screen.findByText("Drafted. Read both and correct them before sending.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${LIST}/draft`)?.body).toEqual(EN);
    expect(screen.getByLabelText("Hindi · The question")).toHaveProp("value", HI.stem);
    expect(screen.getByLabelText("Marathi · Option 2")).toHaveProp("value", "तीन");
  });

  it("a returned question shows what the content team said, is sent again, or taken back", async () => {
    mockRouter.params = { id: "q1" };
    const { calls } = await mountStaff(<TeacherContribution />, "TEACHER", base({ [`GET ${LIST}/q1`]: () => json(existing()), [`POST ${LIST}/q1`]: () => json({ contribution: existing({ status: "SUBMITTED" }) }), [`POST ${LIST}/q1/withdraw`]: () => json({ contribution: existing({ status: "WITHDRAWN", open: false }) }) }));
    expect(await screen.findByText("ZZ Say which class this is for.")).toBeTruthy();
    expect(screen.getByLabelText("English · The question")).toHaveProp("value", EN.stem);
    expect(screen.getByText(/^Chapter: .*ZZ Shapes$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("switch", { name: /^This is my own work/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Send again" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/q1`)?.body).toMatchObject({ topicId: "t1", difficulty: 2, answerIndex: 1, terms: true, hi: HI }));
    await fireEvent.press(screen.getByRole("button", { name: "Take it back" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${LIST}/q1/withdraw`)).toBe(true));
    expect(mockRouter.replace).toHaveBeenCalledTimes(2);
  });

  it("a settled question is read and not changed; a refusal and a failure are alerts", async () => {
    mockRouter.params = { id: "q1" };
    const first = await mountStaff(<TeacherContribution />, "TEACHER", base({ [`GET ${LIST}/q1`]: () => json(existing({ status: "ACCEPTED", open: false, reviewNote: null, questionId: "bank1" })) }));
    expect(await screen.findByText("This question is settled and can no longer be changed.")).toBeTruthy();
    expect(screen.getByText("In the bank")).toBeTruthy();
    expect(screen.getByText("2. Three (Correct answer)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send again" })).toBeNull();
    await first.unmount();

    mockRouter.params = {};
    const second = await mountStaff(<TeacherContribution />, "TEACHER", base({ [`POST ${LIST}`]: refused("ZZ The Marathi is incomplete.", 422) }));
    await fireEvent.changeText(await screen.findByLabelText("Find a chapter"), "plants");
    await fireEvent.press(await screen.findByRole("button", { name: /Class 4 · ZZ Plants/ }));
    await fill("English", EN);
    await fireEvent.press(screen.getByRole("button", { name: "Send to the content team" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ The Marathi is incomplete.");
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await second.unmount();

    await mountStaff(<TeacherContribution />, "TEACHER", base({ [`GET ${LIST}/topics`]: refused("ZZ broke") }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
