import { screen, userEvent, waitFor, within } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { FamilyHostelScreen } from "@/screens/hostel/family";
import { instantOf, whenOf } from "@/screens/hostel/words";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const CHILD = "czz000000000000000000pup1";
const CHILD2 = "czz000000000000000000pup2";
const meAs = (role: RoleCode, modules: string[]) => ({ ...me(role), modules });
const PARENT = { ...meAs("PARENT", []), active: { schoolId: null, role: "PARENT", membershipId: null }, contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }] };
const child = (id: string, name: string) => ({ guardianshipId: `g-${id}`, studentMembershipId: id, studentUserId: `u-${id}`, name, schoolId: "s1", schoolName: "ZZ School", leftAt: null, relation: "mother" });
const leave = (status: string, extra: Record<string, unknown> = {}) => ({ id: "czz00000000000000000leav1", allotmentId: "a1", membershipId: CHILD, name: "ZZ Asha", className: "ZZ 5A", hostelName: "ZZ Tilak House", roomNumber: "101", kind: "HOME", fromAt: "2026-10-10T10:30:00.000Z", toAt: "2026-10-12T12:30:00.000Z", destination: "ZZ Pune", reason: "", status, requestedByName: "ZZ Asha", consentAt: null, consentByName: null, decidedAt: null, decidedByName: null, decisionNote: null, outAt: null, inAt: null, late: false, isMinor: true, ...extra });
const view = (extra: Record<string, unknown> = {}) => ({
  child: { membershipId: CHILD, name: "ZZ Asha" },
  allotment: { hostelName: "ZZ Tilak House", hostelKind: "MIXED", roomNumber: "101", floor: "1", bed: 1, fromDate: "2026-06-15", wardenName: "ZZ Sudhir" },
  tonight: { dateKey: "2026-10-04", slot: "NIGHT", status: "ABSENT" },
  leave: [leave("AWAITING_CONSENT")],
  menuToday: [{ meal: "DINNER", items: "ZZ Dal, rice" }],
  canRequestLeave: true,
  canConsent: true,
  ...extra,
});

describe("the helpers", () => {
  it("read a typed day and time in the device's zone, and refuse what is not one", () => {
    expect(instantOf("2026-10-10 16:00")).toBe(new Date(2026, 9, 10, 16, 0).toISOString());
    expect(instantOf("10/10/2026 16:00")).toBe(new Date(2026, 9, 10, 16, 0).toISOString());
    expect(whenOf(new Date(2026, 9, 10, 16, 0).toISOString(), "mr")).toBe("10/10/2026, 4:00 PM");
    expect(instantOf("2026-02-30 16:00")).toBeNull();
    expect(instantOf("tomorrow")).toBeNull();
    expect(whenOf("not a date", "en")).toBe("not a date");
  });
});

