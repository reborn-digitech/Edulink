import type { Metadata } from "next";
import Link from "next/link";
import { HandshakeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import {
  MAX_OPEN_REQUESTS,
  listMentorRequests,
  listMentorships,
  pairingOptions,
  requestableExperts,
} from "@/lib/mentoring";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { EmptyState } from "@/components/ui/states";

/**
 * The thread's lifecycle, in the reader's words. PENDING_CONSENT never reaches
 * this table — the awaitingConsent branch above the Badge names it first.
 */
const MENTOR_STATUS_KEY: Partial<Record<string, TranslationKey>> = {
  ACTIVE: "mentoring.statusActive",
  CLOSED: "mentoring.statusClosed",
  REQUESTED: "mentoring.statusRequested",
};
import { PairForm } from "./pair-form";
import { AskForm } from "./ask-form";
import { RequestQueue } from "./request-queue";
import { getT } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.mentoring") };
}

/**
 * Mentoring, from whichever side you are on.
 *
 * ONE PAGE FOR ALL FOUR READERS — expert, pupil, guardian and staff — because
 * the list they should see is the same list filtered by who they are, and
 * `listMentorships` does that filtering from the session. A separate page per
 * role would be four places for the visibility rule to drift.
 */
export default async function MentoringPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const t = await getT();
  const ctx = await requireUser();
  const isStaff = ctx.role === "ADMIN" || ctx.role === "TEACHER";
  // Reviewing requests is the ADMIN's and the PRINCIPAL's, not every teacher's
  // — a pupil asking an outside adult into their life is a school-level
  // decision. `listMentorRequests` enforces it; this only decides what to fetch.
  const reviews = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";

  const [threads, options, askable, requests] = await Promise.all([
    listMentorships(ctx),
    isStaff ? pairingOptions(ctx) : Promise.resolve({ experts: [], pupils: [] }),
    requestableExperts(ctx),
    reviews ? listMentorRequests(ctx) : Promise.resolve([]),
  ]);
  const waiting = threads.filter((t) => t.awaitingConsent);
  const myOpenRequests = threads.filter((t) => t.status === "REQUESTED").length;
  const statusFilter = rawStatus === "ACTIVE" || rawStatus === "CLOSED" || rawStatus === "REQUESTED" ? rawStatus : null;
  const shown = statusFilter ? threads.filter((t) => t.status === statusFilter) : threads;

  return (
    <div className="space-y-5">
      <PageHeader title={t("feature.mentoring")} description={t("mentoring.intro")} />

      {isStaff && <PairForm experts={options.experts} pupils={options.pupils} />}

      {reviews && <RequestQueue requests={requests} />}

      {ctx.role === "STUDENT" && (
        <AskForm experts={askable} openRequests={myOpenRequests} max={MAX_OPEN_REQUESTS} />
      )}

      {ctx.role === "PARENT" && waiting.length > 0 && (
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/40 p-3 text-sm text-fg">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" />
          <span>{t("mentoring.needsYourAgreement", { count: waiting.length })}</span>
        </p>
      )}

      {threads.length > 2 && (
        <DataToolbar
          facets={[
            {
              key: "status",
              label: t("mentoring.statusFilter"),
              value: statusFilter ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: threads.length },
                ...(["ACTIVE", "REQUESTED", "CLOSED"] as const).map((st) => ({ value: st, label: t(MENTOR_STATUS_KEY[st] ?? "mentoring.statusActive"), count: threads.filter((th) => th.status === st).length })).filter((o) => o.count > 0),
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {threads.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon weight="duotone" className="size-8" />}
          title={t("mentoring.emptyTitle")}
          description={t("mentoring.emptyBody")}
        />
      ) : shown.length === 0 ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : (
        <ul className="space-y-3">
          {shown.map((thread) => (
            <li key={thread.id}>
              <Card interactive>
                <Link href={`/mentoring/${thread.id}`} className="block">
                  <CardBody className="space-y-2 pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          thread.status === "ACTIVE"
                            ? "ok"
                            : thread.status === "CLOSED"
                              ? "neutral"
                              : "warn"
                        }
                        size="sm"
                      >
                        {thread.awaitingConsent
                          ? t("mentoring.waitingForGuardian")
                          : t(MENTOR_STATUS_KEY[thread.status] ?? "mentoring.statusActive")}
                      </Badge>
                      <span className="text-sm font-semibold text-fg">
                        <PersonLink membershipId={thread.studentMembershipId} name={thread.studentName} /> &amp; {thread.expertName}
                      </span>
                      {thread.unread > 0 && (
                        <Badge tone="accent" size="sm">{t("mentoring.newCount", { count: thread.unread })}</Badge>
                      )}
                    </div>
                    <p className="text-[0.9375rem] text-fg-muted">{thread.purpose}</p>
                  </CardBody>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
