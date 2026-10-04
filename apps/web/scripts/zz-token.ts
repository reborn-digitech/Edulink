/**
 * A bearer token for one ZZ Northgate actor, for the phone's contract tests
 * and for walking the app by hand against a local server.
 *
 *   npm run zz:token -- TEACHER        prints the token, nothing else
 *   npm run zz:token -- FACULTY        a college role: at ZZ Vidya College (4 Oct 2026)
 *   npm run zz:token -- ALUMNUS zz.alumni02@zz.test   that person in that role
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
  if (!role) throw new Error("usage: zz-token <ADMIN|PRINCIPAL|TEACHER|STUDENT|PARENT|EXPERT|DRIVER|LIBRARIAN|WARDEN|ALUMNUS|FACULTY|HOD|EXAM_CONTROLLER|IQAC|TPO|ACCOUNTS|RECRUITER|OPERATOR|APPADMIN> [email] | --purge");
  // A second argument names the ZZ person: their membership in that role, wherever it is.
  const email = process.argv[3];
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
    data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole, userAgent: "zz-token", expiresAt: new Date(Date.now() + 3_600_000) },
  });
  process.stdout.write(token + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
