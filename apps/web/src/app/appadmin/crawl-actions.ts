"use server";

import { revalidatePath } from "next/cache";
import type { CompetitionCrawlState, CompetitionDismissReason, CompetitionDraftEdit, CompetitionSource, CompetitionSourceAdd } from "@edulink/contracts";
import { competitionDismissSchema, competitionDraftEditSchema, competitionSourceAddSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { CrawlJobRefusal } from "@/lib/competition-crawl-jobs";
import { DeskRefusal, deskAddSource, deskCrawls, deskDismiss, deskEditDraft, deskMarkReviewed, deskSourceAction, deskSources, deskStartCrawl, deskStopCrawl } from "@/lib/competition-crawl-desk";

/**
 * The competitions desk's presses for "Suggested from the web" and the sources (competitions-crawler,
 * 12 Oct 2026), on /appadmin and /root/competitions: the crawl's Start and Stop, a source added,
 * switched off or on, or removed, a suggestion edited, dismissed or marked reviewed. Publish is the
 * existing setCompetitionStatusAction. Every one re-reads the session; the library asserts the content
 * team's gate (the operator passes it) and audits.
 */

type Failure = { ok: false; error: string };
type Crawls = { ok: true; state: CompetitionCrawlState } | Failure;
type Sources = { ok: true; sources: CompetitionSource[] } | Failure;
type Done = { ok: true } | Failure;

async function failure(error: unknown): Promise<Failure> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  if (error instanceof CrawlJobRefusal || error instanceof DeskRefusal) return { ok: false, error: t(error.errorKey) };
  console.error("[competition-crawl]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

function touched() {
  revalidatePath("/appadmin");
  revalidatePath("/root/competitions");
  revalidatePath("/competitions");
}

export async function crawlStateAction(): Promise<Crawls> {
  try {
    const session = await requireApiUser();
    return { ok: true, state: await deskCrawls(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function startCrawlAction(sourceIds?: string[]): Promise<Crawls> {
  try {
    const session = await requireApiUser();
    await deskStartCrawl(session, sourceIds?.length ? { sourceIds } : {});
    return { ok: true, state: await deskCrawls(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function stopCrawlAction(jobId: string): Promise<Crawls> {
  try {
    const session = await requireApiUser();
    await deskStopCrawl(session, jobId);
    return { ok: true, state: await deskCrawls(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function addSourceAction(input: CompetitionSourceAdd): Promise<Sources> {
  try {
    const session = await requireApiUser();
    const parsed = competitionSourceAddSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("competitionCrawl.sourceFieldsNeeded") };
    await deskAddSource(session, parsed.data);
    touched();
    return { ok: true, sources: await deskSources(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function sourceAction(sourceId: string, action: "ENABLE" | "DISABLE" | "REMOVE"): Promise<Sources> {
  try {
    const session = await requireApiUser();
    await deskSourceAction(session, sourceId, action);
    touched();
    return { ok: true, sources: await deskSources(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function dismissAction(competitionId: string, reason: CompetitionDismissReason): Promise<Done> {
  try {
    const session = await requireApiUser();
    const parsed = competitionDismissSchema.safeParse({ reason });
    if (!parsed.success) return { ok: false, error: (await getT())("competitionCrawl.pickReason") };
    await deskDismiss(session, competitionId, parsed.data.reason);
    touched();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function editDraftAction(competitionId: string, input: CompetitionDraftEdit): Promise<Done> {
  try {
    const session = await requireApiUser();
    const parsed = competitionDraftEditSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("competitionCrawl.editInvalid") };
    await deskEditDraft(session, competitionId, parsed.data);
    touched();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function reviewedAction(competitionId: string): Promise<Done> {
  try {
    const session = await requireApiUser();
    await deskMarkReviewed(session, competitionId);
    touched();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
