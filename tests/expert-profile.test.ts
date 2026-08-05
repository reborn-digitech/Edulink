import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { getOwnProfile, updateOwnProfile,
  type ProfileInput,
} from "@/lib/experts";
import type { ActiveContext } from "@/lib/session";

/**
 * An expert's own profile.
 *
 * WHY THIS FILE EXISTS AT ALL is worth writing down. `/expert/profile` was in
 * the expert's side rail and in their ⌘K palette for as long as experts have
 * existed, and it was a 404 in both — the app's own navigation pointing at
 * nothing. Nothing caught it: the unit suites tested functions that existed, and
 * the route sweep visits URLs somebody thought to list. A link that goes nowhere
 * is invisible to both.
 *
 * The two claims below are the ones that matter. The first is that an expert can
 * edit their own words at all. The second is the one an implementation is likely
 * to get wrong on a tired afternoon: that they CANNOT edit their standing.
 * `publishedAt` decides whether any school can find this person and `verifiedAt`
 * says a human has checked who they are — an editor that let their subject set
 * either would make curation decorative.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

const EXPERT_EMAIL = "profile.unit@expert.test";

let expert: ActiveContext;
let profileId: string;
let outsider: ActiveContext;

const BASE: ProfileInput = {
  headline: "Careers adviser",
  bio: "Fifteen years in engineering.",
  organisation: "Somewhere Ltd",
  specialisms: ["Careers", "Engineering"],
  timezone: "Asia/Kolkata",
  offering: "BOTH",
  mentorCapacity: 3,
};

beforeAll(async () => {
  // Made, not borrowed. Editing a shared expert's headline would change what
  // `mentoring` and `experts` read while they are running alongside this file.
  const user =
    (await db.user.findUnique({ where: { email: EXPERT_EMAIL } })) ??
    (await db.user.create({
      data: { email: EXPERT_EMAIL, name: "Profile Expert", prefs: "{}" },
    }));

  const profile =
    (await db.expertProfile.findUnique({ where: { userId: user.id } })) ??
    (await db.expertProfile.create({
      data: { userId: user.id, headline: "Before", publishedAt: null },
    }));
  profileId = profile.id;

  expert = ctx({ userId: user.id, role: "EXPERT" });

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const membership = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  outsider = ctx({
    userId: priya.id,
    membershipId: membership.id,
    schoolId: riverside.id,
    role: "ADMIN",
  });
});

beforeEach(async () => {
  await db.expertProfile.update({
    where: { id: profileId },
    data: {
      headline: "Before",
      bio: "",
      organisation: null,
      specialisms: "[]",
      timezone: "UTC",
      publishedAt: null,
      verifiedAt: null,
    },
  });
});

afterAll(async () => {
  await db.expertProfile.deleteMany({ where: { id: profileId } });
  await db.user.deleteMany({ where: { email: EXPERT_EMAIL } });
  await db.$disconnect();
});

describe("reading it", () => {
  it("returns what the expert wrote, and their standing", async () => {
    await updateOwnProfile(expert, BASE);
    const profile = await getOwnProfile(expert);

    expect(profile.headline).toBe("Careers adviser");
    expect(profile.organisation).toBe("Somewhere Ltd");
    expect(profile.specialisms).toEqual(["Careers", "Engineering"]);
    expect(profile.timezone).toBe("Asia/Kolkata");
    expect(profile.published).toBe(false);
    expect(profile.verified).toBe(false);
  });

  it("⚠ refuses anybody who is not an expert", async () => {
    // A school admin holds no expert profile, and asking for "your profile" as
    // one must not fall through to somebody else's.
    await expect(getOwnProfile(outsider)).rejects.toBeInstanceOf(AccessError);
    await expect(updateOwnProfile(outsider, BASE)).rejects.toBeInstanceOf(AccessError);
  });

  /**
   * ⚠ THE SAME PERSON, IN A DIFFERENT ROLE.
   *
   * The test above passes with the role check deleted — mutation testing said
   * so — because a school admin has no ExpertProfile row and the lookup fails a
   * line later with the same error class. It proves the function refuses that
   * person, not that it refuses them FOR THE RIGHT REASON, and those are
   * indistinguishable until somebody holds both.
   *
   * Somebody genuinely can: an expert who also teaches. Acting as a teacher
   * they are inside a school and under its policy, and "edit my public
   * marketplace profile" is not a thing that happens from in there.
   */
  it("⚠ refuses the expert themselves while they are acting as a teacher", async () => {
    const asTeacher = ctx({ userId: expert.user.id, role: "TEACHER", schoolId: null });
    await expect(getOwnProfile(asTeacher)).rejects.toBeInstanceOf(AccessError);
    await expect(updateOwnProfile(asTeacher, BASE)).rejects.toBeInstanceOf(AccessError);

    // And nothing was written on the way to being refused.
    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.headline).toBe("Before");
  });
});

