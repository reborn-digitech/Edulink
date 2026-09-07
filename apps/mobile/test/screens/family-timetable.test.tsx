import { screen, waitFor } from "@testing-library/react-native";
import { calls, child, HEADER, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyTimetable } from "@/screens/family/timetable";

const WEEK = {
  child: HEADER,
  children: [child(ID.child, "ZZ Asha")],
  today: "2026-09-07",
  weekOf: "2026-09-07",
  previous: "2026-08-31",
  next: "2026-09-14",
  isThisWeek: true,
  spansClasses: false,
  grid: {
    periods: [
      { id: "p1", name: "Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 },
      { id: "b1", name: "Break", startMinute: 585, endMinute: 600, kind: "BREAK", position: 2 },
    ],
    days: [
      { weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: true },
      { weekday: 2, dateKey: "2026-09-08", closed: true, closedName: "ZZ Holiday", isToday: false },
    ],
    slots: [{ id: "sl1", classId: "c1", className: "ZZ 5A", periodId: "p1", weekday: 1, subject: "ZZ Maths", room: "Room 4", teacherMembershipId: "tm1", teacherName: "ZZ Teacher", coveringMembershipId: "tm2", coveringName: "ZZ Cover", uncovered: false, borrowed: false }],
  },
};
const PATH = "/api/v1/family/timetable";

describe("the week", () => {
  it("is loading while the week is on its way", async () => {
    await renderFamily(<FamilyTimetable />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows a guardian their child's week, day by day, saying who is covering, and pages forward", async () => {
    const { fetch } = await renderFamily(<FamilyTimetable />, ME_PARENT, { [PATH]: () => WEEK });
    expect(await screen.findByText("ZZ Asha’s timetable")).toBeTruthy();
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText(/ZZ Cover covering/)).toBeTruthy();
    expect(screen.getByText("School is shut.")).toBeTruthy();
    expect(screen.getByText(/ZZ Holiday/)).toBeTruthy();
    await press(screen.getByRole("button", { name: "Next →" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("week") === "2026-09-14" && c.url.searchParams.get("childId") === null)).toBe(true));
  });

  it("a pupil sees their own week without a child", async () => {
    const { fetch } = await renderFamily(<FamilyTimetable />, ME_STUDENT, { [PATH]: () => ({ ...WEEK, child: null, children: [] }) });
    expect(await screen.findByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText("Timetable")).toBeTruthy();
    expect(calls(fetch, PATH)[0]!.url.search).toBe("");
  });

  it("a week with nothing timetabled says so", async () => {
    await renderFamily(<FamilyTimetable />, ME_PARENT, { [PATH]: () => ({ ...WEEK, grid: { ...WEEK.grid, slots: [] } }) });
    expect(await screen.findByText("Nothing timetabled this week")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyTimetable />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
