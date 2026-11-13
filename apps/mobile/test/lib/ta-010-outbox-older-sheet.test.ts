/**
 * TA-010 (testing analysis of 13 November 2026): an older marks sheet waiting in the phone's
 * outbox is sent after a newer save and overwrites it; marks entered since are deleted.
 *
 * A marks sheet is the whole roll, a blank sent as null, and POST /api/v1/marks stores a batch as
 * the sheet's state: a number is written, a null deletes the grade (apps/web/src/lib/exams.ts,
 * saveMarks). So the ORDER the server sees two sheets of one paper in is the result. The outbox
 * keeps a row per save and knows nothing of the tag when it sends:
 *   1. a live write that succeeds is followed by a flush of whatever waits (writeOrQueue,
 *      src/screens/teacher/support.tsx), so the older sheet of the same paper lands after it;
 *   2. a row that fails in a flush is kept while the loop goes on to newer rows of the same tag
 *      (flushQueue, src/lib/outbox.ts), so the next flush sends the older sheet last;
 *   3. only a row that cannot be sent ever expires; one the person can send has no age limit.
 * Each case below is one of the three, and each is red while the outbox behaves that way. The
 * server here is a model of saveMarks' rule and nothing else; the fix the finding also names on
 * the server (a stamp on the sheet) is not something a phone test can hold.
 */
import { marksBatchSchema, type ApiResult, type MarksBatch } from "@edulink/contracts";
import { __setOutboxStore, enqueue, flushQueue, listQueued, memoryOutbox, onQueueEvent, outboxOwner, type QueuedRequest } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { writeOrQueue } from "@/screens/teacher/support";

const CLASS = "czz00000000000000000c1";
const PAPER = "czz00000000000000000s1";
const TAG = `marks:${CLASS}:${PAPER}`;
const URL_MARKS = "/api/v1/marks";
const PUPILS = 40;
const pupil = (n: number) => `czz000000000000000p${String(n).padStart(3, "0")}`;

/** The sheet as the marks screen builds it: every pupil of the roll, the first `typed` with a mark and the rest blank. */
const sheet = (typed: number): MarksBatch =>
  marksBatchSchema.parse({ slotId: PAPER, classId: CLASS, entries: Array.from({ length: PUPILS }, (_, i) => ({ membershipId: pupil(i + 1), marks: i < typed ? 10 + i : null })) });
/** Saved with no signal after twenty marks were typed. */
const OLDER = sheet(20);
/** Saved once the other twenty were typed. */
const NEWER = sheet(PUPILS);

const words = (body: MarksBatch) => `${body.entries.filter((e) => e.marks !== null).length} marks, ${body.entries.filter((e) => e.marks === null).length} blanks`;

/** What POST /api/v1/marks does with a batch: a number is written, a null deletes the grade (saveMarks). */
function apply(grades: Map<string, number>, body: MarksBatch): void {
  for (const entry of body.entries) {
    if (entry.marks === null) grades.delete(entry.membershipId);
    else grades.set(entry.membershipId, entry.marks);
  }
}

const queue = (body: MarksBatch) => enqueue({ url: URL_MARKS, method: "POST", body: JSON.stringify(body), tag: TAG });

/** Resolves when the flush a write started has run to its end, or after a moment when the write started none. */
function flushStartedByTheWrite(): Promise<void> {
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
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
});
afterEach(() => __setReplayFetch(null));

