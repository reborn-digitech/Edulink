import "server-only";
import type * as NodeNet from "node:net";
import type * as NodeTls from "node:tls";
import type * as NodeCrypto from "node:crypto";

/**
 * One listening connection to Postgres (TA-193, 14 November 2026).
 *
 * WHY THIS IS HERE AND NOT A PACKAGE. The live bus (realtime.ts) crosses servers through the database's own
 * LISTEN/NOTIFY. Sending is an ordinary statement and rides Prisma's pool; hearing needs a connection that stays
 * open and is handed the server's NotificationResponse messages, which Prisma's pooled engine never shows the
 * application. So each web server keeps ONE connection of its own, opened here. It speaks the small part of the
 * Postgres protocol (version 3) that takes: the start-up, the password (SCRAM-SHA-256, MD5 or clear text, as the
 * server asks), `LISTEN`, and the notifications. As s3.ts signs its own requests, the image gains no dependency.
 *
 * WHAT IT DOES NOT DO. No row is ever read or written on this connection, no tenant is set on it, and the only
 * statements it sends are `LISTEN` and a `NOTIFY` to its own private channel (the heartbeat below). It must reach
 * Postgres DIRECTLY: through a transaction pooler `LISTEN` is accepted and then nothing is ever delivered, which the
 * heartbeat notices (the link is reported down and tried again) and REALTIME_LISTEN_URL is the cure for.
 *
 * THE HEARTBEAT. Every half minute the connection notifies its own private channel and waits to hear it. A link
 * that carries nothing back in ten seconds (a half-open socket, a proxy that dropped it silently, a pooler) is
 * closed and opened again; the caller is told it went down, and realtime.ts ends the streams that leaned on it.
 *
 * node:net, node:tls and node:crypto are fetched at call time, not imported, as env.ts fetches node:crypto: Next
 * compiles instrumentation.ts for the edge runtime as well and webpack refuses a `node:` scheme on whatever that
 * file's imports reach. Nothing on that path imports the bus today; this keeps it harmless if something one day does.
 */

const net = () => process.getBuiltinModule("node:net") as typeof NodeNet;
const tls = () => process.getBuiltinModule("node:tls") as typeof NodeTls;
const crypto = () => process.getBuiltinModule("node:crypto") as typeof NodeCrypto;

/**
 * A timer that never holds the process open. Asked for loosely: with the DOM's types beside Node's, a timer is a
 * number to the compiler in one place and Node's Timeout in another.
 */
export function unref(timer: unknown): void {
  (timer as { unref?: () => void } | null)?.unref?.();
}

export type ListenTarget = {
  host: string;
  port: number;
  /** A Unix socket's path when the URL names a socket directory (`?host=/var/run/postgresql`). */
  socketPath: string | null;
  user: string;
  password: string;
  database: string;
  /** Prisma's reading of `sslmode`: off for `disable`, required for `require` and the verifying modes, tried otherwise. */
  tls: "off" | "try" | "must";
  /** The certificate is checked only when the URL asks (`sslaccept=strict`, or a verifying `sslmode`), as Prisma does. */
  verify: boolean;
};

/** What a Prisma or libpq connection URL names, for this connection. Throws on a string that is not such a URL. */
export function listenTarget(url: string): ListenTarget {
  const parsed = new URL(url.trim());
  if (!/^postgres(ql)?:$/i.test(parsed.protocol)) throw new Error("not a postgres URL");
  const user = decodeURIComponent(parsed.username);
  if (!user) throw new Error("the URL names no user");
  const port = parsed.port ? Number(parsed.port) : 5432;
  const socketDir = parsed.searchParams.get("host");
  const sslmode = (parsed.searchParams.get("sslmode") ?? "prefer").toLowerCase();
  const verifying = sslmode === "verify-ca" || sslmode === "verify-full";
  return {
    host: parsed.hostname.replace(/^\[|\]$/g, "") || "localhost",
    port,
    socketPath: socketDir && socketDir.startsWith("/") ? `${socketDir}/.s.PGSQL.${port}` : null,
    user,
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || user,
    tls: sslmode === "disable" ? "off" : sslmode === "require" || verifying ? "must" : "try",
    verify: verifying || (parsed.searchParams.get("sslaccept") ?? "").toLowerCase() === "strict",
  };
}

/* ------------------------------------------------------------------------- */
/* The wire                                                                  */
/* ------------------------------------------------------------------------- */

/** A front-end message: its type letter, then its length (counting itself), then its body. */
function message(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(5);
  head.write(type, 0, 1, "latin1");
  head.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([head, body]);
}

const cstring = (text: string): Buffer => Buffer.concat([Buffer.from(text, "utf8"), Buffer.from([0])]);

