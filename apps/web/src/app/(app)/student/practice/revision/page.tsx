import type { Metadata } from "next";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { revisionQueue } from "@/lib/practice-insights";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { RevisionPlayer } from "./player";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        title={t("practice.revisionTitle")}
        description={queue.length > 0 ? t("practice.revisionHint", { n: queue.length }) : undefined}
        back={{ href: "/student/practice", label: t("feature.practice") }}
      />


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
