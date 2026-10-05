"use server";

import { studentCouncilNoticeSaveSchema, studentCouncilSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { postCouncilNotice, saveCouncil } from "@/lib/council-notices";

/**
 * The student council's page (risks batch 5A, 5 Oct 2026): a notice signed by
 * the council, and the office naming the council and its members. Who may is
 * council-notices.ts's to say. Only async functions are exported.
 */
export async function postCouncilNoticeAction(form: FormData): Promise<void> {
  await runAction("/bulletin/council", async () => {
    const r = await postCouncilNotice(await requireApiUser(), studentCouncilNoticeSaveSchema.parse({ title: field(form, "title"), body: field(form, "body"), audience: field(form, "audience") || "ALL" }));
    return r.status === "APPROVED" ? "councilNotices.posted" : "councilNotices.sentForReview";
  }, ["/bulletin"]);
}

/** One member per line: "student code, role" (the role may be left out). */
export async function saveCouncilAction(form: FormData): Promise<void> {
  await runAction("/bulletin/council", async () => {
    const members = field(form, "members")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [code = "", ...role] = l.split(",");
        return { code: code.trim(), role: role.join(",").trim() };
      });
    await saveCouncil(await requireApiUser(), studentCouncilSaveSchema.parse({ name: field(form, "name"), members }));
    return "councilNotices.saved";
  });
}
