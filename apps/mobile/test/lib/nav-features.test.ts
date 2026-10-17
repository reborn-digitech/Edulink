import { meSchema, PLATFORM_FEATURES } from "@edulink/contracts";
import { FEATURES_BEFORE_SWITCHES, featuresOf, menuFor, TABS, tabShown } from "@/lib/nav";

/**
 * The platform's feature switches on the phone (15 Oct 2026): a tab or a More entry carrying `feature` is drawn only
 * while /api/v1/me's `features` names it (any of a list), and an answer from a server older than the switches (no
 * `features`) reads as everything as before, the teachers' question gig still off.
 */
const screens = (role: Parameters<typeof menuFor>[0], features: readonly string[]) =>
  menuFor(role, ["ALUMNI", "ASSISTANT"], [], [], features).flatMap((g) => g.items.map((i) => i.screen ?? i.web));

describe("the phone's menus follow the platform's features", () => {
  it("drops every feature's entry while all are off, and keeps the rest", () => {
    const teacher = screens("TEACHER", []);
    for (const screen of ["/(app)/practice", "/(app)/experts", "/(app)/vacancies", "/(app)/mentoring", "/(app)/sessions", "/(app)/contributions", "/(app)/assistant"]) expect(teacher).not.toContain(screen);
    expect(teacher).toContain("/(app)/timetable");
    expect(screens("PARENT", [])).not.toContain("/(app)/sessions");
    expect(screens("STUDENT", [])).not.toContain("/(app)/mentoring");
    expect(screens("ADMIN", [])).not.toContain("/(app)/vacancies");
  });

  it("shows each entry with its feature on, a shared one with either", () => {
    const all = screens("TEACHER", PLATFORM_FEATURES);
    for (const screen of ["/(app)/practice", "/(app)/experts", "/(app)/vacancies", "/(app)/mentoring", "/(app)/sessions", "/(app)/contributions"]) expect(all).toContain(screen);
    // Vidura has no menu entry since pass 1 (17 Oct 2026): the round button above the tab bar (screens/shared/vidura.tsx).
    expect(all).not.toContain("/(app)/assistant");
    // The family's sessions stay while expert OR teacher sessions are on.
    expect(screens("PARENT", ["TEACHER_SESSIONS"])).toContain("/(app)/sessions");
    expect(screens("PARENT", ["EXPERT_SESSIONS"])).toContain("/(app)/sessions");
    // A teacher's guidance is teacher sessions alone.
    expect(screens("TEACHER", ["EXPERT_SESSIONS"])).not.toContain("/(app)/sessions");
  });

  it("hides a feature's tab: a pupil's practice, an expert's availability, mentoring and sessions", () => {
    const shown = (role: keyof typeof TABS, features: readonly string[]) => TABS[role].filter((tab) => tabShown(tab, [], [], features)).map((tab) => tab.name);
    expect(shown("STUDENT", [])).not.toContain("practice");
    expect(shown("STUDENT", ["QUESTION_BANK"])).toContain("practice");
    expect(shown("EXPERT", [])).toEqual(["index"]);
    expect(shown("EXPERT", ["EXPERT_SESSIONS"])).toEqual(["index", "availability", "mentoring", "sessions"]);
  });

  it("reads an older server's /me as everything as before, the gig still off; an older phone ignores the field", () => {
    const old = meSchema.parse({ user: { id: "u", name: "A", preferredName: null, email: null, avatarKey: null, isMinor: false, locale: "en" }, active: { schoolId: null, role: null, membershipId: null }, contexts: [] });
    expect(old.features).toBeUndefined();
    expect(featuresOf(old)).toEqual(FEATURES_BEFORE_SWITCHES);
    expect(FEATURES_BEFORE_SWITCHES).not.toContain("QUESTION_GIG");
    expect(screens("TEACHER", featuresOf(old))).not.toContain("/(app)/contributions");
    expect(screens("TEACHER", featuresOf(old))).toContain("/(app)/practice");
    // The defaults of menuFor and tabShown are the same reading, so a caller that passes nothing keeps its menus.
    expect(menuFor("TEACHER")).toEqual(menuFor("TEACHER", undefined, [], [], FEATURES_BEFORE_SWITCHES));
    const now = meSchema.parse({ ...old, features: ["JOB_BOARD"] });
    expect(featuresOf(now)).toEqual(["JOB_BOARD"]);
  });
});
