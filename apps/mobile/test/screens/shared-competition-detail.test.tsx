import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { competitionDetailSchema } from "@edulink/contracts";
import { CompetitionDetail, ordinal } from "@/screens/shared/competition-detail";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "co1";
const PATH = `/api/v1/shared/competitions/${ID}`;
const ENTER = `${PATH}/enter`;
const CONSENT = "/api/v1/shared/competitions/entries/en1/consent";
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

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { competitionId: ID };
});

describe("one competition", () => {
  it("loads the one in the route: who runs it, the dates, the brief, the board and the rules", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<CompetitionDetail />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DETAIL));
    await screen.findByText("ZZ Maths Bee");
    expect(screen.getByText("Run by ZZ School")).toBeTruthy();
    expect(screen.getByText("Checked by EduLink")).toBeTruthy();
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
    expect(open).toHaveBeenCalledWith(`${API_BASE}/competitions/${ID}/entries`);
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

  it("a pupil already in sees their standing and result, and hands work in on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, entry: ENTRY }) });
    expect(await screen.findByText("You are entered")).toBeTruthy();
    expect(screen.getByText("3rd place · 67.5 points")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Hand it in" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/competitions/${ID}`);
    open.mockRestore();
  });

  it("closed entries say so, with no button to press", async () => {
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, open: false }) });
    expect(await screen.findByText("Entries for this one have closed.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enter this" })).toBeNull();
  });

  it("a guardian allows the child's entry through the consent endpoint", async () => {
    const waiting = [{ entryId: "en1", competitionId: ID, title: "ZZ Maths Bee", organizerName: "ZZ School", closesAt: "2026-09-20T00:00:00.000Z", childName: "ZZ Asha" }];
    const { calls } = await mountStaff(<CompetitionDetail />, "PARENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, waiting }), [`POST ${CONSENT}`]: () => json({ ok: true }) });
    await screen.findByText("ZZ Asha would like to take part.");
    await fireEvent.press(screen.getByRole("button", { name: "Allow" }));
    await screen.findByText("Consent given ZZ Asha can take part in ZZ Maths Bee.");
    expect(calls().find((c) => c.line === `POST ${CONSENT}`)?.body).toEqual({});
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a guardian with nobody asking is told so", async () => {
    await mountStaff(<CompetitionDetail />, "PARENT", { [`GET ${PATH}`]: () => json(DETAIL) });
    expect(await screen.findByText("None of your children have asked to enter this one.")).toBeTruthy();
  });

  it("a refused entry is the server's sentence with a retry", async () => {
    await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: () => json(DETAIL), [`POST ${ENTER}`]: refused("ZZ entries have closed", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Enter this" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ entries have closed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused competition is an alert with a retry", async () => {
    const { calls } = await mountStaff(<CompetitionDetail />, "STUDENT", { [`GET ${PATH}`]: refused("ZZ not found", 404) });
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
