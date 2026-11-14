/**
 * TA-137 and TA-244 of the testing analysis of 13 November 2026, built as decided on 14 November 2026: the phone's
 * upload door, POST /api/v1/uploads, takes large files itself. Every body used to pass through the framework's copy
 * for the middleware, cut at 10 MB, so a phone video of 10 to 100 MB reached the door cut short and was answered "the
 * file is empty". The door now sits outside the middleware's matcher (every other path keeps the copy, and the global
 * limit is not raised) and does the middleware's jobs itself, with guards.
 *
 * One case for each of those jobs, called on the handler as a request the middleware never saw:
 *   - the matcher leaves out this one path and nothing beside it;
 *   - the sign-in gate judges the door by the door's own stamp, never by a stamp the client sent;
 *   - the browser's pre-check and the allow-origin header;
 *   - the cross-site lock for a request carrying the session cookie;
 *   - the refusal on a school website's host;
 *   - a cap, as it arrives, on a body that states no size;
 *   - at most two uploads per person at a time and a ceiling per server process, each answered "try again shortly";
 *   - the web's hint no longer promises 100 MB.
 *
 * A scratch ZZ school of its own, with five people; the bytes go to a scratch directory. Removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const store = join(tmpdir(), `zz-ta137-door-${Date.now()}`);
  process.env.STORAGE_DIR = store;
  return { store };
});

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { DICTIONARIES } from "@/lib/i18n/dictionary";
import { lookup } from "@/lib/i18n/core";
import { config } from "@/middleware";
import { createSession } from "@/lib/session";
import { MAX_VIDEO_BYTES } from "@/lib/storage";
import { uploadsInFlight } from "@/lib/upload-slots";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import * as door from "@/app/api/v1/uploads/route";
import { GET as meGet } from "@/app/api/v1/me/route";

const db = new PrismaClient();
const STAMP = Date.now();
const URL_ = "http://localhost/api/v1/uploads";
let schoolId = "";
const people: Record<"a" | "b" | "c" | "d" | "driver", string> = { a: "", b: "", c: "", d: "", driver: "" };

// A 1×1 transparent PNG: enough for the sniffer to say "image/png".
const PNG = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));
const BOUNDARY = "zzta137boundary";
const text = (s: string) => new Uint8Array(new TextEncoder().encode(s));
const HEAD = (name: string, type: string) => text(`--${BOUNDARY}\r\ncontent-disposition: form-data; name="file"; filename="${name}"\r\ncontent-type: ${type}\r\n\r\n`);
const TAIL = text(`\r\n--${BOUNDARY}--\r\n`);
const join3 = (a: Uint8Array, b: Uint8Array, c: Uint8Array) => {
  const out = new Uint8Array(a.byteLength + b.byteLength + c.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  out.set(c, a.byteLength + b.byteLength);
  return out;
};
const PNG_BODY = join3(HEAD("zz.png", "image/png"), PNG, TAIL);

/** One PNG as a multipart body whose size is stated, as a phone or a browser sends it. */
function declared(headers: Record<string, string> = {}): Request {
  return new Request(URL_, { method: "POST", body: PNG_BODY, headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}`, "content-length": String(PNG_BODY.byteLength), ...headers } });
}

/**
 * One PNG as a body that states no size and does not end until `release()` is called: an upload in flight. `reading`
 * settles once the handler has begun to read it, which is after the session was resolved.
 */
function held(): { request: Request; reading: Promise<void>; release: () => void } {
  let started: () => void = () => {};
  const reading = new Promise<void>((resolve) => (started = resolve));
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  let step = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        step += 1;
        if (step === 1) {
          controller.enqueue(join3(HEAD("zz-held.png", "image/png"), PNG, new Uint8Array(0)));
          started();
          return;
        }
        await released;
        controller.enqueue(TAIL);
        controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  const request = new Request(URL_, { method: "POST", body, duplex: "half", headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` } } as RequestInit);
  return { request, reading, release };
}

