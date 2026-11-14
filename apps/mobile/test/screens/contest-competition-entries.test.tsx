import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { contestEntriesSchema } from "@edulink/contracts";
import { CompetitionEntries } from "@/screens/shared/competition-entries";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "co1";
const PATH = `/api/v1/contest/competitions/${ID}/entries`;
const BOARD = `/api/v1/contest/competitions/${ID}/leaderboard`;
const result = (entryId: string) => `/api/v1/contest/entries/${entryId}/result`;
const ENTRIES = contestEntriesSchema.parse({
  competition: { id: ID, title: "ZZ Maths Bee", status: "PUBLISHED", isOrganiser: true, leaderboardEnabled: false, requiresParentConsent: true },
  entries: [
    { entryId: "en1", studentMembershipId: "p1", studentName: "ZZ Asha", status: "SUBMITTED", submissionUrl: "https://example.org/asha", scoreMilli: null, rank: null, awaitingConsent: false },
    { entryId: "en2", studentMembershipId: "p2", studentName: "ZZ Ravi", status: "RESULTS", submissionUrl: null, scoreMilli: 67500, rank: 3, awaitingConsent: false },
    { entryId: "en3", studentMembershipId: "p3", studentName: "ZZ Meera", status: "ENTERED", submissionUrl: null, scoreMilli: null, rank: null, awaitingConsent: true },
  ],
});

beforeEach(() => {
  mockRouter.back.mockReset();
  mockRouter.params = { competitionId: ID };
});

