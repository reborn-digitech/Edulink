"use client";

import { useCallback, useState } from "react";
import { assistantEventSchema } from "@edulink/contracts";
import { useEvents } from "@/lib/use-events";
import type { RealtimeEvent } from "@/lib/realtime";
import { streamIdle, streamReduce, type StreamState } from "./model";

const TYPES = ["assistant.stage", "assistant.delta", "assistant.done"] as unknown as RealtimeEvent["type"][];

/**
 * The answer as it streams in over GET /api/v1/events (Phase B publishes `assistant.stage`, `.delta` and `.done` on
 * the person's own channel, after the answer gate has passed the text). Open while a conversation is on screen; reset
 * for each question with `reset()`; another conversation's state is never this one's (it is derived, not copied).
 * Every event is parsed with the contract's schema: anything else on the stream is not the assistant's, and is ignored.
 */
export function useAnswerStream(conversationId: string | null): { state: StreamState; reset: () => void } {
  const [raw, setRaw] = useState<StreamState>(() => streamIdle(conversationId));
  const state = raw.conversationId === conversationId ? raw : streamIdle(conversationId);
  useEvents(
    (event) => {
      const parsed = assistantEventSchema.safeParse(event);
      if (parsed.success) setRaw((s) => streamReduce(s.conversationId === conversationId ? s : streamIdle(conversationId), parsed.data));
    },
    { types: TYPES, enabled: conversationId !== null },
  );
  const reset = useCallback(() => setRaw(streamIdle(conversationId)), [conversationId]);
  return { state, reset };
}
