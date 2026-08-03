import type { Metadata } from "next";
import Link from "next/link";
import { HandshakeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listMentorships, pairingOptions } from "@/lib/mentoring";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PairForm } from "./pair-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mentoring" };

/**
 * Mentoring, from whichever side you are on.
 *
 * ONE PAGE FOR ALL FOUR READERS — expert, pupil, guardian and staff — because
 * the list they should see is the same list filtered by who they are, and
 * `listMentorships` does that filtering from the session. A separate page per
 * role would be four places for the visibility rule to drift.
 */
export default async function MentoringPage() {
  const t = await getT();
  const ctx = await requireUser();
  const isStaff = ctx.role === "ADMIN" || ctx.role === "TEACHER";
  const [threads, options] = await Promise.all([
    listMentorships(ctx),
    isStaff ? pairingOptions(ctx) : Promise.resolve({ experts: [], pupils: [] }),
  ]);
  const waiting = threads.filter((t) => t.awaitingConsent);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("feature.mentoring")}</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          One-to-one mentoring. Every conversation can be read by the pupil&apos;s guardians and
          by the school — mentoring here is never private.
        </p>
      </div>

      {isStaff && <PairForm experts={options.experts} pupils={options.pupils} />}

      {ctx.role === "PARENT" && waiting.length > 0 && (
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/40 p-3 text-sm text-fg">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" />
          <span>
            {waiting.length} mentorship{waiting.length === 1 ? "" : "s"} need your agreement before
            anyone can send a message.
          </span>
        </p>
      )}

      {threads.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon weight="duotone" className="size-8" />}
          title="No mentoring yet"
          description="A teacher or admin sets up mentoring between a pupil and an expert. A guardian has to agree before it starts."
        />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
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
                          ? "Waiting for a guardian"
                          : thread.status.toLowerCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-fg">
                        {thread.studentName} &amp; {thread.expertName}
                      </span>
                      {thread.unread > 0 && (
                        <Badge tone="accent" size="sm">{thread.unread} new</Badge>
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
