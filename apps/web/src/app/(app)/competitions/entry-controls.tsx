"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, HourglassMediumIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatMilli } from "@/lib/validation";
import { useT } from "@/lib/i18n";
import {
  consentAction,
  enterAction,
  setStatusAction,
  setLeaderboardAction,
  submitAction,
  withdrawAction,
} from "./actions";
import { fieldClass } from "@/components/ui/field-class";

/**
 * The one control a child sees, and the one a guardian sees.
 *
 * Deliberately in the same file, because they are two halves of one decision and
 * splitting them is how the two ends drift into telling different stories about
 * the same entry.
 */

export function EnterButton({
  competitionId,
  title,
  open,
  requiresParentConsent,
}: {
  competitionId: string;
  title: string;
  open: boolean;
  requiresParentConsent: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <p className="text-sm text-muted">{t("competitions.entriesClosed")}</p>;
  }

  return (
    <Button
      icon={<TrophyIcon weight="bold" />}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await enterAction({ id: competitionId });
          if (!result.ok) {
            toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
            return;
          }
          toast({
            tone: "ok",
            title: requiresParentConsent ? t("competitions.askedToEnter") : t("competitions.enteredToast"),
            description: requiresParentConsent
              ? t("competitions.grownUpMustYes", { title })
              : t("competitions.takingPartIn", { title }),
          });
          router.refresh();
        })
      }
    >
      {pending ? t("competitions.justAMoment") : t("competitions.enterThis")}
    </Button>
  );
}

/**
 * A guardian enrols their own child (decision 0007, 6 Nov 2026): one press, which is their consent — no
 * second question, because the person pressing IS the person the consent would have been asked of.
 */
export function EnterChildButton({ competitionId, studentMembershipId, childName, title }: { competitionId: string; studentMembershipId: string; childName: string; title: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      icon={<TrophyIcon weight="bold" />}
      disabled={pending}
      data-testid="enrol-child"
      onClick={() =>
        startTransition(async () => {
          const result = await enterAction({ id: competitionId, studentMembershipId });
          if (!result.ok) {
            toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
            return;
          }
          toast({ tone: "ok", title: t("competitions.consentGiven"), description: t("competitions.childCanTakePart", { child: childName, title }) });
          router.refresh();
        })
      }
    >
      {pending ? t("competitions.justAMoment") : t("competitions.enrolChild", { child: childName })}
    </Button>
  );
}