describe("a boarder's hostel on the phone (3 Oct 2026)", () => {
  beforeEach(() => mockPush.mockClear());

  it("shows a guardian the room, tonight's roll call and today's menu, and consents to the child's ask", async () => {
    let current = view();
    const { calls } = await mountStaff(
      <FamilyHostelScreen />,
      "PARENT",
      {
        "GET /api/v1/family/children": () => json({ children: [child(CHILD, "ZZ Asha")] }),
        "GET /api/v1/family/hostel": () => json(current),
        "POST /api/v1/family/hostel/leave/czz00000000000000000leav1/consent": () => {
          current = view({ leave: [leave("PENDING", { consentAt: "2026-10-04T05:30:00.000Z", consentByName: "ZZ Parent" })] });
          return json(current.leave[0]);
        },
      },
      { me: PARENT },
    );
    expect(await screen.findByText("ZZ Asha's room, tonight's roll call, today's menu and leave.")).toBeTruthy();
    expect(screen.getByText("room 101, bed 1")).toBeTruthy();
    expect(screen.getByText("Night: Absent")).toBeTruthy();
    expect(screen.getByText("ZZ Dal, rice")).toBeTruthy();
    expect(screen.getByText(/Waiting for a guardian$/)).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Consent" }));
    expect(await screen.findByText("You consented; the warden is told.")).toBeTruthy();
    expect(calls().find((c) => c.line.endsWith("/consent"))?.body).toEqual({ approve: true });
  });

  it("puts both answers with the leave they answer, gives the sections second-level headings, and prints the times dd/mm/yyyy (A3-journeys-29)", async () => {
    const night = leave("AWAITING_CONSENT", { id: "czz00000000000000000leav2", kind: "NIGHT_OUT", destination: "ZZ Night out" });
    const dentist = leave("PENDING", { id: "czz00000000000000000leav3", kind: "MEDICAL", destination: "ZZ Dentist" });
    await mountStaff(<FamilyHostelScreen />, "PARENT", { "GET /api/v1/family/children": () => json({ children: [child(CHILD, "ZZ Asha")] }), "GET /api/v1/family/hostel": () => json(view({ leave: [night, dentist] })) }, { me: PARENT });
    const answers = await screen.findByTestId("consent-czz00000000000000000leav2");
    expect(within(answers).getByRole("button", { name: "Consent" })).toBeTruthy();
    expect(within(answers).getByRole("button", { name: "Do not consent" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Do not consent" })).toHaveLength(1);
    expect(screen.queryByTestId("consent-czz00000000000000000leav3")).toBeNull();
    const levels = screen.getAllByRole("header").map((h) => [String(h.props.children), h.props["aria-level"]]);
    expect(levels[0]).toEqual(["Hostel", 1]);
    expect(levels.slice(1).every(([, level]) => level === 2)).toBe(true);
    expect(screen.getAllByText(/^10\/10\/2026, \d{1,2}:\d\d (AM|PM) to 12\/10\/2026, \d{1,2}:\d\d (AM|PM)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("25/10/2026 16:00")).toHaveLength(2);
  });

  it("refuses consent", async () => {
    const { calls } = await mountStaff(
      <FamilyHostelScreen />,
      "PARENT",
      { "GET /api/v1/family/children": () => json({ children: [child(CHILD, "ZZ Asha")] }), "GET /api/v1/family/hostel": () => json(view()), "POST /api/v1/family/hostel/leave/czz00000000000000000leav1/consent": () => json(leave("DECLINED")) },
      { me: PARENT },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Do not consent" }));
    expect(await screen.findByText("You did not consent; the leave will not go ahead.")).toBeTruthy();
    expect(calls().find((c) => c.line.endsWith("/consent"))?.body).toEqual({ approve: false });
  });

  it("asks for leave as a pupil: a minor's ask waits for a guardian", async () => {
    const { calls } = await mountStaff(
      <FamilyHostelScreen />,
      "STUDENT",
      { "GET /api/v1/family/hostel": () => json(view({ leave: [], canConsent: false, tonight: { dateKey: "2026-10-04", slot: "NIGHT", status: "NOT_TAKEN" } })), "POST /api/v1/family/hostel/leave": () => json(leave("AWAITING_CONSENT")) },
      { me: meAs("STUDENT", ["HOSTEL"]) },
    );
    expect(await screen.findByText("Tonight's roll call is not taken yet.")).toBeTruthy();
    expect(screen.getByText("A guardian consents first if you are under eighteen; then the warden decides.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Ask for the leave" }));
    expect(await screen.findByText("Some of this needs another look.")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Going to"), "ZZ Pune");
    await userEvent.setup().type(screen.getByLabelText("Leaving"), "2026-10-10 16:00");
    await userEvent.setup().type(screen.getByLabelText("Back by"), "2026-10-12 18:00");
    await userEvent.setup().press(screen.getByRole("button", { name: "Ask for the leave" }));
    expect(await screen.findByText("Asked. A guardian is told and must consent before the warden decides.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/family/hostel/leave")?.body).toEqual({ kind: "HOME", destination: "ZZ Pune", fromAt: new Date(2026, 9, 10, 16, 0).toISOString(), toAt: new Date(2026, 9, 12, 18, 0).toISOString(), reason: "" });
  });

  it("takes an ask back, and for a second child sends the child's id", async () => {
    const { calls } = await mountStaff(
      <FamilyHostelScreen />,
      "PARENT",
      {
        "GET /api/v1/family/children": () => json({ children: [child(CHILD, "ZZ Asha"), child(CHILD2, "ZZ Bela")] }),
        "GET /api/v1/family/hostel": ({ url }) => json(url.search.includes(CHILD2) ? view({ child: { membershipId: CHILD2, name: "ZZ Bela" }, leave: [leave("PENDING", { membershipId: CHILD2 })] }) : view()),
        "POST /api/v1/family/hostel/leave/czz00000000000000000leav1/cancel": () => json(leave("CANCELLED")),
      },
      { me: PARENT },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: /ZZ Bela/ }));
    expect(await screen.findByText("ZZ Bela's room, tonight's roll call, today's menu and leave.")).toBeTruthy();
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/family/hostel?childId=${CHILD2}`)).toBe(true));
    await userEvent.setup().press(screen.getByRole("button", { name: "Take the ask back" }));
    expect(await screen.findByText("The ask is taken back.")).toBeTruthy();
  });

  it("says when the child has no bed, and when a pupil's school has the hostel off", async () => {
    await mountStaff(<FamilyHostelScreen />, "STUDENT", { "GET /api/v1/family/hostel": () => json(view({ allotment: null, leave: [], canRequestLeave: false, canConsent: false })) }, { me: meAs("STUDENT", ["HOSTEL"]) });
    expect(await screen.findByText("ZZ Asha does not have a bed in the hostel.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ask for the leave" })).toBeNull();
  });

  it("is off for a pupil whose school has not switched the hostel on", async () => {
    await mountStaff(<FamilyHostelScreen />, "STUDENT", {}, { me: meAs("STUDENT", ["ALUMNI"]) });
    expect(await screen.findByText("Hostel is not switched on")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });
});
