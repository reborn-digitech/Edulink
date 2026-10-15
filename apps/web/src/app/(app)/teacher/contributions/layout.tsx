import { notFound } from "next/navigation";
import { requireRole } from "@/lib/tenancy";
import { questionGigOpen } from "@/lib/question-gig";

/**
 * The teachers' question gig, switched off (the owner, 10 October 2026): every page under
 * /teacher/contributions answers 404 while the QUESTION_GIG platform feature is off (15 October 2026;
 * src/lib/question-gig.ts, src/lib/platform-features.ts). Nothing is deleted; switching it back on brings
 * the pages back as they were.
 */
export default async function ContributionsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireRole("TEACHER");
  if (!(await questionGigOpen(ctx))) notFound();
  return children;
}
