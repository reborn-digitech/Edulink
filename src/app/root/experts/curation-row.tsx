"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EXPERT_OFFERING_META, type ExpertOffering } from "@/lib/constants";
import { setStanding } from "./actions";
import type { CurationEntry } from "@/lib/superuser";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";

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
  const t = useT();
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
        setError(actionError(t, result, "common.tryAgain"));
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
                {t("expert.listed")}
              </Badge>
            ) : (
              <Badge tone="warn" size="sm">
                {t("expert.waiting")}
              </Badge>
            )}
            {verified && (
              <Badge tone="accent" size="sm">
                {t("expert.identityChecked")}
              </Badge>
            )}
          </p>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            {entry.headline || <em>{t("expert.noHeadline")}</em>}
            {entry.organisation && <> · {entry.organisation}</>}
          </p>
          {entry.email && <p className="mt-0.5 font-mono text-xs text-fg-subtle">{entry.email}</p>}
        </div>
      </div>

      <p className="mt-3 text-sm text-fg">
        <span className="font-semibold">
          {EXPERT_OFFERING_META[entry.offering as ExpertOffering]
            ? t(EXPERT_OFFERING_META[entry.offering as ExpertOffering].labelKey)
            : entry.offering}
        </span>
        {entry.mentorCapacity !== null && (
          <span className="text-fg-muted">
            {" · "}
            {t("expert.capacityAndActive", {
              cap: entry.mentorCapacity,
              active: entry.activeMentorships,
            })}
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
                apply(
                  { published: false, verified: false },
                  t("expert.offListToast", { name: entry.name }),
                )
              }
            >
              {t("expert.takeOffList")}
            </Button>
            {!verified && (
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                onClick={() =>
                  apply({ published: true, verified: true }, t("expert.markedCheckedToast"))
                }
              >
                {t("expert.markIdentityChecked")}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                apply(
                  { published: true, verified: false },
                  t("expert.nowListedToast", { name: entry.name }),
                )
              }
            >
              {t("expert.listThem")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                apply(
                  { published: true, verified: true },
                  t("expert.listedAndCheckedToast", { name: entry.name }),
                )
              }
            >
              {t("expert.listAndCheck")}
            </Button>
          </>
        )}
      </div>

      {published && (
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">{t("expert.takeOffNote")}</p>
      )}
    </div>
  );
}
