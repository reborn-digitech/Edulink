"use server";

import {
  eResourceSaveSchema,
  isbnImportBodySchema,
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
  libraryVolumeSaveSchema,
  periodicalSubscriptionSaveSchema,
} from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { answerForm } from "@/lib/form-action";
import type { FieldMap, FormState } from "@/lib/form-state";
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
import { addVolume, removeVolume, savePeriodicalSubscription } from "@/lib/library-periodicals";
import { importIsbnList, isbnImportSentence, saveEResource } from "@/lib/college-campus";

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


const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const num = (formData: FormData, name: string) => {
  const v = str(formData, name);
  return v === "" ? NaN : Number(v);
};

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;

/**
 * Every form answers in place (A3-journeys-27, risks batch): through
 * <ActionForm>, a refusal keeps what was typed and sits under the box it is
 * about (lib/form-state.ts), a done is a toast and the page it came from is
 * refreshed. Nothing redirects with ?error= any more.
 */
async function run(previous: FormState, formData: FormData, work: (ctx: ActiveContext) => Promise<Done>, fields?: FieldMap): Promise<FormState> {
  return answerForm(previous, formData, async () => work(await requireApiUser()), { revalidate: [backOf(formData)], fields });
}

class FormError extends Error {
  override name = "FormError";
}
function parsed<T>(result: { success: true; data: T } | { success: false; error?: unknown }): T {
  if (!result.success) throw Object.assign(new FormError(), { cause: result.error });
  return result.data;
}

export async function issueAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const input = parsed(libraryIssueCreateSchema.safeParse({ accession: str(formData, "accession"), membershipId: str(formData, "membershipId") }));
    const loan = await issueCopy(ctx, input);
    return { key: "library.lentTo", vars: { title: loan.title, name: loan.memberName, due: loan.dueOn } };
  });
}

export async function returnAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const r = await returnCopy(ctx, parsed(libraryReturnSchema.safeParse({ accession: str(formData, "accession") })));
    if (r.heldFor) return { key: "library.returnedHeld", vars: { title: r.loan.title, name: r.heldFor.memberName } };
    if (r.fine) return { key: "library.returnedFine", vars: { title: r.loan.title, days: r.loan.overdueDays || Math.round(r.fine.paise / 100) } };
    return { key: "library.returnedOk", vars: { title: r.loan.title } };
  });
}

export async function renewAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const loan = await renewLoan(ctx, str(formData, "issueId"));
    return { key: "library.renewedTo", vars: { due: loan.dueOn } };
  });
}

export async function createTitleAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
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

export async function updateTitleAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
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

export async function addCopyAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    await addCopy(ctx, parsed(libraryCopySaveSchema.safeParse({ titleId: str(formData, "titleId"), accession: str(formData, "accession"), rack: str(formData, "rack") })));
    return "library.saved";
  });
}

export async function copyStatusAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const status = str(formData, "status");
    const rack = formData.has("rack") ? str(formData, "rack") : undefined;
    await updateCopy(ctx, str(formData, "copyId"), parsed(libraryCopyUpdateSchema.safeParse({ ...(status ? { status } : {}), ...(rack !== undefined ? { rack } : {}) })));
    return "library.saved";
  });
}

export async function importAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const text = str(formData, "text");
    if (!text) throw new FormError();
    const r = await importCatalogue(ctx, text);
    if (r.noHeader) return "library.importNoHeader";
    return { key: "library.importDone", vars: { titles: r.titlesCreated, matched: r.titlesMatched, copies: r.copiesCreated, skipped: r.skipped.length } };
  });
}

export async function reserveAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const childId = str(formData, "childId") || undefined;
    const membershipId = str(formData, "membershipId") || undefined;
    const r = await reserveTitle(ctx, { titleId: str(formData, "titleId"), childId, membershipId });
    return r.ready ? { key: "library.reservedReady", vars: { title: r.title } } : { key: "library.reservedPlace", vars: { title: r.title, position: r.position } };
  });
}

export async function cancelReservationAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    await cancelReservation(ctx, str(formData, "reservationId"));
    return "library.reservationCancelled";
  });
}

export async function noticesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const r = await sendOverdueNotices(ctx);
    return { key: "library.noticesSent", vars: { sent: r.sent, already: r.already } };
  });
}

