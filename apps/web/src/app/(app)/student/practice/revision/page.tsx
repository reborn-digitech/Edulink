import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { revisionQueue } from "@/lib/practice-insights";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { RevisionPlayer } from "./player";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("practice.revisionTitle") };
}

/**
 * Smart revision — the queue of this child's own missed questions, rested for
 * two days and served again. Answers go through the ordinary attempt path, so
 * revision moves the same ladder and earns the same badges as practice.
 */
export default async function RevisionPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const queue = await revisionQueue(ctx, { language });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/student/practice"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon className="size-4" />
          {t("feature.practice")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("practice.revisionTitle")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {queue.length > 0 ? t("practice.revisionHint", { n: queue.length }) : null}
        </p>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={<ClockCounterClockwiseIcon weight="duotone" className="size-8" />}
          title={t("practice.revisionTitle")}
          description={t("practice.revisionEmpty")}
        />
      ) : (
        // Keyed on the reading language for the same reason as the topic
        // player: the queue was fetched in one language and lives in client
        // state, so a language switch must remount to re-serve it.
        <RevisionPlayer key={language} queue={queue} />
      )}
    </div>
  );
}
