import { deviceUpdateSchema, deviceViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { updateDevice } from "@/lib/attendance-devices";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ deviceId: string }> };

/** POST /api/v1/admin/attendance-devices/{deviceId} — The office renames, moves, rescopes, disables or re-enables a device. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const p = await params;
    const parsed = deviceUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(deviceViewSchema.parse(await updateDevice(ctx, p.deviceId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices/[deviceId]");
  }
}
