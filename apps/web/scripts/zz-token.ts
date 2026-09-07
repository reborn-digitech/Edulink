/**
 * A bearer token for one ZZ Northgate actor, for the phone's contract tests
 * and for walking the app by hand against a local server.
 *
 *   npm run zz:token -- TEACHER        prints the token, nothing else
 *
 * Sessions carry userAgent "zz-token", expire in an hour, and the API sweep's
 * cleanup does not touch them; delete them with `--purge`.
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

async function main() {
  const role = process.argv[2];
  if (role === "--purge") {
    const gone = await db.session.deleteMany({ where: { userAgent: "zz-token" } });
    process.stderr.write(`purged ${gone.count}\n`);
    return;
  }
  if (!role) throw new Error("usage: zz-token <ADMIN|PRINCIPAL|TEACHER|STUDENT|PARENT|EXPERT> | --purge");
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  let userId: string;
  let schoolId: string | null = school.id;
  if (role === "ADMIN" || role === "PRINCIPAL") {
    userId = (await db.user.findUniqueOrThrow({ where: { email: role === "ADMIN" ? "zz.admin@zz.test" : "zz.principal@zz.test" } })).id;
  } else if (role === "TEACHER" || role === "STUDENT") {
    userId = (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role, status: "ACTIVE", leftAt: null }, select: { userId: true } })).userId;
  } else if (role === "PARENT") {
    userId = (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true } })).parentUserId;
    schoolId = null;
  } else if (role === "EXPERT") {
    userId = (await db.expertProfile.findFirstOrThrow({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } })).userId;
    schoolId = null;
  } else throw new Error(`unknown role ${role}`);
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole: role, userAgent: "zz-token", expiresAt: new Date(Date.now() + 3_600_000) },
  });
  process.stdout.write(token + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
