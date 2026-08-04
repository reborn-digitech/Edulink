import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { getSession } from "@/lib/session";
import { recordFor } from "@/lib/student-record";
import { RecordView } from "../record-view";

export const metadata: Metadata = {
  title: "School record",
  robots: { index: false, follow: false },
};

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
  const session = (await getSession())!;
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
        Back
      </Link>
      <RecordView record={record} self={record.studentUserId === session.user.id} />
    </div>
  );
}
