/**
 * The fixed ids of the risks batch's college builds at ZZ Vidya College
 * (package 5B, 5 Oct 2026; scripts/zz-college-extras.ts writes them), so the
 * catalog's samples can name a talk, a training and its sessions, a device, a
 * badge and a visit. Each is in the shape the contracts' cuid check accepts.
 * Only ZZ data.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const COLLEGE_EXTRAS_FIXTURE = {
  /** The open drive's pre-placement talk, a week ahead: zz.cstudent02 GOING, zz.cstudent03 NOT_GOING. */
  talk: pad("zztalk", 1),
  /** A talk held last month with its attendance marked (held, so an edit is refused 409). */
  heldTalk: pad("zztalk", 2),
  /** "ZZ Interview skills", OPEN, two sessions held (cstudent02 present at both: completed) and one ahead. */
  training: pad("zztrain", 1),
  heldSession: pad("zztrsess", 1),
  futureSession: pad("zztrsess", 3),
  /** "ZZ Main gate reader", scope BOTH; its key is sealed and known to nobody (the fixture prints none). */
  device: pad("zzpunchdev", 1),
  /** The same reader at ZZ Northgate School, so the school's ADMIN actor has a device of its own to edit and rotate. */
  deviceNorthgate: pad("zzpunchdev", 2),
  badge: pad("zzbadge", 1),
  /** The NAAC peer-team visit of Vidya's cycle: a schedule of three slots and four evidence lines. */
  visit: pad("zzvisit", 1),
} as const;
