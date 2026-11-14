import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { MootCourtsScreen } from "@/screens/college/moot-courts";
import { todayKey } from "@/screens/teacher/support";
import { HIDDEN_SCREENS, menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * A law college's moot courts on the phone (A3-inventory-4, audit of 5 Oct
 * 2026): FACULTY and HOD read the moots and record one through
 * GET/POST /api/v1/stream-records/moot-courts, correct one by its id, and
 * read the server's refusal when a correction is not theirs to make. The
 * More entry shows at a college with the law stream.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const PATH = "/api/v1/stream-records/moot-courts";
const atLaw = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE", streams: ["LAW"], ...extra });
const moot = {
  id: id("moot1"),
  name: "ZZ Intra Moot 2026",
  at: "2026-09-20",
  kind: "INTRA",
  teams: [
    { name: "ZZ Team Nyaya", outcome: "WINNER", members: [{ membershipId: id("stu1"), name: "ZZ Asha" }] },
    { name: "ZZ Team Dharma", outcome: "RUNNER_UP", members: [] },
  ],
  result: "ZZ Nyaya won 3–2",
  judgeNotes: "ZZ Sharp memorials.",
};
const students = [
  { membershipId: id("stu1"), name: "ZZ Asha" },
  { membershipId: id("stu2"), name: "ZZ Bilal" },
];
const page = (over: Record<string, unknown> = {}) => ({ offered: true, canEdit: true, items: [moot], students, ...over });
const withToasts = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

beforeEach(() => mockPush.mockClear());

