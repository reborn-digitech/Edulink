"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EXPERT_OFFERING_META, type ExpertOffering } from "@/lib/constants";
import { setStanding } from "./actions";
import type { CurationEntry } from "@/lib/superuser";

/**
 * One expert, and the two decisions an operator makes about them.
 *
 * THEY ARE TWO DECISIONS AND THE CONTROL SAYS SO. Published is "may schools
 * find this person"; verified is "has a human checked who they are". A single
 * approve button would collapse them, and a marketplace where being listed
 * implies being checked is one that tells schools something nobody did.
 *
 * Verify is offered only alongside publishing, because a verified badge on
 * somebody no school can see is a claim with no reader.
 */
export function CurationRow({ entry }: { entry: CurationEntry }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const published = entry.publishedAt !== null;
  const verified = entry.verifiedAt !== null;

  function apply(next: { published: boolean; verified: boolean }, done: string) {
    setError(null);
    startTransition(async () => {
      const result = await setStanding(entry.profileId, next);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[--radius-md] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-base font-bold text-fg">
            {entry.name}
            {published ? (
              <Badge tone="ok" size="sm">
                Listed
              </Badge>
            ) : (
              <Badge tone="warn" size="sm">
                Waiting
              </Badge>
            )}
            {verified && (
              <Badge tone="accent" size="sm">
                Identity checked
              </Badge>
            )}
          </p>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            {entry.headline || <em>No headline yet</em>}
            {entry.organisation && <> · {entry.organisation}</>}
          </p>
          {entry.email && <p className="mt-0.5 font-mono text-xs text-fg-subtle">{entry.email}</p>}
        </div>
      </div>

      <p className="mt-3 text-sm text-fg">
        <span className="font-semibold">
          {EXPERT_OFFERING_META[entry.offering as ExpertOffering]?.label ?? entry.offering}
        </span>
        {entry.mentorCapacity !== null && (
          <span className="text-fg-muted">
            {" "}
            · up to {entry.mentorCapacity} at a time, {entry.activeMentorships} now
          </span>
        )}
      </p>

      {entry.specialisms.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {entry.specialisms.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-fg-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {entry.bio && (
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-fg-muted">{entry.bio}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {published ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                apply({ published: false, verified: false }, `${entry.name} is off the list`)
              }
            >
              Take off the list
            </Button>
            {!verified && (
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                onClick={() =>
                  apply({ published: true, verified: true }, "Marked as identity checked")
                }
              >
                Mark identity checked
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                apply({ published: true, verified: false }, `${entry.name} is now listed`)
              }
            >
              List them
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                apply({ published: true, verified: true }, `${entry.name} is listed and checked`)
              }
            >
              List and mark checked
            </Button>
          </>
        )}
      </div>

      {published && (
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">
          Taking somebody off the list stops schools finding them. It does not end a session already
          booked or a mentorship already agreed — those stay exactly as they are.
        </p>
      )}
    </div>
  );
}
