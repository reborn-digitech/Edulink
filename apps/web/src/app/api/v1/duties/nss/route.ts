import { corpsDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { corpsDesk } from "@/lib/corps";

/** GET /api/v1/duties/nss — the NSS officer's desk: the unit's students, its activities and hours this year. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(corpsDeskSchema.parse(await corpsDesk(ctx, "NSS")));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/nss");
  }
}
