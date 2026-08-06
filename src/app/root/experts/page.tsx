import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listExpertsForCuration } from "@/lib/superuser";
import { EmptyState } from "@/components/ui/states";
import { CurationRow } from "./curation-row";
import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.experts") };
}

/**
 * The marketplace queue.
 *
 * WHY IT IS THE OPERATOR'S AND NOT A SCHOOL'S. An expert belongs to no school —
 * that is the whole point of a shared marketplace — so no school is in a
 * position to vouch for one, and a school that could publish would be putting an
 * adult in front of every OTHER school on the installation. Admins and teachers
 * may still invite an expert; what an invitation buys is a profile, not an
 * audience.
 */
export default async function RootExpertsPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const experts = await listExpertsForCuration(session);

  const waiting = experts.filter((e) => e.publishedAt === null);
  const listed = experts.filter((e) => e.publishedAt !== null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("expert.curationTitle")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {experts.length === 0
            ? t("expert.curationNobodyYet")
            : t("expert.curationCount", { waiting: waiting.length, listed: listed.length })}
        </p>
      </div>

      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("expert.curationNote")}
      </p>

      {experts.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={t("expert.curationEmpty")}
          description={t("expert.curationEmptyBody")}
        />
      ) : (
        <>
          {/* Waiting first, and under its own heading. A queue mixed into a
              list of people already dealt with is a queue nobody works. */}
          {waiting.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                {t("expert.waitingForYou")}
              </h2>
              {waiting.map((entry) => (
                <CurationRow key={entry.profileId} entry={entry} />
              ))}
            </section>
          )}

          {listed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                {t("expert.onMarketplace")}
              </h2>
              {listed.map((entry) => (
                <CurationRow key={entry.profileId} entry={entry} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
