import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { waitingJoins } from "@/lib/join-requests";
import { waitingClaimsForOffice } from "@/lib/guardian-claims";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ROLE_HOME } from "@/lib/constants";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { Decide } from "./decide";
import { ClaimList } from "./claim-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("joinRequests.title") };
}

/**
 * Everybody waiting on this reader for a yes: pupils who typed a code, and
 * guardians who asked to be linked to a pupil. An admin sees both; the head
 * the claims; a teacher the joins by the codes of the classes they teach.
 */
export default async function JoinsPage() {
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL" && ctx.role !== "TEACHER") redirect(ROLE_HOME[ctx.role]);

  const t = await getT();
  const relativeTime = await getRelativeTime();
  const [joins, claims] = await Promise.all([waitingJoins(ctx), waitingClaimsForOffice(ctx)]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("joinRequests.title")} description={t("joinRequests.description")} />

      {joins.length === 0 && claims.length === 0 && <EmptyState title={t("joinRequests.emptyTitle")} description={t("joinRequests.emptyBody")} />}

      {joins.length > 0 && (
        <section aria-labelledby="waiting-joins" className="space-y-3">
          <h2 id="waiting-joins" className="text-sm font-semibold text-fg">
            {t("joinRequests.joinsHeading")} ({joins.length})
          </h2>
          <ul className="space-y-2">
            {joins.map((join) => (
              <li key={join.id} className="rounded-[--radius-md] border border-border bg-surface p-4" data-testid="waiting-join">
                <p className="font-semibold text-fg">{join.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
                  <Badge tone="neutral" size="sm">
                    {join.via === "CLASS" ? t("joinRequests.viaClass") : t("joinRequests.viaSchool")}
                  </Badge>
                  {join.className && <span>{join.className}</span>}
                  <span>{join.age === null ? t("joinRequests.ageUnknown") : t("joinRequests.ageYears", { age: join.age })}</span>
                  {join.onRoll && (
                    <Badge tone="ok" size="sm">
                      {t("joinRequests.onRoll")}
                    </Badge>
                  )}
                  <span>· {relativeTime(join.createdAt)}</span>
                </p>
                <Decide kind="join" id={join.id} name={join.name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {claims.length > 0 && (
        <section aria-labelledby="waiting-claims" className="space-y-3">
          <h2 id="waiting-claims" className="text-sm font-semibold text-fg">
            {t("joinRequests.claimsHeading")} ({claims.length})
          </h2>
          <ClaimList claims={claims} />
        </section>
      )}
    </div>
  );
}
