import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { MENTORING_OFFER_DAYS, type PaidGate, type TeacherPaidGate } from "@/lib/gig-sessions";

/**
 * The four conditions before an expert may price a workshop seat, as a
 * checklist, with the operator's switch above them when it is off (decision
 * 0004, amended 2026-10-02). A server component: the gate is read once with
 * the page.
 */
export async function PaidGateList({ gate }: { gate: PaidGate }) {
  const t = await getT();
  const rows: [boolean, string][] = [
    [gate.kycVerified, t("gigs.gateKyc")],
    [gate.payoutActive, t("gigs.gatePayout")],
    [gate.mentoringOffer, t("gigs.gateMentoring", { days: MENTORING_OFFER_DAYS })],
    [gate.dutyDone, gate.dutyDone ? t("gigs.gateDuty") : t("gigs.gateDutyOwed", { count: gate.oneToOnesOwed })],
  ];
  return (
    <ul className="space-y-1.5 text-sm" data-testid="paid-gate-list">
      {!gate.paymentsOn && (
        <li className="flex items-center gap-2 text-fg-muted" data-testid="paid-gate-off">
          <span aria-hidden="true" className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-fg-muted" />
          <span>{t("gigs.gateOff")}</span>
        </li>
      )}
      {rows.map(([done, label]) => (
        <li key={label} className="flex items-center gap-2" data-done={done ? "yes" : "no"}>
          <span aria-hidden="true" className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-ok text-surface" : "border border-border text-fg-muted"}`}>
            {done ? "✓" : ""}
          </span>
          <span className={done ? "text-fg-muted line-through" : "text-fg"}>{label}</span>
        </li>
      ))}
      {/* TA-564: the free offer binds the sale too; while it lapses, the expert's priced times are off sale. */}
      {gate.pricedOffSale > 0 && (
        <li className="flex items-center gap-2 text-danger" data-testid="paid-gate-off-sale">
          <span aria-hidden="true" className="inline-flex size-4 items-center justify-center rounded-full border border-danger text-[10px] font-bold" />
          <span>{t("gigs.gatePricedOffSale")}</span>
        </li>
      )}
    </ul>
  );
}

/**
 * A teacher's two conditions before guidance may be priced (seats, 17 Oct 2026; decision 0006): the operator's switch
 * for paid sessions, and a UPI id saved for the company to pay them by (the same payee as for questions, /teacher/payee).
 */
export async function TeacherGateList({ gate }: { gate: TeacherPaidGate }) {
  const t = await getT();
  const rows: [boolean, React.ReactNode, string][] = [
    [gate.paymentsOn, gate.paymentsOn ? t("seats.teacherGatePaymentsOn") : t("seats.teacherGateOff"), "payments"],
    [
      gate.payeeSaved,
      gate.payeeSaved ? (
        t("seats.teacherGatePayee")
      ) : (
        <Link href="/teacher/payee" className="font-medium text-accent-strong underline underline-offset-2">
          {t("seats.teacherGatePayeeLink")}
        </Link>
      ),
      "payee",
    ],
  ];
  return (
    <ul className="space-y-1.5 text-sm" data-testid="teacher-gate-list">
      {rows.map(([done, label, key]) => (
        <li key={key} className="flex items-center gap-2" data-done={done ? "yes" : "no"}>
          <span aria-hidden="true" className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-ok text-surface" : "border border-border text-fg-muted"}`}>
            {done ? "✓" : ""}
          </span>
          <span className={done ? "text-fg-muted" : "text-fg"}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
