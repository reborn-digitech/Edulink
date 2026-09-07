import { Share } from "react-native";
import { screen } from "@testing-library/react-native";
import { ID, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyExams } from "@/screens/family/exams";

const ROW = { id: ID.card, title: "ZZ Term 1 report", publishedAt: "2026-09-01T00:00:00.000Z", overallPercentMilli: 88500 };
const EXAMS = {
  marks: [
    {
      studentMembershipId: "m-pupil",
      studentName: "ZZ Pupil",
      schoolName: "ZZ School",
      className: "ZZ 5A",
      series: [{ id: "se1", name: "ZZ Unit test 1", kind: "UNIT_TEST", papers: [{ subject: "ZZ Maths", dateKey: "2026-08-20", marks: 18, maxMarks: 20 }], totalMarks: 18, totalMax: 20, percent: 90 }],
    },
  ],
  upcoming: [{ id: "ds1", name: "ZZ Mid-term", kind: "MID_TERM", gradeLevel: "5", schoolName: "ZZ School", slots: [{ id: "sl1", subject: "ZZ Science", dateKey: "2030-10-01", startMinute: 600, endMinute: 720, maxMarks: 50 }] }],
  cards: [{ studentMembershipId: "m-pupil", name: null, rows: [ROW] }],
  termIsRunning: false,
  awaitingTermName: null,
};
const CARD = {
  id: ID.card,
  status: "PUBLISHED",
  title: "ZZ Term 1 report",
  remark: "Keep it up.",
  studentMembershipId: "m-pupil",
  studentName: "ZZ Pupil",
  className: "ZZ 5A",
  classSection: null,
  fromDateKey: "2026-06-01",
  toDateKey: "2026-08-31",
  attendancePresent: 55,
  attendanceTotal: 60,
  attendancePercent: 92,
  overallPercent: 88.5,
  gradingMethod: "exams",
  publishedAt: "2026-09-01T00:00:00.000Z",
  authorName: "ZZ Teacher",
  items: [{ title: "ZZ Unit test 1", category: "Exam", scoreMilli: 18000, pointsMilli: 20000 }],
  school: { name: "ZZ School", logoPath: null },
  practice: null,
};
const PATH = "/api/v1/family/exams";
const CARDS = "/api/v1/family/report-cards";
const ONE = `/api/v1/family/report-cards/${ID.card}`;

describe("exams and report cards", () => {
  it("is loading while the marks are on their way", async () => {
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("opens on the marks when there are any, and the upcoming tab lists the sittings", async () => {
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => EXAMS });
    expect(await screen.findByText("ZZ Unit test 1")).toBeTruthy();
    expect(screen.getByText("90%")).toBeTruthy();
    await press(screen.getByRole("tab", { name: "Upcoming" }));
    expect(screen.getByText("ZZ Science")).toBeTruthy();
  });

  it("with no marks yet opens on what is ahead, and the marks tab says so", async () => {
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => ({ ...EXAMS, marks: [], upcoming: [] }) });
    expect(await screen.findByText("No exams coming up")).toBeTruthy();
    await press(screen.getByRole("tab", { name: "Marks" }));
    expect(screen.getByText("No marks yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("the cards tab lists the cards, one opens natively, and Share hands the card to the share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => EXAMS, [CARDS]: () => ({ groups: EXAMS.cards }), [ONE]: () => CARD });
    await press(await screen.findByRole("tab", { name: "Report cards (1)" }));
    await press(await screen.findByRole("button", { name: /ZZ Term 1 report/ }));
    expect(await screen.findByText("What this covers")).toBeTruthy();
    expect(screen.getByText("Keep it up.")).toBeTruthy();
    expect(screen.getByText("18 / 20")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("ZZ Pupil") }));
    await press(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("tab", { name: "Report cards (1)" })).toBeTruthy();
  });
});
