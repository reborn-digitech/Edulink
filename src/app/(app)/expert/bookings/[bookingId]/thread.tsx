"use client";

import { ExpertThread, type ThreadMessage } from "@/components/expert-thread";
import { send } from "@/app/(app)/experts/actions";

export function BookingThread({
  bookingId,
  messages,
  disabled,
}: {
  bookingId: string;
  messages: ThreadMessage[];
  disabled: boolean;
}) {
  return (
    <ExpertThread
      messages={messages}
      disabled={disabled}
      onSend={(body) => send(bookingId, body)}
    />
  );
}
