"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bulkBodySchema, offerBodySchema, paymentBodySchema, schoolTermsExpectSchema, subscriptionTerms, termsBodySchema, type TermsBody } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { assertSuperuser } from "@/lib/superuser";
import { bulkTerms, listSubscriptions, readOffer, readSchoolTerms, schoolDay, setSchoolTerms, updateOffer } from "@/lib/school-terms";
import { partnerPreview, recordPayment, type PartnerReading } from "@/lib/subscriptions";
import { activePlans } from "@/lib/person-plans";
import { bulkSentence, offerChangeSentence, paymentSentence, switchSentence, termsChangeSentence, type Fmt } from "@/lib/terms-sentences";
import { consoleFmt } from "./fmt";

/**
 * THE SUBSCRIPTION CONSOLE'S ACTIONS (decision 0010; the brief's §2.1 to §2.4 and rule 12). Each re-reads the session and
 * re-asserts the operator, as every operator action does (a server action is its own entry point, layout or no layout),
 * parses the body with the door's own contract, calls the library the door calls, with `preview: true` for the sentence a
 * sheet or a toast shows before anything is written, and words the answer in the operator's language
 * (src/lib/terms-sentences.ts). A refusal comes back as its sentence. Nothing here keeps a rule of its own: the library is
 * the one writer and the one judge, and the door and these actions are two ways in.
 *
 * Only async functions are exported: a "use server" file that exports anything else blanks itself (the re-export trap).
 */

/**
 * An answer: the sentence, or the refusal's. `stale` marks a refusal because the terms changed meanwhile, so the screen draws
 * itself again from the server, keeping what was typed (C5 point 2); a payment's preview also answers the bill it reckoned,
 * against which its tick is judged (the review of phase 5, C5).
 */
type Said = { ok: true; sentence: string; changed: boolean; bill?: number | null; expect?: z.infer<typeof schoolTermsExpectSchema> } | { ok: false; error: string; stale?: boolean };

/** The refusals that mean the terms, the offer, the payment's standing or the subscription changed while the screen was open. */
const STALE: readonly string[] = ["root.termsChangedMeanwhile", "root.offerChangedMeanwhile", "root.paymentChangedMeanwhile", "root.subscriptionChangedMeanwhile", "root.paymentAlreadyRecorded"];
const refusal = (f: Fmt, errorKey: TranslationKey): { ok: false; error: string; stale?: boolean } => ({ ok: false, error: f.t(errorKey), ...(STALE.includes(errorKey) ? { stale: true } : {}) });

const words = consoleFmt;

async function operator() {
  const session = await requireApiUser();
  assertSuperuser(session);
  return session;
}

/** A body the contract refuses: its own sentence where the contract names one, a missing reason, else the figures' rule. */
function refused(f: Fmt, issues: { message: string; path: PropertyKey[] }[]): { ok: false; error: string } {
  const key = issues.map((i) => i.message).find((m) => /^(root|subs)\.[A-Za-z]+$/.test(m));
  if (key) return { ok: false, error: f.t(key as TranslationKey) };
  if (issues.some((i) => i.path.includes("reason"))) return { ok: false, error: f.t("root.subscriptionReasonRequired") };
  return { ok: false, error: f.t("subs.invalid") };
}

async function failure(f: Fmt, error: unknown): Promise<{ ok: false; error: string }> {
  if (error instanceof AccessError) return { ok: false, error: f.t(error.key, error.vars) };
  console.error("[root/subscriptions]", error);
  return { ok: false, error: f.t("common.tryAgainMoment") };
}

function revalidate(schoolId?: string) {
  revalidatePath("/root/subscriptions");
  revalidatePath("/root/subscriptions/prices");
  revalidatePath("/root");
  if (schoolId) revalidatePath(`/root/${schoolId}`);
}

