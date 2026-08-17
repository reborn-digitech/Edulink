import Link from "next/link";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { POST_CATEGORIES, type PostCategory } from "@/lib/constants";
import { CATEGORY_KEYS } from "./categories";
import { getT } from "@/lib/i18n/server";

/**
 * The search bar and category chips, shared by the school and global feeds.
 *
 * PLAIN GET, NO SCRIPT. The form submits `q` as a query parameter and each
 * chip is a link carrying the other parameters along — so a filtered view has
 * a URL, the URL can be shared, and the back button undoes a filter the way it
 * undoes everything else. `extra` carries the parameters this bar does not own
 * (the pending/mine tab, a guardian's school picker) through both the form and
 * the chips so filtering never silently drops them.
 */
export async function FeedFilters({
  basePath,
  category,
  q,
  extra = {},
}: {
  basePath: string;
  category?: PostCategory;
  q?: string;
  extra?: Record<string, string>;
}) {
  const t = await getT();

  const href = (cat?: PostCategory) => {
    const params = new URLSearchParams(extra);
    if (cat) params.set("category", cat);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="space-y-3">
      <form action={basePath} method="GET" role="search" className="flex gap-2">
        {Object.entries(extra).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("bulletin.searchPlaceholder")}
            aria-label={t("bulletin.searchLabel")}
            className="min-h-11 w-full rounded-[--radius-md] border border-border bg-surface pl-10 pr-3.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 rounded-[--radius-md] bg-surface-muted px-4 text-sm font-medium text-fg hover:bg-border"
        >
          {t("bulletin.searchButton")}
        </button>
      </form>

      <nav aria-label={t("bulletin.categoryLabel")} className="flex flex-wrap gap-1.5">
        <Link
          href={href(undefined)}
          aria-current={!category ? "page" : undefined}
          className={
            !category
              ? "rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
              : "rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
          }
        >
          {t("bulletin.allCategories")}
        </Link>
        {POST_CATEGORIES.map((key) => (
          <Link
            key={key}
            href={href(key)}
            aria-current={category === key ? "page" : undefined}
            className={
              category === key
                ? "rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
                : "rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
            }
          >
            {t(CATEGORY_KEYS[key].name)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
