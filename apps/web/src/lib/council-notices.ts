import "server-only";
import type { StudentCouncilNoticeSave, StudentCouncilSave, StudentCouncilView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { readJsonArray } from "./json";
import { createPost } from "./bulletin";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * STUDENT COUNCIL NOTICES (R-2 / A3-inventory-10, the risks batch of 5 October
 * 2026; migration 20261005230101_council_notices).
 *
 * THE COUNCIL is a Committee of kind STUDENT_COUNCIL, one per school, kept by
 * the office here — `saveCouncil` is its one writer: the IQAC committee page
 * names members as text, and refuses this kind, because a council member's
 * right to post is read from the membership ids kept here.
 *
 * A NOTICE is a bulletin post of category COUNCIL with `authorCommitteeId`
 * set, written through `postCouncilNotice` by a member of the council or by
 * the office on its behalf, and nowhere else (createPost refuses the category
 * without the council). Everything after is the bulletin's: a student's notice
 * waits for the office's review like any student post; the office's is live at
 * once and may be narrowed to families, staff or students; readers find it by
 * the bulletin's audience rules; the feed and the post sign it with the
 * council's name (the review desk sees the writer beside it).
 */

const READ: readonly Role[] = ["STUDENT", "ADMIN", "PRINCIPAL"];
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Member = { name: string; role: string; membershipId: string | null };

function callerOf(ctx: ActiveContext, roles: readonly Role[]) {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id };
}

/** The school's council, if the office has named one. */
async function councilAt(schoolId: string) {
  const row = await db.committee.findFirst({ where: { schoolId, kind: "STUDENT_COUNCIL" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, membersJson: true } });
  return row ? { id: row.id, name: row.name, members: readJsonArray<Member>(row.membersJson) } : null;
}

/** The council and what the reader may do: a member or the office posts; the office keeps it. */
export async function councilView(ctx: ActiveContext): Promise<StudentCouncilView> {
  const c = callerOf(ctx, READ);
  const council = await councilAt(c.schoolId);
  const ids = (council?.members ?? []).map((m) => m.membershipId).filter((x): x is string => Boolean(x));
  const people = ids.length ? await db.membership.findMany({ where: { id: { in: ids }, schoolId: c.schoolId }, select: { id: true, status: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } }) : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  const isMember = Boolean(council?.members.some((m) => m.membershipId === c.membershipId && byId.get(m.membershipId)?.status === "ACTIVE"));
  return {
    council: council
      ? {
          id: council.id,
          name: council.name,
          members: council.members.flatMap((m) => {
            const p = m.membershipId ? byId.get(m.membershipId) : undefined;
            return p ? [{ membershipId: p.id, name: p.user.preferredName ?? p.user.name, role: m.role, className: p.enrollments[0]?.class.name ?? null }] : [];
          }),
        }
      : null,
    canPost: Boolean(council) && (OFFICE.includes(c.role) || (c.role === "STUDENT" && isMember)),
    canKeep: c.role === "ADMIN",
  };
}

/**
 * The office names the council and its members, by student code; the same
 * set again changes nothing. A code that names no student on the roll here is
 * refused and said. Audited council.save.
 */
export async function saveCouncil(ctx: ActiveContext, input: StudentCouncilSave): Promise<StudentCouncilView> {
  const c = callerOf(ctx, ["ADMIN"]);
  const codes = [...new Set(input.members.map((m) => m.code.trim()))];
  const students = await db.membership.findMany({ where: { schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE", studentCode: { in: codes, mode: "insensitive" } }, select: { id: true, studentCode: true, user: { select: { name: true } } } });
  const byCode = new Map(students.map((s) => [(s.studentCode ?? "").toUpperCase(), s]));
  const unknown = codes.filter((code) => !byCode.has(code.toUpperCase()));
  if (unknown.length) throw new RuleRefusal("councilNotices.refuseUnknownCode", 422, { codes: unknown.join(", ") }, "members");
  const seen = new Set<string>();
  const members: Member[] = [];
  for (const m of input.members) {
    const s = byCode.get(m.code.trim().toUpperCase())!;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    members.push({ name: s.user.name, role: m.role, membershipId: s.id });
  }
  const membersJson = JSON.stringify(members);
  const existing = await db.committee.findFirst({ where: { schoolId: c.schoolId, kind: "STUDENT_COUNCIL" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, membersJson: true } });
  if (existing && existing.name === input.name && existing.membersJson === membersJson) return councilView(ctx);
  const id = existing
    ? (await db.committee.update({ where: { id: existing.id }, data: { name: input.name, membersJson }, select: { id: true } })).id
    : (await db.committee.create({ data: { schoolId: c.schoolId, kind: "STUDENT_COUNCIL", name: input.name, membersJson }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "council.save", targetType: "Committee", targetId: id, meta: { members: members.length, created: !existing } });
  return councilView(ctx);
}

/** A notice signed by the council: a member's waits for the office's review, the office's is live. */
export async function postCouncilNotice(ctx: ActiveContext, input: StudentCouncilNoticeSave): Promise<{ postId: string; status: "PENDING" | "APPROVED" }> {
  const c = callerOf(ctx, READ);
  const view = await councilView(ctx);
  if (!view.council) throw new RuleRefusal("councilNotices.refuseNoCouncil", 409);
  if (!view.canPost) throw new AccessError("councilNotices.refuseNotMember");
  const created = await createPost(ctx, {
    scope: "SCHOOL",
    title: input.title,
    body: input.body,
    tags: [],
    media: [],
    category: "COUNCIL",
    // A student's post is for everyone (createPost holds that); the office may narrow the council's notice.
    audience: OFFICE.includes(c.role) ? input.audience : "ALL",
    authorCommitteeId: view.council.id,
  });
  return { postId: created.postId, status: created.status === "APPROVED" ? "APPROVED" : "PENDING" };
}
