/**
 * TA-059 (testing analysis of 13 November 2026, batch college-academics): the faculty member's home on the phone
 * listed today's lectures alone, so a lecture not marked on its own day could not be reached again. The home now
 * steps back a day at a time through GET /api/v1/academics/lectures?date=, and opens that day's register.
 */
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { FacultyHomeScreen } from "@/screens/academics/faculty";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const LECTURE = id("zzlecturey");
const OFFERING = id("zzofferingy");
const meAs = (role: RoleCode) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE" });
const term = { id: id("zztermy"), name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: false };
const settings = { loadMinHours: 4, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 };
const yesterdays = { lectureId: LECTURE, offeringId: OFFERING, dateKey: "2026-10-04", startMinute: 600, endMinute: 650, kind: "LECTURE", courseCode: "PHY102", courseName: "ZZ Optics", divisionName: null, roomName: null, registered: 2, marked: 0, substitute: false };

beforeEach(() => mockPush.mockClear());

describe("an earlier day's lectures on the phone (TA-059)", () => {
  it("TA-059: steps back a day, lists that day's lectures and opens one to mark", async () => {
    const user = userEvent.setup();
    const { calls } = await mountStaff(
      <FacultyHomeScreen />,
      "FACULTY",
      {
        "GET /api/v1/academics/faculty-home": () => json({ name: "ZZ Neha", departmentName: "ZZ Physics", term, today: { dateKey: "2026-10-05", closed: false, lectures: [] }, offerings: [], hours: 0, settings, mentoringGroups: 0, toModerate: [] }),
        "GET /api/v1/academics/lectures": () => json({ dateKey: "2026-10-04", closed: false, lectures: [yesterdays] }),
      },
      { me: meAs("FACULTY") },
    );
    expect(await screen.findByText("No lectures today")).toBeTruthy();
    await user.press(screen.getByRole("button", { name: "Previous day" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/academics/lectures?date=2026-10-04")).toBe(true));
    expect(await screen.findByText("10:00–10:50 · PHY102")).toBeTruthy();
    await user.press(screen.getByRole("button", { name: "Mark the lecture" }));
    expect(mockPush).toHaveBeenCalledWith(`/(app)/lecture?id=${LECTURE}`);
    // Back to today.
    await user.press(screen.getByRole("button", { name: "Next day" }));
    expect(await screen.findByText("No lectures today")).toBeTruthy();
  });
});
