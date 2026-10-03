import { EyeIcon } from "@phosphor-icons/react/ssr";
import type { HealthCardReads } from "@edulink/contracts";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const ROLE_KEY: Record<HealthCardReads["reads"][number]["readerRole"], TranslationKey> = {
  ADMIN: "familyCare.readsRoleADMIN",
  PRINCIPAL: "familyCare.readsRolePRINCIPAL",
  TEACHER: "familyCare.readsRoleTEACHER",
  WARDEN: "familyCare.readsRoleWARDEN",
};

/**
 * "Who has read this": the staff reads of a child's health card, closed by
 * default under the card. A server component — the list is the page's, read
 * once with it; a parent opening the disclosure is not another request.
 */
export async function HealthCardReadsDisclosure({ reads, timezone }: { reads: HealthCardReads; timezone: string }) {
  const t = await getT();
  const locale = await getLocale();
  return (
    <details className="group rounded-[--radius-md] border border-border bg-surface-muted/50" data-testid="health-card-reads">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <EyeIcon weight="duotone" className="size-5 text-fg-muted" aria-hidden="true" />
        {t("familyCare.readsTitle")}
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg-muted">{reads.reads.length}</span>
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-3">
        <p className="text-xs leading-relaxed text-fg-muted">{t("familyCare.readsBody", { name: reads.childName, days: reads.days })}</p>
        {reads.reads.length === 0 ? (
          <p className="text-sm text-fg-subtle">{t("familyCare.readsNone", { days: reads.days })}</p>
        ) : (
          <ul className="divide-y divide-border">
            {reads.reads.map((read) => (
              <li key={read.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 text-sm">
                <span className="font-medium text-fg">
                  {read.readerName} <span className="font-normal text-fg-muted">({t(ROLE_KEY[read.readerRole])})</span>
                </span>
                <time dateTime={read.readAt} className="text-xs text-fg-muted">
                  {formatInZone(new Date(read.readAt), timezone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, locale)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
