"use client";

import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/use-events";

/**
 * The thread's ear: a line sent by anyone in the room (src/lib/remarks.ts
 * publishes `remark.message` to the school, the pupil and the teacher) re-reads
 * the page, so the reply appears under the one being answered without a reload.
 * The page's own reply already refreshes after sending; hearing its own
 * message back is one more refresh of the same thing. The reply being typed
 * is client state and survives the refresh. Renders nothing.
 */
export function ThreadLive({ threadId }: { threadId: string }) {
  const router = useRouter();
  useEvents(
    (event) => {
      if (event.type === "remark.message" && event.threadId === threadId) router.refresh();
    },
    // Back from a hidden tab: whatever was said meanwhile is read now.
    { types: ["remark.message"], onResume: () => router.refresh() },
  );
  return null;
}
