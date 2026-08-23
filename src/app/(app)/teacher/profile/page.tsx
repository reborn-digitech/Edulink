import type { Metadata } from "next";
import { staffRecordFor, leaveBalanceFor } from "@/lib/staff-records";
import { LeaveBalanceCard } from "@/components/leave-balance-card";
import { formatDateKey } from "@/lib/dates";
import { BooksIcon, StarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { teacherReviewAggregate } from "@/lib/reviews";
import { QUESTION_KEY } from "@/lib/review-questions";
import { REVIEW_QUESTIONS } from "@/lib/constants";
import { readJsonArray } from "@/lib/json";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "../../student/profile/form";
import { getT } from "@/lib/i18n/server";
import { mayEditOwnBirthdate } from "@/lib/birthdate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.teacherProfile") };
}

/**
 * The teacher's own profile — the student page's shape on purpose (same
 * identity form, same card rhythm) plus the two things only a teacher has:
 * the subjects they teach, and the ratings their school's review rounds have
 * gathered. Aggregates only, which is the same promise the respondents were
 * given — see reviews.ts.
 */
export default async function TeacherProfilePage() {
  const t = await getT();
  const ctx = await requireRole("TEACHER");

  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: { select: { name: true, preferredName: true, bio: true, avatarKey: true, email: true, birthdate: true } },
      school: { select: { name: true } },
      classTeachers: { include: { class: { select: { name: true } } } },
    },
  });

  const subjects = readJsonArray<string>(membership.subjects);
  const [agg, record, balance] = await Promise.all([
    teacherReviewAggregate(ctx, ctx.membershipId!),
    staffRecordFor(ctx, ctx.membershipId!),
    leaveBalanceFor(ctx.schoolId!, ctx.membershipId!),
  ]);
  const recordRows = record
    ? [
        [t("staff.staffNumber"), record.staffNumber],
        [t("staff.designation"), record.designation],
        [t("staff.qualification"), record.qualification],
        [t("staff.joinedOn"), record.joinedOnKey ? formatDateKey(record.joinedOnKey, { dateStyle: "medium" }) : null],
        [t("staff.leaveDays"), record.leaveDaysPerYear === null ? null : String(record.leaveDaysPerYear)],
      ].filter((r): r is [string, string] => Boolean(r[1]))
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("meta.teacherProfile")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {membership.school.name}
          {membership.title ? ` · ${membership.title}` : ""}
          {membership.classTeachers.length > 0
            ? ` · ${membership.classTeachers.map((row) => row.class.name).join(", ")}`
            : ""}
        </p>
      </div>

      <Card>
        <CardBody>
          <ProfileForm
            fullName={membership.user.name}
            preferredName={membership.user.preferredName ?? ""}
            bio={membership.user.bio ?? ""}
            birthdate={membership.user.birthdate?.toISOString().slice(0, 10) ?? ""}
            birthdateEditable={await mayEditOwnBirthdate(ctx)}
            avatarKey={membership.user.avatarKey}
            handle={null}
            studentCode={null}
            bioHintKey="reviews.bioHintTeacher"
          />
        </CardBody>
      </Card>

      <Card data-testid="staff-record-card">
        <CardHeader title={t("staff.yourRecord")} />
        <CardBody>
          {recordRows.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("staff.nothingOnFile")}</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {recordRows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-fg-muted">{label}</dt>
                  <dd className="font-medium text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardBody>
      </Card>

      <LeaveBalanceCard balance={balance} t={t} />

      <Card>
        <CardHeader
          title={t("reviews.subjectsTitle")}
          icon={<BooksIcon weight="duotone" className="size-5" />}
        />
        <CardBody>
          {subjects.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("reviews.noSubjects")}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {subjects.map((subject) => (
                <li key={subject}>
                  <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">
                    {subject}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">{t("reviews.subjectsSelf")}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("reviews.ratings")}
          icon={<StarIcon weight="duotone" className="size-5" />}
        />
        <CardBody>
          {agg.responseCount === 0 ? (
            <p className="text-sm text-fg-muted">{t("reviews.noRatingsYet")}</p>
          ) : (
            <>
              <p className="flex items-baseline gap-2">
                {agg.overall !== null && (
                  <span className="inline-flex items-center gap-1 text-2xl font-bold text-fg">
                    <StarIcon weight="fill" className="size-5 text-warn" />
                    {agg.overall}
                  </span>
                )}
                <span className="text-sm text-fg-muted">
                  {agg.responseCount === 1
                    ? t("reviews.answersSoFarOne")
                    : t("reviews.answersSoFar", { count: agg.responseCount })}
                </span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {REVIEW_QUESTIONS.map((question) => {
                  const value = agg.byQuestion[question];
                  return (
                    <li key={question} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-fg-muted">{t(QUESTION_KEY[question])}</span>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted"
                        >
                          <span
                            className="block h-full rounded-full bg-warn"
                            style={{ width: `${((value ?? 0) / 5) * 100}%` }}
                          />
                        </span>
                        <span className="w-8 text-right font-semibold tabular-nums text-fg">
                          {value ?? "—"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">{t("reviews.ratingsSelf")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
