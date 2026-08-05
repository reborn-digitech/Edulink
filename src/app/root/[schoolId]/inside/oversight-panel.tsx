"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { close, search, setSuspension, takeDown } from "./actions";
import type { OversightPerson, OversightPost } from "@/lib/operator-oversight";

/**
 * What an operator can actually do once they are inside.
 *
 * TWO POWERS AND A SEARCH BOX. Take a post down, pause a person, and find that
 * person by name — deliberately not a directory, because an operator arriving
 * with a name should be able to find them and an operator with idle curiosity
 * should not be handed a list of children to scroll.
 *
 * Every button asks for a reason for the same purpose the door does: the school
 * reads it afterwards.
 */
export function OversightPanel({
  schoolId,
  posts,
  expiresAt,
}: {
  schoolId: string;
  posts: OversightPost[];
  expiresAt: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<OversightPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function act(work: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[--radius-md] border border-ok/40 bg-ok-soft p-4">
        <p className="text-sm text-fg">
          <strong className="font-semibold">You are inside this school.</strong> Access ends at{" "}
          {expiresAt}. Everything you do is in their Safety Centre.
        </p>
        <Button
          size="sm"
          variant="secondary"
          icon={<LockKeyIcon weight="bold" />}
          loading={pending}
          onClick={() => act(() => close(schoolId), "Closed")}
        >
          Close now
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/* ---------------- posts ---------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
          What this school has published
        </h2>
        {posts.length === 0 ? (
          <p className="text-sm text-fg-muted">Nothing posted.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="rounded-[--radius-md] border border-border bg-surface p-4">
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
                      const reason = window.prompt(
                        "Why is this coming down? The school reads this.",
                      );
                      if (!reason) return;
                      act(() => takeDown(schoolId, post.id, reason), "Taken down");
                    }}
                  >
                    Take it down
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
          Find somebody
        </h2>
        <p className="text-sm text-fg-muted">
          By name or email. There is no list of everybody on purpose.
        </p>
        <div className="flex gap-2">
          <TextField
            label="Name or email"
            className="flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            className="self-end"
            variant="secondary"
            icon={<MagnifyingGlassIcon weight="bold" />}
            loading={pending}
            onClick={() =>
              startTransition(async () => setPeople(await search(schoolId, query)))
            }
          >
            Search
          </Button>
        </div>

        {people !== null && people.length === 0 && (
          <p className="text-sm text-fg-muted">Nobody matched.</p>
        )}
        {people && people.length > 0 && (
          <ul className="space-y-2">
            {people.map((person) => (
              <li
                key={person.membershipId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[--radius-md] border border-border bg-surface p-3"
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
                        "Access restored",
                      )
                    }
                  >
                    Restore access
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={pending}
                    onClick={() => {
                      const reason = window.prompt(
                        "Why is this person being paused? The school reads this.",
                      );
                      if (!reason) return;
                      act(
                        () =>
                          setSuspension(schoolId, person.membershipId, {
                            suspended: true,
                            reason,
                          }),
                        "Access paused",
                      );
                    }}
                  >
                    Pause access
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Said last, where somebody has just finished doing something. */}
      <p className="text-xs leading-relaxed text-fg-muted">
        Nothing here changes a mark, a register or a report card, and nothing here reads a private
        message between a parent, a teacher and a child. Ending an account permanently is the
        school&rsquo;s decision about its own member.
      </p>
    </div>
  );
}
