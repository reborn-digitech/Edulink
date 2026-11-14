import "server-only";

/**
 * UPLOADS IN FLIGHT (TA-137 and TA-244, decided 14 November 2026): the first guard that went in with the upload door
 * taking files of up to 100 MB itself.
 *
 * An upload is held in memory while it arrives and again while it is stored (request.formData() buffers the body, and
 * storeFile reads the file into a second buffer), and nothing limited how many were arriving at once: the hour's count
 * is taken before the body is read and the day's bytes count stored files only. So one signed-in account could hold
 * many 100 MB uploads in memory together. Two limits, both counted in this process and both answered "try again
 * shortly" (429) before a byte of the body is read:
 *
 *   - a person has at most UPLOADS_AT_ONCE_PER_PERSON uploads in flight;
 *   - the process holds at most UPLOAD_BYTES_AT_ONCE of declared bodies in flight, an upload that states no size
 *     counting as the largest the door takes. Counted in bytes and not in uploads, so a staff room sending photographs
 *     of a few megabytes on sports day is not turned away by a ceiling sized for videos, while three videos of the
 *     full size fill it.
 *
 * IN THIS PROCESS, deliberately: the thing protected is this process's memory. With more than one machine a person
 * can have this many on each; the hour's count and the day's bytes (rate-limit.ts) are the limits that hold across
 * machines. No table and no migration.
 *
 * Pinned on `globalThis` for the reason tenant-context.ts gives: a bundler may hold more than one copy of a module,
 * and two copies of this count would each admit a full process's worth.
 */
export const UPLOADS_AT_ONCE_PER_PERSON = 2;

/** Three bodies of the largest size the door takes (a 100 MB video and its multipart framing). */
export const UPLOAD_BYTES_AT_ONCE = 3 * (100 * 1024 * 1024 + 64 * 1024);

/** What a refused caller is told to wait, in seconds: an upload in flight is over within moments or minutes, never the hour. */
export const UPLOAD_SLOT_RETRY_SECONDS = 5;

type InFlight = { perPerson: Map<string, number>; bytes: number };
const globalForUploads = globalThis as unknown as { __edulinkUploadsInFlight?: InFlight };
const inFlight = (globalForUploads.__edulinkUploadsInFlight ??= { perPerson: new Map<string, number>(), bytes: 0 });

export type UploadSlot = { release: () => void };

/**
 * Takes a place for one upload of `bytes` (its declared body, or the door's largest when it states none), or says
 * which limit refused it: "person" (this person already has UPLOADS_AT_ONCE_PER_PERSON in flight) or "process" (the
 * process is holding all it will). The caller releases the place in a `finally`; releasing twice gives back once.
 */
export function takeUploadSlot(userId: string, bytes: number): UploadSlot | "person" | "process" {
  const mine = inFlight.perPerson.get(userId) ?? 0;
  if (mine >= UPLOADS_AT_ONCE_PER_PERSON) return "person";
  const weight = Math.max(0, Math.floor(bytes));
  // An upload alone in the process is always admitted, whatever it weighs: the door's own cap bounds it.
  if (inFlight.bytes > 0 && inFlight.bytes + weight > UPLOAD_BYTES_AT_ONCE) return "process";
  inFlight.perPerson.set(userId, mine + 1);
  inFlight.bytes += weight;
  let held = true;
  return {
    release() {
      if (!held) return;
      held = false;
      const now = (inFlight.perPerson.get(userId) ?? 1) - 1;
      if (now <= 0) inFlight.perPerson.delete(userId);
      else inFlight.perPerson.set(userId, now);
      inFlight.bytes = Math.max(0, inFlight.bytes - weight);
    },
  };
}

/** For the suites: what is in flight now. */
export function uploadsInFlight(): { people: number; bytes: number } {
  return { people: inFlight.perPerson.size, bytes: inFlight.bytes };
}
