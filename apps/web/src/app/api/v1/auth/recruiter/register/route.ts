import { NextResponse } from "next/server";
import { recruiterRegisterSchema, sessionResponseSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { registerRecruiter } from "@/lib/recruiters";
import { createApiSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientAddress } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/auth/recruiter/register — a recruiter's own account from the
 * phone (4 Oct 2026), the web's /register/recruiter: the account and its
 * profile in one transaction, then a bearer session with the RECRUITER role
 * and no school. 422 with the field for a refusal of the form, 429 with
 * Retry-After at the sign-up limit.
 */
export async function POST(request: Request) {
  try {
    const parsed = recruiterRegisterSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const made = await registerRecruiter(parsed.data, await getLocale());
    const t = await getT();
    if (!made.ok) {
      if (made.retryAfterSeconds) {
        return NextResponse.json(
          { error: t(made.errorKey), code: "RATE_LIMITED", retryAfterSeconds: made.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(made.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        { error: t(made.errorKey), code: "BAD_REQUEST", ...(made.field ? { issues: { [made.field]: t(made.errorKey) } } : {}) },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    const session = await createApiSession(made.userId, {
      schoolId: null,
      role: "RECRUITER",
      userAgent: parsed.data.device?.trim() || request.headers.get("user-agent"),
      ip: clientAddress(request.headers),
    });
    await audit({ schoolId: null, actorUserId: made.userId, action: "auth.login", meta: { via: "recruiter-register", role: "RECRUITER", api: true } });
    return ok(
      sessionResponseSchema.parse({
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        sessionId: session.sessionId,
        context: { schoolId: null, role: "RECRUITER" },
      }),
      201,
    );
  } catch (error) {
    return apiFailure(error, "api/v1/auth/recruiter/register");
  }
}
