import { notFound } from "next/navigation";
import { questionGigOpen } from "@/lib/question-gig";

/**
 * The teachers' question gig, switched off (the owner, 10 October 2026): every page under
 * /teacher/contributions answers 404 while QUESTION_GIG_FOR_TEACHERS is false (src/lib/question-gig.ts).
 * Nothing is deleted; switching it back on brings the pages back as they were.
 */
export default function ContributionsLayout({ children }: { children: React.ReactNode }) {
  if (!questionGigOpen()) notFound();
  return children;
}
