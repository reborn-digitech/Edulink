import { screen, waitFor } from "@testing-library/react-native";
import { marksBatchSchema, marksGridSchema, staffExamsSchema } from "@edulink/contracts";
import { MarksGrid } from "@/screens/teacher/marks";
import { listQueued } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { callsTo, fakeApi, ID, json, offline, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const EXAMS = staffExamsSchema.parse({
  classes: [
    {
      id: ID.class1,
      name: "ZZ 5A",
      gradeLevel: "5",
      series: [{ id: ID.series1, name: "Term 1", kind: "UNIT_TEST", publishedAt: null, slots: [{ id: ID.slot1, subject: "Maths", dateKey: "2026-09-04", startMinute: 540, endMinute: 600, maxMarks: 50 }] }],
    },
    { id: ID.class2, name: "ZZ 5B", gradeLevel: null, series: [] },
  ],
});
const GRID = marksGridSchema.parse({
  classId: ID.class1,
  slotId: ID.slot1,
  grid: {
    seriesName: "Term 1",
    subject: "Maths",
    maxMarks: 50,
    assignmentId: null,
    pupils: [
      { membershipId: ID.pupil1, name: "ZZ Asha", marks: 41 },
      { membershipId: ID.pupil2, name: "ZZ Bhavesh", marks: null },
    ],
  },
  examUnweighted: false,
});

beforeEach(() => {
  resetOutbox();
  mockRouter.params = {};
});

describe("the marks grid", () => {
  it("lists the classes, then the papers of the one chosen, then the grid for the paper", async () => {
    const fetch = fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json(GRID) });
    await renderTeacher(<MarksGrid />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await tap(await screen.findByRole("button", { name: /ZZ 5A/ }));
    await tap(screen.getByRole("radio", { name: /Maths · Term 1 \(Unit test\)/ }));
    await screen.findByText("Maths · Term 1");
    const grid = callsTo(fetch, "/api/v1/staff/exams/grid")[0]!;
    expect(grid.url.searchParams.get("classId")).toBe(ID.class1);
    expect(grid.url.searchParams.get("slotId")).toBe(ID.slot1);
    expect(screen.getByText(/This paper is out of 50/)).toBeTruthy();
    expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue("41");
    expect(screen.getByLabelText("ZZ Bhavesh")).toHaveDisplayValue("");
  });

  it("a class with no papers, and a roll with nobody on it, say so", async () => {
    fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json({ ...GRID, grid: { ...GRID.grid, pupils: [] } }) });
    await renderTeacher(<MarksGrid />);
    await tap(await screen.findByRole("button", { name: /ZZ 5B/ }));
    expect(screen.getByText("No papers for this class yet")).toBeTruthy();
    mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
    await renderTeacher(<MarksGrid />);
    await screen.findByText("Nobody is enrolled in this class yet.");
  });

  it("saves the whole sheet as one batch the contract accepts, blank meaning cleared", async () => {
    mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
    const fetch = fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json(GRID), "/api/v1/marks": () => json({ saved: 1, cleared: 1 }) });
    await renderTeacher(<MarksGrid />);
    await typeInto(await screen.findByLabelText("ZZ Bhavesh"), "37.5");
    await typeInto(screen.getByLabelText("ZZ Asha"), "");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    await screen.findByText("Marks saved.");
    const [call] = callsTo(fetch, "/api/v1/marks");
    expect(call!.method).toBe("POST");
    expect(marksBatchSchema.parse(call!.body)).toEqual({
      slotId: ID.slot1,
      classId: ID.class1,
      entries: [
        { membershipId: ID.pupil1, marks: null },
        { membershipId: ID.pupil2, marks: 37.5 },
      ],
    });
  });

  it("refuses a mark over the maximum or not a number before asking the server", async () => {
    mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
    const fetch = fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json(GRID) });
    await renderTeacher(<MarksGrid />);
    await typeInto(await screen.findByLabelText("ZZ Bhavesh"), "51");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    expect(screen.getByRole("alert")).toHaveTextContent("This paper is out of 50. Halves are fine.");
    await typeInto(screen.getByLabelText("ZZ Bhavesh"), "forty");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Some of this needs another look.");
    expect(callsTo(fetch, "/api/v1/marks")).toHaveLength(0);
  });

  it("offline, the sheet waits in the outbox and replays with the replay header", async () => {
    mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
    const fetch = fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json(GRID), "/api/v1/marks": offline });
    await renderTeacher(<MarksGrid />);
    await typeInto(await screen.findByLabelText("ZZ Bhavesh"), "30");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    await screen.findByText(/You are offline/);
    await waitFor(() => expect(screen.getAllByText("1 waiting to send").length).toBeGreaterThan(0));
    const queued = await listQueued(`marks:${ID.class1}:${ID.slot1}`);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.url).toBe("/api/v1/marks");
    fetch.mockImplementation(async () => json({ saved: 2, cleared: 0 }));
    expect(await flushOutbox()).toMatchObject({ sent: 1, remaining: 0 });
    const replay = callsTo(fetch, "/api/v1/marks").at(-1)!;
    expect(replay.headers["X-Edulink-Replay"]).toBe("1");
    expect(marksBatchSchema.parse(replay.body).entries[1]).toEqual({ membershipId: ID.pupil2, marks: 30 });
  });

  it("a refusal from the server is shown with a retry", async () => {
    mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
    fakeApi({ "/api/v1/staff/exams": () => json(EXAMS), "/api/v1/staff/exams/grid": () => json(GRID), "/api/v1/marks": () => refusal("ZZ not your paper", 403) });
    await renderTeacher(<MarksGrid />);
    await tap(await screen.findByRole("button", { name: "Save marks" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not your paper");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(await listQueued()).toHaveLength(0);
  });

  it("a refused exams list is an alert", async () => {
    fakeApi({ "/api/v1/staff/exams": () => refusal("ZZ down", 500) });
    await renderTeacher(<MarksGrid />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ down");
  });
});
