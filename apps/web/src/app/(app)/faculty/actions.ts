"use server";

import { courseFileItemSaveSchema, coursePlanWeekSchema, internalComponentSaveSchema, lectureMarkSaveSchema, mentoringGroupSaveSchema, mentoringNoteSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { markLecture } from "@/lib/academics-attendance";
import { lockInternal, moderateComponent, releaseComponent, saveComponent, saveInternalMarks } from "@/lib/academics-assessment";
import { addCourseFileItem, reviewCourseFile, saveCoursePlan } from "@/lib/academics-coursefile";
import { addMentoringNote, saveMentoringGroup } from "@/lib/academics-mentoring";
import { discard, storeAttachments } from "@/lib/uploads";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The faculty member's and the HOD's academics writes (4 October 2026):
 * a lecture's marks, internal components and marks, the countersign,
 * release and lock, the course file, mentoring. Who may make each is the
 * library's to decide. Only async functions are exported.
 */
const offeringPath = (form: FormData, tab: string) => `/faculty/offerings/${encodeURIComponent(field(form, "offeringId"))}?tab=${tab}`;

export async function markLectureAction(form: FormData): Promise<void> {
  const lectureId = field(form, "lectureId");
  await runAction(`/faculty/lectures/${encodeURIComponent(lectureId)}`, async () => {
    const entries = form
      .getAll("student")
      .map(String)
      .map((id) => ({ studentMembershipId: id, status: field(form, `mark:${id}`) || "PRESENT" }));
    await markLecture(await requireApiUser(), lectureId, lectureMarkSaveSchema.parse({ clientId: field(form, "clientId"), entries }));
    return "academics.lectureMarked";
  });
}

/** Internal marks answer in place (A3-journeys-27): a weight over the internal maximum stays typed and is said under the weight. */
export async function saveComponentAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const coCodes = field(form, "coCodes").split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
      await saveComponent(await requireApiUser(), field(form, "offeringId"), internalComponentSaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), kind: field(form, "kind"), maxMarks: intField(form, "maxMarks"), weight: intField(form, "weight"), coCodes }));
      return "academics.componentSaved";
    },
    { revalidate: [offeringPath(form, "marks")] },
  );
}

/** One component's marks from the grid ("mark:<membershipId>", blank skipped, "AB" absent) or a pasted sheet. */
export async function saveMarksAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(previous, form, async () => {
    const ctx = await requireApiUser();
    const sheet = field(form, "sheet");
    if (sheet) {
      const r = await saveInternalMarks(ctx, field(form, "offeringId"), { componentId: field(form, "componentId"), sheet });
      // A roll number two divisions share is said as such (TA-055): the student code names one student.
      if (r.skipped.some((s) => s.reason === "AMBIGUOUS_STUDENT")) throw new RuleRefusal("academics.sheetAmbiguous", 422, { saved: r.saved, skipped: r.skipped.length }, "sheet");
      if (r.skipped.length) throw new RuleRefusal("academics.sheetSkipped", 422, { saved: r.saved, skipped: r.skipped.length }, "sheet");
      return "academics.marksSaved";
    }
    const entries: { studentMembershipId: string; marks: number | null }[] = [];
    for (const [k, v] of form.entries()) {
      if (!k.startsWith("mark:")) continue;
      const raw = String(v).trim();
      if (!raw) continue;
      if (/^ab$/i.test(raw)) entries.push({ studentMembershipId: k.slice(5), marks: null });
      else if (/^\d+(\.\d)?$/.test(raw)) entries.push({ studentMembershipId: k.slice(5), marks: Number(raw) });
      else throw new RuleRefusal("academics.refuseBadMarks", 422, { value: raw.slice(0, 10) }, k);
    }
    if (!entries.length) return "academics.marksSaved";
    await saveInternalMarks(ctx, field(form, "offeringId"), { componentId: field(form, "componentId"), entries });
    return "academics.marksSaved";
  }, { revalidate: [offeringPath(form, "marks")], fields: { entries: "" } });
}

export async function moderateAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "marks"), async () => {
    await moderateComponent(await requireApiUser(), field(form, "componentId"));
    return "academics.moderated";
  });
}

export async function releaseAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "marks"), async () => {
    await releaseComponent(await requireApiUser(), field(form, "componentId"));
    return "academics.released";
  });
}

export async function lockAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "marks"), async () => {
    await lockInternal(await requireApiUser(), field(form, "offeringId"));
    return "academics.locked";
  });
}

/** The plan as lines "week | topic | CO1 CO2 | taught on (YYYY-MM-DD, or blank)". */
export async function savePlanAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "file"), async () => {
    const plan = field(form, "plan")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [week = "", topic = "", cos = "", taught = ""] = l.split("|").map((x) => x.trim());
        if (!/^\d{1,2}$/.test(week) || !topic) throw new RuleRefusal("academics.refusePlanLine", 422, { line: l.slice(0, 40) });
        // A taught day written the way days are written here (15/07/2026) is read as that day (TA-062).
        const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(taught);
        const taughtOn = dmy ? `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}` : taught || null;
        const parsed = coursePlanWeekSchema.safeParse({ week: Number(week), topic, coCodes: cos.split(/[\s,]+/).map((x) => x.toUpperCase()).filter(Boolean), taughtOn });
        // Held to the door's contract (TA-062): a week the reader would drop is refused here, naming its line.
        if (!parsed.success) throw new RuleRefusal("academics.refusePlanWeek", 422, { week });
        return parsed.data;
      });
    await saveCoursePlan(await requireApiUser(), field(form, "offeringId"), { plan });
    return "academics.planSaved";
  });
}

/** A resource: a file picked on the page (stored here, removed again if the write is refused) or a link. */
export async function addItemAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "file"), async () => {
    const ctx = await requireApiUser();
    const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
    const stored = files.length ? await storeAttachments(files, { max: 1 }) : [];
    try {
      const input = courseFileItemSaveSchema.parse({ kind: field(form, "kind"), title: field(form, "title"), url: field(form, "url") || null, fileId: null, coCodes: field(form, "coCodes").split(/[\s,]+/).map((x) => x.toUpperCase()).filter(Boolean) });
      await addCourseFileItem(ctx, field(form, "offeringId"), input, { fileId: stored[0]?.fileId ?? null });
    } catch (e) {
      await discard(stored.map((s) => s.fileId));
      throw e;
    }
    return "academics.itemAdded";
  });
}

export async function reviewAction(form: FormData): Promise<void> {
  await runAction(offeringPath(form, "file"), async () => {
    await reviewCourseFile(await requireApiUser(), field(form, "offeringId"), field(form, "note"));
    return "academics.reviewed";
  });
}

export async function mentoringNoteAction(form: FormData): Promise<void> {
  await runAction("/faculty/mentoring", async () => {
    await addMentoringNote(await requireApiUser(), mentoringNoteSaveSchema.parse({ groupId: field(form, "groupId"), studentMembershipId: field(form, "studentMembershipId"), note: field(form, "note"), flag: field(form, "flag") || "NONE" }));
    return "academics.noteSaved";
  });
}

export async function mentoringGroupAction(form: FormData): Promise<void> {
  await runAction("/faculty/mentoring", async () => {
    await saveMentoringGroup(await requireApiUser(), mentoringGroupSaveSchema.parse({ id: field(form, "id") || undefined, termId: field(form, "termId"), facultyMembershipId: field(form, "facultyMembershipId"), name: field(form, "name"), studentMembershipIds: form.getAll("studentMembershipId").map(String) }));
    return "academics.groupSaved";
  });
}