function startupMessage(target: ListenTarget): Buffer {
  const body = Buffer.concat([
    // Protocol 3.0.
    Buffer.from([0, 3, 0, 0]),
    cstring("user"),
    cstring(target.user),
    cstring("database"),
    cstring(target.database),
    cstring("application_name"),
    cstring("edulink-realtime"),
    cstring("client_encoding"),
    cstring("UTF8"),
    Buffer.from([0]),
  ]);
  const head = Buffer.alloc(4);
  head.writeInt32BE(body.length + 4, 0);
  return Buffer.concat([head, body]);
}

/** SSLRequest: eight bytes, the second four the code 80877103. The server answers one byte, S or N. */
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f]);

/** A channel name this module makes itself: lower-case letters, digits and underscores, so it needs no quoting rules. */
const safeName = (name: string): boolean => /^[a-z_][a-z0-9_]{0,62}$/.test(name);

/** The fields of an ErrorResponse the log may carry: the SQLSTATE and the server's sentence, never a statement. */
function errorText(body: Buffer): string {
  let code = "";
  let text = "";
  let at = 0;
  while (at < body.length && body[at] !== 0) {
    const field = String.fromCharCode(body[at]!);
    const end = body.indexOf(0, at + 1);
    if (end < 0) break;
    const value = body.toString("utf8", at + 1, end);
    if (field === "C") code = value;
    if (field === "M") text = value;
    at = end + 1;
  }
  return `${code || "error"}: ${text || "the server refused"}`;
}

/* ------------------------------------------------------------------------- */
/* SCRAM-SHA-256 (RFC 5802, RFC 7677), without channel binding                */
/* ------------------------------------------------------------------------- */

type Scram = { bare: string; nonce: string; serverSignature: Buffer | null };

// RFC 5802's two key labels: protocol constants, not sentences anybody reads.
const CLIENT_KEY_LABEL = "Client Key";
const SERVER_KEY_LABEL = "Server Key";
/** More rounds than any server asks for would hold the process's one thread for seconds: refused. */
const SCRAM_ROUNDS_MAX = 1_000_000;

function scramFirst(): { scram: Scram; message: Buffer } {
  const nonce = crypto().randomBytes(18).toString("base64");
  // The user is the start-up message's; the server ignores the name given here.
  const bare = `n=*,r=${nonce}`;
  const response = Buffer.from(`n,,${bare}`, "utf8");
  const length = Buffer.alloc(4);
  length.writeInt32BE(response.length, 0);
  return { scram: { bare, nonce, serverSignature: null }, message: message("p", Buffer.concat([cstring("SCRAM-SHA-256"), length, response])) };
}

function scramFinal(scram: Scram, password: string, serverFirst: string): Buffer {
  const fields = new Map(serverFirst.split(",").map((part) => [part.slice(0, 1), part.slice(2)] as const));
  const nonce = fields.get("r") ?? "";
  const salt = fields.get("s") ?? "";
  const rounds = Number(fields.get("i"));
  // The server's nonce must begin with ours: anything else is not an answer to this exchange.
  if (!nonce.startsWith(scram.nonce) || nonce.length <= scram.nonce.length || !salt || !Number.isInteger(rounds) || rounds < 1 || rounds > SCRAM_ROUNDS_MAX) throw new Error("the server's SCRAM message cannot be read");
  const c = crypto();
  const hmac = (key: Buffer, text: string) => c.createHmac("sha256", key).update(text, "utf8").digest();
  const salted = c.pbkdf2Sync(Buffer.from(password, "utf8"), Buffer.from(salt, "base64"), rounds, 32, "sha256");
  const clientKey = hmac(salted, CLIENT_KEY_LABEL);
  const storedKey = c.createHash("sha256").update(clientKey).digest();
  const withoutProof = `c=biws,r=${nonce}`;
  const authMessage = `${scram.bare},${serverFirst},${withoutProof}`;
  const signature = hmac(storedKey, authMessage);
  const proof = Buffer.alloc(clientKey.length);
  for (let i = 0; i < proof.length; i++) proof[i] = clientKey[i]! ^ signature[i]!;
  scram.serverSignature = hmac(hmac(salted, SERVER_KEY_LABEL), authMessage);
  return message("p", Buffer.from(`${withoutProof},p=${proof.toString("base64")}`, "utf8"));
}

/** The server proves it knows the password too: a final message whose signature is not ours ends the connection. */
function scramVerify(scram: Scram, serverFinal: string): void {
  const given = serverFinal.split(",").find((part) => part.startsWith("v="))?.slice(2) ?? "";
  const expected = scram.serverSignature;
  const got = Buffer.from(given, "base64");
  if (!expected || got.length !== expected.length || !crypto().timingSafeEqual(got, expected)) throw new Error("the server's SCRAM signature does not match");
}

/** For the suite: the two SCRAM steps, held there against the worked example of RFC 7677. */
export const __scram = { final: scramFinal, verify: scramVerify };

