import { describe, expect, it } from "vitest";
import { examSummary, examSummaryFromCollege, examSummaryFromFamily } from "@/lib/assistant/exams";
import { asksAboutExams, toolsFor } from "@/lib/assistant/tools";
import { EXAM_DATA_RULE, EXAM_SCOPE_RULE, tutorMessages } from "@/lib/assistant/prompt";

/**
 * The exam-scope reader (10 October 2026): the pupil's own exams door, read by shape into a few lines the
 * model answers "when is my exam" and "which subjects" from, and that say which topics a paper covers is
 * not on the platform. Phase D's pilot scored 6/55 before it existed.
 */
const family = {
  data: {
    marks: [{ studentMembershipId: "m1", studentName: "Jai Verma", schoolName: "Sunrise", className: "Grade 6 · A", series: [
      { id: "s1", name: "Unit test 1", kind: "UNIT_TEST", papers: [{ subject: "Mathematics", dateKey: "2026-07-11", marks: 17, maxMarks: 25 }, { subject: "English", dateKey: "2026-07-12", marks: 23, maxMarks: 25 }] },
      { id: "s2", name: "Mid-term", kind: "MID_TERM", papers: [{ subject: "Mathematics", dateKey: "2026-09-09", marks: 63, maxMarks: 80 }, { subject: "English", dateKey: "2026-09-10", marks: 50, maxMarks: 80 }] },
    ] }],
    upcoming: [{ id: "s3", name: "Half-yearly", kind: "MID_TERM", gradeLevel: "6", schoolName: "Sunrise", slots: [
      { id: "a", subject: "Mathematics", dateKey: "2026-11-24", startMinute: 540, endMinute: 690, maxMarks: 80 },
      { id: "b", subject: "English", dateKey: "2026-11-25", startMinute: 540, endMinute: 690, maxMarks: 80 },
    ] }],
    cards: [],
    termIsRunning: true,
    awaitingTermName: null,
  },
};

describe("the school door's lines", () => {
  it("names each sitting ahead with its date, time and subject, and the last series held", () => {
    const text = examSummaryFromFamily(family)!;
    expect(text).toBe(["Sitting ahead: Half-yearly (mid-term): Mathematics on 24 November 2026 at 09:00–11:30; English on 25 November 2026 at 09:00–11:30.", "Last held: Mid-term (mid-term): Mathematics on 9 September 2026; English on 10 September 2026."].join("\n"));
    expect(text).not.toContain("Jai");
  });
  it("says plainly when nothing is scheduled ahead, and still names the last series", () => {
    const text = examSummaryFromFamily({ data: { ...family.data, upcoming: [] } })!;
    expect(text.split("\n")[0]).toBe("No sitting is scheduled ahead on the platform.");
    expect(text).toContain("Last held: Mid-term");
  });
  it("reads the bare data as well as the envelope, and refuses another shape", () => {
    expect(examSummaryFromFamily(family.data)).toEqual(examSummaryFromFamily(family));
    expect(examSummaryFromFamily({ data: { forms: [] } })).toBeNull();
    expect(examSummaryFromFamily(null)).toBeNull();
  });
});

