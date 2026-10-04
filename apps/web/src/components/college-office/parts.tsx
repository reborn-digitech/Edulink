import Link from "next/link";
import type { ReactNode } from "react";
import { BuildingsIcon } from "@phosphor-icons/react/ssr";
import { formatPaise, type Locale } from "@edulink/i18n";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { formatDateKey } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * The college office's shared pieces (4 Oct 2026): money and days as the
 * reader reads them, a plain table, the state a school sees on a college-only
 * page, and the words for the coded lists. Every form on these pages posts to
 * app/(app)/accounts/actions.ts with `back`.
 */

export { Flash } from "@/components/library/parts";

export const money = (paise: number, locale: string) => formatPaise(paise, locale as Locale);
export const day = (key: string, locale: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);

export const CATEGORY_KEY = (c: string) => `collegeOffice.cat${c}` as TranslationKey;
export const QUOTA_KEY = (q: string) => `collegeOffice.quota${q}` as TranslationKey;
export const SCHEME_KEY = (s: string) => `collegeOffice.scheme${s}` as TranslationKey;
export const CLAIM_STATUS_KEY = (s: string) => `collegeOffice.claim${s}` as TranslationKey;
export const APP_STATUS_KEY = (s: string) => `collegeOffice.app${s}` as TranslationKey;
export const DOC_KEY = (d: string) => `collegeOffice.doc_${d}` as TranslationKey;
export const DESK_KEY = (d: string) => `collegeOffice.desk${d}` as TranslationKey;
export const EVENT_KEY = (e: string) => `collegeOffice.event${e}` as TranslationKey;
export const ROUND_KIND_KEY = (k: string) => `collegeOffice.round${k}` as TranslationKey;

/** A page of a college's office opened at a school: there is nothing here for it. */
export function NotCollege({ t }: { t: Translate }) {
  return (
    <EmptyState
      icon={<BuildingsIcon weight="duotone" className="size-8" />}
      title={t("collegeOffice.notCollegeTitle")}
      description={t("collegeOffice.notCollegeBody")}
      action={
        <Button asChild variant="secondary">
          <Link href="/">{t("collegeOffice.goHome")}</Link>
        </Button>
      }
    />
  );
}

/** A plain, scrollable table; the header row is the column names. */
export function Table({ head, children, testId }: { head: string[]; children: ReactNode; testId?: string }) {
  return (
    <TableScroll data-testid={testId}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="py-2 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </TableScroll>
  );
}

export function Hidden({ fields }: { fields: Record<string, string | undefined> }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />))}
    </>
  );
}
