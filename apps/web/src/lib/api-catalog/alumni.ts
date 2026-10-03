import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * alumni (the owner's decision of 3 October 2026): a former pupil's home,
 * the staff they may write to, the directory they may join, and the office's
 * page. Every door belongs to the ALUMNI module, so a school that has
 * switched it off answers 403 MODULE_OFF. The conversation, feed and inbox
 * doors an alumnus also uses are the ordinary ones (shared.ts, core.ts),
 * which name ALUMNUS in their limitedRoles.
 *
 * Doors that take an id take it in the body, so the sweep's empty body is a
 * 422 and never an act: muting, marking a mentor and closing a room are the
 * office's and staff's decisions, not something a sweep should repeat.
 */
const STAFF: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "TEACHER"];

export const ALUMNI: Endpoint[] = [
  { method: "GET", path: "/api/v1/alumni/home", summary: "A former pupil's home: their batch and last class, former teachers, notes from the school, what the feed lets them do, their directory entry", access: ["ALUMNUS"], module: "ALUMNI", response: c.alumniHomeSchema },
  { method: "GET", path: "/api/v1/alumni/staff", summary: "The staff a former pupil may write to, their former teachers first (`?q=` on the name)", access: ["ALUMNUS"], module: "ALUMNI", response: c.alumniStaffSchema, sample: "/api/v1/alumni/staff?q=zz" },
  { method: "GET", path: "/api/v1/alumni/directory", summary: "The alumni who chose to be listed, newest batch first; for the school's alumni and staff", access: ["ALUMNUS", ...STAFF], module: "ALUMNI", response: c.alumniDirectorySchema },
  { method: "PUT", path: "/api/v1/alumni/directory", summary: "Join the alumni directory, or change one's entry (an adult alumnus; audited)", access: ["ALUMNUS"], module: "ALUMNI", request: c.alumniDirectoryJoinSchema, response: c.alumniDirectoryMeSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/alumni/directory", summary: "Leave the alumni directory; what was written there goes with it (idempotent)", access: ["ALUMNUS"], module: "ALUMNI", response: c.alumniDirectoryMeSchema },
  { method: "POST", path: "/api/v1/alumni/posts", summary: "Share a post with the old school, held for the office (only while the school lets its alumni post)", access: ["ALUMNUS"], module: "ALUMNI", request: c.alumniPostSchema, response: c.alumniPostCreatedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/alumni/conversations/close", summary: "Staff close a room a former pupil writes in, or open it again (idempotent; audited)", access: STAFF, module: "ALUMNI", request: c.alumniConversationCloseSchema, response: c.alumniConversationClosedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/alumni", summary: "The school's alumni by batch, each with their flags, and the notes sent to them (`?q=` on the name)", access: ["ADMIN", "PRINCIPAL"], module: "ALUMNI", response: c.alumniAdminSchema },
  { method: "POST", path: "/api/v1/admin/alumni/settings", summary: "What alumni may do on the school's feed: READ, COMMENT or POST (idempotent; audited)", access: ["ADMIN"], module: "ALUMNI", request: c.alumniSettingsSchema, response: c.alumniSettingsResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/alumni/mute", summary: "Pause an alumnus's messages and comments, with a reason they are told, or restore them (idempotent; audited)", access: ["ADMIN"], module: "ALUMNI", request: c.alumniMuteSchema, response: c.alumniFlagResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/alumni/mentor", summary: "Mark an adult alumnus as a mentor, or take it back (idempotent; audited)", access: ["ADMIN"], module: "ALUMNI", request: c.alumniMentorSchema, response: c.alumniFlagResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/alumni/notes", summary: "Write to one batch of alumni, or to every alumnus: a note on their home and a notification (ten a day; audited)", access: ["ADMIN"], module: "ALUMNI", request: c.alumniNoteSendSchema, response: c.alumniNoteSentSchema, emptyBodyStatus: 422 },
];
