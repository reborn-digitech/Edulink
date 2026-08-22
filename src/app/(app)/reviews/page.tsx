import type { Metadata } from "next";
import { StarIcon } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import { requireRole, requireParent, requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { pendingReviews, type PendingReview } from "@/lib/reviews";
import { EmptyState } from "@/components/ui/states";
import { RateCard } from "./rate-card";
import { formatDateKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myReviews") };
}

/**
 * The respondent's side: every open questionnaire that concerns a teacher who
 * actually teaches them (or their child). A student answers within their own
 * school; a parent may have children at several, so their page walks each one.
 */
export default async function MyReviewsPage() {
  const t = await getT();

  /* A parent's session deliberately carries NO active school — they act
   * across their children's schools — so requireRole's school demand would
   * bounce every parent to /switch. The sweep caught exactly that. Students
   * go through requireRole as usual; parents through the guard shaped for
   * them, which also sends the childless to /parent/link instead of a dead
   * end. */
  const who = await requireUser();
  if (who.role !== "STUDENT" && who.role !== "PARENT") redirect("/switch");
  const ctx = who.role === "PARENT" ? await requireParent() : await requireRole("STUDENT");

  let waiting: PendingReview[] = [];
  if (ctx.role === "STUDENT" && ctx.schoolId) {
    waiting = await pendingReviews(ctx, ctx.schoolId);
  } else if (ctx.role === "PARENT") {
    const children = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: { studentSchoolId: true },
      distinct: ["studentSchoolId"],
    });
    for (const child of children) {
      waiting = waiting.concat(await pendingReviews(ctx, child.studentSchoolId));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("reviews.yourReviews")}
        </h1>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-fg-muted">
          {t("reviews.respondIntro")}
        </p>
      </div>

      {waiting.length === 0 ? (
        <EmptyState
          icon={<StarIcon weight="duotone" className="size-8" />}
          title={t("reviews.nothingWaitingTitle")}
          description={t("reviews.nothingWaitingBody")}
        />
      ) : (
        <ul className="space-y-3">
          {waiting.map((entry) => (
            <li key={`${entry.roundId}:${entry.teacherMembershipId}`}>
              <RateCard
                roundId={entry.roundId}
                teacherMembershipId={entry.teacherMembershipId}
                teacherName={entry.teacherName}
                closesDateKey={formatDateKey(entry.closesDateKey)}
                initial={entry.myScores}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
