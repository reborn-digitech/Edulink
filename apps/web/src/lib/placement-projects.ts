import "server-only";
import type { ProjectView } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { readJson, writeJson } from "./json";
import { nameOf } from "./placement";
import { hodStudents } from "./placement-internships";
import type { ActiveContext } from "./session";

/**
 * STUDENTS' PROJECTS WITH THEIR GUIDES (the placement module, 4 October
 * 2026): the HOD sets a project up with its students and a faculty guide (a
 * faculty member may set up one they guide themselves); the guide records the
 * reviews and, with the last, the marks. The HOD reads the college's, a
 * faculty member the ones they guide, a student their own.
 */

type Review = { on: string; byUserId: string; byName: string; note: string; marks: number | null };

async function viewsOf(rows: { id: string; title: string; guideMembershipId: string; studentMembershipIds: string; reviews: string; marks: number | null; createdAt: Date }[]): Promise<ProjectView[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.flatMap((r) => [r.guideMembershipId, ...readJson<string[]>(r.studentMembershipIds, [])]))];
  const members = await db.membership.findMany({ where: { id: { in: ids } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  const name = new Map(members.map((m) => [m.id, nameOf(m.user)]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    guideMembershipId: r.guideMembershipId,
    guideName: name.get(r.guideMembershipId) ?? "",
    students: readJson<string[]>(r.studentMembershipIds, []).map((id) => ({ membershipId: id, name: name.get(id) ?? "" })),
    reviews: readJson<Review[]>(r.reviews, []).map((x) => ({ on: x.on, byName: x.byName, note: x.note, marks: x.marks })),
    marks: r.marks,
    createdAt: r.createdAt.toISOString(),
  }));
}

async function staffOf(ctx: ActiveContext) {
  if (!ctx.schoolId || !ctx.membershipId || (ctx.role !== "HOD" && ctx.role !== "FACULTY")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, userId: ctx.user.id, role: ctx.role };
}

export async function listProjects(ctx: ActiveContext) {
  const me = await staffOf(ctx);
  const department = await hodStudents(me);
  const rows = await db.project.findMany({ where: { schoolId: me.schoolId, ...(me.role === "FACULTY" ? { guideMembershipId: me.membershipId } : {}) }, orderBy: { createdAt: "desc" }, take: 300 });
  // An HOD who heads a department reads its students' projects and the ones they guide themselves.
  const mine = department ? rows.filter((r) => r.guideMembershipId === me.membershipId || readJson<string[]>(r.studentMembershipIds, []).some((id) => department.has(id))) : rows;
  return { projects: await viewsOf(mine), canCreate: true };
}

export async function myProjects(studentMembershipId: string, schoolId: string): Promise<ProjectView[]> {
  const rows = await db.project.findMany({ where: { schoolId, studentMembershipIds: { contains: `"${studentMembershipId}"` } }, orderBy: { createdAt: "desc" } });
  return viewsOf(rows);
}

export async function createProject(ctx: ActiveContext, input: { title: string; guideMembershipId: string; studentMembershipIds: string[] }): Promise<ProjectView> {
  const me = await staffOf(ctx);
  if (me.role === "FACULTY" && input.guideMembershipId !== me.membershipId) throw new RuleRefusal("placement.refuseGuideSelf", 422, undefined, "guideMembershipId");
  const guide = await db.membership.findFirst({ where: { id: input.guideMembershipId, schoolId: me.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true } });
  if (!guide) throw new RuleRefusal("placement.refuseNeedSupervisor", 422, undefined, "guideMembershipId");
  const ids = [...new Set(input.studentMembershipIds)];
  const students = await db.membership.count({ where: { id: { in: ids }, schoolId: me.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
  if (students !== ids.length) throw new RuleRefusal("placement.refuseProjectStudents", 422, undefined, "studentMembershipIds");
  const row = await db.project.create({ data: { schoolId: me.schoolId, title: input.title, guideMembershipId: input.guideMembershipId, studentMembershipIds: writeJson(ids), createdByUserId: me.userId } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.project", targetType: "Project", targetId: row.id, meta: { students: ids.length } });
  return (await viewsOf([row]))[0]!;
}

/** The guide records a review; `final` with marks closes the project's marks (a later final review corrects them). */
export async function reviewProject(ctx: ActiveContext, id: string, input: { on: string; note: string; marks: number | null; final: boolean }): Promise<ProjectView> {
  const me = await staffOf(ctx);
  const row = await db.project.findFirst({ where: { id, schoolId: me.schoolId } });
  if (!row) throw new AccessError("placement.noSuchProject", "NOT_FOUND");
  if (row.guideMembershipId !== me.membershipId) throw new AccessError("placement.refuseNotGuide");
  if (input.final && input.marks === null) throw new RuleRefusal("placement.refuseFinalNeedsMarks", 422, undefined, "marks");
  const reviews = [...readJson<Review[]>(row.reviews, []), { on: input.on, byUserId: me.userId, byName: ctx.user.preferredName ?? ctx.user.name, note: input.note, marks: input.marks }];
  const updated = await db.project.update({ where: { id }, data: { reviews: writeJson(reviews), ...(input.final ? { marks: input.marks } : {}) } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.project.review", targetType: "Project", targetId: id, meta: { final: input.final, marks: input.marks } });
  return (await viewsOf([updated]))[0]!;
}

/** The college's faculty and HODs, for the guide and supervisor pickers. */
export async function supervisors(schoolId: string): Promise<{ membershipId: string; name: string; role: string }[]> {
  const rows = await db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, user: { select: { name: true, preferredName: true } } }, orderBy: { user: { name: "asc" } } });
  return rows.map((r) => ({ membershipId: r.id, name: nameOf(r.user), role: r.role }));
}
