/**
 * A Messages tab for the college's FACULTY and HOD (5 Oct 2026; the campaign's open decision 30, "Messages first").
 * On the web they answer at /remarks as a teacher does; on the phone they had no inbox at all, and the doors behind
 * one were closed to them: POST /api/v1/messages named only ALUMNUS and GET /api/v1/shared/people no college role.
 * Here, against the committed document: the tab is theirs, and every door the inbox, a room and the people picker
 * call opens to them by the contract matrix's own rule. Since G4-30 (risks batch) the four college desks too.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITED_ROLES } from "@edulink/contracts";
import { TABS, tabShown } from "@/lib/nav";
import { allowed, type Doc } from "../contract/role-matrix";

const doc = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "api", "openapi.json"), "utf8")) as Doc;
const LIMITED = [...LIMITED_ROLES] as string[];

// The inbox (screens/teacher/messages.tsx), a room (room.tsx) and who to write to (shared/directory.tsx).
const DOORS: [method: "get" | "post", path: string][] = [
  ["get", "/api/v1/shared/inbox"],
  ["get", "/api/v1/shared/conversations/{conversationId}"],
  ["post", "/api/v1/shared/conversations"],
  ["post", "/api/v1/messages"],
  ["get", "/api/v1/shared/people"],
];

const ROLES = ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const;

describe("Messages for a college's staff", () => {
  // G4-30 (risks batch, 5 Oct 2026): the exam cell, the IQAC, placement and accounts desks joined FACULTY and HOD.
  it.each(ROLES)("%s has a Messages tab, drawn whatever the college has on", (role) => {
    const tab = TABS[role].find((t) => t.name === "messages");
    expect(tab?.labelKey).toBe("nav.messages");
    expect(tabShown(tab!, [])).toBe(true);
  });

  it.each(ROLES)("%s may call every door the inbox, a room and the people picker call", (role) => {
    for (const [method, path] of DOORS) {
      const op = doc.paths[path]?.[method];
      expect({ path, documented: Boolean(op) }).toEqual({ path, documented: true });
      expect({ path, want: allowed(op!, role, LIMITED) }).toEqual({ path, want: "2xx" });
    }
  });

  it("a recruiter, an outside account, still has no inbox (its doors stay shut)", () => {
    expect(TABS.RECRUITER.some((t) => t.name === "messages")).toBe(false);
    expect(allowed(doc.paths["/api/v1/messages"]!.post!, "RECRUITER", LIMITED)).toBe(403);
  });
});
