import "server-only";
import { NextResponse } from "next/server";
import type { ActiveContext } from "@/lib/session";
import type { OperatorAuditQuery } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { accessHistory, getSchool, listAdminInvites, listAppAdmins, listServerAudit } from "@/lib/superuser";
import { actionKey } from "@/lib/safety-labels";
import { subscriptionViews } from "@/lib/subscriptions";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * The operator's writes and the reads that serve them, for /api/v1/operator.
 *
 * Every function here is the same lib call a /root page or action makes —
 * getSchool, listAdminInvites, accessHistory, listAppAdmins, listServerAudit —
 * shaped into the plain JSON the contract describes. The handlers have passed
 * requireApiOperator; the lib asserts the flag again, because that is where
 * the boundary lives.
 */

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** The web's /root/[schoolId]: the school's details, its admin invitations, and the visitor book the inside page shows. Null when there is no such school. */
export async function operatorSchoolDetail(ctx: ActiveContext, schoolId: string) {
  const school = await getSchool(ctx, schoolId);
  if (!school) return null;
  // Read without binding the school: the OperatorAccess policy lets the
  // operator read these rows directly, so opening this page records no visit —
  // the web's school page records none either; only looking inside does.
  const [invites, access] = await Promise.all([listAdminInvites(ctx, schoolId), accessHistory(schoolId, 20)]);
  // The commercial record (2026-10-02): the subscription, the contact and the partner, from the same row.
  const partner = school.commissionPartnerId ? await db.commissionPartner.findUnique({ where: { id: school.commissionPartnerId }, select: { id: true, name: true, percentTenths: true } }) : null;
  const views = subscriptionViews({ ...school, commissionPartner: partner });
  return {
    school: {
      id: school.id,
      name: school.name,
      code: school.code,
      contactEmail: school.contactEmail,
      contactPhone: school.contactPhone,
      website: school.website,
      addressLine: school.addressLine,
      city: school.city,
      region: school.region,
      postalCode: school.postalCode,
      country: school.country,
      gradeLow: school.gradeLow,
      gradeHigh: school.gradeHigh,
      timezone: school.timezone,
      createdAt: iso(school.createdAt),
      removedAt: isoOrNull(school.removedAt),
      verifiedAt: isoOrNull(school.verifiedAt),
    },
    invites: invites.map((i) => ({ id: i.id, email: i.email, name: i.name, role: i.role, status: i.status, createdAt: iso(i.createdAt), expiresAt: iso(i.expiresAt) })),
    access: access.map((a) => ({ id: a.id, operatorName: a.operatorName, reason: a.reason, startedAt: iso(a.startedAt), live: a.live })),
    subscription: views.subscription,
    contact: views.contact,
    commission: views.commission,
  };
}

/** The web's /root/content-team list. */
export async function operatorContentTeam(ctx: ActiveContext) {
  const admins = await listAppAdmins(ctx);
  return {
    items: admins.map((a) => ({ id: a.id, name: a.name, email: a.email, disabled: a.disabledAt !== null, isOperator: a.isSuperuser, you: a.id === ctx.user.id })),
  };
}

/** A day key as the web's audit page reads it: the start of that UTC day, or its last millisecond. */
function auditDay(raw: string | undefined, endOfDay = false): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** The web's /root/audit: one page of the server log under the same filters, each row's meta folded into one line. */
export async function operatorAuditPage(ctx: ActiveContext, query: OperatorAuditQuery) {
  const page = await listServerAudit(ctx, {
    action: query.action || undefined,
    q: query.q || undefined,
    from: auditDay(query.from),
    to: auditDay(query.to, true),
    liveActorsOnly: query.live === "1",
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
  return {
    items: page.rows.map((row) => ({
      id: row.id,
      at: iso(row.at),
      action: row.action,
      actionKey: actionKey(row.action),
      actorName: row.actorName,
      system: row.actorUserId === null,
      schoolName: text(row.meta.name),
      ip: row.ip,
      summary: [text(row.meta.email), text(row.meta.role), text(row.meta.reason)].filter((s): s is string => s !== null).join(" · ") || null,
    })),
    total: page.total,
    actions: page.actions,
  };
}

/**
 * A lib refusal as the phone reads it: "no such thing" is a 404 like any
 * other missing id; every other refusal is a 422 carrying the lib's sentence.
 *
 * NOT `async`, on purpose: the handlers write `return operatorRefused(result)`
 * inside their try, and an async function's throw is a rejected promise that
 * a returned-but-not-awaited call carries straight past the catch — the 404
 * escaped as an unhandled AccessError. Thrown synchronously, apiFailure sees it.
 */
const NOT_FOUND: TranslationKey[] = ["root.noSuchSchool", "root.noSuchExpert", "root.noSuchPlan", "root.noSuchPartner"];
export function operatorRefused(result: { errorKey?: TranslationKey }): Promise<NextResponse> {
  if (result.errorKey && NOT_FOUND.includes(result.errorKey)) throw new AccessError(result.errorKey, "NOT_FOUND");
  return apiRefused({ errorKey: result.errorKey ?? "root.didNotWork" });
}
