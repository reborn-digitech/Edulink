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
  | { type: "attendance.updated"; classId: string; dateKey: string }
  | { type: "attendance.session.finalized"; classId: string; dateKey: string }
  | { type: "grade.updated"; studentMembershipId: string; assignmentId: string }
  | { type: "assignment.published"; classId: string; assignmentId: string }
  | { type: "remark.message"; threadId: string }
  | { type: "conversation.message"; conversationId: string }
  | { type: "post.status"; postId: string; status: string }
  | { type: "notification"; userId: string }
  | { type: "checklist.updated"; schoolId: string };

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
