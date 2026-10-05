import Link from "next/link";
import { ChalkboardTeacherIcon, PresentationChartIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import type { SoftSkill, TalkView, TrainingSummary } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { LINK } from "./parts";

/**
 * Pre-placement talks and soft-skills training on the web (R-2, 5 Oct 2026):
 * the words for their coded values, the badges, and the two cards other
 * placement pages carry — a drive's talk on the drive's page, and the
 * student's talks and completed trainings on their placement page.
 */

export const SKILL_KEY: Record<SoftSkill, TranslationKey> = {
  COMMUNICATION: "softSkills.skillCOMMUNICATION",
  APTITUDE: "softSkills.skillAPTITUDE",
  GROUP_DISCUSSION: "softSkills.skillGROUP_DISCUSSION",
  INTERVIEW: "softSkills.skillINTERVIEW",
  RESUME_WRITING: "softSkills.skillRESUME_WRITING",
  TEAMWORK: "softSkills.skillTEAMWORK",
  LEADERSHIP: "softSkills.skillLEADERSHIP",
  EMAIL_ETIQUETTE: "softSkills.skillEMAIL_ETIQUETTE",
  OTHER: "softSkills.skillOTHER",
};

export function talkBadge(talk: Pick<TalkView, "status" | "heldAt" | "started">, t: Translate) {
  if (talk.status === "CANCELLED") return <Badge tone="neutral">{t("talks.statusCancelled")}</Badge>;
  if (talk.heldAt) return <Badge tone="ok">{t("talks.statusHeld")}</Badge>;
  if (talk.started) return <Badge tone="warn">{t("talks.statusStarted")}</Badge>;
  return <Badge tone="accent">{t("talks.statusAhead")}</Badge>;
}

export function trainingBadge(tr: Pick<TrainingSummary, "status">, t: Translate) {
  return tr.status === "OPEN" ? <Badge tone="ok">{t("softSkills.statusOPEN")}</Badge> : <Badge tone="neutral">{t("softSkills.statusCLOSED")}</Badge>;
}

/** The drive's page: its talk, or for the TPO a link to set one. */
export function DriveTalkCard({ talk, driveId, canWrite, t, moment }: { talk: TalkView | null; driveId: string; canWrite: boolean; t: Translate; moment: (d: string) => string }) {
  if (!talk && !canWrite) return null;
  return (
    <Card>
      <CardHeader icon={<PresentationChartIcon weight="duotone" className="size-5" />} title={t("talks.driveCardTitle")} />
      <CardBody className="flex flex-wrap items-center gap-3 text-sm">
        {talk ? (
          <>
            <Link className={LINK} href={`/placement/talks/${talk.id}`}>
              {talk.title}
            </Link>
            <span>{moment(talk.startsAt)}</span>
            {talkBadge(talk, t)}
            <span className="text-fg-muted">{t("talks.countsLine", { going: talk.counts.going, present: talk.counts.present })}</span>
          </>
        ) : (
          <Link className={LINK} href={`/placement/talks?driveId=${driveId}`}>
            {t("talks.setForDrive")}
          </Link>
        )}
      </CardBody>
    </Card>
  );
}

/** The student's placement page: the talks to answer and the trainings completed, with links to both pages. */
export function StudentEventsCard({ talksAhead, completed, t }: { talksAhead: number; completed: { trainingId: string; title: string; skill: string }[]; t: Translate }) {
  return (
    <Card>
      <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("softSkills.profileTitle")} description={t("softSkills.profileIntro")} />
      <CardBody className="space-y-3 text-sm">
        {completed.length === 0 ? (
          <p className="text-fg-muted">{t("softSkills.profileNone")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {completed.map((c) => (
              <li key={c.trainingId}>
                <Badge tone="ok">
                  <SealCheckIcon weight="fill" className="size-3.5" aria-hidden />
                  {c.title} · {t(SKILL_KEY[c.skill as SoftSkill] ?? "softSkills.skillOTHER")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-4">
          <Link className={LINK} href="/student/placement/talks">
            {t("talks.studentLink", { count: talksAhead })}
          </Link>
          <Link className={LINK} href="/student/placement/training">
            {t("softSkills.studentLink")}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
