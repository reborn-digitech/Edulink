import { screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { StudentStudiosScreen } from "@/screens/college/studios";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * The phone's half of two findings of the testing analysis of 13 November 2026 (batch streams-duties):
 *   - TA-470: a studio stage a signed jury closed shows no submission form, while the open stage still does;
 *   - TA-271: the office reaches the moot screen at a law college, where it may correct any moot.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const STU = "/api/v1/family/studios";
const atArch = (role: RoleCode) => ({ ...me(role), modules: ["ACADEMICS"], institutionKind: "COLLEGE", streams: ["ARCHITECTURE"] });

const studentPage = (over: Record<string, unknown> = {}) => ({
  today: "2026-10-11",
  offered: true,
  studios: [
    {
      id: id("studio1"),
      title: "ZZ A primary school for Aundh",
      courseCode: "AR301",
      courseName: "Architectural Design III",
      termName: "Odd 2026",
      brief: "",
      maxMarks: 100,
      coordinatorName: "ZZ Rohit",
      stages: [
        { stage: "BRIEF_ISSUED", on: "2026-08-03", state: "DONE" },
        { stage: "INTERIM_PINUP", on: "2026-09-14", state: "DONE" },
        { stage: "FINAL_SUBMISSION", on: "2026-10-26", state: "AHEAD" },
        { stage: "JURY", on: "2026-11-02", state: "AHEAD" },
      ],
      submissions: [],
      canSubmit: true,
      openStages: ["FINAL_SUBMISSION"],
      results: [{ juryId: id("jury0"), on: "2026-09-16", title: "Interim jury", marks: 62, band: "B_PLUS", remark: "" }],
      ...over,
    },
  ],
});

describe("TA-470: the student's studio stages", () => {
  it("TA-470: draws no form under a stage a signed jury closed, and the form under the open one", async () => {
    await mountStaff(<ToastProvider><StudentStudiosScreen /></ToastProvider>, "STUDENT", { [`GET ${STU}`]: () => json(studentPage()) }, { me: atArch("STUDENT") });
    expect(await screen.findByText("ZZ A primary school for Aundh")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Submit" })).toHaveLength(1);
    expect(screen.getByText("Submissions for this stage are closed: the jury has signed.")).toBeTruthy();
    expect(screen.queryByLabelText("Interim pin-up: Note")).toBeNull();
    expect(screen.getByLabelText("Final submission: Note")).toBeTruthy();
  });

  it("TA-470: an older server's answer without openStages still reads canSubmit for every dated stage", async () => {
    await mountStaff(<ToastProvider><StudentStudiosScreen /></ToastProvider>, "STUDENT", { [`GET ${STU}`]: () => json(studentPage({ openStages: undefined })) }, { me: atArch("STUDENT") });
    expect(await screen.findByText("ZZ A primary school for Aundh")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Submit" })).toHaveLength(2);
  });
});

describe("TA-271: the office's way to the moot screen", () => {
  it("TA-271: lists moot courts in the office's More at a law college only", () => {
    const at = (streams: string[]) => menuFor("ADMIN", ["ACADEMICS"], [], streams).flatMap((g) => g.items).find((i) => i.screen === "/(app)/moot-courts");
    expect(at(["LAW"])).toBeTruthy();
    expect(at(["SCIENCE"])).toBeUndefined();
  });
});
