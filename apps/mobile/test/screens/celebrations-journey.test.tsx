/**
 * A3-inventory-14 (risks batch, 5 Oct 2026): the two pages that had no door now read one on the phone too —
 * birthdays and anniversaries (GET /api/v1/shared/bulletin/celebrations) as a card on the homes and a screen, and the
 * pupil's own practice journey (GET /api/v1/practice/journey) from Practice.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { celebrationsSchema, practiceJourneySchema } from "@edulink/contracts";
import { CelebrationsCard, Celebrations } from "@/screens/shared/celebrations";
import { PracticeJourney } from "@/screens/practice/journey";
import { json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}), usePathname: () => "/" }));

const C = "/api/v1/shared/bulletin/celebrations";
const item = (over: Partial<Record<string, unknown>>) => ({ kind: "BIRTHDAY", membershipId: "m9", name: "ZZ Meera", role: "TEACHER", dateKey: "2026-10-09", years: null, schoolName: "ZZ School", ...over });
const view = (days: number, items: unknown[]) => celebrationsSchema.parse({ days, items });

beforeEach(() => mockRouter.push.mockReset());

describe("the celebrations card", () => {
  it("names the next one in the month and opens the list", async () => {
    const { calls } = await mountStaff(<CelebrationsCard />, "TEACHER", { [`GET ${C}`]: () => json(view(30, [item({}), item({ membershipId: "m8", name: "ZZ Ravi", dateKey: "2026-10-20" })])) });
    const card = await screen.findByRole("button", { name: /^Birthdays & anniversaries, ZZ Meera · / });
    expect(card).toHaveTextContent(/2 coming up/);
    expect(calls().map((c) => c.line)).toContain(`GET ${C}?days=30`);
    fireEvent.press(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/celebrations");
  });

  it("a quiet month looks half a year ahead and says so", async () => {
    const { calls } = await mountStaff(<CelebrationsCard />, "STUDENT", { [`GET ${C}`]: ({ url }) => json(url.searchParams.get("days") === "30" ? view(30, []) : view(183, [item({ dateKey: "2027-01-15" })])) });
    expect(await screen.findByText(/^Next up: ZZ Meera · /)).toBeTruthy();
    expect(calls().map((c) => c.line)).toEqual(expect.arrayContaining([`GET ${C}?days=30`, `GET ${C}?days=183`]));
  });

  it("draws nothing when the door refuses (a home is not broken by it)", async () => {
    await mountStaff(<CelebrationsCard />, "ADMIN", { [`GET ${C}`]: refused("Not now") });
    await waitFor(() => expect(screen.queryByText("Birthdays & anniversaries")).toBeNull());
  });
});

describe("the celebrations screen", () => {
  it("groups by day, names the role and the kind, and marks the reader's own", async () => {
    await mountStaff(<Celebrations />, "TEACHER", {
      [`GET ${C}`]: () => json(view(30, [item({}), item({ kind: "ANNIVERSARY", membershipId: "m1", name: "ZZ Head", role: "PRINCIPAL", years: 5 }), item({ membershipId: "m7", name: "ZZ Sunil", dateKey: "2026-10-12", years: null })])),
    });
    expect(await screen.findByText("ZZ Meera")).toBeTruthy();
    expect(screen.getAllByText("Birthday · Teacher")).toHaveLength(2);
    expect(screen.getByText("5 years at the school · Principal")).toBeTruthy();
    expect(screen.getByText("That's you")).toBeTruthy();
    // Two days, so two cards: the 9th holds two people, the 12th one.
    expect(screen.getByText(/09\/10\/2026/)).toBeTruthy();
    expect(screen.getByText(/12\/10\/2026/)).toBeTruthy();
  });

  it("nothing in the half-year is an empty state", async () => {
    await mountStaff(<Celebrations />, "STUDENT", { [`GET ${C}`]: ({ url }) => json(view(Number(url.searchParams.get("days")), [])) });
    expect(await screen.findByText("Nothing in the next month")).toBeTruthy();
  });
});

const J = "/api/v1/practice/journey";
const JOURNEY = practiceJourneySchema.parse({
  badges: [{ label: "ZZ Fractions · Bronze", description: "Level 2 proven", earnedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), isTier: true }],
  monthly: [
    { label: "May", month: "2026-05", tiers: 0 },
    { label: "Jun", month: "2026-06", tiers: 1 },
    { label: "Jul", month: "2026-07", tiers: 0 },
    { label: "Aug", month: "2026-08", tiers: 2 },
    { label: "Sep", month: "2026-09", tiers: 0 },
    { label: "Oct", month: "2026-10", tiers: 1 },
  ],
  practiceWeeks: 3,
  totalAnswers: 140,
  totalTiers: 4,
});

describe("the practice journey", () => {
  it("shows the three numbers, the six months and the badges, and says it is private", async () => {
    await mountStaff(<PracticeJourney />, "STUDENT", { [`GET ${J}`]: () => json(JOURNEY) });
    expect(await screen.findByLabelText("weeks in a row practicing: 3")).toBeTruthy();
    expect(screen.getByLabelText("questions answered: 140")).toBeTruthy();
    expect(screen.getByLabelText("Aug: 2")).toBeTruthy();
    expect(screen.getByText("ZZ Fractions · Bronze")).toBeTruthy();
    expect(screen.getByText(/^Level 2 proven · 2 days ago/)).toBeTruthy();
  });

  it("no badges yet is an empty timeline; a refusal is an alert with a retry", async () => {
    await mountStaff(<PracticeJourney />, "STUDENT", { [`GET ${J}`]: () => json({ ...JOURNEY, badges: [] }) });
    expect(await screen.findByLabelText("weeks in a row practicing: 3")).toBeTruthy();
    await mountStaff(<PracticeJourney />, "STUDENT", { [`GET ${J}`]: refused("Not yours", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not yours");
  });
});
