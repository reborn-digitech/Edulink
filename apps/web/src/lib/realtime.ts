import "server-only";

/**
 * Realtime fan-out.
 *
 * The spec asks for WebSockets. v1 uses Server-Sent Events over an in-process
 * pub/sub instead, for one decisive reason: Next's App Router has no WebSocket
 * server of its own, so WS means running and deploying a second process before
 * a single teacher can mark a single register. SSE is one route handler, works
 * through every proxy, and reconnects on its own.
 *
 * The cost is explicit: this fans out within ONE server process. The moment you
 * run more than one instance, replace `bus` with Redis pub/sub or Ably — the
 * publish/subscribe surface below is all that has to change.
 */

export type RealtimeEvent =
  /**
   * clientIds: the idempotency keys of the marks applied, so the register
   * that sent them can tell its own save from a colleague's and leave its
   * roster alone (a refetch under a teacher's hand would read as the page
   * fighting them). Opaque random ids, minted on the device; nothing in them.
   */
  | { type: "attendance.updated"; classId: string; dateKey: string; clientIds?: string[] }
  | { type: "attendance.session.finalized"; classId: string; dateKey: string }
  | { type: "grade.updated"; studentMembershipId: string; assignmentId: string }
  | { type: "assignment.published"; classId: string; assignmentId: string }
  | { type: "remark.message"; threadId: string }
  | { type: "conversation.message"; conversationId: string }
  | { type: "post.status"; postId: string; status: string }
  | { type: "notification"; userId: string }
  | { type: "checklist.updated"; schoolId: string }
  /** The board for a day changed: a cover named, taken away, taken up or declined. On the school channel and the substitute's own. */
  | { type: "substitution.updated"; dateKey: string; slotId: string }
  /**
   * Transport (3 Oct 2026): where a bus is (at most one every 15 s per trip),
   * a trip started or ended, and a bus near a pupil's stop. On the school
   * channel for the office and the head, and on the riding pupils' own
   * channels for their families. The BUS's position — never a child's.
   */
  | { type: "transport.position"; tripId: string; lat: number; lng: number; at: string }
  | { type: "transport.trip"; tripId: string; status: string }
  | { type: "transport.near"; tripId: string; studentMembershipId: string }
  /**
   * The assistant (Phase B, 10 Oct 2026; assistantEventSchema in packages/contracts): on the asker's
   * own user channel only. The stages, then the CHECKED answer in pieces, then done — nothing is
   * streamed before the answer gate has passed it.
   */
  | { type: "assistant.stage"; conversationId: string; stage: "SEARCHING" | "WRITING" | "CHECKING" }
  | { type: "assistant.delta"; conversationId: string; messageId: string; seq: number; text: string }
  | { type: "assistant.done"; conversationId: string; messageId: string; verdict: string };

type Subscriber = {
  channels: Set<string>;
  send: (event: RealtimeEvent) => void;
};

const globalForBus = globalThis as unknown as { edulinkBus?: Set<Subscriber> };
const bus: Set<Subscriber> = (globalForBus.edulinkBus ??= new Set());

/**
 * Channel names carry the tenant: "school:<id>", "class:<id>", "user:<id>".
 * A subscriber is only ever handed channels the session already proved access
 * to, so the realtime layer cannot become a way around the tenant boundary.
 */
export function subscribe(channels: string[], send: (event: RealtimeEvent) => void): () => void {
  const subscriber: Subscriber = { channels: new Set(channels), send };
  bus.add(subscriber);
  return () => {
    bus.delete(subscriber);
  };
}

export function publish(channels: string[], event: RealtimeEvent): void {
  const targets = new Set(channels);
  for (const subscriber of bus) {
    for (const channel of targets) {
      if (subscriber.channels.has(channel)) {
        try {
          subscriber.send(event);
        } catch {
          // A dead connection must not stop the rest of the fan-out; the
          // stream's own cancel handler removes it from the bus.
          bus.delete(subscriber);
        }
        break;
      }
    }
  }
}

export const channel = {
  school: (schoolId: string) => `school:${schoolId}`,
  class: (classId: string) => `class:${classId}`,
  user: (userId: string) => `user:${userId}`,
  student: (studentMembershipId: string) => `student:${studentMembershipId}`,
  /** One member of staff, by membership: the remark threads they are party to. */
  staff: (membershipId: string) => `staff:${membershipId}`,
};

export function subscriberCount(): number {
  return bus.size;
}
