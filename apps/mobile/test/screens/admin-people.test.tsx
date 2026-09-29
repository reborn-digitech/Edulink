import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { People } from "@/screens/staff/people";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const person = (membershipId: string, role: string, name: string, extra: Record<string, unknown> = {}) => ({
  membershipId, role, status: "ACTIVE", name, preferredName: null, email: `${membershipId}@zz.test`, avatarKey: null, birthdateKey: null, studentCode: null, title: null, subjects: [], joinedAt: "2026-06-01T00:00:00.000Z", leftAt: null, suspendedAt: null, suspendedReason: null, enrolledIn: [], teaches: [], staffRecord: null, schoolRecord: null, scheduledDeparture: null, pendingParentInvites: [], ...extra,
});
const DIRECTORY = {
  members: [person("m2", "TEACHER", "ZZ Teacher", { teaches: ["ZZ Class A"] }), person("m7", "STUDENT", "ZZ Pupil", { studentCode: "ZZ-007", enrolledIn: ["ZZ Class A"], email: null })],
  total: 2, page: 1, pages: 1, pageSize: 50,
  classes: [{ id: "c1", name: "ZZ Class A" }],
  roleCounts: [{ role: "TEACHER", count: 1 }, { role: "STUDENT", count: 1 }],
  suspendedCount: 0, leftCount: 1,
  filters: { q: "", role: null, status: "ACTIVE", classId: null, sort: "name" },
};
const EMPTY = { ...DIRECTORY, members: [], total: 0, roleCounts: [] };

beforeEach(() => mockRouter.push.mockClear());

describe("people for the office", () => {
  it("the directory loads with counts, rows, and a search that asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DIRECTORY));
    await screen.findByText("ZZ Teacher");
    expect(screen.getByText("1 Teacher · 1 Student")).toBeTruthy();
    expect(screen.getByText("Teacher · m2@zz.test · ZZ Class A")).toBeTruthy();
    expect(screen.getByText("Student · No email · ZZ Class A")).toBeTruthy();
    expect(screen.getByText("ZZ-007")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/people?status=ACTIVE&page=1")).toBe(true);
    // Every row opens the person: who they are, and whether they have left or are leaving, go with it.
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Pupil, Student · No email · ZZ Class A" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/person", params: { membershipId: "m7", name: "ZZ Pupil", role: "STUDENT", left: "", leavingOn: "" } });
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Teacher,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/person", params: { membershipId: "m2", name: "ZZ Teacher", role: "TEACHER", left: "", leavingOn: "" } });
    await fireEvent.changeText(screen.getByLabelText("Search the directory"), "pupil");
    await fireEvent(screen.getByLabelText("Search the directory"), "submitEditing");
    await fireEvent.press(screen.getByRole("radio", { name: "Students" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/people?q=pupil&role=STUDENT&status=ACTIVE&page=1")).toBe(true));
  });

  it("inviting people and admitting pupils are their own screens", async () => {
    await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": () => json(DIRECTORY) });
    await screen.findByText("ZZ Teacher");
    await fireEvent.press(screen.getByRole("button", { name: "Invite people" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
    await fireEvent.press(screen.getByRole("button", { name: "Admit pupils from a list" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/intake");
  });

  it("nobody yet offers the invitations; nobody matching offers to clear", async () => {
    await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": () => json(EMPTY) });
    expect(await screen.findByText("Nobody here yet")).toBeTruthy();
    const doors = screen.getAllByRole("button", { name: "Invite people" });
    await fireEvent.press(doors[doors.length - 1]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
    await fireEvent.press(screen.getByRole("radio", { name: "Left (1)" }));
    expect(await screen.findByText("Nobody matches those filters")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("Nobody here yet")).toBeTruthy();
  });

  it("a principal's People is the staff roster", async () => {
    await mountStaff(<People />, "PRINCIPAL", { "GET /api/v1/admin/staff": () => json({ staff: [], total: 0, roleCounts: [], subjectOptions: [] }) });
    expect(await screen.findByText("No staff yet")).toBeTruthy();
    // An empty roster is the office's to fill; the head's door is a message to them.
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/people")).length).toBe(2));
  });
});
