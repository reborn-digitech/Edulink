/**
 * CI's triage of 15 November 2026, R2: the phone e2e's offline.spec.ts failed at :94 and :134 in every run since
 * 2a0327c9 (runs 43498146242 to 43592779839), from 45fd5d3f (TA-010). The traces of run 43498146242 show the path: the
 * grid is read (its version 21:05:57.769), a 5 is saved with the network cut and queued with that basedOn, the outbox
 * replays it on reconnect and the server answers 200 with skipped 0 and a new version (21:05:58.635), no grid read
 * comes between, and the clean-up's blank save still names 21:05:57.769, older than the replayed grade, so the server
 * keeps the teacher's own 5 as somebody else's (skipped 1) and the screen says "Marks saved, except 1 that someone
 * changed" with the 5 back in the box.
 *
 * The second reading of the fix found the windows the cases below close too: a version held while the boxes no longer
 * show what the save or the replay left (B1, and D3 before it), boxes typed after the queued save let go (B2), and a
 * replay the teacher's own live save superseded said as somebody else's change (B3).
 *
 * The server below is saveMarks' rule and nothing else (apps/web/src/lib/exams.ts): every read and write takes the next
 * tick of its clock, a grade written after the sheet's basedOn is left alone and counted as skipped, and the answer's
 * version is taken after the writes. A grid read or a replay can be held until the case lets it go, as the traces show
 * no read before the next save.
 */
import { act, screen, waitFor } from "@testing-library/react-native";
import { marksBatchSchema, marksGridSchema, staffExamsSchema } from "@edulink/contracts";
import { MarksGrid } from "@/screens/teacher/marks";
import { enqueue, flushQueue } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { fakeApi, ID, json, offline, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL3 = "czz00000000000000000p3";
const SLOT2 = "czz00000000000000000s2";
const TAG = `marks:${ID.class1}:${ID.slot1}`;
const PUPILS = [ID.pupil1, ID.pupil2, PUPIL3];
const NAMES: Record<string, string> = { [ID.pupil1]: "ZZ Asha", [ID.pupil2]: "ZZ Bhavesh", [PUPIL3]: "ZZ Chitra" };
const EXAMS = staffExamsSchema.parse({
  classes: [
    {
      id: ID.class1,
      name: "ZZ 5A",
      gradeLevel: "5",
      series: [
        {
          id: ID.series1,
          name: "Term 1",
          kind: "UNIT_TEST",
          publishedAt: null,
          slots: [
            { id: ID.slot1, subject: "Maths", dateKey: "2026-09-04", startMinute: 540, endMinute: 600, maxMarks: 50 },
            { id: SLOT2, subject: "Science", dateKey: "2026-09-05", startMinute: 540, endMinute: 600, maxMarks: 50 },
          ],
        },
      ],
    },
  ],
});

type Answered = { replay: boolean; slotId: string; basedOn: string | null; saved: number; cleared: number; skipped: number; version: string };

/** The class's two papers as the server holds them, with its own clock. */
function paperWithAClock() {
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 10, 13, 9, 0, 0) + ++tick * 1000).toISOString();
  const papers = new Map<string, Map<string, { marks: number; updatedAt: string }>>([
    [ID.slot1, new Map()],
    [SLOT2, new Map()],
  ]);
  const answered: Answered[] = [];
  const heldReads: (() => void)[] = [];
  const heldReplays: (() => void)[] = [];
  const state = { network: "up" as "up" | "cut", holdReads: false, holdReplays: false, replaysArrived: 0, readsAsked: 0, readsAnswered: 0 };
  fakeApi({
    "/api/v1/staff/exams": () => json(EXAMS),
    "/api/v1/staff/exams/grid": async (url) => {
      state.readsAsked++;
      if (state.holdReads) await new Promise<void>((release) => heldReads.push(release));
      const slotId = url.searchParams.get("slotId")!;
      const grades = papers.get(slotId)!;
      // Taken before the marks are read, as staffMarksGrid takes it.
      const version = now();
      state.readsAnswered++;
      return json(
        marksGridSchema.parse({
          classId: ID.class1,
          slotId,
          grid: { seriesName: "Term 1", subject: slotId === ID.slot1 ? "Maths" : "Science", maxMarks: 50, assignmentId: null, pupils: PUPILS.map((id) => ({ membershipId: id, name: NAMES[id], marks: grades.get(id)?.marks ?? null })) },
          examUnweighted: false,
          version,
        }),
      );
    },
    "/api/v1/marks": async (_url, init) => {
      if (state.network === "cut") return offline();
      const replay = ((init?.headers ?? {}) as Record<string, string>)["X-Edulink-Replay"] === "1";
      if (replay && state.holdReplays) {
        state.replaysArrived++;
        await new Promise<void>((release) => heldReplays.push(release));
      }
      const body = marksBatchSchema.parse(JSON.parse(String(init?.body)));
      const grades = papers.get(body.slotId)!;
      const basedOn = body.basedOn ? Date.parse(body.basedOn) : null;
      let saved = 0;
      let cleared = 0;
      let skipped = 0;
      for (const entry of body.entries) {
        const grade = grades.get(entry.membershipId);
        if (basedOn !== null && grade && Date.parse(grade.updatedAt) > basedOn) {
          skipped++;
          continue;
        }
        if (entry.marks === null) {
          if (grades.delete(entry.membershipId)) cleared++;
          continue;
        }
        grades.set(entry.membershipId, { marks: entry.marks, updatedAt: now() });
        saved++;
      }
      const version = now();
      answered.push({ replay, slotId: body.slotId, basedOn: body.basedOn ?? null, saved, cleared, skipped, version });
      return json({ saved, cleared, skipped, version });
    },
  });
  return {
    state,
    answered,
    marksOf: (id: string, slotId: string = ID.slot1) => papers.get(slotId)!.get(id)?.marks ?? null,
    /** A colleague's save from the web, written now. */
    colleagueWrites: (id: string, marks: number) => void papers.get(ID.slot1)!.set(id, { marks, updatedAt: now() }),
    releaseReads: () => {
      state.holdReads = false;
      for (const release of heldReads.splice(0)) release();
    },
    releaseReplays: () => {
      state.holdReplays = false;
      for (const release of heldReplays.splice(0)) release();
    },
  };
}

