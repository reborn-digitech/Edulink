/**
 * Gives every existing unclaimed pupil their stand-in guardian.
 *
 *   npm run guardians:backfill            do it
 *   npm run guardians:backfill -- --dry   say what would happen, change nothing
 *
 * The hooks in the join, invite and claim flows keep NEW pupils in sync; this
 * walks the roll that existed before the feature did. Idempotent — the
 * reconciler it calls computes the right state from scratch, so running it
 * twice is a slower way of running it once.
 *
 * Run through with-admin-db (the npm script does), because it reads every
 * school's roll: the reconciler binds each pupil's own school for its class
 * lookups, and under the admin connection those binds are inert rather than
 * wrong.
 */
import { PrismaClient } from "@prisma/client";
import { syncStandinGuardian } from "@/lib/standin-guardian";

const db = new PrismaClient();

async function main() {
  const dry = process.argv.includes("--dry");

  const pupils = await db.membership.findMany({
    where: { role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true, schoolId: true, userId: true },
    orderBy: { joinedAt: "asc" },
  });

  const operator = await db.user.findFirst({
    where: { isSuperuser: true },
    select: { id: true },
  });

  console.log(`\n  ${pupils.length} active pupil(s) on the roll.\n`);

  const tally: Record<string, number> = {};
  for (const pupil of pupils) {
    if (dry) {
      const family = await db.guardianship.findFirst({
        where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" } },
        select: { id: true },
      });
      const standin = await db.guardianship.findFirst({
        where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: "SCHOOL" },
        select: { id: true },
      });
      const action = family ? (standin ? "would release" : "kept-family") : standin ? "has-standin" : "would grant";
      tally[action] = (tally[action] ?? 0) + 1;
      continue;
    }

    // The operator (or, failing that, the pupil themself) is the audited
    // actor: a backfill is an operator action even when a script runs it.
    const result = await syncStandinGuardian({
      schoolId: pupil.schoolId,
      studentMembershipId: pupil.id,
      actorUserId: operator?.id ?? pupil.userId,
    });
    tally[result.outcome] = (tally[result.outcome] ?? 0) + 1;
  }

  for (const [action, count] of Object.entries(tally).sort()) {
    console.log(`    ${action.padEnd(14)} ${count}`);
  }
  console.log(dry ? "\n  Dry run — nothing changed.\n" : "\n  Done.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
