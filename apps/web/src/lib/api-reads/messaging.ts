import "server-only";
import { db } from "@/lib/db";
import type { ActiveContext } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { broadcastDetail, listBroadcasts, messagingOverview, type BroadcastRow, type MessageRow } from "@/lib/messaging";
import { MESSAGE_TEMPLATES, type MessageTemplateKey } from "@/lib/message-templates";

/** The reads behind /api/v1/messaging in the contract's shape: ISO dates, plus the template texts and the classes and grades a notice can aim at. */
const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);
const broadcast = (b: BroadcastRow) => ({ ...b, createdAt: iso(b.createdAt), doneAt: isoOrNull(b.doneAt) });
const message = (m: MessageRow) => ({ ...m, createdAt: iso(m.createdAt), sentAt: isoOrNull(m.sentAt), deliveredAt: isoOrNull(m.deliveredAt) });

export async function messagingOverviewRead(ctx: ActiveContext) {
  if (!ctx.schoolId) throw new AccessError("messaging.refuseOffice");
  const [o, classes, grades] = await Promise.all([
    messagingOverview(ctx),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } }),
    db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, gradeLevel: { not: null } }, select: { gradeLevel: true }, distinct: ["gradeLevel"] }),
  ]);
  return {
    ...o,
    templates: o.templates.map((t) => ({ ...t, text: MESSAGE_TEMPLATES[t.key as MessageTemplateKey].text })),
    recent: o.recent.map(broadcast),
    recentMessages: o.recentMessages.map(message),
    classes,
    grades: grades.map((g) => g.gradeLevel!).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
  };
}

export async function broadcastsRead(ctx: ActiveContext) {
  return { broadcasts: (await listBroadcasts(ctx, 100)).map(broadcast) };
}

export async function broadcastDetailRead(ctx: ActiveContext, broadcastId: string) {
  const d = await broadcastDetail(ctx, broadcastId);
  return { broadcast: broadcast(d.broadcast), messages: d.messages.map(message) };
}
