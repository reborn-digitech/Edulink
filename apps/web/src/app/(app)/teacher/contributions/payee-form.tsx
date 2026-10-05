"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { savePayeeAction } from "./actions";

/** Where the teacher is paid: their own UPI id and the name on it. */
export function PayeeForm({ payee }: { payee: { upiId: string; payeeName: string } | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [upiId, setUpiId] = useState(payee?.upiId ?? "");
  const [payeeName, setPayeeName] = useState(payee?.payeeName ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await savePayeeAction({ upiId, payeeName });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: t("gigs.payeeSaved") });
          router.refresh();
        });
      }}
      className="space-y-3"
      data-testid="gig-payee"
    >
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* An address, not a sentence: typed as it is, whatever the keyboard switch says. */}
        <div data-typing="en">
          <TextField label={t("gigs.upiId")} value={upiId} maxLength={320} autoComplete="off" inputMode="email" onChange={(e) => setUpiId(e.target.value)} data-testid="gig-upi" />
        </div>
        <TextField label={t("gigs.payeeName")} value={payeeName} maxLength={80} autoComplete="name" onChange={(e) => setPayeeName(e.target.value)} data-testid="gig-payee-name" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t("common.saving") : t("gigs.savePayee")}
      </Button>
    </form>
  );
}
