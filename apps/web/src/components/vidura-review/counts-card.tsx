import Link from "next/link";
import { TranslateIcon } from "@phosphor-icons/react/ssr";
import { renderingCounts } from "@/lib/assistant/renderings";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * THE GUIDE'S RENDERINGS WAITING FOR A SPEAKER (Vidura pass 2), on the operator's dashboard (/root) and the content
 * team's home (/appadmin): the counts per language and the way to the queue. The page it sits on asserts its own gate.
 */
export async function ViduraReviewCountsCard({ href }: { href: string }) {
  const [t, counts] = await Promise.all([getT(), renderingCounts()]);
  const waiting = counts.hi.unreviewed + counts.mr.unreviewed;
  return (
    <Card data-testid="vidura-review-counts">
      <CardHeader
        icon={<TranslateIcon weight="duotone" className="size-5" />}
        title={t("viduraReview.cardTitle")}
        description={waiting ? t("viduraReview.cardWaiting", { hi: counts.hi.unreviewed, mr: counts.mr.unreviewed }) : t("viduraReview.cardNone")}
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href={href}>{t("viduraReview.cardOpen")}</Link>
          </Button>
        }
      />
      <CardBody className="text-sm text-fg-muted">{t("viduraReview.cardCounts", { hiApproved: counts.hi.approved, mrApproved: counts.mr.approved, hiRejected: counts.hi.rejected, mrRejected: counts.mr.rejected })}</CardBody>
    </Card>
  );
}
