"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import Link from "next/link";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { SUBSCRIPTION_STATUSES, type OperatorSubscription, type OperatorSubscriptionBody, type SubscriptionStatus } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setContactAction, setSubscriptionAction } from "../actions";
import { useT } from "@/lib/i18n";

type PartnerOption = { id: string; name: string; percentTenths: number };

/**
 * The subscription card: where it stands, the dates, the invoice and the
 * payment as recorded dates with references, the partner — and a reason,
 * which every change must carry. Only what changed is sent; the server
 * refuses a status the list does not allow after the current one, a due
 * date before the start, a blank reason, each with its own sentence.
 */
export function SubscriptionPanel({ schoolId, subscription, partnerId, partners }: { schoolId: string; subscription: OperatorSubscription; partnerId: string | null; partners: PartnerOption[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initial = {
    status: subscription.status ?? "",
    startsAt: subscription.startsAt ?? "",
    dueAt: subscription.dueAt ?? "",
    invoicedAt: subscription.invoicedAt ?? "",
    invoiceRef: subscription.invoiceRef ?? "",
    paidAt: subscription.paidAt ?? "",
    paidRef: subscription.paidRef ?? "",
    partnerId: partnerId ?? "",
  };
  const [form, setForm] = useState(initial);
  const [reason, setReason] = useState("");
  const set = (key: keyof typeof initial) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const changed = (Object.keys(initial) as (keyof typeof initial)[]).filter((k) => form[k] !== initial[k]);

  const days = subscription.daysToDue;
  const dueLine = days === null ? null : days === 0 ? t("root.subscriptionDueToday") : days > 0 ? t("root.subscriptionDueIn", { days }) : t("root.subscriptionOverdue", { days: -days });
  const tone = subscription.status === "ENDED" || subscription.status === "SUSPENDED" || days === null ? "neutral" : days < 0 ? "danger" : days <= 30 ? "warn" : "ok";

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const body: OperatorSubscriptionBody = { reason };
    if (changed.includes("status")) body.status = form.status as SubscriptionStatus;
    for (const key of ["startsAt", "dueAt", "invoicedAt", "paidAt"] as const) if (changed.includes(key)) body[key] = form[key] || null;
    for (const key of ["invoiceRef", "paidRef"] as const) if (changed.includes(key)) body[key] = form[key] || null;
    if (changed.includes("partnerId")) body.commissionPartnerId = form.partnerId || null;
    startTransition(async () => {
      const result = await setSubscriptionAction(schoolId, body);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.subscriptionSaved") });
      setReason("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{subscription.status ? t(`root.status${subscription.status}` as TranslationKey) : t("root.subscriptionNone")}</Badge>
        {dueLine && <span className={`text-sm font-medium ${tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-fg-muted"}`}>{dueLine}</span>}
      </div>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("root.subscriptionStatus")} value={form.status} onChange={(e) => set("status")(e.target.value)}>
          <option value="">{t("root.subscriptionNotRecorded")}</option>
          {SUBSCRIPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`root.status${s}` as TranslationKey)}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("root.commissionPartner")} value={form.partnerId} onChange={(e) => set("partnerId")(e.target.value)}>
          <option value="">{t("root.commissionNoneOption")}</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {(p.percentTenths / 10).toLocaleString()}%
            </option>
          ))}
        </SelectField>
        <DateField label={t("root.subscriptionStarts")} value={form.startsAt} onChange={(e) => set("startsAt")(e.target.value)} />
        <DateField label={t("root.subscriptionDue")} value={form.dueAt} onChange={(e) => set("dueAt")(e.target.value)} />
        <DateField label={t("root.subscriptionInvoiced")} value={form.invoicedAt} onChange={(e) => set("invoicedAt")(e.target.value)} />
        <TextField label={t("root.subscriptionInvoiceRef")} value={form.invoiceRef} onChange={(e) => set("invoiceRef")(e.target.value)} maxLength={120} />
        <DateField label={t("root.subscriptionPaid")} value={form.paidAt} onChange={(e) => set("paidAt")(e.target.value)} />
        <TextField label={t("root.subscriptionPaidRef")} value={form.paidRef} onChange={(e) => set("paidRef")(e.target.value)} maxLength={120} />
      </div>
      <TextField label={t("root.subscriptionReason")} hint={t("root.subscriptionReasonHint")} required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} disabled={changed.length === 0 || !reason.trim()} icon={<FloppyDiskIcon weight="bold" />}>
          {t("root.subscriptionSave")}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/root/partners">{t("root.partners")}</Link>
        </Button>
      </div>
    </form>
  );
}

/** The point of contact: four fields, saved whole; the server keeps only what differs. */
export function ContactPanel({ schoolId, contact }: { schoolId: string; contact: { name: string | null; role: string | null; phone: string | null; email: string | null } }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initial = { name: contact.name ?? "", role: contact.role ?? "", phone: contact.phone ?? "", email: contact.email ?? "" };
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof initial) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const unchanged = (Object.keys(initial) as (keyof typeof initial)[]).every((k) => form[k].trim() === initial[k]);
  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setContactAction(schoolId, { name: form.name || null, role: form.role || null, phone: form.phone || null, email: form.email || null });
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.contactSaved") });
      router.refresh();
    });
  }
  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("root.contactName")} value={form.name} onChange={(e) => set("name")(e.target.value)} maxLength={120} />
        <TextField label={t("root.contactRole")} value={form.role} onChange={(e) => set("role")(e.target.value)} maxLength={80} />
        <TextField label={t("root.contactPhone")} type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} maxLength={40} />
        <TextField label={t("root.pocEmail")} type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} maxLength={320} />
      </div>
      <Button type="submit" loading={pending} disabled={unchanged} icon={<FloppyDiskIcon weight="bold" />}>
        {t("root.contactSave")}
      </Button>
    </form>
  );
}
