import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { studentsForTeacher } from "@/lib/remarks";
import { ComposeForm } from "./form";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "New message" };

export default async function NewRemarkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const ctx = await requireRole("TEACHER");
  const { student } = await searchParams;

  const students = await studentsForTeacher(ctx.schoolId, ctx.membershipId);

  if (students.length === 0) {
    return (
      <EmptyState
        title="No students to message yet"
        description="Once students are enrolled in a class you teach, you can start a private conversation with their guardians."
        action={
          <Button asChild variant="secondary">
            <Link href="/teacher">Back to today</Link>
          </Button>
        }
      />
    );
  }

  const preselected = students.some((s) => s.membershipId === student) ? student : undefined;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/remarks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All messages
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">New message</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        This goes to the student&rsquo;s guardians only. Other teachers cannot see it, and
        neither can the student.
      </p>

      <ComposeForm className="mt-7" students={students} preselected={preselected} />
    </div>
  );
}
