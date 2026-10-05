"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setSuspension, takeDown } from "./actions";
import type { OversightPerson, OversightPost } from "@/lib/operator-oversight";
import { useT } from "@/lib/i18n";

/**
 * What an operator can actually do once they are inside.
 *
 * TWO POWERS AND A DIRECTORY. Take a post down, pause a person, and see the
 * whole roll — the operator's sight goes down to the individual by design, and
 * the school reads every visit in its Safety Centre. The filter box narrows the
 * directory in place; it is a convenience, not a gate.
 *
 * Every destructive button asks for a reason for the same purpose the visitor
 * book exists: the school reads it afterwards.
 */
export function OversightPanel({
  schoolId,
  posts,
  people,
}: {
  schoolId: string;
  posts: OversightPost[];
  people: OversightPerson[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q),
    );
  }, [people, query]);

  function act(work: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/* ---------------- posts ---------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
          {t("root.whatPublished")}
        </h2>
        {posts.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-muted">{t("root.nothingPosted")}</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-fg">{post.title}</p>
                  <Badge tone={post.status === "REJECTED" ? "danger" : "neutral"} size="sm">
                    {post.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {post.authorName} · {post.scope.toLowerCase()}
                </p>
                {post.body && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
                    {post.body}
                  </p>
                )}
                {post.status !== "REJECTED" && (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="danger"
                    loading={pending}
                    onClick={() => {
                      const reason = window.prompt(t("root.whyComingDown"));
                      if (!reason) return;
                      act(() => takeDown(schoolId, post.id, reason), t("root.takenDown"));
                    }}
                  >
                    {t("root.takeItDown")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- people ---------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
          {t("root.everybodyHere")}
        </h2>
        <p className="text-sm text-fg-muted">{t("root.directoryNote")}</p>
        <div className="flex gap-2">
          <TextField
            label={t("root.filterPeople")}
            className="flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <MagnifyingGlassIcon
            weight="bold"
            className="mb-3 size-4 self-end text-fg-muted"
            aria-hidden="true"
          />
        </div>

        {shown.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("root.nobodyMatched")}</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((person) => (
              <li
                key={person.membershipId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{person.name}</span>
                  <span className="block text-xs text-fg-muted">
                    {person.role.toLowerCase()} · {person.status.toLowerCase()}
                  </span>
                </span>
                {person.status === "SUSPENDED" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() =>
                      act(
                        () =>
                          setSuspension(schoolId, person.membershipId, {
                            suspended: false,
                            reason: "",
                          }),
                        t("root.accessRestored"),
                      )
                    }
                  >
                    {t("root.restoreAccess")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={pending}
                    onClick={() => {
                      const reason = window.prompt(t("root.whyPaused"));
                      if (!reason) return;
                      act(
                        () =>
                          setSuspension(schoolId, person.membershipId, {
                            suspended: true,
                            reason,
                          }),
                        t("root.accessPaused"),
                      );
                    }}
                  >
                    {t("root.pauseAccess")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Said last, where somebody has just finished doing something. */}
      <p className="text-xs leading-relaxed text-fg-muted">{t("root.powersNote")}</p>
    </div>
  );
}
