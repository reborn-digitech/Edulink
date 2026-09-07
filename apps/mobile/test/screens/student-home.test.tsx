import { screen } from "@testing-library/react-native";
import { LESSON, ME_STUDENT, mockRouter, pending, refused, renderFamily, SUMMARY, press } from "./family-helpers";
import { StudentHome } from "@/screens/family/student-home";

const OVERVIEW = {
  name: "ZZ Pupil",
  avatarKey: null,
  today: "2026-09-07",
  className: "ZZ 5A",
  todayStatus: "PRESENT",
  streak: 2,
  attendance: SUMMARY,
  closedToday: false,
  closedName: null,
  lessonsToday: [LESSON],
  upcoming: [{ id: "a1", title: "ZZ Reading log", className: "ZZ 5A", dueAt: "2030-01-01T10:00:00.000Z", dueSoon: false }],
  examMarks: [
    {
      studentMembershipId: "m-pupil",
      studentName: "ZZ Pupil",
      schoolName: "ZZ School",
      className: "ZZ 5A",
      series: [{ id: "se1", name: "ZZ Unit test 1", kind: "UNIT_TEST", papers: [{ subject: "ZZ Maths", dateKey: "2026-08-20", marks: 18, maxMarks: 20 }], totalMarks: 18, totalMax: 20, percent: 90 }],
    },
  ],
};
const PATH = "/api/v1/family/student/overview";

describe("the pupil's Today", () => {
  it("is loading while the overview is on its way", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("greets the pupil and shows the day, what is due and the latest marks", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => OVERVIEW });
    expect(await screen.findByText("Hi ZZ Pupil 👋")).toBeTruthy();
    expect(screen.getByText("Present")).toBeTruthy();
    expect(screen.getAllByText("ZZ Maths").length).toBeGreaterThan(0);
    expect(screen.getByText("ZZ Reading log")).toBeTruthy();
    expect(screen.getByText("ZZ Unit test 1")).toBeTruthy();
    expect(screen.getByText("90%")).toBeTruthy();
  });

  it("with nothing on and nothing due, says so gently", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => ({ ...OVERVIEW, todayStatus: null, lessonsToday: [], upcoming: [], examMarks: [] }) });
    expect(await screen.findByText("Nothing due right now")).toBeTruthy();
    expect(screen.getByText("Not yet")).toBeTruthy();
    expect(screen.getByText(/No lessons today/)).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: refused(503, "ZZ down") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("the timetable and the assignments are one tap away", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => OVERVIEW });
    await press(await screen.findByRole("button", { name: "Open the timetable" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/timetable");
    await press(screen.getByRole("button", { name: "ZZ Reading log, ZZ 5A" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/assignments");
  });
});
