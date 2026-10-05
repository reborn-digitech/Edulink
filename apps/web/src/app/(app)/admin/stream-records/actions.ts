"use server";

import { labBatchMoveSchema, labBatchSplitSchema, mootCourtSaveSchema, practicalSaveSchema, practicalSignSchema, MOOT_OUTCOMES } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { moveToLabBatch, saveMootCourt, savePracticals, signPracticals, splitLabBatches } from "@/lib/stream-records";
import { backPath } from "@/components/stream-records/flash";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The stream records' writes from the web (5 Oct 2026): lab batches and moot
 * courts from the office's pages, the practical record from a faculty
 * member's or an HOD's. Who may make each is the library's to decide; each
 * goes back to the page it came from with `?done=` or `?error=`. Only async
 * functions are exported.
 */

export async function splitLabBatchesAction(form: FormData): Promise<void> {
  await runAction("/admin/stream-records/lab-batches", async () => {
    const size = field(form, "size");
    await splitLabBatches(await requireApiUser(), labBatchSplitSchema.parse({ divisionId: field(form, "divisionId"), ...(size ? { size: intField(form, "size") } : {}) }));
    return "streamRecords.batchesSplit";
  });
}

export async function moveToLabBatchAction(form: FormData): Promise<void> {
  await runAction("/admin/stream-records/lab-batches", async () => {
    const ids = form.getAll("student").map(String).filter(Boolean);
    if (!ids.length) throw new RuleRefusal("streamRecords.chooseStudents", 422);
    await moveToLabBatch(await requireApiUser(), field(form, "batchId"), labBatchMoveSchema.parse({ studentMembershipIds: ids }).studentMembershipIds);
    return "streamRecords.batchMoved";
  });
}

/**
 * One experiment from the record's form: "marks:<membershipId>" per student
 * ticked in "student"; a blank mark is none. Answers in place
 * (A3-journeys-27): a refused mark keeps the whole sheet as typed and is the
 * box marked and focused.
 */
export async function savePracticalsAction(previous: FormState, form: FormData): Promise<FormState> {
  const back = backPath(field(form, "back"), "/faculty/practicals");
  const ids = form.getAll("student").map(String).filter(Boolean);
  // The schema's "entries.<i>.marks" is the box of the i-th student ticked.
  const fields = Object.fromEntries([["entries", ""], ...ids.map((id, i) => [`entries.${i}.marks`, `marks:${id}`])]);
  return answerForm(
    previous,
    form,
    async () => {
      const offeringId = field(form, "offeringId");
      if (!ids.length) throw new RuleRefusal("streamRecords.chooseStudents", 422);
      const entries = ids.map((id) => {
        const raw = field(form, `marks:${id}`);
        if (raw && !/^\d{1,3}$/.test(raw)) throw new RuleRefusal("streamRecords.refuseMarks", 422, undefined, `marks:${id}`);
        return { studentMembershipId: id, marks: raw ? Number(raw) : null };
      });
      await savePracticals(await requireApiUser(), practicalSaveSchema.parse({ offeringId, experimentNo: intField(form, "experimentNo"), title: field(form, "title"), performedOn: field(form, "performedOn"), entries }));
      return "streamRecords.practicalSaved";
    },
    { revalidate: [back], fields },
  );
}

export async function signPracticalsAction(form: FormData): Promise<void> {
  const offeringId = field(form, "offeringId");
  const back = backPath(field(form, "back"), "/faculty/practicals");
  await runAction(offeringId ? `${back.split("?")[0]}?offeringId=${encodeURIComponent(offeringId)}` : back, async () => {
    const ids = form.getAll("record").map(String).filter(Boolean);
    if (!ids.length) throw new RuleRefusal("streamRecords.chooseRecords", 422);
    const r = await signPracticals(await requireApiUser(), practicalSignSchema.parse({ recordIds: ids }).recordIds);
    if (!r.count) return "streamRecords.nothingToSign";
    return "streamRecords.practicalSigned";
  });
}

/** A moot from the form (the office's, or a faculty member's or HOD's at /faculty/moot-courts): up to four teams, "team<n>Name", "team<n>Outcome" and the members ticked as "team<n>Member". */
export async function saveMootCourtAction(form: FormData): Promise<void> {
  await runAction(backPath(field(form, "back"), "/admin/stream-records/moot-courts"), async () => {
    const teams = [1, 2, 3, 4]
      .map((n) => ({ name: field(form, `team${n}Name`), outcome: field(form, `team${n}Outcome`) || "PARTICIPATED", membershipIds: form.getAll(`team${n}Member`).map(String).filter(Boolean) }))
      .filter((team) => team.name)
      .map((team) => ({ ...team, outcome: (MOOT_OUTCOMES as readonly string[]).includes(team.outcome) ? team.outcome : "PARTICIPATED" }));
    await saveMootCourt(await requireApiUser(), mootCourtSaveSchema.parse({ name: field(form, "name"), at: field(form, "at"), kind: field(form, "kind"), teams, result: field(form, "result"), judgeNotes: field(form, "judgeNotes") }));
    return "streamRecords.mootSaved";
  });
}
