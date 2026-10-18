/**
 * The generator's calls to the chat endpoint: OpenAI-compatible, llama.cpp on the owner's machine
 * (docs/runbooks/assistant-local.md), the answer constrained to a JSON schema so the shape of a draft
 * never breaks, a seed per call so the critique and the five solver runs are different draws. The
 * assistant's own client (src/lib/assistant-model.ts) has neither; this one is the generator's alone
 * and reuses its endpoint type and its embeddings call.
 *
 * Qwen3's thinking block is switched off in the chat template: it costs seconds an item and the
 * schema-constrained answer carries the reasoning the reviewer sees (the solution, the reasons).
 */
import type { AssistantEndpoint } from "../../src/lib/assistant-env";
import { embedTexts } from "../../src/lib/assistant-model";
import { chat2Enabled } from "../../src/lib/model-holders";

export type JsonCall = {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  seed: number;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type JsonResult<T> = { value: T; promptTokens: number; completionTokens: number; ms: number; cached: boolean };

/**
 * THE CHAT SERVERS' POOL (gen-throughput, 19 Oct 2026). Until then the generator kept three requests in flight on the one
 * chat server (a constant, against its four slots, one left for the assistant). Now it reads each server's slots from
 * llama-server's /props when a chapter starts and keeps:
 *
 *   - on the chat server Vidura shares (:8180, ASSISTANT_MODEL_URL): its slots less one, never fewer than one, so a
 *     slot is always free for the assistant;
 *   - on the second chat server (:8183, "chat2", scripts/model-serve.sh start-chat2), which Vidura never reads: all of
 *     its slots — when it is switched on (QUIZ_GEN_CHAT2=on; off by default, see chat2Enabled).
 *
 * Every drafting, critique, solver and translation call goes to the server with the fewest requests in flight that has
 * a free slot (least in flight; the order above breaks a tie), and waits for one when every slot is busy. A server that
 * stops answering mid-run (nothing answers, and its /health does not either) is dropped from the pool with a log line
 * and the call is sent again to the servers left; with none left the call fails as it did before. The embeddings stay on
 * their own server (:8181), outside the pool. What a call asks and how its answer is judged are unchanged: only where
 * it is sent.
 */

/** In flight on a primary that does not say its slots (a hosted endpoint without /props): the old constant. */
export const FALLBACK_IN_FLIGHT = 3;

/** One chat server the generator may send to, and how many requests it keeps in flight there. */
export type PoolServer = { name: string; endpoint: AssistantEndpoint; slots: number };

/** In flight on a server: every slot of one only the generator reads; one fewer on the one Vidura shares, never under one. Pure. */
export function usableSlots(total: number, sharedWithAssistant: boolean): number {
  const n = Math.floor(total);
  if (!Number.isFinite(n) || n < 1) return 1;
  return sharedWithAssistant ? Math.max(1, n - 1) : n;
}

/** Nothing answered (as opposed to an answer that was an error): fetch's TypeError, a refused or reset connection, a timeout. */
export function transportFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError" || error.name === "AbortError" || error instanceof TypeError) return true;
  const cause = (error as { cause?: unknown }).cause;
  const text = `${error.message} ${cause instanceof Error ? cause.message : ""}`;
  return /ECONNREFUSED|ECONNRESET|EPIPE|socket hang up|fetch failed|other side closed/i.test(text);
}

const origin = (endpoint: AssistantEndpoint) => new URL(endpoint.url).origin;

/** llama-server's /health answers ok: the server is there (a slow call is not a dead server). */
export async function answersHealth(endpoint: AssistantEndpoint): Promise<boolean> {
  try {
    return (await fetch(`${origin(endpoint)}/health`, { signal: AbortSignal.timeout(5_000) })).ok;
  } catch {
    return false;
  }
}

/** llama-server's /props: total_slots. Null when the server does not answer or does not say. */
export async function serverSlots(endpoint: AssistantEndpoint): Promise<number | null> {
  try {
    const res = await fetch(`${origin(endpoint)}/props`, { signal: AbortSignal.timeout(5_000), headers: endpoint.key ? { Authorization: `Bearer ${endpoint.key}` } : {} });
    if (!res.ok) return null;
    const total = ((await res.json()) as { total_slots?: unknown }).total_slots;
    return typeof total === "number" && Number.isInteger(total) && total > 0 ? total : null;
  } catch {
    return null;
  }
}

type Entry = { server: PoolServer; inFlight: number };

export class ChatPool {
  private live: Entry[];
  private waiters: (() => void)[] = [];

