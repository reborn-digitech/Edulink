import Link from "next/link";
import { CertificateIcon, MedalIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { isoToDisplayDate } from "@/lib/dates";
import type { RecordSchool, StudentRecord } from "@/lib/student-record";
import { getT } from "@/lib/i18n/server";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * A record, rendered the same way whether the reader is the pupil or a parent.
 *
 * ONE COMPONENT ON PURPOSE. The two pages that use it differ in exactly one
 * thing — whose record it is — and a second copy would be the place where a
 * draft report card, or a school the parent is not linked at, eventually
 * appeared for one reader and not the other. Both get what `student-record.ts`
 * returns and neither decides anything.
 */

/**
 * Written in nobody's voice, on purpose.
 *
 * The admin form that issues a certificate says "Finished THEIR schooling
 * here", which is right when a school is describing a pupil and wrong on both
 * pages that render it here — a person reading their own record, and a parent
 * reading their child's. Neutral phrasing is the only wording that is correct
 * for all three readers, and one label is better than three.
 */
const REASON_KEY: Record<string, TranslationKey> = {
  TRANSFERRED: "record.reasonTransferred",
  GRADUATED: "record.reasonGraduated",
  LEFT: "record.reasonLeft",
};

function monthYear(value: Date): string {
  return value.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export async function RecordView({ record, self }: { record: StudentRecord; self: boolean }) {
  const t = await getT();
  const who = record.preferredName ?? record.name;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar avatarKey={record.avatarKey} name={record.name} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg">
            {self ? t("record.yourRecord") : who}
          </h1>
          <p className="truncate text-sm text-fg-muted">
            {record.name}
            {record.totals.schools > 0 && (
              <>
                {" · "}
                {record.totals.schools === 1
                  ? t("record.schoolsOne")
                  : t("record.schoolsMany", { count: record.totals.schools })}
              </>
            )}
          </p>
        </div>
      </div>

      {/*
        SAID BEFORE ANYTHING ELSE, because a person who has just found that half
        the app has gone needs to know it has not been taken from them. The
        record is the thing that stays; everything missing was the school's.
      */}
      <div className="rounded-[--radius-md] border border-border bg-surface-muted p-4">
        <p className="text-sm leading-relaxed text-fg-muted">
          {/* Whole paragraphs — the bold "yours" went with the fragments, and
              the possessive in the parent's version is a placeholder for the
              same reason it is on the merge page. */}
          {self ? t("record.selfIntro") : t("record.otherIntro", { name: who })}
        </p>
      </div>

      {record.totals.attendanceMarked > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Figure label={t("record.attendance")} value={`${record.totals.attendancePercent}%`} />
          <Figure label={t("record.reportCards")} value={String(record.totals.cards)} />
          <Figure label={t("record.badges")} value={String(record.totals.badges)} />
        </div>
      )}

      {record.schools.length === 0 ? (
        <EmptyState
          title={t("record.emptyTitle")}
          description={t("record.emptyBody")}
        />
      ) : (
        record.schools.map((school) => (
          <SchoolBlock key={school.membershipId} school={school} t={t} />
        ))
      )}

      {/* Three standalone pieces rather than one sentence split around a link
          — a fragment on each side of an <a> cannot be reordered. */}
      <p className="pb-4 text-center text-xs text-fg-muted">
        {t("record.joiningPrompt")}{" "}
        <Link href="/login" className="font-semibold text-accent-strong underline underline-offset-4">
          {t("login.title")}
        </Link>{" "}
        {t("record.appearsAutomatically")}
      </p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[--radius-md] border border-border bg-surface p-3 text-center">
      <p className="text-xl font-bold tabular-nums text-fg">{value}</p>
      <p className="mt-0.5 text-xs text-fg-muted">{label}</p>
    </div>
  );
}

/* `t` is a prop for the same reason it is in `week-grid`: a plain function
   rendered by a server component has no hook provider above it. */
function SchoolBlock({ school, t }: { school: RecordSchool; t: Translate }) {
  return (
    <Card>
      <CardHeader
        title={school.schoolName}
        description={
          <>
            {monthYear(school.joinedAt)} –{" "}
            {school.leftAt ? monthYear(school.leftAt) : t("record.now")}
            {school.gradeLevel && <> · {t("record.gradeLevel", { level: school.gradeLevel })}</>}
          </>
        }
        action={
          school.current ? (
            <Badge tone="ok" size="sm">
              {t("record.hereNow")}
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              {t("record.left")}
            </Badge>
          )
        }
      />
      <CardBody className="space-y-4">
        {school.certificate && (
          <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <CertificateIcon weight="duotone" className="size-4" aria-hidden="true" />
              {REASON_KEY[school.certificate.reason]
                ? t(REASON_KEY[school.certificate.reason]!)
                : school.certificate.reason}
            </p>
            {school.certificate.destination && (
              <p className="mt-1 text-sm text-fg-muted">
                {t("record.wentOnTo", { destination: school.certificate.destination })}
              </p>
            )}
            {school.certificate.note && (
              <p className="mt-1 text-sm italic leading-relaxed text-fg-muted">
                “{school.certificate.note}”
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {t("record.attendance")}
          </p>
          {/* NULL IS NOT ZERO. A pupil who joined in the last week of term has
              no attendance, which is not the same as never turning up. */}
          {school.attendanceMarked === 0 ? (
            <p className="mt-1 text-sm text-fg-muted">{t("record.noRegisterMarked")}</p>
          ) : (
            <p className="mt-1 text-sm text-fg">
              <strong className="text-lg font-bold tabular-nums">
                {school.attendancePercent}%
              </strong>{" "}
              <span className="text-fg-muted">
                —{" "}
                {t("record.daysMarked", {
                  present: school.attendancePresent,
                  marked: school.attendanceMarked,
                })}
              </span>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {t("record.reportCards")}
          </p>
          {school.cards.length === 0 ? (
            <p className="mt-1 text-sm text-fg-muted">{t("record.noneIssued")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {school.cards.map((card) => (
                <li key={card.id} className="rounded-[--radius-sm] bg-surface-muted p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-fg">{card.title}</p>
                    {card.overallPercent !== null && (
                      <p className="text-sm font-bold tabular-nums text-fg">
                        {card.overallPercent}%
                      </p>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {isoToDisplayDate(card.fromDateKey)} – {isoToDisplayDate(card.toDateKey)} ·{" "}
                    {t("record.daysOf", {
                      present: card.attendancePresent,
                      total: card.attendanceTotal,
                    })}
                  </p>
                  {card.items.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {card.items.map((item, index) => (
                        <li
                          key={`${card.id}-${index}`}
                          className="flex justify-between gap-3 text-xs text-fg-muted"
                        >
                          <span className="min-w-0 truncate">{item.title}</span>
                          <span className="shrink-0 tabular-nums">
                            {/* An unmarked assessment is BLANK, never zero —
                                the same rule the card itself was built under. */}
                            {item.scoreMilli === null ? "—" : `${Math.round(item.scoreMilli / 1000)}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {card.remark && (
                    <p className="mt-2 text-xs italic leading-relaxed text-fg-muted">
                      “{card.remark}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {school.badges.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {t("record.badgesEarned")}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {school.badges.map((badge) => (
                <li
                  key={badge.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong"
                >
                  <MedalIcon weight="duotone" className="size-4" aria-hidden="true" />
                  {badge.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {school.leftAt && (
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-fg-muted">
            <SealCheckIcon weight="duotone" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t("record.frozen")}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
