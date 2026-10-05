import { deviceKeyIssuedSchema, deviceSaveSchema, devicesViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { devicesView, registerDevice } from "@/lib/attendance-devices";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/admin/attendance-devices — The devices, the badges, the last punches. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    return ok(devicesViewSchema.parse(await devicesView(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices");
  }
}

/** POST /api/v1/admin/attendance-devices — The office registers a device; its key is in this answer only. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = deviceSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(deviceKeyIssuedSchema.parse(await registerDevice(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices");
  }
}
