import Link from "next/link";
import { LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

/**
 * "NOT SHARED WITH YOU" (DS-1, 10 Oct 2026): what a family page draws for an
 * adult child at a college instead of a 404 — the state /parent/money and
 * /parent/placement already used. `own` is for the pages no grant covers (the
 * health card, the incident log, the certificates): the sentence says the
 * record is the adult's own rather than that a grant is off. A component, not a
 * route file (moved from app/(app)/parent at the integration, 11 Oct 2026): each
 * page that draws it keeps its own PageHeader above it.
 */
export async function NotSharedState({ name, own = false, back = "/parent" }: { name: string; own?: boolean; back?: string }) {
  const t = await getT();
  return (
    <div data-testid="not-shared">
    <EmptyState
      icon={<LockSimpleIcon weight="duotone" className="size-8" />}
      title={t("familyGaps.notSharedTitle")}
      description={own ? t("familyGaps.ownRecordBody", { name }) : t("familyGaps.notSharedBody", { name })}
      action={
        <Button asChild size="sm" variant="secondary">
          <Link href={back}>{t("collegeOffice.goHome")}</Link>
        </Button>
      }
    />
    </div>
  );
}