  constructor(
    servers: PoolServer[],
    private readonly log: (line: string) => void = () => {},
    private readonly stillThere: (endpoint: AssistantEndpoint) => Promise<boolean> = answersHealth,
  ) {
    this.live = servers.map((server) => ({ server, inFlight: 0 }));
  }

  /** Requests the pool keeps in flight at most, over the servers still in it. */
  get capacity(): number {
    return this.live.reduce((n, e) => n + e.server.slots, 0);
  }

  /** The servers still in the pool, in order. */
  get servers(): PoolServer[] {
    return this.live.map((e) => e.server);
  }

  /** Requests in flight on a server now (0 for one not in the pool). */
  inFlight(name: string): number {
    return this.live.find((e) => e.server.name === name)?.inFlight ?? 0;
  }

  /** The server with the fewest in flight that has a free slot; the earlier one on a tie. */
  private pick(): Entry | null {
    let best: Entry | null = null;
    for (const e of this.live) if (e.inFlight < e.server.slots && (!best || e.inFlight < best.inFlight)) best = e;
    return best;
  }

  private wake() {
    for (const resolve of this.waiters.splice(0)) resolve();
  }

  private async acquire(): Promise<Entry> {
    for (;;) {
      if (!this.live.length) throw new Error("no chat server answers: every server in the generator's pool stopped answering");
      const e = this.pick();
      if (e) {
        e.inFlight++;
        return e;
      }
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
  }

  private drop(e: Entry, error: unknown) {
    if (!this.live.includes(e)) return;
    this.live = this.live.filter((x) => x !== e);
    const left = this.live.length ? `${this.live.map((x) => `${x.server.name} ${x.server.slots}`).join(", ")} in flight left` : "no server left";
    this.log(`  chat server ${e.server.name} (${origin(e.server.endpoint)}) stopped answering (${(error as Error).message.slice(0, 120)}): dropped from the pool, the run goes on with ${left}`);
    // The waiters look again: at the servers left, or at none.
    this.wake();
  }

  /** One call on the least busy server; sent again elsewhere when its server turns out to be gone. */
  async run<T>(fn: (endpoint: AssistantEndpoint) => Promise<T>): Promise<T> {
    for (;;) {
      const e = await this.acquire();
      try {
        return await fn(e.server.endpoint);
      } catch (error) {
        if (!transportFailure(error)) throw error;
        // A slow answer from a server still there is the call's own failure, as before; a server gone is dropped (unless
        // a sibling call already did) and the call goes round again to the servers left.
        if (this.live.includes(e)) {
          if (await this.stillThere(e.server.endpoint)) throw error;
          this.drop(e, error);
        }
      } finally {
        e.inFlight--;
        this.wake();
      }
    }
  }
}

/**
 * The pool a chapter is generated on: the chat server Vidura shares (slots less one; three when it does not say) and the
 * second chat server when it answers (all its slots), each read from /props now. The lines say what was found, for the
 * run's log. The second server is used only with QUIZ_GEN_CHAT2=on (src/lib/model-holders.ts chat2Enabled: measured
 * slower on the owner's machine, where both share one GPU), and never when QUIZ_GEN_CHAT2_URL names the chat server.
 */
export async function discoverPool(
  chat: AssistantEndpoint,
  opts: { env?: Record<string, string | undefined>; slotsOf?: (endpoint: AssistantEndpoint) => Promise<number | null> } = {},
): Promise<{ servers: PoolServer[]; lines: string[] }> {
  const env = opts.env ?? process.env;
  const slotsOf = opts.slotsOf ?? serverSlots;
  const lines: string[] = [];
  const servers: PoolServer[] = [];
  const total = await slotsOf(chat);
  servers.push({ name: "chat", endpoint: chat, slots: total === null ? FALLBACK_IN_FLIGHT : usableSlots(total, true) });
  lines.push(total === null ? `chat (${origin(chat)}) did not say its slots: ${FALLBACK_IN_FLIGHT} in flight` : `chat (${origin(chat)}) ${usableSlots(total, true)} in flight of ${total} slots (one left for Vidura)`);
  const raw = env.QUIZ_GEN_CHAT2_URL?.trim();
  if (!chat2Enabled(env)) lines.push("chat2 not used (QUIZ_GEN_CHAT2 is not on)");
  else {
    let url: string | null = null;
    try {
      url = new URL(raw || "http://127.0.0.1:8183/v1").toString().replace(/\/+$/, "");
    } catch {
      lines.push(`chat2: QUIZ_GEN_CHAT2_URL is "${raw}", not a URL: left out`);
    }
    if (url) {
      const second: AssistantEndpoint = { url, model: env.QUIZ_GEN_CHAT2_MODEL?.trim() || chat.model, key: env.QUIZ_GEN_CHAT2_KEY?.trim() || null };
      if (origin(second) === origin(chat)) lines.push(`chat2 names the chat server itself: left out`);
      else {
        const total2 = await slotsOf(second);
        if (total2 === null) lines.push(`chat2 (${origin(second)}) is not answering: the chat server alone`);
        else {
          servers.push({ name: "chat2", endpoint: second, slots: usableSlots(total2, false) });
          lines.push(`chat2 (${origin(second)}) ${usableSlots(total2, false)} in flight of ${total2} slots`);
        }
      }
    }
  }
  return { servers, lines };
}

export type ChatClient = {
  json<T>(call: JsonCall): Promise<JsonResult<T>>;
  embed(texts: string[]): Promise<number[][]>;
  readonly model: string;
  /** Requests the client keeps in flight at most (the pool's slots); the pipeline sizes its workers by it. Absent: three. */
  readonly capacity?: number;
};

/**
 * A client over the chat servers and the embeddings endpoint. The JSON call retries once on a malformed answer (the
 * grammar makes that rare; a truncated answer at max_tokens is the usual cause) and refuses after that: the item is
 * counted as a draft reject rather than guessed at. Without a pool (the competitions crawl), the chat endpoint alone
 * with three in flight, as before 19 Oct 2026.
 */
export function chatClient(chat: AssistantEndpoint, embed: AssistantEndpoint, pool: ChatPool = new ChatPool([{ name: "chat", endpoint: chat, slots: FALLBACK_IN_FLIGHT }])): ChatClient {
  async function once<T>(server: AssistantEndpoint, call: JsonCall, attempt: number): Promise<JsonResult<T>> {
    const started = Date.now();
    const res = await fetch(`${server.url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(server.key ? { Authorization: `Bearer ${server.key}` } : {}) },
      body: JSON.stringify({
        model: server.model,
        messages: [
          { role: "system", content: call.system },
          { role: "user", content: call.user },
        ],
        max_tokens: call.maxTokens ?? 1200,
        temperature: call.temperature ?? 0.7,
        seed: call.seed + attempt * 1000003,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
        response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema: call.schema } },
      }),
      signal: AbortSignal.timeout(call.timeoutMs ?? 240_000),
    });
    if (!res.ok) throw new Error(`chat endpoint answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
    };
    const content = (body.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    let value: T;
    try {
      value = JSON.parse(content) as T;
    } catch {
      throw new Error(`the model's answer was not JSON (finish: ${body.choices?.[0]?.finish_reason ?? "?"}): ${content.slice(0, 120)}`);
    }
    return {
      value,
      promptTokens: body.usage?.prompt_tokens ?? 0,
      completionTokens: body.usage?.completion_tokens ?? 0,
      ms: Date.now() - started,
      cached: (body.usage?.prompt_tokens_details?.cached_tokens ?? 0) > 0,
    };
  }
  return {
    model: chat.model,
    get capacity() {
      return pool.capacity;
    },
    async json<T>(call: JsonCall): Promise<JsonResult<T>> {
      return pool.run(async (endpoint) => {
        try {
          return await once<T>(endpoint, call, 0);
        } catch (e) {
          if (/not JSON|answered 5\d\d/.test((e as Error).message)) return once<T>(endpoint, call, 1);
          throw e;
        }
      });
    },
    async embed(texts: string[]): Promise<number[][]> {
      // The embedding server runs one slot with a 4k context: small batches, one at a time.
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += 16) out.push(...(await embedTexts(embed, texts.slice(i, i + 16))));
      return out;
    },
  };
}

/** A stable seed per item and pass, so a rerun on the same chapter asks the same questions of the model. */
export function seedFor(key: string, pass: number): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000_007) + pass * 7919;
}

/**
 * The generator's client for one chapter (or college unit): the pool found now (discoverPool), its lines written to the
 * run's log, a server that stops answering dropped with a line of its own. The quiz CLI, the generation job and the
 * college units use it; the competitions crawl keeps chatClient's single server.
 */
export async function generatorClient(endpoints: { chat: AssistantEndpoint; embed: AssistantEndpoint }, log: (line: string) => void): Promise<ChatClient> {
  const { servers, lines } = await discoverPool(endpoints.chat);
  log(`  chat servers: ${lines.join("; ")}`);
  return chatClient(endpoints.chat, endpoints.embed, new ChatPool(servers, log));
}
