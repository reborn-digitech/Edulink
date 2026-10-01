import { screen, waitFor } from "@testing-library/react-native";
import { planTemplateApplySchema, staffSyllabusSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TeacherSyllabus, TEMPLATES_PATH } from "@/screens/teacher/syllabus";
import { todayKey } from "@/screens/teacher/support";
import { callsTo, fakeApi, ID, json, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const UNIT1 = "czz0000000000000000su1";
const LESSON1 = "czz0000000000000000sl1";
const TPL1 = "czz0000000000000000tp1";
const TPL2 = "czz0000000000000000tp2";
const PATH = "/api/v1/staff/syllabus";

const SYLLABUS = staffSyllabusSchema.parse({
  classId: ID.class1,
  className: "ZZ 5A",
  gradeLevel: "5",
  subjects: ["Maths"],
  subject: "Maths",
  units: [{ id: UNIT1, position: 1, title: "ZZ Fractions", periodsPlanned: 8, status: "IN_PROGRESS", doneOn: null, byName: null, lessons: 1 }],
  percent: 0,
  lessons: [{ id: LESSON1, subject: "Maths", unitId: UNIT1, unitTitle: "ZZ Fractions", dateKey: "2026-09-18", topic: "ZZ Halves", notes: "Fold paper.", homework: "", status: "PLANNED", teacherName: "ZZ Teacher", updatedAt: "2026-09-17T10:00:00.000Z" }],
  canEdit: true,
});
const TEMPLATES = {
  items: [
    { id: TPL1, subject: "Maths", grade: "5", title: "ZZ Quarters", topic: "ZZ Quarters", notes: "Cut a chapati.", homework: "Page 4.", authorName: "ZZ Teacher", own: true, createdAt: "2026-09-10T10:00:00.000Z" },
    { id: TPL2, subject: "Maths", grade: "5", title: "ZZ Thirds", topic: "ZZ Thirds", notes: "", homework: "", authorName: "ZZ Bhavna", own: false, createdAt: "2026-09-09T10:00:00.000Z" },
  ],
};

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

describe("lesson plan templates on the phone", () => {
  it("keeping a lesson as a template posts its id", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS), [TEMPLATES_PATH]: () => json({ id: TPL1 }, 201) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Keep as template: ZZ Halves" }));
    expect(await screen.findByText("Kept as a template for the whole staff.")).toBeTruthy();
    const [call] = callsTo(fetch, TEMPLATES_PATH);
    expect(call!.method).toBe("POST");
    expect(call!.body).toEqual({ lessonId: LESSON1 });
  });

  it("copying one in lists the subject's templates (mine first), previews the chosen one, posts the class, chapter and day, and rereads the syllabus", async () => {
    const fetch = fakeApi({
      [PATH]: () => json(SYLLABUS),
      [TEMPLATES_PATH]: () => json(TEMPLATES),
      [`${TEMPLATES_PATH}/${TPL2}/apply`]: () => json({ lessonId: "czz0000000000000000sl9" }, 201),
    });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Copy it in" }));
    expect(await screen.findByRole("radio", { name: "ZZ Quarters (mine)" })).toBeChecked();
    expect(callsTo(fetch, TEMPLATES_PATH)[0]!.url.searchParams.get("subject")).toBe("Maths");
    expect(screen.getByText("Cut a chapati.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove this template" })).toBeTruthy();
    await tap(screen.getByRole("radio", { name: "ZZ Thirds — ZZ Bhavna" }));
    expect(screen.queryByRole("button", { name: "Remove this template" })).toBeNull();
    await tap(screen.getByRole("radio", { name: "1. ZZ Fractions" }));
    await typeInto(screen.getByLabelText("Day"), "13/10/2026");
    await tap(screen.getAllByRole("button", { name: "Copy it in" }).at(-1)!);
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(callsTo(fetch, `${TEMPLATES_PATH}/${TPL2}/apply`)).toHaveLength(0);
    await typeInto(screen.getByLabelText("Day"), todayKey());
    await tap(screen.getAllByRole("button", { name: "Copy it in" }).at(-1)!);
    expect(await screen.findByText("The lesson is planned from the template.")).toBeTruthy();
    const [call] = callsTo(fetch, `${TEMPLATES_PATH}/${TPL2}/apply`);
    expect(planTemplateApplySchema.parse(call!.body)).toEqual({ classId: ID.class1, unitId: UNIT1, dateKey: todayKey() });
    await waitFor(() => expect(callsTo(fetch, PATH)).toHaveLength(2));
  });

  it("removing my own template sends DELETE and the list is read again; no templates is an empty state", async () => {
    const fetch = fakeApi({ [PATH]: () => json(SYLLABUS), [TEMPLATES_PATH]: () => json(TEMPLATES), [`${TEMPLATES_PATH}/${TPL1}`]: () => json({ changed: true }) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Copy it in" }));
    await tap(await screen.findByRole("button", { name: "Remove this template" }));
    expect(await screen.findByText("The template was removed; lessons copied from it stay.")).toBeTruthy();
    expect(callsTo(fetch, `${TEMPLATES_PATH}/${TPL1}`)[0]!.method).toBe("DELETE");
    await waitFor(() => expect(callsTo(fetch, TEMPLATES_PATH)).toHaveLength(2));
    const empty = fakeApi({ [PATH]: () => json(SYLLABUS), [TEMPLATES_PATH]: () => json({ items: [] }) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Copy it in" }));
    expect(await screen.findByText("No templates for this subject yet. Keep a lesson plan as one and it shows here for every teacher.")).toBeTruthy();
    expect(callsTo(empty, TEMPLATES_PATH)).toHaveLength(1);
  });
});