let paper: ReturnType<typeof paperWithAClock> | null = null;

beforeEach(() => {
  resetOutbox();
  mockRouter.params = { classId: ID.class1, slotId: ID.slot1 };
});

afterEach(async () => {
  // Nothing is left waiting on a held read or replay once a case is over, passed or failed.
  if (!paper) return;
  const open = paper;
  paper = null;
  open.releaseReads();
  open.releaseReplays();
  await waitFor(() => expect(open.state.readsAnswered).toBe(open.state.readsAsked));
});

const saveButton = () => screen.getByRole("button", { name: "Save marks" });

/** Saved with the network cut: the sheet waits in the outbox. */
async function saveCut(open: ReturnType<typeof paperWithAClock>, typed: Record<string, string>) {
  open.state.network = "cut";
  for (const [name, value] of Object.entries(typed)) await typeInto(await screen.findByLabelText(name), value);
  await tap(saveButton());
  await screen.findByText(/You are offline/);
}

/** The network is back and the outbox replays the sheet; the grid read that follows is held. */
async function replay(open: ReturnType<typeof paperWithAClock>) {
  open.state.network = "up";
  open.state.holdReads = true;
  await act(async () => {
    await flushOutbox();
  });
}

/** To the other paper and back to the first: pick() lets the typed boxes go, and the first paper's grid is drawn as cached. */
async function otherPaperAndBack() {
  await tap(screen.getAllByRole("radio")[1]!);
  await tap(screen.getAllByRole("radio")[0]!);
  await screen.findByText("Maths · Term 1");
}

