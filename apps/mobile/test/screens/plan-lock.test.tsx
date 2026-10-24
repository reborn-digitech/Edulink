import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { passOverviewSchema } from "@edulink/contracts";
import { ExpertAvailability } from "@/screens/expert/availability";
import { Mentoring } from "@/screens/shared/mentoring";
import { FamilyPractice } from "@/screens/family/practice";
import { json, mountStaff, refused } from "./staff-harness";
import { ME_STUDENT, renderFamily } from "./family-helpers";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/**
 * QA-18 (QA campaign of 24 October 2026, UI-15): a door whose feature is on but needs a plan the person does not
 * hold answers 402 PLAN_REQUIRED, and the phone drew a red error card with a "Try again" that could only fail
 * again; its plan card was on the Account screen alone. Now `Failed` draws the plan card in the error's place, as
 * the web's featurePageLock does: the feature needs a plan, the plan's name and why, who it is for, what it
 * includes, the price from the person's own offer, and Subscribe, which opens the web's plan page.
 */
const locked = (plan: "STUDENT" | "TEACHER" | "EXPERT", feature?: string) => () =>
  json({ error: `This needs the ${plan === "EXPERT" ? "Expert" : plan === "STUDENT" ? "Student" : "Teacher"} plan, which you do not hold yet.`, code: "PLAN_REQUIRED", plan, ...(feature ? { feature } : {}) }, 402);
const pass = (plan: "STUDENT" | "EXPERT", amountPaise: number, yearly: number) =>
  passOverviewSchema.parse({
    held: [],
    gstPercent: 18,
    offers: [
      {
        plan,
        holder: { userId: "u1", name: "ZZ Person", studentMembershipId: null, self: true },
        holdsUntil: null,
        prices: [
          { period: "MONTH", amountPaise, gstPaise: Math.round(amountPaise * 0.18), totalPaise: Math.round(amountPaise * 1.18) },
          { period: "YEAR", amountPaise: yearly, gstPaise: Math.round(yearly * 0.18), totalPaise: Math.round(yearly * 1.18) },
        ],
        buy: "PAY",
      },
    ],
  });

describe("a plan-locked screen on the phone (QA-18)", () => {
  beforeEach(() => jest.restoreAllMocks());

  it("the expert's availability shows the plan card, not an error with Try again, and Subscribe opens the web's plan page", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ExpertAvailability />, "EXPERT", {
      "GET /api/v1/shared/expert/availability": locked("EXPERT", "EXPERT_SESSIONS"),
      "GET /api/v1/account/pass": () => json(pass("EXPERT", 49900, 499000)),
    });
    expect(await screen.findByText("Expert sessions needs a plan")).toBeTruthy();
    expect(screen.getByText("Expert plan")).toBeTruthy();
    expect(screen.getByText("Expert sessions is part of the Expert plan, which you do not hold yet.")).toBeTruthy();
    expect(screen.getByText("For an expert, who subscribes for themselves before offering any time to schools.")).toBeTruthy();
    expect(screen.getByText("What the plan includes")).toBeTruthy();
    expect(screen.getByText("Expert sessions")).toBeTruthy();
    expect(await screen.findByText(/₹499 a month · ₹4,990 a year/)).toBeTruthy();
    expect(screen.queryByText("This needs the Expert plan, which you do not hold yet.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Subscribe" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/account\/plan\?plan=EXPERT$/));
  });

  it("the mentoring list does the same, and a price not set yet is said so", async () => {
    await mountStaff(<Mentoring />, "EXPERT", {
      "GET /api/v1/shared/mentoring": locked("EXPERT", "EXPERT_SESSIONS"),
      "GET /api/v1/account/pass": () => json(pass("EXPERT", 0, 0)),
    });
    expect(await screen.findByText("Expert sessions needs a plan")).toBeTruthy();
    expect(await screen.findByText("The price has not been set yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("a pupil's practice shows the Student plan with both of its features", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, {
      "/api/v1/family/student/practice": locked("STUDENT", "QUESTION_BANK"),
      "/api/v1/account/pass": () => pass("STUDENT", 9900, 99000),
    });
    expect(await screen.findByText("Question bank practice needs a plan")).toBeTruthy();
    expect(screen.getByText("Student plan")).toBeTruthy();
    expect(screen.getByText("Vidura (assistant)")).toBeTruthy();
    expect(screen.getByText("Question bank practice")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("an older server's 402 naming only the plan still draws the card, headed by the plan with the server's sentence; no price line without an offer", async () => {
    await mountStaff(<ExpertAvailability />, "EXPERT", { "GET /api/v1/shared/expert/availability": locked("EXPERT") });
    expect(await screen.findAllByText("Expert plan")).toHaveLength(2);
    expect(screen.getByText("This needs the Expert plan, which you do not hold yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    await waitFor(() => expect(screen.queryByText(/a month/)).toBeNull());
    expect(screen.queryByText("The price has not been set yet.")).toBeNull();
  });

  it("any other failure is still the error with Try again", async () => {
    await mountStaff(<ExpertAvailability />, "EXPERT", { "GET /api/v1/shared/expert/availability": refused("ZZ server fell over") });
    expect(await screen.findByText("ZZ server fell over")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByTestId("plan-lock")).toBeNull();
  });
});
