import { createHash } from "node:crypto";
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
    // The sessions this run's global-setup.ts minted, by the tokens it wrote to .sessions.json (TA-465): a run beside
    // this one keeps its own. Expired ones go too, whoever minted them.
    const sessionsFile = join(__dirname, ".sessions.json");
    const tokens = existsSync(sessionsFile)
      ? Object.values(JSON.parse(readFileSync(sessionsFile, "utf8")) as Record<string, { cookie?: string }>).flatMap((actor) => /edulink_session=([^;\s]+)/.exec(actor.cookie ?? "")?.[1] ?? [])
      : [];
    const hashes = tokens.map((token) => createHash("sha256").update(token).digest("hex"));
    await db.session.deleteMany({ where: { userAgent: "e2e", OR: [{ tokenHash: { in: hashes } }, { expiresAt: { lt: new Date() } }] } });
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
