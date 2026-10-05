import { screen, userEvent } from "@testing-library/react-native";
import { meSchema, type RoleCode } from "@edulink/contracts";
import { FacultyHomeScreen } from "@/screens/academics/faculty";
import { AntiRaggingScreen, DutyCard } from "@/screens/college/duties";
import { menuFor, tabShown, TABS } from "@/lib/nav";
import { json, me, mountStaff, refused } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * A college's streams and a teacher's duties on the phone (5 Oct 2026):
 * /api/v1/me's `streams` and `duties` parsed, the duty card on the faculty's
 * home, the More entry and tab that hide without the duty, and the
 * anti-ragging register's screen.
 */
const meAs = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS", "IQAC"], institutionKind: "COLLEGE", streams: ["ARTS", "SCIENCE", "COMMERCE"], ...extra });
const term = { id: `c${"zzterm1".padEnd(24, "0")}`, name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: true };
const home = { name: "ZZ Neha", departmentName: "ZZ Physics", term, today: { dateKey: "2026-10-05", closed: false, lectures: [] }, offerings: [], hours: 10, settings: { loadMinHours: 4, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 }, mentoringGroups: 1, toModerate: [] };
const register = {
  today: "2026-10-05",
  hostelOn: true,
  committee: { name: "ZZ Anti-ragging Committee", members: ["ZZ Principal (Chair)"] },
  rounds: [{ id: "r1", hostelName: "ZZ Boys' Hostel", at: "2026-09-28T21:30:00.000Z", members: "ZZ Dr Medha Ranade", flagged: false }],
  complaints: [{ id: "g1", filedOn: "2026-09-20", status: "OPEN", dueOn: "2026-10-01", overdue: true }],
  summary: { rounds30: 1, flagged30: 0, open: 1, overdue: 1 },
};

beforeEach(() => mockPush.mockClear());

describe("/api/v1/me", () => {
  it("carries the college's streams and the membership's duties, and an older server's answer reads as none", () => {
    const parsed = meSchema.parse(meAs("FACULTY", { duties: ["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"] }));
    expect(parsed.streams).toEqual(["ARTS", "SCIENCE", "COMMERCE"]);
    expect(parsed.duties).toEqual(["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"]);
    const older = meSchema.parse(me("FACULTY"));
    expect(older.streams).toEqual([]);
    expect(older.duties).toEqual([]);
    expect(() => meSchema.parse(meAs("FACULTY", { duties: ["ASTRONAUT"] }))).toThrow();
  });
});

describe("the duty's entries", () => {
  it("are in More and on a tab only for whoever holds the duty", () => {
    const labels = (duties: string[]) => menuFor("FACULTY", ["ACADEMICS", "IQAC"], duties).flatMap((g) => g.items.map((i) => i.labelKey));
    expect(labels(["ANTI_RAGGING_SQUAD"])).toContain("duties.antiRagging.title");
    expect(labels(["LAB_INCHARGE"])).not.toContain("duties.antiRagging.title");
    expect(labels([])).not.toContain("duties.antiRagging.title");
    expect(menuFor("HOD", ["IQAC"], ["ANTI_RAGGING_SQUAD"]).flatMap((g) => g.items.map((i) => i.labelKey))).toContain("duties.antiRagging.title");
    // …and only while the college has the module on.
    expect(menuFor("FACULTY", ["ACADEMICS"], ["ANTI_RAGGING_SQUAD"]).flatMap((g) => g.items.map((i) => i.labelKey))).not.toContain("duties.antiRagging.title");
    const dutyTab = { name: "x", labelKey: "duties.antiRagging.title" as const, icon: "shield", duty: "ANTI_RAGGING_SQUAD" as const };
    expect(tabShown(dutyTab, [], ["ANTI_RAGGING_SQUAD"])).toBe(true);
    expect(tabShown(dutyTab, [])).toBe(false);
    for (const tab of TABS.FACULTY) expect(tabShown(tab, ["ACADEMICS"])).toBe(true);
  });
});

describe("the duty card", () => {
  it("lists the faculty member's duties on their home and opens the anti-ragging register", async () => {
    await mountStaff(<FacultyHomeScreen />, "FACULTY", { "GET /api/v1/academics/faculty-home": () => json(home) }, { me: meAs("FACULTY", { duties: ["CLINICAL_COORDINATOR", "ANTI_RAGGING_SQUAD"] }) });
    expect(await screen.findByText("My duties")).toBeTruthy();
    expect(screen.getByText("Clinical coordinator")).toBeTruthy();
    expect(screen.getByText("Its page is on its way.")).toBeTruthy();
    expect(screen.getByText("Anti-ragging squad")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Open" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/anti-ragging");
  });

  it("is not there for a member with no duty, and says so when the duty's module is off", async () => {
    await mountStaff(<FacultyHomeScreen />, "FACULTY", { "GET /api/v1/academics/faculty-home": () => json(home) }, { me: meAs("FACULTY") });
    expect(await screen.findByText("ZZ Physics · ZZ Odd term")).toBeTruthy();
    expect(screen.queryByText("My duties")).toBeNull();
    await mountStaff(<DutyCard />, "HOD", {}, { me: meAs("HOD", { duties: ["ANTI_RAGGING_SQUAD"], modules: ["ACADEMICS"] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open" })).toBeNull();
  });
});

describe("the anti-ragging register", () => {
  it("shows the squad member the rounds, the complaints by state and due day, and the committee", async () => {
    await mountStaff(<AntiRaggingScreen />, "FACULTY", { "GET /api/v1/duties/anti-ragging": () => json(register) }, { me: meAs("FACULTY", { duties: ["ANTI_RAGGING_SQUAD"] }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText(/^ZZ Boys' Hostel · (28|29)\/09\/2026$/)).toBeTruthy();
    expect(screen.getByText("Filed on 2026-09-20, due by 2026-10-01")).toBeTruthy();
    expect(screen.getByText("Open · Overdue")).toBeTruthy();
    expect(screen.getByText("ZZ Principal (Chair)")).toBeTruthy();
  });

  it("asks nothing of the server for a member without the duty, and says why", async () => {
    const { calls } = await mountStaff(<AntiRaggingScreen />, "FACULTY", {}, { me: meAs("FACULTY") });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/duties"))).toBe(false);
  });

  it("says the module is off, and shows the server's refusal when there is one", async () => {
    await mountStaff(<AntiRaggingScreen />, "FACULTY", {}, { me: meAs("FACULTY", { duties: ["ANTI_RAGGING_SQUAD"], modules: ["ACADEMICS"] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    await mountStaff(<AntiRaggingScreen />, "ADMIN", { "GET /api/v1/duties/anti-ragging": refused("ZZ the register is closed", 403) }, { me: meAs("ADMIN") });
    expect(await screen.findByText("ZZ the register is closed")).toBeTruthy();
  });
});
