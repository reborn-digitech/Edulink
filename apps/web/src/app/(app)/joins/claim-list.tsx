import type { WaitingClaim } from "@/lib/guardian-claims";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { Decide } from "./decide";

const RELATION_KEY = { PARENT: "parent.relationParent", GUARDIAN: "parent.relationGuardian", OTHER: "parent.relationOther" } as const;

/** The claims waiting on the reader, oldest first: the office's queue and a guardian's own draw the same rows. */
export async function ClaimList({ claims }: { claims: WaitingClaim[] }) {
  const t = await getT();
  const relativeTime = await getRelativeTime();
  return (
    <ul className="space-y-2">
      {claims.map((claim) => (
        <li key={claim.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4" data-testid="waiting-claim">
          <p className="font-semibold text-fg">{t("joinRequests.claimLine", { claimant: claim.claimantName, child: claim.childName })}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
            <Badge tone="neutral" size="sm">
              {t(RELATION_KEY[claim.relation])}
            </Badge>
            {claim.claimantEmail && <span>{claim.claimantEmail}</span>}
            <span>
              {claim.className ? `${claim.className} · ` : ""}
              {claim.schoolName}
            </span>
            <span>· {relativeTime(claim.createdAt)}</span>
          </p>
          <Decide kind="claim" id={claim.id} name={claim.claimantName} />
        </li>
      ))}
    </ul>
  );
}
