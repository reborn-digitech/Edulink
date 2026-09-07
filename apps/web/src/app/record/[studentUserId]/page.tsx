import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { recordFor } from "@/lib/student-record";
import { RecordView } from "../record-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.schoolRecord"),
  robots: { index: false, follow: false },
};
}

/**
 * One child's record, for a guardian.
 *
 * THE ID IN THE URL IS NOT TRUSTED AND IS NOT CHECKED HERE EITHER. `recordFor`
 * settles entitlement from the reader's own guardianships and returns null for
 * anybody else's child — the same null it returns for a user id that never
 * existed. So a guessed id is a 404, never "that is not your child", which
 * would answer a question nobody asking it is entitled to have answered.
 */
export default async function ChildRecordPage({
  params,
}: {
  params: Promise<{ studentUserId: string }>;
}) {
  // `requireUser()` rather than a non-null assertion, for the reason spelled
  // out on the parent page: the layout's redirect wins the response but does
  // not stop this body running, so the assertion threw on every signed-out
  // visit behind a 307 that looked correct.
  const session = await requireUser();
  const t = await getT();
  const { studentUserId } = await params;

  const record = await recordFor(session, studentUserId);
  if (!record) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/record"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" aria-hidden="true" />
        {t("common.back")}
      </Link>
      <RecordView record={record} self={record.studentUserId === session.user.id} />
    </div>
  );
}
