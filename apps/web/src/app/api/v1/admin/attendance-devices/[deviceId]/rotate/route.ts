import { deviceKeyIssuedSchema, deviceRotateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { rotateDeviceKey } from "@/lib/attendance-devices";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ deviceId: string }> };

/** POST /api/v1/admin/attendance-devices/{deviceId}/rotate — A new key, shown once; the old stops at once. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const p = await params;
    const parsed = deviceRotateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(deviceKeyIssuedSchema.parse(await rotateDeviceKey(ctx, p.deviceId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices/[deviceId]/rotate");
  }
}
