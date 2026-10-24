import "server-only";
import { createHash, randomBytes } from "node:crypto";
import {
  EXPERT_APPLICATION_DOCUMENT_MAX_BYTES,
  EXPERT_APPLICATION_LIMITS,
  EXPERT_APPLICATION_OFFERINGS,
  EXPERT_APPLICATION_REFUSALS,
  EXPERT_APPLICATION_STATUSES,
  EXPERT_SPECIALISMS,
  EXPERT_SPECIALISMS_MAX,
  EXPERT_TEACHING_LANGUAGES,
  type ExpertApplicationBody,
  type ExpertApplicationRefusal,
  type ExpertApplicationStatus,
  type OperatorExpertApplication,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { consumeByCaller } from "./rate-limit";
import { normalisePhone } from "./phone";
import { readJsonArray, writeJson } from "./json";
import { deleteStoredFile, readStoredFile, storeFile, UploadError } from "./storage";
import { sendExpertApplicationNotice, sendExpertInvite } from "./email";
import { translator, type TranslationKey } from "./i18n/dictionary";
import { normaliseLocale, type Locale } from "./i18n/locales";
import type { ActiveContext } from "./session";

/**
 * AN EXPERT APPLIES FROM THE LOGIN PAGE; THE OPERATOR DECIDES (the owner's ask of 15 October 2026).
 *
 * Experts enter otherwise only by an invitation (ExpertInvite: a school's, or `npm run expert:invite`). This is
 * the public way in, and it makes NO ACCOUNT: an application is a row the operator reads. Experts meet minors, so
 * activation is the operator's and never self-serve.
 *
 *   submit   — the public form (/register/expert, POST /api/v1/public/expert-applications): every field checked
 *              with a sentence and the field it is about, then the caller's address is rate-limited (only a valid
 *              application costs one — it is what stores a file and sends a mail), an address that already has
 *              an expert account or an application still waiting is refused, the document is stored privately
 *              (storage.ts; a PDF, JPG or PNG of at most 5 MB, owned by the row), and the applicant is told by
 *              mail in the language they applied in.
 *   approve  — the operator: in ONE transaction, the account (no password: `passwordHash` null, the address not
 *              yet proved), an UNPUBLISHED ExpertProfile from the application (headline, bio, specialisms in
 *              English words, organisation, offering; kycStatus stays NONE so the KYC step still runs), and an
 *              ExpertInvite naming no school and bound to the address; then the invitation's own mail. Its link
 *              opens the existing /expert/invite/[token] form, which reclaims the unproved account (sets the
 *              password, marks the address proved) and keeps the profile made here (src/lib/experts.ts
 *              acceptExpertInvite). An address that already has an account (not an expert's) gets no second
 *              account: only the invitation, and the acceptance — by the signed-in owner, or a reclaim of an
 *              unproved address — makes the profile from this application, read by the invitation's id.
 *   refuse   — the operator: a coded reason (OTHER with a note), the applicant told by mail in their language.
 *
 * THE PERSON IS THE FENCE. ExpertApplication carries no schoolId and no policy (NO_SCHOOL_POLICY); every read
 * and decision here demands `isSuperuser`, and the public call writes only the row it makes.
 */

/** Valid applications per caller's address an hour: a person applies once; a loop is refused. */
export const EXPERT_APPLICATIONS_PER_HOUR = { limit: 5, windowMs: 60 * 60_000 };

/** The invitation's life, the invite flow's own (src/lib/experts.ts INVITE_TTL_DAYS). */
const INVITE_TTL_DAYS = 14;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type ApplicationField =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "organisation"
  | "headline"
  | "specialisms"
  | "languages"
  | "yearsExperience"
  | "bio"
  | "links"
  | "offering"
  | "declaration"
  | "document";

type Refusal = { ok: false; errorKey: TranslationKey; field?: ApplicationField; vars?: Record<string, string | number>; retryAfterSeconds?: number };

export type CleanApplication = {
  name: string;
  email: string;
  phone: string;
  city: string;
  organisation: string | null;
  headline: string;
  specialisms: string[];
  languages: string[];
  yearsExperience: number;
  bio: string;
  links: string[];
  offering: (typeof EXPERT_APPLICATION_OFFERINGS)[number];
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** An Indian mobile in E.164: +91 and ten digits, the first 6 to 9. */
const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;

/** An https link with a real host, or null. */
function httpsLink(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.length > EXPERT_APPLICATION_LIMITS.link) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * The form's fields, checked one by one in the order the form shows them; the first refusal names its field.
 * Pure, so the test reads every refusal without a database.
 */
export function checkApplication(input: ExpertApplicationBody): { ok: true; value: CleanApplication } | Refusal {
  const L = EXPERT_APPLICATION_LIMITS;
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > L.name) return { ok: false, errorKey: "expertApply.refuseName", field: "name" };
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, errorKey: "expertApply.refuseEmail", field: "email" };
  const phone = normalisePhone(input.phone, "+91");
  if (!phone || !INDIAN_MOBILE.test(phone)) return { ok: false, errorKey: "expertApply.refusePhone", field: "phone" };
  const city = input.city.trim().replace(/\s+/g, " ");
  if (city.length < 2 || city.length > L.city) return { ok: false, errorKey: "expertApply.refuseCity", field: "city" };
  const organisation = (input.organisation ?? "").trim().replace(/\s+/g, " ");
  if (organisation.length > L.organisation) return { ok: false, errorKey: "expertApply.refuseOrganisation", field: "organisation" };
  const headline = input.headline.trim().replace(/\s+/g, " ");
  if (headline.length < 3 || headline.length > L.headline) return { ok: false, errorKey: "expertApply.refuseHeadline", field: "headline" };
  const specialisms = [...new Set(input.specialisms)];
  if (specialisms.length < 1 || specialisms.length > EXPERT_SPECIALISMS_MAX || !specialisms.every((s) => (EXPERT_SPECIALISMS as readonly string[]).includes(s))) {
    return { ok: false, errorKey: "expertApply.refuseSpecialisms", field: "specialisms" };
  }
  const languages = [...new Set(input.languages)];
  if (languages.length < 1 || !languages.every((l) => (EXPERT_TEACHING_LANGUAGES as readonly string[]).includes(l))) {
    return { ok: false, errorKey: "expertApply.refuseLanguages", field: "languages" };
  }
  if (!Number.isInteger(input.yearsExperience) || input.yearsExperience < 0 || input.yearsExperience > L.years) {
    return { ok: false, errorKey: "expertApply.refuseYears", field: "yearsExperience" };
  }
  const bio = input.bio.trim();
  if (bio.length < 20 || bio.length > L.bio) return { ok: false, errorKey: "expertApply.refuseBio", field: "bio" };
  const typed = (input.links ?? []).map((l) => l.trim()).filter(Boolean);
  const links = typed.map(httpsLink);
  if (typed.length > L.links || links.some((l) => l === null)) return { ok: false, errorKey: "expertApply.refuseLinks", field: "links" };
  if (!(EXPERT_APPLICATION_OFFERINGS as readonly string[]).includes(input.offering)) return { ok: false, errorKey: "expertApply.refuseOffering", field: "offering" };
  if (input.declaration !== true) return { ok: false, errorKey: "expertApply.refuseDeclaration", field: "declaration" };
  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      city,
      organisation: organisation || null,
      headline,
      specialisms,
      languages,
      yearsExperience: input.yearsExperience,
      bio,
      links: [...new Set(links as string[])],
      offering: input.offering as CleanApplication["offering"],
    },
  };
}

