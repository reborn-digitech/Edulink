"use server";

import { requireUser } from "@/lib/tenancy";
import {
  mergeAccounts,
  previewMerge,
  type MergeRefusal,
  type MergePreview,
  type MergeResult,
} from "@/lib/account-merge";
import { getT } from "@/lib/i18n/server";
import { refusalText } from "@/lib/i18n/refusal";
import { ROLE_META, type Role } from "@/lib/constants";

/**
 * The two steps, and there are deliberately two.
 *
 * `check` writes nothing and hands back no token — not an id, not a ticket,
 * nothing the browser could replay. `join` therefore re-verifies the password
 * from scratch. That looks like duplicated work and is the point: the preview
 * can be left open on a shared laptop, and the credentials it was granted on
 * can stop being right in between.
 */

/**
 * The lib mints a KEY; this boundary turns it into the reader's words.
 * `role` travels as the ENUM and is swapped for the reader's role label here —
 * the one var that is itself a translation.
 */
async function refused(refusal: MergeRefusal): Promise<{ ok: false; error: string }> {
  const t = await getT();
  const vars = { ...(refusal.errorVars ?? {}) };
  if (typeof vars.role === "string" && vars.role in ROLE_META) {
    vars.role = t(ROLE_META[vars.role as Role].labelKey);
  }
  if (vars.school === "") vars.school = t("refusal.theSameSchool");
  return { ok: false, error: refusalText(t, { errorKey: refusal.errorKey, errorVars: vars }) };
}

type CheckOut = Exclude<MergePreview, MergeRefusal> | { ok: false; error: string };
type JoinOut = Exclude<MergeResult, MergeRefusal> | { ok: false; error: string };

export async function check(input: {
  identifier: string;
  password: string;
  code?: string;
}): Promise<CheckOut> {
  const session = await requireUser();
  const result = await previewMerge(session, input);
  return result.ok ? result : refused(result);
}

export async function join(input: {
  identifier: string;
  password: string;
  code?: string;
}): Promise<JoinOut> {
  const session = await requireUser();
  const result = await mergeAccounts(session, input);
  return result.ok ? result : refused(result);
}
