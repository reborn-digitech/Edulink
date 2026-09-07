/**
 * Grants or revokes the superuser flag.
 *
 *   npm run superuser -- you@example.com          grant
 *   npm run superuser -- you@example.com --revoke revoke
 *   npm run superuser -- --list                   who has it
 *
 * A CLI AND NOT A PAGE, because of a circle that has no other exit: the first
 * superuser cannot be invited by a superuser. Somebody with shell access to the
 * server has to say so once, and shell access is exactly the qualification the
 * flag describes. Every subsequent one can be granted from here too — there is
 * deliberately no UI for it, so the list of people who can create schools can
 * only be changed by somebody who can already reach the machine.
 *
 * Runs through `with-admin-db.mjs` like the other operational scripts, so it
 * connects as the database owner rather than the app role. The app role could
 * not do this: User carries no policy, but making that writable from a page is
 * precisely what this script exists to avoid.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const list = args.includes("--list");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (list) {
    const supers = await db.user.findMany({
      where: { isSuperuser: true },
      select: { email: true, name: true, disabledAt: true },
      orderBy: { createdAt: "asc" },
    });
    if (supers.length === 0) {
      console.log("\n  Nobody has the superuser flag.\n");
      console.log("  Grant it with:  npm run superuser -- you@example.com\n");
      return;
    }
    console.log(`\n  ${supers.length} superuser${supers.length === 1 ? "" : "s"}:\n`);
    for (const s of supers) {
      console.log(`    ${s.email ?? "(no email)"}  ${s.name}${s.disabledAt ? "  [disabled]" : ""}`);
    }
    console.log("");
    return;
  }

  if (!email) {
    console.error("\n  Usage: npm run superuser -- <email> [--revoke]");
    console.error("         npm run superuser -- --list\n");
    process.exitCode = 1;
    return;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, isSuperuser: true },
  });

  if (!user) {
    // Deliberately does NOT create the account. A superuser is a person who
    // already has a login; minting one here would mean this script could also
    // set a password, which is a different and much larger power.
    console.error(`\n  No account with the email ${email}.`);
    console.error("  Register or be invited first, then run this again.\n");
    process.exitCode = 1;
    return;
  }

  const next = !revoke;
  if (user.isSuperuser === next) {
    console.log(`\n  ${email} already ${next ? "has" : "does not have"} the flag. Nothing to do.\n`);
    return;
  }

  if (revoke) {
    const others = await db.user.count({ where: { isSuperuser: true, id: { not: user.id } } });
    if (others === 0) {
      // The same shape as the last-admin guard on a school, one level up: an
      // installation with no superuser can only be fixed from a database client.
      console.error("\n  That is the only superuser on this server.");
      console.error("  Grant the flag to somebody else first.\n");
      process.exitCode = 1;
      return;
    }
  }

  await db.user.update({ where: { id: user.id }, data: { isSuperuser: next } });

  await db.auditLog.create({
    data: {
      // No school: an operator's actions belong to the operator. See
      // NULL_SCHOOL_WRITABLE in scripts/gen-rls.ts.
      schoolId: null,
      actorUserId: null,
      action: next ? "superuser.grant" : "superuser.revoke",
      targetType: "User",
      targetId: user.id,
      meta: JSON.stringify({ email, via: "cli" }),
    },
  });

  console.log(`\n  ${next ? "Granted" : "Revoked"} superuser for ${user.name} <${email}>.`);
  console.log(next ? "  They can now open /root.\n" : "  /root is closed to them.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
