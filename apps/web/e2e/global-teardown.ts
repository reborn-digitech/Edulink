import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { removeHarnessExam } from "./harness-exam";

/**
 * After the run (QA-73): the sessions global-setup.ts minted (userAgent "e2e") and the harness's exam at ZZ Northgate
 * are removed, so nothing the harness made for itself stays on a fixture person's pages. Scoped to ZZ Northgate's id.
 */
export default async function globalTeardown() {
  config({ path: ".env" });
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
  try {
    const school = await db.school.findUnique({ where: { slug: "zz-northgate-school" }, select: { id: true } });
    if (school) await removeHarnessExam(db, school.id);
    await db.session.deleteMany({ where: { userAgent: "e2e" } });
    // The platform features global-setup.ts switched on for the run go back off: exactly those, none the operator had on.
    const list = join(__dirname, ".features.json");
    if (existsSync(list)) {
      const switched = JSON.parse(readFileSync(list, "utf8")) as string[];
      if (switched.length) await db.platformFeature.updateMany({ where: { code: { in: switched } }, data: { enabled: false } });
      unlinkSync(list);
    }
  } finally {
    await db.$disconnect();
  }
}
