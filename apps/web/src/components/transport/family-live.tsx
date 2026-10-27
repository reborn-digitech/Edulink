"use client";

import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/use-events";

/**
 * A family's bus page reads again when the bus moves, starts, ends or nears the stop (the child's own channel): the
 * guardian's /parent/transport and the pupil's own /student/transport (owner-batch-item5).
 */
export function FamilyTransportLive() {
  const router = useRouter();
  useEvents(() => router.refresh(), { types: ["transport.position", "transport.trip", "transport.near"], onResume: () => router.refresh() });
  return null;
}
