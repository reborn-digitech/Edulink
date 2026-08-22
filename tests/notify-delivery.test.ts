import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:https";
import { createECDH, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { notify } from "@/lib/notify";

/**
 * Quiet hours, proven at the point of DELIVERY rather than in the arithmetic.
 *
 * `notify.test.ts` (in src/lib) pins `inQuietHours` down to the minute,
 * including the midnight wrap. What it cannot see is whether `notify()` actually
 * consults that answer before pushing — the suppression, the urgent bypass and
 * the always-written in-app row were all only reasoned about.
 *
 * So this file stands up a real HTTP endpoint in the test process and registers
 * it as the user's push subscription. web-push then encrypts against the
 * subscription's real P-256 key and POSTs to it exactly as it would to a
 * browser's push service — a request arriving (or not) IS the delivery, not a
 * proxy for it. The quiet window is computed around the real clock, because
 * `notify()` reads the real clock; faking time here would fake the very thing
 * under test.
 */

const db = new PrismaClient();

const EMAIL = "zz.quiet.delivery@notify.test";
let userId: string;
let server: Server;
let endpoint: string;
let hits: number;
let certDir: string;
let tlsEnvBefore: string | undefined;

/** HH:MM local time, `offsetMinutes` from now, wrapped to the day. */
function at(offsetMinutes: number): string {
  const now = new Date();
  const total = (now.getHours() * 60 + now.getMinutes() + offsetMinutes + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function setPrefs(prefs: object) {
  await db.user.update({ where: { id: userId }, data: { prefs: JSON.stringify(prefs) } });
}

async function send(urgent?: boolean) {
  const before = hits;
  await notify({
    userId,
    kind: "SYSTEM",
    title: "ZZ quiet-hours delivery test",
    urgent,
  });
  return hits - before;
}

beforeAll(async () => {
  // web-push opens TLS no matter what scheme the endpoint claims, so the fake
  // push service must speak HTTPS — a throwaway self-signed cert, and
  // verification off for this worker only, restored on the way out.
  certDir = mkdtempSync(join(tmpdir(), "zz-push-"));
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", join(certDir, "key.pem"),
    "-out", join(certDir, "cert.pem"),
    "-days", "1", "-subj", "/CN=127.0.0.1",
  ]);
  tlsEnvBefore = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  hits = 0;
  server = createServer(
    { key: readFileSync(join(certDir, "key.pem")), cert: readFileSync(join(certDir, "cert.pem")) },
    (req, res) => {
      hits += 1;
      res.statusCode = 201;
      res.end();
    },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  endpoint = `https://127.0.0.1:${address.port}/zz-push`;

  const user = await db.user.create({
    data: { email: EMAIL, name: "ZZ Quiet Delivery", prefs: "{}" },
  });
  userId = user.id;

  // A real P-256 keypair: web-push encrypts the payload against `p256dh` before
  // it will even open a connection, so junk keys would fail before the HTTP
  // request this suite exists to observe.
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  await db.pushSubscription.create({
    data: {
      userId,
      endpoint,
      p256dh: ecdh.getPublicKey("base64url"),
      auth: randomBytes(16).toString("base64url"),
      userAgent: "zz-quiet-delivery-test",
    },
  });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } }); // cascades the subscription
  await db.$disconnect();
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
  if (tlsEnvBefore === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  else process.env.NODE_TLS_REJECT_UNAUTHORIZED = tlsEnvBefore;
  rmSync(certDir, { recursive: true, force: true });
});

describe("⚠ quiet hours silence the interruption, never the record", () => {
  it("pushes when the clock is outside the window", async () => {
    await setPrefs({ channels: { push: true }, quietHours: { start: at(60), end: at(120) } });
    expect(await send()).toBe(1);
  });

  it("⚠ does NOT push inside the window — but the in-app row is still written", async () => {
    await setPrefs({ channels: { push: true }, quietHours: { start: at(-60), end: at(60) } });
    const rowsBefore = await db.notification.count({ where: { userId } });
    expect(await send()).toBe(0);
    const rowsAfter = await db.notification.count({ where: { userId } });
    expect(rowsAfter).toBe(rowsBefore + 1);
  });

  it("⚠ urgent breaks through the same window", async () => {
    await setPrefs({ channels: { push: true }, quietHours: { start: at(-60), end: at(60) } });
    expect(await send(true)).toBe(1);
  });

  it("push switched off beats everything — even urgent, even outside the window", async () => {
    await setPrefs({ channels: { push: false }, quietHours: null });
    expect(await send()).toBe(0);
    expect(await send(true)).toBe(0);
  });
});

/**
 * ⚠ THE WORDS ARE CHOSEN BY THE RECIPIENT'S LANGUAGE, AT WRITE TIME. A title or
 * body passed as a key is resolved against the user's saved locale before the
 * row exists — the same event writes Hindi for a Hindi reader and English for
 * an English one, and the stored row is what the reader later sees.
 */
describe("⚠ keys resolve into the recipient's language when the row is written", () => {
  async function latest() {
    return db.notification.findFirstOrThrow({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { title: true, body: true },
    });
  }

  it("writes Hindi for a Hindi reader — title and body, with the variables in", async () => {
    await setPrefs({ locale: "hi", channels: { push: false } });
    await notify({
      userId,
      kind: "SYSTEM",
      titleKey: "notifTitle.markedLate",
      titleVars: { name: "ZZ Asha" },
      bodyKey: "notifBody.attendanceTap",
      bodyVars: { date: "Monday 3 March" },
    });
    const row = await latest();
    expect(row.title).toBe("ZZ Asha को देर से आया दर्ज किया गया");
    expect(row.body).toContain("Monday 3 March");
    expect(row.body).toContain("टैप करें");
  });

  it("writes English for an English reader from the same call", async () => {
    await setPrefs({ locale: "en", channels: { push: false } });
    await notify({
      userId,
      kind: "SYSTEM",
      titleKey: "notifTitle.markedLate",
      titleVars: { name: "ZZ Asha" },
      bodyKey: "notifBody.attendanceTap",
      bodyVars: { date: "Monday 3 March" },
    });
    const row = await latest();
    expect(row.title).toBe("ZZ Asha was marked late");
    expect(row.body).toBe("Monday 3 March. Tap to see the details or message the teacher.");
  });

  it("a literal body is stored as data, untranslated", async () => {
    await setPrefs({ locale: "hi", channels: { push: false } });
    await notify({ userId, kind: "SYSTEM", titleKey: "notifTitle.newWorkSet", body: "ZZ Chapter 4 questions" });
    const row = await latest();
    expect(row.title).toBe("नया काम दिया गया");
    expect(row.body).toBe("ZZ Chapter 4 questions");
  });
});
