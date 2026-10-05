"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  HandshakeIcon,
  HourglassIcon,
  ProhibitIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import type { AdmissionStatus } from "@edulink/contracts";
import type { Admitted } from "@/lib/admissions";
import { Button } from "@/components/ui/button";
import {
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import {
  admitAction,
  decideAction,
  offerAction,
  recordTestAction,
  verifyDocumentsAction,
} from "../../actions";

type Structure = { id: string; name: string; gradeLevel: string | null };
type ClassOption = { id: string; name: string; gradeLevel: string | null };

/**
 * The office's steps on one application, each a small form that calls its
 * action and refreshes the page so the server's `can.*` flags redraw what
 * comes next. The admit form keeps its result on screen: the first sign-in
 * code is shown once and goes home on a slip, so it must not vanish with
 * the refresh.
 */
const errorBox =
  "rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger";

export function VerifyButton({ applicationId }: { applicationId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      icon={<CheckCircleIcon weight="bold" />}
      data-testid="verify-documents"
      onClick={() =>
        startTransition(async () => {
          const result = await verifyDocumentsAction(applicationId);
          if (!result.ok) {
            toast({
              tone: "danger",
              title: actionError(t, result, "common.tryAgain"),
            });
            return;
          }
          toast({ tone: "ok", title: t("admissions.verifiedDone") });
          router.refresh();
        })
      }
    >
      {t("admissions.verify")}
    </Button>
  );
}

export function TestForm({
  applicationId,
  score: initialScore,
  note: initialNote,
}: {
  applicationId: string;
  score: string | null;
  note: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState(initialScore ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await recordTestAction(applicationId, {
        score: score.trim() ? score.trim().slice(0, 40) : null,
        ...(note.trim() ? { note: note.trim().slice(0, 400) } : {}),
      });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.testRecorded") });
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-3"
      data-testid="test-form"
    >
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("admissions.score")}
          value={score}
          maxLength={40}
          autoComplete="off"
          onChange={(e) => setScore(e.target.value)}
        />
        <TextField
          label={t("admissions.testNote")}
          value={note}
          maxLength={400}
          autoComplete="off"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<SealCheckIcon weight="bold" />}
      >
        {t("admissions.recordTest")}
      </Button>
    </form>
  );
}