export type SubmitResult = { ok: true; id: string; email: string } | Refusal;

/** Somebody with this address is already an expert: the account has an ExpertProfile. */
async function isExpertAddress(email: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { email }, select: { expertProfile: { select: { id: true } } } });
  return Boolean(user?.expertProfile);
}

/**
 * The public form. `document` is the uploaded file (the multipart body's `document` part), required. Never
 * signs anybody in and makes no account.
 */
export async function submitExpertApplication(
  input: ExpertApplicationBody,
  document: File | null,
  locale: string,
  opts: { now?: Date } = {},
): Promise<SubmitResult> {
  const checked = checkApplication(input);
  if (!checked.ok) return checked;
  const app = checked.value;
  if (!document || document.size === 0) return { ok: false, errorKey: "expertApply.refuseDocumentMissing", field: "document" };
  if (document.size > EXPERT_APPLICATION_DOCUMENT_MAX_BYTES) {
    return { ok: false, errorKey: "refusal.fileTooLargeLimit", field: "document", vars: { mb: EXPERT_APPLICATION_DOCUMENT_MAX_BYTES / (1024 * 1024) } };
  }

  // Only a valid application spends the caller's allowance: it is what stores a file and sends a mail.
  const gate = await consumeByCaller("expert-apply", EXPERT_APPLICATIONS_PER_HOUR);
  if (!gate.allowed) return { ok: false, errorKey: "expertApply.refuseTooMany", retryAfterSeconds: gate.retryAfterSeconds };

  // Said without revealing more: whether the address has some other account is nobody's business here.
  if (await isExpertAddress(app.email)) return { ok: false, errorKey: "expertApply.refuseAlreadyExpert", field: "email" };
  const waiting = await db.expertApplication.findFirst({ where: { email: app.email, status: "PENDING" }, select: { id: true } });
  if (waiting) return { ok: false, errorKey: "expertApply.refusePending", field: "email" };

  let fileId: string;
  try {
    const stored = await storeFile(document, { maxBytes: EXPERT_APPLICATION_DOCUMENT_MAX_BYTES });
    if (!DOCUMENT_TYPES.has(stored.mime)) {
      await deleteStoredFile(stored.fileId).catch(() => {});
      return { ok: false, errorKey: "expertApply.refuseDocumentType", field: "document" };
    }
    fileId = stored.fileId;
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, errorKey: error.key, field: "document", vars: error.vars };
    throw error;
  }

  const lang = normaliseLocale(locale);
  let id: string;
  try {
    const row = await db.expertApplication.create({
      data: {
        name: app.name,
        email: app.email,
        phone: app.phone,
        city: app.city,
        organisation: app.organisation,
        headline: app.headline,
        specialisms: writeJson(app.specialisms),
        languages: writeJson(app.languages),
        yearsExperience: app.yearsExperience,
        bio: app.bio,
        links: writeJson(app.links),
        offering: app.offering,
        documentFileId: fileId,
        declarationAt: opts.now ?? new Date(),
        locale: lang,
      },
      select: { id: true },
    });
    id = row.id;
  } catch (error) {
    await deleteStoredFile(fileId).catch(() => {});
    // Two presses at once: the partial unique index (one PENDING per address) decides.
    if ((error as { code?: string }).code === "P2002") return { ok: false, errorKey: "expertApply.refusePending", field: "email" };
    throw error;
  }

  const t = translator(lang);
  await sendExpertApplicationNotice({
    to: app.email,
    locale: lang,
    subject: t("expertApply.mailReceivedSubject"),
    lines: [t("expertApply.mailReceivedLine", { name: app.name }), t("expertApply.mailReceivedNext")],
    cta: null,
  }).catch((error) => console.error("[expert-applications] received mail failed", error));
  // No actor: nobody is signed in. The row's id and the address, never the document or the phone.
  await audit({ schoolId: null, actorUserId: null, action: "expert.application.submit", targetType: "ExpertApplication", targetId: id, meta: { email: app.email } });
  return { ok: true, id, email: app.email };
}

