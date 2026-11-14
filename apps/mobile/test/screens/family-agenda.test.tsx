import { Linking } from "react-native";
import { screen } from "@testing-library/react-native";
import { calls, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import type { FamilyAgendaRow } from "@edulink/contracts";
import { agendaTarget, FamilyAgenda, groupByDay } from "@/screens/family/agenda";

const PATH = "/api/v1/family/agenda";
type Kind = FamilyAgendaRow["kind"];
const ROW = (id: string, kind: Kind, dateKey: string, title: string, extra: Partial<FamilyAgendaRow> = {}): FamilyAgendaRow => ({ id, kind, dateKey, at: null, endDateKey: null, title, detail: null, amountPaise: null, href: "/exams", ...extra });
const ROWS = [
  ROW("exam:1", "EXAM", "2026-10-03", "Mathematics", { at: "2026-10-03T04:30:00.000Z", detail: "ZZ Unit Test 1", href: "/exams" }),
  ROW("work:1", "WORK", "2026-10-05", "ZZ Fractions sheet", { at: "2026-10-05T06:30:00.000Z", detail: "ZZ 5A", href: `/parent/assignments?child=${ID.child}` }),
  ROW("session:1", "SESSION", "2026-10-05", "ZZ Maths help", { at: "2026-10-05T10:00:00.000Z", detail: "ZZ Teacher", href: "/sessions" }),
  ROW("calendar:1", "CLOSURE", "2026-10-09", "ZZ Founders' day break", { endDateKey: "2026-10-10", href: "/parent/timetable" }),
  ROW("fee:1", "FEE", "2026-10-11", "ZZ Term 2", { amountPaise: 250_000, href: `/parent/fees?child=${ID.child}` }),
];
const AGENDA = (role: "PARENT" | "STUDENT", rows = ROWS) => ({
  children: role === "PARENT" ? [{ studentMembershipId: ID.child, name: "ZZ Asha", schoolName: "ZZ School", leftAt: null }, { studentMembershipId: ID.child2, name: "ZZ Bela", schoolName: "ZZ School", leftAt: null }] : [],
  student: { studentMembershipId: ID.child, name: "ZZ Asha", schoolName: "ZZ School" },
  fromKey: "2026-10-01",
  toKey: "2026-10-14",
  days: 14,
  timeZone: "Asia/Kolkata",
  rows,
});

describe("the fortnight agenda", () => {
  it("is loading while the days are on their way", async () => {
    await renderFamily(<FamilyAgenda />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("a guardian sees the child's days in order, grouped by day, with the kind and the amount, and a row opens its screen", async () => {
    const { fetch } = await renderFamily(<FamilyAgenda />, ME_PARENT, { [PATH]: () => AGENDA("PARENT") });
    expect(await screen.findByText("Mathematics")).toBeTruthy();
    expect(screen.getByText(/The next 14 days for ZZ Asha/)).toBeTruthy();
    expect(calls(fetch, PATH)[0]!.url.searchParams.get("days")).toBe("14");
    expect(screen.getByText("Exam")).toBeTruthy();
    expect(screen.getByText(/ZZ Unit Test 1/)).toBeTruthy();
    expect(screen.getByText("ZZ Fractions sheet")).toBeTruthy();
    expect(screen.getByText("ZZ Maths help")).toBeTruthy();
    expect(screen.getByText(/to 10\/10\/2026/)).toBeTruthy();
    expect(screen.getByText(/₹2,500/)).toBeTruthy();
    // The two children are offered; the second child is asked for by id.
    await press(screen.getByRole("button", { name: /ZZ Bela/ }));
    expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("student") === ID.child2)).toBe(true);
    await press(screen.getByRole("button", { name: /^ZZ Term 2/ }));
    // The row's child goes with it (TA-168): Fees opens on that child.
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/fees", params: { child: ID.child } });
    await press(screen.getByRole("button", { name: /^ZZ Fractions sheet/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assignments", params: { child: ID.child } });
  });

  it("a competition row offers Enrol (decision 0007): a guardian enrols the agenda's child, a pupil themself; the other states are said in words", async () => {
    const rows = [
      ROW("calendar:c1", "COMPETITION", "2026-10-06", "ZZ Inter-house quiz", { href: `/competitions/czz0000000000000000comp1?child=${ID.child}`, competition: { competitionId: "czz0000000000000000comp1", enrol: "OPEN", entryId: null } }),
      ROW("calendar:c2", "COMPETITION", "2026-10-07", "ZZ Spelling bee", { href: "/competitions/czz0000000000000000comp2", competition: { competitionId: "czz0000000000000000comp2", enrol: "CONSENT_WAITING", entryId: "e2" } }),
      ROW("calendar:c3", "COMPETITION", "2026-10-08", "ZZ Chess", { href: "/competitions/czz0000000000000000comp3", competition: { competitionId: "czz0000000000000000comp3", enrol: "CLOSED", entryId: null } }),
    ];
    const ENTER = "/api/v1/shared/competitions/czz0000000000000000comp1/enter";
    const { fetch } = await renderFamily(<FamilyAgenda />, ME_PARENT, { [PATH]: () => AGENDA("PARENT", rows), [ENTER]: () => ({ entryId: "e1", awaitingConsent: false }) });
    expect(await screen.findByText("ZZ Inter-house quiz")).toBeTruthy();
    expect(screen.getAllByText("Competition").length).toBe(3);
    expect(screen.getByText("Consent waiting")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Enrol: ZZ Inter-house quiz" }));
    const sent = calls(fetch, ENTER)[0]!;
    expect(sent.init?.method).toBe("POST");
    expect(JSON.parse(String(sent.init?.body))).toEqual({ studentMembershipId: ID.child });
    // The pupil sends no child: they enrol themself.
    const second = await renderFamily(<FamilyAgenda />, ME_STUDENT, { [PATH]: () => AGENDA("STUDENT", rows), [ENTER]: () => ({ entryId: "e1", awaitingConsent: true }) });
    await press(await screen.findByRole("button", { name: "Enrol: ZZ Inter-house quiz" }));
    expect(JSON.parse(String(calls(second.fetch, ENTER)[0]!.init?.body))).toEqual({});
  });

  it("a pupil sees their own days; a longer window is asked for; nothing in the window says so", async () => {
    const { fetch } = await renderFamily(<FamilyAgenda />, ME_STUDENT, { [PATH]: (_init, url) => (url.searchParams.get("days") === "30" ? AGENDA("STUDENT", []) : AGENDA("STUDENT")) });
    expect(await screen.findByText(/Your next 14 days/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /ZZ Bela/ })).toBeNull();
    await press(screen.getByRole("button", { name: "Next 30 days" }));
    expect(await screen.findByText("Nothing in the next 14 days.")).toBeTruthy();
    expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("days") === "30")).toBe(true);
  });

  it("a row the phone has no screen for opens the web; a refusal is an alert with a retry", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<FamilyAgenda />, ME_STUDENT, { [PATH]: () => AGENDA("STUDENT", [ROW("x:1", "EVENT", "2026-10-02", "ZZ Elsewhere", { href: "/somewhere/else" })]) });
    await press(await screen.findByRole("button", { name: /^ZZ Elsewhere/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/somewhere/else"));
    open.mockRestore();
    await renderFamily(<FamilyAgenda />, ME_STUDENT, { [PATH]: refused(500, "ZZ not now") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now");
  });

  it("maps a row's web href to a screen, the fee pages to the fees screen, and groups rows by day", () => {
    expect(agendaTarget("/student/fees")).toEqual({ pathname: "/(app)/fees" });
    expect(agendaTarget(`/parent/fees?child=${ID.child}`)).toEqual({ pathname: "/(app)/fees", params: { child: ID.child } });
    expect(agendaTarget("/exams")).toEqual({ pathname: "/(app)/exams" });
    expect(agendaTarget("/parent/meetings")).toEqual({ pathname: "/(app)/meetings" });
    expect(agendaTarget("/nowhere")).toBeNull();
    expect(groupByDay(ROWS).map((g) => [g.dateKey, g.rows.length])).toEqual([
      ["2026-10-03", 1],
      ["2026-10-05", 2],
      ["2026-10-09", 1],
      ["2026-10-11", 1],
    ]);
  });
});
