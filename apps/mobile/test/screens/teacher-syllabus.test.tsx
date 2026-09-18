import { screen, waitFor } from "@testing-library/react-native";
import { lessonPlanSaveSchema, staffSyllabusSchema, syllabusProgressSaveSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TeacherSyllabus } from "@/screens/teacher/syllabus";
import { todayKey } from "@/screens/teacher/support";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const UNIT1 = "czz0000000000000000su1";
const UNIT2 = "czz0000000000000000su2";
const UNIT3 = "czz0000000000000000su3";
const LESSON1 = "czz0000000000000000sl1";
const LESSON2 = "czz0000000000000000sl2";
const PATH = "/api/v1/staff/syllabus";
const LESSONS = "/api/v1/staff/lessons";

const SYLLABUS = staffSyllabusSchema.parse({
  classId: ID.class1,
  className: "ZZ 5A",
  gradeLevel: "5",
  subjects: ["Maths", "Science"],
  subject: "Maths",
  units: [
    { id: UNIT1, position: 1, title: "ZZ Fractions", periodsPlanned: 8, status: "DONE", doneOn: "2026-09-10", byName: "ZZ Teacher", lessons: 2 },
    { id: UNIT2, position: 2, title: "ZZ Decimals", periodsPlanned: null, status: "IN_PROGRESS", doneOn: null, byName: null, lessons: 1 },
    { id: UNIT3, position: 3, title: "ZZ Geometry", periodsPlanned: 6, status: "NOT_STARTED", doneOn: null, byName: null, lessons: 0 },
  ],
  percent: 33,
  lessons: [
    { id: LESSON1, subject: "Maths", unitId: UNIT2, unitTitle: "ZZ Decimals", dateKey: "2026-09-18", topic: "ZZ Place value", notes: "ZZ Tenths and hundredths", homework: "ZZ Page 12", status: "PLANNED", teacherName: "ZZ Teacher", updatedAt: "2026-09-17T10:00:00.000Z" },
    { id: LESSON2, subject: "Maths", unitId: null, unitTitle: null, dateKey: "2026-09-15", topic: "ZZ Revision", notes: "", homework: "", status: "TAUGHT", teacherName: "ZZ Teacher", updatedAt: "2026-09-15T10:00:00.000Z" },
  ],
  canEdit: true,
});

const page = () => (
  <ToastProvider>
    <TeacherSyllabus />
  </ToastProvider>
);

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
  mockRouter.params = { classId: ID.class1 };
});

