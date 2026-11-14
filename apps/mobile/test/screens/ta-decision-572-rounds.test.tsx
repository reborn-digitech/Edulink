import { screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { OfficeAdmissionsScreen } from "@/screens/staff/office-college";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules: ["ACADEMICS", "ADMISSIONS"], institutionKind: "COLLEGE" });
// As saveRound stores them: the opening day at 00:00 UTC, the closing day at 23:59:59 UTC.
const round = (over: Record<string, unknown>) => ({ id: "rd1", programmeId: null, intakeYear: 2026, kind: "MERIT", name: "ZZ Merit list", opensAt: "2026-07-06T00:00:00.000Z", closesAt: "2026-08-15T23:59:59.000Z", seats: { OPEN: 6 }, status: "CLOSED", allotments: 0, applications: 3, admitted: 1, ...over });

describe("TA-572: a college's admission round on the phone", () => {
  it("TA-572: shows the round's opening and closing days as the office typed them, with no hour, and the server's Closed", async () => {
    await mountStaff(<OfficeAdmissionsScreen />, "ADMIN", { "GET /api/v1/college/admissions/rounds": () => json({ rounds: [round({})] }) }, { me: atCollege("ADMIN") });
    expect(await screen.findByText("ZZ Merit list")).toBeTruthy();
    // The closing day is 15 August, never 16 August at 5:29 am as an instant read in India's zone made it.
    expect(screen.getByText(/06\/07\/2026 – 15\/08\/2026/)).toBeTruthy();
    expect(screen.queryByText(/16 Aug|16\/08\/2026|5:29/)).toBeNull();
    expect(screen.getByText("Closed")).toBeTruthy();
  });
});
