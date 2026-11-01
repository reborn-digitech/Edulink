import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { parseAdminDuties } from "@edulink/contracts";
import { setHeadDuty } from "../src/lib/duties";
import type { ActiveContext } from "../src/lib/session";

/**
 * owner-batch-item9 (27 Oct 2026; the coordinator's decision 7): THE HEAD GIVES THE OFFICE THE HEAD'S PAGES in the demo
 * schools, the demo colleges and the ZZ Northgate fixture, so their admins keep leave approval, the trends, the review
 * rounds and the safety centre as before. Given through the product's own `setHeadDuty` as the school's head, in a
 * session made for the call (userAgent "zz-walk") and deleted after it, as demo-schools.ts's office acts: audited
 * `people.headDuty.set`, the admin told once. Idempotent: an admin already holding it is left alone and nothing is
 * written. A school with no active head is skipped (every admin holds the pages there by the vacancy rule).
 */
const HEAD_PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;

/**
 * owner-batch-item13 (1 Nov 2026): `except` names admins (by address) the head does NOT give the pages to — ZZ
 * Northgate's second admin, the API sweep's variant without the head's pages (scripts/sweep-sessions.ts), who must stay
 * without them on every run of zz:fixtures.
 */
export async function giveHeadPages(db: PrismaClient, schoolId: string, opts: { except?: readonly string[] } = {}): Promise<{ given: number; already: number; noHead: boolean }> {
  const head = await db.membership.findFirst({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, orderBy: { joinedAt: "asc" }, select: { id: true, user: { select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } } } });
  if (!head) return { given: 0, already: 0, noHead: true };
  const admins = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null, ...(opts.except?.length ? { NOT: { user: { email: { in: [...opts.except] } } } } : {}) }, select: { id: true, dutiesJson: true } });
  const waiting = admins.filter((a) => !parseAdminDuties(a.dutiesJson).includes("HEAD_PAGES"));
  if (waiting.length === 0) return { given: 0, already: admins.length, noHead: false };
  const u = head.user;
  const session = await db.session.create({ data: { userId: u.id, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: schoolId, activeRole: "PRINCIPAL", userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  try {
    const ctx = { sessionId: session.id, membershipId: head.id, schoolId, role: "PRINCIPAL", user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: HEAD_PREFS } } as unknown as ActiveContext;
    for (const a of waiting) await setHeadDuty(ctx, a.id, true);
  } finally {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
  }
  return { given: waiting.length, already: admins.length - waiting.length, noHead: false };
}

/** The roster's words for an admin who holds them (docs/demo-schools.md). */
export const HEAD_PAGES_NOTE = "; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety";
