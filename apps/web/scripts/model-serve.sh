#!/usr/bin/env bash
# The assistant's local model servers (docs/runbooks/assistant-local.md).
#
#   scripts/model-serve.sh embed   # Qwen3-Embedding-0.6B (Q8_0) on 127.0.0.1:${ASSISTANT_EMBED_PORT:-8181}
#   scripts/model-serve.sh chat    # Qwen3-30B-A3B (Q8_0) on 127.0.0.1:${ASSISTANT_CHAT_PORT:-8180}
#   scripts/model-serve.sh small   # Qwen3-4B (Q8_0) on 127.0.0.1:${ASSISTANT_SMALL_PORT:-8182}: Vidura's gate classifier (pass 3)
#   scripts/model-serve.sh both    # chat and embed, in the background, logs under storage/models/
#   scripts/model-serve.sh stop    # stops the servers this script started (by pid file)
#   scripts/model-serve.sh restart-embed   # the embeddings server alone
#   scripts/model-serve.sh chat2   # the chat model again on 127.0.0.1:${QUIZ_GEN_CHAT2_PORT:-8183}: the quiz generator's alone
#   scripts/model-serve.sh start-chat | start-chat2 | start-embed | start-small   # one server, in the background (the desks' Start)
#   scripts/model-serve.sh stop-chat | stop-chat2 | stop-embed | stop-small       # one server this script started (the desks' Stop)
#
# SLOTS (gen-throughput, 19 Oct 2026). The chat server runs ${ASSISTANT_CHAT_SLOTS:-4} slots of
# ${ASSISTANT_CHAT_SLOT_CTX:-8192} tokens each (the context is slots x 8k, so a slot keeps its 8k at any count).
# The quiz generator reads the count from the server's /props and keeps slots - 1 requests in flight on it, one
# slot always left for Vidura (scripts/quiz-gen/model.ts). Eight slots were measured and are not the default:
# the model decodes about 75 tokens a second for one request, 83 for three and 118 for seven together on this
# Mac (an MoE's experts barely share a batch), so a chapter took 538 s at seven in flight against 556 s at three,
# while each of Vidura's answers would be written at the pace of eight requests instead of four.
# chat2 is the same model with the same settings on :8183, which Vidura never reads; the generator uses it only
# with QUIZ_GEN_CHAT2=on (both servers share the one GPU: measured slower, docs/runbooks/assistant-local.md
# section 9). start-chat2 starts it only when the Mac has ${QUIZ_GEN_CHAT2_MIN_FREE_GB:-48} GB available (free,
# inactive, speculative and purgeable pages: room for the weights' 32.5 GB if no other server maps them, the KV
# cache and a margin; beside a running chat server it took 7 GB, the weights' pages being shared) and says so in
# storage/models/chat2.log either way; refused, it exits 3 and a generation run goes on with the chat server alone.
#
# The bank desk (/root/quiz-review, /appadmin/quiz-review) and the evaluation runs (/root/vidura-evals) start and stop
# the servers through this script and nothing else (src/lib/quiz-jobs.ts, src/lib/eval-jobs.ts): a run brings up
# only the servers that were down, and takes down only those when it ends (src/lib/model-holders.ts).
#
# Both are llama.cpp's llama-server (OpenAI-compatible: /v1/chat/completions, /v1/embeddings). The weights
# come from the official Qwen repositories on Hugging Face with -hf on first start and are cached in
# ~/.cache/llama.cpp; nothing else leaves the machine. They listen on 127.0.0.1 only.
set -euo pipefail

export LLAMA_CACHE="${LLAMA_CACHE:-$HOME/.cache/llama.cpp}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$HERE/storage/models"
mkdir -p "$RUN_DIR" "$LLAMA_CACHE"

CHAT_PORT="${ASSISTANT_CHAT_PORT:-8180}"
EMBED_PORT="${ASSISTANT_EMBED_PORT:-8181}"
CHAT_REPO="${ASSISTANT_CHAT_REPO:-Qwen/Qwen3-30B-A3B-GGUF:Q8_0}"
EMBED_REPO="${ASSISTANT_EMBED_REPO:-Qwen/Qwen3-Embedding-0.6B-GGUF:Q8_0}"
SMALL_PORT="${ASSISTANT_SMALL_PORT:-8182}"
SMALL_REPO="${ASSISTANT_SMALL_REPO:-Qwen/Qwen3-4B-GGUF:Q8_0}"
CHAT_SLOTS="${ASSISTANT_CHAT_SLOTS:-4}"
CHAT_SLOT_CTX="${ASSISTANT_CHAT_SLOT_CTX:-8192}"
CHAT2_PORT="${QUIZ_GEN_CHAT2_PORT:-8183}"
CHAT2_SLOTS="${QUIZ_GEN_CHAT2_SLOTS:-$CHAT_SLOTS}"
CHAT2_MIN_FREE_GB="${QUIZ_GEN_CHAT2_MIN_FREE_GB:-48}"

embed() {
  # Last-token pooling is what Qwen3-Embedding is trained for. ONE SLOT, 4k context and micro-batch,
  # flash attention off. llama.cpp b11429 on Metal (8 Oct 2026) failed three ways with other settings:
  # vectors of nulls when several sequences shared a micro-batch (four slots, or flash attention on),
  # after which every answer was nulls until a restart; and with an 8k micro-batch and flash
  # attention off, a GPU page fault ("Compute error") that also lasted until a restart. The ingest
  # caps an input at 3,500 characters, well under 4k tokens, and refuses a broken vector either way
  # (src/lib/assistant-model.ts).
  exec llama-server -hf "$EMBED_REPO" --alias qwen3-embedding-0.6b \
    --host 127.0.0.1 --port "$EMBED_PORT" --embedding --pooling last \
    -c 4096 -np 1 -b 4096 -ub 4096 -fa off -ngl 99 --no-webui
}

