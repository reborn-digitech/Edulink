import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { SupervisionScreen } from "@/screens/placement/supervision";
import { json, me, mountStaff } from "./staff-harness";

/**
 * The owner's decision on TA-469 and TA-495 (14 November 2026) on the phone: the internships screen printed the AICTE
 * policy line at every college and held every credit entry to its 20; it now prints the rule the college's programmes
 * follow (the AICTE line where a programme answers to AICTE, the scheme's sentence where another regulator's does) and
 * holds an internship's credits to that student's own ceiling.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Krishi College", role }], modules: ["ACADEMICS", "PLACEMENT"], institutionKind: "COLLEGE" });
const internship = (id: string, over: Record<string, unknown> = {}) => ({ id, studentMembershipId: "m1", studentName: "ZZ Riya", companyName: "ZZ Seed Farm", kind: "INDUSTRY", from: "2026-07-01", to: "2026-08-15", hours: 240, credits: null, windowSemester: 8, supervisorName: "ZZ Sup", facultyMembershipId: "f1", facultyName: "ZZ Dr Faculty", diary: [], hasReport: true, reportFileId: null, industryGrade: "A", facultyVisitAt: null, vivaMarks: 40, status: "EVALUATED", needsDeclaration: false, hasDeclaration: false, declarationFileId: null, creditedAt: null, ...over });
const rule = { creditsMin: 14, creditsMax: 20, hoursMin: 600, hoursMax: 700, windows: [2, 4, 6] };
const AICTE_LINE = "The policy: 14 to 20 credits, 600 to 700 hours, in the windows after even semesters.";
const SCHEME_LINE = "Record the hours and the diary here; the credits follow the university's scheme for the programme.";

describe("TA-469 and TA-495: the phone prints the internship rule that applies", () => {
  it("TA-469: at an agriculture college (ICAR) the scheme's sentence and not the AICTE policy line, and credits past 20 are sent", async () => {
    const { calls } = await mountStaff(<SupervisionScreen />, "TPO", {
      "GET /api/v1/placement/internships": () => json({ internships: [internship("i1", { rule: "SCHEME", creditsMax: 160 })], creditsTotal: null, rule, ruleKinds: ["SCHEME"], canDecide: true }),
      "GET /api/v1/shared/people": () => json({ schoolId: "s1", schools: [{ id: "s1", name: "ZZ Krishi College" }], people: [] }),
      "POST /api/v1/placement/internships/i1/evaluate": () => json(internship("i1", { status: "CREDITED", credits: 24, rule: "SCHEME", creditsMax: 160 })),
    }, { me: atCollege("TPO") });
    expect(await screen.findByText(SCHEME_LINE)).toBeTruthy();
    expect(screen.queryByText(AICTE_LINE)).toBeNull();
    await fireEvent.press(await screen.findByRole("button", { name: "Evaluate: ZZ Riya" }));
    expect(screen.getByText("1 to 160; recorded last, once the report, the grade and the viva are in.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Credits"), "24");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/placement/internships/i1/evaluate")?.body).toMatchObject({ credits: 24 }));
  });

  it("TA-495: a college with an AICTE programme and a B.Voc prints both, and an AICTE student's credits stay at 20", async () => {
    const { calls } = await mountStaff(<SupervisionScreen />, "TPO", {
      "GET /api/v1/placement/internships": () => json({ internships: [internship("i2", { rule: "AICTE", creditsMax: 20 })], creditsTotal: null, rule, ruleKinds: ["AICTE", "SCHEME"], canDecide: true }),
      "GET /api/v1/shared/people": () => json({ schoolId: "s1", schools: [{ id: "s1", name: "ZZ Krishi College" }], people: [] }),
    }, { me: atCollege("TPO") });
    expect(await screen.findByText(AICTE_LINE)).toBeTruthy();
    expect(screen.getByText(SCHEME_LINE)).toBeTruthy();
    await fireEvent.press(await screen.findByRole("button", { name: "Evaluate: ZZ Riya" }));
    await fireEvent.changeText(screen.getByLabelText("Credits"), "24");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("The credits are 1 to 20.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });
});
