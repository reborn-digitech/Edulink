"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { HandshakeIcon, SealCheckIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { pair } from "./actions";
import { useT } from "@/lib/i18n";
import { fieldClass } from "@/components/ui/field-class";

type Option = { id: string; name: string };
type Expert = Option & { headline: string; verified: boolean };

/**
 * Setting up a mentorship, for a teacher or an admin.
 *
 * IT SAYS WHAT WILL HAPPEN NEXT, before the button is pressed: a guardian is
 * asked, nobody can message until they agree, and the conversation will be
 * readable by them and by the school. Staff pairing a child with an outside
 * adult should not have to infer any of that, and a guardian who was never told
 * a request was coming reads it as the school going behind their back.
 *
 * Collapsed by default. This is a rare, deliberate action on a page that mostly
 * exists to be read, and an always-open form invites an accidental one.
 */
export function PairForm({ experts, pupils }: { experts: Expert[]; pupils: Option[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [expertId, setExpertId] = useState("");
  const [pupilId, setPupilId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ready = expertId && pupilId && purpose.trim().length >= 5;

  if (experts.length === 0 || pupils.length === 0) {
    return (
      <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-xs text-fg-muted">
        <WarningIcon weight="bold" className="mt-0.5 size-4 shrink-0" />
        <span>
          {experts.length === 0 ? t("mentoring.noExpertsYet") : t("mentoring.noPupils")}
        </span>
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        icon={<HandshakeIcon weight="bold" className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {t("mentoring.setUp")}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader
        title={t("mentoring.setUp")}
        description={t("mentoring.guardianFirst")}
        icon={<HandshakeIcon weight="duotone" className="size-5" />}
      />
      <CardBody className="space-y-3">
        <label className="block text-sm text-fg-muted">
          {t("mentoring.pupil")}
          <select
            value={pupilId}
            onChange={(e) => setPupilId(e.target.value)}
            className={fieldClass("mt-1")}
          >
            <option value="">{t("mentoring.choosePupil")}</option>
            {pupils.map((pupil) => (
              <option key={pupil.id} value={pupil.id}>
                {pupil.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-fg-muted">
          {t("mentoring.mentor")}
          <select
            value={expertId}
            onChange={(e) => setExpertId(e.target.value)}
            className={fieldClass("mt-1")}
          >
            <option value="">{t("mentoring.chooseMentor")}</option>
            {experts.map((expert) => (
              <option key={expert.id} value={expert.id}>
                {expert.name} — {expert.headline}
                {expert.verified ? ` ${t("mentoring.verifiedMark")}` : ""}
              </option>
            ))}
          </select>
        </label>

        {experts.find((e) => e.id === expertId && !e.verified) && (
          <p className="flex items-start gap-2 text-xs text-warn">
            <SealCheckIcon weight="bold" className="mt-0.5 size-4 shrink-0" />
            <span>{t("mentoring.notVerified")}</span>
          </p>
        )}

        <label className="block text-sm text-fg-muted">
          {t("mentoring.forWhat")}
          <input
            type="text"
            value={purpose}
            placeholder={t("mentoring.purposePlaceholder")}
            onChange={(e) => setPurpose(e.target.value)}
            className={fieldClass("mt-1")}
          />
          <span className="mt-1 block text-xs text-fg-subtle">{t("mentoring.guardianSees")}</span>
        </label>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            loading={pending}
            disabled={!ready}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await pair(expertId, pupilId, purpose);
                if (!result.ok) {
                  setError(result.error ?? t("mentoring.couldNotSetUp"));
                  return;
                }
                setOpen(false);
                setExpertId("");
                setPupilId("");
                setPurpose("");
                router.refresh();
              })
            }
          >
            {t("mentoring.askTheGuardian")}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
