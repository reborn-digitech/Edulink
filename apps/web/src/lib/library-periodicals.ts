import "server-only";
import type { LibraryVolumeSave, PeriodicalSubscriptionSave, PeriodicalView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { assertModuleOn } from "./modules";
import { todayKey } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * PERIODICALS AS SUBSCRIPTIONS WITH VOLUMES (G4-21, risks batch 5 Oct 2026; 08 said "add when a librarian asks", and
 * the owner asked for everything). A title of category PERIODICAL — a journal, a magazine, a newspaper — carries its
 * subscription (how often it comes, PERIODICAL_FREQUENCIES, and the days it runs) and the volumes and issues the
 * library received (LibraryVolume, one row per volume and issue, the day it came). A book refuses both. The copies a
 * library lends stay LibraryCopy rows, as before; a volume is a record of receipt, not a loan. The desk (LIBRARIAN,
 * ADMIN) writes; the head reads. Every write audited (library.subscription.save, library.volume.add|remove).
 */

const DESK: readonly Role[] = ["LIBRARIAN", "ADMIN"];
const DESK_READ: readonly Role[] = ["LIBRARIAN", "ADMIN", "PRINCIPAL"];

type Desk = { schoolId: string; userId: string; role: Role };

async function deskOf(ctx: ActiveContext, roles: readonly Role[]): Promise<Desk> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "LIBRARY");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role };
}

async function titleOf(desk: Desk, titleId: string) {
  const title = await db.libraryTitle.findFirst({ where: { id: titleId, schoolId: desk.schoolId }, select: { id: true, title: true, category: true, frequency: true, subscriptionFrom: true, subscriptionUntil: true } });
  if (!title) throw new AccessError("library.refuseNoTitle", "NOT_FOUND");
  return title;
}

/** A book is no periodical: 409 with the sentence. */
function assertPeriodical(category: string, key: "riskDecisions.refuseVolumeNotPeriodical" | "riskDecisions.refuseSubscriptionOnBook"): void {
  if (category !== "PERIODICAL") throw new RuleRefusal(key, 409);
}

async function view(desk: Desk, titleId: string): Promise<PeriodicalView> {
  const title = await titleOf(desk, titleId);
  const zone = (await db.school.findUnique({ where: { id: desk.schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  const today = todayKey(zone);
  const volumes = await db.libraryVolume.findMany({ where: { titleId: title.id, schoolId: desk.schoolId }, orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }], take: 500, select: { id: true, volume: true, issue: true, receivedOn: true } });
  const subscribed = title.frequency !== null;
  const active = subscribed && (title.subscriptionFrom === null || title.subscriptionFrom <= today) && (title.subscriptionUntil === null || title.subscriptionUntil >= today);
  return {
    titleId: title.id,
    title: title.title,
    frequency: title.frequency as PeriodicalView["frequency"],
    subscriptionFrom: title.subscriptionFrom,
    subscriptionUntil: title.subscriptionUntil,
    active,
    volumes,
    canEdit: DESK.includes(desk.role) && title.category === "PERIODICAL",
  };
}

/** GET /api/v1/library/titles/{titleId}/volumes — a periodical's subscription and volumes; a book reads with none. */
export async function periodicalView(ctx: ActiveContext, titleId: string): Promise<PeriodicalView> {
  return view(await deskOf(ctx, DESK_READ), titleId);
}

/** POST /api/v1/library/titles/{titleId}/subscription — how often it comes and the days the subscription runs. */
export async function savePeriodicalSubscription(ctx: ActiveContext, titleId: string, input: PeriodicalSubscriptionSave): Promise<PeriodicalView> {
  const desk = await deskOf(ctx, DESK);
  const title = await titleOf(desk, titleId);
  assertPeriodical(title.category, "riskDecisions.refuseSubscriptionOnBook");
  if (input.subscriptionFrom && input.subscriptionUntil && input.subscriptionUntil < input.subscriptionFrom) throw new RuleRefusal("riskDecisions.refuseSubscriptionWindow", 422, undefined, "subscriptionUntil");
  await db.libraryTitle.update({ where: { id: title.id }, data: { frequency: input.frequency, subscriptionFrom: input.subscriptionFrom, subscriptionUntil: input.subscriptionUntil } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.subscription.save", targetType: "LibraryTitle", targetId: title.id, meta: { frequency: input.frequency, from: input.subscriptionFrom, until: input.subscriptionUntil } });
  return view(desk, title.id);
}

/** POST /api/v1/library/titles/{titleId}/volumes — a volume (and issue) received; the same volume and issue twice is refused. */
export async function addVolume(ctx: ActiveContext, titleId: string, input: LibraryVolumeSave): Promise<PeriodicalView> {
  const desk = await deskOf(ctx, DESK);
  const title = await titleOf(desk, titleId);
  assertPeriodical(title.category, "riskDecisions.refuseVolumeNotPeriodical");
  const volume = input.volume.trim();
  const issue = (input.issue ?? "").trim();
  let id: string;
  try {
    id = (await db.libraryVolume.create({ data: { schoolId: desk.schoolId, titleId: title.id, volume, issue, receivedOn: input.receivedOn, createdByUserId: desk.userId }, select: { id: true } })).id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new RuleRefusal("riskDecisions.refuseVolumeTaken", 409, undefined, "volume");
    throw error;
  }
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.volume.add", targetType: "LibraryVolume", targetId: id, meta: { titleId: title.id, volume, issue, receivedOn: input.receivedOn } });
  return view(desk, title.id);
}

/** DELETE /api/v1/library/titles/{titleId}/volumes/{volumeId} — the librarian's correction of a volume recorded by mistake. */
export async function removeVolume(ctx: ActiveContext, titleId: string, volumeId: string): Promise<PeriodicalView> {
  const desk = await deskOf(ctx, DESK);
  const title = await titleOf(desk, titleId);
  const row = await db.libraryVolume.findFirst({ where: { id: volumeId, titleId: title.id, schoolId: desk.schoolId }, select: { id: true, volume: true, issue: true } });
  if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  await db.libraryVolume.deleteMany({ where: { id: row.id, schoolId: desk.schoolId } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "library.volume.remove", targetType: "LibraryVolume", targetId: row.id, meta: { titleId: title.id, volume: row.volume, issue: row.issue } });
  return view(desk, title.id);
}
