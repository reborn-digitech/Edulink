"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  libraryCopySaveSchema,
  libraryCopyUpdateSchema,
  libraryFineCreateSchema,
  libraryFineWaiveSchema,
  libraryIssueCreateSchema,
  libraryReturnSchema,
  librarySettingsSaveSchema,
  libraryStockTakeSeenSchema,
  libraryTitleCreateSchema,
  libraryTitleSaveSchema,
} from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import {
  addCopy,
  cancelReservation,
  createTitle,
  importCatalogue,
  issueCopy,
  raiseFine,
  renewLoan,
  reserveTitle,
  returnCopy,
  saveLibrarySettings,
  sendOverdueNotices,
  settleFine,
  stockTakeAction,
  stockTakeSeen,
  updateCopy,
  updateTitle,
  waiveFine,
} from "@/lib/library";

/**
 * The library's forms (module LIBRARY, 3 Oct 2026): every one posts here with
 * a `back` path — the page it came from — and returns there with ?ok= or
 * ?error= carrying a sentence in the reader's language. Who may do what is
 * decided in src/lib/library.ts, as it is for the /api/v1 doors, so the page
 * and the phone are held to the same rules.
 */

const BACK = /^\/(library|admin\/library|student\/library|parent\/library|teacher\/library)(\/[\w-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/library";
  // Keep the page's own selection (the child, the search) and drop any older message.
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

function withMessage(back: string, key: "ok" | "error", text: string): string {
  return `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
}

const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const num = (formData: FormData, name: string) => {
  const v = str(formData, name);
  return v === "" ? NaN : Number(v);
};

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;

async function run(formData: FormData, work: (ctx: ActiveContext) => Promise<Done>): Promise<void> {
  const back = backOf(formData);
  const t = await getT();
  let done: Done;
  try {
    const ctx = await requireApiUser();
    done = await work(ctx);
  } catch (error) {
    if (error instanceof AccessError) redirect(withMessage(back, "error", t(error.key, error.vars)));
    if (error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  if (!done) redirect(back);
  redirect(withMessage(back, "ok", typeof done === "string" ? t(done) : t(done.key, done.vars)));
}

class FormError extends Error {}
function parsed<T>(result: { success: true; data: T } | { success: false }): T {
  if (!result.success) throw new FormError();
  return result.data;
}

export async function issueAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(libraryIssueCreateSchema.safeParse({ accession: str(formData, "accession"), membershipId: str(formData, "membershipId") }));
    const loan = await issueCopy(ctx, input);
    return { key: "library.lentTo", vars: { title: loan.title, name: loan.memberName, due: loan.dueOn } };
  });
}

export async function returnAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const r = await returnCopy(ctx, parsed(libraryReturnSchema.safeParse({ accession: str(formData, "accession") })));
    if (r.heldFor) return { key: "library.returnedHeld", vars: { title: r.loan.title, name: r.heldFor.memberName } };
    if (r.fine) return { key: "library.returnedFine", vars: { title: r.loan.title, days: r.loan.overdueDays || Math.round(r.fine.paise / 100) } };
    return { key: "library.returnedOk", vars: { title: r.loan.title } };
  });
}

export async function renewAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const loan = await renewLoan(ctx, str(formData, "issueId"));
    return { key: "library.renewedTo", vars: { due: loan.dueOn } };
  });
}

export async function createTitleAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const accessions = str(formData, "accessions").split(/[\s,;]+/).filter(Boolean);
    const year = str(formData, "year");
    const input = parsed(
      libraryTitleCreateSchema.safeParse({
        title: str(formData, "title"),
        author: str(formData, "author"),
        isbn: str(formData, "isbn") || null,
        publisher: str(formData, "publisher"),
        year: year ? Number(year) : null,
        subject: str(formData, "subject"),
        language: str(formData, "language") || "OTHER",
        category: str(formData, "category") || "GENERAL",
        copies: accessions.map((accession) => ({ accession, rack: str(formData, "rack") })),
      }),
    );
    await createTitle(ctx, input);
    return { key: "library.titleAdded", vars: { title: input.title } };
  });
}

export async function updateTitleAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const year = str(formData, "year");
    const input = parsed(
      libraryTitleSaveSchema.safeParse({
        title: str(formData, "title"),
        author: str(formData, "author"),
        isbn: str(formData, "isbn") || null,
        publisher: str(formData, "publisher"),
        year: year ? Number(year) : null,
        subject: str(formData, "subject"),
        language: str(formData, "language") || "OTHER",
        category: str(formData, "category") || "GENERAL",
      }),
    );
    await updateTitle(ctx, str(formData, "titleId"), input);
    return "library.saved";
  });
}

export async function addCopyAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await addCopy(ctx, parsed(libraryCopySaveSchema.safeParse({ titleId: str(formData, "titleId"), accession: str(formData, "accession"), rack: str(formData, "rack") })));
    return "library.saved";
  });
}

export async function copyStatusAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const status = str(formData, "status");
    const rack = formData.has("rack") ? str(formData, "rack") : undefined;
    await updateCopy(ctx, str(formData, "copyId"), parsed(libraryCopyUpdateSchema.safeParse({ ...(status ? { status } : {}), ...(rack !== undefined ? { rack } : {}) })));
    return "library.saved";
  });
}

export async function importAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const text = str(formData, "text");
    if (!text) throw new FormError();
    const r = await importCatalogue(ctx, text);
    if (r.noHeader) return "library.importNoHeader";
    return { key: "library.importDone", vars: { titles: r.titlesCreated, matched: r.titlesMatched, copies: r.copiesCreated, skipped: r.skipped.length } };
  });
}

export async function reserveAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const childId = str(formData, "childId") || undefined;
    const membershipId = str(formData, "membershipId") || undefined;
    const r = await reserveTitle(ctx, { titleId: str(formData, "titleId"), childId, membershipId });
    return r.ready ? { key: "library.reservedReady", vars: { title: r.title } } : { key: "library.reservedPlace", vars: { title: r.title, position: r.position } };
  });
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await cancelReservation(ctx, str(formData, "reservationId"));
    return "library.reservationCancelled";
  });
}

export async function noticesAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const r = await sendOverdueNotices(ctx);
    return { key: "library.noticesSent", vars: { sent: r.sent, already: r.already } };
  });
}

export async function raiseFineAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const paise = parseRupees(str(formData, "amount"));
    await raiseFine(ctx, parsed(libraryFineCreateSchema.safeParse({ issueId: str(formData, "issueId"), reason: str(formData, "reason"), paise })));
    return "library.fineRaised";
  });
}

export async function waiveFineAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await waiveFine(ctx, str(formData, "fineId"), parsed(libraryFineWaiveSchema.safeParse({ reason: str(formData, "reason") })).reason);
    return "library.fineWaived";
  });
}

export async function settleFineAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await settleFine(ctx, str(formData, "fineId"));
    return "library.fineSettled";
  });
}

export async function stockTakeFormAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const action = str(formData, "action") === "FINISH" ? "FINISH" : "START";
    const r = await stockTakeAction(ctx, action);
    return action === "START" ? "library.stockStarted" : { key: "library.stockFinished", vars: { seen: r.seen, total: r.total } };
  });
}

export async function stockSeenAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(libraryStockTakeSeenSchema.safeParse({ accession: str(formData, "accession") }));
    const r = await stockTakeSeen(ctx, input.accession);
    return { key: "library.stockSeen", vars: { accession: input.accession, seen: r.seen, total: r.total } };
  });
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const fine = parseRupees(str(formData, "fine"));
    const input = parsed(
      librarySettingsSaveSchema.safeParse({
        pupilLimit: num(formData, "pupilLimit"),
        pupilLoanDays: num(formData, "pupilLoanDays"),
        staffLimit: num(formData, "staffLimit"),
        staffLoanDays: num(formData, "staffLoanDays"),
        maxRenewals: num(formData, "maxRenewals"),
        finePerDayPaise: fine ?? NaN,
        fineHeadId: str(formData, "fineHeadId") || null,
      }),
    );
    await saveLibrarySettings(ctx, input);
    return "library.saved";
  });
}
