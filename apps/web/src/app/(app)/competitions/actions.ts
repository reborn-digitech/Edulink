"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import {
  addEntrant,
  competitionZoneOf,
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
import { competitionFormSchema, fieldErrorsOf, resultFormSchema, submitFormSchema } from "@/lib/competition-forms";

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

const enterSchema = z.object({ id: z.string().cuid(), studentMembershipId: z.string().min(1).max(64).optional() });

/**
 * A pupil enrols themself; a guardian enrols their own child (decision 0007, 6 Nov 2026), which is their consent.
 * The agenda's rows call this too, so the agenda pages are revalidated with the competition's.
 */
export async function enterAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const parsed = enterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.notValidCompetition") };
  const child = parsed.data.studentMembershipId ?? null;
  return run({ id: parsed.data.id }, async (session, id) => {
    const result = await enterCompetition(session, id, { studentMembershipId: child });
    revalidatePath("/student/agenda");
    revalidatePath("/parent/agenda");
    if (session.role === "PARENT") return t("competitions.childEnrolledDot");
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

  // TA-102: the typed days are the school's days.
  const parsed = competitionFormSchema(t, await competitionZoneOf(session)).safeParse(input);
  if (!parsed.success) {
    // Every bad field reported at once, never the first one only. (§6)
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error), error: t("competitions.needsAnotherLook") };
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

export async function submitAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = submitFormSchema(t).safeParse(input);
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

const addEntrantSchema = z.object({ id: z.string().cuid(), studentMembershipId: z.string().min(1).max(64), name: z.string().max(200) });

/**
 * TA-104 (decision 0007 as amended 14 November 2026): the office or a teacher adds a pupil of the school as an
 * entrant, from the entries page. `id` is the competition; the rules are addEntrant's, and `name` only words the toast.
 */
export async function addEntrantAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = addEntrantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("competitions.choosePupilToAdd") };

  try {
    const added = await addEntrant(session, parsed.data.id, parsed.data.studentMembershipId);
    revalidatePath("/competitions");
    revalidatePath(`/competitions/${parsed.data.id}`);
    const name = parsed.data.name;
    return {
      ok: true,
      message: !added.created ? t("competitions.entrantAlready", { name }) : added.awaitingConsent ? t("competitions.entrantAddedWaiting", { name }) : t("competitions.entrantAdded", { name }),
    };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }
}

export async function recordResultAction(input: unknown): Promise<CompetitionActionState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("competitions.notSignedIn") };

  const parsed = resultFormSchema(t).safeParse(input);
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
