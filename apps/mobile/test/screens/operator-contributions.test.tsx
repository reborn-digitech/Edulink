import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { ContributionsQueue } from "@/screens/operator/contributions";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
const LIST = "/api/v1/appadmin/contributions";
const TEXT = { stem: "ZZ How many sides has a triangle?", choices: ["Two", "Three"], solution: "ZZ Three sides." };
const HI = { stem: "ZZ त्रिभुज की कितनी भुजाएँ होती हैं?", choices: ["दो", "तीन"], solution: "ZZ तीन भुजाएँ।" };
const row = (over: Record<string, unknown> = {}) => ({ id: "q1", status: "SUBMITTED", stem: TEXT.stem, topicName: "ZZ Shapes", subject: "MATHS", classLevel: 3, authorName: "ZZ Teacher", authorSchoolName: "ZZ School", submittedAt: "2026-09-30T10:00:00.000Z", ...over });
const queue = (status: string, rows: unknown[]) => ({ status, counts: { SUBMITTED: 2, RETURNED: 1, ACCEPTED: 5, REJECTED: 0, WITHDRAWN: 0 }, rows });
const review = (over: Record<string, unknown> = {}) => ({
  id: "q1",
  topic: { id: "t1", name: "ZZ Shapes", subject: "MATHS", classLevel: 3, chapter: "ZZ Chapter 5" },
  difficulty: 2,
  answerIndex: 1,
  en: TEXT,
  hi: HI,
  mr: HI,
  status: "SUBMITTED",
  reviewNote: null,
  reviewedAt: null,
  submittedAt: "2026-09-30T10:00:00.000Z",
  questionId: null,
  earning: null,
  open: true,
  authorName: "ZZ Teacher",
  authorSchoolName: "ZZ School",
  authorAccepted: 21,
  authorPaidThisMonth: 1,
  outcome: { basis: "PAID", amountPaise: 1000 },
  spentThisMonthPaise: 150000,
  budgetPaise: 500000,
  freeCount: 20,
  ...over,
});

const mount = (params: Record<string, string>, answers: Answers) => {
  mockRouter.params = params;
  return mountStaff(
    <ToastProvider>
      <ContributionsQueue />
    </ToastProvider>,
    "ADMIN",
    answers,
    { me: CURATOR },
  );
};

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
});

