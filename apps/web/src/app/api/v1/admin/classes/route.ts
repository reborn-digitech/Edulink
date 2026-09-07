import { adminClassesQuerySchema, adminClassesSchema, classCreateBodySchema, classCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminClasses, apiRefused } from "@/lib/api-reads/admin";
import { createClass } from "@/app/(app)/admin/classes/actions";

/** GET /api/v1/admin/classes — the class list, running or archived, with who leads each and how many are in it. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminClassesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const { archived, q, sort, filter } = parsed.data;
    return ok(adminClassesSchema.parse(await adminClasses(ctx, { archived: archived === "1", q, sort, leaderlessOnly: filter === "leaderless" })));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes");
  }
}

/** POST /api/v1/admin/classes — create a class. The school is the session's, never the body's; a duplicate name or a grade the school does not teach is a 422 naming the field. */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = classCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await createClass(parsed.data);
    if (!state.ok || !state.classId || !state.joinCode) {
      const t = await getT();
      const issues: Record<string, string> = { ...state.errors };
      for (const [field, key] of Object.entries(state.errorKeys ?? {})) issues[field] = t(key, state.errorVars?.[field]);
      return apiRefused({ issues });
    }
    return ok(classCreatedSchema.parse({ classId: state.classId, joinCode: state.joinCode }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes");
  }
}
