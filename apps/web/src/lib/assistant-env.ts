/**
 * The assistant's two model endpoints (docs/plans/assistant.md §2 and §4; runbook
 * docs/runbooks/assistant-local.md), read the way src/lib/env.ts reads SMTP: every problem at once,
 * in words, and a caller that refuses to start rather than half-working.
 *
 *   ASSISTANT_MODEL_URL    the chat endpoint, OpenAI-compatible:   http://127.0.0.1:8180/v1
 *   ASSISTANT_MODEL        the model name it answers to:            qwen3-30b-a3b
 *   ASSISTANT_EMBED_URL    the embeddings endpoint, same shape:      http://127.0.0.1:8181/v1
 *   ASSISTANT_EMBED_MODEL  the embedding model's name:               qwen3-embedding-0.6b
 *
 * Local first (llama.cpp's llama-server on the owner's machine, scripts/model-serve.sh); a host
 * later, by changing these four and nothing else. The URLs end at the API root (".../v1"); the
 * callers add "/chat/completions" and "/embeddings". A key is optional (ASSISTANT_MODEL_KEY,
 * ASSISTANT_EMBED_KEY) and sent as a bearer token when set; the local servers need none.
 *
 * Under decision 0002 a model endpoint is a destination for what a person types. Phase A sends it
 * nothing but the public corpus, the platform's own docs and the owner's test questions; a hosted
 * endpoint is decision 0005's (Phase B), never a value somebody pastes here first.
 */
export const EMBEDDING_DIMENSIONS = 1024;

export type AssistantEndpoint = { url: string; model: string; key: string | null };
export type AssistantConfig = { chat: AssistantEndpoint; embed: AssistantEndpoint };
export type AssistantProblem = { key: string; message: string };

function endpoint(
  urlKey: string,
  modelKey: string,
  keyKey: string,
  env: Record<string, string | undefined>,
  problems: AssistantProblem[],
): AssistantEndpoint | null {
  const rawUrl = env[urlKey]?.trim();
  const model = env[modelKey]?.trim();
  let url: string | null = null;
  if (!rawUrl) problems.push({ key: urlKey, message: `${urlKey} is not set — the OpenAI-compatible API root, e.g. http://127.0.0.1:8180/v1 (scripts/model-serve.sh).` });
  else {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("scheme");
      url = rawUrl.replace(/\/+$/, "");
    } catch {
      problems.push({ key: urlKey, message: `${urlKey} is "${rawUrl}" — expected an http(s) URL ending at the API root, e.g. http://127.0.0.1:8180/v1.` });
    }
  }
  if (!model) problems.push({ key: modelKey, message: `${modelKey} is not set — the model name the endpoint answers to (llama-server's --alias).` });
  if (!url || !model) return null;
  return { url, model, key: env[keyKey]?.trim() || null };
}

export function readAssistantConfig(env: Record<string, string | undefined> = process.env):
  | { ok: true; config: AssistantConfig }
  | { ok: false; problems: AssistantProblem[] } {
  const problems: AssistantProblem[] = [];
  const chat = endpoint("ASSISTANT_MODEL_URL", "ASSISTANT_MODEL", "ASSISTANT_MODEL_KEY", env, problems);
  const embed = endpoint("ASSISTANT_EMBED_URL", "ASSISTANT_EMBED_MODEL", "ASSISTANT_EMBED_KEY", env, problems);
  if (!chat || !embed || problems.length) return { ok: false, problems };
  return { ok: true, config: { chat, embed } };
}

/** The embeddings endpoint alone: the ingest, the help index and the retrieval tests need no chat model. */
export function readEmbedConfig(env: Record<string, string | undefined> = process.env):
  | { ok: true; config: AssistantEndpoint }
  | { ok: false; problems: AssistantProblem[] } {
  const problems: AssistantProblem[] = [];
  const embed = endpoint("ASSISTANT_EMBED_URL", "ASSISTANT_EMBED_MODEL", "ASSISTANT_EMBED_KEY", env, problems);
  if (!embed) return { ok: false, problems };
  return { ok: true, config: embed };
}

/** For a script: the config, or every problem printed and the process stopped. */
export function requireEmbedConfig(what: string): AssistantEndpoint {
  const read = readEmbedConfig();
  if (read.ok) return read.config;
  for (const p of read.problems) console.error(`  ${p.message}`);
  console.error(`\n${what} refused to start: the embedding endpoint is not configured (.env.example, ASSISTANT_*).`);
  process.exit(1);
}

export function requireAssistantConfig(what: string): AssistantConfig {
  const read = readAssistantConfig();
  if (read.ok) return read.config;
  for (const p of read.problems) console.error(`  ${p.message}`);
  console.error(`\n${what} refused to start: the model endpoints are not configured (.env.example, ASSISTANT_*).`);
  process.exit(1);
}
