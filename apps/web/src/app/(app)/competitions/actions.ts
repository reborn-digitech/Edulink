"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import {
  createCompetition,
  enterCompetition,
  giveConsent,
  recordResult,
  setCompetitionStatus,
  setLeaderboard,
  submitEntry,
  withdrawEntry,
} from "@/lib/competitions";
import { toMilli } from "@/lib/validation";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";

const idSchema = z.object({ id: z.string().cuid() });

export type CompetitionActionState = { ok: boolean; error?: string; message?: string };

/**
 * Thin wrappers. Every rule about who may do what lives in `competitions.ts`,
 * which is where the tests point — an action that decided anything itself would
 * be a second copy of the rules, and the copy is the one that goes stale.
 */
async function run(
  input: unknown,
  work: (session: NonNullable<Awaited<ReturnType<typeof getSession>>>, id: string) => Promise<string>,
): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notValidCompetition") };

  try {
    const message = await work(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/parent");
    return { ok: true, message };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

export async function enterAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  return run(input, async (session, id) => {
    const result = await enterCompetition(session, id);
    return result.awaitingConsent
      ? t("competitions.askedToEnterMsg")
      : t("competitions.youAreEnteredDot");
  });
}

/** `id` here is the ENTRY, not the competition — consent is per child. */
export async function consentAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notValidEntry") };

  try {
    await giveConsent(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath("/parent");
    return { ok: true, message: t("competitions.consentGivenDot") };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

export async function withdrawAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notValidEntry") };

  try {
    await withdrawEntry(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath("/parent");
    return { ok: true, message: t("competitions.withdrawnDot") };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Organising one                                                              */
/* -------------------------------------------------------------------------- */

/** Empty strings from a form mean "not given", not "the empty string". */
const optionalText = z
  .string()
  .trim()
  .max(5000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

/**
 * A date input gives "YYYY-MM-DD" or "". Parsed here rather than trusted:
 * `new Date("")` is Invalid Date, which Prisma stores as a crash rather than a
 * null.
 */
const optionalDate = (t: Translate) =>
  z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || !Number.isNaN(Date.parse(v)), {
      message: t("competitions.notADate"),
    })
    .transform((v) => (v ? new Date(v) : null));

/**
 * ⚠ A FACTORY, not a module-level schema. The messages inside are shown to the
 * person who typed, so they must resolve in that person's language — a
 * module-level schema bakes them in whatever language the module loaded in.
 */
const createSchema = (t: Translate) => z
  .object({
    title: z.string().trim().min(3, t("competitions.giveTitle")).max(140),
    summary: z.string().trim().min(3, t("competitions.oneLinePlease")).max(200),
    body: optionalText,
    subject: z.string().trim().max(40).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
    gradeLow: z.string().trim().max(10).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
    gradeHigh: z.string().trim().max(10).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
    eligibility: optionalText,
    rules: optionalText,
    prizes: optionalText,
    // http:// would put a child on a page that can be tampered with in transit.
    externalUrl: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : v))
      .nullable()
      .optional()
      .refine((v) => v === null || v === undefined || /^https:\/\/\S+$/.test(v), {
        message: t("competitions.httpsOnly"),
      }),
    registrationClosesAt: optionalDate(t),
    startsAt: optionalDate(t),
    endsAt: optionalDate(t),
    requiresParentConsent: z
      .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal("")])
      .transform((v) => v === "on" || v === "true"),
    leaderboardEnabled: z
      .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal("")])
      .transform((v) => v === "on" || v === "true"),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
    message: t("competitions.endBeforeStart"),
    path: ["endsAt"],
  })
  .refine((v) => !v.registrationClosesAt || !v.startsAt || v.registrationClosesAt <= v.startsAt, {
    message: t("competitions.closesAfterStart"),
    path: ["registrationClosesAt"],
  });

export type CreateCompetitionState = {
  ok: boolean;
  competitionId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCompetitionAction(input: unknown): Promise<CreateCompetitionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = createSchema(t).safeParse(input);
  if (!parsed.success) {
    // Every bad field reported at once, never the first one only. (§6)
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors, error: t("competitions.needsAnotherLook") };
  }

  try {
    const competitionId = await createCompetition(session, parsed.data);
    revalidatePath("/competitions");
    return { ok: true, competitionId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

const leaderboardSchema = z.object({
  id: z.string().cuid(),
  enabled: z.boolean(),
});

/**
 * The organiser publishes the cross-school board, or takes it down.
 *
 * `revalidatePath` on the detail route because the board is rendered there for
 * every school — a cached page still showing standings after the organiser
 * switched them off would keep publishing something they had withdrawn.
 */
export async function setLeaderboardAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = leaderboardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notACompetition") };

  try {
    await setLeaderboard(session, parsed.data.id, parsed.data.enabled);
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/competitions");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

const statusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["PUBLISHED", "ARCHIVED", "DRAFT"]),
});

export async function setStatusAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notValidChange") };

  try {
    await setCompetitionStatus(session, parsed.data.id, parsed.data.status);
    revalidatePath("/competitions");
    revalidatePath(`/competitions/${parsed.data.id}`);
    return {
      ok: true,
      message:
        parsed.data.status === "PUBLISHED"
          ? t("competitions.publishedMsg")
          : parsed.data.status === "ARCHIVED"
            ? t("competitions.withdrawnFromList")
            : t("competitions.backToADraft"),
    };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Handing in, and what it scored                                              */
/* -------------------------------------------------------------------------- */

const submitSchema = (t: Translate) =>
  z.object({
    id: z.string().cuid(),
    // https only, for the same reason the organiser's own link is: this ends up
    // as something a child clicks.
    url: z
      .string()
      .trim()
      .max(500)
      .refine((v) => /^https:\/\/\S+$/.test(v), { message: t("competitions.httpsOnly") }),
  });

export async function submitAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = submitSchema(t).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t("competitions.linkNotValid") };
  }

  try {
    await submitEntry(session, parsed.data.id, parsed.data.url);
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/competitions");
    return { ok: true, message: t("competitions.handedInDot") };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

/**
 * A score as staff type it — points, possibly with a half — and a place.
 *
 * Empty means "not recorded", which is NOT zero. A competition where zero is a
 * real score would otherwise have no way to undo a typo.
 */
const resultSchema = (t: Translate) =>
  z.object({
    entryId: z.string().cuid(),
    score: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : Number(v)))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
        message: t("competitions.scoreRule"),
      }),
    rank: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1), {
        message: t("competitions.placeRule"),
      }),
  });

export async function recordResultAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = resultSchema(t).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t("competitions.resultNotValid") };
  }

  try {
    await recordResult(session, parsed.data.entryId, {
      scoreMilli: parsed.data.score === null ? null : toMilli(parsed.data.score),
      rank: parsed.data.rank,
    });
    revalidatePath("/competitions");
    return {
      ok: true,
      message: parsed.data.score === null && parsed.data.rank === null ? t("competitions.resultCleared") : t("competitions.resultSaved"),
    };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}
