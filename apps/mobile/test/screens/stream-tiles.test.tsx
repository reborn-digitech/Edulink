import { screen, within } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { Screen } from "@/components";
import { StreamTilesCard } from "@/screens/college/stream-tiles";
import { menuFor } from "@/lib/nav";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/**
 * The college's streams on the phone (5 Oct 2026): the chip under every
 * page's title and the registrar's and principal's tiles in the preset's
 * order, with the stream records' figures and the not-built banner.
 */
const atCollege = (role: RoleCode, streams: string[], modules: string[]) => ({
  ...me(role),
  contexts: [{ schoolId: "s1", schoolName: "ZZ Walk College", role, institutionKind: "COLLEGE" }],
  institutionKind: "COLLEGE",
  modules,
  streams,
});
const corps = { enrolled: 0, activities: 0, camps: 0, participations: 0, students: 0, hours: 0, perStudent: [] };
const summary = (over: Record<string, unknown> = {}) => ({
  year: 2026,
  streams: ["LAW"],
  labs: false,
  law: true,
  education: false,
  practical: { year: 2026, records: 0, signed: 0, unsigned: 0, students: 0, offerings: 0, batches: 0, batchMembers: 0, byCourse: [] },
  lawInternships: { year: 2026, internships: 4, byKind: { COURT: 2, FIRM: 1, LEGAL_AID: 1 }, weeks: 12, students: 3, meetingMinimum: 1, perStudent: [], mootCourts: { total: 2, INTRA: 2, INTER: 0, NATIONAL: 0, participants: 6 } },
  teachingPractice: { year: 2026, practiceSchools: 0, postings: 0, students: 0, lessonsPlanned: 0, lessonsObserved: 0, weeks: 0, minimumWeeks: 20, meetingMinimum: 0, bySchool: [], perStudent: [] },
  corps: { year: 2026, nss: { ...corps, enrolled: 3, hours: 12 }, ncc: corps, hoursPerYear: 120 },
  ...over,
});
const ui = (role: "ADMIN" | "PRINCIPAL") => (
  <Screen title="Overview">
    <StreamTilesCard role={role} />
  </Screen>
);

describe("the college's streams on the phone (5 Oct 2026)", () => {
  it("draws a law college's tiles in the preset's order, with the moot court's figure and the NSS year, and no other stream's", async () => {
    await mountStaff(ui("ADMIN"), "ADMIN", { "GET /api/v1/stream-records/summary": () => json(summary()) }, { me: atCollege("ADMIN", ["LAW"], ["ACADEMICS", "EXAMS", "ADMISSIONS", "SCHOLARSHIPS", "IQAC", "PLACEMENT", "ALUMNI"]) });
    const card = await screen.findByTestId("stream-tiles");
    expect(await within(card).findByText("Moot courts this year: 2")).toBeTruthy();
    const titles = ["People", "Academics", "Exams", "Admissions", "Scholarships", "IQAC and NAAC", "Moot court", "Internships"];
    for (const title of titles) expect(within(card).getByText(title)).toBeTruthy();
    const drawn = within(card).getAllByText(/./).map((n) => String(n.props.children)).filter((text) => titles.includes(text));
    expect(drawn).toEqual(titles);
    for (const other of ["Labs and equipment", "NBA accreditation", "Practice teaching", "Library"]) expect(within(card).queryByText(other)).toBeNull();
    expect(within(card).getByText("NSS this year: enrolled 3 · hours 12")).toBeTruthy();
    expect(screen.queryByTestId("streams-coming")).toBeNull();
  });

  it("puts the streams' chip under the page's title, with the college's name", async () => {
    await mountStaff(ui("PRINCIPAL"), "PRINCIPAL", { "GET /api/v1/stream-records/summary": () => json(summary({ streams: ["ARTS", "SCIENCE"], law: false, labs: true })) }, { me: atCollege("PRINCIPAL", ["ARTS", "SCIENCE"], ["ACADEMICS"]) });
    const chip = await screen.findByTestId("stream-chip");
    expect(within(chip).getByText("Arts · Science")).toBeTruthy();
    expect(within(chip).getByText("ZZ Walk College")).toBeTruthy();
    expect(chip.props.accessibilityLabel).toBe("ZZ Walk College, Streams: Arts · Science");
  });

  it("says a switched-off tile is off and a not-built stream's records are coming", async () => {
    await mountStaff(ui("ADMIN"), "ADMIN", {}, { me: atCollege("ADMIN", ["ARCHITECTURE"], ["ALUMNI"]) });
    const card = await screen.findByTestId("stream-tiles");
    expect(within(card).getByText("Studios and juries")).toBeTruthy();
    expect(within(card).getAllByText("Coming").length).toBe(1);
    expect(within(card).getAllByText("Switched off").length).toBeGreaterThan(0);
    const coming = screen.getByTestId("streams-coming");
    expect(within(coming).getByText("Design studios and their submissions are not kept in the app yet; keep them as you do now.")).toBeTruthy();
  });

  it("draws nothing at a school: no tiles and no chip", async () => {
    await mountStaff(ui("ADMIN"), "ADMIN", {});
    expect(await screen.findByText("Overview")).toBeTruthy();
    expect(screen.queryByTestId("stream-tiles")).toBeNull();
    expect(screen.queryByTestId("stream-chip")).toBeNull();
  });
});

describe("the phone's menu follows the streams (5 Oct 2026)", () => {
  it("offers the practical record at a college that keeps labs and not at a law college; none recorded keeps it", () => {
    const labels = (streams: string[]) => menuFor("FACULTY", ["ACADEMICS", "IQAC"], [], streams).flatMap((g) => g.items.map((i) => i.labelKey as string));
    expect(labels(["SCIENCE"])).toContain("streamRecords.practicals.title");
    expect(labels(["LAW"])).not.toContain("streamRecords.practicals.title");
    expect(labels([])).toContain("streamRecords.practicals.title");
  });
});
