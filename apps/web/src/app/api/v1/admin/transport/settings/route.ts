import { transportSettingsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setTransportSettings } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** PUT /api/v1/admin/transport/settings — whether families see the driver's name and telephone. The ADMIN's. */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = transportSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(transportSettingsSchema.parse(await setTransportSettings(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/settings");
  }
}
