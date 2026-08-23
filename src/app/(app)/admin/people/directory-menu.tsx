"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwiseIcon,
  BooksIcon,
  CakeIcon,
  KeyIcon,
  IdentificationCardIcon,
  DotsThreeIcon,
  PauseCircleIcon,
  SignOutIcon,
  UsersThreeIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { cancelLeavingAction, reinstate, undoLeaving } from "./actions";
import { PausePanel } from "./row-actions";
import { LeavingPanel } from "./leaving-actions";
import { RemovePanel } from "./remove-actions";
import { SubjectsPanel } from "./subjects-panel";
import { ParentLinkPanel } from "./parent-link-panel";
import { BirthdatePanel } from "./birthdate-panel";
import { FirstSignInPanel } from "./first-signin-panel";
import { StaffRecordPanel, type StaffRecordInitial } from "./staff-record-panel";
import { cn } from "@/lib/cn";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

type Panel = "pause" | "left" | "remove" | "subjects" | "parent" | "birthdate" | "firstSignin" | "staff" | null;

/**
 * One quiet kebab per directory row, holding every verb that used to sit in
 * the open. Three destructive-feeling buttons on every row made the whole
 * directory read like a control panel; the roll call is the page, the verbs
 * are the exception, so the verbs now wait behind a menu (same idiom as the
 * class list's row menu).
 *
 * The RESTORATIVE verbs — restore access, undo leaving — run straight from the
 * menu: they are one-click reversals and asking twice teaches nothing. The
 * DESTRUCTIVE-FEELING three (pause, left, remove) each open the same full-width
 * panel they always did, with the same copy doing the same persuading.
 */
export function DirectoryMenu({
  membershipId,
  name,
  isStudent,
  isTeacher,
  subjects,
  birthdate,
  handleOnly,
  leavingOnKey,
  staffRecord,
  suspended,
  hasLeft,
}: {
  membershipId: string;
  name: string;
  isStudent: boolean;
  /** Teacher rows also carry the subjects editor. */
  isTeacher?: boolean;
  subjects?: string[];
  /** ISO date on file, "" when none — the office may set or correct it. */
  birthdate?: string;
  /** A pupil on a login handle with no address: the office can issue a first sign-in code. */
  handleOnly?: boolean;
  /** A leaving already dated ahead — offers Cancel instead of Record as left. */
  leavingOnKey?: string | null;
  /** Staff rows carry the office's record; undefined for pupils. */
  staffRecord?: StaffRecordInitial;
  suspended: boolean;
  hasLeft: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);

  function show(next: Exclude<Panel, null>) {
    setOpen(false);
    setPanel(next);
  }

  function doReinstate() {
    startTransition(async () => {
      const result = await reinstate(membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: t("people.notRestored"), description: actionError(t, result) });
        return;
      }
      toast({ tone: "ok", title: t("people.canSignInAgain", { name }) });
      setOpen(false);
      router.refresh();
    });
  }

  function doCancelLeaving() {
    startTransition(async () => {
      const result = await cancelLeavingAction(membershipId);
      if (!result.ok) {
        toast({ tone: "warn", title: actionError(t, result, "people.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t("people.leavingCancelled") });
      setOpen(false);
      router.refresh();
    });
  }

  function doUndoLeaving() {
    startTransition(async () => {
      const result = await undoLeaving(membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: t("people.notUndone"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title: t("people.backOnRoll", { name }),
        description: t("people.backOnRollBody"),
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("people.actionsFor", { name })}
          aria-expanded={open}
          className="tap grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          <DotsThreeIcon weight="bold" className="size-5" />
        </button>

        {open && (
          <>
            {/* Click-away layer, so the menu cannot get stranded open. */}
            <button
              type="button"
              aria-label={t("people.closeMenu")}
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-[--radius-md] border border-border bg-surface py-1 shadow-lg animate-in-up">
              {!hasLeft &&
                (suspended ? (
                  <MenuItem
                    icon={<ArrowCounterClockwiseIcon className="size-4" />}
                    disabled={pending}
                    onClick={doReinstate}
                  >
                    {t("people.restore")}
                  </MenuItem>
                ) : (
                  <MenuItem
                    icon={<PauseCircleIcon className="size-4" />}
                    onClick={() => show("pause")}
                  >
                    {t("people.pauseAction")}
                  </MenuItem>
                ))}

              {isTeacher && !hasLeft && (
                <MenuItem
                  icon={<BooksIcon className="size-4" />}
                  onClick={() => show("subjects")}
                >
                  {t("reviews.editSubjects")}
                </MenuItem>
              )}

              {staffRecord && !hasLeft && (
                <MenuItem icon={<IdentificationCardIcon className="size-4" />} onClick={() => show("staff")}>
                  {t("people.staffRecordAction")}
                </MenuItem>
              )}

              {!hasLeft && (
                <MenuItem icon={<CakeIcon className="size-4" />} onClick={() => show("birthdate")}>
                  {t("people.birthdateAction")}
                </MenuItem>
              )}

              {isStudent && handleOnly && !hasLeft && !suspended && (
                <MenuItem icon={<KeyIcon className="size-4" />} onClick={() => show("firstSignin")}>
                  {t("people.firstSigninAction")}
                </MenuItem>
              )}

              {isStudent && !hasLeft && !suspended && (
                <MenuItem
                  icon={<UsersThreeIcon className="size-4" />}
                  onClick={() => show("parent")}
                >
                  {t("people.linkParent")}
                </MenuItem>
              )}

              {isStudent &&
                (hasLeft ? (
                  <MenuItem
                    icon={<ArrowCounterClockwiseIcon className="size-4" />}
                    disabled={pending}
                    onClick={doUndoLeaving}
                  >
                    {t("people.undoLeaving")}
                  </MenuItem>
                ) : leavingOnKey ? (
                  <MenuItem
                    icon={<ArrowCounterClockwiseIcon className="size-4" />}
                    disabled={pending}
                    onClick={doCancelLeaving}
                  >
                    {t("people.cancelLeaving")}
                  </MenuItem>
                ) : (
                  <MenuItem icon={<SignOutIcon className="size-4" />} onClick={() => show("left")}>
                    {t("people.recordAsLeft")}
                  </MenuItem>
                ))}

              {/*
                Remove is offered only where it can apply. Somebody already
                recorded as having left has a document with this school's name
                on it, so removing them is refused server-side anyway — showing
                the entry there would be offering an action that always fails.
              */}
              {isStudent && !hasLeft && (
                <MenuItem
                  icon={<TrashIcon className="size-4" />}
                  tone="danger"
                  onClick={() => show("remove")}
                >
                  {t("people.remove")}
                </MenuItem>
              )}
            </div>
          </>
        )}
      </div>

      {panel === "pause" && (
        <PausePanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "left" && (
        <LeavingPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "remove" && (
        <RemovePanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "birthdate" && (
        <BirthdatePanel
          membershipId={membershipId}
          name={name}
          initial={birthdate ?? ""}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "staff" && staffRecord && (
        <StaffRecordPanel membershipId={membershipId} name={name} initial={staffRecord} onClose={() => setPanel(null)} />
      )}
      {panel === "firstSignin" && (
        <FirstSignInPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "parent" && (
        <ParentLinkPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "subjects" && (
        <SubjectsPanel
          membershipId={membershipId}
          name={name}
          initial={subjects ?? []}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
