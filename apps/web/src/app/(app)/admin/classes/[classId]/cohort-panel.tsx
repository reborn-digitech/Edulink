"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { searchCandidates, addToCohort, dropFromCohort } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { PersonLink } from "@/components/person-link";
import { fieldClass } from "@/components/ui/field-class";

type Member = {
  membershipId: string;
  name: string;
  gradeLevel: string | null;
  studentCode: string | null;
};

type Candidate = {
  membershipId: string;
  name: string;
  gradeLevel: string | null;
  alreadyIn: string[];
};

/**
 * The children in this class.
 *
 * ADD IS A MULTI-SELECT, because the real task is "put these thirty in 5A" and
 * doing that one confirm-dialog at a time is how an admin gives up and goes back
 * to a spreadsheet. Remove is one at a time on purpose: it is the direction that
 * takes a child off a roll, and bulk-removing thirty by mis-click is not a
 * mistake anybody should be able to make quickly.
 *
 * Candidates already in another class are shown WITH that class rather than
 * hidden. A child is legitimately in a form group and a maths set at once, so
 * hiding them would make the common case impossible; naming the class they are
 * in makes the accidental case obvious.
 */
export function CohortPanel({
  classId,
  members,
  gradeLevel,
}: {
  classId: string;
  members: Member[];
  gradeLevel: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(q: string) {
    setLoading(true);
    const result = await searchCandidates(classId, q);
    setCandidates(result.candidates as Candidate[]);
    setLoading(false);
  }

  // Loading once when the picker opens; typing is debounced separately below.
  // The fetch runs inside the async closure rather than as a bare `load()` call
  // so nothing sets state before the first await, and `cancelled` drops a slow
  // first page that only arrives after the picker has been closed again.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await searchCandidates(classId, "");
      if (cancelled) return;
      setCandidates(result.candidates as Candidate[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, classId]);

  function onType(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void load(value), 250);
  }

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function commit() {
    startTransition(async () => {
      const result = await addToCohort(classId, [...picked]);
      if (!result.ok) {
        toast({ tone: "danger", title: t("classes.notAdded"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title: t("classes.addedToClass", { count: result.added ?? 0 }),
      });
      setPicked(new Set());
      setOpen(false);
      setQuery("");
      router.refresh();
    });
  }

  function remove(membershipId: string, name: string) {
    startTransition(async () => {
      const result = await dropFromCohort(classId, membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: t("classes.notRemoved"), description: actionError(t, result) });
        return;
      }
      toast({ tone: "ok", title: t("classes.takenOffRoll", { name }) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-relaxed text-fg-muted">
          {t("classes.rollNote", { count: members.length })}
        </p>
        {!open && (
          <Button size="sm" variant="secondary" icon={<PlusIcon weight="bold" />} onClick={() => setOpen(true)}>
            {t("classes.addStudents")}
          </Button>
        )}
      </div>

      {open && (
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <div className="relative">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => onType(e.target.value)}
              placeholder={t("classes.searchPupils")}
              aria-label={t("classes.searchPupilsLabel")}
              className={fieldClass("pl-11")}
            />
          </div>

          {gradeLevel && (
            <p className="mt-2 text-xs text-fg-muted">
              {t("classes.gradeFirst", { grade: gradeLevel })}
            </p>
          )}

          <div className="mt-3 max-h-72 overflow-y-auto scrollbar-thin">
            {loading ? (
              <p className="py-6 text-center text-sm text-fg-muted">{t("classes.looking")}</p>
            ) : candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-muted">
                {query ? t("classes.nobodyMatches") : t("classes.everyoneAlreadyIn")}
              </p>
            ) : (
              <ul className="space-y-1">
                {candidates.map((candidate) => {
                  const on = picked.has(candidate.membershipId);
                  return (
                    <li key={candidate.membershipId}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(candidate.membershipId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2.5 text-left transition-colors",
                          on ? "bg-accent-soft text-accent-strong" : "hover:bg-surface-muted",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded border",
                            on ? "border-accent bg-accent text-accent-fg" : "border-border",
                          )}
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{candidate.name}</span>
                          <span className="block truncate text-xs text-fg-muted">
                            {candidate.gradeLevel
                              ? t("classes.grade", { grade: candidate.gradeLevel })
                              : t("classes.noGradeSet")}
                            {candidate.alreadyIn.length > 0
                              ? ` · ${t("classes.alreadyIn", { classes: candidate.alreadyIn.join(", ") })}`
                              : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" loading={pending} disabled={picked.size === 0} onClick={commit}>
              {picked.size > 0
                ? t("classes.addCountToClass", { count: picked.size })
                : t("classes.addToClass")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPicked(new Set());
                setQuery("");
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-4 text-sm text-fg-muted">
          {t("classes.nobodyInClass")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {members.map((member) => (
            <li
              key={member.membershipId}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
            >
              <span className="min-w-0 flex-1">
                <PersonLink membershipId={member.membershipId} name={member.name} className="block truncate text-sm font-medium text-fg" />
                {member.gradeLevel && (
                  <span className="block text-xs text-fg-muted">
                    {t("classes.grade", { grade: member.gradeLevel })}
                  </span>
                )}
              </span>
              {member.studentCode && (
                <Badge tone="neutral" size="sm" className="hidden font-mono sm:inline-flex">
                  {member.studentCode}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                aria-label={t("classes.takeOff", { name: member.name })}
                onClick={() => remove(member.membershipId, member.name)}
              >
                <XIcon weight="bold" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
