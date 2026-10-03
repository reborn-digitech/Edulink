import type { PrismaClient } from "@prisma/client";
import { openAlumnus } from "../src/lib/alumni-membership";

/**
 * ZZ Northgate's alumni (the alumni module, 3 Oct 2026), for the sweeps and a
 * walk by hand. zz.alumni01 (a minor who left grade 10 in April 2026, made by
 * buildModuleRoles) has a room with the grade-10 class's teacher — her former
 * teacher — with a message each way, and two posts on the school's feed that
 * the office approved, carrying the "Alumni · 2026" tag. zz.alumni02 is an
 * ADULT alumnus who left in 2018, listed in the directory (an adult's own
 * opt-in; a minor cannot) and marked a mentor by the office. The school's
 * alumni feed setting is left at its default (read and comment).
 *
 * Re-run safe: the room is found by its pair key, the posts by their titles,
 * the people and their rows by their keys.
 */
const DOMAIN = "zz.test";
const POSTS = [
  { title: "ZZ Alumni: two years at junior college", body: "Northgate taught me to ask questions. Junior college is busy, and the science labs are as good as I hoped." },
  { title: "ZZ Alumni: thank you to the grade 10 team", body: "Thank you to every teacher who stayed late before the board exams. It made the difference." },
];

export async function buildAlumni(db: PrismaClient, school: { id: string }): Promise<{ room: boolean; posts: number; listed: boolean } | null> {
  const schoolId = school.id;
  const [alumnus, admin, grade10] = await Promise.all([
    db.membership.findFirst({ where: { schoolId, role: "ALUMNUS", user: { email: `zz.alumni01@${DOMAIN}` } }, select: { id: true, userId: true } }),
    db.membership.findFirst({ where: { schoolId, role: "ADMIN", status: "ACTIVE", user: { email: `zz.admin@${DOMAIN}` } }, select: { id: true, userId: true } }),
    db.class.findFirst({ where: { schoolId, gradeLevel: "10", archivedAt: null }, select: { id: true } }),
  ]);
  if (!alumnus || !admin || !grade10) return null;

  // Her former teacher: the grade-10 class's own (ClassTeacher), whom alumni.ts lists first.
  const lead = await db.classTeacher.findFirst({ where: { classId: grade10.id }, select: { teacher: { select: { userId: true } } } });
  let room = false;
  if (lead) {
    const teacherUserId = lead.teacher.userId;
    const pairKey = `${schoolId}:${[alumnus.userId, teacherUserId].sort().join(":")}`;
    const existing = await db.conversation.findUnique({ where: { pairKey }, select: { id: true } });
    if (!existing) {
      const sent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const replied = new Date(sent.getTime() + 3 * 60 * 60 * 1000);
      await db.conversation.create({
        data: {
          schoolId,
          pairKey,
          createdById: alumnus.userId,
          lastMessageAt: replied,
          participants: { create: [{ schoolId, userId: alumnus.userId, lastReadAt: replied }, { schoolId, userId: teacherUserId, lastReadAt: replied }] },
          messages: {
            create: [
              { schoolId, authorUserId: alumnus.userId, body: "ZZ Namaste! Could you write me a short reference for the junior college science club?", createdAt: sent },
              { schoolId, authorUserId: teacherUserId, body: "ZZ Of course, Kavya. I will send it to the office by Friday.", createdAt: replied },
            ],
          },
        },
      });
    }
    room = true;
  }

  // Two posts on the feed, approved by the office, from her ALUMNUS membership (the tag reads the year she left).
  for (const post of POSTS) {
    const found = await db.post.findFirst({ where: { schoolId, authorUserId: alumnus.userId, title: post.title }, select: { id: true } });
    if (found) continue;
    await db.post.create({
      data: {
        schoolId,
        authorUserId: alumnus.userId,
        authorMembershipId: alumnus.id,
        scope: "SCHOOL",
        category: "PEOPLE",
        title: post.title,
        body: post.body,
        tags: "[]",
        media: "[]",
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByMembershipId: admin.id,
      },
    });
  }

  // An adult alumnus in the directory, of their own choosing, and a mentor by the office's.
  const adult = await db.user.upsert({
    where: { email: `zz.alumni02@${DOMAIN}` },
    update: { isTestFixture: true },
    create: { email: `zz.alumni02@${DOMAIN}`, name: "ZZ Rahul Kulkarni", isTestFixture: true, isMinor: false, birthdate: new Date("2000-08-21T00:00:00Z"), emailVerifiedAt: new Date(), prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }) },
    select: { id: true },
  });
  const leftAt = new Date("2018-04-30T06:30:00Z");
  const pupil = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: adult.id, schoolId, role: "STUDENT" } }, select: { id: true } });
  if (!pupil) await db.membership.create({ data: { userId: adult.id, schoolId, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2008-06-15T04:00:00Z"), leftAt, gradeLevel: "10" } });
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], adult.id, schoolId, leftAt);
  const row = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: adult.id, schoolId, role: "ALUMNUS" } }, select: { id: true } });
  const profile = { listed: true, city: "Bengaluru", occupation: "ZZ Software engineer", contactPref: "OFFICE", mentor: true, mentorByUserId: admin.userId };
  await db.alumniProfile.upsert({
    where: { membershipId: row.id },
    create: { schoolId, membershipId: row.id, userId: adult.id, listedAt: new Date(), mentorAt: new Date(), ...profile },
    update: { ...profile, mutedAt: null, mutedByUserId: null, muteReason: null },
  });
  // zz.alumni01 stays un-listed and unmuted: the sweep's alumnus starts each run the same.
  await db.alumniProfile.deleteMany({ where: { membershipId: alumnus.id } });
  return { room, posts: POSTS.length, listed: true };
}
