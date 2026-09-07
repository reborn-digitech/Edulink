import { redirect } from "next/navigation";

/**
 * `/report-cards` has always been a NAME, not a page: the nav highlights it
 * as an `also:` path while the cards themselves live on the exams page's
 * cards tab. Typing or bookmarking the bare path answered 404 — the
 * three-school simulation's role sweep tripped on it for every pupil and
 * parent. A name people are shown deserves a door.
 */
export default function ReportCardsRedirect() {
  redirect("/exams?tab=cards");
}
