#!/usr/bin/env bash
# The assistant's two local model servers (docs/runbooks/assistant-local.md).
#
#   scripts/model-serve.sh embed   # Qwen3-Embedding-0.6B (Q8_0) on 127.0.0.1:${ASSISTANT_EMBED_PORT:-8181}
#   scripts/model-serve.sh chat    # Qwen3-30B-A3B (Q8_0) on 127.0.0.1:${ASSISTANT_CHAT_PORT:-8180}
#   scripts/model-serve.sh both    # both, in the background, logs under storage/models/
#   scripts/model-serve.sh stop    # stops the servers this script started (by pid file)
#   scripts/model-serve.sh restart-embed   # the embeddings server alone
#   scripts/model-serve.sh start-chat | start-embed   # one server, in the background (the bank desk's Start)
#   scripts/model-serve.sh stop-chat | stop-embed     # one server this script started (the bank desk's Stop)
#
# The bank desk (/root/quiz-review, /appadmin/quiz-review) starts and stops the servers through this
# script and nothing else (src/lib/quiz-jobs.ts): a generation run brings up only the servers that were
# down, and takes down only those when it ends.
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
  # 32k context split over four slots (8k each); the thinking block is extracted by the server
  # (reasoning_content) so the answer text arrives clean.
  exec llama-server -hf "$CHAT_REPO" --alias qwen3-30b-a3b \
    --host 127.0.0.1 --port "$CHAT_PORT" --jinja -c 32768 -np 4 -ngl 99 -fa on \
    --reasoning-format deepseek --no-webui
}

start_bg() {
  local which="$1"
  local pidfile="$RUN_DIR/$which.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$which already running (pid $(cat "$pidfile"))"; return
  fi
  nohup "$0" "$which" >"$RUN_DIR/$which.log" 2>&1 &
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
  for which in chat embed; do
    if [[ -f "$RUN_DIR/$which.pid" ]]; then stop_one "$which"; fi
  done
}

case "${1:-}" in
  embed) embed ;;
  chat) chat ;;
  both) start_bg embed; start_bg chat ;;
  stop) stop ;;
  restart-embed) kill "$(cat "$RUN_DIR/embed.pid" 2>/dev/null)" 2>/dev/null || true; rm -f "$RUN_DIR/embed.pid"; sleep 2; start_bg embed ;;
  start-chat) start_bg chat ;;
  start-embed) start_bg embed ;;
  stop-chat) stop_one chat ;;
  stop-embed) stop_one embed ;;
  *) echo "usage: $0 embed|chat|both|stop|restart-embed|start-chat|start-embed|stop-chat|stop-embed" >&2; exit 2 ;;
esac
