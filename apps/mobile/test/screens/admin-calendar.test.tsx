import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffCalendar } from "@/screens/staff/calendar";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

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
const EMPTY = { ...CALENDAR, years: [], currentYearId: null, terms: [], entries: [], leave: [], birthdays: [] };
const asAdmin = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <StaffCalendar />
    </ToastProvider>,
    "ADMIN",
    answers,
  );

beforeEach(() => mockRouter.push.mockClear());

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

  it("the whole year asks the API; an admin adds an entry, and the calendar reads again", async () => {
    const { calls } = await asAdmin({ "GET /api/v1/admin/calendar": () => json(CALENDAR), "POST /api/v1/admin/calendar/closures": () => json({ id: "e9" }, 201) });
    await screen.findByText("ZZ Sports day");
    await fireEvent.press(screen.getByRole("radio", { name: "Whole year" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/calendar?when=all")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Add to the calendar" }));
    await fireEvent.changeText(screen.getByLabelText("What is it"), "ZZ Founders' Day");
    await fireEvent.press(screen.getByRole("radio", { name: "Event — school is open" }));
    await fireEvent.changeText(screen.getByLabelText("Date"), "2026-10-02");
    await fireEvent.press(screen.getByRole("button", { name: "Add to calendar" }));
    expect(await screen.findByText("ZZ Founders' Day added to the calendar")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/calendar/closures")?.body).toEqual({ name: "ZZ Founders' Day", startDateKey: "2026-10-02", endDateKey: "2026-10-02", kind: "EVENT" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/calendar?when=all").length).toBe(2));
    expect(screen.queryByLabelText("What is it")).toBeNull();
  });

  it("an entry needs a name and a start; a longer one cannot end before it starts; a note goes with it", async () => {
    const { calls } = await asAdmin({ "GET /api/v1/admin/calendar": () => json(CALENDAR), "POST /api/v1/admin/calendar/closures": () => json({ id: "e9" }, 201) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add to the calendar" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add to calendar" }));
    expect(screen.getByText("Give it a name — “Diwali” or “Half-yearly exams”.")).toBeTruthy();
    expect(screen.getByText("Pick the date it starts.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("What is it"), "ZZ Diwali");
    await fireEvent.press(screen.getByRole("checkbox", { name: "It lasts more than a day" }));
    await fireEvent.changeText(screen.getByLabelText("Starts"), "2026-11-08");
    await fireEvent.changeText(screen.getByLabelText("Ends"), "2026-11-07");
    await fireEvent.press(screen.getByRole("button", { name: "Add to calendar" }));
    expect(screen.getByText("The end date cannot be before the start date.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Ends"), "2026-11-12");
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ Five days.");
    await fireEvent.press(screen.getByRole("button", { name: "Add to calendar" }));
    await screen.findByText("ZZ Diwali added to the calendar");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/calendar/closures")?.body).toEqual({ name: "ZZ Diwali", startDateKey: "2026-11-08", endDateKey: "2026-11-12", kind: "HOLIDAY", note: "ZZ Five days." });
  });

  it("a refused entry is the server's sentence, and the form stays", async () => {
    await asAdmin({ "GET /api/v1/admin/calendar": () => json(CALENDAR), "POST /api/v1/admin/calendar/closures": refused("That date is outside the school year.", 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add to the calendar" }));
    await fireEvent.changeText(screen.getByLabelText("What is it"), "ZZ Trip");
    await fireEvent.changeText(screen.getByLabelText("Date"), "2030-01-06");
    await fireEvent.press(screen.getByRole("button", { name: "Add to calendar" }));
    expect(await screen.findByText("That date is outside the school year.")).toBeTruthy();
    expect(screen.getByLabelText("What is it")).toHaveDisplayValue("ZZ Trip");
  });

  it("nothing ahead, nothing on file, no year: each says so; a principal's door is a message, an admin's is the form", async () => {
    await mountStaff(<StaffCalendar />, "PRINCIPAL", { "GET /api/v1/admin/calendar": () => json(EMPTY) });
    expect(await screen.findByText("Nothing still to come")).toBeTruthy();
    expect(screen.getByText(/^Nothing set up yet\./)).toBeTruthy();
    expect(screen.getByText(/^Nobody has a birthday coming up on file\./)).toBeTruthy();
    expect(screen.queryByText("Staff away")).toBeNull();
    // The empty state's door: the whole year first, and from a year with nothing on it a principal goes to the office by message.
    await fireEvent.press(screen.getByRole("button", { name: "Whole year" }));
    expect(await screen.findByText("Nothing on the calendar yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("an admin's empty year opens the form from the empty state", async () => {
    await asAdmin({ "GET /api/v1/admin/calendar": () => json(EMPTY) });
    await fireEvent.press(await screen.findByRole("button", { name: "Whole year" }));
    expect(await screen.findByText("Nothing on the calendar yet")).toBeTruthy();
    const doors = screen.getAllByRole("button", { name: "Add to the calendar" });
    await fireEvent.press(doors[doors.length - 1]!);
    expect(screen.getByLabelText("What is it")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffCalendar />, "ADMIN", { "GET /api/v1/admin/calendar": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/calendar")).length).toBe(2));
  });
});
