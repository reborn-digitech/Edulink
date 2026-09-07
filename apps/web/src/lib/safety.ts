import "server-only";
import { db } from "./db";
import { readJson } from "./json";
import { notify } from "./notify";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";
import { URGENT_REASONS, type AuditEntry, type ReportGroup, type ReportTarget } from "./safety-labels";

// Re-exported so server code has one import site; client components must import
// from ./safety-labels directly (this module is server-only).
export type { AuditEntry, ReportGroup, ReportTarget };
export { reasonKey, actionKey, isSensitiveAction } from "./safety-labels";

/**
 * Safety centre.
 *
 * `Report.targetType` / `targetId` is a polymorphic pointer with no foreign key,
 * because a report can name a post, a comment or a person and Prisma cannot
 * express that as one relation. Two consequences the code has to own:
 *
 *   * the target must be resolved by hand, per type;
 *   * the target may be GONE — deleted, or in another school. A dangling report
 *     must render as "content no longer available" and still be dismissible,
 *     never as a crash or an empty card an admin cannot clear. (§5)
 *
 * Reports are grouped by target so three children reporting the same comment is
 * one thing to deal with, not three.
 */

export async function listReports(
  session: ActiveContext,
  status: "OPEN" | "ACTIONED" | "DISMISSED" = "OPEN",
): Promise<ReportGroup[]> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSeeTheSafety");
  }

  const reports = await db.report.findMany({
    where: { schoolId: session.schoolId, status },
    include: { reporter: { select: { name: true, preferredName: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Group by target so repeated reports of one thing are one decision.
  const groups = new Map<string, ReportGroup>();

  for (const report of reports) {
    const key = `${report.targetType}:${report.targetId}`;
    const existing = groups.get(key);

    const detail = {
      reason: report.reason,
      detail: report.detail ?? "",
      reporterName: report.reporter.preferredName ?? report.reporter.name,
      at: report.createdAt,
    };

    if (existing) {
      existing.reportIds.push(report.id);
      existing.count++;
      existing.details.push(detail);
      const reason = existing.reasons.find((r) => r.reason === report.reason);
      if (reason) reason.count++;
      else existing.reasons.push({ reason: report.reason, count: 1 });
      if (report.createdAt < existing.firstAt) existing.firstAt = report.createdAt;
      if (report.createdAt > existing.latestAt) existing.latestAt = report.createdAt;
      continue;
    }

    groups.set(key, {
      targetType: report.targetType as ReportGroup["targetType"],
      targetId: report.targetId,
      target: { kind: report.targetType as "POST", available: false },
      reportIds: [report.id],
      count: 1,
      reasons: [{ reason: report.reason, count: 1 }],
      details: [detail],
      firstAt: report.createdAt,
      latestAt: report.createdAt,
      status,
      resolutionNote: report.resolutionNote,
    });
  }

  // Resolve each target once, scoped to this school.
  await Promise.all(
    [...groups.values()].map(async (group) => {
      group.target = await resolveTarget(session.schoolId!, group.targetType, group.targetId);
    }),
  );

  return [...groups.values()].sort((a, b) => {
    const aUrgent = a.reasons.some((r) => URGENT_REASONS.has(r.reason));
    const bUrgent = b.reasons.some((r) => URGENT_REASONS.has(r.reason));
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    // Then most-reported, then newest.
    if (a.count !== b.count) return b.count - a.count;
    return b.latestAt.getTime() - a.latestAt.getTime();
  });
}

async function resolveTarget(
  schoolId: string,
  targetType: string,
  targetId: string,
): Promise<ReportTarget> {
  if (targetType === "POST") {
    const post = await db.post.findFirst({
      where: { id: targetId, schoolId },
      include: {
        author: { select: { name: true, preferredName: true } },
        authorship: { select: { role: true } },
      },
    });
    if (!post) return { kind: "POST", available: false };
    return {
      kind: "POST",
      available: true,
      title: post.title,
      body: post.body,
      status: post.status,
      authorName: post.author.preferredName ?? post.author.name,
      authorRole: post.authorship?.role ?? null,
      createdAt: post.createdAt,
      href: `/bulletin/${post.id}`,
    };
  }

  if (targetType === "COMMENT") {
    const comment = await db.comment.findFirst({
      where: { id: targetId, post: { schoolId } },
      include: {
        author: { select: { name: true, preferredName: true } },
        post: { select: { id: true, title: true } },
      },
    });
    if (!comment) return { kind: "COMMENT", available: false };
    return {
      kind: "COMMENT",
      available: true,
      body: comment.body,
      status: comment.status,
      authorName: comment.author.preferredName ?? comment.author.name,
      postTitle: comment.post.title,
      createdAt: comment.createdAt,
      href: `/bulletin/${comment.post.id}`,
    };
  }

  if (targetType === "USER") {
    // Only if they are in THIS school — an admin must not be handed a profile
    // from elsewhere just because someone pasted a reported id.
    //
    // SUSPENDED counts as being in the school. Filtering it out would make a
    // report about somebody vanish the moment an admin acted on it, which is
    // exactly the report they most need to still be able to read.
    const memberships = await db.membership.findMany({
      where: { userId: targetId, schoolId, status: { in: ["ACTIVE", "SUSPENDED"] } },
      include: { user: { select: { name: true, preferredName: true } } },
    });
    if (memberships.length === 0) return { kind: "USER", available: false };
    const name = memberships[0]!.user.preferredName ?? memberships[0]!.user.name;
    return {
      kind: "USER",
      available: true,
      name,
      roles: memberships.map((m) => m.role),
      // Straight to this person in the directory, where the pause control is,
      // rather than to the top of a list of five hundred.
      href: `/admin/people?q=${encodeURIComponent(name)}`,
      suspended: memberships.every((m) => m.status === "SUSPENDED"),
    };
  }

  return { kind: "POST", available: false };
}

export async function openReportCount(session: ActiveContext): Promise<number> {
  if (session.role !== "ADMIN" || !session.schoolId) return 0;
  const rows = await db.report.findMany({
    where: { schoolId: session.schoolId, status: "OPEN" },
    select: { targetType: true, targetId: true },
  });
  // Count distinct targets, matching what the queue actually shows.
  return new Set(rows.map((r) => `${r.targetType}:${r.targetId}`)).size;
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Takes down the reported content and closes every report against it.
 *
 * Posts become REJECTED with the note as the reason, which is the same field the
 * author already sees — so removal explains itself rather than the post silently
 * vanishing. Comments become REMOVED.
 */
export async function removeContent(
  session: ActiveContext,
  input: { targetType: "POST" | "COMMENT"; targetId: string; note: string },
): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId || !session.membershipId) {
    throw new AccessError("access.onlyAnAdminCanRemoveContent");
  }
  const note = input.note.trim();
  if (!note) throw new AccessError("access.writeANoteSoTheAuthorKnows");

  if (input.targetType === "POST") {
    const post = await db.post.findFirst({
      where: { id: input.targetId, schoolId: session.schoolId },
      select: { id: true, authorUserId: true, title: true },
    });
    if (!post) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");

    await db.post.update({
      where: { id: post.id },
      data: {
        status: "REJECTED",
        rejectionReason: note,
        reviewedAt: new Date(),
        reviewedByMembershipId: session.membershipId,
      },
    });

    await notify({
      userId: post.authorUserId,
      schoolId: session.schoolId,
      kind: "POST",
      titleKey: "notifTitle.postTakenDown",
      body: `${post.title} — ${note}`,
      url: "/bulletin?filter=mine",
    });
  } else {
    const comment = await db.comment.findFirst({
      where: { id: input.targetId, post: { schoolId: session.schoolId } },
      select: { id: true, authorUserId: true },
    });
    if (!comment) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");

    await db.comment.update({ where: { id: comment.id }, data: { status: "REMOVED" } });

    await notify({
      userId: comment.authorUserId,
      schoolId: session.schoolId,
      kind: "POST",
      titleKey: "notifTitle.commentRemoved",
      body: note,
      url: "/bulletin",
    });
  }

  await closeReports(session, input.targetType, input.targetId, "ACTIONED", note);
}

/** Closes the reports without touching the content. */
export async function dismissReports(
  session: ActiveContext,
  input: { targetType: "POST" | "COMMENT" | "USER"; targetId: string; note: string },
): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyAnAdminCanResolveReports");
  }
  const note = input.note.trim();
  if (!note) throw new AccessError("access.writeAShortNoteExplainingTheDecision");

  await closeReports(session, input.targetType, input.targetId, "DISMISSED", note);
}

async function closeReports(
  session: ActiveContext,
  targetType: string,
  targetId: string,
  status: "ACTIONED" | "DISMISSED",
  note: string,
): Promise<void> {
  // Scoped by schoolId: an admin cannot close another school's reports even
  // with a valid-looking target id.
  const result = await db.report.updateMany({
    where: { schoolId: session.schoolId, targetType, targetId, status: "OPEN" },
    data: { status, resolvedAt: new Date(), resolutionNote: note },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: status === "ACTIONED" ? "report.action" : "report.dismiss",
    targetType,
    targetId,
    meta: { closed: result.count, note },
  });
}

/* -------------------------------------------------------------------------- */
/* Audit log                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The school's audit trail.
 *
 * Deliberately read-only and school-scoped. It is the only way to answer "who
 * changed this child's grade" or "who exported the directory" after the fact,
 * so nothing in the app offers a way to edit or delete it.
 */
export async function listAudit(
  session: ActiveContext,
  opts: { action?: string; take?: number } = {},
): Promise<AuditEntry[]> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSeeTheAudit");
  }

  const rows = await db.auditLog.findMany({
    where: {
      schoolId: session.schoolId,
      ...(opts.action ? { action: { startsWith: opts.action } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.take ?? 200, 500),
  });

  // actorUserId has no relation (an actor may have left the school), so names
  // are looked up in one batch rather than per row.
  const actorIds = [...new Set(rows.map((r) => r.actorUserId).filter((id): id is string => Boolean(id)))];
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, preferredName: true },
  });
  const nameById = new Map(actors.map((a) => [a.id, a.preferredName ?? a.name]));

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actorUserId ? (nameById.get(row.actorUserId) ?? "Removed user") : "System",
    targetType: row.targetType,
    targetId: row.targetId,
    meta: readJson<Record<string, unknown>>(row.meta, {}),
    ip: row.ip,
    at: row.createdAt,
  }));
}
