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
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That is not a valid competition." };

  try {
    const message = await work(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/parent");
    return { ok: true, message };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function enterAction(input: unknown): Promise<CompetitionActionState> {
  return run(input, async (session, id) => {
    const result = await enterCompetition(session, id);
    return result.awaitingConsent
      ? "Asked to enter. A grown-up needs to say yes before you take part."
      : "You are entered.";
  });
}

/** `id` here is the ENTRY, not the competition — consent is per child. */
export async function consentAction(input: unknown): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That is not a valid entry." };

  try {
    await giveConsent(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath("/parent");
    return { ok: true, message: "Consent given." };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function withdrawAction(input: unknown): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That is not a valid entry." };

  try {
    await withdrawEntry(session, parsed.data.id);
    revalidatePath("/competitions");
    revalidatePath("/parent");
    return { ok: true, message: "Withdrawn." };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
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
const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional()
  .refine((v) => v === null || v === undefined || !Number.isNaN(Date.parse(v)), {
    message: "That is not a date.",
  })
  .transform((v) => (v ? new Date(v) : null));

const createSchema = z
  .object({
    title: z.string().trim().min(3, "Give it a title.").max(140),
    summary: z.string().trim().min(3, "One line about it, please.").max(200),
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
        message: "Links must start with https://",
      }),
    registrationClosesAt: optionalDate,
    startsAt: optionalDate,
    endsAt: optionalDate,
    requiresParentConsent: z
      .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal("")])
      .transform((v) => v === "on" || v === "true"),
    leaderboardEnabled: z
      .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal("")])
      .transform((v) => v === "on" || v === "true"),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
    message: "The end cannot be before the start.",
    path: ["endsAt"],
  })
  .refine((v) => !v.registrationClosesAt || !v.startsAt || v.registrationClosesAt <= v.startsAt, {
    message: "Entries would close after it has already started.",
    path: ["registrationClosesAt"],
  });

export type CreateCompetitionState = {
  ok: boolean;
  competitionId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCompetitionAction(input: unknown): Promise<CreateCompetitionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    // Every bad field reported at once, never the first one only. (§6)
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors, error: "Some of that needs another look." };
  }

  try {
    const competitionId = await createCompetition(session, parsed.data);
    revalidatePath("/competitions");
    return { ok: true, competitionId };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
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
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = leaderboardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That is not a competition." };

  try {
    await setLeaderboard(session, parsed.data.id, parsed.data.enabled);
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/competitions");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}

const statusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["PUBLISHED", "ARCHIVED", "DRAFT"]),
});

export async function setStatusAction(input: unknown): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That is not a valid change." };

  try {
    await setCompetitionStatus(session, parsed.data.id, parsed.data.status);
    revalidatePath("/competitions");
    revalidatePath(`/competitions/${parsed.data.id}`);
    return {
      ok: true,
      message:
        parsed.data.status === "PUBLISHED"
          ? "Published. Pupils at every school can see it now."
          : parsed.data.status === "ARCHIVED"
            ? "Withdrawn from the list."
            : "Back to a draft.",
    };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Handing in, and what it scored                                              */
/* -------------------------------------------------------------------------- */

const submitSchema = z.object({
  id: z.string().cuid(),
  // https only, for the same reason the organiser's own link is: this ends up
  // as something a child clicks.
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => /^https:\/\/\S+$/.test(v), { message: "Links must start with https://" }),
});

export async function submitAction(input: unknown): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "That link is not valid." };
  }

  try {
    await submitEntry(session, parsed.data.id, parsed.data.url);
    revalidatePath(`/competitions/${parsed.data.id}`);
    revalidatePath("/competitions");
    return { ok: true, message: "Handed in." };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}

/**
 * A score as staff type it — points, possibly with a half — and a place.
 *
 * Empty means "not recorded", which is NOT zero. A competition where zero is a
 * real score would otherwise have no way to undo a typo.
 */
const resultSchema = z.object({
  entryId: z.string().cuid(),
  score: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
      message: "A score has to be a number, and cannot be negative.",
    }),
  rank: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1), {
      message: "A place has to be a whole number, first or better.",
    }),
});

export async function recordResultAction(input: unknown): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "That result is not valid." };
  }

  try {
    await recordResult(session, parsed.data.entryId, {
      scoreMilli: parsed.data.score === null ? null : toMilli(parsed.data.score),
      rank: parsed.data.rank,
    });
    revalidatePath("/competitions");
    return {
      ok: true,
      message: parsed.data.score === null && parsed.data.rank === null ? "Result cleared." : "Result saved.",
    };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }
}
