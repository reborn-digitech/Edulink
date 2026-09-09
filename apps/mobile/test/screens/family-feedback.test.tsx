import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyFeedback } from "@/screens/family/feedback";

const ROUND = "czz000000000000000000rnd1";
const TEACHER = "czz00000000000000000tchr1";
const OTHER = "czz00000000000000000tchr2";
const FULL = { CLARITY: 5, SUPPORT: 4, FAIRNESS: 5, ENGAGEMENT: 4, RESPECT: 5 };
const REVIEWS = {
  pending: [
    { roundId: ROUND, closesDateKey: "2030-01-31", teacherMembershipId: TEACHER, teacherName: "ZZ Teacher", myScores: null },
    { roundId: ROUND, closesDateKey: "2030-01-31", teacherMembershipId: OTHER, teacherName: "ZZ Other", myScores: FULL },
  ],
};
const PATH = "/api/v1/family/reviews";

describe("feedback about teachers", () => {
  it("is loading while the questionnaires are on their way", async () => {
    await renderFamily(<FamilyFeedback />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists each open questionnaire, sends once every question has a star, and says which is already answered", async () => {
    const { fetch } = await renderFamily(<FamilyFeedback />, ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? { ok: true } : REVIEWS) });
    expect(await screen.findByText("ZZ Teacher")).toBeTruthy();
    expect(screen.getByText(/^Open until .*2030$/)).toBeTruthy();
    expect(screen.getByText("Answered — you can change it while the round is open")).toBeTruthy();
    expect(screen.getAllByText("Explains things clearly")).toHaveLength(2);
    const [send] = screen.getAllByRole("button", { name: "Send" });
    expect(send).toBeDisabled();
    // The first card's five questions come first; a five on each.
    for (const star of screen.getAllByRole("radio", { name: "5" }).slice(0, 5)) await press(star);
    await press(screen.getAllByRole("button", { name: "Send" })[0]!);
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ roundId: ROUND, teacherMembershipId: TEACHER, scores: { CLARITY: 5, SUPPORT: 5, FAIRNESS: 5, ENGAGEMENT: 5, RESPECT: 5 } });
    expect(await screen.findByText("Thank you — saved.")).toBeTruthy();
  });

  it("with nothing to answer, says so, and a guardian's door is the overview", async () => {
    await renderFamily(<FamilyFeedback />, ME_PARENT, { [PATH]: () => ({ pending: [] }) });
    expect(await screen.findByText("Nothing to answer")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Overview" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refused answer is an alert", async () => {
    await renderFamily(<FamilyFeedback />, ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? refused(409, "ZZ closed")(init, new URL("http://api.test/")) : { pending: [REVIEWS.pending[1]] }) });
    await press(await screen.findByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ closed");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyFeedback />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
