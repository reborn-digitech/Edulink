"use server";

import {
  SALARY_COMPONENT_CODES,
  salaryPaymentRecordSchema,
  salaryPaymentVoidSchema,
  utrSheetSchema,
  type UtrSheetAnswer,
  advanceDecideSchema,
  advanceRecordSchema,
  payrollSettingsSaveSchema,
  payslipEditSchema,
  salaryStructureSaveSchema,
  staffSalarySaveSchema,
} from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { decideAdvance, draftRun, editSlip, lockRun, recordAdvance, savePayrollSettings, saveSalary, saveStructure, shareRun } from "@/lib/payroll";
import { field, runAction, rupeesField } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import { getT } from "@/lib/i18n/server";
import { sheetDate } from "@/lib/salary-payment-rules";
import { importUtrSheet, recordPaymentLines, recordSalaryPayment, voidSalaryPayment, type PaymentLine } from "@/lib/salary-payments";

/**
 * The payroll pages' writes. Who may make each is the library's to decide
 * (the admin alone); this file reads the form, checks its shape with the
 * API's own contract, and goes back to the page with the outcome. Only
 * async functions are exported (tests/use-server-exports).
 */

export async function saveSettingsAction(form: FormData): Promise<void> {
  await runAction("/admin/payroll/settings", async () => {
    const ctx = await requireApiUser();
    await savePayrollSettings(
      ctx,
      payrollSettingsSaveSchema.parse({
        pfEnabled: form.get("pfEnabled") === "on",
        pfOnFullBasic: form.get("pfOnFullBasic") === "on",
        esiEnabled: form.get("esiEnabled") === "on",
        ptState: field(form, "ptState") || "MH",
        employerName: field(form, "employerName"),
        pfEstablishmentCode: field(form, "pfEstablishmentCode"),
        esiEmployerCode: field(form, "esiEmployerCode"),
      }),
    );
    return "payroll.settingsSaved";
  });
}

/**
 * A structure from its form: one row per code, a box to include it, its
 * formula, and its value — rupees for FIXED, a percentage for the shares.
 */
export async function saveStructureAction(form: FormData): Promise<void> {
  await runAction("/admin/payroll/structures", async () => {
    const ctx = await requireApiUser();
    const components = [];
    for (const code of SALARY_COMPONENT_CODES) {
      if (form.get(`on:${code}`) !== "on" && code !== "BASIC") continue;
      const formula = field(form, `formula:${code}`) || "FIXED";
      const raw = field(form, `value:${code}`);
      let value = 0;
      if (raw) {
        if (formula === "FIXED") value = rupeesField(form, `value:${code}`) ?? 0;
        else {
          const pct = Number(raw);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new RuleRefusal("payroll.refusePercent", 422, { code });
          value = Math.round(pct * 100);
        }
      }
      components.push({ code, label: field(form, `label:${code}`), formula, value });
    }
    await saveStructure(ctx, salaryStructureSaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), components, archived: form.get("archived") === "on" }));
    return "payroll.structureSaved";
  });
}

export async function saveSalaryAction(form: FormData): Promise<void> {
  await runAction("/admin/payroll/salaries", async () => {
    const ctx = await requireApiUser();
    await saveSalary(
      ctx,
      staffSalarySaveSchema.parse({
        membershipId: field(form, "membershipId"),
        structureId: field(form, "structureId"),
        effectiveFrom: field(form, "effectiveFrom"),
        basicPaise: rupeesField(form, "basic") ?? 0,
        pfUan: field(form, "pfUan"),
        esiNumber: field(form, "esiNumber"),
        pan: field(form, "pan"),
        bankAccount: field(form, "bankAccount").replace(/\s/g, ""),
        bankIfsc: field(form, "bankIfsc"),
        bankName: field(form, "bankName"),
        upiId: field(form, "upiId"),
        paymentMode: field(form, "paymentMode") || "BANK",
      }),
    );
    return "payroll.salarySaved";
  });
}

export async function draftRunAction(form: FormData): Promise<void> {
  const month = field(form, "month");
  await runAction(`/admin/payroll/runs/${encodeURIComponent(month)}`, async () => {
    const ctx = await requireApiUser();
    await draftRun(ctx, month);
    return "payroll.runDrafted";
  }, ["/admin/payroll"]);
}

export async function editSlipAction(form: FormData): Promise<void> {
  const month = field(form, "month");
  await runAction(`/admin/payroll/runs/${encodeURIComponent(month)}`, async () => {
    const ctx = await requireApiUser();
    const lop = field(form, "lopDays");
    const tds = field(form, "tds");
    await editSlip(
      ctx,
      month,
      field(form, "membershipId"),
      payslipEditSchema.parse({
        arrearsPaise: rupeesField(form, "arrears") ?? 0,
        tdsOverridePaise: tds ? rupeesField(form, "tds") : null,
        lopOverrideDays: lop ? Number(lop) : null,
        notes: field(form, "notes"),
      }),
    );
    return "payroll.slipSaved";
  }, ["/admin/payroll"]);
}

export async function lockRunAction(form: FormData): Promise<void> {
  const month = field(form, "month");
  await runAction(`/admin/payroll/runs/${encodeURIComponent(month)}`, async () => {
    const ctx = await requireApiUser();
    if (form.get("confirm") !== "on") throw new RuleRefusal("payroll.refuseConfirmLock", 422);
    await lockRun(ctx, month);
    return "payroll.runLocked";
  }, ["/admin/payroll"]);
}