describe("the review queue", () => {
  it("lists the questions waiting with their counts by status, and a status chip asks the server for that list", async () => {
    const { calls } = await mount({}, {
      [`GET ${LIST}`]: ({ url }) => json(url.searchParams.get("status") === "RETURNED" ? queue("RETURNED", [row({ id: "q9", status: "RETURNED", stem: "ZZ A returned one" })]) : queue("SUBMITTED", [row(), row({ id: "q2", stem: "ZZ Second" })])),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText(TEXT.stem);
    expect(screen.getByRole("radio", { name: "Waiting to be read 2" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "In the bank 5" })).toBeTruthy();
    expect(screen.getAllByText("Maths · Class 3 · ZZ Shapes · ZZ Teacher, ZZ School").length).toBe(2);
    await fireEvent.press(screen.getByRole("radio", { name: "Returned to you 1" }));
    await screen.findByText("ZZ A returned one");
    expect(calls().filter((c) => c.line.startsWith(`GET ${LIST}?status=`)).map((c) => c.line)).toEqual([`GET ${LIST}?status=SUBMITTED`, `GET ${LIST}?status=RETURNED`]);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ A returned one/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/contribution-queue", params: { id: "q9" } });
  });

  it("an empty status says so", async () => {
    await mount({}, { [`GET ${LIST}`]: () => json(queue("SUBMITTED", [])) });
    await screen.findByText("Nothing here.");
  });
});

describe("one question under review", () => {
  it("reads in three languages with the correct option marked, says who wrote it and what adding it earns, and adds it to the bank with a note", async () => {
    const { calls } = await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review()), [`POST ${LIST}/q1/decide`]: () => json({ contribution: review({ status: "ACCEPTED", open: false }) }) });
    await screen.findByText("ZZ Teacher, ZZ School");
    expect(screen.getByText("21 of theirs are in the bank; 1 paid this month.")).toBeTruthy();
    expect(screen.getByTestId("gig-outcome")).toHaveTextContent(/^Adding it earns the author ₹10\. This month ₹1,500 of ₹5,000 is committed\.$/);
    expect(screen.getAllByText("2. Three (Correct answer)").length).toBe(1);
    expect(screen.getAllByText("2. तीन (Correct answer)").length).toBe(2);
    expect(screen.getByText("ZZ Three sides.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Note to the teacher"), "ZZ Good one.");
    await fireEvent.press(screen.getByRole("button", { name: "Add to the bank" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/q1/decide`)?.body).toEqual({ decision: "ACCEPT", note: "ZZ Good one." }));
    await screen.findByText("Done.");
    expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/contribution-queue");
  });

  it("⚠ when the month or the budget is used up the server's sentence is said and adding is locked; returning with a note still goes", async () => {
    const { calls } = await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review({ outcome: { refuse: "gigs.refuseBudget" } })), [`POST ${LIST}/q1/decide`]: () => json({ contribution: review({ status: "RETURNED" }) }) });
    await screen.findByText("ZZ Teacher, ZZ School");
    expect(screen.getByTestId("gig-outcome")).toHaveTextContent(/^This month's budget for questions is used up\./);
    expect(screen.getByRole("button", { name: "Add to the bank" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Note to the teacher"), "ZZ Next month.");
    await fireEvent.press(screen.getByRole("button", { name: "Return with a note" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/q1/decide`)?.body).toEqual({ decision: "RETURN", note: "ZZ Next month." }));
  });

  it("one of the author's first free ones earns nothing, and a rejection carries its reason; a refusal from the server is shown", async () => {
    const { calls } = await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review({ outcome: { basis: "FREE_BLOCK", amountPaise: 0 } })), [`POST ${LIST}/q1/decide`]: () => json({ error: "ZZ already decided", code: "CONFLICT" }, 409) });
    await screen.findByText("ZZ Teacher, ZZ School");
    expect(screen.getByTestId("gig-outcome")).toHaveTextContent(/^Adding it earns the author nothing: it is one of their first 20\./);
    await fireEvent.changeText(screen.getByLabelText("Note to the teacher"), "ZZ Not a question.");
    await fireEvent.press(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/q1/decide`)?.body).toEqual({ decision: "REJECT", note: "ZZ Not a question." }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ already decided");
  });

  it("⚠ corrected before adding: the reviewer's edit goes with the decision, options blank in every language dropped and the answer re-pointed; the marked option dropped is refused on the phone", async () => {
    const { calls } = await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review()), [`POST ${LIST}/q1/decide`]: () => json({ contribution: review({ status: "ACCEPTED", open: false }) }) });
    await screen.findByText("ZZ Teacher, ZZ School");
    await fireEvent.press(screen.getByRole("switch", { name: "Correct it before adding" }));
    expect(screen.getByRole("radio", { name: "Level 2" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "Level 3" }));
    await fireEvent.changeText(screen.getByLabelText("English · The question"), "ZZ How many sides has a triangle, really?");
    await fireEvent.changeText(screen.getByLabelText("English · Option 1"), "");
    // The marked option (2) stays; option 1 blank in all three languages is dropped, so the answer becomes the first.
    await fireEvent.changeText(screen.getByLabelText("Hindi · Option 1"), "");
    await fireEvent.changeText(screen.getByLabelText("Marathi · Option 1"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Add with my corrections" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/q1/decide`)).toBeTruthy());
    const body = calls().find((c) => c.line === `POST ${LIST}/q1/decide`)!.body as { decision: string; edit: { topicId: string; difficulty: number; answerIndex: number; en: { stem: string; choices: string[] } } };
    expect(body.decision).toBe("ACCEPT");
    expect(body.edit.topicId).toBe("t1");
    expect(body.edit.difficulty).toBe(3);
    expect(body.edit.answerIndex).toBe(0);
    expect(body.edit.en).toEqual({ stem: "ZZ How many sides has a triangle, really?", choices: ["Three"], solution: "ZZ Three sides." });
  });

  it("the marked option emptied in every language is refused before anything is sent", async () => {
    const { calls } = await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review()) });
    await screen.findByText("ZZ Teacher, ZZ School");
    await fireEvent.press(screen.getByRole("switch", { name: "Correct it before adding" }));
    for (const l of ["English", "Hindi", "Marathi"]) await fireEvent.changeText(screen.getByLabelText(`${l} · Option 2`), "");
    await fireEvent.press(screen.getByRole("button", { name: "Add with my corrections" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mark which option is the correct answer.");
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("a settled question is read with its note and offers no decision", async () => {
    await mount({ id: "q1" }, { [`GET ${LIST}/q1`]: () => json(review({ status: "REJECTED", open: false, reviewNote: "ZZ Not a question.", reviewedAt: "2026-09-30T12:00:00.000Z" })) });
    await screen.findByText("ZZ Teacher, ZZ School");
    expect(screen.getByText("Not taken")).toBeTruthy();
    expect(screen.getByText("ZZ Not a question.")).toBeTruthy();
    expect(screen.queryByTestId("gig-outcome")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
  });
});
