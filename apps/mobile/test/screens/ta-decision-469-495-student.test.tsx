import { screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { StudentPlacementScreen } from "@/screens/placement/student";
import { json, me, mountStaff } from "./staff-harness";

/**
 * The owner's decision on TA-469 and TA-495 (14 November 2026) on the phone's student screen: its internships card
 * told every student to propose "after semester 2, 4 or 6", the AICTE windows, though a student of an ICAR or UGC
 * programme may now propose after any semester of their programme. It prints the introduction of the rule the
 * student's own programme follows (internshipRule.kind), as the web's /student/placement does.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Krishi College", role }], modules: ["ACADEMICS", "PLACEMENT"], institutionKind: "COLLEGE" });
const record = { cgpa: 7.5, liveBacklogs: 0, attendancePct: 85, programmeId: "p1", programmeName: "ZZ BSc Agriculture", batchYear: 2027, gender: null, category: null };
const placement = (internshipRule: { kind: "AICTE" | "SCHEME"; windows: number[]; creditsMax: number }) => ({
  batchYear: 2027,
  profile: { skills: [], certifications: [], projects: [], optedOut: false, dreamFlag: false, higherStudies: false, entrepreneur: false, consentAt: null },
  record,
  drives: [],
  offers: [],
  internships: [],
  internshipCredits: 24,
  internshipRule,
  prep: [],
  mentorSlots: [],
});
const AICTE_INTRO = "24 credits so far. Propose one in a window after semester 2, 4 or 6, keep the diary and hand in the report.";
const SCHEME_INTRO = "24 credits so far. Propose one after any semester of your programme, keep the diary and hand in the report; the credits follow your programme's scheme.";

describe("TA-469 and TA-495: the phone's student screen introduces the internship rule that applies", () => {
  it("TA-469: an ICAR student (a scheme's rule) reads the scheme's introduction, not the AICTE windows", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement({ kind: "SCHEME", windows: [1, 2, 3, 4, 5, 6, 7, 8], creditsMax: 160 })),
    }, { me: atCollege("STUDENT") });
    expect(await screen.findByText(SCHEME_INTRO)).toBeTruthy();
    expect(screen.queryByText(AICTE_INTRO)).toBeNull();
  });

  it("TA-495: a B.Voc student (UGC, three years) reads the scheme's introduction, not the AICTE windows", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement({ kind: "SCHEME", windows: [1, 2, 3, 4, 5, 6], creditsMax: 180 })),
    }, { me: atCollege("STUDENT") });
    expect(await screen.findByText(SCHEME_INTRO)).toBeTruthy();
    expect(screen.queryByText(AICTE_INTRO)).toBeNull();
  });

  it("TA-469: an AICTE student still reads the windows after semester 2, 4 or 6", async () => {
    await mountStaff(<StudentPlacementScreen />, "STUDENT", {
      "GET /api/v1/student/placement": () => json(placement({ kind: "AICTE", windows: [2, 4, 6], creditsMax: 20 })),
    }, { me: atCollege("STUDENT") });
    expect(await screen.findByText(AICTE_INTRO)).toBeTruthy();
    expect(screen.queryByText(SCHEME_INTRO)).toBeNull();
  });
});
