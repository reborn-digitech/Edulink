import "server-only";
import type { AntiRaggingRegister } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertCollege, assertModuleOn, isModuleOn } from "./modules";
import { requireDuty } from "./duties";
import { todayKey } from "./dates";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";

/**
 * THE ANTI-RAGGING REGISTER (the duties framework's model duty, 5 October
 * 2026): what a member of the college's anti-ragging squad (the duty
 * ANTI_RAGGING_SQUAD on a FACULTY or HOD) reads — the UGC's 2009 regulations
 * ask a college to keep a squad that makes surprise rounds of the hostels and
 * the campus, and a committee that hears complaints.
 *
 *   - the hostel squad's rounds, as the warden logs them (college-campus.ts),
 *     while the college keeps its hostel in the app: when, which hostel, who
 *     went, whether something was found — the round's note stays with the
 *     warden and the office;
 *   - the complaints that went to the anti-ragging committee (a student's
 *     grievance of kind RAGGING, iqac.ts): that each exists, when it was
 *     filed, its state and its due day — never its words, its attachment or
 *     who filed it, which the office and the head read on the grievance desk;
 *   - the committee itself, by name and members.
 *
 * Read by the squad member, and by the office and the head, who oversee the
 * squad. Under module IQAC (the grievance desk's), at a college. Nothing is
 * stored; nothing here writes.
 */
const DAY_MS = 86_400_000;

export async function antiRaggingRegister(ctx: ActiveContext, now: Date = new Date()): Promise<AntiRaggingRegister> {
  if (!ctx.schoolId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    if (ctx.role !== "FACULTY" && ctx.role !== "HOD") throw new AccessError("access.wrongRoleForThisAction");
    await requireDuty(ctx, "ANTI_RAGGING_SQUAD");
  }
  const schoolId = ctx.schoolId;
  await assertCollege(schoolId);
  await assertModuleOn(schoolId, "IQAC");
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone, now);
  const hostelOn = await isModuleOn(schoolId, "HOSTEL");
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [rounds, complaints, committee] = await Promise.all([
    hostelOn
      ? db.hostelSquadRound.findMany({ where: { schoolId }, orderBy: { at: "desc" }, take: 100, select: { id: true, at: true, members: true, flagged: true, hostel: { select: { name: true } } } })
      : Promise.resolve([]),
    db.grievance.findMany({ where: { schoolId, committeeKind: "ANTI_RAGGING" }, orderBy: { filedAt: "desc" }, take: 200, select: { id: true, filedAt: true, status: true, dueOn: true } }),
    db.committee.findFirst({ where: { schoolId, kind: "ANTI_RAGGING" }, orderBy: { createdAt: "asc" }, select: { name: true, membersJson: true } }),
  ]);
  const items = complaints.map((g) => {
    const status = (["OPEN", "ACKNOWLEDGED", "RESOLVED", "ESCALATED"].includes(g.status) ? g.status : "OPEN") as AntiRaggingRegister["complaints"][number]["status"];
    return { id: g.id, filedOn: todayKey(school.timezone, g.filedAt), status, dueOn: g.dueOn, overdue: (status === "OPEN" || status === "ACKNOWLEDGED") && g.dueOn < today };
  });
  return {
    today,
    hostelOn,
    committee: committee ? { name: committee.name, members: readJsonArray<{ name: string; role?: string }>(committee.membersJson).map((m) => (m.role ? `${m.name} (${m.role})` : m.name)) } : null,
    rounds: rounds.map((r) => ({ id: r.id, hostelName: r.hostel.name, at: r.at.toISOString(), members: r.members, flagged: r.flagged })),
    complaints: items,
    summary: {
      rounds30: rounds.filter((r) => r.at >= since).length,
      flagged30: rounds.filter((r) => r.at >= since && r.flagged).length,
      open: items.filter((g) => g.status === "OPEN" || g.status === "ACKNOWLEDGED").length,
      overdue: items.filter((g) => g.overdue).length,
    },
  };
}
