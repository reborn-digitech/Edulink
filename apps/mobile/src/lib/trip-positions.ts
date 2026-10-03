import { POSITIONS_PER_BATCH } from "@edulink/contracts";
import { enqueue, listQueued } from "./outbox";
import { flushOutbox } from "./outbox-runner";

/**
 * The bus's positions on their way from the driver's phone (transport, 3 Oct
 * 2026). The phone samples where it is every twelve seconds or so during a
 * LIVE trip (lib/trip-location-platform); each fix lands here, and every
 * fifteen seconds — or at two hundred fixes — the batch goes into the
 * offline outbox as one POST /api/v1/transport/trips/{id}/positions and the
 * outbox is asked to send. On a road with no signal the batches wait in the
 * outbox (SQLite on a phone) and go, in order, when it returns; the server
 * stores the same instant once, so a batch sent twice is harmless, and one
 * sent after End is refused (403) and dropped by the outbox's own rule.
 *
 * The battery rides along: the level when known, and `lowBattery` once it is
 * under fifteen per cent or the phone is saving power, which the office sees
 * against the trip.
 *
 * Only the bus's position is sent, and only while a trip runs; nothing here
 * runs before Start or after End.
 */
export const POSITIONS_TAG = "transport-positions";
export const BOARDINGS_TAG = "transport-boardings";
export const BATCH_EVERY_MS = 15_000;
export const LOW_BATTERY = 0.15;

export type Fix = { at: string; lat: number; lng: number; speed: number | null; accuracy: number | null };

let buffer: { tripId: string; fixes: Fix[]; since: number } | null = null;
let battery: { level: number | null; low: boolean } = { level: null, low: false };

/** A location as expo-location (or the browser) reports it, as the server takes it. */
export function fixOf(location: { coords: { latitude: number; longitude: number; speed?: number | null; accuracy?: number | null }; timestamp: number }): Fix {
  const speed = location.coords.speed;
  const accuracy = location.coords.accuracy;
  return {
    at: new Date(location.timestamp).toISOString(),
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    speed: typeof speed === "number" && speed >= 0 ? Math.min(speed, 100) : null,
    accuracy: typeof accuracy === "number" && accuracy >= 0 ? Math.min(accuracy, 10_000) : null,
  };
}

/** The phone's battery, 0–1, and whether it is saving power; low under fifteen per cent either way. */
export function setBattery(level: number | null, saving = false): void {
  const known = typeof level === "number" && level >= 0 && level <= 1 ? level : null;
  battery = { level: known, low: saving || (known !== null && known < LOW_BATTERY) };
}

/** One fix for the trip; sends the batch when fifteen seconds have gathered (or the trip changed). True when a batch went. */
export async function addFix(tripId: string, fix: Fix, now: number = Date.now()): Promise<boolean> {
  if (buffer && buffer.tripId !== tripId) await sendBatch();
  if (!buffer || buffer.tripId !== tripId) buffer = { tripId, fixes: [], since: now };
  buffer.fixes.push(fix);
  if (now - buffer.since >= BATCH_EVERY_MS || buffer.fixes.length >= POSITIONS_PER_BATCH) {
    await sendBatch(now);
    return true;
  }
  return false;
}

/** Put what has gathered into the outbox and ask it to send; the count of fixes queued. */
export async function sendBatch(now: number = Date.now()): Promise<number> {
  if (!buffer || buffer.fixes.length === 0) return 0;
  const { tripId, fixes } = buffer;
  buffer = { tripId, fixes: [], since: now };
  const body = { positions: fixes, ...(battery.level !== null ? { battery: battery.level } : {}), ...(battery.low ? { lowBattery: true } : {}) };
  await enqueue({ url: `/api/v1/transport/trips/${tripId}/positions`, method: "POST", body: JSON.stringify(body), tag: POSITIONS_TAG });
  void flushOutbox();
  return fixes.length;
}

/** How many positions are waiting for a signal: in the outbox, and gathered but not yet batched. */
export async function waitingPositions(): Promise<number> {
  let n = buffer?.fixes.length ?? 0;
  for (const item of await listQueued(POSITIONS_TAG)) {
    try {
      n += (JSON.parse(item.body) as { positions?: unknown[] }).positions?.length ?? 0;
    } catch {
      // A body that does not parse was never ours to count.
    }
  }
  return n;
}

/** A tick on the roster goes through the outbox too, so a stop with no signal still keeps it. */
export async function queueBoarding(tripId: string, body: { allotmentId: string; boarded?: boolean; alighted?: boolean }): Promise<void> {
  await enqueue({ url: `/api/v1/transport/trips/${tripId}/boardings`, method: "POST", body: JSON.stringify({ ...body, at: new Date().toISOString() }), tag: BOARDINGS_TAG });
  void flushOutbox();
}

/** Tests start clean. */
export function __resetTripPositions(): void {
  buffer = null;
  battery = { level: null, low: false };
}