export async function raiseFineAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const paise = parseRupees(str(formData, "amount"));
    await raiseFine(ctx, parsed(libraryFineCreateSchema.safeParse({ issueId: str(formData, "issueId"), reason: str(formData, "reason"), paise })));
    return "library.fineRaised";
  });
}

export async function waiveFineAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    await waiveFine(ctx, str(formData, "fineId"), parsed(libraryFineWaiveSchema.safeParse({ reason: str(formData, "reason") })).reason);
    return "library.fineWaived";
  });
}

export async function settleFineAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    await settleFine(ctx, str(formData, "fineId"));
    return "library.fineSettled";
  });
}

export async function stockTakeFormAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const action = str(formData, "action") === "FINISH" ? "FINISH" : "START";
    const r = await stockTakeAction(ctx, action);
    return action === "START" ? "library.stockStarted" : { key: "library.stockFinished", vars: { seen: r.seen, total: r.total } };
  });
}

export async function stockSeenAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const input = parsed(libraryStockTakeSeenSchema.safeParse({ accession: str(formData, "accession") }));
    const r = await stockTakeSeen(ctx, input.accession);
    return { key: "library.stockSeen", vars: { accession: input.accession, seen: r.seen, total: r.total } };
  });
}

export async function saveSettingsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
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

/* ---- a periodical's subscription and volumes (G4-21, risks batch 5 Oct 2026; library-periodicals.ts decides) ---- */

export async function saveSubscriptionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const input = parsed(periodicalSubscriptionSaveSchema.safeParse({ frequency: str(formData, "frequency"), subscriptionFrom: str(formData, "subscriptionFrom") || null, subscriptionUntil: str(formData, "subscriptionUntil") || null }));
    await savePeriodicalSubscription(ctx, str(formData, "titleId"), input);
    return "risksWeb.subscriptionSaved";
  });
}

export async function addVolumeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    const input = parsed(libraryVolumeSaveSchema.safeParse({ volume: str(formData, "volume"), issue: str(formData, "issue"), receivedOn: str(formData, "receivedOn") }));
    await addVolume(ctx, str(formData, "titleId"), input);
    return { key: "risksWeb.volumeAdded", vars: { volume: input.volume, issue: input.issue || "—" } };
  });
}

export async function removeVolumeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx): Promise<Done> => {
    await removeVolume(ctx, str(formData, "titleId"), str(formData, "volumeId"));
    return "risksWeb.volumeRemoved";
  });
}

/* ---- owner-batch-item9 (27 Oct 2026): the e-resources and a publisher's ISBN list at a school's desk ---- */
// The doors item 5 opened to a school (college-campus.ts, through campusDesk: the librarian and the office, LIBRARY on)
// get the desk's own forms; the rules stay the library functions'.

/** Add an e-resource, or correct one's link and kind: the name is the key, so a name already listed is corrected. */
export async function eResourceSaveAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(
    previous,
    formData,
    async (ctx): Promise<Done> => {
      const url = str(formData, "url");
      // Said in words beside the box, rather than as the schema's bare "not valid".
      if (url && !url.startsWith("https://")) throw new AccessError("collegeOffice.refuseUrl");
      const input = parsed(eResourceSaveSchema.safeParse({ name: str(formData, "name"), url, kind: str(formData, "kind") }));
      const saved = await saveEResource(ctx, input);
      return { key: "schoolForms.eresSaved", vars: { name: saved.name } };
    },
    { "collegeOffice.refuseUrl": "url" },
  );
}

/** A publisher's ISBN list pasted: titles added once by ISBN; an ISBN whose check digit fails is named back. */
export async function isbnListAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(
    previous,
    formData,
    async (ctx): Promise<Done> => {
      const text = String(formData.get("text") ?? "");
      // qb-C (QB-11): an empty paste is told what is wanted, beside the box, rather than "That is not valid."
      if (!text.trim()) throw new AccessError("campusForms.isbnEmpty");
      // One title or many (qb-C, QB-11): "1 title added", never "1 titles added".
      return isbnImportSentence(await importIsbnList(ctx, parsed(isbnImportBodySchema.safeParse({ text })).text));
    },
    { text: "text", "campusForms.isbnEmpty": "text" },
  );
}
