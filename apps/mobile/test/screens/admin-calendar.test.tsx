import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffCalendar } from "@/screens/staff/calendar";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const CALENDAR = {
  todayKey: "2026-09-07",
  years: [{ id: "y1", name: "2026-27", startDateKey: "2026-06-01", endDateKey: "2027-04-30", isCurrent: true, closedAt: null }],
  currentYearId: "y1",
  terms: [{ id: "t1", name: "Term 1", startDateKey: "2026-06-01", endDateKey: "2026-10-31", current: true, finished: false }],
  entries: [
    { id: "e1", name: "ZZ Sports day", startDateKey: "2026-09-20", endDateKey: "2026-09-20", kind: "EVENT", note: "Whole school", academicYearId: "y1" },
    { id: "e2", name: "ZZ Diwali break", startDateKey: "2026-11-08", endDateKey: "2026-11-12", kind: "HOLIDAY", note: null, academicYearId: "y1" },
  ],
  leave: [{ id: "l1", status: "APPROVED", kind: "CASUAL", fromDateKey: "2026-09-15", toDateKey: "2026-09-16", applicantName: "ZZ Teacher", applicantMembershipId: "m2", nominatedName: "ZZ Cover", decidedByName: "ZZ Head", decidedAt: "2026-09-01T00:00:00.000Z" }],
  birthdays: [{ membershipId: "m3", name: "ZZ Office", role: "ADMIN", dateKey: "2026-09-30", turning: 40, movedFromLeapDay: false }],
};

describe("the school calendar", () => {
  it("loads, then shows the year, the entries with their kind, staff away and birthdays", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffCalendar />, "PRINCIPAL", { "GET /api/v1/admin/calendar": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(CALENDAR));
    await screen.findByText("ZZ Sports day");
    expect(screen.getByText(/^Running 2026-27\./)).toBeTruthy();
    expect(screen.getByText("Term 1")).toBeTruthy();
    expect(screen.getByText("Event")).toBeTruthy();
    expect(screen.getByText("Holiday")).toBeTruthy();
    expect(screen.getByText("ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("ZZ Cover")).toBeTruthy();
    expect(screen.getByText("ZZ Office")).toBeTruthy();
    expect(screen.getByText(/turning 40$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to the calendar" })).toBeNull();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/calendar")).toBe(true);
  });

  it("the whole year asks the API; adding an entry opens the web for an admin", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<StaffCalendar />, "ADMIN", { "GET /api/v1/admin/calendar": () => json(CALENDAR) });
    await screen.findByText("ZZ Sports day");
    await fireEvent.press(screen.getByRole("radio", { name: "Whole year" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/calendar?when=all")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Add to the calendar" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/calendar`);
    open.mockRestore();
  });

  it("nothing ahead, nothing on file, no year: each says so", async () => {
    await mountStaff(<StaffCalendar />, "PRINCIPAL", { "GET /api/v1/admin/calendar": () => json({ ...CALENDAR, years: [], currentYearId: null, terms: [], entries: [], leave: [], birthdays: [] }) });
    expect(await screen.findByText("Nothing still to come")).toBeTruthy();
    expect(screen.getByText(/^Nothing set up yet\./)).toBeTruthy();
    expect(screen.getByText(/^Nobody has a birthday coming up on file\./)).toBeTruthy();
    expect(screen.queryByText("Staff away")).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffCalendar />, "ADMIN", { "GET /api/v1/admin/calendar": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/calendar")).length).toBe(2));
  });
});
