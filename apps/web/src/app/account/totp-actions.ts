"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { retryHintKey } from "@/lib/rate-limit";
import { encodeQr, qrSvgPath } from "@/lib/qr";
import { confirmTwoFactor, disableTwoFactor, startTwoFactor } from "@/lib/two-factor";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The account page's two-step sign-in card, as server actions over
 * src/lib/two-factor.ts — the same library the phone's endpoints call, so
 * the rules live once. The QR is drawn here, on the server, as one SVG path.
 */

export type TotpStartState = { ok: true; secret: string; uri: string; account: string; qr: { d: string; viewBox: string } } | { ok: false; error: string };
export type TotpConfirmState = { ok: true; recoveryCodes: string[] } | { ok: false; error: string };
export type TotpDisableState = { ok: true } | { ok: false; error: string };

const REASON_KEYS: Record<string, TranslationKey> = {
  ineligible: "totp.ineligible",
  unavailable: "totp.unavailable",
  alreadyOn: "totp.alreadyOn",
  nothingPending: "totp.nothingPending",
  notOn: "totp.notOn",
  wrongCode: "totp.wrongCode",
};

async function sentence(reason: string, retryAfterSeconds?: number): Promise<string> {
  const t = await getT();
  if (reason === "rate") {
    const h = retryHintKey(retryAfterSeconds ?? 60);
    return t("login.tooManyAttempts", { when: t(h.key, h.vars) });
  }
  return t(REASON_KEYS[reason] ?? "account.didNotWork");
}

export async function startTotp(): Promise<TotpStartState> {
  const session = await requireApiUser();
  const result = await startTwoFactor(session.user.id);
  if (!result.ok) return { ok: false, error: await sentence(result.reason) };
  return { ok: true, secret: result.secret, uri: result.uri, account: result.account, qr: qrSvgPath(encodeQr(result.uri)) };
}

export async function confirmTotp(code: string): Promise<TotpConfirmState> {
  const session = await requireApiUser();
  const result = await confirmTwoFactor(session.user.id, code ?? "");
  if (!result.ok) return { ok: false, error: await sentence(result.reason, result.retryAfterSeconds) };
  revalidatePath("/account");
  return { ok: true, recoveryCodes: result.recoveryCodes };
}

export async function disableTotp(code: string): Promise<TotpDisableState> {
  const session = await requireApiUser();
  const result = await disableTwoFactor(session.user.id, code ?? "");
  if (!result.ok) return { ok: false, error: await sentence(result.reason, result.retryAfterSeconds) };
  revalidatePath("/account");
  return { ok: true };
}
