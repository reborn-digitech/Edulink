"use server";

import { requireUser } from "@/lib/tenancy";
import {
  mergeAccounts,
  previewMerge,
  type MergePreview,
  type MergeResult,
} from "@/lib/account-merge";

/**
 * The two steps, and there are deliberately two.
 *
 * `check` writes nothing and hands back no token — not an id, not a ticket,
 * nothing the browser could replay. `join` therefore re-verifies the password
 * from scratch. That looks like duplicated work and is the point: the preview
 * can be left open on a shared laptop, and the credentials it was granted on
 * can stop being right in between.
 */

export async function check(input: {
  identifier: string;
  password: string;
  code?: string;
}): Promise<MergePreview> {
  const session = await requireUser();
  return previewMerge(session, input);
}

export async function join(input: {
  identifier: string;
  password: string;
  code?: string;
}): Promise<MergeResult> {
  const session = await requireUser();
  return mergeAccounts(session, input);
}
