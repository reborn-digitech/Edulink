import { screen } from "@testing-library/react-native";
import { familyStudentPracticeSchema } from "@edulink/contracts";
import { child, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyPractice } from "@/screens/family/practice";

const TOPIC = { id: "t1", slug: "zz-fractions", name: "ZZ Fractions", chapter: "1", subject: "MATHS", classLevel: 5, summary: "Halves and quarters.", questionCount: 20, level: 2, seenCount: 5, correctCount: 4, completed: false, badgeEarned: false, tierCount: 1 };
const PRACTICE = {
  topics: [TOPIC, { ...TOPIC, id: "t2", slug: "zz-plants", name: "ZZ Plants", subject: "SCIENCE", classLevel: 4, level: 1, tierCount: 0 }],
  enrolledGrade: 5,
  defaultGrade: 5,
  resume: { slug: "zz-fractions", name: "ZZ Fractions", subject: "MATHS", level: 2, tierCount: 1, remainingForBadge: 3, nextTierName: "Bronze" },
  weekly: 4,
  weeklyGoal: 20,
  revision: [],
  assigned: [],
};
const PATH = "/api/v1/family/student/practice";
const SET = "czz00000000000000000set1";

describe("practice", () => {
  it("is loading while the topics are on their way", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("opens on the pupil's own grade with the continue card, and every chapter opens the phone's own player", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => PRACTICE });
    expect(await screen.findByText("Continue where you left off")).toBeTruthy();
    expect(screen.getAllByText("ZZ Fractions").length).toBe(2);
    expect(screen.queryByText("ZZ Plants")).toBeNull();
    expect(screen.queryByRole("button", { name: "Open on the web" })).toBeNull();
    await press(screen.getByRole("button", { name: "All classes" }));
    expect(screen.getByText("ZZ Plants")).toBeTruthy();
    await press(screen.getByRole("button", { name: "ZZ Plants, Science · Class 4" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/(app)/quiz", params: { mode: "topic", slug: "zz-plants" } });
    await press(screen.getByRole("button", { name: "ZZ Fractions, Understand · 1/6" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/(app)/quiz", params: { mode: "topic", slug: "zz-fractions" } });
  });

  it("opens the pupil's own journey (A3-inventory-14)", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => PRACTICE });
    await press(await screen.findByRole("button", { name: "My journey" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/(app)/practice-journey");
  });

  it("smart revision and a chapter the teacher set open the player in their own modes", async () => {
    const withMore = familyStudentPracticeSchema.parse({
      ...PRACTICE,
      revision: [{ questionId: "zzr1", topicSlug: "zz-plants", topicName: "ZZ Plants", subject: "SCIENCE" }],
      assigned: [{ id: SET, topicSlug: "zz-decimals", topicName: "ZZ Decimals", subject: "MATHS", classLevel: 5, targetLevel: 2, targetTierName: "Learner", note: null, dueAt: null, myLevel: 1, reached: false }],
    });
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => withMore });
    await press(await screen.findByRole("button", { name: "Revise now" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/(app)/quiz", params: { mode: "revision" } });
    await press(screen.getByRole("button", { name: "ZZ Decimals, Target: Learner · L2 · Keep climbing" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/(app)/quiz", params: { mode: "assigned", assignmentId: SET } });
  });

  it("with no topics in the bank yet, says so", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => ({ ...PRACTICE, topics: [], resume: null }) });
    expect(await screen.findByText("No practice topics yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a guardian sees the chapters their child has touched and the rung they stand on", async () => {
    const progress = {
      children: [child(ID.child, "ZZ Asha")],
      childName: "ZZ Asha",
      weeklyCount: 7,
      topics: [{ slug: "zz-fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5, level: 2, seenCount: 5, correctCount: 4, tierCount: 1, cleanCompletion: false }],
    };
    await renderFamily(<FamilyPractice />, ME_PARENT, { "/api/v1/family/practice": () => progress });
    expect(await screen.findByText("ZZ Asha's practice")).toBeTruthy();
    expect(screen.getByText("7 questions in the last 7 days")).toBeTruthy();
    expect(screen.getByText("ZZ Fractions · Class 5")).toBeTruthy();
    expect(screen.getByText(/Understand/)).toBeTruthy();
    // No player and no web door for a guardian: the questions are the child's to answer.
    expect(screen.getByText("Practice questions are answered on the child's own sign-in. What they have done shows here.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open on the web" })).toBeNull();
  });

  // quiz-board (11 Oct 2026): the school's board first, a switch to the other and to both; a chapter says its board.
  it("opens on the school's board with a switch to the other and to both, and a chapter says its board", async () => {
    const boards = {
      ...PRACTICE,
      schoolBoard: "BALBHARATI",
      topics: [
        { ...TOPIC, id: "b1", slug: "zz-force", name: "ZZ Force", subject: "SCIENCE", board: "BALBHARATI" },
        { ...TOPIC, id: "n1", slug: "zz-magnets", name: "ZZ Magnets", subject: "SCIENCE", board: "NCERT" },
        { ...TOPIC, id: "x1", slug: "zz-aptitude", name: "ZZ Aptitude", subject: "MATHS", board: null },
      ],
    };
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => boards });
    expect(await screen.findByText("ZZ Force")).toBeTruthy();
    expect(screen.getByText("ZZ Aptitude")).toBeTruthy();
    expect(screen.queryByText("ZZ Magnets")).toBeNull();
    expect(screen.getByRole("button", { name: "ZZ Force, Science · Class 5 · Balbharati" })).toBeTruthy();
    const names = screen.getAllByRole("button").map((b) => b.props.accessibilityLabel).filter((n) => ["Balbharati", "NCERT", "Both boards"].includes(n));
    expect(names).toEqual(["Balbharati", "NCERT", "Both boards"]);
    await press(screen.getByRole("button", { name: "NCERT" }));
    expect(screen.getByText("ZZ Magnets")).toBeTruthy();
    expect(screen.queryByText("ZZ Force")).toBeNull();
    await press(screen.getByRole("button", { name: "Both boards" }));
    expect(screen.getByText("ZZ Force")).toBeTruthy();
    expect(screen.getByText("ZZ Magnets")).toBeTruthy();
  });

  it("a school with neither board opens on both", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => ({ ...PRACTICE, schoolBoard: null, topics: [{ ...TOPIC, board: "NCERT" }, { ...TOPIC, id: "b2", slug: "zz-b", name: "ZZ Balbharati Fractions", board: "BALBHARATI" }] }) });
    expect(await screen.findByText("ZZ Balbharati Fractions")).toBeTruthy();
    const names = screen.getAllByRole("button").map((b) => b.props.accessibilityLabel).filter((n) => ["Balbharati", "NCERT", "Both boards"].includes(n));
    expect(names).toEqual(["Both boards", "NCERT", "Balbharati"]);
  });

  it("an older server, which sends no boards, gets no switch and every chapter", async () => {
    await renderFamily(<FamilyPractice />, ME_STUDENT, { [PATH]: () => PRACTICE });
    expect(await screen.findByText("Continue where you left off")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Both boards" })).toBeNull();
  });

  it("a guardian sees the child's school's board first and can switch", async () => {
    const progress = {
      children: [child(ID.child, "ZZ Asha")],
      childName: "ZZ Asha",
      weeklyCount: 7,
      schoolBoard: "NCERT",
      topics: [
        { slug: "zz-fractions", name: "ZZ Fractions", subject: "MATHS", classLevel: 5, level: 2, seenCount: 5, correctCount: 4, tierCount: 1, cleanCompletion: false, board: "NCERT" },
        { slug: "zz-force", name: "ZZ Force", subject: "SCIENCE", classLevel: 8, level: 1, seenCount: 2, correctCount: 1, tierCount: 0, cleanCompletion: false, board: "BALBHARATI" },
      ],
    };
    await renderFamily(<FamilyPractice />, ME_PARENT, { "/api/v1/family/practice": () => progress });
    expect(await screen.findByText("ZZ Fractions · Class 5 · NCERT")).toBeTruthy();
    expect(screen.queryByText("ZZ Force · Class 8 · Balbharati")).toBeNull();
    await press(screen.getByRole("button", { name: "Balbharati" }));
    expect(screen.getByText("ZZ Force · Class 8 · Balbharati")).toBeTruthy();
    expect(screen.queryByText("ZZ Fractions · Class 5 · NCERT")).toBeNull();
  });

  it("a guardian whose child practised only the other board's chapters is told so on the school's board", async () => {
    const progress = { children: [child(ID.child, "ZZ Asha")], childName: "ZZ Asha", weeklyCount: 2, schoolBoard: "NCERT", topics: [{ slug: "zz-force", name: "ZZ Force", subject: "SCIENCE", classLevel: 8, level: 1, seenCount: 2, correctCount: 1, tierCount: 0, cleanCompletion: false, board: "BALBHARATI" }] };
    await renderFamily(<FamilyPractice />, ME_PARENT, { "/api/v1/family/practice": () => progress });
    expect(await screen.findByText("ZZ Asha has not practised any NCERT chapter yet. Choose the other board to see the rest.")).toBeTruthy();
    const both = screen.getAllByRole("button", { name: "Both boards" });
    await press(both[both.length - 1]!);
    expect(screen.getByText("ZZ Force · Class 8 · Balbharati")).toBeTruthy();
  });

  it("a guardian whose child has not practised yet is told so", async () => {
    await renderFamily(<FamilyPractice />, ME_PARENT, { "/api/v1/family/practice": () => ({ children: [child(ID.child, "ZZ Asha")], childName: "ZZ Asha", weeklyCount: 0, topics: [] }) });
    expect(await screen.findByText(/Nothing tried yet/)).toBeTruthy();
  });
});
