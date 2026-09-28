import { screen } from "@testing-library/react-native";
import { calls, LESSON, ME_STUDENT, mockRouter, pending, refused, renderFamily, SUMMARY, press } from "./family-helpers";
import { StudentHome } from "@/screens/family/student-home";

const OVERVIEW = {
  welcome: null,
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
  const RECORD_PATH = "/api/v1/family/record";
  const record = (missing: string[]) => ({ studentMembershipId: "m-pupil", studentName: "ZZ Pupil", className: "ZZ 5A", studentCode: null, birthdate: "2014-03-14", record: null, missing, missingForFiling: [], complete: missing.length === 0, canEdit: true, penEditable: false, penChange: null });

  it("nudges to complete the school record while a certificate field is blank, asking for the pupil's own record, and not once it is complete", async () => {
    const { fetch } = await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => OVERVIEW, [RECORD_PATH]: () => record(["motherTongue"]) });
    expect(await screen.findByText("Complete the school record")).toBeTruthy();
    expect(screen.getByText("The school needs a few details for certificates: Mother tongue.")).toBeTruthy();
    expect(calls(fetch, RECORD_PATH)[0]!.url.searchParams.get("childId")).toBeNull();
    await press(screen.getByRole("button", { name: "Fill it in" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/record", params: {} });
  });

  it("shows no record card once the record is complete", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => OVERVIEW, [RECORD_PATH]: () => record([]) });
    await screen.findByText("Hi ZZ Pupil 👋");
    expect(screen.queryByText("Complete the school record")).toBeNull();
  });

  it("welcomes a new pupil with their login name, and putting it away tells the server and takes the card off", async () => {
    const { fetch } = await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => ({ ...OVERVIEW, welcome: { handle: "zzpupil.k4f9" } }), "/api/v1/family/student/welcomed": () => ({ ok: true }) });
    expect(await screen.findByText("You’re in, ZZ Pupil!")).toBeTruthy();
    expect(screen.getByText("Your login name — save this with a grown-up")).toBeTruthy();
    expect(screen.getByText("zzpupil.k4f9")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Hide this message" }));
    expect(screen.queryByText("You’re in, ZZ Pupil!")).toBeNull();
    expect(calls(fetch, "/api/v1/family/student/welcomed")).toHaveLength(1);
    // The day is still there underneath.
    expect(screen.getByText("Hi ZZ Pupil 👋")).toBeTruthy();
  });

  it("a new pupil who signs in with an email address is welcomed with no login name to save; an old one is not welcomed", async () => {
    await renderFamily(<StudentHome />, ME_STUDENT, { [PATH]: () => ({ ...OVERVIEW, welcome: { handle: null } }) });
    expect(await screen.findByText("You’re in, ZZ Pupil!")).toBeTruthy();
    expect(screen.queryByText("Your login name — save this with a grown-up")).toBeNull();
  });

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