/* -------------------------------------------------------------------------- */
/* The operator's queue                                                        */
/* -------------------------------------------------------------------------- */

function assertOperator(ctx: ActiveContext): void {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
}

const asStatus = (raw: string): ExpertApplicationStatus => ((EXPERT_APPLICATION_STATUSES as readonly string[]).includes(raw) ? (raw as ExpertApplicationStatus) : "PENDING");
const asRefusal = (raw: string | null): ExpertApplicationRefusal | null => (raw && (EXPERT_APPLICATION_REFUSALS as readonly string[]).includes(raw) ? (raw as ExpertApplicationRefusal) : null);

/** GET /api/v1/operator/expert-applications and the /root/experts section: oldest first, the queue's order. */
export async function listExpertApplications(ctx: ActiveContext, status: ExpertApplicationStatus = "PENDING"): Promise<OperatorExpertApplication[]> {
  assertOperator(ctx);
  const rows = await db.expertApplication.findMany({ where: { status }, orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" }, take: 200 });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    organisation: r.organisation,
    headline: r.headline,
    specialisms: readJsonArray<string>(r.specialisms),
    languages: readJsonArray<string>(r.languages),
    yearsExperience: r.yearsExperience,
    bio: r.bio,
    links: readJsonArray<string>(r.links),
    offering: r.offering,
    hasDocument: r.documentFileId !== null,
    declarationAt: r.declarationAt.toISOString(),
    status: asStatus(r.status),
    refusalCode: asRefusal(r.refusalCode),
    refusalNote: r.refusalNote,
    decidedAt: r.decidedAt?.toISOString() ?? null,
    locale: r.locale,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * The application's document, for the operator alone: the file id is read off the application's own row, so
 * the door can open no other file — the application owns what it opens. Null when there is no such
 * application, no document, or the bytes are gone; the door answers each the same 404.
 */
export async function readExpertApplicationDocument(ctx: ActiveContext, applicationId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  assertOperator(ctx);
  const row = await db.expertApplication.findUnique({ where: { id: applicationId }, select: { documentFileId: true } });
  if (!row?.documentFileId) return null;
  return readStoredFile(row.documentFileId);
}

/**
 * What an approved application puts on an ExpertProfile: the profile's specialisms are free text everywhere
 * else (the marketplace prints them as they are), so the codes become their English words.
 */
export function profileFromApplication(row: { headline: string; bio: string; specialisms: string; organisation: string | null; offering: string }) {
  const en = translator("en");
  const words = readJsonArray<string>(row.specialisms)
    .filter((code) => (EXPERT_SPECIALISMS as readonly string[]).includes(code))
    .map((code) => en(`expertApply.specialism${code}` as TranslationKey));
  return { headline: row.headline, bio: row.bio, specialisms: writeJson(words), organisation: row.organisation, offering: (EXPERT_APPLICATION_OFFERINGS as readonly string[]).includes(row.offering) ? row.offering : "BOTH" };
}

export type DecideInput = { decision: "APPROVE" | "REFUSE"; reason?: ExpertApplicationRefusal; note?: string };
export type DecideResult =
  | { ok: true; status: "APPROVED" | "REFUSED"; userId: string | null; inviteSent: boolean; already?: boolean }
  | { ok: false; errorKey: TranslationKey };

/**
 * A press that finds the application already decided (QA-37): the same decision is answered as it stands, `already`,
 * so the losing half of a double press reads as done rather than as a failure; the other decision is refused.
 */
async function asDecided(applicationId: string, decision: DecideInput["decision"]): Promise<DecideResult> {
  const now = await db.expertApplication.findUnique({ where: { id: applicationId }, select: { status: true, createdUserId: true } });
  const wanted = decision === "APPROVE" ? "APPROVED" : "REFUSED";
  if (now?.status !== wanted) return { ok: false, errorKey: "expertApply.alreadyDecided" };
  return { ok: true, status: wanted, userId: wanted === "APPROVED" ? now.createdUserId : null, inviteSent: false, already: true };
}

/** Thrown inside the approval's transaction when somebody decided the row first: the whole approval rolls back. */
class DecidedMeanwhile extends Error {}

/** POST /api/v1/operator/expert-applications/{id}/decide and the /root/experts buttons. */
export async function decideExpertApplication(ctx: ActiveContext, applicationId: string, input: DecideInput, now: Date = new Date()): Promise<DecideResult> {
  assertOperator(ctx);
  const app = await db.expertApplication.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, errorKey: "expertApply.noSuchApplication" };
  if (app.status !== "PENDING") return asDecided(app.id, input.decision);
  const lang: Locale = normaliseLocale(app.locale);

  if (input.decision === "REFUSE") {
    const reason = input.reason;
    if (!reason || !(EXPERT_APPLICATION_REFUSALS as readonly string[]).includes(reason)) return { ok: false, errorKey: "expertApply.needReason" };
    const note = (input.note ?? "").trim().slice(0, 500) || null;
    if (reason === "OTHER" && !note) return { ok: false, errorKey: "expertApply.needNote" };
    const done = await db.expertApplication.updateMany({
      where: { id: app.id, status: "PENDING" },
      data: { status: "REFUSED", refusalCode: reason, refusalNote: note, decidedAt: now, decidedByUserId: ctx.user.id },
    });
    if (done.count === 0) return asDecided(app.id, input.decision);
    const t = translator(lang);
    const lines = [t("expertApply.mailRefusedLine", { name: app.name }), t(`expertApply.mailReason${reason}`)];
    if (note) lines.push(t("expertApply.mailRefusedNote", { note }));
    lines.push(t("expertApply.mailRefusedAgain"));
    await sendExpertApplicationNotice({ to: app.email, locale: lang, subject: t("expertApply.mailRefusedSubject"), lines, cta: null }).catch((error) =>
      console.error("[expert-applications] refusal mail failed", error),
    );
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.expertApplication.refuse", targetType: "ExpertApplication", targetId: app.id, meta: { email: app.email, reason, noted: Boolean(note) } });
    return { ok: true, status: "REFUSED", userId: null, inviteSent: false };
  }

  // APPROVE.
  const existing = await db.user.findUnique({ where: { email: app.email }, select: { id: true, expertProfile: { select: { id: true } } } });
  if (existing?.expertProfile) {
    // An expert account under this address may be the one an approval of this very application just made.
    const meanwhile = await asDecided(app.id, input.decision);
    return meanwhile.ok ? meanwhile : { ok: false, errorKey: "expertApply.addressIsExpert" };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000);
  let userId: string | null;
  try {
    userId = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      let madeUserId: string | null = null;
      if (!existing) {
        const user = await tx.user.create({
          // No password (the invitation's form sets it) and the address not yet proved (opening the link proves it).
          data: { email: app.email, name: app.name, passwordHash: null, prefs: writeJson({ theme: "system", locale: lang }) },
          select: { id: true },
        });
        madeUserId = user.id;
        // Unpublished, KYC at NONE: curation and the identity check are still the operator's next steps.
        await tx.expertProfile.create({ data: { userId: user.id, ...profileFromApplication(app) }, select: { id: true } });
      }
      const invite = await tx.expertInvite.create({
        data: { schoolId: null, tokenHash, email: app.email, name: app.name, invitedByMembershipId: null, expiresAt },
        select: { id: true },
      });
      const moved = await tx.expertApplication.updateMany({
        where: { id: app.id, status: "PENDING" },
        data: { status: "APPROVED", decidedAt: now, decidedByUserId: ctx.user.id, createdUserId: madeUserId, inviteId: invite.id },
      });
      if (moved.count === 0) throw new DecidedMeanwhile();
      return madeUserId;
    });
  } catch (error) {
    if (error instanceof DecidedMeanwhile) return asDecided(app.id, input.decision);
    // The same address made an account between the read above and the write: either the other half of a double
    // press approving this application (answered as done, QA-37), or somebody else's account (refused, not merged).
    if ((error as { code?: string }).code === "P2002") {
      const meanwhile = await asDecided(app.id, input.decision);
      return meanwhile.ok ? meanwhile : { ok: false, errorKey: "expertApply.addressIsExpert" };
    }
    throw error;
  }

  // After the commit: a mail provider's hiccup must not undo an approval; the operator is told and can re-invite.
  let inviteSent = true;
  await sendExpertInvite(app.email, `${APP_URL}/expert/invite/${token}`, null, lang).catch((error) => {
    inviteSent = false;
    console.error("[expert-applications] invitation mail failed", error);
  });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.expertApplication.approve", targetType: "ExpertApplication", targetId: app.id, meta: { email: app.email, newAccount: userId !== null, inviteSent } });
  return { ok: true, status: "APPROVED", userId, inviteSent };
}

/** The application an invitation was sent for (the acceptance reads it to make the profile of an existing account). */
export async function applicationForInvite(inviteId: string): Promise<{ headline: string } | null> {
  return db.expertApplication.findFirst({ where: { inviteId, status: "APPROVED" }, select: { headline: true } });
}
