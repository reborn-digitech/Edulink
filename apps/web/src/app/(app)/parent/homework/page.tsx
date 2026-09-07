import { redirect } from "next/navigation";

/** The homework diary became Assignments — one page, the child's three tabs. */
export default async function ParentHomeworkRedirect({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { child } = await searchParams;
  redirect(child ? `/parent/assignments?child=${encodeURIComponent(child)}` : "/parent/assignments");
}
