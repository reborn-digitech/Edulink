import { FlagIcon } from "@phosphor-icons/react/ssr";
import { normaliseLanguage } from "@/lib/quiz";
import { childOnceSets } from "@/lib/practice-once";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";

/**
 * THE CHILD'S ONE-TIME SETS, FOR THEIR GUARDIAN (decision 0008's follow-up, the owner's confirmation of 12 Nov 2026):
 * drawn under the plan card on /parent/practice for a pupil without the Student plan — each set a teacher assigned
 * with where the child's one attempt stands (not opened, open with so many answered, done with the score). Read-only:
 * no link opens a set, since the attempt is the pupil's own. A server component; the guardian's reach is proved by
 * childOnceSets itself (assertGuardianAccess), never by the id alone.
 */
export async function ChildOnceSetsCard({ parentUserId, studentMembershipId, name, locale }: { parentUserId: string; studentMembershipId: string; name: string; locale: string | undefined }) {
  const t = await getT();
  const sets = await childOnceSets(parentUserId, studentMembershipId, normaliseLanguage(locale));
  if (sets.length === 0) return null;
  return (
    <Card data-testid="child-once-sets">
      <CardHeader icon={<FlagIcon weight="duotone" className="size-5" />} title={t("practiceOnce.guardianTitle", { name })} description={t("practiceOnce.guardianIntro", { name })} />
      <CardBody>
        <ul className="divide-y divide-border">
          {sets.map((s) => (
            <li key={s.assignmentId} className="flex flex-wrap items-center justify-between gap-2 py-2" data-testid="child-once-set" data-state={s.state}>
              <div className="min-w-0">
                <span className="font-medium text-fg">{s.topicName}</span>
                <p className="text-xs text-fg-muted">
                  {t("practice.assignedTarget", { tier: s.targetTierName, level: s.targetLevel })}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
              </div>
              {s.state === "DONE" ? (
                <Badge tone="ok">{t("practiceOnce.stateDone", { correct: s.correct, total: s.total })}</Badge>
              ) : s.state === "OPEN" ? (
                <Badge tone="accent">{t("practiceOnce.stateOpen", { answered: s.answered, total: s.total })}</Badge>
              ) : (
                <Badge tone="neutral">{t("practiceOnce.stateNotOpened")}</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