export function OfferForm({
  applicationId,
  structures,
}: {
  applicationId: string;
  structures: Structure[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [expiresOn, setExpiresOn] = useState("");
  const [note, setNote] = useState("");
  /** "" keeps the cycle's structure, "none" puts the pupil on nothing, else an id. */
  const [structure, setStructure] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await offerAction(applicationId, {
        expiresOn: expiresOn || null,
        ...(note.trim() ? { note: note.trim().slice(0, 400) } : {}),
        ...(structure === ""
          ? {}
          : { feeStructureId: structure === "none" ? null : structure }),
      });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.offerMade") });
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-3"
      data-testid="offer-form"
    >
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField
          label={t("admissions.offerExpires")}
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
        />
        <SelectField
          label={t("admissions.feeStructure")}
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
        >
          <option value="">{t("admissions.feeStructureDefault")}</option>
          <option value="none">{t("admissions.noFeeStructure")}</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {[s.name, s.gradeLevel].filter(Boolean).join(" · ")}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label={t("admissions.offerNote")}
        rows={2}
        value={note}
        maxLength={400}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        type="submit"
        size="sm"
        loading={pending}
        icon={<HandshakeIcon weight="bold" />}
        data-testid="offer-submit"
      >
        {t("admissions.makeOffer")}
      </Button>
    </form>
  );
}

export function DecideButtons({
  applicationId,
  status,
}: {
  applicationId: string;
  status: AdmissionStatus;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function decide(next: "WAITLISTED" | "DECLINED" | "SUBMITTED") {
    setError(null);
    startTransition(async () => {
      const result = await decideAction(applicationId, {
        status: next,
        ...(note.trim() ? { note: note.trim().slice(0, 400) } : {}),
      });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.decided") });
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" data-testid="decide-form">
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <TextField
        label={t("admissions.decisionNote")}
        value={note}
        maxLength={400}
        autoComplete="off"
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {status !== "WAITLISTED" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={pending}
            icon={<HourglassIcon weight="bold" />}
            onClick={() => decide("WAITLISTED")}
            data-testid="decide-waitlist"
          >
            {t("admissions.waitlist")}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="danger"
          loading={pending}
          icon={<ProhibitIcon weight="bold" />}
          onClick={() => decide("DECLINED")}
          data-testid="decide-decline"
        >
          {t("admissions.declineApplication")}
        </Button>
        {status !== "SUBMITTED" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={pending}
            icon={<ArrowCounterClockwiseIcon weight="bold" />}
            onClick={() => decide("SUBMITTED")}
            data-testid="decide-pool"
          >
            {t("admissions.backToPool")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdmitForm({
  applicationId,
  childName,
  classes,
  structures,
  canAdmit,
}: {
  applicationId: string;
  childName: string;
  /** False once admitted: the form goes, the panel (if this mount produced it) stays. */
  canAdmit: boolean;
  classes: ClassOption[];
  structures: Structure[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [classId, setClassId] = useState("");
  const [structure, setStructure] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Admitted | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await admitAction(applicationId, {
        classId: classId || null,
        ...(structure === ""
          ? {}
          : { feeStructureId: structure === "none" ? null : structure }),
        ...(admissionNumber.trim()
          ? { admissionNumber: admissionNumber.trim().slice(0, 40) }
          : {}),
      });
      if (!result.ok || !result.admitted) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      setDone(result.admitted);
      toast({
        tone: "ok",
        title: t("admissions.admittedResult", { name: childName }),
      });
      router.refresh();
    });
  }

  if (done) {
    return (
      <div
        className="space-y-3 rounded-[var(--radius-md)] border border-ok/40 bg-ok-soft p-4"
        data-testid="admitted-panel"
      >
        <p className="text-sm font-semibold text-ok">
          {t("admissions.admittedResult", { name: childName })}
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-fg-muted">
              {t("admissions.studentCode")}
            </dt>
            <dd className="font-mono text-sm text-fg">{done.studentCode}</dd>
          </div>
          {done.className && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-fg-muted">
                {t("admissions.className")}
              </dt>
              <dd className="text-sm text-fg">{done.className}</dd>
            </div>
          )}
          {done.firstSignInCode && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-fg-muted">
                {t("admissions.firstSignInCode")}
              </dt>
              <dd
                className="font-mono text-lg font-bold tracking-widest text-fg"
                data-testid="first-signin-code"
              >
                {done.firstSignInCode}
              </dd>
              <dd className="text-xs text-fg-muted">
                {t("admissions.firstSignInHint")}
              </dd>
            </div>
          )}
        </dl>
        <ul className="space-y-1 text-sm text-fg">
          <li>
            {done.feePlan
              ? t("admissions.feePlanCreated")
              : t("admissions.feePlanNone")}
          </li>
          <li>
            {done.guardianLinked
              ? t("admissions.guardianLinked")
              : t("admissions.guardianStandin")}
          </li>
        </ul>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/people/${done.studentMembershipId}`}>
            {t("admissions.openRoll")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!canAdmit) return null;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-3"
      data-testid="admit-form"
    >
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t("admissions.className")}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          data-testid="admit-class"
        >
          <option value="">{t("admissions.noClass")}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {[
                c.name,
                c.gradeLevel
                  ? `${t("admissions.grade")} ${c.gradeLevel}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t("admissions.feeStructure")}
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
        >
          <option value="">{t("admissions.feeStructureDefault")}</option>
          <option value="none">{t("admissions.noFeeStructure")}</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {[s.name, s.gradeLevel].filter(Boolean).join(" · ")}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField
        label={t("admissions.admissionNumber")}
        hint={t("admissions.admissionNumberHint")}
        value={admissionNumber}
        maxLength={40}
        autoComplete="off"
        onChange={(e) => setAdmissionNumber(e.target.value)}
        className="max-w-xs"
      />
      <Button
        type="submit"
        size="sm"
        loading={pending}
        icon={<GraduationCapIcon weight="bold" />}
        data-testid="admit-submit"
      >
        {t("admissions.admit")}
      </Button>
    </form>
  );
}
