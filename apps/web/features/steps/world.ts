/**
 * THE BDD WORLD (QA campaign of 24 October 2026, layer 3). One scenario's state: who it is signed in as (a minted
 * bearer token, the phone's door), the last answer, and the values it chose to remember. Nothing here drives a
 * browser: the scenarios speak to /api/v1 on the running dev server exactly as the API sweep and the phone do.
 */
import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";

export const BASE = process.env.BDD_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type Answer = {
  method: string;
  path: string;
  status: number;
  contentType: string;
  text: string;
  json: unknown;
  ms: number;
};

export class BddWorld extends World {
  /** The bearer token in use, or null signed out. */
  token: string | null = null;
  /** Who the token is, for the failure messages. */
  actor = "signed out";
  answer: Answer | null = null;
  vars = new Map<string, unknown>();
  /** Extra headers for the next request only (the outbox's replay headers). */
  nextHeaders: Record<string, string> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** `{{name}}` from what the scenario remembered, `{{today}}` as the server's date key once read. */
  fill(text: string): string {
    return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, name: string) => {
      // The fixture schools keep Asia/Kolkata's clock, so their "today" is IST's date, not UTC's.
      if (name === "today") return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
      if (!this.vars.has(name)) throw new Error(`nothing remembered as "${name}" (remembered: ${[...this.vars.keys()].join(", ") || "none"})`);
      return String(this.vars.get(name));
    });
  }

  async call(method: string, rawPath: string, body?: string): Promise<Answer> {
    const path = this.fill(rawPath);
    const headers: Record<string, string> = { accept: "application/json", "user-agent": "zz-bdd", ...this.nextHeaders };
    this.nextHeaders = {};
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    let payload: string | undefined;
    if (body !== undefined) {
      payload = this.fill(body);
      headers["content-type"] = "application/json";
    } else if (method !== "GET" && method !== "DELETE") {
      // An empty JSON body, the way the sweep sends a write it expects refused for its shape.
      payload = "{}";
      headers["content-type"] = "application/json";
    }
    const started = Date.now();
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect: "manual", signal: AbortSignal.timeout(90_000) });
    const contentType = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    const text = contentType.includes("json") || contentType.startsWith("text/") ? buf.toString("utf8") : `<${buf.length} bytes of ${contentType}>`;
    let json: unknown = null;
    if (contentType.includes("json")) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    this.answer = { method, path, status: res.status, contentType, text, json, ms: Date.now() - started };
    return this.answer;
  }

  /** The last answer, or a clear failure when a Then comes before any When. */
  last(): Answer {
    if (!this.answer) throw new Error("no request has been made in this scenario yet");
    return this.answer;
  }

  /** One line describing the last answer, for assertion messages. */
  describe(): string {
    const a = this.last();
    return `${a.method} ${a.path} as ${this.actor} answered ${a.status} (${a.contentType || "no type"}): ${a.text.slice(0, 600)}`;
  }
}

setWorldConstructor(BddWorld);
