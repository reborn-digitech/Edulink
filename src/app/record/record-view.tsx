import Link from "next/link";
import { CertificateIcon, MedalIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { isoToDisplayDate } from "@/lib/dates";
import type { RecordSchool, StudentRecord } from "@/lib/student-record";

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
const REASON_LABEL: Record<string, string> = {
  TRANSFERRED: "Transferred to another school",
  GRADUATED: "Finished school here",
  LEFT: "Left this school",
};

function monthYear(value: Date): string {
  return value.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function RecordView({ record, self }: { record: StudentRecord; self: boolean }) {
  const who = record.preferredName ?? record.name;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar avatarKey={record.avatarKey} name={record.name} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg">
            {self ? "Your record" : who}
          </h1>
          <p className="truncate text-sm text-fg-muted">
            {record.name}
            {record.totals.schools > 0 && (
              <>
                {" · "}
                {record.totals.schools} school{record.totals.schools === 1 ? "" : "s"}
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
          {self ? (
            <>
              This is <strong className="text-fg">yours</strong>, and it stays here whether or not
              you are at a school on EduLink. Report cards, attendance and badges are kept exactly
              as each school wrote them — no school can change what another one said, and neither
              can you.
            </>
          ) : (
            <>
              {who}&rsquo;s record across every school you are linked to, kept exactly as each
              school wrote it. It stays here whether or not they are currently at a school on
              EduLink.
            </>
          )}
        </p>
      </div>

      {record.totals.attendanceMarked > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Figure label="Attendance" value={`${record.totals.attendancePercent}%`} />
          <Figure label="Report cards" value={String(record.totals.cards)} />
          <Figure label="Badges" value={String(record.totals.badges)} />
        </div>
      )}

      {record.schools.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="A school record appears once a school has marked a register or issued a report card."
        />
      ) : (
        record.schools.map((school) => <SchoolBlock key={school.membershipId} school={school} />)
      )}

      <p className="pb-4 text-center text-xs text-fg-muted">
        Joining a school on EduLink?{" "}
        <Link href="/login" className="font-semibold text-accent-strong underline underline-offset-4">
          Log in
        </Link>{" "}
        and it will appear here automatically.
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

function SchoolBlock({ school }: { school: RecordSchool }) {
  return (
    <Card>
      <CardHeader
        title={school.schoolName}
        description={
          <>
            {monthYear(school.joinedAt)} –{" "}
            {school.leftAt ? monthYear(school.leftAt) : "now"}
            {school.gradeLevel && <> · Grade {school.gradeLevel}</>}
          </>
        }
        action={
          school.current ? (
            <Badge tone="ok" size="sm">
              Here now
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              Left
            </Badge>
          )
        }
      />
      <CardBody className="space-y-4">
        {school.certificate && (
          <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <CertificateIcon weight="duotone" className="size-4" aria-hidden="true" />
              {REASON_LABEL[school.certificate.reason] ?? school.certificate.reason}
            </p>
            {school.certificate.destination && (
              <p className="mt-1 text-sm text-fg-muted">
                Went on to {school.certificate.destination}
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
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Attendance</p>
          {/* NULL IS NOT ZERO. A pupil who joined in the last week of term has
              no attendance, which is not the same as never turning up. */}
          {school.attendanceMarked === 0 ? (
            <p className="mt-1 text-sm text-fg-muted">No register was ever marked here.</p>
          ) : (
            <p className="mt-1 text-sm text-fg">
              <strong className="text-lg font-bold tabular-nums">
                {school.attendancePercent}%
              </strong>{" "}
              <span className="text-fg-muted">
                — {school.attendancePresent} of {school.attendanceMarked} days marked
              </span>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Report cards
          </p>
          {school.cards.length === 0 ? (
            <p className="mt-1 text-sm text-fg-muted">None issued here.</p>
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
                    {card.attendancePresent} of {card.attendanceTotal} days
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
              Badges earned
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
            Frozen as this school left it. Nothing above can change now.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
