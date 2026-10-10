"use server";

import { studioJurySaveSchema, studioSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { saveJury, saveStudio } from "@/lib/studio";

/**
 * The studio desk's writes from the web (R-56, the studio half, 10 Oct 2026):
 * a studio with its stage days, a jury with its panel. Who may make each is
 * the library's to decide. Only async functions are exported.
 */

const dayOrNull = (form: FormData, name: string) => field(form, name) || null;

export async function saveStudioAction(form: FormData): Promise<void> {
  await runAction("/duties/studio", async () => {
    const id = field(form, "id");
    const coordinator = field(form, "coordinatorMembershipId");
    await saveStudio(
      await requireApiUser(),
      studioSaveSchema.parse({
        ...(id ? { id } : {}),
        offeringId: field(form, "offeringId"),
        title: field(form, "title"),
        brief: field(form, "brief"),
        maxMarks: intField(form, "maxMarks"),
        coordinatorMembershipId: coordinator || null,
        briefIssuedOn: field(form, "briefIssuedOn"),
        interimOn: dayOrNull(form, "interimOn"),
        finalOn: dayOrNull(form, "finalOn"),
        juryOn: dayOrNull(form, "juryOn"),
      }),
    );
    return "duties.studio.studioSaved";
  });
}

export async function saveJuryAction(form: FormData): Promise<void> {
  await runAction("/duties/studio", async () => {
    const jurors = form.getAll("juror").map(String).filter(Boolean);
    if (!jurors.length) throw new RuleRefusal("duties.studio.refuseNeedJurors", 422, undefined, "jurorMembershipIds");
    const externalJurors = [1, 2].flatMap((n) => {
      const role = field(form, `externalRole${n}`);
      const institution = field(form, `externalInstitution${n}`);
      return role && institution ? [{ role, institution }] : [];
    });
    const id = field(form, "id");
    await saveJury(await requireApiUser(), field(form, "studioId"), studioJurySaveSchema.parse({ ...(id ? { id } : {}), on: field(form, "on"), title: field(form, "title"), jurorMembershipIds: jurors, chairMembershipId: field(form, "chairMembershipId"), externalJurors }));
    return "duties.studio.jurySaved";
  });
}
