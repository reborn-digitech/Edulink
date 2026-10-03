"use server";

import {
  SALARY_COMPONENT_CODES,
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
