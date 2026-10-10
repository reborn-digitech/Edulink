import { fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ClinicalDeskScreen, ClinicalLogbookScreen } from "@/screens/college/clinical";
import { DUTY_SCREENS } from "@/screens/college/duties";
import { ToastProvider } from "@/components";
import { HIDDEN_SCREENS, menuFor } from "@/lib/nav";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { json, me, mountStaff, offline, refused } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * The clinical desk on the phone (R-56, the clinical half; 10 Oct 2026): the
 * coordinator's whole desk with the signing queue and the sites, a supervising
 * teacher's own side without the duty, the office's read, the refusals that
 * ask nothing of the server; the student's logbook with a new entry sent with
 * a client id, queued through the outbox with no signal, a returned entry
 * corrected and handed in; and the menu entries, the duty card and the
 * registrar's tile.
 */
const id = (s: string) => `c${s.padEnd(24, "0")}`;
const meAs = (role: RoleCode, extra: Record<string, unknown> = {}) => ({ ...me(role), modules: ["ACADEMICS", "IQAC"], institutionKind: "COLLEGE", streams: ["HEALTH_SCIENCES"], ...extra });
const gets = (calls: () => { line: string }[], prefix: string) => calls().filter((c) => c.line.startsWith(`GET ${prefix}`)).length;

const posting = (n: number, extra: Record<string, unknown> = {}) => ({
  id: id(`post${n}`),
  siteId: id("site1"),
  siteName: "ZZ Civil Hospital",
  departmentId: id(`ward${n}`),
  departmentName: n === 1 ? "ZZ Medical ward" : "ZZ Surgical ward",
  divisionId: id("div1"),
  divisionName: "ZZ SY Nursing A",
  programmeCode: "BSCN",
  labBatchId: null,
  batchName: null,
  supervisorMembershipId: id("sup1"),
  supervisorName: "ZZ Prof Shinde",
  from: n === 1 ? "2026-09-21" : "2026-10-19",
  to: n === 1 ? "2026-10-18" : "2026-11-15",
  rotationOrder: n,
  current: n === 1,
  students: [{ membershipId: id("stu1"), name: "ZZ Pooja", rollNumber: 1, signed: 1, waiting: 1, returned: 0, draft: 0 }],
  ...extra,
});
const queueRow = (n: number, canSign: boolean) => ({ id: id(`entry${n}`), postingId: id("post1"), studentMembershipId: id("stu1"), studentName: "ZZ Pooja", departmentName: "ZZ Medical ward", siteName: "ZZ Civil Hospital", on: `2026-10-0${n + 2}`, kind: "SKILL", count: 3, note: "ZZ Three bed baths.", submittedAt: "2026-10-04T04:00:00.000Z", canSign });
const desk = {
  offered: true,
  canManage: true,
  canPost: true,
  today: "2026-10-10",
  sites: [{ id: id("site1"), name: "ZZ Civil Hospital", kind: "HOSPITAL", address: "ZZ Station Road", agreementFrom: "2026-06-01", agreementTo: "2027-05-31", agreementLapsed: false, contactRole: "MEDICAL_SUPERINTENDENT", departments: [{ id: id("ward1"), name: "ZZ Medical ward", beds: 40, postings: 1 }, { id: id("ward2"), name: "ZZ Surgical ward", beds: null, postings: 1 }] }],
  postings: [posting(1), posting(2)],
  queue: [queueRow(1, true), queueRow(2, false)],
  divisions: [],
  supervisors: [],
  requirements: [],
  summary: { sites: 1, postings: 2, current: 1, students: 1, entries: 3, signed: 1, waiting: 2 },
};