describe("CI R2: a marks sheet the outbox replays, then the teacher's next save of the same paper", () => {
  it("the replay leaves the screen on the version the server answered, so the next save is taken whole", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");

    await saveCut(open, { "ZZ Asha": "5" });
    await replay(open);
    const [replayed] = open.answered;
    expect({ replay: replayed?.replay, saved: replayed?.saved, skipped: replayed?.skipped, asha: open.marksOf(ID.pupil1) }).toEqual({ replay: true, saved: 1, skipped: 0, asha: 5 });

    // The teacher clears the 5 again before the sheet has been read again.
    await typeInto(screen.getByLabelText("ZZ Asha"), "");
    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    const next = open.answered[1]!;
    expect({
      basedOnAtOrAfterTheReplaysAnswer: next.basedOn !== null && Date.parse(next.basedOn) >= Date.parse(replayed!.version),
      skipped: next.skipped,
      cleared: next.cleared,
      ashaOnTheServer: open.marksOf(ID.pupil1),
    }).toEqual({ basedOnAtOrAfterTheReplaysAnswer: true, skipped: 0, cleared: 1, ashaOnTheServer: null });
    expect(await screen.findByText("Marks saved.")).toBeTruthy();
    expect(screen.queryByText(/someone changed/)).toBeNull();
    expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue("");
  });

  it("a replay the server partly kept is said at once, and a save before the sheet is read again leaves the colleague's mark", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");

    // While the sheet waits, a colleague writes ZZ Bhavesh's 30 from the web: the replay keeps it and says so.
    await saveCut(open, { "ZZ Asha": "5", "ZZ Bhavesh": "12" });
    open.colleagueWrites(ID.pupil2, 30);
    await replay(open);
    expect(open.answered.map((a) => [a.replay, a.saved, a.skipped])).toEqual([[true, 1, 1]]);
    expect(await screen.findByText(/Marks saved, except 1 that someone changed after this sheet was opened/)).toBeTruthy();

    // A save before the sheet is read again does not put anything over the colleague's 30 or the replayed 5.
    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    expect({ asha: open.marksOf(ID.pupil1), bhavesh: open.marksOf(ID.pupil2) }).toEqual({ asha: 5, bhavesh: 30 });

    // Read again, the boxes show what the server holds.
    open.releaseReads();
    await waitFor(() => expect(screen.getByLabelText("ZZ Bhavesh")).toHaveDisplayValue("30"));
    expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue("5");
  });

  it("B1: a replay taken whole after the paper was picked again leaves the version to the next read, so a save before it keeps the replayed mark", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");
    await saveCut(open, { "ZZ Asha": "5" });

    // The teacher looks at the other paper and comes back: the boxes show the grid read before the replay.
    const readsBefore = open.state.readsAnswered;
    await otherPaperAndBack();
    await waitFor(() => expect(open.state.readsAnswered).toBeGreaterThan(readsBefore));
    await waitFor(() => expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue(""));

    await replay(open);
    expect(open.answered.map((a) => [a.replay, a.saved, a.skipped])).toEqual([[true, 1, 0]]);

    // Save before the sheet the replay set off has been read again: the box's blank is older than the replayed 5.
    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    expect({ cleared: open.answered[1]!.cleared, ashaOnTheServer: open.marksOf(ID.pupil1) }).toEqual({ cleared: 0, ashaOnTheServer: 5 });
  });

  it("B1: a live save, the paper picked again before the sheet is read again, then Save: the saved mark stands", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");

    await typeInto(screen.getByLabelText("ZZ Asha"), "5");
    open.state.holdReads = true;
    await tap(saveButton());
    await screen.findByText("Marks saved.");
    // Away and back before the read the save set off has landed: the boxes show the grid from before the save.
    await otherPaperAndBack();
    expect(screen.getByLabelText("ZZ Asha")).toHaveDisplayValue("");

    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    expect({ cleared: open.answered[1]!.cleared, ashaOnTheServer: open.marksOf(ID.pupil1) }).toEqual({ cleared: 0, ashaOnTheServer: 5 });
  });

  it("B2: a box typed after the queued save, not yet saved, stays when the replay comes back partly kept", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");
    await saveCut(open, { "ZZ Asha": "5", "ZZ Bhavesh": "12" });
    // After the queued save the teacher types Chitra's 9 and has not saved it yet; a colleague writes Bhavesh's 30.
    await typeInto(screen.getByLabelText("ZZ Chitra"), "9");
    open.colleagueWrites(ID.pupil2, 30);

    await replay(open);
    expect(open.answered.map((a) => [a.replay, a.saved, a.skipped])).toEqual([[true, 1, 1]]);
    await screen.findByText(/Marks saved, except 1 that someone changed/);
    expect(screen.getByLabelText("ZZ Chitra")).toHaveDisplayValue("9");
    open.releaseReads();
    await waitFor(() => expect(screen.getByLabelText("ZZ Bhavesh")).toHaveDisplayValue("30"));
    expect({ asha: screen.getByLabelText("ZZ Asha").props.value, chitra: screen.getByLabelText("ZZ Chitra").props.value, chitraOnTheServer: open.marksOf(PUPIL3) }).toEqual({ asha: "5", chitra: "9", chitraOnTheServer: null });
  });

  it("B3: a replay the teacher's own live save superseded while it was out is not said as somebody else's change", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");
    await saveCut(open, { "ZZ Asha": "5" });

    // The flush is already sending the sheet when the teacher changes Asha to 7 and saves the same paper live.
    open.state.network = "up";
    open.state.holdReplays = true;
    let flushed: Promise<unknown> = Promise.resolve();
    await act(async () => {
      flushed = flushOutbox();
    });
    await waitFor(() => expect(open.state.replaysArrived).toBe(1));
    await typeInto(screen.getByLabelText("ZZ Asha"), "7");
    await tap(saveButton());
    await screen.findByText("Marks saved.");
    // The replay lands after the live save: the server keeps the teacher's 7 against it.
    await act(async () => {
      open.releaseReplays();
      await flushed;
    });
    expect(open.answered.map((a) => [a.replay, a.saved, a.skipped])).toEqual([
      [false, 1, 0],
      [true, 0, 1],
    ]);
    await waitFor(() => expect(open.state.readsAnswered).toBe(open.state.readsAsked));
    expect({ note: screen.queryByText(/someone changed/) ? "someone changed" : screen.queryByText("Marks saved.") ? "Marks saved." : "other", asha: open.marksOf(ID.pupil1) }).toEqual({ note: "Marks saved.", asha: 7 });
  });

  it("D3: a live save that kept a colleague's mark, then Save again before the sheet is read again, leaves both marks", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");
    open.colleagueWrites(ID.pupil2, 30);
    await typeInto(screen.getByLabelText("ZZ Asha"), "5");
    await typeInto(screen.getByLabelText("ZZ Bhavesh"), "12");
    open.state.holdReads = true;
    await tap(saveButton());
    await screen.findByText(/Marks saved, except 1 that someone changed/);
    expect({ asha: open.marksOf(ID.pupil1), bhavesh: open.marksOf(ID.pupil2) }).toEqual({ asha: 5, bhavesh: 30 });

    // The boxes have fallen back to the grid read before the save; Save again before it is read again.
    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    expect({ cleared: open.answered[1]!.cleared, asha: open.marksOf(ID.pupil1), bhavesh: open.marksOf(ID.pupil2) }).toEqual({ cleared: 0, asha: 5, bhavesh: 30 });
  });

  it("an answer that comes after a newer one does not take the sheet back to its older version", async () => {
    const open = (paper = paperWithAClock());
    await renderTeacher(<MarksGrid />);
    await screen.findByLabelText("ZZ Asha");

    // A live save taken whole: the screen holds its version; the sheet is not read again before the end of the case.
    await typeInto(screen.getByLabelText("ZZ Asha"), "5");
    open.state.holdReads = true;
    await tap(saveButton());
    await screen.findByText("Marks saved.");
    const live = open.answered[0]!;

    // A replay of the same sheet, answered with a version older than the live save's (one the server answered while the
    // live save's answer was on its way), arrives after it.
    const older = new Date(Date.parse(live.version) - 1500).toISOString();
    const sheet = { slotId: ID.slot1, classId: ID.class1, entries: [{ membershipId: ID.pupil1, marks: 5 }, { membershipId: ID.pupil2, marks: null }, { membershipId: PUPIL3, marks: null }] };
    let replayed = { sent: 0 };
    await act(async () => {
      await enqueue({ url: "/api/v1/marks", method: "POST", body: JSON.stringify(sheet), tag: TAG });
      replayed = await flushQueue(async () => ({ status: 200, data: { saved: 0, cleared: 0, skipped: 0, version: older } }));
    });
    expect(replayed.sent).toBe(1);

    // The next save is still based on the live save's answer, so the 5 it wrote is not taken for somebody else's.
    await typeInto(screen.getByLabelText("ZZ Asha"), "6");
    await tap(saveButton());
    await waitFor(() => expect(open.answered).toHaveLength(2));
    expect({ basedOn: open.answered[1]!.basedOn, skipped: open.answered[1]!.skipped, asha: open.marksOf(ID.pupil1) }).toEqual({ basedOn: live.version, skipped: 0, asha: 6 });
  });
});
