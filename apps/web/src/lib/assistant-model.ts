/**
 * The two calls the assistant makes to its model endpoints (src/lib/assistant-env.ts): embeddings
 * and chat completions, OpenAI-compatible, so llama.cpp on the owner's machine and a host later
 * answer the same request. No retries hidden here: the ingest decides how to resume, and a person's
 * question (Phase B) must fail visibly rather than wait.
 */
import { EMBEDDING_DIMENSIONS, type AssistantEndpoint } from "./assistant-env";

/**
 * Qwen3-Embedding is trained with an instruction on the QUERY side only; passages are embedded as
 * they are. One instruction per kind of search, in English whatever the question's language (the
 * model card's advice: the instruction in English works best across languages).
 */
export const QUERY_INSTRUCTIONS = {
  curriculum: "Given a student's or teacher's question, retrieve the textbook passage that answers it",
  help: "Given a question about using a school platform, retrieve the help text that names the page and the steps",
} as const;

export function asQuery(kind: keyof typeof QUERY_INSTRUCTIONS, question: string): string {
  return `Instruct: ${QUERY_INSTRUCTIONS[kind]}\nQuery:${question}`;
}

function headers(ep: AssistantEndpoint): Record<string, string> {
  return { "Content-Type": "application/json", ...(ep.key ? { Authorization: `Bearer ${ep.key}` } : {}) };
}

/** The endpoint answered a vector with nulls, NaN or all zeros: retry, never store. */
export class EmbeddingBroken extends Error {
  constructor() {
    super("the embeddings endpoint answered a vector with non-finite values");
    this.name = "EmbeddingBroken";
  }
}

/** One request; the vectors come back in input order, each checked for the column's dimension and for finite values. */
export async function embedTexts(ep: AssistantEndpoint, inputs: string[], opts: { timeoutMs?: number } = {}): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await fetch(`${ep.url}/embeddings`, {
    method: "POST",
    headers: headers(ep),
    body: JSON.stringify({ model: ep.model, input: inputs }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  if (!res.ok) throw new Error(`embeddings endpoint answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { data?: { index?: number; embedding: number[] }[] };
  const data = body.data ?? [];
  if (data.length !== inputs.length) throw new Error(`embeddings endpoint returned ${data.length} vectors for ${inputs.length} inputs`);
  const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((d) => d.embedding);
  for (const v of ordered) {
    if (v.length !== EMBEDDING_DIMENSIONS) throw new Error(`embedding has ${v.length} dimensions; the columns are vector(${EMBEDDING_DIMENSIONS})`);
    // llama-server under concurrent load was seen (8 Oct 2026) to answer a vector of nulls (NaN);
    // a zero or broken vector stored is a passage no search can ever find, so it is refused here.
    if (!v.every((x) => typeof x === "number" && Number.isFinite(x)) || v.every((x) => x === 0)) throw new EmbeddingBroken();
  }
  return ordered;
}

/** pgvector's text form: "[0.1,0.2,…]". */
export function vectorLiteral(v: number[]): string {
  if (!v.every(Number.isFinite)) throw new EmbeddingBroken();
  return `[${v.join(",")}]`;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = {
  content: string;
  usage: { promptTokens: number; completionTokens: number } | null;
  /** llama-server's own timings, when the endpoint is llama.cpp: generation speed for the report. */
  tokensPerSecond: number | null;
  promptTokensPerSecond: number | null;
  /** The first token's log-probability, when asked for and reported (the classifier's confidence). */
  firstTokenLogprob: number | null;
  /** Why the model stopped ("stop", "length" at the token cap), when the endpoint says (Vidura pass 1: "Go on"). */
  finishReason?: string | null;
};

export type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /**
   * A GBNF grammar the output must match (llama.cpp's `grammar`): the classifier's one word. A
   * hosted endpoint without grammar support answers free text, which the caller refuses unless it is
   * exactly one of the labels.
   */
  grammar?: string;
  /** Ask for the first tokens' log-probabilities (the classifier's confidence). */
  logprobs?: boolean;
};

export async function chatComplete(ep: AssistantEndpoint, messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
  const res = await fetch(`${ep.url}/chat/completions`, {
    method: "POST",
    headers: headers(ep),
    body: JSON.stringify({
      model: ep.model,
      messages,
      max_tokens: opts.maxTokens ?? 900,
      temperature: opts.temperature ?? 0.3,
      stream: false,
      // Qwen3's thinking block is never shown and costs seconds: switched off in the chat template (llama.cpp reads this; a host ignores it).
      chat_template_kwargs: { enable_thinking: false },
      ...(opts.grammar ? { grammar: opts.grammar } : {}),
      ...(opts.logprobs ? { logprobs: true, top_logprobs: 1 } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 300_000),
  });
  if (!res.ok) throw new Error(`chat endpoint answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string }; logprobs?: { content?: { logprob?: number }[] }; finish_reason?: string | null }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    timings?: { predicted_per_second?: number; prompt_per_second?: number };
  };
  // A thinking model's block, when the server did not extract it: never shown to a person.
  const content = (body.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return {
    content,
    usage: body.usage ? { promptTokens: body.usage.prompt_tokens ?? 0, completionTokens: body.usage.completion_tokens ?? 0 } : null,
    tokensPerSecond: body.timings?.predicted_per_second ?? null,
    promptTokensPerSecond: body.timings?.prompt_per_second ?? null,
    firstTokenLogprob: body.choices?.[0]?.logprobs?.content?.[0]?.logprob ?? null,
    finishReason: body.choices?.[0]?.finish_reason ?? null,
  };
}
