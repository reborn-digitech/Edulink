/**
 * THE PHONE'S LANGUAGE REACHES THE SERVER (A3-states-16, audit of 5 October
 * 2026). The phone keeps its language in the app and sends it on every call;
 * the server answered in the account's `prefs.locale`, so a Marathi phone read
 * English paths, metric sentences and refusals. A bearer request is now
 * answered in the language the phone sends (`X-Language`, else the
 * `Accept-Language` the api-client writes), while the same person's web
 * requests (the session cookie) stay on their account's choice and a
 * browser's header is never read.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/constants";
import { __resetCookies, __setCookie, __setHeaders, cookies } from "./stubs/next-headers";
import { getLocale, getT } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/dictionary";
import { GET as journeyGet } from "@/app/api/v1/practice/journey/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let userId = "";
let token = "";

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ Phone Lang ${STAMP}`, slug: `zz-phonelang-${STAMP}`, code: `ZL${String(STAMP).slice(-6)}`, contactEmail: `zz-phonelang-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  // The account's own choice is English.
  userId = (await db.user.create({ data: { name: "ZZ Phone Lang Teacher", email: `zz-phonelang-teacher-${STAMP}@test.invalid`, prefs: JSON.stringify({ locale: "en" }) }, select: { id: true } })).id;
  await db.membership.create({ data: { userId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: "TEACHER" });
  // The token itself, as the phone holds it (createSession answers the row's id and sets the cookie).
  token = (await cookies()).get(SESSION_COOKIE)!.value;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

function asPhone(language: Record<string, string>) {
  __resetCookies();
  __setHeaders({ authorization: `Bearer ${token}`, ...language });
}
function asWeb(language: Record<string, string>) {
  __resetCookies();
  __setCookie(SESSION_COOKIE, token);
  __setHeaders(language);
}

describe("the phone's language on a bearer request (A3-states-16)", () => {
  it("answers in Marathi when the phone sends mr, and the same person's web request stays in English", async () => {
    asPhone({ "accept-language": "mr" });
    expect(await getLocale()).toBe("mr");
    asPhone({ "x-language": "hi", "accept-language": "mr" });
    expect(await getLocale()).toBe("hi");
    asWeb({ "accept-language": "mr", "x-language": "mr" });
    expect(await getLocale()).toBe("en");
  });

  it("ignores anything but the three codes, falling back to the account", async () => {
    asPhone({ "accept-language": "fr-FR,fr;q=0.9" });
    expect(await getLocale()).toBe("en");
    asPhone({ "accept-language": "mr-IN" });
    expect(await getLocale()).toBe("mr");
  });

  it("a server-built sentence comes back in the phone's language: a door's refusal", async () => {
    const mr = translator("mr")("access.wrongRoleForThisAction");
    const en = translator("en")("access.wrongRoleForThisAction");
    expect(mr).not.toBe(en);
    asPhone({ "accept-language": "mr" });
    const phone = await journeyGet();
    expect(phone.status).toBe(403);
    expect((await phone.json()).error).toBe(mr);
    expect((await getT())("access.wrongRoleForThisAction")).toBe(mr);
    asWeb({ "accept-language": "mr" });
    const web = await journeyGet();
    expect((await web.json()).error).toBe(en);
  });
});
