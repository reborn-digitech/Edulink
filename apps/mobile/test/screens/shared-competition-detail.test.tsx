import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { competitionDetailSchema } from "@edulink/contracts";
import { CompetitionDetail, ordinal } from "@/screens/shared/competition-detail";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "co1";
const PATH = `/api/v1/shared/competitions/${ID}`;
const ENTER = `${PATH}/enter`;
const CONSENT = "/api/v1/shared/competitions/entries/en1/consent";
const SUBMIT = `/api/v1/contest/competitions/${ID}/submit`;
const STATUS = `/api/v1/contest/competitions/${ID}/status`;
const ENTRY_PATH = "/api/v1/contest/entries/en1";
const DETAIL = competitionDetailSchema.parse({
  id: ID,
  title: "ZZ Maths Bee",
  summary: "Our own maths bee, in the hall.",
  organizerName: "ZZ School",
  organizerSchoolId: "s1",
  subject: "Maths",
  gradeLow: "4",
  gradeHigh: "6",
  verified: true,
  requiresParentConsent: true,
  registrationClosesAt: "2026-09-20T00:00:00.000Z",
  startsAt: "2026-10-01T00:00:00.000Z",
  endsAt: null,
  entry: null,
  body: "Thirty questions, one hour, pencils only.",
  eligibility: "Any pupil in Years 4 to 6.",
  rules: "No calculators.",
  prizes: "A book token.",
  externalUrl: "https://example.org/bee",
  status: "PUBLISHED",
  leaderboardEnabled: true,
  isOrganiser: false,
  open: true,
  acceptingWork: true,
  enteredCount: 3,
  waiting: [],
  board: [
    { schoolId: "s1", schoolName: "ZZ School", entrants: 3, bestRank: 2, bestScoreMilli: 87500, isOwnSchool: true },
    { schoolId: "s2", schoolName: "ZZ Other School", entrants: 1, bestRank: null, bestScoreMilli: null, isOwnSchool: false },
  ],
});
const ENTRY = { id: "en1", status: "ENTERED", awaitingConsent: false, consentedAt: "2026-09-07T00:00:00.000Z", studentMembershipId: "p1", studentName: "ZZ Asha", submissionUrl: null, scoreMilli: 67500, rank: 3 };
const WAITING = [{ entryId: "en1", competitionId: ID, title: "ZZ Maths Bee", organizerName: "ZZ School", closesAt: "2026-09-20T00:00:00.000Z", childName: "ZZ Asha" }];

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { competitionId: ID };
});