/** A switch alone: one premium switch moved, and nothing else in the body. */
function switchOf(body: TermsBody): { role: "students" | "teachers"; on: boolean } | null {
  if (body.subscription || body.premium?.terms || body.note !== undefined) return null;
  const students = body.premium?.students;
  const teachers = body.premium?.teachers;
  if (students !== undefined && teachers === undefined) return { role: "students", on: students };
  if (teachers !== undefined && students === undefined) return { role: "teachers", on: teachers };
  return null;
}

/**
 * One school's terms (PUT …/terms): a premium switch from the Schools tab or the card, a part's terms or the note from a
 * sheet. With `preview: true` it writes nothing and answers the sentence the toast or the sheet shows; without, it saves
 * against the terms as read (`expect`) and answers what was done.
 */
export async function termsAction(schoolId: string, input: unknown): Promise<Said> {
  const f = await words();
  try {
    const session = await operator();
    const parsed = termsBodySchema.safeParse(input);
    if (!parsed.success) return refused(f, parsed.error.issues);
    const before = await readSchoolTerms(session, schoolId);
    if ("ok" in before) return refusal(f, before.errorKey);
    const result = await setSchoolTerms(session, schoolId, parsed.data);
    if ("ok" in result) return refusal(f, result.errorKey);
    if (!parsed.data.preview && result.changed) revalidate(schoolId);
    const flip = switchOf(parsed.data);
    if (flip && result.changed) return { ok: true, changed: true, sentence: switchSentence(f, { ...flip, before, after: result.terms, told: result.told, preview: Boolean(parsed.data.preview) }) };
    const noteOnly = !parsed.data.subscription && !parsed.data.premium && parsed.data.note !== undefined;
    // Where this save first sets the terms at a school with a partner, the partner's month (C2b), on the operator's screen only.
    const partner = parsed.data.preview && !before.termsSet && result.terms.termsSet ? await partnerPreview(session, schoolId, result.terms) : null;
    return { ok: true, changed: result.changed, sentence: termsChangeSentence(f, { after: result.terms, changed: result.changed, noteOnly, told: result.told, preview: Boolean(parsed.data.preview), partner }) };
  } catch (error) {
    return failure(f, error);
  }
}

/** A premium switch from a list row: the role, on or off, and the terms the row showed (the note is not on a row). */
const switchInputSchema = z.object({ role: z.enum(["students", "teachers"]), on: z.boolean(), seen: schoolTermsExpectSchema.omit({ note: true }), preview: z.boolean() }).strict();

/**
 * The server's rule beside it: a body that carries a note must come with the note as read (the review's B-3).
 *
 * A premium switch from the Schools tab, whose row shows the terms but not the operator's note (a row carries none). The save
 * is compared and set against the terms the row showed, so a row gone stale is refused by name as a sheet is; the note goes
 * with them as it stands, since the switch neither shows nor writes it (the review's B-3 guards a form that shows the note).
 */
export async function premiumSwitchAction(schoolId: string, input: unknown): Promise<Said> {
  const f = await words();
  try {
    const session = await operator();
    const parsed = switchInputSchema.safeParse(input);
    if (!parsed.success) return refused(f, parsed.error.issues);
    const now = await readSchoolTerms(session, schoolId);
    if ("ok" in now) return refusal(f, now.errorKey);
    const { role, on, seen, preview } = parsed.data;
    const expect = { ...seen, note: now.note };
    const said = await termsAction(schoolId, { premium: { [role]: on }, expect, preview });
    // A preview answers the terms it was reckoned against, the note included, so that a switch the page sends early to the
    // terms door, the page going before its toast does, goes with them as this action would (C5 point 1).
    return said.ok && preview ? { ...said, expect } : said;
  } catch (error) {
    return failure(f, error);
  }
}

/**
 * Record payment (POST …/payment). The preview is asked with the difference accepted, so it can name an amount unlike the bill
 * (the library refuses one without the tick); the save carries the tick only as the operator gave it.
 */
