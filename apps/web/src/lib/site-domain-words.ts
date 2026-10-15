import type { SiteCertStatus, SiteDomain, SiteDomainStatus } from "@edulink/contracts";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * The words for a school domain's state (website-builder B, 15 October 2026), shared by the office's screen
 * (/admin/website/domain) and the operator's table (/root/sites). The row holds codes; these say them.
 */

export const STATUS_KEYS: Record<SiteDomainStatus, { label: TranslationKey; what: TranslationKey; tone: "warn" | "info" | "ok" | "danger" }> = {
  PENDING_DNS: { label: "siteDomains.statusPendingDns", what: "siteDomains.statusPendingDnsWhat", tone: "warn" },
  VERIFYING: { label: "siteDomains.statusVerifying", what: "siteDomains.statusVerifyingWhat", tone: "info" },
  LIVE: { label: "siteDomains.statusLive", what: "siteDomains.statusLiveWhat", tone: "ok" },
  FAILED: { label: "siteDomains.statusFailed", what: "siteDomains.statusFailedWhat", tone: "danger" },
};

export const CERT_KEYS: Record<SiteCertStatus, TranslationKey> = {
  NONE: "siteDomains.certNone",
  REQUESTED: "siteDomains.certRequested",
  ISSUED: "siteDomains.certIssued",
  FAILED: "siteDomains.certRefused",
};

/** The last thing that went wrong, in plain words, or null. `target` is where a www record should point. */
export function domainProblem(t: Translate, d: Pick<SiteDomain, "dnsError" | "certError">, target: string): string | null {
  if (d.dnsError) {
    const { code, host, found } = d.dnsError;
    if (code === "NO_RECORD") return t("siteDomains.dnsNoRecord", { host });
    if (code === "WRONG_TARGET") return t("siteDomains.dnsWrongTarget", { host, found: found ?? "", target });
    return t("siteDomains.dnsLookupFailed", { host });
  }
  if (d.certError) {
    const { code, host } = d.certError;
    if (code === "NOT_CONFIGURED") return t("siteDomains.certNotConfigured");
    if (code === "FLY_ERROR") return t("siteDomains.certFlyError");
    return t("siteDomains.certFailed", { host: host ?? "" });
  }
  return null;
}
