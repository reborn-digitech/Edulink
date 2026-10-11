import Link from "next/link";
import { CpuIcon } from "@phosphor-icons/react/ssr";
import { serversForDashboard } from "@/lib/quiz-jobs-desk";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * THE MODEL SERVERS' LINE on the operator's dashboard (/root) and the content team's home (/appadmin)
 * (the owner, 11 October 2026): each of the two local servers Running, Starting or Stopped, with the
 * model's name and the port, read live from its health endpoint (cached ten seconds, src/lib/quiz-jobs.ts),
 * and the way to the bank desk, where generation and the servers are started and stopped. The page it
 * sits on asserts its own gate.
 */
export async function ModelServersCard({ deskHref }: { deskHref: string }) {
  const [t, servers] = await Promise.all([getT(), serversForDashboard()]);
  return (
    <Card>
      <CardHeader
        icon={<CpuIcon weight="duotone" className="size-5" />}
        title={t("quizJobs.serversTitle")}
        description={t("quizJobs.dashboardIntro")}
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href={deskHref}>{t("quizJobs.dashboardLink")}</Link>
          </Button>
        }
      />
      <CardBody>
        <ul className="space-y-2" data-testid="model-servers">
          {servers.map((s) => (
            <li key={s.server} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-40 font-medium text-fg">{t(`quizJobs.server${s.server}`)}</span>
              <Badge tone={s.state === "RUNNING" ? "ok" : s.state === "STARTING" ? "warn" : "neutral"}>{t(`quizJobs.server${s.state}`)}</Badge>
              <span className="text-xs text-fg-muted">{t("quizJobs.serverLine", { model: s.model, port: s.port ?? "—" })}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
