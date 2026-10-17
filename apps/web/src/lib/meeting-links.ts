/**
 * WHERE A SESSION IS HELD (seats, 17 October 2026). Every slot — an expert's, a teacher's guidance, an alumnus
 * mentor's — carries the provider's own meeting room, and the platform takes only the rooms of the four services
 * the owner named: Google Meet, Zoom, Microsoft Teams and Jitsi. An https address on one of their hosts, nothing
 * else: no http, no address with a user or password in it, no port, no look-alike host
 * ("meet.google.com.example.in" is refused, a subdomain of zoom.us such as "us02web.zoom.us" is not).
 *
 * The link is the provider's to give and the platform's to hold back: it is shown to the provider always and to a
 * seat holder only once the seat is confirmed (and paid, when priced) — src/lib/gig-sessions.ts `mayJoin`.
 */
export const MEETING_SERVICES = ["MEET", "ZOOM", "TEAMS", "JITSI"] as const;
export type MeetingService = (typeof MEETING_SERVICES)[number];

/** Each service's hosts: an exact host, or a domain whose subdomains also serve its rooms. */
const HOSTS: { service: MeetingService; exact?: string[]; domain?: string[] }[] = [
  { service: "MEET", exact: ["meet.google.com"] },
  { service: "ZOOM", exact: ["zoom.us", "zoom.com"], domain: ["zoom.us", "zoom.com"] },
  { service: "TEAMS", exact: ["teams.microsoft.com", "teams.live.com"] },
  // meet.jit.si is Jitsi's own; 8x8.vc is Jitsi as a Service. A school's self-hosted Jitsi is not on the list.
  { service: "JITSI", exact: ["meet.jit.si", "8x8.vc"] },
];

/** Which of the four services a link is a room of, or null when it is none of them (or not a plain https address). */
export function meetingServiceOf(raw: string): MeetingService | null {
  const text = raw.trim();
  if (text.length === 0 || text.length > 500 || /\s/.test(text)) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  for (const h of HOSTS) {
    if (h.exact?.includes(host)) return h.service;
    if (h.domain?.some((d) => host.endsWith(`.${d}`))) return h.service;
  }
  return null;
}

/** A link the platform will hold for a slot: a Meet, Zoom, Teams or Jitsi room on https. */
export const isMeetingLink = (raw: string): boolean => meetingServiceOf(raw) !== null;
