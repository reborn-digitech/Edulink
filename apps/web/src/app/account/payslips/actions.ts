"use server";

import { advanceAskSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { askAdvance } from "@/lib/payroll";
import { field, runAction, rupeesField } from "@/lib/module-actions";

/** A member of staff asks the office for an advance against salary. Only async functions are exported (tests/use-server-exports). */
export async function askAdvanceAction(form: FormData): Promise<void> {
  await runAction("/account/payslips", async () => {
    const ctx = await requireApiUser();
    await askAdvance(ctx, advanceAskSchema.parse({ amountPaise: rupeesField(form, "amount") ?? 0, reason: field(form, "reason") }));
    return "payroll.advanceAsked";
  });
}