chat() {
  # 8k of context a slot, four slots unless ASSISTANT_CHAT_SLOTS says otherwise (32k over four, as before 19 Oct 2026);
  # the thinking block is extracted by the server (reasoning_content) so the answer text arrives clean.
  exec llama-server -hf "$CHAT_REPO" --alias qwen3-30b-a3b \
    --host 127.0.0.1 --port "$CHAT_PORT" --jinja -c $((CHAT_SLOTS * CHAT_SLOT_CTX)) -np "$CHAT_SLOTS" -ngl 99 -fa on \
    --reasoning-format deepseek --no-webui
}

chat2() {
  # The quiz generator's second chat server (gen-throughput, 19 Oct 2026): the same weights and settings as chat() on
  # its own port. Nothing but scripts/quiz-gen reads it.
  exec llama-server -hf "$CHAT_REPO" --alias qwen3-30b-a3b \
    --host 127.0.0.1 --port "$CHAT2_PORT" --jinja -c $((CHAT2_SLOTS * CHAT_SLOT_CTX)) -np "$CHAT2_SLOTS" -ngl 99 -fa on \
    --reasoning-format deepseek --no-webui
}

# Whole gigabytes the system can hand a new process without swapping: free, inactive, speculative and purgeable
# pages on macOS (vm_stat); MemAvailable on Linux.
available_gb() {
  if command -v vm_stat >/dev/null 2>&1; then
    vm_stat | awk '/page size of/ {ps=$8} /Pages free/ {f=$3} /Pages inactive/ {i=$3} /Pages speculative/ {s=$3} /Pages purgeable/ {p=$3} END {printf "%d", (f+i+s+p)*ps/1073741824}'
  elif [[ -r /proc/meminfo ]]; then
    awk '/MemAvailable/ {printf "%d", $2/1048576}' /proc/meminfo
  else
    echo 0
  fi
}

start_chat2() {
  local pidfile="$RUN_DIR/chat2.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "chat2 already running (pid $(cat "$pidfile"))"; return
  fi
  local have line
  have="$(available_gb)"
  line="[$(date '+%Y-%m-%dT%H:%M:%S%z')] chat2: ${have} GB of memory available, ${CHAT2_MIN_FREE_GB} GB needed"
  if (( have < CHAT2_MIN_FREE_GB )); then
    echo "$line: not started" | tee -a "$RUN_DIR/chat2.log"
    exit 3
  fi
  start_bg chat2 "$line: starting"
}

small() {
  # VIDURA'S GATE (pass 3, 18 Oct 2026): the two one-word classifier calls of src/lib/assistant/gate.ts on a model of
  # their own, so a question is never queued behind four answers being written on the chat server. Four slots of 4k
  # (the classifier's prompt is about 400 tokens and the text it reads at most 4,000 characters); thinking extracted
  # as on the chat server, though the classifier asks for none. The system prompt is the same on every call, so each
  # slot keeps it in its cache (llama-server reuses a slot's common prefix, cache_prompt).
  exec llama-server -hf "$SMALL_REPO" --alias qwen3-4b \
    --host 127.0.0.1 --port "$SMALL_PORT" --jinja -c 16384 -np 4 -ngl 99 -fa on \
    --reasoning-format deepseek --no-webui
}

start_bg() {
  local which="$1" preface="${2:-}"
  local pidfile="$RUN_DIR/$which.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$which already running (pid $(cat "$pidfile"))"; return
  fi
  # The log starts afresh with each start; a preface (chat2's memory line) is its first line.
  if [[ -n "$preface" ]]; then echo "$preface" | tee "$RUN_DIR/$which.log"; else : >"$RUN_DIR/$which.log"; fi
  nohup "$0" "$which" >>"$RUN_DIR/$which.log" 2>&1 &
  echo $! >"$pidfile"
  echo "$which started (pid $!, log $RUN_DIR/$which.log)"
}

stop_one() {
  local which="$1"
  local pidfile="$RUN_DIR/$which.pid"
  if [[ -f "$pidfile" ]]; then
    kill "$(cat "$pidfile")" 2>/dev/null && echo "$which stopped" || echo "$which was not running"
    rm -f "$pidfile"
  else
    echo "$which was not started by this script (no pid file)"
  fi
}

stop() {
  for which in chat chat2 embed small; do
    if [[ -f "$RUN_DIR/$which.pid" ]]; then stop_one "$which"; fi
  done
}

case "${1:-}" in
  embed) embed ;;
  chat) chat ;;
  chat2) chat2 ;;
  small) small ;;
  both) start_bg embed; start_bg chat ;;
  stop) stop ;;
  restart-embed) kill "$(cat "$RUN_DIR/embed.pid" 2>/dev/null)" 2>/dev/null || true; rm -f "$RUN_DIR/embed.pid"; sleep 2; start_bg embed ;;
  start-chat) start_bg chat ;;
  start-chat2) start_chat2 ;;
  stop-chat2) stop_one chat2 ;;
  start-embed) start_bg embed ;;
  stop-chat) stop_one chat ;;
  stop-embed) stop_one embed ;;
  start-small) start_bg small ;;
  stop-small) stop_one small ;;
  *) echo "usage: $0 embed|chat|chat2|small|both|stop|restart-embed|start-chat|start-chat2|start-embed|start-small|stop-chat|stop-chat2|stop-embed|stop-small" >&2; exit 2 ;;
esac
