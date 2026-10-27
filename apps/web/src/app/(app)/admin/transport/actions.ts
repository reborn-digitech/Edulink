"use server";

import { revalidatePath } from "next/cache";
import type { ZodTypeAny } from "zod";
import { busAssignmentInputSchema, busInputSchema, routeFeesBodySchema, transportAllotInputSchema, transportRouteInputSchema, transportSettingsSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { allotPupils, createAssignment, endAllotment, endAssignment, saveBus, saveRoute, setTransportSettings } from "@/lib/transport";
import { raiseRouteFees } from "@/lib/college-fees";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The office's transport writes from /admin/transport: each one the same
 * library function its /api/v1 door calls, the ADMIN's alone, audited there.
 * A refusal comes back as the reader's sentence; a body that does not parse
 * as "check the form".
 */
type Result = { ok: true; id?: string; count?: number } | { ok: false; error: string };

async function run(work: () => Promise<{ id?: string; count?: number } | void>): Promise<Result> {
  const t = await getT();
  try {
    const out = (await work()) ?? {};
    revalidatePath("/admin/transport");
    return { ok: true, ...out };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    if (error instanceof FormError) return { ok: false, error: t("common.checkTheForm") };
    console.error("[transport action]", error);
    return { ok: false, error: t("common.tryAgain") };
  }
}

class FormError extends Error {}
function parse<S extends ZodTypeAny>(schema: S, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new FormError("form");
  return parsed.data as ReturnType<S["parse"]>;
}

export async function saveRouteAction(routeId: string | null, input: unknown): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    return saveRoute(ctx, routeId, parse(transportRouteInputSchema, input));
  });
}

export async function saveBusAction(busId: string | null, input: unknown): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    return saveBus(ctx, busId, parse(busInputSchema, input));
  });
}

export async function createAssignmentAction(input: unknown): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    return createAssignment(ctx, parse(busAssignmentInputSchema, input));
  });
}

export async function endAssignmentAction(assignmentId: string): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    await endAssignment(ctx, assignmentId);
  });
}

export async function allotAction(input: unknown): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    const { allotted } = await allotPupils(ctx, parse(transportAllotInputSchema, input));
    return { count: allotted };
  });
}

export async function endAllotmentAction(allotmentId: string): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    await endAllotment(ctx, allotmentId);
  });
}

export async function settingsAction(input: unknown): Promise<Result> {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    await setTransportSettings(ctx, parse(transportSettingsSchema, input));
  });
}

/**
 * owner-batch-item5 (27 Oct 2026): the term's route fees, raised on each rider's ledger from the routes tab — the
 * same library call as POST /api/v1/admin/transport/route-fees, answered in place through <ActionForm> (a refusal by
 * its box, what was typed kept). Each rider of a route with a fee per term is charged once for the term.
 */
export async function routeFeesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("ADMIN");
      const input = routeFeesBodySchema.parse({ termLabel: String(formData.get("termLabel") ?? ""), dueDateKey: String(formData.get("dueDateKey") ?? "") });
      const r = await raiseRouteFees(ctx, input);
      return { key: "collegeOffice.routeFeesRaised", vars: { raised: r.raised, already: r.already } };
    },
    { revalidate: ["/admin/transport"] },
  );
}
