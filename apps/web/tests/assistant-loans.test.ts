/**
 * "Loan" in the minors' money row, by role (integration, 11 Oct 2026). The row read the bare word for every
 * role, so a librarian's "how many books are on loan" was refused as MONEY_GIFTS (the data questions'
 * metrics, li-04). For a pupil the bare word still refuses; for a staff role only beside a money word.
 */
import { describe, expect, it } from "vitest";
import { detectRefusal, STAFF_ROLES_FOR_LOANS } from "@/lib/assistant/refusals";
import { tableVerdict } from "@/lib/assistant/gate";

const BOOKS = [
  "How many books are on loan?",
  "which books are on loan to class 7 right now",
  "कितनी किताबें उधार पर हैं?",
  "किती पुस्तके उधार दिली आहेत?",
];

const MONEY = [
  "how do I get a personal loan",
  "can you give me a loan of 5000 rupees",
  "where can I take a loan with low interest",
  "मुझे पैसे उधार चाहिए",
  "मला पैसे उधार हवे आहेत",
];

describe("the money row reads 'loan' by role", () => {
  it("lets a staff role ask about things on loan", () => {
    for (const role of ["LIBRARIAN", "TEACHER", "WARDEN", "ADMIN", "FACULTY"]) {
      for (const q of BOOKS) {
        expect(detectRefusal(q, role), `${role}: ${q}`).toBeNull();
        expect(tableVerdict(q, role), `${role}: ${q}`).toBeNull();
      }
    }
  });

  it("still refuses a staff role's money loan", () => {
    for (const role of ["LIBRARIAN", "TEACHER"]) {
      for (const q of MONEY) expect(detectRefusal(q, role), `${role}: ${q}`).toBe("MONEY_GIFTS");
    }
  });

  it("keeps the bare word for a pupil, and for an unknown asker", () => {
    for (const q of [...BOOKS, ...MONEY]) {
      expect(detectRefusal(q, "STUDENT"), q).toBe("MONEY_GIFTS");
      expect(detectRefusal(q), q).toBe("MONEY_GIFTS");
      expect(tableVerdict(q, "STUDENT"), q).toBe("MONEY_GIFTS");
    }
  });

  it("names no pupil, guardian or alumnus as staff", () => {
    for (const role of ["STUDENT", "PARENT", "ALUMNUS", "EXPERT", "RECRUITER"]) expect(STAFF_ROLES_FOR_LOANS.has(role), role).toBe(false);
  });

  it("leaves the rest of the money row as it was for every role", () => {
    for (const role of [null, "STUDENT", "LIBRARIAN"]) {
      expect(detectRefusal("how to earn money fast online", role)).toBe("MONEY_GIFTS");
      expect(detectRefusal("बिटकॉइन कैसे खरीदें", role)).toBe("MONEY_GIFTS");
    }
  });
});
