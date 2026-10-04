/**
 * A bearer token for one ZZ Northgate actor, for the phone's contract tests
 * and for walking the app by hand against a local server.
 *
 *   npm run zz:token -- TEACHER        prints the token, nothing else
 *   npm run zz:token -- FACULTY        a college role: at ZZ Vidya College (4 Oct 2026)
 *   npm run zz:token -- ALUMNUS zz.alumni02@zz.test   that person in that role
 *
 * Sessions carry userAgent "zz-token", expire in an hour, and the API sweep's
 * cleanup does not touch them.
 *
 * PURGE ONLY WHAT YOU MINTED (SWEEPS-6, 4 Oct 2026). `--purge` used to delete
 * every zz-token session — another agent's too, while it was using it. Now
 * each mint records its token's hash in apps/web/.zz-token/<tag>.hashes
 * (gitignored), and the purge deletes those sessions alone and empties the
 * file; the tag is `--tag=<name>` (or ZZ_TOKEN_TAG), "default" otherwise, so
 * two callers who each name a tag never purge each other's. Or name the
 * tokens themselves — exact across any number of separate invocations:
 *
 *   npm run zz:token -- --tag=walk TEACHER       mint, recorded under "walk"
 *   npm run zz:token -- --purge --tag=walk       delete the sessions minted under "walk"
 *   npm run zz:token -- --purge <token> [...]     delete exactly these tokens' sessions
 *   npm run zz:token -- --purge --all            the old behaviour: every zz-token session
 */
import { createHash, randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

const HASH_DIR = join(__dirname, "..", ".zz-token");
const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const words = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const tag = (flags.find((a) => a.startsWith("--tag="))?.slice(6) ?? process.env.ZZ_TOKEN_TAG ?? "default").replace(/[^\w.-]/g, "_") || "default";
const hashFile = join(HASH_DIR, `${tag}.hashes`);
const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");

async function purge() {
  if (flags.includes("--all")) {
    const gone = await db.session.deleteMany({ where: { userAgent: "zz-token" } });
    process.stderr.write(`purged ${gone.count} (every zz-token session)\n`);
    return;
  }
  // Tokens named on the line: exactly those. Otherwise the hashes this tag recorded.
  let hashes = words.map(hashOf);
  const fromFile = hashes.length === 0;
  if (fromFile) {
    try {
      hashes = readFileSync(hashFile, "utf8").split("\n").filter((h) => /^[0-9a-f]{64}$/.test(h));
    } catch {
      hashes = [];
    }
  }
  const gone = hashes.length ? await db.session.deleteMany({ where: { userAgent: "zz-token", tokenHash: { in: hashes } } }) : { count: 0 };
  if (fromFile) writeFileSync(hashFile, "");
  process.stderr.write(`purged ${gone.count} (${fromFile ? `minted under tag "${tag}"` : `${hashes.length} token(s) named`}; --all for every zz-token session)\n`);
}

async function main() {
  if (flags.includes("--purge")) return purge();
  const role = words[0];
  if (!role) throw new Error("usage: zz-token [--tag=<name>] <ADMIN|PRINCIPAL|TEACHER|STUDENT|PARENT|EXPERT|DRIVER|LIBRARIAN|WARDEN|ALUMNUS|FACULTY|HOD|EXAM_CONTROLLER|IQAC|TPO|ACCOUNTS|RECRUITER|OPERATOR|APPADMIN> [email] | --purge [--tag=<name> | <token>… | --all]");
  // A second argument names the ZZ person: their membership in that role, wherever it is.
  const email = words[1];
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  let userId: string;
  let schoolId: string | null = school.id;
  const COLLEGE_ROLES = ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];
  if (email && role !== "PARENT" && role !== "EXPERT" && role !== "RECRUITER" && role !== "OPERATOR" && role !== "APPADMIN") {
    if (!email.endsWith("@zz.test") && !email.endsWith("@demo.relay.test")) throw new Error("only ZZ and demo people");
    const member = await db.membership.findFirstOrThrow({ where: { role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true, schoolId: true } });
    userId = member.userId;
    schoolId = member.schoolId;
  } else if (COLLEGE_ROLES.includes(role)) {
    // The college's six staff roles (4 Oct 2026) are memberships at ZZ Vidya College (zz-fixtures.ts buildColleges).
    const college = await db.school.findUniqueOrThrow({ where: { slug: "zz-vidya-college" } });
    userId = (await db.membership.findFirstOrThrow({ where: { schoolId: college.id, role, status: "ACTIVE", leftAt: null }, select: { userId: true }, orderBy: { joinedAt: "asc" } })).userId;
    schoolId = college.id;
  } else if (role === "RECRUITER") {
    // An outside account, like the expert: no school (4 Oct 2026).
    userId = (await db.recruiterProfile.findFirstOrThrow({ where: { user: { email: email ?? "zz.recruiter01@zz.test" } }, select: { userId: true } })).userId;
    schoolId = null;
  } else if (role === "ADMIN" || role === "PRINCIPAL") {
    userId = (await db.user.findUniqueOrThrow({ where: { email: role === "ADMIN" ? "zz.admin@zz.test" : "zz.principal@zz.test" } })).id;
  } else if (role === "TEACHER" || role === "STUDENT" || role === "DRIVER" || role === "LIBRARIAN" || role === "WARDEN" || role === "ALUMNUS") {
    // The module roles (3 Oct 2026) are Northgate memberships like a teacher's: zz.driver01, zz.librarian, zz.warden, zz.alumni01 (zz-fixtures.ts buildModuleRoles).
    userId = (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role, status: "ACTIVE", leftAt: null }, select: { userId: true } })).userId;
  } else if (role === "PARENT") {
    userId = (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true } })).parentUserId;
    schoolId = null;
  } else if (role === "EXPERT") {
    userId = (await db.expertProfile.findFirstOrThrow({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } })).userId;
    schoolId = null;
  } else if (role === "OPERATOR" || role === "APPADMIN") {
    // The server operator and the content team: the ZZ fixture's flagged
    // accounts, with no school and no role — the way they really sign in.
    userId = (await db.user.findUniqueOrThrow({ where: { email: role === "OPERATOR" ? "zz.operator@zz.test" : "zz.appadmin@zz.test" }, select: { id: true } })).id;
    schoolId = null;
  } else throw new Error(`unknown role ${role}`);
  const activeRole = role === "OPERATOR" || role === "APPADMIN" ? null : role;
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: { userId, tokenHash: hashOf(token), activeSchoolId: schoolId, activeRole, userAgent: "zz-token", expiresAt: new Date(Date.now() + 3_600_000) },
  });
  // Recorded for this tag's purge (never the token itself: a hash opens nothing).
  mkdirSync(HASH_DIR, { recursive: true });
  appendFileSync(hashFile, hashOf(token) + "\n");
  process.stdout.write(token + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
