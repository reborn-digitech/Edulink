import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffRoster } from "@/screens/staff/staff";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ROSTER = {
  staff: [
    {
      membershipId: "m2", role: "TEACHER", name: "ZZ Teacher", preferredName: null, avatarKey: null, subjects: ["Maths", "Physics"],
      staffRecord: { staffNumber: "ZZ-T-01", designation: "Senior teacher", qualification: "MSc", joinedOnKey: "2020-06-01", leaveDaysPerYear: 12, birthdateKey: "1988-04-02", serviceJoinedOnKey: "2015-06-15" },
      leadClasses: ["ZZ Class A"],
      balance: { entitlement: 12, used: 4, pending: 1, remaining: 8, yearName: "2026-27" },
    },
    { membershipId: "m3", role: "ADMIN", name: "ZZ Office", preferredName: "Zed", avatarKey: null, subjects: [], staffRecord: null, leadClasses: [], balance: null },
  ],
  total: 2,
  roleCounts: [{ role: "TEACHER", count: 1 }, { role: "ADMIN", count: 1 }],
  subjectOptions: [{ subject: "Maths", count: 1 }, { subject: "Physics", count: 1 }],
};
const EMPTY = { staff: [], total: 0, roleCounts: [], subjectOptions: [] };

beforeEach(() => mockRouter.push.mockClear());

describe("the staff roster", () => {
  it("loads, then shows each person with the record and their leave this year", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffRoster />, "PRINCIPAL", { "GET /api/v1/admin/staff": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(ROSTER));
    await screen.findByText("ZZ Teacher");
    expect(screen.getByText("1 Teacher · 1 School admin")).toBeTruthy();
    expect(screen.getByText(/^Senior teacher · Maths, Physics · Class teacher of ZZ Class A · Joined .* · Joined service on (15 Jun|Jun 15) · Date of birth: (2 Apr|Apr 2) · 4 of 12 days used · 8 left · 1 more being asked for$/)).toBeTruthy();
    expect(screen.getByText("ZZ-T-01")).toBeTruthy();
    expect(screen.getByText("ZZ Office (Zed)")).toBeTruthy();
    expect(screen.getByText("School admin")).toBeTruthy();
    expect(screen.getByText("The office keeps these records; this page only reads them.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit in the directory" })).toBeNull();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/staff")).toBe(true);
  });

  it("the role and subject chips and the search ask the API; the office edits in the directory", async () => {
    const { calls } = await mountStaff(<StaffRoster />, "ADMIN", { "GET /api/v1/admin/staff": () => json(ROSTER) });
    await screen.findByText("ZZ Teacher");
    await fireEvent.press(screen.getByRole("button", { name: "Edit in the directory" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/people");
    await fireEvent.press(screen.getByRole("radio", { name: "Teachers" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/staff?role=TEACHER")).toBe(true));
    await fireEvent.press(await screen.findByRole("radio", { name: "Physics (1)" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/staff?role=TEACHER&subject=Physics")).toBe(true));
    await fireEvent.changeText(screen.getByLabelText("Search"), "ZZ-T");
    await fireEvent(screen.getByLabelText("Search"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/staff?q=ZZ-T&role=TEACHER&subject=Physics")).toBe(true));
  });

  it("no staff yet says so; nothing matching offers to clear", async () => {
    await mountStaff(<StaffRoster />, "PRINCIPAL", { "GET /api/v1/admin/staff": () => json(EMPTY) });
    expect(await screen.findByText("No staff yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Admins" }));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    expect(await screen.findByText("No staff yet")).toBeTruthy();
  });

  it("an office with no staff yet is sent to invite them", async () => {
    await mountStaff(<StaffRoster />, "ADMIN", { "GET /api/v1/admin/staff": () => json(EMPTY) });
    expect(await screen.findByText("No staff yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Invite people" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffRoster />, "PRINCIPAL", { "GET /api/v1/admin/staff": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/staff")).length).toBe(2));
  });
});
