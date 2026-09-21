import { Share } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { calls, ID, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
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
/** The same card issued under the office's rules: a scale, subjects made of weighted parts, co-scholastic grades and a layout. */
const RICH = {
  ...CARD,
  overallLetter: "A1",
  gradePoints: 9.5,
  scope: "TERM",
  school: { ...CARD.school, addressLine: "1 ZZ Road", city: "Pune", region: null, postalCode: "411001", contactPhone: "020 000", contactEmail: null, website: null, brandPrimary: "#123456" },
  subjects: [
    {
      subject: "ZZ Maths",
      percent: 82.5,
      letter: "A2",
      points: 9,
      parts: [
        { label: "ZZ Unit test 1", kind: "UNIT_TEST", scoreMilli: 18000, pointsMilli: 20000, percent: 90, weight: 40 },
        { label: "ZZ Mid-term", kind: "MID_TERM", scoreMilli: 60000, pointsMilli: 80000, percent: 75, weight: 60 },
      ],
    },
    { subject: "ZZ Science", percent: null, letter: null, points: null, parts: [{ label: "ZZ Mid-term", kind: "MID_TERM", scoreMilli: null, pointsMilli: 50000, percent: null, weight: null }] },
  ],
  coScholastic: [
    { area: "ZZ Discipline", grade: "A", note: "ZZ Always on time." },
    { area: "ZZ Art", grade: null, note: null },
  ],
  scale: {
    bands: [
      { label: "A1", minPercent: 91, points: 10, descriptor: null },
      { label: "A2", minPercent: 81, points: 9, descriptor: null },
    ],
    coScale: [{ label: "A", descriptor: "Outstanding" }],
  },
  layout: { showAttendance: true, showPractice: true, showCoScholastic: true, showGradePoints: true, showAddress: true, showSignatures: true, showRemark: true, useBrandColour: true, signatureLeft: "Class teacher", signatureRight: "Principal", headerNote: "ZZ Affiliation 12345", footerNote: "ZZ Printed on request.", paper: "A4" },
};
const PATH = "/api/v1/family/exams";
const CARDS = "/api/v1/family/report-cards";
const ONE = `/api/v1/family/report-cards/${ID.card}`;
const PDF = `/api/v1/shared/report-cards/${ID.card}/pdf`;
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

beforeEach(() => (Sharing.shareAsync as jest.Mock).mockClear());

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

  it("a card issued under the school's rules shows its subjects with their parts, the letters, the co-scholastic grades, the scale and the letterhead", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => EXAMS, [CARDS]: () => ({ groups: EXAMS.cards }), [ONE]: () => RICH });
    await press(await screen.findByRole("tab", { name: "Report cards (1)" }));
    await press(await screen.findByRole("button", { name: /ZZ Term 1 report/ }));
    expect(await screen.findByText("Scholastic")).toBeTruthy();
    expect(screen.queryByText("What this covers")).toBeNull();
    expect(screen.getByText("ZZ Affiliation 12345")).toBeTruthy();
    expect(screen.getByText("1 ZZ Road, Pune, 411001")).toBeTruthy();
    expect(screen.getByText("ZZ School")).toHaveStyle({ color: "#123456" });
    expect(screen.getByText("88.5% · A1")).toBeTruthy();
    expect(screen.getByText("9.5")).toBeTruthy();
    expect(screen.getByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText("82.5% · A2 · 9")).toBeTruthy();
    expect(screen.getByText("ZZ Unit test 1 18/20 (90%) · ZZ Mid-term 60/80 (75%)")).toBeTruthy();
    expect(screen.getByText("ZZ Science")).toBeTruthy();
    expect(screen.getByText("awaiting marks")).toBeTruthy();
    expect(screen.getByText("ZZ Discipline")).toBeTruthy();
    expect(screen.getByText("A · Outstanding")).toBeTruthy();
    expect(screen.getByText("ZZ Always on time.")).toBeTruthy();
    expect(screen.getByText("Scale: A1 ≥ 91% (10) · A2 ≥ 81% (9)")).toBeTruthy();
    expect(screen.getByText("ZZ Printed on request.")).toBeTruthy();
    expect(screen.getByText("Keep it up.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Share" }));
    // The spy outlives the earlier test's call: read the last one.
    const text = (share.mock.calls.at(-1)![0] as { message: string }).message;
    expect(text).toContain("ZZ Maths: 82.5% · A2 · 9");
    expect(text).toContain("ZZ Discipline: A · Outstanding — ZZ Always on time.");
    expect(text).toContain("Grade points: 9.5");
  });

  it("a layout that hides the attendance, the remark and the co-scholastic block hides them", async () => {
    const layout = { ...RICH.layout, showAttendance: false, showRemark: false, showCoScholastic: false, showGradePoints: false, showAddress: false };
    await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => EXAMS, [CARDS]: () => ({ groups: EXAMS.cards }), [ONE]: () => ({ ...RICH, layout }) });
    await press(await screen.findByRole("tab", { name: "Report cards (1)" }));
    await press(await screen.findByRole("button", { name: /ZZ Term 1 report/ }));
    expect(await screen.findByText("Scholastic")).toBeTruthy();
    expect(screen.queryByText("Attendance")).toBeNull();
    expect(screen.queryByText("Keep it up.")).toBeNull();
    expect(screen.queryByText("ZZ Discipline")).toBeNull();
    expect(screen.queryByText("9.5")).toBeNull();
    expect(screen.queryByText("1 ZZ Road, Pune, 411001")).toBeNull();
  });

  it("Download PDF fetches the card's PDF with the token and hands the file to the share sheet; a refusal is an alert with a retry", async () => {
    let refuse = true;
    const { fetch } = await renderFamily(<FamilyExams />, ME_STUDENT, {
      [PATH]: () => EXAMS,
      [CARDS]: () => ({ groups: EXAMS.cards }),
      [ONE]: () => RICH,
      [PDF]: () => (refuse ? new Response(JSON.stringify({ error: "ZZ Not yet issued.", code: "CONFLICT" }), { status: 409 }) : new Response(PDF_BYTES, { status: 200, headers: { "content-type": "application/pdf" } })),
    });
    await press(await screen.findByRole("tab", { name: "Report cards (1)" }));
    await press(await screen.findByRole("button", { name: /ZZ Term 1 report/ }));
    await screen.findByText("Scholastic");
    await press(screen.getByRole("button", { name: "Download PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not yet issued.");
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    refuse = false;
    await press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    const sent = calls(fetch, PDF);
    expect(sent).toHaveLength(2);
    expect((sent[1]!.init?.headers as Record<string, string>).Authorization).toBe("Bearer t");
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/ZZ Term 1 report - ZZ Pupil\.pdf$/), expect.objectContaining({ mimeType: "application/pdf", UTI: "com.adobe.pdf" }));
  });

  it("given a card's id (a past year's card from the archive), opens on that card, and Back is the exams", async () => {
    const router = jest.requireMock("expo-router") as { useLocalSearchParams: () => Record<string, string> };
    const original = router.useLocalSearchParams;
    router.useLocalSearchParams = () => ({ cardId: ID.card });
    try {
      await renderFamily(<FamilyExams />, ME_STUDENT, { [PATH]: () => EXAMS, [ONE]: () => CARD });
      expect(await screen.findByText("What this covers")).toBeTruthy();
      expect(screen.getByText("Keep it up.")).toBeTruthy();
      await press(screen.getByRole("button", { name: "Back" }));
      expect(await screen.findByRole("tab", { name: "Marks" })).toBeTruthy();
    } finally {
      router.useLocalSearchParams = original;
    }
  });
});
