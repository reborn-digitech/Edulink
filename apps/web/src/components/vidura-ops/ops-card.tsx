import Link from "next/link";
import { ChatsCircleIcon } from "@phosphor-icons/react/ssr";
import type { ActiveContext } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { listStandardAnswers } from "@/lib/assistant/standard";
import { unansweredReport } from "@/lib/assistant/gaps";
import { panelEvals } from "@/lib/eval-jobs-desk";
import { formatInZone } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * VIDURA'S DESKS ON THE OPERATOR'S DASHBOARD (pass 3, 18 Oct 2026): the standard answers and their hits, the thirty days'
 * refusals and discards, the last evaluation run and whether the refusal gate held; each a way to its desk.
 */
export async function ViduraOpsCard({ session }: { session: ActiveContext }) {
  const t = await getT();
  const [answers, gaps, evals] = await Promise.all([listStandardAnswers(session), unansweredReport(session), panelEvals(session)]);
  const last = evals.current;
  return (
    <Card data-testid="vidura-ops-card">
      <CardHeader
        icon={<ChatsCircleIcon weight="duotone" className="size-5" />}
        title={t("viduraOps.cardTitle")}
        description={t("viduraOps.cardBody")}
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href="/root/vidura-answers">{t("viduraOps.cardOpen")}</Link>
          </Button>
        }
      />
      <CardBody>
        <ul className="space-y-1 text-sm text-fg-muted">
          <li>
            <Link className="underline" href="/root/vidura-answers">
              {t("viduraOps.cardStandard", { count: answers.standard.length, served: answers.servedTotal })}
            </Link>
          </li>
          <li>
            <Link className="underline" href="/root/vidura-unanswered">
              {t("viduraOps.cardGaps", { refused: gaps.totals.refused, discarded: gaps.totals.discarded, questions: gaps.totals.questions })}
            </Link>
          </li>
          <li>
            <Link className="underline" href="/root/vidura-evals">
              {last
                ? t(last.gate === true ? "viduraOps.cardEvalGateHolds" : last.gate === false ? "viduraOps.cardEvalGateFails" : "viduraOps.cardEval", { state: t(`quizJobs.state${last.state}`), when: formatInZone(new Date(last.createdAt), "Asia/Kolkata") })
                : t("viduraOps.cardNoEval")}
            </Link>
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}
