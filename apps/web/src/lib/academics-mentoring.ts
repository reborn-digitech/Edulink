import "server-only";
import type { Mentoring } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { academicsCaller, academicsSettings, departmentOfMember, hodDepartment, nameOf, namesOf, type Caller } from "./academics";
import type { ActiveContext } from "./session";

/**
 * MENTORING (the college's academics, 4 October 2026): a faculty mentor's
 * group of students for a term — no more than the college's mentees per
 * mentor (twenty, as NAAC asks) — and the mentor's notes on each, flagged
 * when a student is a slow or an advanced learner or was referred to
 * counselling (the counts NAAC asks for). The HOD forms their department's
 * groups (the office any); a mentor writes notes on their own group; a
 * student sees who mentors them and nothing of the notes.
 */

type GroupRow = { id: string; name: string; termId: string; facultyMembershipId: string; members: { studentMembershipId: string; student: { user: { name: string; preferredName: string | null } } }[]; notes: { id: string; studentMembershipId: string; note: string; flag: string; at: Date }[] };

async function view(groups: GroupRow[], withNotes: boolean): Promise<Mentoring["groups"]> {
  const names = await namesOf(groups.map((g) => g.facultyMembershipId));
  return groups.map((g) => {
    const nameBy = new Map(g.members.map((m) => [m.studentMembershipId, nameOf(m.student.user)]));
    const latest = new Map<string, string>();
    for (const n of [...g.notes].sort((a, b) => a.at.getTime() - b.at.getTime())) latest.set(n.studentMembershipId, n.flag);
    return {
      id: g.id,
      name: g.name,
      termId: g.termId,
      facultyMembershipId: g.facultyMembershipId,
      facultyName: names.get(g.facultyMembershipId) ?? "",
      members: g.members.map((m) => ({ studentMembershipId: m.studentMembershipId, name: nameBy.get(m.studentMembershipId) ?? "", flag: (withNotes ? (latest.get(m.studentMembershipId) ?? "NONE") : "NONE") as "NONE" })).sort((a, b) => a.name.localeCompare(b.name)),
      notes: withNotes ? g.notes.map((n) => ({ id: n.id, studentMembershipId: n.studentMembershipId, studentName: nameBy.get(n.studentMembershipId) ?? "", note: n.note, flag: n.flag as "NONE", at: n.at.toISOString() })).sort((a, b) => b.at.localeCompare(a.at)) : [],
    };
  });
}

const GROUP_SELECT = { id: true, name: true, termId: true, facultyMembershipId: true, members: { select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }, notes: { select: { id: true, studentMembershipId: true, note: true, flag: true, at: true }, orderBy: { at: "desc" as const }, take: 200 } } as const;

export async function mentoringView(ctx: ActiveContext): Promise<Mentoring> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD", "STUDENT", "ADMIN", "PRINCIPAL"]);
  return mentoringFor(c);
}

export async function mentoringFor(c: Caller): Promise<Mentoring> {
  if (c.role === "STUDENT") {
    const groups = await db.mentoringGroup.findMany({ where: { schoolId: c.schoolId, members: { some: { studentMembershipId: c.membershipId } } }, select: { ...GROUP_SELECT, members: { where: { studentMembershipId: c.membershipId }, select: GROUP_SELECT.members.select } }, orderBy: { createdAt: "desc" } });
    return { groups: await view(groups, false), canOrganise: false };
  }
  let where: Record<string, unknown> = { schoolId: c.schoolId };
  if (c.role === "FACULTY") where = { ...where, facultyMembershipId: c.membershipId };
  if (c.role === "HOD") {
    const dept = await hodDepartment(c);
    const inDept = dept ? (await db.departmentFaculty.findMany({ where: { departmentId: dept.id }, select: { membershipId: true } })).map((d) => d.membershipId) : [];
    where = { ...where, facultyMembershipId: { in: [...inDept, c.membershipId] } };
  }
  const groups = await db.mentoringGroup.findMany({ where, select: GROUP_SELECT, orderBy: { createdAt: "desc" }, take: 100 });
  return { groups: await view(groups, true), canOrganise: c.role === "HOD" || c.role === "ADMIN" };
}

