import { alumniHomeSchema } from "@edulink/contracts";
import { alumniHome } from "@/lib/alumni";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/alumni/home — a former pupil's home (the alumni module). */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    const home = await alumniHome(ctx);
    return ok(
      alumniHomeSchema.parse({
        ...home,
        leftAt: home.leftAt.toISOString(),
        notes: home.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/home");
  }
}
