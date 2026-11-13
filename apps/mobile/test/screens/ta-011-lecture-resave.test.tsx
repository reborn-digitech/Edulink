/**
 * TA-011 (testing analysis of 13 November 2026): a corrected lecture attendance saved again from
 * the phone's lecture screen is answered as marked and written nowhere.
 *
 * The screen mints one client id when it mounts (src/screens/academics/lecture.tsx) and sends it
 * with every save. The server writes a client id once: markLecture answers `replay: true` with
 * the old tallies, and writes nothing, when a row of the lecture already carries the id — and the
 * first save stamps it on every row (apps/web/src/lib/academics-attendance.ts; proved there by
 * apps/web/tests/academics.test.ts, "a second batch under the same id changes nothing"). So the
 * second save the screen itself offers ("Save changes") is thrown away, while the phone says the
 * lecture is marked and goes on drawing the corrected mark from its own state.
 *
 * The server below is a model of that one rule. A student is marked absent and saved; the student
 * walks in, is changed to late and saved again. The cases are red while the second body carries
 * the first one's id, and pass once a save of changed marks carries an id of its own.
 */
import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { lectureMarkResultSchema, lectureMarkSaveSchema, lectureSheetSchema, type LectureMark, type RoleCode } from "@edulink/contracts";
import { LectureScreen } from "@/screens/academics/lecture";
import { __setOutboxStore, listQueued, memoryOutbox, type QueuedRequest } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const LECTURE = id("zzlecture1");
const OFFERING = id("zzoffering1");
const ISHAAN = id("zzstudent1");
const OMKAR = id("zzstudent2");
const DOOR = `/api/v1/academics/lectures/${LECTURE}`;
const TAG = `lecture:${LECTURE}`;
const meAs = (role: RoleCode) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE" });
type Save = { clientId: string; entries: { studentMembershipId: string; status: LectureMark }[] };
const omkarIn = (body: Save) => body.entries.find((e) => e.studentMembershipId === OMKAR)!.status;

/**
 * The lecture as the server holds it. A save whose client id is already on a row of the lecture
 * is a replay: the old tallies, nothing written. Any other save writes every entry and stamps
 * its id on the rows it wrote. `signal` false drops the request, as a basement lab does.
 */
function lectureOnTheServer() {
  const rows = new Map<string, { status: LectureMark; clientId: string }>();
  const saves: Save[] = [];
  const answered: { replay: boolean }[] = [];
  const state = { signal: true };
  const tally = (status: LectureMark) => [...rows.values()].filter((row) => row.status === status).length;
  const answers = {
    [`GET ${DOOR}`]: () =>
      json(
        lectureSheetSchema.parse({
          lecture: { lectureId: LECTURE, offeringId: OFFERING, dateKey: "2026-10-05", startMinute: 540, endMinute: 590, kind: "LECTURE", courseCode: "PHY101", courseName: "ZZ Mechanics", divisionName: "ZZ FY A", roomName: "ZZ Room 101", registered: 2, marked: rows.size, substitute: false },
          threshold: 75,
          canMark: true,
          entries: [
            { studentMembershipId: ISHAAN, name: "ZZ Ishaan", rollNumber: 1, status: rows.get(ISHAAN)?.status ?? null, percent: 90 },
            { studentMembershipId: OMKAR, name: "ZZ Omkar", rollNumber: 2, status: rows.get(OMKAR)?.status ?? null, percent: 65 },
          ],
        }),
      ),
    [`POST ${DOOR}/attendance`]: ({ init }: { init: RequestInit }) => {
      if (!state.signal) throw new TypeError("Network request failed");
      const body = lectureMarkSaveSchema.parse(JSON.parse(String(init.body))) as Save;
      saves.push(body);
      const replay = [...rows.values()].some((row) => row.clientId === body.clientId);
      if (!replay) for (const entry of body.entries) rows.set(entry.studentMembershipId, { status: entry.status, clientId: body.clientId });
      answered.push({ replay });
      return json(lectureMarkResultSchema.parse({ lectureId: LECTURE, present: tally("PRESENT"), absent: tally("ABSENT"), late: tally("LATE"), replay, noticesSent: 0 }));
    },
  };
  return { rows, saves, answered, state, answers };
}

