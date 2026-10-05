import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { VoiceScreen } from "@/screens/iqac/voice";
import { IqacHome } from "@/screens/iqac/home";
import { json, me, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me for a role at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });

const SSS = { id: "sss1", kind: "SSS", title: "ZZ Student Satisfaction Survey", closesOn: "2026-10-24", answered: false, questions: [{ code: "Q01", label: "How much of the syllabus was covered in the class?" }, { code: "Q02", label: "How well did the teachers prepare for the classes?" }] };
const voice = (over: Partial<{ surveys: unknown[]; grievances: unknown[]; canFileGrievance: boolean }> = {}) => ({ surveys: [SSS], grievances: [], canFileGrievance: true, ...over });

describe("a student's voice on the phone (the IQAC module, 4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("answers the SSS once every question has an answer, and says thank you", async () => {
    let answered = false;
    const { calls } = await mountStaff(<VoiceScreen />, "STUDENT", {
      "GET /api/v1/voice": () => json(voice({ surveys: [{ ...SSS, answered }] })),
      "POST /api/v1/voice/surveys/sss1": () => {
        answered = true;
        return json(voice({ surveys: [{ ...SSS, answered: true }] }));
      },
    }, { me: atCollege("STUDENT", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("ZZ Student Satisfaction Survey")).toBeTruthy();
    expect(screen.getByText("Your name is not kept with your answers.")).toBeTruthy();
    const send = screen.getByRole("button", { name: "Send my answers" });
    expect(send.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getAllByRole("button", { name: "Fully" })[0]!);
    await fireEvent.press(screen.getAllByRole("button", { name: "Mostly" })[1]!);
    await fireEvent.press(screen.getByRole("button", { name: "Send my answers" }));
    expect(await screen.findByText("Answered, thank you.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/voice/surveys/sss1")?.body).toEqual({ answers: { Q01: 4, Q02: 3 } });
  });

  it("raises a grievance with the committee and names the UGC portal for ragging", async () => {
    const filed = { id: "g1", kind: "RAGGING", text: "ZZ Seniors stopped me in the corridor every evening.", status: "OPEN", filedAt: "2026-10-04T05:00:00.000Z", dueOn: "2026-10-21", overdue: false, response: "", escalatedAt: null };
    const { calls } = await mountStaff(<VoiceScreen />, "STUDENT", {
      "GET /api/v1/voice": () => json(voice({ surveys: [] })),
      "POST /api/v1/voice/grievances": () => json(voice({ surveys: [], grievances: [filed] })),
    }, { me: atCollege("STUDENT", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("No survey is open for you now.")).toBeTruthy();
    expect(screen.getByText(/antiragging\.in/)).toBeTruthy();
    expect(screen.getByText("You have raised no grievance.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Ragging" }));
    await fireEvent.changeText(screen.getByLabelText("What happened, and what you would like done"), filed.text);
    await fireEvent.press(screen.getByRole("switch", { name: "Keep my name from everyone but the office and the principal" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send to the committee" }));
    expect(await screen.findByText("Sent to the committee.")).toBeTruthy();
    expect(screen.getByText(/Due by 2026-10-21/)).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/voice/grievances")?.body).toEqual({ kind: "RAGGING", text: filed.text, anonymousToStaff: true });
  });

  it("takes an overdue grievance to the Ombudsperson, and shows a refusal as it is said", async () => {
    const g = { id: "g2", kind: "FEES", text: "ZZ My scholarship was not shown.", status: "OPEN", filedAt: "2026-09-01T05:00:00.000Z", dueOn: "2026-09-18", overdue: true, response: "", escalatedAt: null };
    let tries = 0;
    await mountStaff(<VoiceScreen />, "STUDENT", {
      "GET /api/v1/voice": () => json(voice({ surveys: [], grievances: [g] })),
      "POST /api/v1/voice/grievances/g2/escalate": () => {
        tries += 1;
        return tries === 1 ? json({ error: "The committee has until 2026-09-18.", code: "CONFLICT" }, 409) : json(voice({ surveys: [], grievances: [{ ...g, status: "ESCALATED", overdue: false }] }));
      },
    }, { me: atCollege("STUDENT", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText(/Past its time limit/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Why you are taking it further"), "ZZ No answer yet");
    await fireEvent.press(screen.getByRole("button", { name: "Take it to the Ombudsperson" }));
    expect(await screen.findByText("The committee has until 2026-09-18.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Take it to the Ombudsperson" }));
    expect(await screen.findByText(/With the Ombudsperson/)).toBeTruthy();
  });

  it("offers an alumnus the alumni survey and no grievance line", async () => {
    await mountStaff(<VoiceScreen />, "ALUMNUS", { "GET /api/v1/voice": () => json(voice({ surveys: [{ ...SSS, id: "al1", kind: "ALUMNI", title: "ZZ Alumni survey 2026" }], canFileGrievance: false })) }, { me: atCollege("ALUMNUS", ["ALUMNI", "IQAC"]) });
    expect(await screen.findByText("ZZ Alumni survey 2026")).toBeTruthy();
    expect(screen.queryByText("Raise a grievance")).toBeNull();
  });

  it("says when the voice cannot be read, and offers the feed when nothing is open", async () => {
    await mountStaff(<VoiceScreen />, "FACULTY", { "GET /api/v1/voice": refused("Something went wrong") }, { me: atCollege("FACULTY", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
  });

  it("sends a student with nothing to answer to the feed", async () => {
    await mountStaff(<VoiceScreen />, "STUDENT", { "GET /api/v1/voice": () => json(voice({ surveys: [], canFileGrievance: false })) }, { me: atCollege("STUDENT", ["ACADEMICS", "IQAC"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });
});

describe("a guardian's parent survey on the phone (campaign 2026-10-04, G-5)", () => {
  beforeEach(() => mockRouter.push.mockClear());
  const PARENT_SURVEY = { id: "ps1", kind: "PARENT", title: "ZZ Parent survey 2026", closesOn: "2026-10-31", answered: false, questions: [{ code: "P01", label: "How well does the college tell you about your child's progress?" }] };
  const guardianMe = { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null }, contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }], modules: ["IQAC"] };

  it("sees the parent survey with the guardian's intro, answers it once, and is offered no grievance line", async () => {
    const { calls } = await mountStaff(<VoiceScreen />, "PARENT", {
      "GET /api/v1/voice": () => json(voice({ surveys: [PARENT_SURVEY], grievances: [], canFileGrievance: false })),
      "POST /api/v1/voice/surveys/ps1": () => json(voice({ surveys: [{ ...PARENT_SURVEY, answered: true }], grievances: [], canFileGrievance: false })),
    }, { me: guardianMe });
    expect(await screen.findByText("ZZ Parent survey 2026")).toBeTruthy();
    expect(screen.getByText("Surveys")).toBeTruthy();
    expect(screen.getByText("The surveys your child's college asks guardians to answer. Your answers carry no name.")).toBeTruthy();
    expect(screen.getByText(/^Parent survey · /)).toBeTruthy();
    expect(screen.queryByText("Raise a grievance")).toBeNull();
    expect(screen.queryByText("Feedback and grievances")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Fully" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send my answers" }));
    expect(await screen.findByText("Answered, thank you.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/voice/surveys/ps1")?.body).toEqual({ answers: { P01: 4 } });
  });

  it("keeps the grievance line away from a guardian even if a server offered it", async () => {
    await mountStaff(<VoiceScreen />, "PARENT", { "GET /api/v1/voice": () => json(voice({ surveys: [PARENT_SURVEY], canFileGrievance: true })) }, { me: guardianMe });
    expect(await screen.findByText("ZZ Parent survey 2026")).toBeTruthy();
    expect(screen.queryByText("Raise a grievance")).toBeNull();
  });
});

describe("the IQAC coordinator's home on the phone (4 Oct 2026)", () => {
  const overview = {
    cycle: { id: "c1", framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2022-06-01", windowTo: "2027-05-31", status: "OPEN", cgpa: 2.84, grade: "B++", computedAt: "2026-10-04T05:00:00.000Z", metricCount: 64, scoredCount: 48 },
    nextBand: { grade: "A", min: 3.01, distance: 0.17 },
    cheapest: [{ code: "3.4.2", text: "Number of functional MoUs", gainPerUnit: 0.004, unit: "MoU" }],
    counts: { research: 6, activities: 5, committees: 3, openSurveys: 1, openGrievances: 1, overdueGrievances: 0, filings: 1, awaitingSignoff: 0 },
    calendar: [{ code: "AISHE", label: "AISHE data capture", from: "2026-11-01", to: "2027-01-31", filing: "AISHE", filedThisYear: false }],
    nirf: { partial: 20.5, coveredMarks: 52, parameters: [] },
    disclosurePublishedAt: null,
  };

  it("shows the predicted CGPA, the band, the distance to the next and the cheapest metric, never as a promise", async () => {
    await mountStaff(<IqacHome />, "IQAC", { "GET /api/v1/iqac/overview": () => json(overview) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("2.84")).toBeTruthy();
    expect(screen.getByText("B++")).toBeTruthy();
    expect(screen.getByText("0.17 below A, which starts at 3.01.")).toBeTruthy();
    expect(screen.getByText("3.4.2 Number of functional MoUs")).toBeTruthy();
    expect(screen.getByText(/does not score for NAAC/)).toBeTruthy();
    expect(screen.getByText("AISHE data capture")).toBeTruthy();
  });

  it("lists each filing with its year and where it stands, and says when there is none (5 Oct 2026)", async () => {
    const filing = (id: string, kind: string, status: string) => ({ id, kind, year: 2025, format: "PDF", generatedAt: "2026-10-01T05:00:00.000Z", hash: "abc", status, checked: true, principalNote: "", signedOffAt: null, figures: {}, departmentId: null });
    const { calls } = await mountStaff(<IqacHome />, "IQAC", {
      "GET /api/v1/iqac/overview": () => json(overview),
      "GET /api/v1/iqac/filings": () => json({ items: [filing("f1", "AQAR", "AWAITING_SIGNOFF"), filing("f2", "AISHE", "FILED"), filing("f3", "NBA_SAR", "DRAFT")], canGenerate: true, canSignOff: false }),
    }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("AQAR (yearly, September) · 2025-26")).toBeTruthy();
    expect(screen.getByText("With the principal")).toBeTruthy();
    expect(screen.getByText("AISHE data capture · 2025-26")).toBeTruthy();
    expect(screen.getByText("Filed")).toBeTruthy();
    // A kind the phone has no words for yet reads as its code, never a raw key.
    expect(screen.getByText("NBA SAR · 2025-26")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/iqac/filings")).toBe(true);
  });

  it("says no filing is generated yet", async () => {
    await mountStaff(<IqacHome />, "IQAC", { "GET /api/v1/iqac/overview": () => json(overview), "GET /api/v1/iqac/filings": () => json({ items: [], canGenerate: true, canSignOff: false }) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("No filing generated yet.")).toBeTruthy();
  });

  it("says no cycle is open yet and offers the feed", async () => {
    await mountStaff(<IqacHome />, "IQAC", { "GET /api/v1/iqac/overview": () => json({ ...overview, cycle: null, nextBand: null, cheapest: [] }) }, { me: atCollege("IQAC", ["ACADEMICS", "IQAC"]) });
    expect(await screen.findByText("No NAAC cycle yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("falls back to the foundation's home while the college has IQAC off", async () => {
    await mountStaff(<IqacHome />, "IQAC", {}, { me: atCollege("IQAC", ["ACADEMICS"]) });
    await waitFor(() => expect(screen.getByText(/is not switched on/)).toBeTruthy());
  });
});
