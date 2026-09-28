import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSession, listContexts } from "@/lib/session";
import { myJoinRequests } from "@/lib/join-requests";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import { getRelativeTime, getT } from "@/lib/i18n/server";

const STATUS_KEY = { PENDING: "joinRequests.statusPending", DECLINED: "joinRequests.statusDeclined", EXPIRED: "joinRequests.statusExpired" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("joinRequests.waitingTitle") };
}

/**
 * Where somebody who typed a code waits. OUTSIDE the (app) group, as
 * /parent/link is and for its reason: the person has no school and no role,
 * and the shell would send them away.
 *
 * It shows their own requests and nothing of the school but its name and the
 * class's, both of which they were shown when they typed the code.
 */
export default async function JoinWaitingPage({ searchParams }: { searchParams: Promise<{ handle?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const t = await getT();
  const relativeTime = await getRelativeTime();
  const { handle: asked } = await searchParams;

  const [requests, contexts] = await Promise.all([myJoinRequests(session.user.id), listContexts(session.user.id)]);
  const waiting = requests.filter((request) => request.status === "PENDING");
  const hasHome = contexts.memberships.length > 0 || contexts.children.length > 0;

  // Somebody said yes while this page was closed, and nothing else waits: in they go.
  if (!session.role && hasHome && waiting.length === 0) redirect("/switch");

  /**
   * The login name is shown from the ACCOUNT, never from the address bar:
   * `?handle=` only says that this is the visit straight after signing up,
   * when a child has not yet written it down.
   */
  const suffix = `@${HANDLE_DOMAIN}`;
  const handle = asked && session.user.email?.endsWith(suffix) ? session.user.email.slice(0, -suffix.length) : null;
  const home = session.role ? "/" : hasHome ? "/switch" : null;

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" size="sm" variant="secondary">
              {t("shell.signOut")}
            </Button>
          </form>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <HourglassMediumIcon weight="duotone" className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">{t("joinRequests.waitingTitle")}</h1>
        <p className="mt-2 text-fg-muted">{waiting.length > 0 ? t("joinRequests.waitingBody") : t("joinRequests.waitingNone")}</p>

        {handle && (
          <Card className="mt-6 border-accent/40 p-4" data-testid="handle-reminder">
            <p className="text-sm font-medium text-fg">{t("joinRequests.handleReminder", { handle })}</p>
          </Card>
        )}

        {requests.length > 0 && (
          <ul className="mt-6 space-y-2">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[--radius-md] border border-border bg-surface p-4" data-testid="my-join-request">
                <div className="min-w-0">
                  <p className="font-semibold text-fg">
                    {request.className ? t("joinRequests.waitingRowClass", { className: request.className, school: request.schoolName }) : request.schoolName}
                  </p>
                  <p className="text-xs text-fg-muted">{relativeTime(request.createdAt)}</p>
                  {request.declineReason && <p className="mt-1 text-sm text-fg">{t("joinRequests.reasonGiven", { reason: request.declineReason })}</p>}
                  {request.status === "EXPIRED" && <p className="mt-1 text-sm text-fg-muted">{t("joinRequests.notifExpiredBody")}</p>}
                </div>
                <Badge tone={request.status === "PENDING" ? "warn" : "neutral"} size="sm">
                  {t(STATUS_KEY[request.status])}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button asChild block variant="secondary">
            <Link href="/join/student">{t("joinRequests.anotherCode")}</Link>
          </Button>
          {home && (
            <Button asChild block>
              <Link href={home}>{t("parent.goToDashboard")}</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
