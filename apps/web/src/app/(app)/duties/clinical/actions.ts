"use server";

import { clinicalDepartmentSaveSchema, clinicalPostingSaveSchema, clinicalSiteSaveSchema, logbookReturnSchema, logbookSignSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { returnLogbookEntry, saveClinicalDepartment, saveClinicalPosting, saveClinicalSite, signLogbookEntry } from "@/lib/clinical";

/**
 * The clinical desk's writes from the web (R-56, the clinical half; 10 Oct
 * 2026): a site, a department, a posting, a signature or a return. Who may
 * make each is lib/clinical.ts's to decide. The sign and return forms sit on
 * two pages (the desk and a supervising teacher's own), so they carry the
 * page to go back to, held to those two. Only async functions are exported.
 */
const DESK = "/duties/clinical";
const back = (form: FormData): string => (field(form, "back") === "/faculty/clinical" ? "/faculty/clinical" : DESK);

export async function clinicalSiteAction(form: FormData): Promise<void> {
  await runAction(DESK, async () => {
    const from = field(form, "agreementFrom");
    const to = field(form, "agreementTo");
    await saveClinicalSite(await requireApiUser(), clinicalSiteSaveSchema.parse({ name: field(form, "name"), kind: field(form, "kind"), address: field(form, "address"), agreementFrom: from || null, agreementTo: to || null, contactRole: field(form, "contactRole") }));
    return "duties.clinical.siteSaved";
  });
}

export async function clinicalDepartmentAction(form: FormData): Promise<void> {
  await runAction(DESK, async () => {
    const beds = field(form, "beds");
    await saveClinicalDepartment(await requireApiUser(), clinicalDepartmentSaveSchema.parse({ siteId: field(form, "siteId"), name: field(form, "name"), beds: beds ? intField(form, "beds") : null }));
    return "duties.clinical.departmentSaved";
  });
}

export async function clinicalPostingAction(form: FormData): Promise<void> {
  await runAction(DESK, async () => {
    const [divisionId, labBatchId] = field(form, "division").split("|");
    await saveClinicalPosting(await requireApiUser(), clinicalPostingSaveSchema.parse({ departmentId: field(form, "departmentId"), divisionId: divisionId ?? "", labBatchId: labBatchId || null, supervisorMembershipId: field(form, "supervisorMembershipId"), from: field(form, "from"), to: field(form, "to"), rotationOrder: intField(form, "rotationOrder") || 1 }));
    return "duties.clinical.postingSaved";
  });
}

export async function logbookSignAction(form: FormData): Promise<void> {
  await runAction(back(form), async () => {
    await signLogbookEntry(await requireApiUser(), field(form, "entryId"), logbookSignSchema.parse({ remark: field(form, "remark") }));
    return "duties.clinical.signed";
  });
}

export async function logbookReturnAction(form: FormData): Promise<void> {
  await runAction(back(form), async () => {
    await returnLogbookEntry(await requireApiUser(), field(form, "entryId"), logbookReturnSchema.parse({ remark: field(form, "remark") }));
    return "duties.clinical.returned";
  });
}
