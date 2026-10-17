import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { joinLink, type JoinLink } from "@/lib/gig-sessions";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("seats.joinTitle"), robots: { index: false, follow: false } };
}

/**
 * WHERE A JOIN REMINDER LEADS (seats, 17 October 2026). The notice thirty minutes before a session links here, never
 * to the room itself: the seat is checked again as the reader arrives (src/lib/gig-sessions.ts `joinLink` — the
 * provider always, a seat holder once confirmed and, when priced, paid) and the browser is sent on to the room. A seat
 * not yet confirmed or paid says why; anybody else's booking is the app's 404.
 */
export default async function JoinSessionPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const ctx = await requireUser();
  const { bookingId } = await params;
  const t = await getT();
  let link: JoinLink | null = null;
  let refusal: string | null = null;
  try {
    link = await joinLink(ctx, bookingId);
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    if (!(error instanceof AccessError)) throw error;
    refusal = t(error.key, error.vars);
  }
  // Only an https room is followed: a link from before the hosts were checked is still the provider's own, on https.
  if (link && link.meetingUrl.startsWith("https://")) redirect(link.meetingUrl);
  const back = ctx.role === "EXPERT" ? "/expert/sessions" : ctx.role === "TEACHER" ? "/teacher/guidance" : "/sessions";
  return (
    <div className="space-y-6">
      <PageHeader title={t("seats.joinTitle")} />
      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm text-fg" role="status" data-testid="join-refused">
        {refusal ?? t("seats.joinNotYet")}
      </p>
      <Link href={back} className="tap inline-flex items-center text-sm font-medium text-accent-strong underline underline-offset-4">
        {t("seats.joinBack")}
      </Link>
    </div>
  );
}