/** What the child sees once they have asked. */
export function EntryStatus({
  entryId,
  awaitingConsent,
  canWithdraw,
}: {
  entryId: string;
  awaitingConsent: boolean;
  canWithdraw: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm font-medium ${
          awaitingConsent ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
        }`}
      >
        {awaitingConsent ? (
          <>
            <HourglassMediumIcon weight="fill" className="size-4" />
            {t("competitions.waitingForGrownUp")}
          </>
        ) : (
          <>
            <CheckCircleIcon weight="fill" className="size-4" />
            {t("competitions.youAreEntered")}
          </>
        )}
      </span>

      {canWithdraw && (
        <Button
          size="sm"
          variant="ghost"
          icon={<XIcon weight="bold" />}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await withdrawAction({ id: entryId });
              if (!result.ok) {
                toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
                return;
              }
              toast({ tone: "ok", title: t("competitions.withdrawn"), description: t("competitions.canAskAgain") });
              router.refresh();
            })
          }
        >
          {t("competitions.withdraw")}
        </Button>
      )}
    </div>
  );
}

/**
 * The guardian's decision.
 *
 * Two buttons, both plain words. "Allow" and "Not this time" rather than a
 * checkbox, because the parent is being asked a question about their child
 * taking part in something outside the school, and that deserves a sentence and
 * a decision rather than a toggle they might flip by accident.
 */
export function ConsentControls({
  entryId,
  childName,
  title,
}: {
  entryId: string;
  childName: string;
  title: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        icon={<CheckCircleIcon weight="bold" />}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await consentAction({ id: entryId });
            if (!result.ok) {
              toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
              return;
            }
            toast({
              tone: "ok",
              title: t("competitions.consentGiven"),
              description: t("competitions.childCanTakePart", { child: childName, title }),
            });
            router.refresh();
          })
        }
      >
        {pending ? t("competitions.justAMoment") : t("competitions.allow")}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await withdrawAction({ id: entryId });
            if (!result.ok) {
              toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
              return;
            }
            toast({
              tone: "ok",
              title: t("competitions.notThisTime"),
              description: t("competitions.childTakenOut", { child: childName, title }),
            });
            router.refresh();
          })
        }
      >
        {t("competitions.notThisTime")}
      </Button>
    </div>
  );
}

/**
 * The organising school's own controls.
 *
 * Publishing is its own press, separate from saving, because it puts this in
 * front of every child at every school on the installation. Withdrawing sets
 * ARCHIVED rather than deleting — children may have entered and guardians may
 * have consented, and taking that away silently would be worse than a stale row.
 */
export function OrganiserControls({
  competitionId,
  status,
  entered,
  leaderboardEnabled,
}: {
  competitionId: string;
  status: string;
  entered: number;
  leaderboardEnabled: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function toggleBoard() {
    startTransition(async () => {
      const result = await setLeaderboardAction({ id: competitionId, enabled: !leaderboardEnabled });
      if (!result.ok) {
        toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
        return;
      }
      toast({
        tone: "ok",
        title: leaderboardEnabled ? t("competitions.boardTakenDown") : t("competitions.boardPublishedToast"),
        description: leaderboardEnabled
          ? t("competitions.standingsKept")
          : t("competitions.schoolsRankedNoChild"),
      });
      router.refresh();
    });
  }

  function change(next: "PUBLISHED" | "ARCHIVED" | "DRAFT") {
    startTransition(async () => {
      const result = await setStatusAction({ id: competitionId, status: next });
      if (!result.ok) {
        toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
        return;
      }
      toast({ tone: "ok", title: t("competitions.done"), description: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-fg-muted">
        {t("competitions.yourSchoolOrganising")}
        {status === "DRAFT" && ` ${t("competitions.nobodyElseSeesYet")}`}
      </p>
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" && (
          <Button size="sm" disabled={pending} onClick={() => change("PUBLISHED")}>
            {pending ? t("competitions.justAMoment") : t("competitions.publishIt")}
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => change("ARCHIVED")}>
            {t("competitions.withdrawIt")}
          </Button>
        )}
        {status === "ARCHIVED" && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => change("DRAFT")}>
            {t("competitions.backToDraft")}
          </Button>
        )}
      </div>
      {status === "PUBLISHED" && entered > 0 && (
        <p className="text-xs text-fg-muted">
          {entered === 1
            ? t("competitions.withdrawKeepsOne")
            : t("competitions.withdrawKeepsMany", { count: entered })}
        </p>
      )}

      {/* The cross-school board. Says what it ranks, every time it is offered —
          an organiser deciding whether to publish one should not have to
          remember that it is schools and not children. */}
      <div className="rounded-[var(--radius-sm)] border border-border p-3">
        <p className="text-sm font-medium text-fg">
          {leaderboardEnabled ? t("competitions.boardPublished") : t("competitions.noBoard")}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          {t("competitions.boardExplainer")}
        </p>
        <Button
          size="sm"
          variant={leaderboardEnabled ? "ghost" : "secondary"}
          className="mt-2"
          disabled={pending}
          onClick={toggleBoard}
        >
          {leaderboardEnabled ? t("competitions.takeBoardDown") : t("competitions.publishBoard")}
        </Button>
        {leaderboardEnabled && (
          <p className="mt-1.5 text-xs text-fg-subtle">{t("competitions.takingDownKeeps")}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The child's hand-in.
 *
 * A link, not a file: competition work goes to the organiser's own site, and
 * storing a child's work here for somebody who cannot read it would be worse
 * than useless. Deliberately separate from entering — registering says a child
 * would like to take part, this sends their actual work.
 */
export function SubmitPanel({
  competitionId,
  existingUrl,
  canSubmit,
  reason,
}: {
  competitionId: string;
  existingUrl: string | null;
  canSubmit: boolean;
  reason: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(existingUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!canSubmit) {
    return reason ? <p className="text-sm text-fg-muted">{reason}</p> : null;
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await submitAction({ id: competitionId, url: url.trim() });
          if (!result.ok) {
            setError(result.error ?? t("competitions.thatDidNotGo"));
            return;
          }
          toast({
            tone: "ok",
            title: existingUrl ? t("competitions.changed") : t("competitions.handedInToast"),
            description: t("competitions.teacherCanSee"),
          });
          router.refresh();
        });
      }}
    >
      <label htmlFor="entry-url" className="block text-sm font-medium">
        {existingUrl ? t("competitions.yourEntry") : t("competitions.handInYourEntry")}
      </label>
      <input
        id="entry-url"
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={t("competitions.urlPlaceholder")}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "entry-url-error" : undefined}
        className={fieldClass(undefined, Boolean(error))}
      />
      <p className="text-xs text-fg-muted">{t("competitions.linkToWork")}</p>
      {error && (
        <p id="entry-url-error" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending || url.trim().length === 0}>
        {pending ? t("competitions.justAMoment") : existingUrl ? t("competitions.changeIt") : t("competitions.handItIn")}
      </Button>
    </form>
  );
}

/** What a child sees once somebody has recorded what they scored. */
export function ResultBadge({ scoreMilli, rank }: { scoreMilli: number | null; rank: number | null }) {
  const t = useT();
  if (scoreMilli === null && rank === null) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-ok-soft px-2.5 py-1.5 text-sm font-medium text-ok">
      <TrophyIcon weight="fill" className="size-4" />
      {/* The ordinal ("3rd") is an English VALUE, like a date — the word
          around it is the part that translates. */}
      {rank !== null && <span>{t("competitions.placeLabel", { n: ordinalValue(rank) })}</span>}
      {scoreMilli !== null && <span>{t("competitions.pointsLabel", { n: formatMilli(scoreMilli) })}</span>}
    </p>
  );
}

function ordinalValue(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}