function md5Password(target: ListenTarget, salt: Buffer): Buffer {
  const md5 = (data: Buffer | string) => crypto().createHash("md5").update(data).digest("hex");
  const inner = md5(target.password + target.user);
  return message("p", cstring(`md5${md5(Buffer.concat([Buffer.from(inner, "latin1"), salt]))}`));
}

/* ------------------------------------------------------------------------- */
/* One connection                                                            */
/* ------------------------------------------------------------------------- */

type Connection = { close: () => void };

type ConnectionEvents = {
  /** `LISTEN` is in force and the connection has heard its own first heartbeat. */
  onReady: () => void;
  onNotify: (payload: string) => void;
  /** Once, however the connection ended. */
  onClosed: (reason: string) => void;
};

export type ListenTimings = { connectMs: number; heartbeatMs: number; heartbeatWaitMs: number };
const TIMINGS: ListenTimings = { connectMs: 10_000, heartbeatMs: 30_000, heartbeatWaitMs: 10_000 };

function connect(target: ListenTarget, channelName: string, events: ConnectionEvents, timings: ListenTimings): Connection {
  if (!safeName(channelName)) throw new Error("the channel's name is not a plain identifier");
  // This connection's own channel, for the heartbeat: nobody else listens on it.
  const ownChannel = `${channelName}_hb_${crypto().randomBytes(8).toString("hex")}`;
  let socket: NodeNet.Socket = target.socketPath ? net().connect({ path: target.socketPath }) : net().connect({ host: target.host, port: target.port });
  let buffered: Buffer = Buffer.alloc(0);
  let phase: "tls" | "auth" | "listen" | "proving" | "ready" = target.tls === "off" || target.socketPath ? "auth" : "tls";
  let scram: Scram | null = null;
  let closed = false;
  let beat: ReturnType<typeof setInterval> | null = null;
  let waiting: ReturnType<typeof setTimeout> | null = null;

  const end = (reason: string) => {
    if (closed) return;
    closed = true;
    if (beat) clearInterval(beat);
    if (waiting) clearTimeout(waiting);
    clearTimeout(opening);
    socket.destroy();
    events.onClosed(reason);
  };
  // The whole opening (connect, TLS, password, LISTEN, the first heartbeat heard) has this long.
  const opening = setTimeout(() => end("the connection did not open in time"), timings.connectMs);
  unref(opening);

  const write = (data: Buffer) => {
    if (!closed) socket.write(data);
  };

  /** Notify our own channel and wait to hear it: the proof that this connection is delivered notifications. */
  const heartbeat = () => {
    if (closed || waiting) return;
    waiting = setTimeout(() => end("the heartbeat was not heard"), timings.heartbeatWaitMs);
    unref(waiting);
    write(message("Q", cstring(`NOTIFY ${ownChannel}`)));
  };

  const onMessage = (type: string, body: Buffer) => {
    if (type === "E") return end(errorText(body));
    if (type === "R") {
      const code = body.readInt32BE(0);
      if (code === 0) return;
      if (code === 3) return write(message("p", cstring(target.password)));
      if (code === 5) return write(md5Password(target, body.subarray(4, 8)));
      if (code === 10) {
        const offered = body.toString("utf8", 4).split("\0").filter(Boolean);
        if (!offered.includes("SCRAM-SHA-256")) return end("the server offers no password method this connection speaks");
        const first = scramFirst();
        scram = first.scram;
        return write(first.message);
      }
      if (code === 11 && scram) return write(scramFinal(scram, target.password, body.toString("utf8", 4)));
      if (code === 12 && scram) return scramVerify(scram, body.toString("utf8", 4));
      return end("the server asks for a password method this connection does not speak");
    }
    if (type === "Z") {
      if (phase === "auth") {
        phase = "listen";
        return write(message("Q", cstring(`LISTEN ${channelName}; LISTEN ${ownChannel}`)));
      }
      if (phase === "listen") {
        phase = "proving";
        return heartbeat();
      }
      return;
    }
    if (type === "A") {
      // NotificationResponse: the sender's process id, the channel, the payload.
      const channelEnd = body.indexOf(0, 4);
      const payloadEnd = body.indexOf(0, channelEnd + 1);
      if (channelEnd < 0 || payloadEnd < 0) return;
      const heardOn = body.toString("utf8", 4, channelEnd);
      if (heardOn === ownChannel) {
        if (waiting) clearTimeout(waiting);
        waiting = null;
        if (phase === "proving") {
          phase = "ready";
          clearTimeout(opening);
          beat = setInterval(heartbeat, timings.heartbeatMs);
          unref(beat);
          events.onReady();
        }
        return;
      }
      if (heardOn === channelName && phase === "ready") events.onNotify(body.toString("utf8", channelEnd + 1, payloadEnd));
    }
    // ParameterStatus, BackendKeyData, NoticeResponse, CommandComplete: nothing to do.
  };

  const onData = (chunk: Buffer) => {
    if (closed) return;
    buffered = buffered.length ? Buffer.concat([buffered, chunk]) : chunk;
    try {
      while (!closed && buffered.length >= 5) {
        const length = buffered.readInt32BE(1);
        if (length < 4) return end("the server sent a message that cannot be read");
        if (buffered.length < length + 1) return;
        const type = String.fromCharCode(buffered[0]!);
        const body = buffered.subarray(5, length + 1);
        buffered = buffered.subarray(length + 1);
        onMessage(type, body);
      }
    } catch (error) {
      end(error instanceof Error ? error.message : "the server's message could not be read");
    }
  };

  const attach = (s: NodeNet.Socket) => {
    s.on("data", onData);
    s.on("error", (error: NodeJS.ErrnoException) => end(error.code ?? "the connection failed"));
    s.on("close", () => end("the connection closed"));
  };

  const begin = () => {
    phase = "auth";
    write(startupMessage(target));
  };

  socket.setKeepAlive(true, 30_000);
  socket.setNoDelay(true);
  // The HTTP listener keeps a server alive; this connection alone never holds a process open (a script, a test).
  socket.unref();
  if (phase === "auth") {
    attach(socket);
    socket.once("connect", begin);
  } else {
    // TLS is asked for first, in the clear, and the server answers one byte before anything else is said.
    const plain = socket;
    plain.on("error", (error: NodeJS.ErrnoException) => end(error.code ?? "the connection failed"));
    plain.on("close", () => end("the connection closed"));
    plain.once("connect", () => plain.write(SSL_REQUEST));
    plain.once("data", (answer: Buffer) => {
      if (closed) return;
      const letter = String.fromCharCode(answer[0] ?? 0);
      if (letter === "S") {
        plain.removeAllListeners("error");
        plain.removeAllListeners("close");
        const secure = tls().connect({ socket: plain, rejectUnauthorized: target.verify, ...(net().isIP(target.host) ? {} : { servername: target.host }) });
        socket = secure;
        attach(secure);
        secure.once("secureConnect", begin);
        return;
      }
      if (letter === "N" && target.tls === "try") {
        plain.removeAllListeners("error");
        plain.removeAllListeners("close");
        attach(plain);
        return begin();
      }
      end("the server does not offer TLS and the URL requires it");
    });
  }

  return { close: () => end("closed") };
}