describe("editing it", () => {
  it("⚠ cannot publish or verify itself", async () => {
    // THE ONE THAT MATTERS. Published decides whether any school sees this
    // person; verified says a human checked who they are. Both belong to
    // whoever runs the server, and `updateOwnProfile` has no parameter for
    // either — this asserts the effect rather than the signature, because a
    // future edit could add one without changing the type this test imports.
    await db.expertProfile.update({
      where: { id: profileId },
      data: { publishedAt: null, verifiedAt: null },
    });

    await updateOwnProfile(expert, {
      ...BASE,
      // Field names an over-helpful form might send through.
      ...({ publishedAt: new Date(), verifiedAt: new Date(), published: true } as object),
    });

    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt).toBeNull();
    expect(row.verifiedAt).toBeNull();
  });

  it("⚠ keeps a published profile published", async () => {
    // The mirror of the test above: an expert correcting a typo must not fall
    // off the marketplace because the edit path rewrote a field it never set.
    const listedAt = new Date("2026-01-01T00:00:00Z");
    await db.expertProfile.update({
      where: { id: profileId },
      data: { publishedAt: listedAt },
    });

    await updateOwnProfile(expert, { ...BASE, headline: "Careers adviser, corrected" });

    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt?.toISOString()).toBe(listedAt.toISOString());
  });

  it("refuses a headline too short to say anything", async () => {
    await expect(updateOwnProfile(expert, { ...BASE, headline: "  a " })).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("⚠ drops blank and duplicate specialisms rather than storing them", async () => {
    // Schools browse by exact value. Three blanks and a case-duplicate are what
    // an unbounded tag input produces on the first mis-tap, and they land on a
    // page other people read.
    await updateOwnProfile(expert, {
      ...BASE,
      specialisms: ["Careers", "  ", "careers", "", "Dyslexia support"],
    });
    const profile = await getOwnProfile(expert);
    expect(profile.specialisms).toEqual(["Careers", "Dyslexia support"]);
  });

  it("⚠ caps the list instead of accepting any number of them", async () => {
    await updateOwnProfile(expert, {
      ...BASE,
      specialisms: Array.from({ length: 40 }, (_, i) => `Specialism ${i}`),
    });
    const profile = await getOwnProfile(expert);
    expect(profile.specialisms).toHaveLength(12);
  });

  it("⚠ refuses a timezone this server cannot resolve", async () => {
    // Silently correcting it to UTC would put a slot at an hour the expert did
    // not mean, and they would find out when nobody turned up.
    await expect(
      updateOwnProfile(expert, { ...BASE, timezone: "Mars/Olympus_Mons" }),
    ).rejects.toBeInstanceOf(AccessError);

    const profile = await getOwnProfile(expert);
    expect(profile.timezone).toBe("UTC");
  });

  it("treats an empty organisation as absent rather than as an empty string", async () => {
    await updateOwnProfile(expert, { ...BASE, organisation: "   " });
    expect((await getOwnProfile(expert)).organisation).toBeNull();
  });

  it("⚠ audits the edit against no school", async () => {
    // An expert belongs to no school. A schoolId on this row would drop the
    // edit into whichever school happened to be in context at the time.
    await updateOwnProfile(expert, BASE);
    const entry = await db.auditLog.findFirst({
      where: { action: "expert.profile.update", targetId: profileId },
      orderBy: { createdAt: "desc" },
    });
    expect(entry).not.toBeNull();
    expect(entry!.schoolId).toBeNull();
    expect(entry!.actorUserId).toBe(expert.user.id);
  });
});
