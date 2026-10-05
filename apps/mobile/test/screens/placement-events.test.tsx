import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { TalksScreen } from "@/screens/placement/talks";
import { SoftSkillsScreen } from "@/screens/placement/soft-skills";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/**
 * Pre-placement talks and soft-skills training on the phone (R-2, 5 Oct
 * 2026): a student answers a talk and enrols in a training; the TPO marks a
 * started talk and a started session, one tap one mark, through the web's
 * doors. Both screens sit in More for the two roles while PLACEMENT is on.
 */
const atCollege = (role: RoleCode) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules: ["ALUMNI", "ACADEMICS", "PLACEMENT"], institutionKind: "COLLEGE" });
const ahead = "2030-10-12T05:30:00.000Z";
const past = "2020-10-01T05:30:00.000Z";
const talk = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  title: "ZZ Zeta talk",
  companyName: "ZZ Zeta Analytics",
  driveId: "d1",
  driveTitle: "ZZ Graduate analyst 2027",
  startsAt: ahead,
  durationMinutes: 60,
  venue: "ZZ Seminar hall",
  note: "",
  capacity: 40,
  status: "SCHEDULED",
  heldAt: null,
  started: false,
  counts: { going: 1, notGoing: 0, present: 0, absent: 0 },
  mine: { answer: null, attendance: null },
  canAnswer: true,
  ...over,
});
const summary = (over: Record<string, unknown> = {}) => ({
  id: "tr1",
  title: "ZZ Interview skills",
  skill: "INTERVIEW",
  trainer: "ZZ Trainer",
  status: "OPEN",
  capacity: 30,
  minAttendancePercent: 75,
  sessions: 3,
  held: 2,
  enrolled: 2,
  completed: 1,
  nextSessionAt: ahead,
  mine: { enrolled: false, attended: 0, completed: false },
  canEnrol: true,
  ...over,
});

describe("talks and soft-skills training in More", () => {
  it("are listed for a student and the TPO while placement is on, and for nobody when it is off", () => {
    const labels = (role: RoleCode, modules: string[]) => menuFor(role, modules).flatMap((g) => g.items.map((i) => i.labelKey));
    expect(labels("STUDENT", ["PLACEMENT"])).toEqual(expect.arrayContaining(["talks.studentTitle", "softSkills.studentTitle"]));
    expect(labels("TPO", ["PLACEMENT"])).toEqual(expect.arrayContaining(["talks.title", "softSkills.title"]));
    expect(labels("STUDENT", [])).not.toContain("talks.studentTitle");
  });
});

describe("a student's talks", () => {
  it("answers going, and shows the answer the server kept", async () => {
    const { calls } = await mountStaff(<TalksScreen />, "STUDENT", {
      "GET /api/v1/student/placement/talks": () => json({ talks: [talk()], canEdit: false }),
      "POST /api/v1/student/placement/talks/t1/rsvp": () => json(talk({ mine: { answer: "GOING", attendance: null } })),
    }, { me: atCollege("STUDENT") });
    await screen.findByText("ZZ Zeta talk");
    fireEvent.press(screen.getByText("I'm going"));
    await screen.findByText("Noted: you are going.");
    expect(calls().find((c) => c.line === "POST /api/v1/student/placement/talks/t1/rsvp")?.body).toEqual({ answer: "GOING" });
  });

  it("shows the mark of a talk held, with nothing left to answer", async () => {
    await mountStaff(<TalksScreen />, "STUDENT", {
      "GET /api/v1/student/placement/talks": () => json({ talks: [talk({ startsAt: past, started: true, heldAt: past, canAnswer: false, mine: { answer: "GOING", attendance: "PRESENT" } })], canEdit: false }),
    }, { me: atCollege("STUDENT") });
    await screen.findByText("You were present");
    expect(screen.queryByText("I'm going")).toBeNull();
  });
});

