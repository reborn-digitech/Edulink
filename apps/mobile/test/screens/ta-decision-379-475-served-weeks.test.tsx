/**
 * The owner's decision on TA-379 and TA-475 of the testing analysis of 13 November 2026, on the phone: the
 * teaching-practice figure counts weeks served out of every final-year student teacher, and the desk and the
 * office's stream-records card say so, with no sentence stating an NCTE requirement as fact.
 */
import { screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { TeachingPracticeScreen } from "@/screens/college/duty-desks";
import { StreamRecordsScreen } from "@/screens/college/stream-records";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[], extra: Record<string, unknown> = {}) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role, institutionKind: "COLLEGE" }], modules, institutionKind: "COLLEGE", ...extra });
const tp = { year: 2026, practiceSchools: 1, postings: 3, students: 8, lessonsPlanned: 60, lessonsObserved: 4, weeks: 30, minimumWeeks: 20, meetingMinimum: 3, bySchool: [], perStudent: [] };
const LABEL = "Final-year student teachers with their weeks served";

describe("TA-379, TA-475: the phone's teaching-practice figure", () => {
  it("TA-475: the coordinator's desk shows final-year student teachers served out of all of them, and states no NCTE requirement", async () => {
    await mountStaff(<TeachingPracticeScreen />, "FACULTY", { "GET /api/v1/duties/teaching-practice": () => json({ offered: true, canManage: true, canObserve: true, schools: [], postings: [], students: [], summary: tp }) }, { me: atCollege("FACULTY", ["ACADEMICS"], { streams: ["EDUCATION"], duties: ["PRACTICE_TEACHING_COORDINATOR"] }) });
    expect(await screen.findByText(LABEL)).toBeTruthy();
    expect(screen.getByText("3 / 8")).toBeTruthy();
    expect(screen.getByText(/final-year student teachers have served their weeks of school internship \(the bar counted here is 20\)/)).toBeTruthy();
    expect(screen.queryByText(/NCTE/)).toBeNull();
  });

  it("TA-379: the office's stream-records card says final-year student teachers and that weeks count once served", async () => {
    const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
    await mountStaff(<StreamRecordsScreen />, "ADMIN", {
      "GET /api/v1/stream-records/summary": () =>
        json({
          year: 2026,
          streams: ["EDUCATION"],
          labs: false,
          law: false,
          education: true,
          practical: { year: 2026, records: 0, signed: 0, unsigned: 0, students: 0, offerings: 0, batches: 0, batchMembers: 0, byCourse: [] },
          lawInternships: { year: 2026, internships: 0, byKind: { COURT: 0, FIRM: 0, LEGAL_AID: 0 }, weeks: 0, students: 0, meetingMinimum: 0, perStudent: [], mootCourts: { total: 0, INTRA: 0, INTER: 0, NATIONAL: 0, participants: 0 } },
          teachingPractice: tp,
          corps: { year: 2026, nss: corps, ncc: corps, hoursPerYear: 120 },
        }),
    }, { me: atCollege("ADMIN", ["ACADEMICS"], { streams: ["EDUCATION"] }) });
    expect(await screen.findByText(LABEL)).toBeTruthy();
    expect(screen.getByText("3 / 8")).toBeTruthy();
    expect(screen.getByText(/A posting's weeks count once its days have passed\./)).toBeTruthy();
    expect(screen.queryByText(/NCTE/)).toBeNull();
  });
});
