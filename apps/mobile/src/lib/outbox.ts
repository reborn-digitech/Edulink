import { platformOutbox } from "./outbox-platform";

/**
 * The offline outbox, the phone's twin of the web's lib/offline-queue.ts.
 *
 * Same contract: a queued item is a URL, a method and a JSON body with a
 * device-minted client id; flushing sends in the order queued, drops what the
 * server refused for good (4xx other than 401 and 429), and keeps what the
 * network dropped for the next try. Storage is expo-sqlite on a phone and an
 * in-memory list on the web target and in tests, behind one adapter so the
 * flush logic is exercised the same way everywhere.
 */
export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  body: string;
  tag: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  /**
   * Who queued it and where (campaign 2026-10-04, PH-1 and PH-6): the
   * signed-in person's user id, and the school and membership that were
   * active. A row goes out only under the same person at the same school,
   * with X-Edulink-Owner naming them, which the server refuses for anyone
   * else. Null on a row queued with nobody signed in, or before the stamp:
   * such a row is never sent and is dropped after HOLD_DAYS.
   */
  owner: string | null;
  schoolId: string | null;
  membershipId: string | null;
};

/** Who is signed in, as the session tells the outbox. */
export type OutboxOwner = { userId: string; schoolId: string | null; membershipId: string | null };

/**
 * How long a row that cannot be sent now is kept: another person's (their
 * session ended without Sign out — expired, or revoked from the web — and
 * someone else signed in), or the same person's at another school. On a
 * phone that is the teacher's own, the common case is the same person
 * signing in again within the week, and the register goes then; past that
 * the row is dropped unsent, as Sign out drops one at once.
 */
export const HOLD_DAYS = 7;
const HOLD_MS = HOLD_DAYS * 86_400_000;

/**
 * How long a row the person CAN send is still sent (TA-010, 13 Nov 2026): a
 * write that has waited a month is no longer what the person meant now (a
 * marks sheet of last term would undo every correction made since), so past
 * this it is dropped unsent and reported as a refusal of status 0, which the
 * screens that listen for refusals show as not saved.
 */
export const SEND_DAYS = 30;
const SEND_MS = SEND_DAYS * 86_400_000;

/**
 * Tags whose body is the whole of one thing, so the newest body is all the
 * server needs (TA-010, TA-012): a paper's marks sheet (`marks:<class>:<slot>`,
 * every pupil, a blank as null, stored as the sheet's state) and a lecture's
 * attendance (`lecture:<id>`, every student). An older row of such a tag is
 * removed when a newer one is queued or sent live, and never sent after it —
 * the door applies what it gets in the order it gets it, so an older sheet
 * landing last put its blanks over the marks typed since. The hostel roll's
 * tag names the hostel, not the night and slot its body carries, so it is not
 * one of these.
 */
const WHOLE_STATE_TAGS = ["marks:", "lecture:"];
export function wholeStateTag(tag: string): boolean {
  return WHOLE_STATE_TAGS.some((prefix) => tag.startsWith(prefix));
}

export type OutboxStore = {
  all(): Promise<QueuedRequest[]>;
  put(item: QueuedRequest): Promise<void>;
  remove(id: string): Promise<void>;
};

export function memoryOutbox(): OutboxStore {
  const items = new Map<string, QueuedRequest>();
  return {
    async all() {
      return [...items.values()];
    },
    async put(item) {
      items.set(item.id, item);
    },
    async remove(id) {
      items.delete(id);
    },
  };
}

let owner: OutboxOwner | null = null;

/**
 * Called by the session whenever it learns who is signed in (and with null
 * when nobody is): new rows are stamped with it, and a flush sends only its
 * rows. Nothing is dropped here — a session that ended by 401 leaves its
 * rows for the same person to send on signing in again.
 */
export function setOutboxOwner(next: OutboxOwner | null): void {
  owner = next ? { userId: next.userId, schoolId: next.schoolId ?? null, membershipId: next.membershipId ?? null } : null;
}

export function outboxOwner(): OutboxOwner | null {
  return owner;
}

/**
 * This person's row at the school and in the role they are in now: the only kind a flush sends. The role is the
 * membership (TA-147, 13 Nov 2026): a head who also teaches queued a register as TEACHER, switched to PRINCIPAL, and
 * the replay went under the head's context, refused and dropped (or, for an office that also teaches, taken under
 * the office's rights). A row stamped before the membership was stamped (null) is judged by the school alone.
 */
function sendableNow(item: QueuedRequest): boolean {
  return owner !== null && item.owner === owner.userId && (item.schoolId ?? null) === owner.schoolId && (item.membershipId == null || item.membershipId === owner.membershipId);
}