describe("a competition's entries and results", () => {
  it("loads, then shows this school's entries, where each stands, the counts, and opens a handed-in link", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(ENTRIES));
    await screen.findByText("ZZ Maths Bee");
    expect(screen.getByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByText("ZZ Ravi")).toBeTruthy();
    expect(screen.getByText("Waiting on a guardian")).toBeTruthy();
    expect(screen.getByLabelText("Entered: 3")).toBeTruthy();
    expect(screen.getByLabelText("Handed in: 1")).toBeTruthy();
    expect(screen.getByLabelText("Result recorded: 1")).toBeTruthy();
    // What was recorded before is in the boxes, as the web prints it.
    expect(screen.getByLabelText("Score: ZZ Ravi")).toHaveDisplayValue("67.5");
    expect(screen.getByLabelText("Place: ZZ Ravi")).toHaveDisplayValue("3");
    expect(screen.getAllByText("Nothing handed in yet.")).toHaveLength(2);
    // A teacher records results; the schools' board is the organising admin's.
    expect(screen.queryByRole("button", { name: "Publish a leaderboard" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Open their entry: ZZ Asha" }));
    expect(open).toHaveBeenCalledWith("https://example.org/asha");
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
    open.mockRestore();
  });

  it("records a score and a place as typed, and the list re-reads", async () => {
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", { [`GET ${PATH}`]: () => json(ENTRIES), [`POST ${result("en1")}`]: () => json({ ok: true, cleared: false }) });
    await screen.findByText("ZZ Asha");
    expect(screen.getByRole("button", { name: "Save: ZZ Asha" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Score: ZZ Asha"), "12.5");
    await fireEvent.changeText(screen.getByLabelText("Place: ZZ Asha"), "1");
    await fireEvent.press(screen.getByRole("button", { name: "Save: ZZ Asha" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${result("en1")}`)?.body).toEqual({ score: "12.5", rank: "1" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("emptying both boxes clears a result: empty is not zero", async () => {
    const { calls } = await mountStaff(<CompetitionEntries />, "ADMIN", { [`GET ${PATH}`]: () => json(ENTRIES), [`POST ${result("en2")}`]: () => json({ ok: true, cleared: true }) });
    await screen.findByText("ZZ Ravi");
    await fireEvent.changeText(screen.getByLabelText("Score: ZZ Ravi"), "");
    await fireEvent.changeText(screen.getByLabelText("Place: ZZ Ravi"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Save: ZZ Ravi" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${result("en2")}`)?.body).toEqual({ score: "", rank: "" }));
  });

  it("a refused score lands under its box; a server that fell over is an alert with a retry", async () => {
    const issues = { score: "A score has to be a number, and cannot be negative." };
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", {
      [`GET ${PATH}`]: () => json(ENTRIES),
      [`POST ${result("en1")}`]: () => json({ error: issues.score, code: "BAD_REQUEST", issues }, 422),
      [`POST ${result("en2")}`]: refused("ZZ not now."),
    });
    await screen.findByText("ZZ Asha");
    await fireEvent.changeText(screen.getByLabelText("Score: ZZ Asha"), "-2");
    await fireEvent.press(screen.getByRole("button", { name: "Save: ZZ Asha" }));
    expect(await screen.findByText(issues.score)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Place: ZZ Ravi"), "2");
    await fireEvent.press(screen.getByRole("button", { name: "Save: ZZ Ravi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${result("en2")}`)).toHaveLength(2));
    expect(calls().find((c) => c.line === `POST ${result("en2")}`)?.body).toEqual({ score: "67.5", rank: "2" });
  });

  it("the organising school's admin publishes the schools' board, and takes it down", async () => {
    const { calls } = await mountStaff(<CompetitionEntries />, "ADMIN", { [`GET ${PATH}`]: () => json(ENTRIES), [`POST ${BOARD}`]: () => json({ ok: true, enabled: true }) });
    expect(await screen.findByText("No leaderboard")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish a leaderboard" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BOARD}`)?.body).toEqual({ enabled: true }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("with the board up, the switch takes it down", async () => {
    const on = { ...ENTRIES, competition: { ...ENTRIES.competition, leaderboardEnabled: true } };
    const { calls } = await mountStaff(<CompetitionEntries />, "ADMIN", { [`GET ${PATH}`]: () => json(on), [`POST ${BOARD}`]: () => json({ ok: true, enabled: false }) });
    expect(await screen.findByText("The leaderboard is published")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Take the leaderboard down" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BOARD}`)?.body).toEqual({ enabled: false }));
  });

  it("nobody entered yet says so, and the door goes back to the competition", async () => {
    await mountStaff(<CompetitionEntries />, "TEACHER", { [`GET ${PATH}`]: () => json({ ...ENTRIES, entries: [] }) });
    expect(await screen.findByText("Nobody has entered yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to the competition" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", { [`GET ${PATH}`]: refused("ZZ not found", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not found");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("TA-104: a teacher adds a pupil of the school as an entrant; a typed name narrows the list, and the list re-reads", async () => {
    const ENTRANTS = `/api/v1/contest/competitions/${ID}/entrants`;
    const withCandidates = { ...ENTRIES, candidates: [
      { studentMembershipId: "p4", name: "ZZ Kavya", className: "5A" },
      { studentMembershipId: "p5", name: "ZZ Nikhil", className: null },
    ] };
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", { [`GET ${PATH}`]: () => json(withCandidates), [`POST ${ENTRANTS}`]: () => json({ ok: true, entryId: "en4", awaitingConsent: true, created: true }) });
    expect(await screen.findByText("Add an entrant")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add as entrant: ZZ Kavya" })).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search by name"), "nik");
    expect(screen.queryByRole("button", { name: "Add as entrant: ZZ Kavya" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Add as entrant: ZZ Nikhil" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${ENTRANTS}`)?.body).toEqual({ studentMembershipId: "p5" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("TA-104: with nobody left to add, or at a competition that is not the school's own, there is no Add card", async () => {
    await mountStaff(<CompetitionEntries />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...ENTRIES, candidates: [] }) });
    await screen.findByText("ZZ Asha");
    expect(screen.queryByText("Add an entrant")).toBeNull();
  });

  it("without a competition id it says the link did not work, and asks nothing", async () => {
    mockRouter.params = {};
    const { calls } = await mountStaff(<CompetitionEntries />, "TEACHER", {});
    expect(screen.getByRole("alert")).toHaveTextContent(/That link did not work/);
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/contest"))).toBe(false);
  });
});