describe("TA-010: an older marks sheet in the outbox and a newer save of the same paper", () => {
  it("after a newer save of the paper has gone through, the older sheet waiting under the same tag is not sent", async () => {
    const grades = new Map<string, number>();
    const sentFromTheOutbox: string[] = [];
    __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
    __setReplayFetch((async (_input: string, init: RequestInit) => {
      const body = marksBatchSchema.parse(JSON.parse(String(init.body)));
      sentFromTheOutbox.push(words(body));
      apply(grades, body);
      return new Response('{"saved":0,"cleared":0}', { status: 200 });
    }) as unknown as typeof globalThis.fetch);

    // The first save found no signal: the sheet of twenty marks and twenty blanks waits.
    await queue(OLDER);
    expect((await listQueued(TAG)).map((row) => words(JSON.parse(row.body) as MarksBatch))).toEqual(["20 marks, 20 blanks"]);

    // The second save goes live and the server takes all forty marks: the marks screen's own line,
    // writeOrQueue(await api().post("/api/v1/marks", body), { url, body, tag }).
    apply(grades, NEWER);
    expect(grades.size).toBe(PUPILS);
    const live: ApiResult<unknown> = { ok: true, data: { saved: PUPILS, cleared: 0 } };
    const flushed = flushStartedByTheWrite();
    expect(await writeOrQueue(live, { url: URL_MARKS, body: NEWER, tag: TAG })).toEqual({ kind: "sent" });
    await flushed;
    // And the next time the app comes back to the foreground.
    await flushOutbox();

    expect({ olderSheetsSentAfterTheNewerSave: sentFromTheOutbox, gradesOnTheServer: grades.size, stillWaitingUnderTheTag: (await listQueued(TAG)).length }).toEqual({
      olderSheetsSentAfterTheNewerSave: [],
      gradesOnTheServer: PUPILS,
      stillWaitingUnderTheTag: 0,
    });
  });

  it("a sheet the server failed in one flush is not what the server is left with once a newer sheet of the same tag was accepted", async () => {
    // Both saves found no signal: two rows wait under the one tag, the newer one last.
    await queue(OLDER);
    await queue(NEWER);
    expect(words(JSON.parse((await listQueued(TAG)).at(-1)!.body) as MarksBatch)).toBe("40 marks, 0 blanks");

    const grades = new Map<string, number>();
    const accepted: string[] = [];
    const take = (item: QueuedRequest): { status: number } => {
      const body = marksBatchSchema.parse(JSON.parse(item.body));
      apply(grades, body);
      accepted.push(words(body));
      return { status: 200 };
    };
    // The server answers the first request of the first flush 503 and is well again after it.
    let unwell = true;
    await flushQueue(async (item) => {
      if (unwell) {
        unwell = false;
        return { status: 503 };
      }
      return take(item);
    });
    // The next flush (the app returns to the foreground): everything is accepted.
    await flushQueue(async (item) => take(item));

    expect({ lastSheetTheServerAccepted: accepted.at(-1), gradesOnTheServer: grades.size, stillWaitingUnderTheTag: (await listQueued(TAG)).length }).toEqual({
      lastSheetTheServerAccepted: "40 marks, 0 blanks",
      gradesOnTheServer: PUPILS,
      stillWaitingUnderTheTag: 0,
    });
  });

  it("a sheet the person could send that has waited for months is not sent as if it had just been saved", async () => {
    // The finding sets no age ("a sendable row past a set age is reported, not sent"); 180 days is past any.
    const store = memoryOutbox();
    __setOutboxStore(store);
    const owner = outboxOwner()!;
    const DAY = 86_400_000;
    await store.put({ id: "zz-sheet-of-last-term", url: URL_MARKS, method: "POST", body: JSON.stringify(OLDER), tag: TAG, createdAt: Date.now() - 180 * DAY, attempts: 3, lastError: "HTTP 503", owner: owner.userId, schoolId: owner.schoolId, membershipId: owner.membershipId });
    // It is this person's row at the school they are at: nothing but its age stands between it and the server.
    expect((await store.all()).map((row) => [row.owner, row.schoolId, row.tag])).toEqual([[owner.userId, owner.schoolId, TAG]]);

    const sent: string[] = [];
    await flushQueue(async (item) => {
      sent.push(`${words(JSON.parse(item.body) as MarksBatch)}, queued ${Math.round((Date.now() - item.createdAt) / DAY)} days ago`);
      return { status: 200 };
    });
    expect(sent).toEqual([]);
  });
});
