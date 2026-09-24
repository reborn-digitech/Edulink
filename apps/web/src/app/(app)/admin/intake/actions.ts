"use server";

import { revalidatePath } from "next/cache";
import { getT, getLocale } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { parseIntakeCsv } from "@/lib/csv";
import { admitPupils, INTAKE_MAX_ROWS, IntakeLimited, type IntakeResult } from "@/lib/intake";
import { retryHintKey } from "@/lib/rate-limit";
import { todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { IntakeCsvResult } from "@/lib/csv";

export type IntakeState = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
  /** Set on the per-school linking limit only: seconds until another list counts. */
  retryAfterSeconds?: number;
  problems: IntakeCsvResult["problems"];
  result: IntakeResult | null;
};

/**
 * The server re-parses the text the admin pasted rather than trusting rows
 * from the browser — the preview and the action run the same parser, so the
 * admin sees what will happen, and the server decides what does.
 */
export async function runIntake(input: { csv: string }): Promise<IntakeState> {
  let ctx;
  try {
    ctx = await requireApiRole("ADMIN");
  } catch (error) {
    if (error instanceof AccessError) {
      return { ok: false, error: (await getT())(error.key, error.vars), problems: [], result: null };
    }
    throw error;
  }

  const text = (input.csv ?? "").trim();
  if (!text) return { ok: false, errorKey: "invites.needOneEmail", problems: [], result: null };
  if (text.length > 500_000) return { ok: false, errorKey: "invites.listTooLarge", problems: [], result: null };

  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const { valid, problems } = parseIntakeCsv(text, todayKey(school.timezone));
  if (valid.length === 0) return { ok: false, errorKey: "invites.noUsableRows", problems, result: null };
  if (valid.length > INTAKE_MAX_ROWS) {
    return { ok: false, errorKey: "access.tooManyPupilsAtOnce", errorVars: { max: INTAKE_MAX_ROWS }, problems, result: null };
  }

  try {
    const result = await admitPupils(ctx, valid, { locale: await getLocale() });
    revalidatePath("/admin/people");
    revalidatePath("/admin/invites");
    revalidatePath("/admin");
    return { ok: true, problems, result };
  } catch (error) {
    if (error instanceof IntakeLimited) {
      const t = await getT();
      const hint = retryHintKey(error.retryAfterSeconds);
      return { ok: false, error: t("intake.tooManyRuns", { when: t(hint.key, hint.vars) }), retryAfterSeconds: error.retryAfterSeconds, problems, result: null };
    }
    if (error instanceof AccessError) {
      return { ok: false, error: (await getT())(error.key, error.vars), problems, result: null };
    }
    throw error;
  }
}
