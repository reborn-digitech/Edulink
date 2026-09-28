import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { waitingClaimsForGuardian } from "@/lib/guardian-claims";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { ClaimList } from "../../joins/claim-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("joinRequests.parentClaimsTitle") };
}

/**
 * Somebody typed this guardian's child's code and date of birth. A guardian
 * the child already has is the person most likely to know whether they
 * should have, so the claim waits here as well as at the office.
 */
export default async function ParentClaimsPage() {
  const ctx = await requireParent();
  const t = await getT();
  const claims = await waitingClaimsForGuardian(ctx.user.id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("joinRequests.parentClaimsTitle")} description={t("joinRequests.parentClaimsBody")} />
      {claims.length === 0 ? <EmptyState title={t("joinRequests.parentClaimsNone")} /> : <ClaimList claims={claims} />}
    </div>
  );
}