describe("one competition", () => {
  it("refuses to open an organiser's link that is not https", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<CompetitionDetail />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    gate.open(() => json({ ...DETAIL, externalUrl: "http://example.org/bee" }));
    await screen.findByText("ZZ Maths Bee");
    expect(screen.queryByText("Organiser's own page")).toBeNull();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("loads the one in the route: who runs it, the dates, the brief, the board and the rules; staff open the entries in the app", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<CompetitionDetail />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DETAIL));
    await screen.findByText("ZZ Maths Bee");
    expect(screen.getByText("Run by ZZ School")).toBeTruthy();
    expect(screen.getByText("Checked by Shalaghar")).toBeTruthy();
    expect(screen.getByText("Entries close")).toBeTruthy();
    expect(screen.getByText("Starts")).toBeTruthy();
    expect(screen.queryByText("Ends")).toBeNull();
    expect(screen.getByText("Thirty questions, one hour, pencils only.")).toBeTruthy();
    expect(screen.getByText("No calculators.")).toBeTruthy();
    expect(screen.getByText("A book token.")).toBeTruthy();
    expect(screen.getByText("1. ZZ School · your school")).toBeTruthy();
    expect(screen.getByText("3 results · best place 2nd · best score 87.5")).toBeTruthy();
    expect(screen.getByText("1 result")).toBeTruthy();
    expect(screen.getByText("3 pupils from your school are taking part.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Your school's entries and results" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/competition-entries", params: { competitionId: ID } });
    await fireEvent.press(screen.getByRole("button", { name: "Organiser's own page" }));
    expect(open).toHaveBeenCalledWith("https://example.org/bee");
    open.mockRestore();
  });

  it("a pupil enters, is told a grown-up is asked first, and the page re-reads", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json(DETAIL), [`POST ${ENTER}`]: () => json({ entryId: "en1", awaitingConsent: true }) });
    await screen.findByText("A grown-up at home will be asked first. You will not take part until they say yes.");
    await fireEvent.press(screen.getByRole("button", { name: "Enter this" }));
    await screen.findByText("Asked to enter 🎉 A grown-up needs to say yes before you take part in ZZ Maths Bee.");
    expect(calls().find((c) => c.line === `POST ${ENTER}`)?.body).toEqual({});
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a pupil already in sees their standing and result, and hands the link to their work in", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: ENTRY }), [`POST ${SUBMIT}`]: () => json({ ok: true }) });
    expect(await screen.findByText("You are entered")).toBeTruthy();
    expect(screen.getByText("3rd place · 67.5 points")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hand it in" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Hand in your entry"), " https://example.org/asha ");
    await fireEvent.press(screen.getByRole("button", { name: "Hand it in" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${SUBMIT}`)?.body).toEqual({ url: "https://example.org/asha" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("changing a hand-in starts from the saved link, and waits for a change", async () => {
    const handed = { ...ENTRY, status: "SUBMITTED", submissionUrl: "https://example.org/old" };
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: handed }), [`POST ${SUBMIT}`]: () => json({ ok: true }) });
    expect(await screen.findByLabelText("Your entry")).toHaveDisplayValue("https://example.org/old");
    expect(screen.getByRole("button", { name: "Change it" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Your entry"), "https://example.org/new");
    await fireEvent.press(screen.getByRole("button", { name: "Change it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${SUBMIT}`)?.body).toEqual({ url: "https://example.org/new" }));
  });

  it("an http link is refused under the box, in the server's words", async () => {
    const sentence = "Links must start with https://";
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: ENTRY }), [`POST ${SUBMIT}`]: () => json({ error: sentence, code: "BAD_REQUEST", issues: { url: sentence } }, 422) });
    await fireEvent.changeText(await screen.findByLabelText("Hand in your entry"), "http://example.org/asha");
    await fireEvent.press(screen.getByRole("button", { name: "Hand it in" }));
    expect(await screen.findByText(sentence)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a pupil withdraws after a second tap — Cancel keeps the entry — and the page re-reads", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: ENTRY }), [`DELETE ${ENTRY_PATH}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw" }));
    expect(screen.getByText("You can always ask again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("You can always ask again.")).toBeNull();
    expect(calls().some((c) => c.line.startsWith("DELETE"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `DELETE ${ENTRY_PATH}`)).toHaveLength(1));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a refused withdrawal is the server's sentence with a retry", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: ENTRY }), [`DELETE ${ENTRY_PATH}`]: refused("ZZ a result is recorded", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ a result is recorded");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `DELETE ${ENTRY_PATH}`)).toHaveLength(2));
  });

  it("closed entries say so, with no button to press", async () => {
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, open: false }) });
    expect(await screen.findByText("Entries for this one have closed.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enter this" })).toBeNull();
  });

  it("a guardian allows the child's entry through the consent endpoint", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "PARENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, waiting: WAITING }), [`POST ${CONSENT}`]: () => json({ ok: true }) });
    await screen.findByText("ZZ Asha would like to take part.");
    await fireEvent.press(screen.getByRole("button", { name: "Allow" }));
    await screen.findByText("Consent given ZZ Asha can take part in ZZ Maths Bee.");
    expect(calls().find((c) => c.line === `POST ${CONSENT}`)?.body).toEqual({});
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a guardian says not this time after a second tap, through the same DELETE", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "PARENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, waiting: WAITING }), [`DELETE ${ENTRY_PATH}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Not this time" }));
    expect(screen.getByText("ZZ Asha will be taken out of ZZ Maths Bee. They can always ask again.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Allow" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Not this time: ZZ Asha" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `DELETE ${ENTRY_PATH}`)).toHaveLength(1));
    expect(calls().some((c) => c.line === `POST ${CONSENT}`)).toBe(false);
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a guardian with nobody asking is told so", async () => {
    await mountStaff(<CompetitionDetail />, "PARENT", { [`GET ${PATH}`]: () => json(DETAIL) });
    expect(await screen.findByText("None of your children have asked to enter this one.")).toBeTruthy();
  });

  it("the organising school's admin publishes a draft after a second tap", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...DETAIL, isOrganiser: true, status: "DRAFT" }), [`POST ${STATUS}`]: () => json({ ok: true, status: "PUBLISHED" }) });
    expect(await screen.findByText("Your school is organising this one. Nobody else can see it yet.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish it" }));
    expect(screen.getByText("Once you publish it, pupils at every school on Shalaghar can see it and ask to enter.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${STATUS}`)?.body).toEqual({ status: "PUBLISHED" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("withdrawing a published one says what it keeps, and Cancel keeps it live", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...DETAIL, isOrganiser: true }), [`POST ${STATUS}`]: () => json({ ok: true, status: "ARCHIVED" }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw it" }));
    expect(screen.getByText("Withdrawing keeps the 3 entries already made — it just takes it off the list.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().some((c) => c.line === `POST ${STATUS}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw it" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${STATUS}`)?.body).toEqual({ status: "ARCHIVED" }));
  });

  it("an archived one goes back to a draft in one press; a refusal is the server's sentence with a retry", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...DETAIL, isOrganiser: true, status: "ARCHIVED" }), [`POST ${STATUS}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("button", { name: "Publish it" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Put it back as a draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    expect(calls().find((c) => c.line === `POST ${STATUS}`)?.body).toEqual({ status: "DRAFT" });
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${STATUS}`)).toHaveLength(2));
  });

  it("a teacher at the organising school is told so, without the admin's buttons", async () => {
    await mountStaff(<CompetitionDetail />, "TEACHER", { [`GET ${PATH}`]: () => json({ ...DETAIL, isOrganiser: true }) });
    expect(await screen.findByText("Your school is organising this one.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Withdraw it" })).toBeNull();
  });

  it("a refused entry is the server's sentence with a retry", async () => {
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json(DETAIL), [`POST ${ENTER}`]: refused("ZZ entries have closed", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Enter this" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ entries have closed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused competition is an alert with a retry", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: refused("ZZ not found", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not found");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("without a competition id it says the link did not work, and asks nothing", async () => {
    mockRouter.params = {};
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", {});
    expect(screen.getByRole("alert")).toHaveTextContent(/That link did not work/);
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/shared/competitions"))).toBe(false);
  });

  it("ordinals are English values", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th"]);
  });
});
