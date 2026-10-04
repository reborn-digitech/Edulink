import { screen, waitFor } from "@testing-library/react-native";
import { calls, child, HEADER, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, SUMMARY, press } from "./family-helpers";
import { FamilyAttendance } from "@/screens/family/attendance";

const MONTH = {
  children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")],
  child: HEADER,
  month: "2026-09",
  thisMonth: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  summary: SUMMARY,
  days: [
    { dateKey: "2026-09-04", status: "PRESENT", note: null, teachingDay: true },
    { dateKey: "2026-09-03", status: "LATE", note: "Bus", teachingDay: true },
  ],
};
const PATH = "/api/v1/family/attendance";

describe("a child's attendance", () => {
  it("is loading while the month is on its way", async () => {
    await renderFamily(<FamilyAttendance />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the month's figures and its days, and pages to the previous month", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, { [PATH]: () => MONTH });
    expect(await screen.findByText("ZZ Asha’s attendance")).toBeTruthy();
    expect(screen.getByText("95%")).toBeTruthy();
    expect(screen.getByText("“Bus”")).toBeTruthy();
    expect(screen.getAllByText("Late").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    await press(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("month") === "2026-08")).toBe(true));
  });

  it("switching child keeps the month and asks for that child", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, { [PATH]: () => MONTH });
    await press(await screen.findByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
  });

  it("a month with nothing recorded says so", async () => {
    const empty = { ...MONTH, summary: { ...SUMMARY, counts: { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 }, total: 0, percent: null, recent: [] }, days: [] };
    await renderFamily(<FamilyAttendance />, ME_PARENT, { [PATH]: () => empty });
    expect(await screen.findByText("No attendance recorded yet")).toBeTruthy();
    // Once, not three times (B-25): "No records" and "Nothing recorded yet" were said above it too.
    expect(screen.queryByText("No records")).toBeNull();
    expect(screen.queryByText("Nothing recorded yet")).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyAttendance />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a pupil reads their own last four weeks from their overview", async () => {
    const overview = { welcome: null, name: "ZZ Pupil", avatarKey: null, today: "2026-09-07", className: null, todayStatus: "LATE", streak: 0, attendance: SUMMARY, closedToday: false, closedName: null, lessonsToday: [], upcoming: [], examMarks: [] };
    await renderFamily(<FamilyAttendance />, ME_STUDENT, { "/api/v1/family/student/overview": () => overview });
    expect(await screen.findByText("95%")).toBeTruthy();
    expect(screen.getAllByText("Present").length).toBeGreaterThan(0);
  });
});
