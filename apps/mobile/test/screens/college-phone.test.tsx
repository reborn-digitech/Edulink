import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { HodHomeScreen } from "@/screens/academics/hod";
import { StudentScholarshipsScreen } from "@/screens/college-office/scholarships";
import { ChooseContext } from "@/components/choose-context";
import { More } from "@/screens/shared/more";
import LeaveRoute from "@/app/(app)/leave";
import { json, me, mountStaff } from "./staff-harness";

/**
 * The integration's phone helper (4 Oct 2026): the HOD's results and
 * projects, a student's scholarship document from the phone's picker, the
 * college's name with its kind wherever the phone lists a person's places,
 * and my own leave for the college's and the modules' staff.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));
jest.mock("@/lib/pick-file", () => {
  class PickError extends Error {}
  return { PickError, pickAndUpload: jest.fn() };
});
const pick = (jest.requireMock("@/lib/pick-file") as { pickAndUpload: jest.Mock }).pickAndUpload;

const id = (tag: string) => `c${tag.padEnd(24, "0")}`;
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role, institutionKind: "COLLEGE" }], modules, institutionKind: "COLLEGE" });
const term = { id: id("zzterm1"), name: "ZZ Odd term", academicYear: "2026–27", startsOn: "2026-07-15", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-10-31", registrationOpen: true };
const hodHome = (extra: Record<string, unknown> = {}) => ({ department: { id: id("zzdept1"), code: "PHY", name: "ZZ Physics" }, term, load: [], ratio: [], offerings: [], defaulters: 0, condonationsWaiting: 0, mentoringGroups: 2, mentees: 7, resultsAvailable: false, projects: [], ...extra });
const hodAnswers = (home: unknown) => ({ "GET /api/v1/academics/hod-home": () => json(home), "GET /api/v1/academics/condonations": () => json({ items: [], canDecide: true }) });

beforeEach(() => {
  mockRouter.push.mockClear();
  pick.mockReset();
});

describe("the HOD's results and projects", () => {
  it("shows the term's pass rate, each course, the toppers, the open backlogs and the projects", async () => {
    const results = {
      termName: "ZZ Winter 2026",
      appeared: 40,
      passed: 34,
      passRatePercent: 85,
      byCourse: [
        { key: "PHY101", label: "PHY101 · ZZ Mechanics", appeared: 40, passed: 36, passRatePercent: 90 },
        { key: "PHY102", label: "PHY102 · ZZ Optics", appeared: 40, passed: 32, passRatePercent: 80 },
      ],
      toppers: [
        { studentMembershipId: id("zzs1"), name: "ZZ Ishaan", sgpa: 9.4 },
        { studentMembershipId: id("zzs2"), name: "ZZ Omkar", sgpa: 9.125 },
      ],
      openBacklogs: 3,
    };
    await mountStaff(<HodHomeScreen />, "HOD", hodAnswers(hodHome({ results, projects: [{ title: "ZZ Solar tracker", studentName: "ZZ Medha" }] })), { me: atCollege("HOD", ["ACADEMICS"]) });
    expect(await screen.findByText("ZZ Winter 2026: 34 of 40 passed (85 %).")).toBeTruthy();
    expect(screen.getByText("PHY101 · ZZ Mechanics")).toBeTruthy();
    expect(screen.getByText("36 of 40 · 90 %")).toBeTruthy();
    expect(screen.getByText("32 of 40 · 80 %")).toBeTruthy();
    expect(screen.getByText("Toppers: ZZ Ishaan (9.40), ZZ Omkar (9.13).")).toBeTruthy();
    expect(screen.getByText("Open backlogs among the department's students: 3.")).toBeTruthy();
    expect(screen.getByText("2 mentoring groups, 7 students mentored.")).toBeTruthy();
    expect(screen.getByText("Students' projects")).toBeTruthy();
    expect(screen.getByText("ZZ Solar tracker")).toBeTruthy();
    expect(screen.getByText("ZZ Medha")).toBeTruthy();
  });

  it("says no results are published yet and no projects are listed (results null, or absent from an older server)", async () => {
    await mountStaff(<HodHomeScreen />, "HOD", hodAnswers(hodHome({ results: null })), { me: atCollege("HOD", ["ACADEMICS"]) });
    expect(await screen.findByText(/No results published for the department yet/)).toBeTruthy();
    expect(screen.getByText("None listed yet.")).toBeTruthy();
    expect(screen.queryByText(/^Toppers/)).toBeNull();
  });

  it("reads an answer with no results field as none published", async () => {
    await mountStaff(<HodHomeScreen />, "HOD", hodAnswers(hodHome()), { me: atCollege("HOD", ["ACADEMICS"]) });
    expect(await screen.findByText(/No results published for the department yet/)).toBeTruthy();
  });
});

const claim = (status: string, extra: Record<string, unknown> = {}) => ({
  id: id(`zzclaim${status.toLowerCase().slice(0, 4)}`),
  studentMembershipId: "m1",
  studentName: "ZZ Ishaan Pathak",
  scheme: "OBC_POST_MATRIC",
  academicYear: "2026-27",
  portalApplicationId: "ZZMDBT0001",
  appliedAt: "2026-08-01T00:00:00.000Z",
  expectedPaise: 1_250_000,
  sanctionedPaise: null,
  sanctionedAt: null,
  disbursedPaise: null,
  disbursedAt: null,
  disbursementRef: null,
  status,
  documents: [],
  alumniGiftId: null,
  ageDays: 30,
  ...extra,
});
const mine = (claims: unknown[]) => ({ claims, schemes: [], category: "OBC" });

describe("a scholarship claim's documents from the phone", () => {
  it("picks a file, spends its ticket on the claim with the kind chosen, and says so", async () => {
    const open = claim("APPLIED");
    let docs: unknown[] = [];
    pick.mockResolvedValue({ fileId: id("zzfile1"), mime: "application/pdf", size: 1000, name: "zz-caste.pdf" });
    const { calls } = await mountStaff(
      <StudentScholarshipsScreen />,
      "STUDENT",
      {
        "GET /api/v1/student/scholarships": () => json(mine([{ ...open, documents: docs }])),
        [`POST /api/v1/student/scholarships/${open.id}/documents`]: () => {
          docs = [{ key: "caste", fileId: id("zzfile1"), name: "zz-caste.pdf", uploadedAt: "2026-10-04T05:00:00.000Z" }];
          return json({ ...open, documents: docs });
        },
      },
      { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) },
    );
    expect(await screen.findByText("Add what the portal asks for: a scan or a photo of each paper.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Caste certificate" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    expect(await screen.findByText("Added to the claim. The office sees it there.")).toBeTruthy();
    expect(pick).toHaveBeenCalledWith("document", expect.any(String));
    expect(calls().find((c) => c.line.startsWith("POST"))?.body).toEqual({ key: "caste", fileId: id("zzfile1"), name: "zz-caste.pdf" });
    expect(await screen.findByText("zz-caste.pdf")).toBeTruthy();
  });

  it("does nothing when the picker is closed, and shows the door's refusal", async () => {
    const open = claim("SANCTIONED");
    pick.mockResolvedValueOnce(null);
    const { calls } = await mountStaff(
      <StudentScholarshipsScreen />,
      "STUDENT",
      {
        "GET /api/v1/student/scholarships": () => json(mine([open])),
        [`POST /api/v1/student/scholarships/${open.id}/documents`]: () => json({ error: "That file is not one you uploaded.", code: "FORBIDDEN" }, 403),
      },
      { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Add a document" }));
    await waitFor(() => expect(pick).toHaveBeenCalledTimes(1));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    expect(screen.queryByText("Added to the claim. The office sees it there.")).toBeNull();
    pick.mockResolvedValueOnce({ fileId: id("zzfile2"), mime: "image/jpeg", size: 1000, name: "zz-income.jpg" });
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    expect(await screen.findByText("That file is not one you uploaded.")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("POST"))?.body).toEqual({ key: "income", fileId: id("zzfile2"), name: "zz-income.jpg" });
  });

  it("lists a settled claim's documents by kind and offers no upload", async () => {
    const settled = claim("DISBURSED", { documents: [{ key: "bank_passbook", fileId: id("zzfile3"), name: "zz-passbook.pdf", uploadedAt: "2026-09-01T05:00:00.000Z" }, { key: "unknown_kind", fileId: id("zzfile4"), name: "zz-other.pdf", uploadedAt: "2026-09-01T05:00:00.000Z" }] });
    const lapsed = claim("LAPSED", { id: id("zzclaimlaps2") });
    await mountStaff(<StudentScholarshipsScreen />, "STUDENT", { "GET /api/v1/student/scholarships": () => json(mine([settled, lapsed])) }, { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) });
    expect(await screen.findByText("zz-passbook.pdf")).toBeTruthy();
    expect(screen.getByText("Bank passbook")).toBeTruthy();
    expect(screen.getByText("Other")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add a document" })).toBeNull();
  });
});

describe("a college reads with its kind where the phone lists my places", () => {
  const both = {
    ...me("FACULTY"),
    active: { schoolId: "s1", role: "FACULTY", membershipId: "m1" },
    contexts: [
      { schoolId: "s1", schoolName: "ZZ Vidya College", role: "FACULTY", institutionKind: "COLLEGE" },
      { schoolId: "s2", schoolName: "ZZ School", role: "TEACHER", institutionKind: "SCHOOL" },
    ],
    modules: ["ACADEMICS"],
    institutionKind: "COLLEGE",
  };

  it("in More: the header and the list of places", async () => {
    await mountStaff(<More />, "FACULTY", {}, { me: both });
    expect(await screen.findByText("ZZ Head · Faculty · ZZ Vidya College · College")).toBeTruthy();
    expect(screen.getByText("ZZ Vidya College · College")).toBeTruthy();
    expect(screen.getByText("ZZ School")).toBeTruthy();
  });

  it("on the switcher", async () => {
    await mountStaff(<ChooseContext />, "FACULTY", {}, { me: { ...both, active: { schoolId: null, role: null, membershipId: null } } });
    expect(await screen.findByText("ZZ Vidya College · College")).toBeTruthy();
    expect(screen.getByText("ZZ School")).toBeTruthy();
  });
});

describe("my own leave for the college's and the modules' staff", () => {
  const LEAVE = {
    today: "2026-10-04",
    balance: { entitlement: 12, used: 3, pending: 0, remaining: 9, yearName: "2026-27" },
    requests: [],
    staff: [],
  };
  it.each(["FACULTY", "ACCOUNTS", "LIBRARIAN"] as const)("%s opens the leave form, not the generic screen", async (role) => {
    const { calls } = await mountStaff(<LeaveRoute />, role, { "GET /api/v1/staff/leave": () => json(LEAVE) }, { me: atCollege(role, ["ACADEMICS", "LIBRARY"]) });
    expect(await screen.findByText("3 of 12 days used · 9 left")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/leave")).toBe(true);
  });
});
