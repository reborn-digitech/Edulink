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

/** This person's row at the school they are at now: the only kind a flush sends. */
function sendableNow(item: QueuedRequest): boolean {
  return owner !== null && item.owner === owner.userId && (item.schoolId ?? null) === owner.schoolId;
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
  | { type: "rejected"; item: QueuedRequest; status: number };

const listeners = new Set<(event: QueueEvent) => void>();
export function onQueueEvent(listener: (event: QueueEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event: QueueEvent) {
  for (const l of listeners) l(event);
}

let lastCreatedAt = 0;

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
  emit({ type: "queued", item: record, remaining: await countQueued() });
  return record.id;
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
 * replayed under school B's context would be refused and lost.
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

/** Rows that cannot be sent now and are older than HOLD_DAYS: dropped unsent. */
async function dropExpired(now: number): Promise<number> {
  let dropped = 0;
  for (const item of await everything()) {
    if (!sendableNow(item) && now - item.createdAt > HOLD_MS) {
      await current().remove(item.id);
      dropped++;
    }
  }
  return dropped;
}

let flushing = false;

/**
 * Sends the signed-in person's rows for the school they are at, oldest
 * first; nothing at all with nobody signed in. Another person's rows and
 * this person's rows of another school stay where they are (until
 * HOLD_DAYS). `send` is the transport — the api client's request with the
 * replay and owner headers — injected so the suite can prove the policy
 * without a network.
 */
export async function flushQueue(
  send: (item: QueuedRequest) => Promise<{ status: number }>,
  now: number = Date.now(),
): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing) return { sent: 0, failed: 0, remaining: await countQueued() };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    await dropExpired(now);
    for (const item of await listQueued()) {
      // The person can change mid-flush (Sign out, a 401, someone else
      // signing in): what was theirs a moment ago is not sent under the next.
      if (!sendableNow(item)) continue;
      let status = 0;
      let error = "";
      try {
        status = (await send(item)).status;
      } catch (e) {
        error = e instanceof Error ? e.message : "network";
      }
      if (status >= 200 && status < 300) {
        await current().remove(item.id);
        sent++;
        continue;
      }
      if (status >= 400 && status < 500 && status !== 401 && status !== 429) {
        await current().remove(item.id);
        failed++;
        emit({ type: "rejected", item, status });
        continue;
      }
      await current().put({ ...item, attempts: item.attempts + 1, lastError: error || `HTTP ${status}` });
      failed++;
    }
  } finally {
    flushing = false;
  }
  const remaining = await countQueued();
  emit({ type: "flushed", sent, failed, remaining });
  return { sent, failed, remaining };
}
