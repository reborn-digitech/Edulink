import Link from "next/link";
import type { Translate } from "@/lib/i18n/dictionary";

/** The terms as links, the shown one marked; nothing when there is one or none. */
export function TermPicker({ t, terms, current, path, extra = "" }: { t: Translate; terms: { id: string; name: string }[]; current: string | null; path: string; extra?: string }) {
  if (terms.length < 2) return null;
  return (
    <nav aria-label={t("academics.whichTerm")} className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-fg-muted">{t("academics.whichTerm")}</span>
      {terms.map((term) => (
        <Link key={term.id} href={`${path}?termId=${term.id}${extra}`} aria-current={term.id === current ? "page" : undefined} className={term.id === current ? "rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-strong" : "rounded-full border border-border px-3 py-1 text-fg-muted hover:text-fg"}>
          {term.name}
        </Link>
      ))}
    </nav>
  );
}
