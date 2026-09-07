import { redirect } from "next/navigation";

/**
 * Assignment marks live on Assignments → Marked; report cards on Exams →
 * Report cards. This lands on the first, keeping the chosen child.
 */
export default async function ParentGradesRedirect({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { child } = await searchParams;
  redirect(
    child
      ? `/parent/assignments?child=${encodeURIComponent(child)}&tab=marked`
      : "/parent/assignments?tab=marked",
  );
}