export async function paymentAction(schoolId: string, input: unknown): Promise<Said> {
  const f = await words();
  try {
    const session = await operator();
    const parsed = paymentBodySchema.safeParse(input);
    if (!parsed.success) return refused(f, parsed.error.issues);
    const body = parsed.data.preview ? { ...parsed.data, acceptDifference: true } : parsed.data;
    const view = await readSchoolTerms(session, schoolId);
    if ("ok" in view) return refusal(f, view.errorKey);
    const answer = await recordPayment(session, schoolId, body);
    if ("ok" in answer) return refusal(f, answer.errorKey);
    if (!parsed.data.preview) revalidate(schoolId);
    const today = (await schoolDay(session, schoolId)) ?? parsed.data.paidOn;
    return { ok: true, changed: !parsed.data.preview, bill: answer.billPaise, sentence: paymentSentence(f, { answer, view, paidOn: parsed.data.paidOn, today, amountPaise: parsed.data.amountPaise }) };
  } catch (error) {
    return failure(f, error);
  }
}

/** Our offer (PUT /api/v1/operator/offer): the Prices tab's Review change (a preview) and its save, against the offer as read. */
export async function offerAction(input: unknown): Promise<Said> {
  const f = await words();
  try {
    const session = await operator();
    const parsed = offerBodySchema.safeParse(input);
    if (!parsed.success) return refused(f, parsed.error.issues);
    const [before, asked] = await Promise.all([readOffer(), activePlans()]);
    const change = await updateOffer(session, parsed.data);
    if ("ok" in change) return refusal(f, change.errorKey);
    if (!parsed.data.preview) revalidate();
    return { ok: true, changed: true, sentence: offerChangeSentence(f, change, before, asked) };
  } catch (error) {
    return failure(f, error);
  }
}

/**
 * One change over the chosen schools (POST …/subscriptions/bulk): a premium switch on or off, or our prices for both parts.
 * "Put on our prices" names each school's terms before it, read with the list.
 */
export async function bulkAction(input: unknown): Promise<Said> {
  const f = await words();
  try {
    const session = await operator();
    const parsed = bulkBodySchema.safeParse(input);
    if (!parsed.success) return refused(f, parsed.error.issues);
    const chosen = new Set(parsed.data.schoolIds);
    const rows = parsed.data.action === "OUR_PRICES" ? (await listSubscriptions(session, {})).rows.filter((r) => chosen.has(r.schoolId)) : [];
    const before = new Map(rows.map((r) => [r.schoolId, { subscription: r.subscriptionFigure, premium: r.premiumFigure, termsSet: r.termsSet }]));
    const answer = await bulkTerms(session, parsed.data);
    if ("ok" in answer) return refusal(f, answer.errorKey);
    if (!parsed.data.preview) revalidate();
    // "Put on our prices…" first sets the terms of a school whose terms are not set: its partner's month, today and once set
    // at our prices, for each partner it touches (C4a point 9 (iii)); in the preview, the operator's screen only.
    const partners: { school: string; partner: string; today: PartnerReading; once: PartnerReading }[] = [];
    if (parsed.data.preview && parsed.data.action === "OUR_PRICES") {
      const offer = await readOffer();
      const changed = new Set(answer.changed.map((c) => c.schoolId));
      for (const r of rows.filter((r) => !r.termsSet && changed.has(r.schoolId))) {
        const ours = subscriptionTerms({ kind: r.kind, planCode: r.planCode, own: null }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps });
        const month = await partnerPreview(session, r.schoolId, { termsSet: true, subscriptionFigure: ours, pupils: r.pupils });
        if (month) partners.push({ school: r.name, ...month });
      }
    }
    return { ok: true, changed: answer.changed.length > 0, sentence: bulkSentence(f, { action: parsed.data.action, answer, before, partners }) };
  } catch (error) {
    return failure(f, error);
  }
}
