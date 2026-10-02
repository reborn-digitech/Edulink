"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FloppyDiskIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createPartnerAction, updatePartnerAction } from "../actions";
import { useT } from "@/lib/i18n";

type Values = { name: string; percent: string; phone: string; email: string; notes: string };

export type PartnerView = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  percentTenths: number;
  notes: string;
  schools: { id: string; name: string; statusLabel: string; planName: string | null }[];
  owed: string;
};

const BLANK: Values = { name: "", percent: "", phone: "", email: "", notes: "" };

/** Tenths on the row, a percentage with one decimal on the form. */
function valuesOf(p: PartnerView): Values {
  return { name: p.name, percent: (p.percentTenths / 10).toString(), phone: p.phone ?? "", email: p.email ?? "", notes: p.notes };
}
function inputOf(v: Values) {
  return { name: v.name, percentTenths: Math.round(Number(v.percent || "0") * 10), phone: v.phone || null, email: v.email || null, notes: v.notes };
}

function PartnerFields({ values, set }: { values: Values; set: (key: keyof Values, value: string) => void }) {
  const t = useT();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("root.partnerName")} required value={values.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
        <TextField label={t("root.commissionPercent")} required hint={t("root.commissionPercentHint")} inputMode="decimal" value={values.percent} onChange={(e) => set("percent", e.target.value)} />
        <TextField label={t("root.partnerPhone")} type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
        <TextField label={t("root.partnerEmail")} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} maxLength={320} />
      </div>
      <TextAreaField label={t("root.partnerNotes")} value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={2000} />
    </>
  );
}

/** Adding a partner. */
export function PartnerForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(BLANK);
  const set = (key: keyof Values, value: string) => setValues((v) => ({ ...v, [key]: value }));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPartnerAction(inputOf(values));
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.partnerCreated") });
      setValues(BLANK);
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <PartnerFields values={values} set={set} />
      <Button type="submit" loading={pending} disabled={!values.name.trim() || !values.percent.trim()} icon={<PlusIcon weight="bold" />}>
        {t("root.partnerAdd")}
      </Button>
    </form>
  );
}

/** One partner: their schools and what they are owed, and the fields to correct them. */
export function PartnerRowCard({ partner }: { partner: PartnerView }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Values>(() => valuesOf(partner));
  const set = (key: keyof Values, value: string) => setValues((v) => ({ ...v, [key]: value }));
  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePartnerAction(partner.id, inputOf(values));
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.partnerSaved") });
      setEditing(false);
      router.refresh();
    });
  }
  return (
    <Card>
      <CardHeader
        title={`${partner.name} · ${(partner.percentTenths / 10).toLocaleString()}%`}
        description={[partner.phone, partner.email].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="accent">{`${t("root.partnerOwed")}: ${partner.owed}`}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
              {editing ? t("common.cancel") : t("common.edit")}
            </Button>
          </div>
        }
      />
      <CardBody className="space-y-3">
        {partner.notes && <p className="text-sm text-fg-muted">{partner.notes}</p>}
        {partner.schools.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("root.partnerNoSchools")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {partner.schools.map((s) => (
              <li key={s.id}>
                <Link href={`/root/${s.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-fg hover:bg-surface-muted">
                  {s.name}
                  <span className="text-xs text-fg-muted">· {s.statusLabel}{s.planName ? ` · ${s.planName}` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {editing && (
          <form onSubmit={save} className="space-y-4 border-t border-border pt-4" noValidate>
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <PartnerFields values={values} set={set} />
            <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
              {t("root.partnerSave")}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