describe("the moot courts screen", () => {
  it("lists the moots with their teams and records a new one", async () => {
    const { calls } = await mountStaff(withToasts(<MootCourtsScreen />), "FACULTY", { [`GET ${PATH}`]: () => json(page()), [`POST ${PATH}`]: () => json({ id: id("moot2") }) }, { me: atLaw("FACULTY") });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ Intra Moot 2026")).toBeTruthy();
    expect(screen.getByText(/ZZ Team Nyaya — Winner · ZZ Asha/)).toBeTruthy();
    expect(screen.getByText(/Result: ZZ Nyaya won 3–2/)).toBeTruthy();

    // Named teams are needed before it can be saved: two for an intra-college moot, one for an inter-college one (TA-491).
    const save = screen.getByRole("button", { name: "Record the moot court" });
    expect(save).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Name of the moot"), "ZZ Inter Moot");
    await fireEvent.press(screen.getByRole("radio", { name: "Inter-college" }));
    const teamNames = screen.getAllByLabelText("Team name");
    await fireEvent.changeText(teamNames[0]!, "ZZ Team A");
    // An inter-college moot takes the college's one team (TA-491), but every box shown must be named before Save.
    expect(screen.queryByText("Name at least two teams.")).toBeNull();
    expect(screen.getByRole("button", { name: "Record the moot court" })).toBeDisabled();
    await fireEvent.changeText(teamNames[1]!, "ZZ Team B");
    await fireEvent.press(screen.getAllByRole("checkbox", { name: "ZZ Bilal" })[0]!);
    await fireEvent.press(screen.getByRole("button", { name: "Add a team" }));
    expect(screen.getAllByLabelText("Team name")).toHaveLength(3);
    await fireEvent.press(screen.getByRole("button", { name: "Remove team 3" }));
    expect(screen.getAllByLabelText("Team name")).toHaveLength(2);
    await fireEvent.changeText(screen.getByLabelText("Result"), "ZZ A won");
    await fireEvent.press(screen.getByRole("button", { name: "Record the moot court" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ name: "ZZ Inter Moot", at: todayKey(), kind: "INTER", teams: [{ name: "ZZ Team A", membershipIds: [id("stu2")], outcome: "PARTICIPATED" }, { name: "ZZ Team B", membershipIds: [], outcome: "PARTICIPATED" }], result: "ZZ A won", judgeNotes: "" }));
    expect(await screen.findByText("The moot court is recorded.")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });

  // R-59 (risks batch, 5 Oct 2026): the door says per moot whether this reader may correct it; "Correct" is hidden where not.
  it("offers Correct only on the moots the server says this reader may correct", async () => {
    const other = { ...moot, id: id("moot2"), name: "ZZ Someone else's moot" };
    await mountStaff(withToasts(<MootCourtsScreen />), "FACULTY", { [`GET ${PATH}`]: () => json(page({ items: [{ ...moot, canEdit: true }, { ...other, canEdit: false, frozen: false }] })) }, { me: atLaw("FACULTY") });
    expect(await screen.findByRole("button", { name: "Correct ZZ Intra Moot 2026" })).toBeTruthy();
    expect(screen.getByText("ZZ Someone else's moot")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Correct ZZ Someone else's moot" })).toBeNull();
  });

  it("corrects a moot by its id, and shows the server's refusal when it is not theirs to correct", async () => {
    const refusal = "A recorded moot is corrected by the person who recorded it, the office or the head of the law department.";
    const { calls } = await mountStaff(withToasts(<MootCourtsScreen />), "FACULTY", { [`GET ${PATH}`]: () => json(page()), [`POST ${PATH}`]: () => json({ error: refusal, code: "FORBIDDEN" }, 403) }, { me: atLaw("FACULTY") });
    await fireEvent.press(await screen.findByRole("button", { name: "Correct ZZ Intra Moot 2026" }));
    expect(screen.getByText("Correct a moot court")).toBeTruthy();
    expect(screen.getByLabelText("Name of the moot").props.value).toBe("ZZ Intra Moot 2026");
    await fireEvent.changeText(screen.getByLabelText("Result"), "ZZ Nyaya won 4–1");
    await fireEvent.press(screen.getByRole("button", { name: "Save the correction" }));
    await waitFor(() =>
      expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({
        id: id("moot1"),
        name: "ZZ Intra Moot 2026",
        at: "2026-09-20",
        kind: "INTRA",
        teams: [
          { name: "ZZ Team Nyaya", membershipIds: [id("stu1")], outcome: "WINNER" },
          { name: "ZZ Team Dharma", membershipIds: [], outcome: "RUNNER_UP" },
        ],
        result: "ZZ Nyaya won 4–1",
        judgeNotes: "ZZ Sharp memorials.",
      }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getAllByText(refusal).length).toBeGreaterThan(0);
    // Back to a new record.
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Record a moot court")).toBeTruthy();
  });

  it("at a college without the law stream says so, with no form, and an empty list still has a way on", async () => {
    await mountStaff(<MootCourtsScreen />, "HOD", { [`GET ${PATH}`]: () => json(page({ offered: false, canEdit: false, items: [], students: [] })) }, { me: atLaw("HOD", { streams: ["SCIENCE"] }) });
    expect(await screen.findByText("Moot courts are kept by a college with the law stream; yours has none.")).toBeTruthy();
    expect(screen.getByText("No moot court yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record the moot court" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });

  it("asks nothing of the server for a role it is not for, or with ACADEMICS off", async () => {
    const a = await mountStaff(<MootCourtsScreen />, "TEACHER", {}, { me: atLaw("TEACHER") });
    expect(await screen.findByText("Moot courts are for a college's teachers, its office and its head.")).toBeTruthy();
    expect(a.calls().some((c) => c.line.startsWith(`GET ${PATH}`))).toBe(false);
    const b = await mountStaff(<MootCourtsScreen />, "FACULTY", {}, { me: atLaw("FACULTY", { modules: [] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    expect(b.calls().some((c) => c.line.startsWith(`GET ${PATH}`))).toBe(false);
  });

  it("an offline list offers to try again", async () => {
    await mountStaff(<MootCourtsScreen />, "FACULTY", { [`GET ${PATH}`]: () => json({ error: "ZZ the server is down", code: "SERVER" }, 500) }, { me: atLaw("FACULTY") });
    expect(await screen.findByText("ZZ the server is down")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("the moot courts entry in More", () => {
  it("is for FACULTY and HOD at a college with the law stream and ACADEMICS on", () => {
    const has = (role: RoleCode, modules: string[], streams: string[]) => menuFor(role, modules, [], streams).some((g) => g.items.some((i) => i.screen === "/(app)/moot-courts"));
    for (const role of ["FACULTY", "HOD"] as const) {
      expect({ role, law: has(role, ["ACADEMICS"], ["LAW"]) }).toEqual({ role, law: true });
      expect({ role, science: has(role, ["ACADEMICS"], ["SCIENCE", "ARTS"]) }).toEqual({ role, science: false });
      expect({ role, off: has(role, [], ["LAW"]) }).toEqual({ role, off: false });
    }
    expect(has("TPO", ["ACADEMICS"], ["LAW"])).toBe(false);
    expect(HIDDEN_SCREENS as readonly string[]).toContain("moot-courts");
  });
});
