"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import {
  ArrowCounterClockwiseIcon,
  BooksIcon,
  CakeIcon,
  CertificateIcon,
  KeyIcon,
  IdentificationCardIcon,
  DotsThreeIcon,
  PauseCircleIcon,
  SignOutIcon,
  UsersThreeIcon,
  TrashIcon,
  ShieldStarIcon,
} from "@phosphor-icons/react";
import type { DutyCode } from "@edulink/contracts";
import { useToast } from "@/components/ui/toast";
import { cancelLeavingAction, reinstate, undoLeaving } from "./actions";
import { PausePanel } from "./row-actions";
import { LeavingPanel } from "./leaving-actions";
import { StaffLeavingPanel } from "./staff-leaving-panel";
import { RemovePanel } from "./remove-actions";
import { SubjectsPanel } from "./subjects-panel";
import { ParentLinkPanel } from "./parent-link-panel";
import { FamilyLinksPanel } from "./family-links-panel";
import { BirthdatePanel } from "./birthdate-panel";
import { LegalNamePanel } from "./legal-name-panel";
import { FirstSignInPanel } from "./first-signin-panel";
import { OfficeResetPanel } from "./office-reset-panel";
import { StaffRecordPanel, type StaffRecordInitial } from "./staff-record-panel";
import { DutiesPanel } from "./duties-panel";
import { cn } from "@/lib/cn";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

type Panel = "pause" | "left" | "staffLeaving" | "remove" | "subjects" | "parent" | "family" | "birthdate" | "legalName" | "firstSignin" | "officeReset" | "staff" | "duties" | null;

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
  isSupport = false,
  isTeacher,
  subjects,
  birthdate,
  legalName,
  handleOnly,
  hasPassword = false,
  leavingOnKey,
  staffRecord,
  duties,
  suspended,
  hasLeft,
  staffLeaving = false,
}: {
  membershipId: string;
  name: string;
  isStudent: boolean;
  /** owner-batch-item2a: a support worker, who may be given a first sign-in as a pupil on a handle may. */
  isSupport?: boolean;
  /** Teacher rows, and the head's, also carry the subjects editor. */
  isTeacher?: boolean;
  subjects?: string[];
  /** ISO date on file, "" when none — the office may set or correct it. */
  birthdate?: string;
  /** The name papers print — the office may correct it. */
  legalName?: string;
  /** A pupil on a login handle with no address: the office can issue a first sign-in code. */
  handleOnly?: boolean;
  /** TA-037: the account has a password already, so a pupil on a handle is offered the office's reset code instead. */
  hasPassword?: boolean;
  /** A leaving already dated ahead — offers Cancel instead of Record as left. */
  leavingOnKey?: string | null;
  /** Staff rows carry the office's record; undefined for pupils. */
  staffRecord?: StaffRecordInitial;
  /** A college teacher's duties (5 Oct 2026): what they hold and what the college's streams offer; undefined for everyone else. */
  duties?: { held: DutyCode[]; offered: DutyCode[] };
  suspended: boolean;
  hasLeft: boolean;
  /** TA-046: a member of staff's row (SCHOOL_STAFF_ROLES), offered Record leaving; never a guardian's, an alumnus's or a pupil's. */
  staffLeaving?: boolean;
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
            <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg animate-in-up">
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

              {duties && !hasLeft && (
                <MenuItem icon={<ShieldStarIcon className="size-4" />} onClick={() => show("duties")}>
                  {t("duties.menuAction")}
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

              {!hasLeft && legalName !== undefined && (
                <MenuItem icon={<IdentificationCardIcon className="size-4" />} onClick={() => show("legalName")}>
                  {t("people.legalNameAction")}
                </MenuItem>
              )}

              {(isStudent || isSupport) && handleOnly && !(isStudent && hasPassword) && !hasLeft && !suspended && (
                <MenuItem icon={<KeyIcon className="size-4" />} onClick={() => show("firstSignin")}>
                  {t("people.firstSigninAction")}
                </MenuItem>
              )}

              {/* TA-037: a pupil on a handle who has forgotten the password they chose. */}
              {isStudent && handleOnly && hasPassword && !hasLeft && !suspended && (
                <MenuItem icon={<KeyIcon className="size-4" />} onClick={() => show("officeReset")}>
                  {t("people.officeResetAction")}
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

              {/* TA-177: the guardians who see the pupil, and ending one link for a coded reason. */}
              {isStudent && !hasLeft && (
                <MenuItem icon={<UsersThreeIcon className="size-4" />} onClick={() => show("family")}>
                  {t("people.familyLinksAction")}
                </MenuItem>
              )}

              {/* The office's certificates for a pupil: a link, not a panel,
                  because the issue screen needs the whole page. */}
              {isStudent && !hasLeft && (
                <Link
                  href={`/admin/certificates/issue?membershipId=${membershipId}`}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-fg transition-colors hover:bg-surface-muted"
                >
                  <CertificateIcon className="size-4" />
                  {t("certificates.issueFor")}
                </Link>
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

              {/* TA-046: a member of staff's leaving — a last working day with a coded reason, or the day kept given up. */}
              {staffLeaving &&
                !hasLeft &&
                (leavingOnKey ? (
                  <MenuItem icon={<ArrowCounterClockwiseIcon className="size-4" />} disabled={pending} onClick={doCancelLeaving}>
                    {t("people.cancelLeaving")}
                  </MenuItem>
                ) : (
                  <MenuItem icon={<SignOutIcon className="size-4" />} onClick={() => show("staffLeaving")}>
                    {t("people.staffLeavingAction")}
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
      {panel === "staffLeaving" && (
        <StaffLeavingPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
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
      {panel === "legalName" && legalName !== undefined && (
        <LegalNamePanel membershipId={membershipId} name={name} initial={legalName} onClose={() => setPanel(null)} />
      )}
      {panel === "duties" && duties && (
        <DutiesPanel membershipId={membershipId} name={name} initial={duties.held} offered={duties.offered} onClose={() => setPanel(null)} />
      )}
      {panel === "staff" && staffRecord && (
        <StaffRecordPanel membershipId={membershipId} name={name} initial={staffRecord} onClose={() => setPanel(null)} />
      )}
      {panel === "firstSignin" && (
        <FirstSignInPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "officeReset" && (
        <OfficeResetPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "parent" && (
        <ParentLinkPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
      )}
      {panel === "family" && (
        <FamilyLinksPanel membershipId={membershipId} name={name} onClose={() => setPanel(null)} />
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
        "flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50",

        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