export async function shareRunAction(form: FormData): Promise<void> {
  const month = field(form, "month");
  await runAction(`/admin/payroll/runs/${encodeURIComponent(month)}`, async () => {
    const ctx = await requireApiUser();
    const shared = field(form, "shared") === "1";
    await shareRun(ctx, month, shared);
    return shared ? "payroll.runShared" : "payroll.runUnshared";
  });
}

export async function recordAdvanceAction(form: FormData): Promise<void> {
  await runAction("/admin/payroll/advances", async () => {
    const ctx = await requireApiUser();
    await recordAdvance(ctx, advanceRecordSchema.parse({ membershipId: field(form, "membershipId"), amountPaise: rupeesField(form, "amount") ?? 0, monthlyRecoveryPaise: rupeesField(form, "instalment") ?? 0, reason: field(form, "reason") }));
    return "payroll.advanceRecorded";
  });
}

export async function decideAdvanceAction(form: FormData): Promise<void> {
  await runAction("/admin/payroll/advances", async () => {
    const ctx = await requireApiUser();
    const input = advanceDecideSchema.parse({ advanceId: field(form, "advanceId"), decision: field(form, "decision"), amountPaise: rupeesField(form, "amount") ?? undefined, monthlyRecoveryPaise: rupeesField(form, "instalment") ?? undefined, note: field(form, "note") });
    await decideAdvance(ctx, input);
    return input.decision === "RECORD" ? "payroll.advanceRecorded" : "payroll.advanceDeclined";
  });
}

/* ---------------------------------------- salary payments (owner-batch-item2b) */

/**
 * The payment forms answer in place through <ActionForm> (lib/form-action.ts answerForm): a refusal says why
 * beside the box it is about and keeps what was typed; done, a toast and the run refreshed. Never ?error=.
 */
const runPath = (month: string) => `/admin/payroll/runs/${encodeURIComponent(month)}`;
const payPath = (month: string, membershipId: string) => `${runPath(month)}/pay/${encodeURIComponent(membershipId)}`;

/** One slip recorded paid: from the run page's form, or from the pay-from-your-app page with the UTR its app showed. */
export async function recordPaymentAction(previous: FormState, form: FormData): Promise<FormState> {
  const month = field(form, "month");
  const membershipId = field(form, "membershipId");
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      const input = salaryPaymentRecordSchema.parse({ amountPaise: Number(field(form, "amountPaise")), mode: field(form, "mode"), paidOn: field(form, "paidOn"), reference: field(form, "reference"), note: field(form, "note") });
      await recordSalaryPayment(ctx, month, membershipId, input, field(form, "back") === "pay" ? "upi-app" : "form");
      return "salaryPay.recorded";
    },
    { revalidate: [runPath(month), payPath(month, membershipId), "/admin/payroll"] },
  );
}

export async function voidPaymentAction(previous: FormState, form: FormData): Promise<FormState> {
  const month = field(form, "month");
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      await voidSalaryPayment(ctx, month, field(form, "membershipId"), salaryPaymentVoidSchema.parse({ reason: field(form, "reason") }).reason);
      return "salaryPay.voided";
    },
    { revalidate: [runPath(month), "/admin/payroll"] },
  );
}

/**
 * A batch of lines (the sheet, or the bank slips' form): all recorded or none. Refused, the sentence names each
 * refused line and why (the first twenty), in the reader's language, beside the button.
 */
async function linesAnswer(answer: UtrSheetAnswer): Promise<"salaryPay.recordedMany"> {
  if (answer.accepted) return "salaryPay.recordedMany";
  const t = await getT();
  const refused = answer.lines.filter((l) => l.outcome === "REFUSED" && l.reason);
  const lines = refused
    .slice(0, 20)
    .map((l) => t("salaryPay.sheetLine", { line: l.line, ref: l.slipRef || "—", reason: t(`salaryPay.reason${l.reason!}`) }))
    .join("; ");
  // One refused line is said in the singular (qb-B, QB-11).
  throw new RuleRefusal(answer.refused === 1 ? "teachPay.refuseSheetOne" : "salaryPay.refuseSheet", 422, { count: answer.refused, lines: refused.length > 20 ? `${lines}; …` : lines });
}

/** The UTR sheet, uploaded as a file or pasted. */
export async function utrSheetAction(previous: FormState, form: FormData): Promise<FormState> {
  const month = field(form, "month");
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      const file = form.get("file");
      let csv = String(form.get("csv") ?? "");
      if (file instanceof File && file.size > 0) {
        if (file.size > 200_000) throw new RuleRefusal("salaryPay.refuseSheetLong", 422, { max: 2000 }, "file");
        csv = await file.text();
      }
      return linesAnswer(await importUtrSheet(ctx, month, utrSheetSchema.parse({ csv }).csv));
    },
    { revalidate: [runPath(month), "/admin/payroll"] },
  );
}

/** "Record the bank slips as paid": one date, a UTR per slip from the bank's sheet; a blank row stays unpaid. */
export async function bankBatchAction(previous: FormState, form: FormData): Promise<FormState> {
  const month = field(form, "month");
  return answerForm(
    previous,
    form,
    async () => {
      const ctx = await requireApiUser();
      const paidOn = field(form, "paidOn");
      const lines: PaymentLine[] = [];
      for (let i = 0; i < 2_000 && form.has(`ref:${i}`); i++) {
        const reference = field(form, `utr:${i}`);
        if (reference) lines.push({ line: i + 1, slipRef: field(form, `ref:${i}`), reference, dateKey: sheetDate(paidOn), amountPaise: null });
      }
      if (!lines.length) throw new RuleRefusal("salaryPay.refuseNothing", 422);
      return linesAnswer(await recordPaymentLines(ctx, month, lines, "bank-batch"));
    },
    { revalidate: [runPath(month), "/admin/payroll"] },
  );
}