describe("the TPO's talks", () => {
  it("opens a started talk and marks a student present with one tap", async () => {
    const detail = { ...talk({ startsAt: past, started: true, mine: null, canAnswer: false }), roster: [{ studentMembershipId: "m2", name: "ZZ Student Two", prn: "ZZ0002", answer: "GOING", attendance: null }], truncated: false, canEdit: true, canMark: true };
    const { calls } = await mountStaff(<TalksScreen />, "TPO", {
      "GET /api/v1/placement/talks": () => json({ talks: [talk({ startsAt: past, started: true, mine: null, canAnswer: false })], canEdit: true }),
      "GET /api/v1/placement/talks/t1": () => json(detail),
      "POST /api/v1/placement/talks/t1/attendance": () => json({ saved: 1, talk: { ...detail, heldAt: past, roster: [{ ...detail.roster[0], attendance: "PRESENT" }] } }),
    }, { me: atCollege("TPO") });
    fireEvent.press(await screen.findByText(/ZZ Zeta Analytics/));
    await screen.findByText("ZZ Student Two");
    fireEvent.press(screen.getAllByText("Present")[0]!);
    await screen.findByText("Attendance saved for 1.");
    expect(calls().find((c) => c.line === "POST /api/v1/placement/talks/t1/attendance")?.body).toEqual({ marks: [{ studentMembershipId: "m2", attendance: "PRESENT" }] });
  });
});

describe("a student's soft-skills training", () => {
  it("enrols in an open training", async () => {
    const { calls } = await mountStaff(<SoftSkillsScreen />, "STUDENT", {
      "GET /api/v1/student/placement/trainings": () => json({ trainings: [summary()], completed: [] }),
      "POST /api/v1/student/placement/trainings/tr1/enrol": () => json(summary({ mine: { enrolled: true, attended: 0, completed: false }, canEnrol: false })),
    }, { me: atCollege("STUDENT") });
    fireEvent.press(await screen.findByText("Enrol"));
    await screen.findByText("You are enrolled.");
    expect(calls().find((c) => c.line === "POST /api/v1/student/placement/trainings/tr1/enrol")?.body).toEqual({ enrol: true });
  });

  it("says how many it completed and refuses in the server's words", async () => {
    await mountStaff(<SoftSkillsScreen />, "STUDENT", {
      "GET /api/v1/student/placement/trainings": () => json({ trainings: [summary()], completed: [{ trainingId: "tr0", title: "ZZ Communication", skill: "COMMUNICATION" }] }),
      "POST /api/v1/student/placement/trainings/tr1/enrol": () => json({ error: "Every seat is taken.", code: "CONFLICT" }, 409),
    }, { me: atCollege("STUDENT") });
    await screen.findByText("You have completed 1.");
    fireEvent.press(screen.getByText("Enrol"));
    await screen.findByText("Every seat is taken.");
  });
});

describe("the TPO's soft-skills training", () => {
  it("opens a training, takes the last started session and marks a student", async () => {
    const detail = {
      ...summary({ mine: null, canEnrol: false }),
      description: "",
      sessionList: [
        { id: "se1", startsAt: past, durationMinutes: 60, topic: "", venue: "", cancelled: false, held: true, present: 1 },
        { id: "se2", startsAt: ahead, durationMinutes: 60, topic: "", venue: "", cancelled: false, held: false, present: 0 },
      ],
      roster: [{ studentMembershipId: "m2", name: "ZZ Student Two", prn: null, attended: 1, completed: false, marks: { se1: true } }],
      canEdit: true,
    };
    const { calls } = await mountStaff(<SoftSkillsScreen />, "TPO", {
      "GET /api/v1/placement/trainings": () => json({ trainings: [summary({ mine: null, canEnrol: false })], studentsCompleted: 1, canEdit: true }),
      "GET /api/v1/placement/trainings/tr1": () => json(detail),
      "POST /api/v1/placement/trainings/tr1/sessions/se1/attendance": () => json({ saved: 1, training: detail }),
    }, { me: atCollege("TPO") });
    fireEvent.press(await screen.findByText(/Interviews · ZZ Trainer/));
    await screen.findByText("ZZ Student Two");
    fireEvent.press(screen.getAllByText("Absent")[0]!);
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/placement/trainings/tr1/sessions/se1/attendance")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/placement/trainings/tr1/sessions/se1/attendance")?.body).toEqual({ marks: [{ studentMembershipId: "m2", present: false }] });
  });
});