/** A group formed or changed: the HOD for their department's faculty, the office for anyone. The mentor is told. */
export async function saveMentoringGroup(ctx: ActiveContext, input: { id?: string; termId: string; facultyMembershipId: string; name: string; studentMembershipIds: string[] }): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["HOD", "ADMIN"]);
  const [term, mentor, settings] = await Promise.all([
    db.academicTerm.findFirst({ where: { id: input.termId, schoolId: c.schoolId }, select: { id: true } }),
    db.membership.findFirst({ where: { id: input.facultyMembershipId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE" }, select: { id: true, userId: true } }),
    academicsSettings(c.schoolId),
  ]);
  if (!term) throw new RuleRefusal("academics.refuseUnknownTerm", 422, undefined, "termId");
  if (!mentor) throw new RuleRefusal("academics.refuseNotFaculty", 422, undefined, "facultyMembershipId");
  if (c.role === "HOD") {
    const dept = await hodDepartment(c);
    if (!dept || (await departmentOfMember(c.schoolId, mentor.id)) !== dept.id) throw new AccessError("academics.refuseOtherDepartment");
  }
  const ids = [...new Set(input.studentMembershipIds)];
  if (ids.length > settings.menteesPerMentor) throw new RuleRefusal("academics.refuseTooManyMentees", 422, { max: settings.menteesPerMentor }, "studentMembershipIds");
  const students = await db.membership.count({ where: { id: { in: ids }, schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE" } });
  if (students !== ids.length) throw new RuleRefusal("academics.refuseNotStudent", 422, undefined, "studentMembershipIds");
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    let groupId = input.id;
    if (groupId) {
      const g = await tx.mentoringGroup.findFirst({ where: { id: groupId, schoolId: c.schoolId }, select: { id: true } });
      if (!g) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      await tx.mentoringGroup.update({ where: { id: groupId }, data: { name: input.name, facultyMembershipId: mentor.id, termId: term.id } });
      await tx.mentoringMember.deleteMany({ where: { groupId, studentMembershipId: { notIn: ids } } });
    } else groupId = (await tx.mentoringGroup.create({ data: { schoolId: c.schoolId, facultyMembershipId: mentor.id, termId: term.id, name: input.name }, select: { id: true } })).id;
    await tx.mentoringMember.createMany({ data: ids.map((s) => ({ schoolId: c.schoolId, groupId: groupId!, studentMembershipId: s })), skipDuplicates: true });
    return groupId;
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.mentoring.group", targetType: "MentoringGroup", targetId: id, meta: { mentees: ids.length } });
  await notify({ userId: mentor.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "academics.notifyMentorTitle", bodyKey: "academics.notifyMentorBody", bodyVars: { name: input.name, count: ids.length }, url: "/faculty/mentoring" });
  return { id };
}

/** A mentor's note on one of their mentees (the HOD may write on their department's groups). */
export async function addMentoringNote(ctx: ActiveContext, input: { groupId: string; studentMembershipId: string; note: string; flag: string }): Promise<{ id: string }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const g = await db.mentoringGroup.findFirst({ where: { id: input.groupId, schoolId: c.schoolId }, select: { id: true, facultyMembershipId: true, members: { where: { studentMembershipId: input.studentMembershipId }, select: { id: true } } } });
  if (!g) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  let mine = g.facultyMembershipId === c.membershipId;
  if (!mine && c.role === "HOD") {
    const dept = await hodDepartment(c);
    mine = Boolean(dept) && (await departmentOfMember(c.schoolId, g.facultyMembershipId)) === dept!.id;
  }
  if (!mine) throw new AccessError("academics.refuseNotYours");
  if (!g.members.length) throw new RuleRefusal("academics.refuseNotMentee", 422, undefined, "studentMembershipId");
  const row = await db.mentoringNote.create({ data: { schoolId: c.schoolId, groupId: g.id, studentMembershipId: input.studentMembershipId, note: input.note, flag: input.flag, authorUserId: c.userId }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.mentoring.note", targetType: "MentoringGroup", targetId: g.id, meta: { flag: input.flag } });
  return row;
}
