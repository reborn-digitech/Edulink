import Link from "next/link";
import { FlagIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { onceSets } from "@/lib/practice-once";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";

/**
 * THE SETS A TEACHER ASSIGNED, FOR A PUPIL WITHOUT THE PLAN (decision 0008, 7 Nov 2026): drawn under the plan card
 * by the practice layout. Each opens ONCE — a fixed draw, scored — and a finished one shows its score here and on
 * its page. A server component: the sets are read once with the page, by the pupil's own session.
 */
export async function OnceSetsCard() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const sets = await onceSets(ctx, normaliseLanguage(ctx.user.prefs.locale));
  if (sets.length === 0) return null;
  return (
    <Card data-testid="once-sets">
      <CardHeader icon={<FlagIcon weight="duotone" className="size-5" />} title={t("practiceOnce.title")} description={t("practiceOnce.intro", { n: 10 })} />
      <CardBody>
        <ul className="divide-y divide-border">
          {sets.map((s) => (
            <li key={s.assignmentId} className="flex flex-wrap items-center justify-between gap-2 py-2" data-testid="once-set" data-state={s.state}>
              <div className="min-w-0">
                <Link href={`/student/practice-once/${s.assignmentId}`} className="font-medium text-fg hover:underline">
                  {s.topicName}
                </Link>
                <p className="text-xs text-fg-muted">
                  {t("practice.assignedTarget", { tier: s.targetTierName, level: s.targetLevel })}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
              </div>
              <span className="flex items-center gap-2 text-xs">
                {s.state === "DONE" ? (
                  <Badge tone="ok">{t("practiceOnce.stateDone", { correct: s.correct, total: s.total })}</Badge>
                ) : s.state === "OPEN" ? (
                  <Badge tone="accent">{t("practiceOnce.stateOpen", { answered: s.answered, total: s.total })}</Badge>
                ) : (
                  <Badge tone="neutral">{t("practiceOnce.stateNotOpened")}</Badge>
                )}
                <Link href={`/student/practice-once/${s.assignmentId}`} className="font-medium text-accent-strong underline-offset-2 hover:underline">
                  {s.state === "DONE" ? t("practiceOnce.result") : s.state === "OPEN" ? t("practiceOnce.continue") : t("practiceOnce.open")}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
