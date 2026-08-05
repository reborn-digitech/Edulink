import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listExpertsForCuration } from "@/lib/superuser";
import { EmptyState } from "@/components/ui/states";
import { CurationRow } from "./curation-row";

export const metadata = { title: "Experts" };

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
  const session = await requireSuperuser();
  const experts = await listExpertsForCuration(session);

  const waiting = experts.filter((e) => e.publishedAt === null);
  const listed = experts.filter((e) => e.publishedAt !== null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Experts</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {experts.length === 0
            ? "Nobody has accepted an expert invitation yet"
            : `${waiting.length} waiting · ${listed.length} listed`}
        </p>
      </div>

      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        Schools and teachers can invite an expert; only you can put one in front of schools. Until
        you list somebody they cannot be found, cannot be booked, and cannot be paired with a child.
      </p>

      {experts.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title="No expert profiles yet"
          description="An expert appears here once they accept an invitation and write a profile. Schools send those invitations; you decide who is listed."
        />
      ) : (
        <>
          {/* Waiting first, and under its own heading. A queue mixed into a
              list of people already dealt with is a queue nobody works. */}
          {waiting.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                Waiting for you
              </h2>
              {waiting.map((entry) => (
                <CurationRow key={entry.profileId} entry={entry} />
              ))}
            </section>
          )}

          {listed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                On the marketplace
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
