/**
 * TA-012 (testing analysis of 13 November 2026): a marks sheet held in the outbox is replayed
 * after a newer save of the same sheet and clears the marks entered since.
 *
 * The teacher types half a sheet and presses Save while the request fails (no signal, or a 5xx):
 * the whole sheet, the untyped pupils as null, goes to the outbox. Without leaving the screen the
 * teacher types the rest and presses Save again. This POST succeeds, and only then is the outbox
 * flushed (writeOrQueue, src/screens/teacher/support.tsx), so the older sheet reaches
 * POST /api/v1/marks after the newer one. The door stores a batch as the sheet's state — a number
 * is written, a null deletes the grade (apps/web/src/lib/exams.ts, saveMarks) — so the marks
 * typed between the two saves are deleted while the screen says they are saved.
 *
 * The server below is a model of that rule and nothing else: it applies the sheets in the order
 * they arrive and notes every mark a later arrival cleared. The case passes for any fix on the
 * phone that keeps the newer save standing (the queued row dropped when a newer body for its tag
 * is sent, the outbox flushed before the live POST, or only the changed entries sent); a fix made
 * on the server alone (a version on the sheet that the door checks) needs the server's own test.
 */
import { act, screen } from "@testing-library/react-native";
import { marksBatchSchema, marksGridSchema, staffExamsSchema, type MarksBatch } from "@edulink/contracts";
import { MarksGrid } from "@/screens/teacher/marks";
import { listQueued, onQueueEvent } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { fakeApi, ID, json, offline, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const TAG = `marks:${ID.class1}:${ID.slot1}`;
const NAMES: Record<string, string> = { [ID.pupil1]: "ZZ Asha", [ID.pupil2]: "ZZ Bhavesh" };
const EXAMS = staffExamsSchema.parse({
  classes: [
    {
      id: ID.class1,
      name: "ZZ 5A",
      gradeLevel: "5",
      series: [{ id: ID.series1, name: "Term 1", kind: "UNIT_TEST", publishedAt: null, slots: [{ id: ID.slot1, subject: "Maths", dateKey: "2026-09-04", startMinute: 540, endMinute: 600, maxMarks: 50 }] }],
    },
  ],
});

const words = (body: MarksBatch) => body.entries.map((e) => `${NAMES[e.membershipId]} ${e.marks ?? "blank"}`).join(", ");

/**
 * The paper as the server holds it. A sheet that reaches POST /api/v1/marks is applied as
 * saveMarks applies it; the first request is failed the way the case says, the rest are taken.
 */
function paperOnTheServer(firstSave: "no signal" | "a 503") {
  const grades = new Map<string, number>();
  const taken: string[] = [];
  const clearedByALaterArrival: string[] = [];
  let failing = true;
  fakeApi({
    "/api/v1/staff/exams": () => json(EXAMS),
    "/api/v1/staff/exams/grid": () =>
      json(
        marksGridSchema.parse({
          classId: ID.class1,
          slotId: ID.slot1,
          grid: { seriesName: "Term 1", subject: "Maths", maxMarks: 50, assignmentId: null, pupils: [ID.pupil1, ID.pupil2].map((id) => ({ membershipId: id, name: NAMES[id], marks: grades.get(id) ?? null })) },
          examUnweighted: false,
        }),
      ),
    "/api/v1/marks": (_url, init) => {
      if (failing) {
        failing = false;
        return firstSave === "no signal" ? offline() : refusal("ZZ the server is unwell", 503);
      }
      const body = marksBatchSchema.parse(JSON.parse(String(init?.body)));
      let saved = 0;
      let cleared = 0;
      for (const entry of body.entries) {
        if (entry.marks === null) {
          const held = grades.get(entry.membershipId);
          if (held === undefined) continue;
          grades.delete(entry.membershipId);
          cleared++;
          clearedByALaterArrival.push(`${NAMES[entry.membershipId]} ${held}, by the sheet "${words(body)}"`);
        } else {
          grades.set(entry.membershipId, entry.marks);
          saved++;
        }
      }
      taken.push(words(body));
      return json({ saved, cleared });
    },
  });
  return { grades, taken, clearedByALaterArrival };
}

/** Resolves when a flush has run to its end, or after a moment when none was started. */
function nextFlush(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      stop();
      resolve();
    };
    const timer = setTimeout(done, 1000);
    const stop = onQueueEvent((event) => {
      if (event.type === "flushed") done();
    });
  });
}

beforeEach(() => {
  resetOutbox();
  mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
});

describe("TA-012: a marks sheet waiting in the outbox and a newer save of the same sheet", () => {
  it.each([
    ["found no signal", "no signal"],
    ["was answered 503", "a 503"],
  ] as const)("the first save %s; the marks typed before the second save are still on the server's sheet after it", async (_how, firstSave) => {
    const paper = paperOnTheServer(firstSave);
    await renderTeacher(<MarksGrid />);

    // Half the sheet, and a Save that fails: the whole sheet waits, the untyped pupil as a blank.
    await typeInto(await screen.findByLabelText("ZZ Asha"), "41");
    await tap(screen.getByRole("button", { name: "Save marks" }));
    await screen.findByText(/You are offline/);
    expect((await listQueued(TAG)).map((row) => words(JSON.parse(row.body) as MarksBatch))).toEqual(["ZZ Asha 41, ZZ Bhavesh blank"]);
    expect(paper.taken).toEqual([]);

    // The rest of the sheet, and a Save that goes through.
    await typeInto(screen.getByLabelText("ZZ Bhavesh"), "37");
    const flushed = nextFlush();
    await act(async () => {
      await tap(screen.getByRole("button", { name: "Save marks" }));
      await flushed;
      // And the next time the app comes back to the foreground.
      await flushOutbox();
    });
    await screen.findByText("Marks saved.");

    // The screen still shows both marks, whatever the server holds: the typed entries are drawn over its values.
    expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue("41");
    expect(screen.getByLabelText("ZZ Bhavesh")).toHaveDisplayValue("37");
    expect({
      theServerIsLeftWith: { "ZZ Asha": paper.grades.get(ID.pupil1) ?? null, "ZZ Bhavesh": paper.grades.get(ID.pupil2) ?? null },
      marksClearedByASheetThatArrivedLater: paper.clearedByALaterArrival,
    }).toEqual({ theServerIsLeftWith: { "ZZ Asha": 41, "ZZ Bhavesh": 37 }, marksClearedByASheetThatArrivedLater: [] });
  });
});
