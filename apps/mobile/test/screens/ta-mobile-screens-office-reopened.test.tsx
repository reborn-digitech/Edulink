/**
 * The office's phone screens opened again (testing analysis of 13 November 2026, batch mobile-screens-office):
 * TA-155, TA-157, TA-158 and TA-162.
 *
 * Every signed-in route is a screen of one Tabs navigator, which keeps a visited screen mounted: going to it again
 * with other params hands the mounted screen new params, and a form held in the screen's own state keeps what the
 * last visit typed or was answered. `mockNav.open(params)` below is what the navigator does to a mounted screen; a
 * screen is never mounted twice here (the pattern of ta-013-reopened-screen.test.tsx).
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminTimetableSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { StaffApplication } from "@/screens/staff/application";
import { ApplicationNew } from "@/screens/staff/application-new";
import { CertificateIssue } from "@/screens/staff/certificate-issue";
import { StaffIncidentNew } from "@/screens/staff/incident-new";
import { MessagingNew } from "@/screens/staff/messaging-new";
import { TimetableEditor } from "@/screens/staff/timetable-editor";
import { StaffAppraisal, appraisalsPath } from "@/screens/staff/appraisal";
import { StaffClassDetail } from "@/screens/staff/class-detail";
import { ExpulsionsScreen } from "@/screens/hostel/expulsions";
import { A1, A2, application, CYCLE, CYCLES_VIEW } from "./admissions-fixtures";
import { json, me, mountStaff, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockNav = (() => {
  let params: Record<string, string> = {};
  const readers = new Set<() => void>();
  return {
    read: () => params,
    subscribe: (reader: () => void) => {
      readers.add(reader);
      return () => {
        readers.delete(reader);
      };
    },
    open: (next: Record<string, string>) => {
      params = next;
      for (const reader of [...readers]) reader();
    },
    set: (next: Record<string, string>) => {
      params = next;
    },
  };
})();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  return { useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => React.useSyncExternalStore(mockNav.subscribe, mockNav.read) };
});

/** The second visit: new params for the mounted screen, then whatever it reads because of them. */
async function openAgainWith(params: Record<string, string>): Promise<void> {
  await act(async () => {
    mockNav.open(params);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
});

describe("the application screen opened for the next applicant", () => {
  it("TA-155: after one admission, the next applicant shows neither code and is offered Admit", async () => {
    mockNav.set({ id: A1 });
    const accepted = (id: string, childName: string) => application({ id, childName, status: "ACCEPTED", offeredAt: "2026-09-21T05:00:00.000Z", respondedAt: "2026-09-22T05:00:00.000Z" }, { admit: true });
    await mountStaff(
      <ToastProvider>
        <StaffApplication />
      </ToastProvider>,
      "ADMIN",
      {
        [`GET /api/v1/office/admissions/applications/${A1}`]: () => json(accepted(A1, "ZZ Kabir")),
        [`GET /api/v1/office/admissions/applications/${A2}`]: () => json(accepted(A2, "ZZ Meera")),
        [`POST /api/v1/office/admissions/applications/${A1}/admit`]: () => json({ studentMembershipId: "czz00000000000000000mem1", studentCode: "ZZ-2026-041", className: null, feePlan: true, guardianLinked: true, firstSignInCode: "ZZQ7-K2M9" }),
      },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Admit to the roll" }));
    expect(await screen.findByText("ZZQ7-K2M9")).toBeTruthy();
    await openAgainWith({ id: A2 });
    expect(await screen.findByText("ZZ Meera · ZZ Admissions 2026-27")).toBeTruthy();
    expect(screen.queryByText("ZZ-2026-041")).toBeNull();
    expect(screen.queryByText("ZZQ7-K2M9")).toBeNull();
    expect(screen.queryByText("ZZ Meera is on the roll.")).toBeNull();
    expect(screen.getByRole("button", { name: "Admit to the roll" })).toBeTruthy();
  });
});

describe("the walk-in form after a send", () => {
  it("TA-162: the next family's form opens empty, not with the last family's phone, email, address and PEN", async () => {
    mockNav.set({ cycleId: CYCLE });
    await mountStaff(
      <ToastProvider>
        <ApplicationNew />
      </ToastProvider>,
      "ADMIN",
      { "GET /api/v1/office/admissions/cycles": () => json(CYCLES_VIEW), "POST /api/v1/office/admissions/applications": () => json(application({ id: A1 })) },
    );
    await fireEvent.press(await screen.findByRole("radio", { name: "2 · 3 seats" }));
    await fireEvent.changeText(screen.getByLabelText("Child's name"), "ZZ Kabir");
    await fireEvent.changeText(screen.getByLabelText("UDISE+ PEN (if the child has one)"), "27250100101");
    await fireEvent.changeText(screen.getByLabelText("Applicant"), "ZZ Parent");
    await fireEvent.changeText(screen.getByLabelText("Phone"), "+91 98765 00000");
    await fireEvent.changeText(screen.getByLabelText("Email"), "zz.parent@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Home address"), "1 ZZ Road");
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/application", params: { id: A1 } }));
    for (const label of ["Child's name", "UDISE+ PEN (if the child has one)", "Applicant", "Phone", "Email", "Home address"]) expect(await screen.findByLabelText(label)).toHaveDisplayValue("");
  });

  it("TA-162: the next incident opens empty after a record", async () => {
    mockNav.set({ membershipId: "czz000000000000000pupil1", name: "ZZ Asha" });
    const created = {
      id: "czz0000000000000000000inc1",
      studentMembershipId: "czz000000000000000pupil1",
      studentName: "ZZ Asha",
      className: "ZZ 5A",
      reportedByName: "ZZ Head",
      kind: "INJURY",
      severity: "MINOR",
      occurredAt: "2026-09-18T05:00:00.000Z",
      place: "",
      title: "ZZ grazed knee",
      body: "ZZ fell in the playground.",
      actionTaken: "",
      guardiansNotifiedAt: "2026-09-18T05:01:00.000Z",
      status: "OPEN",
      closedAt: null,
      closedByName: null,
      notes: [],
      canNote: true,
      canClose: true,
    };
    await mountStaff(
      <ToastProvider>
        <StaffIncidentNew />
      </ToastProvider>,
      "TEACHER",
      { "POST /api/v1/staff/incidents": () => json(created) },
    );
    await fireEvent.changeText(await screen.findByLabelText("In one line"), "ZZ grazed knee");
    await fireEvent.changeText(screen.getByLabelText("What happened"), "ZZ fell in the playground.");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    await openAgainWith({ membershipId: "czz000000000000000pupil2", name: "ZZ Bela" });
    expect(await screen.findByLabelText("In one line")).toHaveDisplayValue("");
    expect(screen.getByLabelText("What happened")).toHaveDisplayValue("");
  });

  it("TA-162: the notice just sent leaves the form, so one press does not send it again", async () => {
    mockNav.set({});
    await mountStaff(
      <ToastProvider>
        <MessagingNew />
      </ToastProvider>,
      "ADMIN",
      {
        "POST /api/v1/messaging/broadcasts": () => json({ broadcastId: "czz00000000000000000bc001", recipients: 3, queued: 3, skipped: 0, pushed: 0 }, 201),
      },
    );
    await fireEvent.changeText(await screen.findByLabelText("Label (for your records)"), "ZZ Holiday");
    await fireEvent.changeText(screen.getByLabelText("The notice"), "ZZ School is closed on Monday.");
    await fireEvent.press(screen.getByRole("button", { name: "Send now" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    expect(await screen.findByLabelText("The notice")).toHaveDisplayValue("");
    expect(screen.getByLabelText("Label (for your records)")).toHaveDisplayValue("");
  });
});

describe("the certificate form opened again", () => {
  const ASHA = "czz000000000000000pupil1";
  const BELA = "czz000000000000000pupil2";
  const CHETAN = "czz000000000000000pupil3";
  const TC = "czz0000000000000000tpl02";
  const BONAFIDE = "czz0000000000000000tpl01";
  const REQ1 = "czz000000000000000000req1";
  const LAYOUT = { showLogo: true, showAddress: true, useBrandColour: false, signatureLeft: "Office", signatureRight: "Principal", footerNote: null, paper: "A4" };
  const template = (id: string, kind: string, name: string) => ({ id, kind, name, locale: "en", title: name, intro: "", rows: [], outro: "", layout: LAYOUT, serialPrefix: kind, active: true, issuedCount: 0, updatedAt: "2026-09-01T05:00:00.000Z" });
  const record = (id: string, name: string) => ({ studentMembershipId: id, studentName: name, className: "ZZ 5A", studentCode: `ZZ-${name}`, birthdate: "2016-03-14", record: null, missing: [], missingForFiling: [], complete: true, canEdit: true, penEditable: true, penChange: null });
  const issued = (id: string, name: string) => ({
    id: "czz00000000000000000cert1",
    kind: "TC",
    locale: "en",
    serial: "TC/2026-27/0001",
    title: "ZZ Transfer",
    intro: "",
    rows: [],
    outro: "",
    layout: LAYOUT,
    purpose: null,
    remark: null,
    studentMembershipId: id,
    studentName: name,
    className: "ZZ 5A",
    school: { name: "ZZ School", code: "ZZ", logoPath: null, addressLine: null, city: null, region: null, postalCode: null, contactPhone: null, contactEmail: null, brandPrimary: null },
    code: "ZZQ7-K2M9",
    issuedAt: "2026-09-18T05:00:00.000Z",
    issuedByName: "ZZ Head",
    revokedAt: null,
    revokedReason: null,
    missing: [],
    canRevoke: true,
  });
  const request = { id: REQ1, studentMembershipId: BELA, studentName: "ZZ Bela", className: "ZZ 5B", kind: "BONAFIDE", purpose: "ZZ bus pass", status: "PENDING", requestedByName: "ZZ Parent", certificateId: null, serial: null, declineReason: null, decidedAt: null, createdAt: "2026-09-12T05:00:00.000Z" };
  const answers = (queue: unknown[]) => ({
    "GET /api/v1/office/certificate-requests": () => json({ items: queue, pending: queue.length }),
    "GET /api/v1/office/certificate-templates": () => json({ templates: [template(BONAFIDE, "BONAFIDE", "ZZ Bonafide"), template(TC, "TC", "ZZ Transfer")], presets: [], placeholders: [] }),
    [`GET /api/v1/office/pupil-records/${ASHA}`]: () => json(record(ASHA, "ZZ Asha")),
    [`GET /api/v1/office/pupil-records/${BELA}`]: () => json(record(BELA, "ZZ Bela")),
    [`GET /api/v1/office/pupil-records/${CHETAN}`]: () => json(record(CHETAN, "ZZ Chetan")),
    "POST /api/v1/office/certificates": (({ init }) => {
      const body = JSON.parse(String(init.body)) as { studentMembershipId: string };
      return json(issued(body.studentMembershipId, "ZZ"));
    }) as Answer,
  });

  it("TA-157: the next pupil's form opens with no template, purpose, remark or leaving date of the last", async () => {
    mockNav.set({ membershipId: ASHA });
    await mountStaff(
      <ToastProvider>
        <CertificateIssue />
      </ToastProvider>,
      "ADMIN",
      answers([]),
    );
    await screen.findByRole("header", { name: "ZZ Asha" });
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Transfer · English" }));
    await fireEvent.changeText(screen.getByLabelText("Purpose"), "ZZ moving town");
    await fireEvent.changeText(screen.getByLabelText("Remark"), "ZZ good conduct");
    await fireEvent.changeText(screen.getByLabelText("Date of leaving"), "2026-09-30");
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    await openAgainWith({ membershipId: BELA });
    expect(await screen.findByRole("header", { name: "ZZ Bela" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Transfer · English" })).not.toBeChecked();
    expect(screen.getByLabelText("Purpose")).toHaveDisplayValue("");
    expect(screen.getByLabelText("Remark")).toHaveDisplayValue("");
    expect(screen.queryByLabelText("Date of leaving")).toBeNull();
  });

  it("TA-157: after 'Issue this', the form opened for another pupil is that pupil's and carries no request", async () => {
    mockNav.set({});
    const { calls } = await mountStaff(
      <ToastProvider>
        <CertificateIssue />
      </ToastProvider>,
      "ADMIN",
      answers([request]),
    );
    await screen.findByText("Requests from families");
    await fireEvent.press(screen.getAllByRole("button", { name: "Issue this" })[0]!);
    expect(await screen.findByRole("header", { name: "ZZ Bela" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/office/certificates")).toHaveLength(1));
    await openAgainWith({ membershipId: CHETAN });
    expect(await screen.findByRole("header", { name: "ZZ Chetan" })).toBeTruthy();
    expect(screen.queryByRole("header", { name: "ZZ Bela" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Bonafide · English" }));
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/office/certificates")).toHaveLength(2));
    expect(calls().filter((c) => c.line === "POST /api/v1/office/certificates")[1]!.body).toEqual({ templateId: BONAFIDE, studentMembershipId: CHETAN });
  });
});

describe("copy to sister sections after a change of class", () => {
  const P1 = { id: "p1", name: "Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1, archivedAt: null };
  const CLASSES = [
    { id: "c1", name: "ZZ Class 5 A", gradeLevel: "5", section: "A", room: null },
    { id: "c2", name: "ZZ Class 5 B", gradeLevel: "5", section: "B", room: null },
    { id: "c4", name: "ZZ Class 6 A", gradeLevel: "6", section: "A", room: null },
    { id: "c5", name: "ZZ Class 6 B", gradeLevel: "6", section: "B", room: null },
  ];
  const week = (classId: string, className: string) =>
    adminTimetableSchema.parse({
      periods: [P1],
      classes: CLASSES,
      selectedClassId: classId,
      grid: {
        periods: [P1],
        days: [{ weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: true }],
        slots: [{ id: `s-${classId}`, classId, className, periodId: "p1", weekday: 1, subject: "ZZ Maths", room: null, teacherMembershipId: null, teacherName: null, coveringMembershipId: null, coveringName: null, uncovered: false, borrowed: false }],
      },
      staff: [],
      busy: {},
    });

  it("TA-158: a switch left on for the class shown before is not sent with the next class's copy", async () => {
    mockNav.set({ classId: "c1" });
    const { calls } = await mountStaff(
      <ToastProvider>
        <TimetableEditor />
      </ToastProvider>,
      "ADMIN",
      {
        "GET /api/v1/admin/timetable": ({ url }) => json(url.searchParams.get("classId") === "c4" ? week("c4", "ZZ Class 6 A") : week("c1", "ZZ Class 5 A")),
        "POST /api/v1/office/timetable/copy": () => json({ copied: 1, unstaffed: 1, classes: [{ classId: "c5", className: "ZZ Class 6 B", copied: 1 }] }),
      },
    );
    await fireEvent.press(await screen.findByRole("switch", { name: "ZZ Class 5 B" }));
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Class 6 A" }));
    await fireEvent.press(await screen.findByRole("switch", { name: "ZZ Class 6 B" }));
    await fireEvent.press(screen.getByRole("button", { name: "Copy the week" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Copy the week ZZ Class 6 A" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/office/timetable/copy")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/copy")?.body).toEqual({ fromClassId: "c4", toClassIds: ["c5"] });
  });
});

describe("the head's notes, a class's staffing and the expulsions desk opened again", () => {
  it("TA-162: an appraisal draft left open for one member of staff is not there, nor saved, for the next", async () => {
    const ASHA = "czz0000000000000000st1";
    const BELA = "czz0000000000000000st2";
    const view = (staffMembershipId: string, name: string) => ({ staffMembershipId, name, role: "TEACHER", year: "2026–27", canEdit: true, items: [] });
    mockNav.set({ membershipId: ASHA });
    await mountStaff(
      <ToastProvider>
        <StaffAppraisal />
      </ToastProvider>,
      "PRINCIPAL",
      { [`GET ${appraisalsPath(ASHA)}`]: () => json(view(ASHA, "ZZ Asha")), [`GET ${appraisalsPath(BELA)}`]: () => json(view(BELA, "ZZ Bela")) },
    );
    expect(await screen.findByText("ZZ Asha: observations and appraisal")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Add an entry" })[0]!);
    await fireEvent.changeText(screen.getByLabelText("What you saw or agreed"), "ZZ about Asha's lesson");
    await openAgainWith({ membershipId: BELA });
    expect(await screen.findByText("ZZ Bela: observations and appraisal")).toBeTruthy();
    expect(screen.queryByLabelText("What you saw or agreed")).toBeNull();
    await fireEvent.press(screen.getAllByRole("button", { name: "Add an entry" })[0]!);
    expect(screen.getByLabelText("What you saw or agreed")).toHaveDisplayValue("");
  });

  it("TA-162: a pick, a take-off and an archive left open on one class do not carry to the next", async () => {
    const klass = (id: string, name: string) => ({ id, name, color: null, archived: false });
    const history = (id: string, name: string) => ({ classes: [klass(id, name)], month: "2026-09", history: { class: klass(id, name), month: "2026-09", days: [], pupils: [], percent: null } });
    const office = (id: string, name: string) => ({ id, name, subject: null, gradeLevel: "6", section: id === "c1" ? "A" : "B", room: null, color: null, joinCode: `ZZ${id}`, archivedAt: null, pupils: 0, teachers: [{ membershipId: "m2", name: "ZZ Teacher", role: "LEAD" }], leaderless: false });
    const member = (membershipId: string, name: string) => ({ membershipId, role: "TEACHER", name, preferredName: null, avatarKey: null, subjects: [], staffRecord: null, leadClasses: [], balance: null });
    mockNav.set({ classId: "c1" });
    await mountStaff(
      <ToastProvider>
        <StaffClassDetail />
      </ToastProvider>,
      "ADMIN",
      {
        "GET /api/v1/admin/attendance/history": ({ url }) => json(url.searchParams.get("classId") === "c2" ? history("c2", "ZZ Class B") : history("c1", "ZZ Class A")),
        "GET /api/v1/admin/classes": () => json({ classes: [office("c1", "ZZ Class A"), office("c2", "ZZ Class B")], activeCount: 2, archivedCount: 0, leaderlessCount: 0 }),
        "GET /api/v1/admin/staff": () => json({ staff: [member("m2", "ZZ Teacher"), member("m5", "ZZ New Teacher")], total: 2, roleCounts: [], subjectOptions: [] }),
      },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Add a teacher" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ New Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Take ZZ Teacher off this class" }));
    await fireEvent.press(screen.getByRole("button", { name: "Archive class" }));
    expect(screen.getByRole("button", { name: "Archive: ZZ Class A" })).toBeTruthy();
    await openAgainWith({ classId: "c2" });
    expect(await screen.findByText("Grade 6 · Section B")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive: ZZ Class B" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "ZZ New Teacher" })).toBeNull();
    expect(screen.queryAllByRole("button", { name: "Cancel" })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Add a teacher" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archive class" })).toBeTruthy();
  });

  const atCollege = (role: "PRINCIPAL" | "WARDEN") => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules: ["HOSTEL"], institutionKind: "COLLEGE" });
  const expulsion = (id: string, name: string) => ({ id, allotmentId: `al-${id}`, membershipId: `m-${id}`, name, hostelName: "ZZ Boys hostel", roomNumber: "12", reason: "ZZ repeated ragging after a warning", incidentId: null, effectiveOn: "2026-10-20", status: "ASKED", proposedByName: "ZZ Warden", proposedAt: "2026-10-04T05:00:00.000Z", decidedAt: null, decisionNote: null });

  it("TA-162: a note typed for one boarder and cancelled is not sent with the next boarder's decision", async () => {
    mockNav.set({});
    const { calls } = await mountStaff(
      <ExpulsionsScreen />,
      "PRINCIPAL",
      { "GET /api/v1/hostel/expulsions": () => json({ items: [expulsion("e1", "ZZ Rohan"), expulsion("e2", "ZZ Sohan")], canPropose: false, canDecide: true }), "POST /api/v1/hostel/expulsions/e2/decide": () => json({ ok: true }) },
      { me: atCollege("PRINCIPAL") },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Refuse: ZZ Rohan" }));
    await fireEvent.changeText(screen.getByLabelText("Note (optional)"), "ZZ Rohan's hearing is not over");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    await fireEvent.press(screen.getByRole("button", { name: "Approve: ZZ Sohan" }));
    expect(screen.getByLabelText("Note (optional)")).toHaveDisplayValue("");
    await fireEvent.press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/hostel/expulsions/e2/decide")?.body).toEqual({ approve: true, note: "" }));
  });

  it("TA-162: after a proposal the next one opens with no boarder's name in the search", async () => {
    mockNav.set({});
    await mountStaff(
      <ExpulsionsScreen />,
      "WARDEN",
      {
        "GET /api/v1/hostel/expulsions": () => json({ items: [], canPropose: true, canDecide: false }),
        "GET /api/v1/hostel/boarders": () => json({ items: [{ allotmentId: "al1", membershipId: "m1", name: "ZZ Rohan", className: null, hostelId: "h1", hostelName: "ZZ Boys hostel", roomId: "r1", roomNumber: "12", bed: 2, fromDate: "2026-07-01", toDate: null, onLeave: false, feeDemandId: null }] }),
        "POST /api/v1/hostel/expulsions": () => json(expulsion("e1", "ZZ Rohan")),
      },
      { me: atCollege("WARDEN") },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Propose an expulsion" }));
    await fireEvent.changeText(screen.getByLabelText("Boarder"), "roh");
    await fireEvent.press(await screen.findByText("ZZ Rohan"));
    await fireEvent.changeText(screen.getByLabelText("The reason"), "ZZ repeated ragging after a warning");
    await fireEvent.press(screen.getByRole("button", { name: "Send to the principal" }));
    expect(await screen.findByText("Proposed. The principal is told.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Propose an expulsion" }));
    expect(screen.getByLabelText("Boarder")).toHaveDisplayValue("");
    expect(screen.getByLabelText("The reason")).toHaveDisplayValue("");
  });
});