/* ------------------------------------------------------------------------- */
/* The link: one connection, kept                                            */
/* ------------------------------------------------------------------------- */

export type ListenLink = { close: () => void };

export type ListenOptions = {
  /** Read each time a connection is opened, so a corrected setting is taken up without a restart of the caller. */
  url: () => string | undefined;
  channel: string;
  onNotify: (payload: string) => void;
  /** The link is up: `LISTEN` is in force and proved. Called on every opening. */
  onUp: () => void;
  /** The link went down, or its first opening failed. Called once per fall, not once per failed retry. */
  onDown: (reason: string) => void;
  timings?: Partial<ListenTimings>;
  /** The retry table's bounds; a test shortens them. */
  retryMinMs?: number;
  retryMaxMs?: number;
};

/**
 * Opens the listening connection and keeps it: a connection that ends is opened again after one second, then two,
 * doubling to thirty, each wait spread over its second half so that servers which lost the database together do not
 * come back together.
 */
export function listen(options: ListenOptions): ListenLink {
  const timings = { ...TIMINGS, ...options.timings };
  const min = options.retryMinMs ?? 1_000;
  const max = options.retryMaxMs ?? 30_000;
  let stopped = false;
  let current: Connection | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let toldDown = false;

  const fell = (reason: string) => {
    if (stopped) return;
    current = null;
    if (!toldDown) {
      toldDown = true;
      options.onDown(reason);
    }
    const table = Math.min(min * 2 ** attempt++, max);
    timer = setTimeout(open, Math.round(table / 2 + Math.random() * (table / 2)));
    unref(timer);
  };

  function open() {
    timer = null;
    if (stopped) return;
    try {
      const url = options.url();
      if (!url) throw new Error("no database URL to listen on");
      current = connect(
        listenTarget(url),
        options.channel,
        {
          onReady: () => {
            attempt = 0;
            toldDown = false;
            if (!stopped) options.onUp();
          },
          onNotify: (payload) => {
            if (!stopped) options.onNotify(payload);
          },
          onClosed: fell,
        },
        timings,
      );
    } catch (error) {
      fell(error instanceof Error ? error.message : "the connection could not be opened");
    }
  }

  open();

  return {
    close: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
      current?.close();
      current = null;
    },
  };
}
