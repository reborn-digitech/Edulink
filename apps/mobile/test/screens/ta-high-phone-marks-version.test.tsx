/**
 * TA-010 and TA-012, the phone's half of the server's stamp: the marks grid sends the version it
 * was typed on (`basedOn`), takes the next one from the save's answer, and says so when the
 * server kept marks someone wrote after the sheet was read, showing those instead of the typed ones.
 */
import { screen } from "@testing-library/react-native";
import { marksBatchSchema, marksGridSchema, staffExamsSchema } from "@edulink/contracts";
import { MarksGrid } from "@/screens/teacher/marks";
import { callsTo, fakeApi, ID, json, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const READ_AT = "2026-11-13T09:00:00.000Z";
const SAVED_AT = "2026-11-13T09:05:00.000Z";
const EXAMS = staffExamsSchema.parse({
  classes: [{ id: ID.class1, name: "ZZ 5A", gradeLevel: "5", series: [{ id: ID.series1, name: "Term 1", kind: "UNIT_TEST", publishedAt: null, slots: [{ id: ID.slot1, subject: "Maths", dateKey: "2026-09-04", startMinute: 540, endMinute: 600, maxMarks: 50 }] }] }],
});

beforeEach(() => {
  resetOutbox();
  mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
});

describe("TA-010 / TA-012: the marks grid and the sheet's version", () => {
  it("TA-010: sends the grid's version, then the save's, and shows the marks the server kept", async () => {
    // The server's sheet: ZZ Bhavesh's 30 was written by a colleague after the grid was first read.
    let bhavesh: number | null = null;
    const fetch = fakeApi({
      "/api/v1/staff/exams": () => json(EXAMS),
      "/api/v1/staff/exams/grid": () =>
        json(
          marksGridSchema.parse({
            classId: ID.class1,
            slotId: ID.slot1,
            grid: { seriesName: "Term 1", subject: "Maths", maxMarks: 50, assignmentId: null, pupils: [ { membershipId: ID.pupil1, name: "ZZ Asha", marks: null }, { membershipId: ID.pupil2, name: "ZZ Bhavesh", marks: bhavesh } ] },
            examUnweighted: false,
            version: READ_AT,
          }),
        ),
      "/api/v1/marks": () => {
        bhavesh = 30;
        return json({ saved: 1, cleared: 0, skipped: 1, version: SAVED_AT });
      },
    });
    await renderTeacher(<MarksGrid />);
    await typeInto(await screen.findByLabelText("ZZ Asha"), "41");
    await typeInto(screen.getByLabelText("ZZ Bhavesh"), "12");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    await screen.findByText(/Marks saved, except 1 that someone changed after this sheet was opened/);
    const first = marksBatchSchema.parse(callsTo(fetch, "/api/v1/marks")[0]!.body);
    expect(first.basedOn).toBe(READ_AT);
    // The typed 12 goes: the box shows the colleague's 30 the server kept.
    expect(await screen.findByDisplayValue("30")).toBeTruthy();

    // The next save is based on what the last one answered, later than the grid's own read.
    await typeInto(screen.getByLabelText("ZZ Asha"), "40");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    const calls = callsTo(fetch, "/api/v1/marks");
    expect(calls).toHaveLength(2);
    expect(marksBatchSchema.parse(calls[1]!.body)).toMatchObject({ basedOn: SAVED_AT, entries: [{ membershipId: ID.pupil1, marks: 40 }, { membershipId: ID.pupil2, marks: 30 }] });
  });

  it("TA-010: a grid with no version (an older server) sends no basedOn", async () => {
    const fetch = fakeApi({
      "/api/v1/staff/exams": () => json(EXAMS),
      "/api/v1/staff/exams/grid": () =>
        json(marksGridSchema.parse({ classId: ID.class1, slotId: ID.slot1, grid: { seriesName: "Term 1", subject: "Maths", maxMarks: 50, assignmentId: null, pupils: [{ membershipId: ID.pupil1, name: "ZZ Asha", marks: null }] }, examUnweighted: false })),
      "/api/v1/marks": () => json({ saved: 1, cleared: 0 }),
    });
    await renderTeacher(<MarksGrid />);
    await typeInto(await screen.findByLabelText("ZZ Asha"), "41");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    await screen.findByText("Marks saved.");
    expect("basedOn" in (callsTo(fetch, "/api/v1/marks")[0]!.body as object)).toBe(false);
  });
});
