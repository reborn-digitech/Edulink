import { FacebookLogoIcon, InstagramLogoIcon } from "@phosphor-icons/react/ssr";
import type { SocialErrorCode, SocialPostOut } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Badge } from "@/components/ui/badge";
import { RetryButton } from "@/app/(app)/admin/settings/social/panel";

/** Each failure's words (meta-posting, 16 Oct 2026); Meta's own message follows where Meta gave one. */
export const SOCIAL_ERROR_KEYS: Record<SocialErrorCode, TranslationKey> = {
  RECONNECT: "social.errorReconnect",
  PERMISSION: "social.errorPermission",
  MEDIA: "social.errorMedia",
  NO_PICTURE: "social.errorNoPicture",
  NOT_CONNECTED: "social.errorNotConnected",
  NO_INSTAGRAM: "social.errorNoInstagram",
  NETWORK: "social.errorNetwork",
  POST_GONE: "social.errorPostGone",
  META: "social.errorMeta",
};

/**
 * The post's copies on Facebook and Instagram, for the school's ADMIN on the post's own page (meta-posting, 16 Oct
 * 2026): one line a network — queued, posted with a link, or failed with the reason and a Retry — and the sentence
 * that taking the post down here does not take it down there.
 */
export function SocialStatus({ items, postId, t, relative }: { items: SocialPostOut[]; postId: string; t: (key: TranslationKey, vars?: Record<string, string | number>) => string; relative: (d: Date) => string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="social-status" className="rounded-[var(--radius-lg)] border border-border bg-surface p-5" data-testid="social-status">
      <h2 id="social-status" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
        {t("social.statusTitle")}
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => {
          const Icon = item.network === "FACEBOOK" ? FacebookLogoIcon : InstagramLogoIcon;
          const network = t(item.network === "FACEBOOK" ? "social.facebook" : "social.instagram");
          return (
            <li key={item.id} className="flex flex-wrap items-start gap-3" data-testid="social-status-line" data-network={item.network} data-status={item.status}>
              <Icon weight="duotone" className="mt-0.5 size-5 shrink-0 text-fg-muted" aria-hidden />
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                  {network}
                  {item.status === "SENT" ? <Badge tone="ok" size="sm">{t("social.statusSent")}</Badge> : item.status === "FAILED" ? <Badge tone="danger" size="sm">{t("social.statusFailed")}</Badge> : <Badge tone="info" size="sm">{t("social.statusQueued")}</Badge>}
                </p>
                {item.status === "SENT" ? (
                  <p className="text-fg-muted">
                    {item.sentAt ? t("social.sentWhen", { when: relative(new Date(item.sentAt)) }) : null}{" "}
                    {item.remoteUrl ? (
                      <a href={item.remoteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-strong underline underline-offset-4">
                        {t("social.openOn", { network })}
                      </a>
                    ) : null}
                  </p>
                ) : item.status === "QUEUED" ? (
                  <p className="text-fg-muted">{item.error ? t("social.queuedAgain", { attempts: item.attempts }) : t("social.queuedFirst")}</p>
                ) : null}
                {item.error && item.status !== "SENT" ? (
                  <p className={item.status === "FAILED" ? "text-danger" : "text-fg-muted"} data-testid="social-status-error">
                    {t(SOCIAL_ERROR_KEYS[item.error.code] ?? "social.errorMeta")}
                    {item.error.detail ? <> {t("social.metaSaid", { detail: item.error.detail })}</> : null}
                  </p>
                ) : null}
              </div>
              {item.status === "FAILED" ? <RetryButton socialPostId={item.id} postId={postId} /> : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-fg-subtle">{t("social.deleteNote")}</p>
    </section>
  );
}