describe("the college door's lines", () => {
  const college = { data: {
    name: "Riya", canAct: true,
    forms: [{ id: "f1", sessionId: "x", sessionName: "Winter 2026 (odd term 2026–27)", status: "APPROVED", courses: [{ courseId: "c1", code: "CS201", name: "Data Structures", kind: "REGULAR" }], eligible: true, eligibilityNote: null, noDues: true, noDuesLines: [], feePaise: 0, lateFeePaise: 0, demandStatus: null, opensAt: "2026-09-01T00:00:00.000Z", closesAt: "2026-09-20T00:00:00.000Z" }],
    tickets: [], seating: [{ courseCode: "CS201", courseName: "Data Structures", at: "2099-11-05T04:30:00.000Z", roomName: "Hall A", seatNo: 12 }, { courseCode: "OLD", courseName: "Old paper", at: "2020-01-01T04:30:00.000Z", roomName: "Hall B", seatNo: 1 }],
    results: [{ sessionId: "y", sessionName: "Summer 2026 (even term 2025–26)", publishedAt: "2026-06-30T10:00:00.000Z", revaluationOpenUntil: null }],
    cgpa: null, creditsEarned: 0, documents: [], revaluations: [], backlogs: [], credits: [],
  } };
  it("names the session, its form window and papers, the papers still ahead in Indian time, and the results out", () => {
    const text = examSummaryFromCollege(college)!;
    expect(text).toContain("Exam session Winter 2026 (odd term 2026–27): form approved, forms were open 1 September 2026 to 20 September 2026; papers: Data Structures (CS201).");
    expect(text).toContain("Papers scheduled: Data Structures (CS201) on 5 November 2099 at 10:00 in Hall A.");
    expect(text).not.toContain("Old paper");
    expect(text).not.toContain("Results published");
  });
  it("a session whose results are out is said to be sat, newest session first, and with nothing seated the next dates are the exam cell's", () => {
    const sat = { data: { ...college.data, forms: [...college.data.forms, { ...college.data.forms[0]!, id: "f0", sessionName: "Summer 2026 (even term 2025–26)", status: "APPROVED", opensAt: "2026-03-01T04:00:00.000Z", closesAt: "2026-03-20T18:00:00.000Z" }], seating: [] } };
    const text = examSummaryFromCollege(sat)!;
    expect(text.split("\n")[0]).toContain("Exam session Winter 2026");
    expect(text).toContain("Exam session Summer 2026 (even term 2025–26): already sat, results published on 30 June 2026; papers: Data Structures (CS201).");
    expect(text).toContain("No paper is scheduled ahead on the platform; the exam cell announces the next session's dates.");
    expect(text).not.toContain("Riya");
  });
  it("a school's family shape is not read as a college's", () => {
    expect(examSummaryFromCollege(family)).toBeNull();
  });
});

describe("the reader over the tools that ran", () => {
  it("joins the exams doors that answered, by name, and ignores the rest", () => {
    expect(examSummary([{ name: "myTimetable", ok: true, raw: family }, { name: "myExams", ok: false, raw: family }])).toBeNull();
    expect(examSummary([{ name: "myExams", ok: true, raw: family }])).toContain("Sitting ahead");
    expect(examSummary([{ name: "childExams", ok: true, raw: family }])).toContain("Sitting ahead");
    expect(examSummary([{ name: "myExams", ok: true }])).toBeNull();
  });
  it("a college pupil's question asks for both exams doors, a school's module answering the college door with nothing", () => {
    expect(toolsFor("STUDENT", "when is my next exam")).toEqual(["myExams", "collegeExams"]);
    expect(toolsFor("STUDENT", "माझी पुढची परीक्षा कधी आहे")).toEqual(["myExams", "collegeExams"]);
    expect(asksAboutExams("Which papers do I have in the exams?")).toBe(true);
    expect(asksAboutExams("explain photosynthesis")).toBe(false);
  });
  it("the tutor's prompt carries the lines and the data rule, or the no-data rule without them", () => {
    const base = { question: "should I study photosynthesis for my coming exam", language: "en" as const, band: "6-8" as never, shape: "OTHER" as never, passages: [], hint: false, boardNote: null };
    const withData = tutorMessages({ ...base, exams: examSummaryFromFamily(family) });
    expect(withData[0]!.content).toContain(EXAM_DATA_RULE);
    expect(withData[1]!.content).toContain("<exams>\nSitting ahead: Half-yearly");
    const without = tutorMessages({ ...base, exams: null });
    expect(without[0]!.content).toContain(EXAM_SCOPE_RULE);
    expect(without[0]!.content).not.toContain(EXAM_DATA_RULE);
    expect(without[1]!.content).not.toContain("<exams>");
  });
});
