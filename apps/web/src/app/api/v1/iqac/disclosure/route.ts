import { disclosureSchema, disclosureSetSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { disclosureState, setDisclosure } from "@/lib/iqac-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/disclosure — Whether the AICTE mandatory disclosure is published, and where. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(disclosureSchema.parse(await disclosureState(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/disclosure");
  }
}

/** POST /api/v1/iqac/disclosure — Publish a fresh snapshot of the disclosure, or take it down. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = disclosureSetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(disclosureSchema.parse(await setDisclosure(ctx, b.publish)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/disclosure");
  }
}
