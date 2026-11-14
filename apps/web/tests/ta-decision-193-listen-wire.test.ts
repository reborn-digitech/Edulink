import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TLSSocket, createSecureContext } from "node:tls";
import { listen, type ListenLink } from "@/lib/pg-listen";

/**
 * TA-193: the listening connection's password exchanges and TLS, which the database the suite runs on does not ask
 * for (a local Postgres trusts its own machine and has TLS off, so tests/ta-decision-193-shared-bus.test.ts, which
 * listens on the real one, exercises neither).
 *
 * A STAND-IN, and it says so: the server here is a few dozen lines written for this file that speak the server's
 * side of the Postgres protocol as its documentation gives it (start-up, the three password methods, LISTEN, NOTIFY
 * and the notification), not a Postgres. It holds the connection's framing and the order of its messages; the
 * arithmetic of SCRAM is held separately against RFC 7677's worked example in the other file. A managed Postgres
 * with TLS and SCRAM, which production is, has not been listened on: that stays under "Untested".
 *
 * The URLs below name this stand-in on a port of this machine that the test itself opened. No database is touched.
 */

type Auth = "scram" | "md5" | "clear";
type StandIn = {
  server: Server;
  port: number;
  notify: (channel: string, payload: string) => void;
  connections: () => number;
  /** How many password messages the stand-in has been sent, over all its connections. */
  passwords: () => number;
  /** While on, nothing the stand-in sends arrives, though no connection is closed: a path gone dead. */
  mute: (on: boolean) => void;
  close: () => Promise<void>;
};

const USER = "zz_ta193";
const PASSWORD = "zz pässword/193";

const cstr = (text: string) => Buffer.concat([Buffer.from(text, "utf8"), Buffer.from([0])]);
const msg = (type: string, body: Buffer) => {
  const head = Buffer.alloc(5);
  head.write(type, 0, 1, "latin1");
  head.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([head, body]);
};
const int32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n, 0);
  return b;
};
const authMsg = (code: number, rest: Buffer = Buffer.alloc(0)) => msg("R", Buffer.concat([int32(code), rest]));
const errorMsg = (code: string, text: string) => msg("E", Buffer.concat([cstr("SFATAL"), cstr(`C${code}`), cstr(`M${text}`), Buffer.from([0])]));

