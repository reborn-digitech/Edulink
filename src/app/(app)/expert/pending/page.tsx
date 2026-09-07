import type { Metadata } from "next";
import { HourglassIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.awaitingReview") };
}

/**
 * Where an unpublished expert lands.
 *
 * Accepting an invitation creates an account, not a listing. Saying so plainly
 * is the point of this page — an expert who signs up and then finds an empty
 * app assumes it is broken.
 */
export default async function ExpertPendingPage() {
  const t = await getT();
  await requireUser();
  return (
    <div className="mx-auto max-w-lg py-10">
      <EmptyState
        icon={<HourglassIcon weight="duotone" className="size-8" />}
        title={t("expert.underReview")}
        description={t("expert.underReviewBody")}
        action={
          <Button asChild variant="secondary">
            <Link href="/account">{t("expert.pendingCta")}</Link>
          </Button>
        }
      />
    </div>
  );
}
