/**
 * TA-604 (testing analysis of 13 November 2026): the web's preferences form sends back the whole draft it was drawn
 * with, locale included, and saveUserPrefs merged it over the row, so a tab left open put back the language changed
 * since on the phone or another tab; and the two writers of User.prefs each read and wrote the JSON whole with no
 * lock, so two at once could lose a field. The language is now never merged by the form (it has its own writer), and
 * both writers merge under the row's lock.
 *
 * One ZZ account of this file's own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import type { ActiveContext } from "@/lib/session";
import { saveUserPrefs, setUserLocale } from "@/lib/account";
import { savePrefs } from "@/app/account/actions";
import { __resetCookies } from "./stubs/next-headers";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
let userId = "";
const ctx = (): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: userId, name: "ZZ PCP", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const prefsOf = async () => JSON.parse((await db.user.findUniqueOrThrow({ where: { id: userId }, select: { prefs: true } })).prefs ?? "{}") as Record<string, unknown>;
const DRAWN = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: true, email: true, sms: true, whatsapp: true }, quietHours: null };

beforeAll(async () => {
  userId = (await db.user.create({ data: { name: `ZZ PCP ${STAMP}`, email: `zz-pcp-${STAMP}@test.invalid`, isTestFixture: true, prefs: JSON.stringify(DRAWN) }, select: { id: true } })).id;
});

afterEach(() => __resetCookies());

afterAll(async () => {
  await db.session.deleteMany({ where: { userId } });
  await db.auditLog.deleteMany({ where: { actorUserId: userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("TA-604: the language and the preferences form", () => {
  it("TA-604: a tab drawn in English saving its draft after the language became Marathi keeps Marathi, and saves the rest", async () => {
    await createSession(userId, { schoolId: null, role: null });
    // The page was drawn in English; then the phone (POST /api/v1/account/locale) switched the account to Marathi.
    await setUserLocale(userId, "mr");
    const answer = await savePrefs({ ...DRAWN, contrast: "high", channels: { ...DRAWN.channels, email: false } });
    expect(answer).toEqual({ ok: true, errors: {} });
    const prefs = await prefsOf();
    expect(prefs.locale).toBe("mr");
    expect(prefs.contrast).toBe("high");
    expect((prefs.channels as { email: boolean }).email).toBe(false);
  });

  it("TA-604: saveUserPrefs never writes the language, whoever calls it", async () => {
    await setUserLocale(userId, "hi");
    expect(await saveUserPrefs(ctx(), { locale: "en", font: "dyslexic" })).toEqual({ ok: true });
    expect(await prefsOf()).toMatchObject({ locale: "hi", font: "dyslexic" });
  });

  it("TA-604: the language switch and a preferences save at the same moment each keep their field, twenty times over", async () => {
    for (let round = 0; round < 20; round++) {
      await db.user.update({ where: { id: userId }, data: { prefs: JSON.stringify(DRAWN) } });
      await Promise.all([setUserLocale(userId, "hi"), saveUserPrefs(ctx(), { contrast: "high" })]);
      expect(await prefsOf(), `round ${round}`).toMatchObject({ locale: "hi", contrast: "high" });
    }
  });
});
