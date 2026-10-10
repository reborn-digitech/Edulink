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

/** How many requests the generator keeps in flight: the chat server has four slots; one is left for the assistant. */
export const CONCURRENCY = 3;

let inFlight = 0;
const waiting: (() => void)[] = [];

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= CONCURRENCY) await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
  try {
    return await fn();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

export type ChatClient = {
  json<T>(call: JsonCall): Promise<JsonResult<T>>;
  embed(texts: string[]): Promise<number[][]>;
  readonly model: string;
};

/**
 * A client over the two endpoints. The JSON call retries once on a malformed answer (the grammar
 * makes that rare; a truncated answer at max_tokens is the usual cause) and refuses after that: the
 * item is counted as a draft reject rather than guessed at.
 */
export function chatClient(chat: AssistantEndpoint, embed: AssistantEndpoint): ChatClient {
  async function once<T>(call: JsonCall, attempt: number): Promise<JsonResult<T>> {
    const started = Date.now();
    const res = await fetch(`${chat.url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(chat.key ? { Authorization: `Bearer ${chat.key}` } : {}) },
      body: JSON.stringify({
        model: chat.model,
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
    async json<T>(call: JsonCall): Promise<JsonResult<T>> {
      return slot(async () => {
        try {
          return await once<T>(call, 0);
        } catch (e) {
          if (/not JSON|answered 5\d\d/.test((e as Error).message)) return once<T>(call, 1);
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
