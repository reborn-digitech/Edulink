/**
 * The owner's word of 15 November 2026 ("Yes, hide it"): at a college the phone's menu no longer offers the school's exam
 * screen to the office and the head, as the web's menu has not since DS-4, and with it the other screens whose web pages
 * were closed at a college the same day (d714f25f): the office's and the head's syllabus and substitutions, and the
 * student's school exams. They are marked `schoolOnly`, the menu's existing rule (TA-269, the web's kinds: SCHOOL_KINDS),
 * which hides an entry while /me says the active place is a college; at a school nothing changes.
 */
import { SCHOOL_MODULES, type RoleCode } from "@edulink/contracts";
import { MENU, menuFor } from "@/lib/nav";

const ALL_FEATURES = ["ASSISTANT", "QUESTION_BANK", "QUESTION_GIG", "EXPERT_SESSIONS", "TEACHER_SESSIONS", "JOB_BOARD", "TEXT_MESSAGING", "COMPETITIONS"];
const labels = (role: RoleCode, college: boolean): string[] => menuFor(role, SCHOOL_MODULES, [], [], ALL_FEATURES, college).flatMap((g) => g.items.map((i): string => i.labelKey));

const CLOSED: Partial<Record<RoleCode, string[]>> = {
  ADMIN: ["nav.exams", "nav.syllabus", "nav.substitutions"],
  PRINCIPAL: ["nav.exams", "nav.syllabus", "nav.substitutions"],
  STUDENT: ["nav.exams"],
};

describe("the school's exam, syllabus and substitutions screens at a college", () => {
  it("are not offered to the office, the head or the student at a college, and still are at a school", () => {
    for (const [role, keys] of Object.entries(CLOSED) as [RoleCode, string[]][]) {
      const atCollege = labels(role, true);
      const atSchool = labels(role, false);
      for (const key of keys) {
        expect({ role, key, atCollege: atCollege.includes(key) }).toEqual({ role, key, atCollege: false });
        expect({ role, key, atSchool: atSchool.includes(key) }).toEqual({ role, key, atSchool: true });
      }
    }
  });

  it("the school-only entries are exactly the admissions (TA-269) and these seven, so no other entry of any role goes at a college", () => {
    const marked = (Object.entries(MENU) as [RoleCode, { labelKey: string; schoolOnly?: boolean }[]][]).flatMap(([role, items]) => items.filter((i) => i.schoolOnly).map((i) => `${role} ${i.labelKey}`));
    expect(marked.sort()).toEqual(
      ["ADMIN nav.admissions", "ADMIN nav.exams", "ADMIN nav.substitutions", "ADMIN nav.syllabus", "PRINCIPAL nav.admissions", "PRINCIPAL nav.exams", "PRINCIPAL nav.substitutions", "PRINCIPAL nav.syllabus", "STUDENT nav.exams"].sort(),
    );
  });

  it("at a school every role's menu keeps every entry the school-only rule could take", () => {
    for (const role of Object.keys(MENU) as RoleCode[]) {
      const atSchool = labels(role, false);
      for (const item of MENU[role].filter((i) => i.schoolOnly)) expect({ role, key: item.labelKey, shown: atSchool.includes(item.labelKey) }).toEqual({ role, key: item.labelKey, shown: true });
    }
  });
});
