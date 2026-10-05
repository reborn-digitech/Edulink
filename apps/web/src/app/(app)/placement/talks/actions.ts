"use server";

import { talkRsvpSchema, talkSaveSchema, talkUpdateSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { answerTalk, createTalk, markTalkAttendance, updateTalk } from "@/lib/placement-talks";
import { schoolZone } from "@/lib/school-zone";
import { zonedStartOfDay } from "@/lib/dates";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The pre-placement talks' writes from the web (R-2, 5 Oct 2026): the TPO's
 * talk, its cancellation and its attendance; a student's answer. Who may make
 * each is lib/placement-talks.ts's to decide. Only async functions exported.
 */

/** "YYYY-MM-DDTHH:mm" in the school's zone as an instant (the zones the app serves keep no summer time). */
async function instantOf(raw: string, schoolId: string | null): Promise<string> {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(raw);
  if (!m) throw new RuleRefusal("refusal.notValid", 422, undefined, "startsAt");
  const start = zonedStartOfDay(m[1]!, await schoolZone(schoolId));
  return new Date(start.getTime() + (Number(m[2]) * 60 + Number(m[3])) * 60_000).toISOString();
}

export async function createTalkAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      const capacity = field(form, "capacity");
      await createTalk(ctx, talkSaveSchema.parse({ title: field(form, "title"), companyName: field(form, "companyName"), driveId: field(form, "driveId") || null, startsAt: await instantOf(field(form, "startsAt"), ctx.schoolId), durationMinutes: intField(form, "durationMinutes") || 60, venue: field(form, "venue"), note: field(form, "note"), capacity: capacity ? intField(form, "capacity") : null }));
      return "talks.created";
    },
    { revalidate: ["/placement/talks"] },
  );
}

export async function cancelTalkAction(previous: FormState, form: FormData): Promise<FormState> {
  const talkId = field(form, "talkId");
  return answerForm(
    previous,
    form,
    async () => {
      await updateTalk(await requireApiUser(), talkId, talkUpdateSchema.parse({ status: field(form, "status") === "SCHEDULED" ? "SCHEDULED" : "CANCELLED" }));
      return field(form, "status") === "SCHEDULED" ? "talks.restored" : "talks.cancelled";
    },
    { revalidate: ["/placement/talks", `/placement/talks/${talkId}`] },
  );
}

/** Ticked is PRESENT; a student who answered or was marked and is not ticked is ABSENT; nobody else is touched. */
export async function markTalkAction(previous: FormState, form: FormData): Promise<FormState> {
  const talkId = field(form, "talkId");
  return answerForm(
    previous,
    form,
    async () => {
      const present = new Set(form.getAll("present").map(String));
      const known = form.getAll("known").map(String);
      const marks = [...new Set([...present, ...known])].map((studentMembershipId) => ({ studentMembershipId, attendance: present.has(studentMembershipId) ? ("PRESENT" as const) : ("ABSENT" as const) }));
      if (!marks.length) throw new RuleRefusal("talks.chooseStudents", 422);
      const r = await markTalkAttendance(await requireApiUser(), talkId, { marks });
      return { key: "talks.marked", vars: { count: r.saved } };
    },
    { revalidate: [`/placement/talks/${talkId}`, "/placement/talks"] },
  );
}

export async function answerTalkAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const { answer } = talkRsvpSchema.parse({ answer: field(form, "answer") });
      await answerTalk(await requireApiUser(), field(form, "talkId"), answer);
      return answer === "GOING" ? "talks.answeredGoing" : "talks.answeredNotGoing";
    },
    { revalidate: ["/student/placement/talks", "/student/placement"] },
  );
}