/** The server's side, for one password method, with or without TLS, optionally never delivering (as a pooler does). */
async function standIn(options: { auth: Auth; tls?: { key: Buffer; cert: Buffer }; deaf?: boolean }): Promise<StandIn> {
  const open = new Set<{ socket: Socket; channels: Set<string> }>();
  let muted = false;
  let passwords = 0;
  const send = (socket: Socket, data: Buffer) => {
    if (!muted && !socket.destroyed) socket.write(data);
  };
  const notification = (channel: string, payload: string) => msg("A", Buffer.concat([int32(4242), cstr(channel), cstr(payload)]));

  const serve = (socket: Socket) => {
    const state = { socket, channels: new Set<string>() };
    open.add(state);
    socket.on("close", () => open.delete(state));
    socket.on("error", () => {});
    let buffered = Buffer.alloc(0);
    let started = false;
    let salt = Buffer.alloc(0);
    let scram: { clientBare: string; serverFirst: string; nonce: string; salt: Buffer } | null = null;
    const ready = () => {
      send(socket, authMsg(0));
      send(socket, msg("S", Buffer.concat([cstr("server_version"), cstr("16.0 (stand-in)")])));
      send(socket, msg("K", Buffer.concat([int32(4242), int32(1)])));
      send(socket, msg("Z", Buffer.from("I")));
    };
    const refuse = () => {
      send(socket, errorMsg("28P01", `password authentication failed for user "${USER}"`));
      socket.end();
    };
    socket.on("data", (chunk: Buffer) => {
      buffered = Buffer.concat([buffered, chunk]);
      for (;;) {
        if (!started) {
          if (buffered.length < 4) return;
          const length = buffered.readInt32BE(0);
          if (buffered.length < length) return;
          const body = buffered.subarray(4, length);
          buffered = buffered.subarray(length);
          started = true;
          const fields = body.subarray(4).toString("utf8").split("\0");
          if (fields[fields.indexOf("user") + 1] !== USER) return refuse();
          if (options.auth === "clear") send(socket, authMsg(3));
          if (options.auth === "md5") {
            salt = randomBytes(4);
            send(socket, authMsg(5, salt));
          }
          if (options.auth === "scram") send(socket, authMsg(10, Buffer.concat([cstr("SCRAM-SHA-256"), Buffer.from([0])])));
          continue;
        }
        if (buffered.length < 5) return;
        const length = buffered.readInt32BE(1);
        if (buffered.length < length + 1) return;
        const type = String.fromCharCode(buffered[0]!);
        if (type === "p") passwords++;
        const body = buffered.subarray(5, length + 1);
        buffered = buffered.subarray(length + 1);
        if (type === "p" && options.auth === "clear") {
          if (body.toString("utf8", 0, body.length - 1) === PASSWORD) ready();
          else refuse();
        } else if (type === "p" && options.auth === "md5") {
          const md5 = (data: Buffer | string) => createHash("md5").update(data).digest("hex");
          const expected = `md5${md5(Buffer.concat([Buffer.from(md5(PASSWORD + USER), "latin1"), salt]))}`;
          if (body.toString("utf8", 0, body.length - 1) === expected) ready();
          else refuse();
        } else if (type === "p" && options.auth === "scram" && !scram) {
          // SASLInitialResponse: the mechanism, the response's length, the response.
          const nameEnd = body.indexOf(0);
          if (body.toString("utf8", 0, nameEnd) !== "SCRAM-SHA-256") return refuse();
          const size = body.readInt32BE(nameEnd + 1);
          const first = body.toString("utf8", nameEnd + 5, nameEnd + 5 + size);
          if (!first.startsWith("n,,") || size !== body.length - nameEnd - 5) return refuse();
          const clientBare = first.slice(3);
          const nonce = `${clientBare.split(",r=")[1]}${randomBytes(12).toString("base64")}`;
          const s = randomBytes(16);
          const serverFirst = `r=${nonce},s=${s.toString("base64")},i=4096`;
          scram = { clientBare, serverFirst, nonce, salt: s };
          send(socket, authMsg(11, Buffer.from(serverFirst, "utf8")));
        } else if (type === "p" && options.auth === "scram" && scram) {
          const final = body.toString("utf8");
          const withoutProof = final.slice(0, final.lastIndexOf(",p="));
          const proof = Buffer.from(final.slice(final.lastIndexOf(",p=") + 3), "base64");
          const hmac = (key: Buffer, text: string) => createHmac("sha256", key).update(text, "utf8").digest();
          const salted = pbkdf2Sync(Buffer.from(PASSWORD, "utf8"), scram.salt, 4096, 32, "sha256");
          const storedKey = createHash("sha256").update(hmac(salted, "Client Key")).digest();
          const authMessage = `${scram.clientBare},${scram.serverFirst},${withoutProof}`;
          const signature = hmac(storedKey, authMessage);
          const clientKey = Buffer.alloc(proof.length);
          for (let i = 0; i < proof.length; i++) clientKey[i] = proof[i]! ^ signature[i]!;
          if (withoutProof !== `c=biws,r=${scram.nonce}` || !createHash("sha256").update(clientKey).digest().equals(storedKey)) return refuse();
          send(socket, authMsg(12, Buffer.from(`v=${hmac(hmac(salted, "Server Key"), authMessage).toString("base64")}`, "utf8")));
          ready();
        } else if (type === "Q") {
          const text = body.toString("utf8", 0, body.length - 1);
          for (const statement of text.split(";").map((part) => part.trim())) {
            const [verb, name] = statement.split(" ");
            if (verb === "LISTEN" && name) {
              state.channels.add(name);
              send(socket, msg("C", cstr("LISTEN")));
            }
            if (verb === "NOTIFY" && name) {
              send(socket, msg("C", cstr("NOTIFY")));
              if (!options.deaf && state.channels.has(name)) send(socket, notification(name, ""));
            }
          }
          send(socket, msg("Z", Buffer.from("I")));
        }
      }
    });
  };

  const server = createServer((plain) => {
    plain.on("error", () => {});
    // The first eight bytes may be an SSLRequest: answered with one letter, before anything else.
    plain.once("data", (first: Buffer) => {
      const asksTls = first.length === 8 && first.readInt32BE(4) === 80877103;
      if (!asksTls) {
        serve(plain);
        plain.emit("data", first);
        return;
      }
      if (!options.tls) {
        plain.write("N");
        serve(plain);
        return;
      }
      plain.write("S");
      const secure = new TLSSocket(plain, { isServer: true, secureContext: createSecureContext({ key: options.tls.key, cert: options.tls.cert }) });
      serve(secure);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    server,
    port,
    notify: (channel, payload) => {
      for (const one of open) if (one.channels.has(channel)) send(one.socket, notification(channel, payload));
    },
    connections: () => open.size,
    passwords: () => passwords,
    mute: (on) => {
      muted = on;
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const one of open) one.socket.destroy();
        server.close(() => resolve());
      }),
  };
}

const waitFor = async (check: () => boolean, ms: number) => {
  for (let waited = 0; waited < ms && !check(); waited += 20) await new Promise((resolve) => setTimeout(resolve, 20));
  return check();
};

let certDir = "";
let pair: { key: Buffer; cert: Buffer };
const made: StandIn[] = [];
const links: ListenLink[] = [];

beforeAll(() => {
  certDir = mkdtempSync(join(tmpdir(), "zz-ta193-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(certDir, "key.pem"), "-out", join(certDir, "cert.pem"), "-days", "1", "-subj", "/CN=127.0.0.1"], { stdio: "ignore" });
  pair = { key: readFileSync(join(certDir, "key.pem")), cert: readFileSync(join(certDir, "cert.pem")) };
});

afterEach(async () => {
  for (const link of links.splice(0)) link.close();
  for (const one of made.splice(0)) await one.close();
});

afterAll(() => {
  rmSync(certDir, { recursive: true, force: true });
});

/** Opens the listening connection on a stand-in and records what its caller is told. */
async function open(server: StandIn, query: string, password = PASSWORD, timings?: { connectMs?: number; heartbeatMs?: number; heartbeatWaitMs?: number }) {
  made.push(server);
  const told: string[] = [];
  const heard: string[] = [];
  // The stand-in's own address on this machine (see the header): no database is named.
  const url = `postgresql://${USER}:${encodeURIComponent(password)}@127.0.0.1:${server.port}/zz_standin${query}`;
  const link = listen({ url: () => url, channel: "zz_events", onNotify: (payload) => heard.push(payload), onUp: () => told.push("up"), onDown: (reason) => told.push(`down: ${reason}`), retryMinMs: 50, retryMaxMs: 100, timings });
  links.push(link);
  return { told, heard };
}

describe("TA-193: the listening connection's password and TLS, against a stand-in server", () => {
  it("TA-193: SCRAM-SHA-256 over TLS, as a managed Postgres asks: the link comes up and hears a notification", async () => {
    const server = await standIn({ auth: "scram", tls: pair });
    const { told, heard } = await open(server, "?sslmode=require&connection_limit=15");
    expect(await waitFor(() => told.includes("up"), 5_000)).toBe(true);
    server.notify("zz_events", '{"o":"another","i":"1","c":["class:x"],"e":{"type":"remark.message","threadId":"t"}}');
    server.notify("zz_other", "not ours");
    expect(await waitFor(() => heard.length > 0, 2_000)).toBe(true);
    expect(heard).toEqual(['{"o":"another","i":"1","c":["class:x"],"e":{"type":"remark.message","threadId":"t"}}']);
    expect(told).toEqual(["up"]);
    expect(server.connections()).toBe(1);
  });

  it("TA-193: a wrong password is a link that is down, with the server's code and no password in what is said, and it is tried again", async () => {
    const server = await standIn({ auth: "scram" });
    const { told } = await open(server, "?sslmode=disable", "not the password");
    expect(await waitFor(() => told.length > 0, 5_000)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Told once, however many times it is tried.
    expect(told).toHaveLength(1);
    expect(told[0]).toMatch(/^down: 28P01: /);
    expect(told[0]).not.toContain("not the password");
  });

  it("TA-193: the older password methods, MD5 and clear text, are answered when a server asks for them", async () => {
    for (const auth of ["md5", "clear"] as const) {
      const server = await standIn({ auth });
      const { told, heard } = await open(server, "");
      expect(await waitFor(() => told.includes("up"), 5_000)).toBe(true);
      server.notify("zz_events", auth);
      expect(await waitFor(() => heard.includes(auth), 2_000)).toBe(true);
      expect(told).toEqual(["up"]);
    }
  });

  it("TA-193: a URL that requires TLS does not go on in the clear, and one that asks for the certificate to be checked refuses one nobody signed", async () => {
    const plain = await standIn({ auth: "clear" });
    const first = await open(plain, "?sslmode=require");
    expect(await waitFor(() => first.told.length > 0, 5_000)).toBe(true);
    expect(first.told[0]).toBe("down: the server does not offer TLS and the URL requires it");

    const selfSigned = await standIn({ auth: "clear", tls: pair });
    const second = await open(selfSigned, "?sslmode=require&sslaccept=strict");
    expect(await waitFor(() => second.told.length > 0, 5_000)).toBe(true);
    expect(second.told[0]).toMatch(/^down: /);
    expect(second.told).not.toContain("up");
    // Tried again several times by now, and no password was sent to either.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(plain.passwords() + selfSigned.passwords()).toBe(0);
  });

  it("TA-193: a connection that is accepted and then delivers nothing, as through a transaction pooler, never counts as up", async () => {
    const server = await standIn({ auth: "clear", deaf: true });
    const { told } = await open(server, "?sslmode=disable", PASSWORD, { connectMs: 600, heartbeatWaitMs: 200 });
    expect(await waitFor(() => told.length > 0, 5_000)).toBe(true);
    expect(told[0]).toBe("down: the heartbeat was not heard");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(told).not.toContain("up");
  });

  it("TA-193: a link that falls silent after it was up is noticed by the heartbeat, said once, and opened again", async () => {
    const server = await standIn({ auth: "clear" });
    const { told } = await open(server, "?sslmode=disable", PASSWORD, { heartbeatMs: 100, heartbeatWaitMs: 150 });
    expect(await waitFor(() => told.includes("up"), 5_000)).toBe(true);
    // The path goes dead without closing: what the server sends no longer arrives.
    server.mute(true);
    expect(await waitFor(() => told.some((line) => line === "down: the heartbeat was not heard"), 3_000)).toBe(true);
    server.mute(false);
    expect(await waitFor(() => told.filter((line) => line === "up").length === 2, 3_000)).toBe(true);
    expect(told).toEqual(["up", "down: the heartbeat was not heard", "up"]);
  });
});
