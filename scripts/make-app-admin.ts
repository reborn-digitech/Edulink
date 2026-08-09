/**
 * Grants or revokes the app-admin flag — the content team who curate the
 * shared question bank and post platform-wide competitions.
 *
 *   npm run appadmin -- you@example.com          grant
 *   npm run appadmin -- you@example.com --revoke revoke
 *   npm run appadmin -- --list                   who has it
 *
 * A CLI and not a page, for the same reason as make-superuser.ts: the first
 * app admin cannot be appointed by an app admin, and keeping the list editable
 * only from the machine keeps "who can write to every school's question bank"
 * out of reach of any web session. Unlike the superuser script there is no
 * last-one guard — an installation with no app admin still runs; the bank is
 * simply not being curated.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const list = args.includes("--list");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (list) {
    const admins = await db.user.findMany({
      where: { isAppAdmin: true },
      select: { email: true, name: true, disabledAt: true },
      orderBy: { createdAt: "asc" },
    });
    if (admins.length === 0) {
      console.log("\n  Nobody has the app-admin flag.\n");
      console.log("  Grant it with:  npm run appadmin -- you@example.com\n");
      return;
    }
    console.log(`\n  ${admins.length} app admin${admins.length === 1 ? "" : "s"}:\n`);
    for (const a of admins) {
      console.log(`    ${a.email ?? "(no email)"}  ${a.name}${a.disabledAt ? "  [disabled]" : ""}`);
    }
    console.log("");
    return;
  }

  if (!email) {
    console.error("\n  Usage: npm run appadmin -- <email> [--revoke]");
    console.error("         npm run appadmin -- --list\n");
    process.exitCode = 1;
    return;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, isAppAdmin: true },
  });

  if (!user) {
    // Deliberately does NOT create the account — same as make-superuser.ts.
    console.error(`\n  No account with the email ${email}.`);
    console.error("  Register or be invited first, then run this again.\n");
    process.exitCode = 1;
    return;
  }

  const next = !revoke;
  if (user.isAppAdmin === next) {
    console.log(`\n  ${email} already ${next ? "has" : "does not have"} the flag. Nothing to do.\n`);
    return;
  }

  await db.user.update({ where: { id: user.id }, data: { isAppAdmin: next } });

  await db.auditLog.create({
    data: {
      schoolId: null,
      actorUserId: null,
      action: next ? "appadmin.grant" : "appadmin.revoke",
      targetType: "User",
      targetId: user.id,
      meta: JSON.stringify({ email, via: "cli" }),
    },
  });

  console.log(`\n  ${next ? "Granted" : "Revoked"} app admin for ${user.name} <${email}>.`);
  console.log(next ? "  They can now open /appadmin.\n" : "  /appadmin is closed to them.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
