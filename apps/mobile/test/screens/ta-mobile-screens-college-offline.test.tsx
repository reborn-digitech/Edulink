/**
 * The testing analysis of 13 November 2026, batch mobile-screens-college: the lecture and the
 * logbook, offline and on. Each case is named with its finding.
 *
 * TA-152: a save kept offline that the server refused when the outbox sent it was dropped without
 * a word on the lecture and logbook screens (only the school register listened for "rejected").
 * TA-349: a logbook entry could be handed in while its correction still waited in the outbox; the
 * correction was then refused and lost. TA-456: the lecture roster drew every registered student
 * and three choices each inside one ScrollView. TA-472: the phone never said the stream's word —
 * an architecture college's lecture is "Studio" on the web and was "Lecture" on the phone.
 */
import { act, fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { FacultyHomeScreen } from "@/screens/academics/faculty";
import { LectureScreen } from "@/screens/academics/lecture";
import { lectureKindLabel } from "@/screens/academics/words";
import { ClinicalLogbookScreen } from "@/screens/college/clinical";
import { __setOutboxStore, enqueue, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { json, me, mountStaff, offline } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const LECTURE = id("zzlecture1");
const OFFERING = id("zzoffering1");
const DOOR = `/api/v1/academics/lectures/${LECTURE}`;
const atCollege = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE", ...extra });
const lectureRow = { lectureId: LECTURE, offeringId: OFFERING, dateKey: "2026-10-05", startMinute: 540, endMinute: 590, kind: "LECTURE", courseCode: "AR301", courseName: "ZZ Design III", divisionName: "ZZ TY A", roomName: "ZZ Studio 2", registered: 2, marked: 0, substitute: false };
const student = (n: number) => ({ studentMembershipId: id(`zzs${String(n).padStart(3, "0")}x`), name: `ZZ Student ${String(n).padStart(3, "0")}`, rollNumber: n, status: null, percent: 90 });
const sheet = (count: number) => ({ lecture: { ...lectureRow, registered: count }, threshold: 75, canMark: true, entries: Array.from({ length: count }, (_, i) => student(i + 1)) });
const refusedReplay = (status: number, error: string) => (async () => new Response(JSON.stringify({ error, code: "REFUSED" }), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __setReplayFetch((async () => {
    throw new TypeError("Network request failed");
  }) as unknown as typeof fetch);
});
afterEach(() => {
  __stopOutboxRunner();
  __setReplayFetch(null);
  __setOutboxStore(null);
});

describe("a lecture marked offline", () => {
  it("TA-152: a batch the server refuses when the outbox sends it is said so on the lecture screen, and the sheet is read again", async () => {
    let gets = 0;
    await mountStaff(
      <LectureScreen lectureId={LECTURE} />,
      "FACULTY",
      {
        [`GET ${DOOR}`]: () => {
          gets++;
          return json(sheet(2));
        },
        [`POST ${DOOR}/attendance`]: offline,
      },
      { me: atCollege("FACULTY") },
    );
    const user = userEvent.setup();
    await user.press(await screen.findByRole("button", { name: "Save" }));
    expect(await screen.findByText("You are offline. This is saved on your device and will send when you are back.")).toBeTruthy();
    await waitFor(async () => expect(await listQueued(`lecture:${LECTURE}`)).toHaveLength(1));
    const before = gets;
    // Back in signal, the exam cell has frozen the lecture meanwhile: the replay is answered 409.
    __setReplayFetch(refusedReplay(409, "ZZ the attendance is frozen"));
    await act(async () => {
      await flushOutbox();
    });
    expect(await listQueued(`lecture:${LECTURE}`)).toHaveLength(0);
    // Before the fix the badge went and the screen still said it would be sent.
    expect(await screen.findByText("The marks kept offline for this lecture were refused when they were sent, and the lecture is not marked. Check the sheet and save again.")).toBeTruthy();
    expect(screen.queryByText("You are offline. This is saved on your device and will send when you are back.")).toBeNull();
    await waitFor(() => expect(gets).toBeGreaterThan(before));
  });

  it("TA-456: a division of 120 does not mount 120 rows of three choices at once", async () => {
    await mountStaff(<LectureScreen lectureId={LECTURE} />, "FACULTY", { [`GET ${DOOR}`]: () => json(sheet(120)) }, { me: atCollege("FACULTY") });
    expect(await screen.findByText("Register: 120 students")).toBeTruthy();
    expect(screen.getByText(/ZZ Student 001/)).toBeTruthy();
    // Before the fix every one of the 120 rows (360 pressables) was drawn inside the screen's ScrollView.
    const rows = screen.getAllByRole("radio", { name: "Present" }).length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(120);
    expect(screen.queryByText(/ZZ Student 120/)).toBeNull();
  });
});

describe("the stream's word on the phone", () => {
  it("TA-472: an architecture college's lecture is a studio on the teacher's day and on the lecture screen", async () => {
    await mountStaff(
      <FacultyHomeScreen />,
      "FACULTY",
      {
        "GET /api/v1/academics/faculty-home": () =>
          json({
            name: "ZZ Neha",
            departmentName: "ZZ Architecture",
            term: { id: id("zzterm1"), name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: true },
            today: { dateKey: "2026-10-05", closed: false, lectures: [lectureRow] },
            offerings: [],
            hours: 10,
            settings: { loadMinHours: 4, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 },
            mentoringGroups: 0,
            toModerate: [],
          }),
      },
      { me: atCollege("FACULTY", { streams: ["ARCHITECTURE"] }) },
    );
    // Before the fix the caption began "Lecture" whatever the college's streams.
    expect(await screen.findByText(/^Studio · ZZ TY A/)).toBeTruthy();
    await mountStaff(<LectureScreen lectureId={LECTURE} />, "FACULTY", { [`GET ${DOOR}`]: () => json(sheet(2)) }, { me: atCollege("FACULTY", { streams: ["ARCHITECTURE"] }) });
    expect(await screen.findByText(/· Studio · ZZ TY A/)).toBeTruthy();
  });

  it("TA-472: the word follows the web's rule — one stream's word, the general word for streams that disagree or none", () => {
    const words: Record<string, string> = { "streams.word.studio": "Studio", "streams.word.lecture": "Lecture", "streams.word.lab": "Lab", "streams.word.practical": "Practical", "academics.lectureTUTORIAL": "Tutorial" };
    const t = ((key: string) => words[key] ?? key) as Parameters<typeof lectureKindLabel>[1];
    expect(lectureKindLabel("LECTURE", t, ["ARCHITECTURE"])).toBe("Studio");
    expect(lectureKindLabel("LECTURE", t, ["ARCHITECTURE", "ENGINEERING"])).toBe("Lecture");
    expect(lectureKindLabel("LECTURE", t, [])).toBe("Lecture");
    expect(lectureKindLabel("LAB", t, ["PHARMACY"])).toBe("Practical");
    expect(lectureKindLabel("TUTORIAL", t, ["ARCHITECTURE"])).toBe("Tutorial");
  });
});

/* -------------------------------------------------------------- the logbook */

const entry = (n: number, state: string, extra: Record<string, unknown> = {}) => ({ id: id(`entry${n}`), clientId: `zz-client-${n}`, postingId: id("post1"), departmentName: "ZZ Medical ward", siteName: "ZZ Civil Hospital", on: `2026-10-0${n}`, kind: "CASE", count: 2, note: `ZZ Note ${n}`, state, submittedAt: null, signedAt: null, signedByName: null, remark: "", ...extra });
const posting = {
  id: id("post1"),
  siteId: id("site1"),
  siteName: "ZZ Civil Hospital",
  departmentId: id("ward1"),
  departmentName: "ZZ Medical ward",
  divisionId: id("div1"),
  divisionName: "ZZ SY Nursing A",
  programmeCode: "BSCN",
  labBatchId: null,
  batchName: null,
  supervisorMembershipId: id("sup1"),
  supervisorName: "ZZ Prof Shinde",
  from: "2026-09-21",
  to: "2026-10-18",
  rotationOrder: 1,
  current: true,
};
const logbook = { offered: true, today: "2026-10-10", postings: [posting], entries: [entry(2, "RETURNED", { remark: "ZZ Say which site." })], summary: { signed: 0, waiting: 0, returned: 1, draft: 0 } };
const atHealth = () => atCollege("STUDENT", { streams: ["HEALTH_SCIENCES"] });

describe("the student's logbook offline", () => {
  it("TA-152: an entry the server refuses when the outbox sends it is said so, and its words come back into the form", async () => {
    await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": offline }, { me: atHealth() });
    await fireEvent.press(await screen.findByRole("button", { name: "New entry" }));
    await userEvent.setup().type(screen.getByLabelText("Note"), "ZZ Bed 14, IP 22/1187.");
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    expect(await screen.findByText("Case × 1 · Waiting to send")).toBeTruthy();
    // In signal, the door refuses the hospital number it would have refused online.
    __setReplayFetch(refusedReplay(422, "ZZ the note names a patient"));
    await act(async () => {
      await flushOutbox();
    });
    expect(await listQueued("clinical-logbook")).toHaveLength(0);
    // Before the fix the waiting row vanished and nothing was said.
    expect(await screen.findByText("A logbook entry kept offline was refused when it was sent, and is not in the logbook. Its words are back in the form: correct it and add it again.")).toBeTruthy();
    expect(screen.getByLabelText("Note").props.value).toBe("ZZ Bed 14, IP 22/1187.");
  });

  it("TA-349: an entry whose correction still waits in the outbox cannot be handed in until it has gone", async () => {
    const { calls } = await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": offline, [`POST /api/v1/family/clinical/logbook/${id("entry2")}/submit`]: () => json({ id: id("entry2") }) }, { me: atHealth() });
    await fireEvent.press(await screen.findByRole("button", { name: "Correct: 02/10/2026" }));
    await userEvent.setup().type(screen.getByLabelText("Note"), " at the civil hospital");
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    await waitFor(async () => expect(await listQueued("clinical-logbook")).toHaveLength(1));
    const handIn = await screen.findByRole("button", { name: "Hand in: 02/10/2026" });
    // Before the fix "Hand in" stayed live, and the supervisor got the words that had been returned.
    await waitFor(() => expect(handIn).toBeDisabled());
    expect(screen.getByText("A correction of this entry is still waiting to be sent; hand it in once it has gone.")).toBeTruthy();
    await fireEvent.press(handIn);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls().some((c) => c.line === `POST /api/v1/family/clinical/logbook/${id("entry2")}/submit`)).toBe(false);
    // Once the correction has gone, the entry may be handed in.
    __setReplayFetch((async () => new Response(JSON.stringify({ id: id("entry2") }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch);
    await act(async () => {
      await flushOutbox();
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Hand in: 02/10/2026" })).toBeEnabled());
  });

  it("TA-349: a correction queued before the screen opened holds the hand-in too", async () => {
    await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook) }, { me: atHealth() });
    await act(async () => {
      await enqueue({ url: "/api/v1/family/clinical/logbook", method: "POST", body: JSON.stringify({ id: id("entry2"), clientId: "zz-client-2", postingId: id("post1"), on: "2026-10-02", kind: "CASE", count: 2, note: "ZZ corrected" }), tag: "clinical-logbook" });
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Hand in: 02/10/2026" })).toBeDisabled());
  });
});