let store: OutboxStore | null = null;
function current(): OutboxStore {
  if (!store) store = platformOutbox() ?? memoryOutbox();
  return store;
}
export function __setOutboxStore(next: OutboxStore | null): void {
  store = next;
}

export function newClientId(): string {
  const bytes = new Uint8Array(12);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `${Date.now().toString(36)}-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export type QueueEvent =
  | { type: "queued"; item: QueuedRequest; remaining: number }
  | { type: "flushed"; sent: number; failed: number; remaining: number }
  /** `error`: the server's sentence for the refusal, when the transport had one (TA-146). */
  | { type: "rejected"; item: QueuedRequest; status: number; error?: string };

const listeners = new Set<(event: QueueEvent) => void>();
export function onQueueEvent(listener: (event: QueueEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event: QueueEvent) {
  for (const l of listeners) l(event);
}

let lastCreatedAt = 0;

/**
 * The outbox's clock now: every row queued so far has a createdAt at or below
 * it, every row queued later one above it (createdAt runs ahead of Date.now()
 * by a millisecond per row queued within one). A live write takes it before it
 * leaves, for supersedeQueued.
 */
export function queueMark(): number {
  return Math.max(Date.now(), lastCreatedAt);
}

export async function enqueue(item: Omit<QueuedRequest, "id" | "createdAt" | "attempts" | "owner" | "schoolId" | "membershipId">): Promise<string> {
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  const record: QueuedRequest = {
    ...item,
    id: newClientId(),
    createdAt: lastCreatedAt,
    attempts: 0,
    owner: owner?.userId ?? null,
    schoolId: owner?.schoolId ?? null,
    membershipId: owner?.membershipId ?? null,
  };
  await current().put(record);
  // A newer body of a whole-state tag replaces what waits under it: only the newest goes.
  if (wholeStateTag(record.tag)) await removeOlder(record, record.createdAt);
  emit({ type: "queued", item: record, remaining: await countQueued() });
  return record.id;
}

/** Rows removed as superseded while a flush may hold them in its list: it skips them rather than send what is gone. */
const superseded = new Set<string>();

/** Removes the same person's rows at the same school under `like`'s tag queued before `before`. */
async function removeOlder(like: Pick<QueuedRequest, "tag" | "owner" | "schoolId">, before: number, inclusive = false): Promise<number> {
  let removed = 0;
  for (const item of await current().all()) {
    if (item.tag !== like.tag || item.owner !== like.owner || (item.schoolId ?? null) !== (like.schoolId ?? null)) continue;
    if (inclusive ? item.createdAt > before : item.createdAt >= before) continue;
    await current().remove(item.id);
    superseded.add(item.id);
    removed++;
  }
  return removed;
}

/**
 * A body of a whole-state tag went through live, from a request that left at
 * `startedAt` (queueMark() then): what this person queued under the tag before then is older than
 * what the server now holds, and is removed rather than sent after it (TA-010,
 * TA-012). Any other tag is left alone (two messages are two messages).
 */
export async function supersedeQueued(tag: string, startedAt: number): Promise<number> {
  if (!wholeStateTag(tag) || !owner) return 0;
  const removed = await removeOlder({ tag, owner: owner.userId, schoolId: owner.schoolId }, startedAt, true);
  if (removed) emit({ type: "flushed", sent: 0, failed: 0, remaining: await countQueued() });
  return removed;
}

/**
 * The signing-out person's rows, gone — on sign-out — with any row nobody
 * owns. A queued write belongs to the person who made it. Nothing is sent:
 * what was not sent while they were signed in is theirs to redo, and the
 * screen said it was waiting. Another person's held rows are not this
 * person's to delete; they keep their HOLD_DAYS.
 */
export async function clearQueue(): Promise<number> {
  const items = (await current().all()).filter((i) => i.owner === null || i.owner === owner?.userId);
  for (const item of items) await current().remove(item.id);
  if (items.length) emit({ type: "flushed", sent: 0, failed: 0, remaining: await countQueued() });
  return items.length;
}

async function everything(): Promise<QueuedRequest[]> {
  return (await current().all()).sort((a, b) => a.createdAt - b.createdAt);
}

/** What waits to send for the person signed in, at the school they are at: what a badge counts. */
export async function listQueued(tag?: string): Promise<QueuedRequest[]> {
  const mine = (await everything()).filter(sendableNow);
  return tag ? mine.filter((i) => i.tag === tag) : mine;
}

export async function countQueued(tag?: string): Promise<number> {
  return (await listQueued(tag)).length;
}

/**
 * The signed-in person's rows queued at another school, by school id: held,
 * not sent, until they switch back (PH-6). A register queued at school A
 * replayed under school B's context would be refused and lost. A row queued
 * in another role at this school is held the same way (TA-147), under this
 * school's id.
 */
export async function heldElsewhere(): Promise<Map<string | null, number>> {
  const held = new Map<string | null, number>();
  if (!owner) return held;
  for (const item of await everything()) {
    if (item.owner !== owner.userId || sendableNow(item)) continue;
    const key = item.schoolId ?? null;
    held.set(key, (held.get(key) ?? 0) + 1);
  }
  return held;
}

/**
 * Rows that cannot be sent now and are older than HOLD_DAYS, and rows that
 * could be sent but are older than SEND_DAYS (reported as refused, status 0):
 * dropped unsent. So are rows of a whole-state tag with a newer row of the
 * same person's beside them (queued before enqueue replaced them, by an older
 * build): only the newest of such a tag is ever sent.
 */
async function dropExpired(now: number): Promise<number> {
  let dropped = 0;
  const all = await everything();
  const newest = new Map<string, number>();
  for (const item of all) {
    if (wholeStateTag(item.tag)) newest.set(`${item.owner}|${item.schoolId ?? ""}|${item.tag}`, item.createdAt);
  }
  for (const item of all) {
    if (!sendableNow(item) && now - item.createdAt > HOLD_MS) {
      await current().remove(item.id);
      dropped++;
      continue;
    }
    if (sendableNow(item) && now - item.createdAt > SEND_MS) {
      await current().remove(item.id);
      dropped++;
      emit({ type: "rejected", item, status: 0 });
      continue;
    }
    const latest = newest.get(`${item.owner}|${item.schoolId ?? ""}|${item.tag}`);
    if (latest !== undefined && item.createdAt < latest) {
      await current().remove(item.id);
      dropped++;
    }
  }
  return dropped;
}

let flushing = false;

/** The longest one queued row's send is waited for in a flush (TA-149); the client gives up on its own at 30 s. */
export const ROW_LIMIT_MS = 45_000;

/**
 * Sends the signed-in person's rows for the school they are at, oldest
 * first; nothing at all with nobody signed in. Another person's rows and
 * this person's rows of another school stay where they are (until
 * HOLD_DAYS). `send` is the transport — the api client's request with the
 * replay and owner headers — injected so the suite can prove the policy
 * without a network.
 */
export async function flushQueue(
  send: (item: QueuedRequest) => Promise<{ status: number; error?: string }>,
  now: number = Date.now(),
  /** How long one row's send may take before it is kept for the next try (TA-149): a send that never settles held every later flush. */
  rowLimitMs: number = ROW_LIMIT_MS,
): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing) return { sent: 0, failed: 0, remaining: await countQueued() };
  flushing = true;
  let sent = 0;
  let failed = 0;
  // A tag whose row was kept for another try: the rows queued after it under
  // the same tag wait too, so the server never gets a tag's writes out of
  // order — an older one landing after a newer one (TA-010).
  const held = new Set<string>();
  try {
    superseded.clear();
    await dropExpired(now);
    for (const item of await listQueued()) {
      // The person can change mid-flush (Sign out, a 401, someone else
      // signing in): what was theirs a moment ago is not sent under the next.
      if (!sendableNow(item) || superseded.has(item.id)) continue;
      if (held.has(item.tag)) {
        failed++;
        continue;
      }
      let status = 0;
      let error = "";
      let refusal: string | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const answer = await Promise.race([
          send(item),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("timeout")), rowLimitMs);
          }),
        ]);
        status = answer.status;
        refusal = answer.error;
      } catch (e) {
        error = e instanceof Error ? e.message : "network";
      } finally {
        clearTimeout(timer);
      }
      if (status >= 200 && status < 300) {
        await current().remove(item.id);
        sent++;
        continue;
      }
      if (status >= 400 && status < 500 && status !== 401 && status !== 429) {
        await current().remove(item.id);
        failed++;
        emit({ type: "rejected", item, status, ...(refusal ? { error: refusal } : {}) });
        continue;
      }
      await current().put({ ...item, attempts: item.attempts + 1, lastError: error || `HTTP ${status}` });
      held.add(item.tag);
      failed++;
    }
  } finally {
    flushing = false;
  }
  const remaining = await countQueued();
  emit({ type: "flushed", sent, failed, remaining });
  return { sent, failed, remaining };
}
