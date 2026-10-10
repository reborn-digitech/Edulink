"use server";

import { studioJuryMarksSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { postJuryToInternal, saveJuryMarks, signJury } from "@/lib/studio";

/**
 * The faculty's studio writes from the web (R-56, the studio half, 10 Oct
 * 2026): a juror's marks for a sheet, the chair's signature, a signed sheet
 * posted into an internal component. Who may make each is the library's to
 * decide. Only async functions are exported.
 */

export async function saveJuryMarksAction(form: FormData): Promise<void> {
  await runAction("/faculty/studios", async () => {
    const juryId = field(form, "juryId");
    const entries = form
      .getAll("student")
      .map(String)
      .filter(Boolean)
      .map((studentMembershipId) => {
        const raw = field(form, `marks_${studentMembershipId}`).replace(",", ".");
        const marks = raw === "" ? null : Number(raw);
        if (marks !== null && !Number.isFinite(marks)) throw new RuleRefusal("common.checkTheForm", 422, undefined, "entries");
        return { studentMembershipId, marks, remark: field(form, `remark_${studentMembershipId}`) };
      });
    await saveJuryMarks(await requireApiUser(), juryId, studioJuryMarksSchema.parse({ entries }));
    return "duties.studio.marksSaved";
  });
}

export async function signJuryAction(form: FormData): Promise<void> {
  await runAction("/faculty/studios", async () => {
    const r = await signJury(await requireApiUser(), field(form, "juryId"));
    return r.changed ? "duties.studio.signed" : "duties.studio.alreadySigned";
  });
}

export async function postJuryInternalAction(form: FormData): Promise<void> {
  await runAction("/faculty/studios", async () => {
    await postJuryToInternal(await requireApiUser(), field(form, "juryId"), field(form, "componentId"));
    return "duties.studio.posted";
  });
}
