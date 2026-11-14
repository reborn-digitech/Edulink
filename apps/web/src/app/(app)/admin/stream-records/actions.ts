"use server";

import { labBatchMoveSchema, labBatchSplitSchema, mootCourtSaveSchema, practicalSaveSchema, practicalSignSchema, MOOT_OUTCOMES } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { moveToLabBatch, saveMootCourt, savePracticals, signPracticals, splitLabBatches } from "@/lib/stream-records";
import { backPath } from "@/components/stream-records/flash";
import { answerForm } from "@/lib/form-action";
import { isoToDisplayDate } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";

/**
 * The stream records' writes from the web (5 Oct 2026): lab batches and moot
 * courts from the office's pages, the practical record from a faculty
 * member's or an HOD's. Who may make each is the library's to decide; each
 * answers in place through <ActionForm> (A3-journeys-27): a refusal keeps
 * what was typed, by its box. Only async functions are exported.
 */

export async function splitLabBatchesAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const size = field(form, "size");
      const done = await splitLabBatches(await requireApiUser(), labBatchSplitSchema.parse({ divisionId: field(form, "divisionId"), ...(size ? { size: intField(form, "size") } : {}) }));
      // The day it took effect (R-24): a re-split after marked labs keeps their rosters and starts on this day.
      return done.effectiveFrom ? { key: "riskDecisions.labChangedFrom", vars: { date: isoToDisplayDate(done.effectiveFrom) } } : "streamRecords.batchesSplit";
    },
    { revalidate: ["/admin/stream-records/lab-batches"] },
  );
}

export async function moveToLabBatchAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const ids = form.getAll("student").map(String).filter(Boolean);
      if (!ids.length) throw new RuleRefusal("streamRecords.chooseStudents", 422);
      const done = await moveToLabBatch(await requireApiUser(), field(form, "batchId"), labBatchMoveSchema.parse({ studentMembershipIds: ids }).studentMembershipIds);
      return done.effectiveFrom ? { key: "riskDecisions.labChangedFrom", vars: { date: isoToDisplayDate(done.effectiveFrom) } } : "streamRecords.batchMoved";
    },
    { revalidate: ["/admin/stream-records/lab-batches"] },
  );
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

export async function signPracticalsAction(previous: FormState, form: FormData): Promise<FormState> {
  const back = backPath(field(form, "back"), "/faculty/practicals");
  return answerForm(
    previous,
    form,
    async () => {
      const ids = form.getAll("record").map(String).filter(Boolean);
      if (!ids.length) throw new RuleRefusal("streamRecords.chooseRecords", 422);
      const r = await signPracticals(await requireApiUser(), practicalSignSchema.parse({ recordIds: ids }).recordIds);
      if (!r.count) return "streamRecords.nothingToSign";
      return "streamRecords.practicalSigned";
    },
    { revalidate: [back] },
  );
}

/** A moot from the form (the office's, or a faculty member's or HOD's at /faculty/moot-courts): up to four teams, "team<n>Name", "team<n>Outcome" and the members ticked as "team<n>Member". */
export async function saveMootCourtAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      // A correction (TA-271) carries the moot's id and as many team boxes as the moot has (at least four, at most forty).
      const id = field(form, "id");
      const slots = Math.min(40, Math.max(4, intField(form, "teamSlots")));
      const teams = Array.from({ length: slots }, (_, i) => i + 1)
        .map((n) => ({ name: field(form, `team${n}Name`), outcome: field(form, `team${n}Outcome`) || "PARTICIPATED", membershipIds: form.getAll(`team${n}Member`).map(String).filter(Boolean) }))
        .filter((team) => team.name)
        .map((team) => ({ ...team, outcome: (MOOT_OUTCOMES as readonly string[]).includes(team.outcome) ? team.outcome : "PARTICIPATED" }));
      // An intra-college moot is between the college's own teams; an inter-college or national one may carry the college's one team (TA-491).
      if (field(form, "kind") === "INTRA" && teams.length < 2) throw new RuleRefusal("streamRecords.moots.needTwoTeams", 422, undefined, "teams.1.name");
      await saveMootCourt(await requireApiUser(), mootCourtSaveSchema.parse({ ...(id ? { id } : {}), name: field(form, "name"), at: field(form, "at"), kind: field(form, "kind"), teams, result: field(form, "result"), judgeNotes: field(form, "judgeNotes") }));
      return "streamRecords.mootSaved";
    },
    // The schema's "teams.<i>.name" is the i-th team's box (teams with no name are dropped first, so i is the n-1 of a filled run).
    { revalidate: [backPath(field(form, "back"), "/admin/stream-records/moot-courts")], fields: { "teams.0.name": "team1Name", "teams.1.name": "team2Name", "teams.2.name": "team3Name", "teams.3.name": "team4Name" } },
  );
}
