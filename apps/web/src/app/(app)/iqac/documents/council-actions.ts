"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { worksheetSaveSchema, WORKSHEET_KINDS, worksheetItems, type WorksheetKind } from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { getT } from "@/lib/i18n/server";
import { saveWorksheet } from "@/lib/council-filings";

/**
 * The councils' worksheets as forms (5 Oct 2026): the office's BCI and NCTE
 * checklists and the HOD's NBA criteria post here with `back`, and return
 * there with ?ok= or ?error= in the reader's language. Who may write what is
 * decided in lib/council-filings.ts, exactly as for the /api/v1 doors.
 */

const BACK = /^\/(iqac\/documents\/(bci|ncte|nba)|hod\/nba)$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/iqac/documents";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

const withMessage = (back: string, key: "ok" | "error", text: string) => `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
const str = (f: FormData, name: string) => String(f.get(name) ?? "").trim();

/** Every item of the kind that is typed (not computed), read from `answer.<code>`, `score.<code>` and `note.<code>`. */
export async function saveWorksheetAction(formData: FormData) {
  const back = backOf(formData);
  const t = await getT();
  const kind = str(formData, "kind") as WorksheetKind;
  try {
    if (!(WORKSHEET_KINDS as readonly string[]).includes(kind)) throw new RuleRefusal("councilFilings.refuseItem", 422);
    const items = worksheetItems(kind)
      .filter((i) => !i.computed)
      .map((i) => {
        const answer = str(formData, `answer.${i.code}`);
        const score = str(formData, `score.${i.code}`);
        return { code: i.code, answer: answer === "YES" || answer === "NO" || answer === "NA" ? answer : null, score: score === "" ? null : Number(score), note: str(formData, `note.${i.code}`) };
      });
    const parsed = worksheetSaveSchema.safeParse({ year: Number(str(formData, "year")), departmentId: str(formData, "departmentId") || null, items });
    if (!parsed.success) throw new RuleRefusal("councilFilings.refuseScore", 422);
    const ctx = await requireApiUser();
    await saveWorksheet(ctx, kind, parsed.data);
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) redirect(withMessage(back, "error", t(error.key, (error as { vars?: Record<string, string | number> }).vars)));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  redirect(withMessage(back, "ok", t("councilFilings.saved")));
}
