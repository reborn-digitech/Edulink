import Link from "next/link";
import { CakeIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { celebrationsFor } from "@/lib/birthdays";
import { formatDateKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

/**
 * One door to the Celebrations page, worn on a pupil's Today and a teacher's
 * Classes page: the next birthday or anniversary by name and day, or a plain
 * "see upcoming" when the month is quiet. A link, not a list — the list lives
 * on Social Media where the wishes get posted.
 */
export async function CelebrationsLink({ session }: { session: ActiveContext }) {
  const t = await getT();
  // The month first; when the month is quiet, the next one anywhere in the
  // half-year — "nothing this month" is true but a dead card, and the day
  // somebody's birthday is 33 days away is exactly when a class starts
  // planning for it.
  let upcoming = await celebrationsFor(session, 30);
  let later = false;
  if (upcoming.length === 0) {
    upcoming = await celebrationsFor(session, 183);
    later = upcoming.length > 0;
  }
  const next = upcoming[0];

  return (
    <Link
      href="/bulletin/celebrations"
      className="flex items-center gap-3 rounded-[--radius-md] border border-border bg-surface p-4 hover:bg-surface-muted"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
        <CakeIcon weight="duotone" className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-fg">{t("celebrations.title")}</span>
        <span className="block truncate text-xs text-fg-muted">
          {next
            ? later
              ? t("celebrations.nextLater", { name: next.name, date: formatDateKey(next.dateKey) })
              : t("celebrations.nextUp", {
                  name: next.name,
                  date: formatDateKey(next.dateKey),
                  count: upcoming.length,
                })
            : t("celebrations.noneSoon")}
        </span>
      </span>
      <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
    </Link>
  );
}
