"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { FloppyDiskIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createPlanAction, deletePlanAction, updatePlanAction } from "../actions";
import { useT } from "@/lib/i18n";

type PlanValues = { code: string; name: string; pupilCap: string; messageCap: string; storageCapMb: string; priceMonthlyPaise: string };

export type PlanView = {
  id: string;
  code: string;
  name: string;
  pupilCap: number | null;
  messageCap: number | null;
  storageCapMb: number | null;
  priceMonthlyPaise: number | null;
  createdAt: string;
  schools: number;
};

const BLANK: PlanValues = { code: "", name: "", pupilCap: "", messageCap: "", storageCapMb: "", priceMonthlyPaise: "" };

function valuesOf(plan: PlanView): PlanValues {
  return {
    code: plan.code,
    name: plan.name,
    pupilCap: plan.pupilCap === null ? "" : String(plan.pupilCap),
    messageCap: plan.messageCap === null ? "" : String(plan.messageCap),
    storageCapMb: plan.storageCapMb === null ? "" : String(plan.storageCapMb),
    // Rupees on the form, paise in the row: the operator thinks in rupees.
    priceMonthlyPaise: plan.priceMonthlyPaise === null ? "" : String(plan.priceMonthlyPaise / 100),
  };
}

/** A blank field is "no cap"; anything else must be a whole number. */
function capOf(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return Math.round(Number(trimmed));
}

function inputOf(values: PlanValues) {
  const price = values.priceMonthlyPaise.trim() ? Math.round(Number(values.priceMonthlyPaise) * 100) : null;
  return { code: values.code, name: values.name, pupilCap: capOf(values.pupilCap), messageCap: capOf(values.messageCap), storageCapMb: capOf(values.storageCapMb), priceMonthlyPaise: price };
}

/** The six fields, for adding and for correcting. */
function PlanFields({ values, set }: { values: PlanValues; set: (key: keyof PlanValues, value: string) => void }) {
  const t = useT();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("root.planCode")} hint={t("root.planCodeHint")} required value={values.code} onChange={(e) => set("code", e.target.value)} maxLength={32} autoCapitalize="none" />
        <TextField label={t("root.planName")} required value={values.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("root.planPupilCap")} type="number" min={0} inputMode="numeric" value={values.pupilCap} onChange={(e) => set("pupilCap", e.target.value)} placeholder={t("root.planNoCap")} />
        <TextField label={t("root.planMessageCap")} type="number" min={0} inputMode="numeric" value={values.messageCap} onChange={(e) => set("messageCap", e.target.value)} placeholder={t("root.planNoCap")} />
        <TextField label={t("root.planStorageCap")} type="number" min={0} inputMode="numeric" value={values.storageCapMb} onChange={(e) => set("storageCapMb", e.target.value)} placeholder={t("root.planNoCap")} />
        <TextField label={t("root.planPrice")} type="number" min={0} step="0.01" inputMode="decimal" value={values.priceMonthlyPaise} onChange={(e) => set("priceMonthlyPaise", e.target.value)} />
      </div>
    </>
  );
}

export function PlanForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<PlanValues>(BLANK);
  const set = (key: keyof PlanValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPlanAction(inputOf(values));
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      setValues(BLANK);
      toast({ tone: "ok", title: t("root.planCreated") });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PlanFields values={values} set={set} />
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Button type="submit" icon={<PlusIcon weight="bold" />} loading={pending} disabled={!values.code.trim() || !values.name.trim()}>
        {t("root.planAdd")}
      </Button>
    </form>
  );
}

/** One plan: its caps at a glance, opened into the form to correct, removable once no school is on it. */
export function PlanRowCard({ plan }: { plan: PlanView }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<PlanValues>(valuesOf(plan));
  const set = (key: keyof PlanValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const cap = (value: number | null, unit = "") => (value === null ? t("root.planNoCap") : `${value.toLocaleString()}${unit}`);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePlanAction(plan.id, inputOf(values));
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      setEditing(false);
      toast({ tone: "ok", title: t("root.planSaved") });
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(t("root.planDeleteConfirm", { name: plan.name }))) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePlanAction(plan.id);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.planDeleted") });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {plan.name}
            <span className="font-mono text-xs font-semibold text-fg-muted">{plan.code}</span>
            <Badge tone={plan.schools > 0 ? "accent" : "neutral"} size="sm">
              {plan.schools === 1 ? t("root.planSchoolsOnOne") : t("root.planSchoolsOnMany", { count: plan.schools })}
            </Badge>
          </span>
        }
        description={[
          [t("root.planPupilCap"), cap(plan.pupilCap)].join(": "),
          [t("root.planMessageCap"), cap(plan.messageCap)].join(": "),
          [t("root.planStorageCap"), cap(plan.storageCapMb, " MB")].join(": "),
          [t("root.planPrice"), plan.priceMonthlyPaise === null ? "—" : `₹${(plan.priceMonthlyPaise / 100).toLocaleString()}`].join(": "),
        ].join(" · ")}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? t("common.cancel") : t("common.edit")}
            </Button>
            <Button size="sm" variant="ghost" icon={<TrashIcon weight="bold" />} disabled={plan.schools > 0} loading={pending && !editing} onClick={remove} aria-label={[t("root.planDelete"), plan.name].join(": ")}>
              {t("root.planDelete")}
            </Button>
          </div>
        }
      />
      {(editing || error) && (
        <CardBody>
          {editing ? (
            <form onSubmit={save} className="space-y-4">
              <PlanFields values={values} set={set} />
              {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" icon={<FloppyDiskIcon weight="bold" />} loading={pending}>
                {t("root.planSave")}
              </Button>
            </form>
          ) : (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </CardBody>
      )}
    </Card>
  );
}
