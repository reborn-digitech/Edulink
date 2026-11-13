"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { GRANT_MONTHS, PERSON_PLANS, type PlanCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { grantPlanAction, revokeEntitlementAction, setPlanAction } from "./actions";

/**
 * THE OPERATOR'S PLAN CONTROLS on /root/features (16 October 2026; src/lib/person-plans.ts): one plan's prices in
 * rupees and its Active switch, the grant form, and the Revoke button on a person's entitlement. Each goes through
 * a server action that re-checks the operator and is audited by the library.
 */

const NAME_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "plans.nameStudent", TEACHER: "plans.nameTeacher", EXPERT: "plans.nameExpert" };
const MONTHS_KEY: Record<(typeof GRANT_MONTHS)[number], TranslationKey> = { 1: "plans.months1", 3: "plans.months3", 6: "plans.months6", 12: "plans.months12" };

/** Rupees as typed ("99", "1,999", "99.50") to paise; null when it is not an amount. */
function paiseOf(raw: string): number | null {
  const clean = raw.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}
const rupeesOf = (paise: number) => (paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2));

function useResult() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(work: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast({ tone: "ok", title: result.message });
      after?.();
      router.refresh();
    });
  }
  return { pending, error, setError, run };
}

/** One plan's two prices and its Active switch. */
export function PlanPrices({ code, pricePaise, yearlyPricePaise, active }: { code: PlanCode; pricePaise: number; yearlyPricePaise: number; active: boolean }) {
  const t = useT();
  const { pending, error, setError, run } = useResult();
  const [monthly, setMonthly] = useState(rupeesOf(pricePaise));
  const [yearly, setYearly] = useState(rupeesOf(yearlyPricePaise));
  const name = t(NAME_KEY[code]);

  function save() {
    const m = paiseOf(monthly);
    const y = paiseOf(yearly);
    if (m === null || y === null) {
      setError(t("plans.priceInvalid"));
      return;
    }
    run(() => setPlanAction({ code, pricePaise: m, yearlyPricePaise: y }));
  }
  function toggle() {
    if (!window.confirm(active ? t("plans.confirmInactive", { name }) : t("plans.confirmActive", { name }))) return;
    run(() => setPlanAction({ code, active: !active }));
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("plans.monthlyLabel")} inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} data-testid={`plan-${code}-monthly`} />
        <TextField label={t("plans.yearlyLabel")} inputMode="decimal" value={yearly} onChange={(e) => setYearly(e.target.value)} data-testid={`plan-${code}-yearly`} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" loading={pending} onClick={save} data-testid={`plan-${code}-save`}>
          {t("plans.savePrices")}
        </Button>
        <Button type="button" size="sm" variant={active ? "secondary" : "primary"} loading={pending} onClick={toggle} data-testid={`plan-${code}-active`}>
          {active ? t("plans.makeInactive") : t("plans.makeActive")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** The grant: a person by email, a plan, a period and a note. */
export function GrantForm({ email: initialEmail }: { email: string }) {
  const t = useT();
  const router = useRouter();
  const { pending, error, run } = useResult();
  const [email, setEmail] = useState(initialEmail);
  const [plan, setPlan] = useState<PlanCode>("STUDENT");
  const [months, setMonths] = useState<number>(12);
  const [note, setNote] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => grantPlanAction({ email, plan, months, note }),
          () => {
            setNote("");
            router.push(`/root/features?email=${encodeURIComponent(email.trim().toLowerCase())}#entitlements`);
          },
        );
      }}
      data-testid="grant-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("plans.grantEmail")} type="email" required autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
        <SelectField label={t("plans.grantPlan")} value={plan} onChange={(e) => setPlan(e.target.value as PlanCode)}>
          {PERSON_PLANS.map((p) => (
            <option key={p} value={p}>
              {t(NAME_KEY[p])}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("plans.grantPeriod")} value={String(months)} onChange={(e) => setMonths(Number(e.target.value))}>
          {GRANT_MONTHS.map((m) => (
            <option key={m} value={m}>
              {t(MONTHS_KEY[m])}
            </option>
          ))}
        </SelectField>
        <TextField label={t("plans.grantNote")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </div>
      <Button type="submit" loading={pending}>
        {t("plans.grantButton")}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

/** Revoke one entitlement, after a confirm. */
export function RevokeButton({ id }: { id: string }) {
  const t = useT();
  const { pending, error, run } = useResult();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() => {
          if (window.confirm(t("plans.confirmRevoke"))) run(() => revokeEntitlementAction(id));
        }}
        data-testid={`revoke-${id}`}
      >
        {t("plans.revoke")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
