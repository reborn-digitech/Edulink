/**
 * Invites an expert as the person who runs the server.
 *
 *   npm run expert:invite -- --email a@b.test --name "Dr Rao"
 *   npm run expert:invite -- --school <schoolId>      # on a school's behalf
 *
 * WHY A SCRIPT AND NOT A PAGE. Inviting an expert without naming a school is a
 * platform action, and `ROLES` has no actor above a school to put it behind — a
 * super-admin web role would be a much bigger decision than this feature, and it
 * would need read access to every school to be worth having. Running this needs
 * shell and database credentials, which is an authorisation the app already
 * relies on for `db:reset` and the file sweep.
 *
 * Runs on the ADMIN connection deliberately: a row with a null schoolId is
 * invisible to every tenant policy and could not be written through the app
 * role at all. That is the correct shape — the invitation belongs to nobody's
 * school until an expert accepts it and a school books them.
 *
 * PRINTS THE TOKEN ONCE. Only its SHA-256 is stored, so a lost link cannot be
 * recovered and has to be reissued. Same rule as every other invitation here.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";
import { config } from "dotenv";

config();

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });
const TTL_DAYS = 14;

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const email = arg("email") ?? null;
  const name = arg("name") ?? null;
  const schoolId = arg("school") ?? null;

  if (schoolId) {
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
    if (!school) {
      console.error(`No school with id ${schoolId}. Nothing was written.`);
      process.exit(1);
    }
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86_400_000);

  await db.expertInvite.create({
    data: {
      schoolId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      email,
      name,
      expiresAt,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log(`\nExpert invitation created${schoolId ? ` for school ${schoolId}` : " by the app owner"}.`);
  console.log(`  for        ${name ?? "(unnamed)"} ${email ? `<${email}>` : ""}`);
  console.log(`  expires    ${expiresAt.toISOString()}`);
  console.log(`\n  ${base}/expert/invite/${token}\n`);
  console.log("That link is shown once. Only its hash is stored.\n");

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