describe("the clinical desk", () => {
  it("shows the coordinator the queue, the postings with the counts and the sites, and signs an entry with a remark", async () => {
    const { calls } = await mountStaff(<ClinicalDeskScreen />, "FACULTY", { "GET /api/v1/duties/clinical": () => json(desk), [`POST /api/v1/duties/clinical/logbook/${id("entry1")}/sign`]: () => json({ id: id("entry1") }) }, { me: meAs("FACULTY", { duties: ["CLINICAL_COORDINATOR"] }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ Pooja · ZZ Civil Hospital › ZZ Medical ward · 03/10/2026")).toBeTruthy();
    expect(screen.getByText("ZZ SY Nursing A · ZZ Civil Hospital › ZZ Medical ward · Today")).toBeTruthy();
    expect(screen.getByText("Rotation 1 · 21/09/2026 to 18/10/2026 · ZZ Prof Shinde\n1 · ZZ Pooja: 1 signed · 1 waiting · 0 returned · 0 draft")).toBeTruthy();
    expect(screen.getByText("ZZ Civil Hospital · Hospital")).toBeTruthy();
    expect(screen.getByText("Agreement 01/06/2026 to 31/05/2027\nContact: Medical superintendent\nZZ Medical ward · 40 beds; ZZ Surgical ward")).toBeTruthy();
    // The second entry is another supervisor's and the reader may not sign it.
    expect(screen.getByText("Only the posting's supervisor or the coordinator may sign this one.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Sign: ZZ Pooja" })).toHaveLength(1);
    await userEvent.setup().type(screen.getByLabelText("Remark"), "ZZ Neat");
    await fireEvent.press(screen.getByRole("button", { name: "Sign: ZZ Pooja" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST /api/v1/duties/clinical/logbook/${id("entry1")}/sign`)?.body).toEqual({ remark: "ZZ Neat" }));
    await waitFor(() => expect(gets(calls, "/api/v1/duties/clinical")).toBe(2));
  });

  it("returns an entry only with a reason, and shows the server's refusal", async () => {
    const { calls } = await mountStaff(<ToastProvider><ClinicalDeskScreen /></ToastProvider>, "HOD", { "GET /api/v1/duties/clinical": () => json({ ...desk, queue: [queueRow(1, true)] }), [`POST /api/v1/duties/clinical/logbook/${id("entry1")}/return`]: refused("ZZ not yours", 403) }, { me: meAs("HOD", { duties: ["CLINICAL_COORDINATOR"] }) });
    const back = await screen.findByRole("button", { name: "Return: ZZ Pooja" });
    expect(back).toBeDisabled();
    await userEvent.setup().type(screen.getByLabelText("Remark"), "ZZ Say which site.");
    await fireEvent.press(screen.getByRole("button", { name: "Return: ZZ Pooja" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST /api/v1/duties/clinical/logbook/${id("entry1")}/return`)?.body).toEqual({ remark: "ZZ Say which site." }));
    expect(await screen.findByText("ZZ not yours")).toBeTruthy();
  });

  it("gives a teacher without the duty their own side, and the office the whole desk without the forms", async () => {
    const mine = { offered: true, today: "2026-10-10", postings: [posting(1)], queue: [queueRow(1, true)] };
    const { calls } = await mountStaff(<ClinicalDeskScreen />, "FACULTY", { "GET /api/v1/duties/clinical/supervising": () => json(mine) }, { me: meAs("FACULTY", { duties: [] }) });
    expect(await screen.findByRole("button", { name: "Sign: ZZ Pooja" })).toBeTruthy();
    expect(screen.getByText("My clinical postings")).toBeTruthy();
    expect(gets(calls, "/api/v1/duties/clinical/supervising")).toBe(1);
    expect(calls().some((c) => c.line === "GET /api/v1/duties/clinical")).toBe(false);
    await mountStaff(<ClinicalDeskScreen />, "ADMIN", { "GET /api/v1/duties/clinical": () => json({ ...desk, canPost: false, queue: [queueRow(1, false)], postings: [] }) }, { me: meAs("ADMIN") });
    expect(await screen.findByText("The coordinator posts divisions here.")).toBeTruthy();
    expect(screen.getByText("Clinical postings")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign: ZZ Pooja" })).toBeNull();
  });

  it("refuses a student and says when the module is off, asking nothing of the server; says when the college offers no clinical stream", async () => {
    const { calls } = await mountStaff(<ClinicalDeskScreen />, "STUDENT", {}, { me: meAs("STUDENT") });
    expect(await screen.findByText("This is for a member of staff who holds that duty.")).toBeTruthy();
    expect(gets(calls, "/api/v1/duties")).toBe(0);
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
    await mountStaff(<ClinicalDeskScreen />, "PRINCIPAL", {}, { me: meAs("PRINCIPAL", { modules: ["IQAC"] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
    await mountStaff(<ClinicalDeskScreen />, "PRINCIPAL", { "GET /api/v1/duties/clinical": () => json({ ...desk, offered: false, sites: [], postings: [], queue: [], summary: { ...desk.summary, sites: 0 } }) }, { me: meAs("PRINCIPAL", { streams: ["ARTS"] }) });
    expect(await screen.findByText("Clinical postings are kept by a college with the health-sciences or pharmacy stream; yours has none.")).toBeTruthy();
  });
});

const entry = (n: number, state: string, extra: Record<string, unknown> = {}) => ({ id: id(`entry${n}`), clientId: `zz-client-${n}`, postingId: id("post1"), departmentName: "ZZ Medical ward", siteName: "ZZ Civil Hospital", on: `2026-10-0${n}`, kind: "CASE", count: 2, note: `ZZ Note ${n}`, state, submittedAt: null, signedAt: null, signedByName: null, remark: "", ...extra });
const { students: _s1, ...p1 } = posting(1);
const { students: _s2, ...p2 } = posting(2);
const logbook = {
  offered: true,
  today: "2026-10-10",
  postings: [p1, p2],
  entries: [entry(1, "SIGNED", { signedAt: "2026-10-05T04:00:00.000Z", signedByName: "ZZ Prof Shinde", remark: "ZZ Neat" }), entry(2, "RETURNED", { remark: "ZZ Say which site." }), entry(3, "DRAFT")],
  summary: { signed: 1, waiting: 0, returned: 1, draft: 1 },
};

describe("the student's logbook", () => {
  beforeEach(() => __setOutboxStore(memoryOutbox()));
  afterEach(() => __setOutboxStore(null));

  it("lists the postings and the entries by state, sends a new entry with a client id, and hands a draft in", async () => {
    const { calls } = await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": () => json({ id: id("entry9") }), [`POST /api/v1/family/clinical/logbook/${id("entry3")}/submit`]: () => json({ id: id("entry3") }) }, { me: meAs("STUDENT") });
    expect(await screen.findByText("1 signed · 0 handed in · 1 returned · 1 draft")).toBeTruthy();
    expect(screen.getByText("ZZ Civil Hospital › ZZ Medical ward · Today")).toBeTruthy();
    expect(screen.getByText("Case × 2 · Signed")).toBeTruthy();
    expect(screen.getByText("Signed by ZZ Prof Shinde on 05/10/2026 — ZZ Neat")).toBeTruthy();
    expect(screen.getByText("Returned: ZZ Say which site.")).toBeTruthy();
    // Only the one open posting (the second starts later) is offered for a new entry.
    await fireEvent.press(screen.getByRole("button", { name: "New entry" }));
    // The chip for the open posting, beside its row above; the later posting has its row alone and no chip.
    expect(screen.getAllByText("ZZ Civil Hospital › ZZ Medical ward")).toHaveLength(1);
    expect(screen.getAllByText("ZZ Civil Hospital › ZZ Surgical ward")).toHaveLength(1);
    const user = userEvent.setup();
    await user.press(screen.getByText("Skill"));
    await user.clear(screen.getByLabelText("Count"));
    await user.type(screen.getByLabelText("Count"), "3");
    await user.type(screen.getByLabelText("Note"), "ZZ Three bed baths given.");
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/family/clinical/logbook")).toBeTruthy());
    const body = calls().find((c) => c.line === "POST /api/v1/family/clinical/logbook")!.body as Record<string, unknown>;
    expect(body).toMatchObject({ postingId: id("post1"), on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), kind: "SKILL", count: 3, note: "ZZ Three bed baths given." });
    expect(String(body.clientId).length).toBeGreaterThan(6);
    expect(body.id).toBeUndefined();
    await waitFor(() => expect(gets(calls, "/api/v1/family/clinical")).toBe(2));
    await fireEvent.press(screen.getByRole("button", { name: "Hand in: 03/10/2026" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST /api/v1/family/clinical/logbook/${id("entry3")}/submit`)).toBe(true));
  });

  it("corrects a returned entry under its own id and client id", async () => {
    const { calls } = await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": () => json({ id: id("entry2") }) }, { me: meAs("STUDENT") });
    await fireEvent.press(await screen.findByRole("button", { name: "Correct: 02/10/2026" }));
    expect(screen.getByText("Correct the entry")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Note"), " on the left forearm");
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/family/clinical/logbook")?.body).toEqual({ id: id("entry2"), clientId: "zz-client-2", postingId: id("post1"), on: "2026-10-02", kind: "CASE", count: 2, note: "ZZ Note 2 on the left forearm" }));
  });

  it("keeps a new entry in the outbox with no signal, and shows a refusal in words", async () => {
    await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": offline }, { me: meAs("STUDENT") });
    await fireEvent.press(await screen.findByRole("button", { name: "New entry" }));
    await userEvent.setup().type(screen.getByLabelText("Note"), "ZZ Observed a ward round.");
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    expect(await screen.findByText("You are offline. This is saved on your device and will send when you are back.")).toBeTruthy();
    await waitFor(async () => expect((await listQueued("clinical-logbook")).length).toBe(1));
    await mountStaff(<ClinicalLogbookScreen />, "STUDENT", { "GET /api/v1/family/clinical": () => json(logbook), "POST /api/v1/family/clinical/logbook": refused("ZZ the note names a patient", 422) }, { me: meAs("STUDENT") });
    await fireEvent.press(await screen.findByRole("button", { name: "New entry" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the entry" }));
    expect(await screen.findByText("ZZ the note names a patient")).toBeTruthy();
  });

  it("says so at a college with no clinical stream and when the module is off, asking nothing", async () => {
    const { calls } = await mountStaff(<ClinicalLogbookScreen />, "STUDENT", {}, { me: meAs("STUDENT", { streams: ["ARTS"] }) });
    expect(await screen.findByText("Clinical postings are kept by a college with the health-sciences or pharmacy stream; yours has none.")).toBeTruthy();
    expect(gets(calls, "/api/v1/family")).toBe(0);
    await mountStaff(<ClinicalLogbookScreen />, "STUDENT", {}, { me: meAs("STUDENT", { modules: [] }) });
    expect(await screen.findByText("The college has switched this part off.")).toBeTruthy();
  });
});

describe("the way in", () => {
  it("is the More entries by duty and stream, the duty card and the hidden routes", () => {
    const items = (role: RoleCode, duties: string[], streams: string[]) => menuFor(role, ["ACADEMICS"], duties, streams).flatMap((g) => g.items.map((i) => i.labelKey));
    expect(items("FACULTY", ["CLINICAL_COORDINATOR"], ["HEALTH_SCIENCES"])).toEqual(expect.arrayContaining(["duties.clinical.title", "duties.clinical.supervisingTitle"]));
    expect(items("HOD", [], ["PHARMACY"])).toContain("duties.clinical.supervisingTitle");
    expect(items("HOD", [], ["PHARMACY"])).not.toContain("duties.clinical.title");
    expect(items("FACULTY", [], ["ARTS"])).not.toContain("duties.clinical.supervisingTitle");
    expect(items("STUDENT", [], ["HEALTH_SCIENCES"])).toContain("duties.clinical.myTitle");
    expect(items("STUDENT", [], ["LAW"])).not.toContain("duties.clinical.myTitle");
    expect(items("PARENT", [], ["HEALTH_SCIENCES"])).not.toContain("duties.clinical.myTitle");
    expect(DUTY_SCREENS.CLINICAL_COORDINATOR).toEqual({ screen: "/(app)/clinical-desk", module: "ACADEMICS" });
    expect(HIDDEN_SCREENS).toEqual(expect.arrayContaining(["clinical-desk", "clinical-logbook"]));
  });
});