describe("a class's syllabus", () => {
  it("loads the subject's chapters with where the class is, and the lessons under them", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS) });
    await renderTeacher(page());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ 5A · Maths");
    const [call] = callsTo(fetch, PATH);
    expect(call!.url.searchParams.get("classId")).toBe(ID.class1);
    expect(call!.url.searchParams.get("subject")).toBeNull();
    expect(screen.getByRole("tab", { name: "Maths" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Science" })).toBeTruthy();
    expect(screen.getByLabelText("Where we are: 33%")).toBeTruthy();
    expect(screen.getByLabelText("Chapters: 1/3")).toBeTruthy();
    expect(screen.getByLabelText("Lessons: 2")).toBeTruthy();
    expect(screen.getByText("1. ZZ Fractions")).toBeTruthy();
    expect(screen.getByText("Periods 8 · Done Sep 10 by ZZ Teacher · Lessons 2")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Mark done: ZZ Fractions" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "In progress: ZZ Decimals" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Not started: ZZ Geometry" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Mark done: ZZ Geometry" })).not.toBeChecked();
    expect(screen.getByText(/ZZ Place value$/)).toBeTruthy();
    expect(screen.getByText("Chapter: ZZ Decimals · ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("Chapter: Not a chapter · ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("Homework set: ZZ Page 12")).toBeTruthy();
    expect(screen.getByText("Planned")).toBeTruthy();
    // "Taught" is the second lesson's pill and the first lesson's button.
    expect(screen.getAllByText("Taught")).toHaveLength(2);
  });

  it("the subject tabs ask the API for another subject; a subject named in the URL is asked for from the start", async () => {
    mockRouter.params = { classId: ID.class1, subject: "Science" };
    const fetch = fakeApi({ [PATH]: (url) => json({ ...SYLLABUS, subject: url.searchParams.get("subject") ?? "Maths" }) });
    await renderTeacher(page());
    await screen.findByText("ZZ 5A · Science");
    expect(callsTo(fetch, PATH)[0]!.url.searchParams.get("subject")).toBe("Science");
    await tap(screen.getByRole("tab", { name: "Maths" }));
    await screen.findByText("ZZ 5A · Maths");
    expect(callsTo(fetch, PATH).at(-1)!.url.searchParams.get("subject")).toBe("Maths");
  });

  it("a status chip posts the exact body and the screen rereads", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS), [`${PATH}/progress`]: () => json({ ok: true }) });
    await renderTeacher(page());
    await tap(await screen.findByRole("radio", { name: "Mark done: ZZ Geometry" }));
    expect(await screen.findByText("Progress saved.")).toBeTruthy();
    const [call] = callsTo(fetch, `${PATH}/progress`);
    expect(call!.method).toBe("POST");
    expect(syllabusProgressSaveSchema.parse(call!.body)).toEqual({ classId: ID.class1, unitId: UNIT3, status: "DONE" });
    await waitFor(() => expect(callsTo(fetch, PATH)).toHaveLength(2));
    // The chip already on posts nothing.
    await tap(screen.getByRole("radio", { name: "Mark done: ZZ Fractions" }));
    expect(callsTo(fetch, `${PATH}/progress`)).toHaveLength(1);
  });

  it("a lesson's buttons post its next status", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS), [`${LESSONS}/${LESSON1}/status`]: () => json({ ok: true }) });
    await renderTeacher(page());
    await screen.findByText("ZZ 5A · Maths");
    // A planned lesson can go to taught or skipped, not back to planned.
    expect(screen.queryByRole("button", { name: "Back to planned: ZZ Place value" })).toBeNull();
    expect(screen.getByRole("button", { name: "Back to planned: ZZ Revision" })).toBeTruthy();
    await tap(screen.getByRole("button", { name: "Taught: ZZ Place value" }));
    expect(await screen.findByText("Lesson saved.")).toBeTruthy();
    const [call] = callsTo(fetch, `${LESSONS}/${LESSON1}/status`);
    expect(call!.method).toBe("POST");
    expect(call!.body).toEqual({ status: "TAUGHT" });
    await waitFor(() => expect(callsTo(fetch, PATH)).toHaveLength(2));
  });

  it("planning a lesson posts today, the chapter, the topic, notes and homework, then closes and rereads", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS), [LESSONS]: () => json({ id: "czz0000000000000000sl3" }, 201) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Plan a lesson" }));
    expect(screen.getByLabelText("Day")).toHaveProp("value", todayKey());
    expect(screen.getByRole("radio", { name: "Not a chapter" })).toBeChecked();
    // Nothing goes without a topic.
    await tap(screen.getByRole("button", { name: "Plan a lesson" }));
    expect(screen.getByText("This is required.")).toBeTruthy();
    expect(callsTo(fetch, LESSONS)).toHaveLength(0);
    await tap(screen.getByRole("radio", { name: "3. ZZ Geometry" }));
    await typeInto(screen.getByLabelText("Topic"), "ZZ Angles");
    await typeInto(screen.getByLabelText("Notes"), "ZZ Protractors out");
    await typeInto(screen.getByLabelText("Homework set"), "ZZ Exercise 4");
    await tap(screen.getByRole("radio", { name: "Taught" }));
    await tap(screen.getByRole("button", { name: "Log a lesson taught" }));
    expect(await screen.findByText("Lesson saved.")).toBeTruthy();
    const [call] = callsTo(fetch, LESSONS);
    expect(call!.method).toBe("POST");
    expect(lessonPlanSaveSchema.parse(call!.body)).toEqual({ classId: ID.class1, subject: "Maths", unitId: UNIT3, dateKey: todayKey(), topic: "ZZ Angles", notes: "ZZ Protractors out", homework: "ZZ Exercise 4", status: "TAUGHT" });
    await waitFor(() => expect(screen.queryByLabelText("Topic")).toBeNull());
    await waitFor(() => expect(callsTo(fetch, PATH)).toHaveLength(2));
  });

  it("a day that is not a date is refused on the phone", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Plan a lesson" }));
    await typeInto(screen.getByLabelText("Day"), "18/9/2026");
    await typeInto(screen.getByLabelText("Topic"), "ZZ Angles");
    await tap(screen.getByRole("button", { name: "Plan a lesson" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(callsTo(fetch, LESSONS)).toHaveLength(0);
  });

  it("no chapters and no lessons each say so, and both doors open the planner", async () => {
    fakeApi({ [PATH]: () => json({ ...SYLLABUS, units: [], percent: null, lessons: [] }) });
    await renderTeacher(page());
    expect(await screen.findByText("No syllabus for this subject yet")).toBeTruthy();
    expect(screen.getByText("No lessons planned yet.")).toBeTruthy();
    expect(screen.getByLabelText("Where we are: —")).toBeTruthy();
    const doors = screen.getAllByRole("button", { name: "Plan a lesson" });
    expect(doors.length).toBeGreaterThanOrEqual(2);
    await tap(doors[0]!);
    expect(screen.getByLabelText("Topic")).toBeTruthy();
  });

  it("a class with no subjects says so and points at the timetable", async () => {
    fakeApi({ [PATH]: () => json({ ...SYLLABUS, subjects: [], subject: null, units: [], percent: null, lessons: [] }) });
    await renderTeacher(page());
    expect(await screen.findByText("This class has no subjects on its timetable yet.")).toBeTruthy();
    await tap(screen.getByRole("button", { name: "Timetable" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/timetable");
  });

  it("a reader who cannot edit sees the status as a label and no buttons", async () => {
    fakeApi({ [PATH]: () => json({ ...SYLLABUS, canEdit: false }) });
    await renderTeacher(page());
    await screen.findByText("ZZ 5A · Maths");
    expect(screen.queryByRole("radio", { name: "Mark done: ZZ Fractions" })).toBeNull();
    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Plan a lesson" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Taught: ZZ Place value" })).toBeNull();
  });

  it("a refused write is a toast", async () => {
    fakeApi({ [PATH]: () => json(SYLLABUS), [`${PATH}/progress`]: () => refusal("ZZ not your class", 403) });
    await renderTeacher(page());
    await tap(await screen.findByRole("radio", { name: "Mark done: ZZ Geometry" }));
    expect(await screen.findByText("ZZ not your class")).toBeTruthy();
  });

  it("without a class id it says so", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderTeacher(page());
    expect(screen.getByRole("alert")).toHaveTextContent("That class could not be found");
  });

  it("a refusal is an alert with a retry", async () => {
    fakeApi({ [PATH]: () => refusal("ZZ not yours", 403) });
    await renderTeacher(page());
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not yours");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