const as = async (who: keyof typeof people, role: "TEACHER" | "DRIVER" = "TEACHER", headers: Record<string, string> = {}) => {
  __resetCookies();
  __setHeaders(headers);
  await createSession(people[who], { schoolId, role });
};

/** A sentence as the dictionary of one language holds it ("" when it holds none). */
const say = (locale: "en" | "hi" | "mr", key: string): string => lookup(DICTIONARIES[locale], key) ?? "";

const stored: string[] = [];
const keep = async (res: Response): Promise<{ status: number; body: { fileId?: string; error?: string; code?: string; retryAfterSeconds?: number; issues?: Record<string, string> } }> => {
  const body = (await res.json().catch(() => ({}))) as { fileId?: string; error?: string; code?: string; retryAfterSeconds?: number; issues?: Record<string, string> };
  if (body.fileId) stored.push(body.fileId);
  return { status: res.status, body };
};

const savedEnv = { cors: process.env.API_CORS_ORIGINS, hosts: process.env.APP_HOSTS };

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA Upload Door ${STAMP}`, slug: `zz-ta137-${STAMP}`, code: `ZT37${String(STAMP).slice(-6)}`, contactEmail: `zz-ta137-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const key of Object.keys(people) as (keyof typeof people)[]) {
    people[key] = (await db.user.create({ data: { name: `ZZ Upload Door ${key}`, email: `zz-ta137-${key}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    await db.membership.create({ data: { userId: people[key], schoolId, role: key === "driver" ? "DRIVER" : "TEACHER", status: "ACTIVE" } });
  }
  process.env.API_CORS_ORIGINS = "http://localhost:8081";
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  if (savedEnv.cors === undefined) delete process.env.API_CORS_ORIGINS;
  else process.env.API_CORS_ORIGINS = savedEnv.cors;
  if (savedEnv.hosts === undefined) delete process.env.APP_HOSTS;
  else process.env.APP_HOSTS = savedEnv.hosts;
  const ids = Object.values(people).filter(Boolean);
  await db.uploadTicket.deleteMany({ where: { userId: { in: ids } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: ids.map((id) => `uploads:${id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
  await rm(ENV.store, { recursive: true, force: true });
});

describe("TA-137 / TA-244: the upload door takes large files itself", () => {
  it("TA-244: the middleware's matcher leaves out the upload door and nothing beside it, and the global limit is not raised", () => {
    const at = (path: string) => unstable_doesMiddlewareMatch({ config, url: `http://localhost:3000${path}` });
    expect(at("/api/v1/uploads")).toBe(false);
    expect(at("/api/v1/uploads?x=1")).toBe(false);
    for (const p of ["/api/v1/uploads/x", "/api/v1/uploads/", "/api/v1/uploadsx", "/api/v1/upload", "/api/v1/uploads.json", "/api/v1/uploads.rsc", "/API/v1/uploads", "/api/v1/%75ploads", "/x/api/v1/uploads", "/api/v1/me", "/api/v1/shared/bulletin", "/api/files/a.mp4", "/api/attendance", "/", "/login", "/bulletin/new"]) {
      expect(at(p), p).toBe(true);
    }
    for (const p of ["/_next/static/chunks/x.js", "/_next/image"]) expect(at(p), p).toBe(false);
    // Every other path keeps the framework's 10 MB copy: the held patch's global setting is not applied.
    const nextConfig = readFileSync(join(__dirname, "..", "next.config.ts"), "utf8");
    expect(nextConfig).not.toMatch(/middlewareClientMaxBodySize\s*:/);
  });

  it("TA-137: the sign-in gate judges the door by the door's own stamp, never by one the client sent", async () => {
    // A driver is a limited role and the door does not name it. With the door outside the middleware nothing
    // overwrites a client's own x-edulink-route, so the stamp of a door a driver may open must not carry them in.
    await as("driver", "DRIVER", { "x-edulink-route": "GET /api/v1/me" });
    const refused = await keep(await door.POST(declared()));
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe("FORBIDDEN");
    expect(await db.uploadTicket.count({ where: { userId: people.driver } })).toBe(0);
    // No stamp at all (the stand-in's neutral one): refused the same.
    await as("driver", "DRIVER");
    expect((await door.POST(declared())).status).toBe(403);
    // The stamp is this door's alone: the same driver, at a door that names them, is still judged by the request's.
    await as("driver", "DRIVER", { "x-edulink-route": "GET /api/v1/me" });
    expect((await meGet()).status).toBe(200);
    // A teacher is let through whatever a client wrote in the header.
    await as("a", "TEACHER", { "x-edulink-route": "GET /hostel" });
    const taken = await keep(await door.POST(declared()));
    expect(taken.status).toBe(201);
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: taken.body.fileId! } })).userId).toBe(people.a);
  });

  it("TA-137: answers the browser's pre-check itself, and names back only a named origin", async () => {
    const options = (door as { OPTIONS?: (request: Request) => Promise<Response> | Response }).OPTIONS;
    expect(typeof options).toBe("function");
    const ask = (origin?: string) => options!(new Request(URL_, { method: "OPTIONS", headers: origin ? { origin, "access-control-request-method": "POST" } : {} }));
    const ok = await ask("http://localhost:8081");
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
    expect(ok.headers.get("access-control-allow-methods")).toContain("POST");
    expect(ok.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(ok.headers.get("vary")).toBe("Origin");
    expect((await ask("https://evil.example")).status).toBe(403);
    expect((await ask()).status).toBe(403);

    await as("a");
    const named = await door.POST(declared({ origin: "http://localhost:8081" }));
    await keep(named.clone());
    expect(named.status).toBe(201);
    expect(named.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
    expect(named.headers.get("vary")).toBe("Origin");
    const stranger = await door.POST(declared({ origin: "https://evil.example" }));
    await keep(stranger.clone());
    expect(stranger.headers.get("access-control-allow-origin")).toBeNull();
    // A refusal carries the header too, or the browser hides the sentence from the app that asked.
    __resetCookies();
    const signedOut = await door.POST(declared({ origin: "http://localhost:8081" }));
    expect(signedOut.status).toBe(401);
    expect(signedOut.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
  });

  it("TA-137: a request carrying the session cookie from another site is refused before anything is stored", async () => {
    await as("b");
    const before = await db.uploadTicket.count({ where: { userId: people.b } });
    const crossSite = await keep(await door.POST(declared({ origin: "https://evil.example", host: "localhost:3000", cookie: "edulink_session=x" })));
    expect(crossSite.status).toBe(403);
    const hostPrefixed = await keep(await door.POST(declared({ origin: "https://evil.example", host: "localhost:3000", cookie: "theme=dark; __Host-edulink_session=x" })));
    expect(hostPrefixed.status).toBe(403);
    expect(await db.uploadTicket.count({ where: { userId: people.b } })).toBe(before);
    // The app's own page, a named origin, and a bearer call (no cookie) pass, as they do at the middleware.
    expect((await keep(await door.POST(declared({ origin: "http://localhost:3000", host: "localhost:3000", cookie: "edulink_session=x" })))).status).toBe(201);
    expect((await keep(await door.POST(declared({ origin: "https://app.zz.example", host: "internal:3000", "x-forwarded-host": "app.zz.example", cookie: "edulink_session=x" })))).status).toBe(201);
    expect((await keep(await door.POST(declared({ origin: "http://localhost:8081", host: "localhost:3000", cookie: "edulink_session=x" })))).status).toBe(201);
    expect((await keep(await door.POST(declared({ origin: "https://evil.example", host: "localhost:3000" })))).status).toBe(201);
  });

  it("TA-137: the door is not there on a school website's host", async () => {
    process.env.APP_HOSTS = "app.zz-ta137.example";
    try {
      await as("b");
      const before = await db.uploadTicket.count({ where: { userId: people.b } });
      const onSite = await keep(await door.POST(declared({ host: "www.zz-ta137-school.example" })));
      expect(onSite.status).toBe(404);
      expect(await db.uploadTicket.count({ where: { userId: people.b } })).toBe(before);
      const options = (door as { OPTIONS?: (request: Request) => Promise<Response> | Response }).OPTIONS;
      expect((await options!(new Request(URL_, { method: "OPTIONS", headers: { origin: "http://localhost:8081", host: "www.zz-ta137-school.example" } }))).status).toBe(404);
      // The app's own host is the door.
      expect((await keep(await door.POST(declared({ host: "app.zz-ta137.example" })))).status).toBe(201);
    } finally {
      if (savedEnv.hosts === undefined) delete process.env.APP_HOSTS;
      else process.env.APP_HOSTS = savedEnv.hosts;
    }
  });

  it("TA-137: a body that states no size is cut off as it arrives, at the largest file the door takes", async () => {
    await as("c");
    const MB = 1024 * 1024;
    const chunk = new Uint8Array(MB);
    const wanted = Math.floor(MAX_VIDEO_BYTES / MB) + 40;
    let sent = 0;
    let cancelled = false;
    // An MP4's first bytes, then megabyte after megabyte with no Content-Length: forty more than a video may be.
    const ftyp = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          if (sent === 0) {
            controller.enqueue(join3(HEAD("zz-long.mp4", "video/mp4"), ftyp, new Uint8Array(0)));
            sent = 1;
            return;
          }
          if (sent > wanted) {
            controller.enqueue(TAIL);
            controller.close();
            return;
          }
          sent += 1;
          controller.enqueue(chunk);
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    const res = await keep(await door.POST(new Request(URL_, { method: "POST", body, duplex: "half", headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` } } as RequestInit)));
    expect(res.status).toBe(413);
    expect(res.body.issues?.file).toContain("too large");
    // Stopped at the cap, give or take what was already on its way: the forty megabytes past it were never read.
    expect(sent).toBeLessThan(Math.floor(MAX_VIDEO_BYTES / MB) + 8);
    expect(cancelled).toBe(true);
    expect(await db.uploadTicket.count({ where: { userId: people.c } })).toBe(0);
    // A small body that states no size still stores.
    const small = held();
    const pending = door.POST(small.request);
    await small.reading;
    small.release();
    expect((await keep(await pending)).status).toBe(201);
    // And a video past the old 10 MB cut, its size stated, is read to its last byte and stored whole. (Called on the
    // handler, as every case here is: the middleware's copy is not in the way of this test either way.)
    const video = new Uint8Array(12 * MB);
    video.set(ftyp, 0);
    const videoBody = join3(HEAD("zz-twelve.mp4", "video/mp4"), video, TAIL);
    const twelve = await keep(await door.POST(new Request(URL_, { method: "POST", body: videoBody, headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}`, "content-length": String(videoBody.byteLength) } })));
    expect(twelve.status).toBe(201);
    const ticket = await db.uploadTicket.findUniqueOrThrow({ where: { fileId: twelve.body.fileId! } });
    expect({ mime: ticket.mime, size: ticket.size }).toEqual({ mime: "video/mp4", size: 12 * MB });
  }, 120_000);

  it("TA-137: at most two uploads per person at a time, and a ceiling per server process, each answered 'try again shortly'", async () => {
    // Two of A's uploads are in flight.
    await as("a");
    const first = held();
    const firstAnswer = door.POST(first.request);
    await first.reading;
    const second = held();
    const secondAnswer = door.POST(second.request);
    await second.reading;
    // A's third is refused at once, in a sentence of its own, and stores nothing.
    const tickets = await db.uploadTicket.count({ where: { userId: people.a } });
    const thirdRaw = await door.POST(declared());
    expect(thirdRaw.headers.get("retry-after")).toBeTruthy();
    const third = await keep(thirdRaw);
    expect(third.status).toBe(429);
    expect(third.body.code).toBe("RATE_LIMITED");
    expect(third.body.error).toBe(say("en", "refusal.uploadStillSending"));
    expect(third.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(await db.uploadTicket.count({ where: { userId: people.a } })).toBe(tickets);
    // Somebody else is not held up by A.
    await as("b");
    expect((await keep(await door.POST(declared()))).status).toBe(201);
    // A third upload of unknown size from another person fills the process: three as large as a video may be.
    await as("c");
    const other = held();
    const otherAnswer = door.POST(other.request);
    await other.reading;
    await as("d");
    const overRaw = await door.POST(declared());
    const over = await keep(overRaw);
    expect(over.status).toBe(429);
    expect(over.body.code).toBe("RATE_LIMITED");
    expect(over.body.error).toBe(say("en", "refusal.uploadsBusy"));
    expect(overRaw.headers.get("retry-after")).toBeTruthy();
    expect(await db.uploadTicket.count({ where: { userId: people.d } })).toBe(0);
    // They end; each stored; and the places are given back, whether the upload was stored or refused.
    first.release();
    second.release();
    other.release();
    for (const answer of [firstAnswer, secondAnswer, otherAnswer]) expect((await keep(await answer)).status).toBe(201);
    await as("d");
    expect((await keep(await door.POST(declared()))).status).toBe(201);
    await as("a");
    const empty = new Request(URL_, { method: "POST", body: text(`--${BOUNDARY}--\r\n`), headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}`, "content-length": "20" } });
    for (let i = 0; i < 3; i += 1) expect((await door.POST(empty.clone())).status).toBe(422);
    expect((await keep(await door.POST(declared()))).status).toBe(201);
    expect(uploadsInFlight()).toEqual({ people: 0, bytes: 0 });
    // Both sentences exist in the three languages, Hindi ending with the danda and Marathi with a full stop.
    for (const key of ["refusal.uploadStillSending", "refusal.uploadsBusy"]) {
      expect(say("en", key)).toMatch(/shortly\.$/);
      expect(say("hi", key)).toMatch(/।$/);
      expect(say("mr", key)).toMatch(/\.$/);
    }
  }, 60_000);

  it("TA-137: the web's hint says what the web can send, and no longer 100 MB", () => {
    const form = readFileSync(join(__dirname, "..", "src", "app", "(app)", "bulletin", "new", "form.tsx"), "utf8");
    expect(form).toMatch(/t\("bulletin\.picturesHintWeb", \{ max: MAX_PICTURES, size: ACTION_BODY_LIMIT_MB \}\)/);
    expect(form).not.toMatch(/t\("bulletin\.picturesHint",/);
    for (const locale of ["en", "hi", "mr"] as const) {
      const hint = say(locale, "bulletin.picturesHintWeb");
      expect(hint, locale).toBeTruthy();
      expect(hint, locale).toContain("{max}");
      expect(hint, locale).toContain("{size}");
      expect(hint, locale).not.toContain("100");
    }
    expect(say("hi", "bulletin.picturesHintWeb")).toMatch(/।$/);
    expect(say("mr", "bulletin.picturesHintWeb")).toMatch(/\.$/);
    // The phone sends through the upload door and keeps the sentence that names a video's 100 MB.
    const phone = readFileSync(join(__dirname, "..", "..", "mobile", "src", "screens", "family", "post-compose.tsx"), "utf8");
    expect(phone).toContain('t("bulletin.picturesHint", { max: MAX_PICTURES })');
    expect(say("en", "bulletin.picturesHint")).toContain("100 MB");
  });
});
