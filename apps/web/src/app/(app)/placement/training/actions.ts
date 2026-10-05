"use server";

import { trainingSaveSchema, trainingSessionSaveSchema, trainingUpdateSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { addTrainingSession, createTraining, enrolSelf, markTrainingSession, setEnrolment, setSessionCancelled, updateTraining } from "@/lib/soft-skills";
import { schoolZone } from "@/lib/school-zone";
import { zonedStartOfDay } from "@/lib/dates";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * Soft-skills training's writes from the web (R-2, 5 Oct 2026): the TPO's
 * training, sessions, roll and marks; a student's enrolment. Who may make
 * each is lib/soft-skills.ts's to decide. Only async functions exported.
 */

async function instantOf(raw: string, schoolId: string | null): Promise<string> {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(raw);
  if (!m) throw new RuleRefusal("refusal.notValid", 422, undefined, "startsAt");
  const start = zonedStartOfDay(m[1]!, await schoolZone(schoolId));
  return new Date(start.getTime() + (Number(m[2]) * 60 + Number(m[3])) * 60_000).toISOString();
}
const page = (id: string) => `/placement/training/${id}`;

export async function createTrainingAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const capacity = field(form, "capacity");
      await createTraining(await requireApiUser(), trainingSaveSchema.parse({ title: field(form, "title"), skill: field(form, "skill"), trainer: field(form, "trainer"), description: field(form, "description"), capacity: capacity ? intField(form, "capacity") : null, minAttendancePercent: intField(form, "minAttendancePercent") || 75 }));
      return "softSkills.created";
    },
    { revalidate: ["/placement/training"] },
  );
}

export async function setTrainingStatusAction(previous: FormState, form: FormData): Promise<FormState> {
  const id = field(form, "trainingId");
  return answerForm(
    previous,
    form,
    async () => {
      await updateTraining(await requireApiUser(), id, trainingUpdateSchema.parse({ status: field(form, "status") }));
      return field(form, "status") === "OPEN" ? "softSkills.opened" : "softSkills.closed";
    },
    { revalidate: [page(id), "/placement/training"] },
  );
}

export async function addSessionAction(previous: FormState, form: FormData): Promise<FormState> {
  const id = field(form, "trainingId");
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      await addTrainingSession(ctx, id, trainingSessionSaveSchema.parse({ startsAt: await instantOf(field(form, "startsAt"), ctx.schoolId), durationMinutes: intField(form, "durationMinutes") || 60, topic: field(form, "topic"), venue: field(form, "venue") }));
      return "softSkills.sessionAdded";
    },
    { revalidate: [page(id)] },
  );
}

export async function cancelSessionAction(previous: FormState, form: FormData): Promise<FormState> {
  const id = field(form, "trainingId");
  return answerForm(
    previous,
    form,
    async () => {
      const cancelled = field(form, "cancelled") === "true";
      await setSessionCancelled(await requireApiUser(), id, field(form, "sessionId"), cancelled);
      return cancelled ? "softSkills.sessionCancelled" : "softSkills.sessionRestored";
    },
    { revalidate: [page(id)] },
  );
}

export async function enrolStudentsAction(previous: FormState, form: FormData): Promise<FormState> {
  const id = field(form, "trainingId");
  return answerForm(
    previous,
    form,
    async () => {
      const ids = form.getAll("student").map(String).filter(Boolean);
      if (!ids.length) throw new RuleRefusal("softSkills.chooseStudents", 422, undefined, "student");
      const remove = field(form, "remove") === "true";
      await setEnrolment(await requireApiUser(), id, { studentMembershipIds: ids, remove });
      return { key: remove ? "softSkills.unenrolled" : "softSkills.enrolled", vars: { count: ids.length } };
    },
    { revalidate: [page(id)] },
  );
}

/** Ticked is present, the rest of the roll absent. */
export async function markSessionAction(previous: FormState, form: FormData): Promise<FormState> {
  const id = field(form, "trainingId");
  return answerForm(
    previous,
    form,
    async () => {
      const present = new Set(form.getAll("present").map(String));
      const roll = form.getAll("roll").map(String);
      if (!roll.length) throw new RuleRefusal("softSkills.chooseStudents", 422);
      const r = await markTrainingSession(await requireApiUser(), id, field(form, "sessionId"), { marks: roll.map((studentMembershipId) => ({ studentMembershipId, present: present.has(studentMembershipId) })) });
      return { key: "softSkills.marked", vars: { count: r.saved } };
    },
    { revalidate: [page(id), "/placement/training"] },
  );
}

export async function enrolSelfAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const enrol = field(form, "enrol") === "true";
      await enrolSelf(await requireApiUser(), field(form, "trainingId"), enrol);
      return enrol ? "softSkills.youEnrolled" : "softSkills.youWithdrew";
    },
    { revalidate: ["/student/placement/training", "/student/placement"] },
  );
}