async function openTheLecture(server: ReturnType<typeof lectureOnTheServer>) {
  const { fetch } = await mountStaff(<LectureScreen lectureId={LECTURE} />, "FACULTY", server.answers, { me: meAs("FACULTY") });
  // What waits in the outbox is replayed to the same server.
  __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
  expect(await screen.findByText("Register: 2 students")).toBeTruthy();
  return userEvent.setup();
}

/** ZZ Omkar is marked absent and the lecture saved; he walks in, is changed to late, and the lecture is saved again. */
async function saveThenCorrectAndSaveAgain() {
  const server = lectureOnTheServer();
  const user = await openTheLecture(server);
  await user.press(screen.getAllByRole("radio", { name: "Absent" })[1]!);
  await user.press(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("The lecture is marked.")).toBeTruthy();
  // The first save is on the server, and was no replay.
  expect(server.answered).toEqual([{ replay: false }]);
  expect(server.rows.get(OMKAR)?.status).toBe("ABSENT");

  // The sheet is read again and the screen offers the second save itself.
  const saveChanges = await screen.findByRole("button", { name: "Save changes" });
  await user.press(screen.getAllByRole("radio", { name: "Late" })[1]!);
  await user.press(saveChanges);
  await waitFor(() => expect(server.saves).toHaveLength(2));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  // The two bodies are not the same save: the second carries the correction.
  expect(server.saves.map(omkarIn)).toEqual(["ABSENT", "LATE"]);
  return server;
}

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
});
afterEach(() => {
  __stopOutboxRunner();
  __setReplayFetch(null);
  __setOutboxStore(null);
});

describe("TA-011: a lecture's attendance corrected and saved again from the same screen", () => {
  it("the second save, of changed marks, carries a client id of its own", async () => {
    const server = await saveThenCorrectAndSaveAgain();
    const [first, second] = server.saves;
    expect(second!.clientId).not.toBe(first!.clientId);
  });

  it("the correction is written: the server holds Late for the student who walked in", async () => {
    const server = await saveThenCorrectAndSaveAgain();
    // The phone draws Late whatever the server answered: the mark comes from the screen's own state.
    expect(screen.getAllByRole("radio", { name: "Late" })[1]).toBeChecked();
    expect({ theSecondSaveWas: server.answered[1]!.replay ? "answered as a replay, nothing written" : "written", "ZZ Omkar on the server": server.rows.get(OMKAR)?.status }).toEqual({
      theSecondSaveWas: "written",
      "ZZ Omkar on the server": "LATE",
    });
  });

  it("both saves made with no signal: once the outbox is sent, the server holds the correction", async () => {
    const server = lectureOnTheServer();
    server.state.signal = false;
    const user = await openTheLecture(server);
    const newestWaiting = async () => ((await listQueued(TAG)) as QueuedRequest[]).map((row) => omkarIn(JSON.parse(row.body) as Save)).at(-1);
    await user.press(screen.getAllByRole("radio", { name: "Absent" })[1]!);
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () => expect(await newestWaiting()).toBe("ABSENT"));
    await user.press(screen.getAllByRole("radio", { name: "Late" })[1]!);
    await user.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () => expect(await newestWaiting()).toBe("LATE"));
    expect(server.saves).toEqual([]);

    // Out of the basement: the outbox goes, oldest first.
    server.state.signal = true;
    await act(async () => {
      await flushOutbox();
    });
    expect(await listQueued(TAG)).toHaveLength(0);
    expect({ savesAnsweredAsAReplay: server.answered.filter((a) => a.replay).length, "ZZ Omkar on the server": server.rows.get(OMKAR)?.status }).toEqual({ savesAnsweredAsAReplay: 0, "ZZ Omkar on the server": "LATE" });
  });
});
