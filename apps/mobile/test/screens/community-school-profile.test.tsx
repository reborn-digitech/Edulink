import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { communitySchoolProfileSchema } from "@edulink/contracts";
import { SchoolProfile } from "@/screens/shared/school-profile";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "czz000000000000000school1";
const POSTING = "czz0000000000000posting01";
const PATH = `/api/v1/community/schools/${ID}`;
const ASK = "/api/v1/shared/enquiries";
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const PROFILE = communitySchoolProfileSchema.parse({
  schoolId: ID,
  name: "ZZ Hillside",
  city: "Pune",
  region: "Maharashtra",
  country: "India",
  addressLine: "1 ZZ Road",
  postalCode: "411001",
  website: "https://zz-hillside.test",
  logoPath: null,
  gradeLow: "1",
  gradeHigh: "10",
  about: "ZZ A school on a hill.",
  openVacancies: 1,
  ours: false,
  published: true,
  verified: true,
  sinceYear: 2019,
  metrics: { pupils: 420, teachers: 31, classes: 14 },
  achievements: [{ competitionTitle: "ZZ Maths Olympiad", bestRank: 2, participants: 12 }],
  highlights: [{ id: "h1", title: "ZZ Sports day", category: "EVENT", createdAt: hourAgo }],
  canEnquire: true,
  vacancies: [{ id: POSTING, title: "ZZ Physics teacher", employmentType: "PART_TIME", createdAt: hourAgo }],
  myEnquiryId: null,
});

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { schoolId: ID };
});

describe("a school's profile", () => {
  it("loads the school in the route: where it is, its counts, its words, standings, posts and vacancies", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PROFILE));
    await screen.findByText("ZZ Hillside");
    expect(screen.getByText("1 ZZ Road, Pune, Maharashtra, 411001, India")).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByLabelText("Pupils: 420")).toBeTruthy();
    expect(screen.getByLabelText("Teachers: 31")).toBeTruthy();
    expect(screen.getByLabelText("Since: 2019")).toBeTruthy();
    expect(screen.getByText("ZZ A school on a hill.")).toBeTruthy();
    expect(screen.getByText("Grades 1–10")).toBeTruthy();
    expect(screen.getByText("Best place: 2 · 12 entrants")).toBeTruthy();
    expect(screen.getByText("ZZ Sports day")).toBeTruthy();
    expect(screen.getByText("ZZ Physics teacher")).toBeTruthy();
    expect(screen.getByText("Part-time · Posted 1 hour ago")).toBeTruthy();
    // A guardian reads the vacancy list but does not open a post: that screen is the staff's.
    expect(screen.queryByRole("button", { name: /^ZZ Physics teacher/ })).toBeNull();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
  });

  it("the website opens in the browser", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: () => json(PROFILE) });
    await fireEvent.press(await screen.findByRole("button", { name: "Website, https://zz-hillside.test" }));
    expect(open).toHaveBeenCalledWith("https://zz-hillside.test");
    open.mockRestore();
  });

  it("a guardian asks about admission; the conversation then lives in Enquiries and the profile points at it", async () => {
    let asked = false;
    const { calls } = await mountStaff(<SchoolProfile />, "PARENT", {
      [`GET ${PATH}`]: () => json(asked ? { ...PROFILE, myEnquiryId: "czz000000000000enquiry001" } : PROFILE),
      [`POST ${ASK}`]: () => {
        asked = true;
        return json({ enquiryId: "czz000000000000enquiry001" }, 201);
      },
    });
    expect(await screen.findByText(/^Your question goes to the person this school has chosen for admissions\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send enquiry" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Write a message…"), "  Is there a place in Year 4?  ");
    await fireEvent.press(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByText("Your enquiry with this school")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${ASK}`)?.body).toEqual({ schoolId: ID, kind: "ADMISSION", body: "Is there a place in Year 4?" });
    await fireEvent.press(screen.getByRole("button", { name: "Open the conversation" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "czz000000000000enquiry001" } });
  });

  it("a refused enquiry is the server's sentence under the box, and what was typed stays", async () => {
    await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: () => json(PROFILE), [`POST ${ASK}`]: refused("This school is not taking enquiries right now.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), "Is there a place?");
    await fireEvent.press(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByText("This school is not taking enquiries right now.")).toBeTruthy();
    expect(screen.getByLabelText("Write a message…")).toHaveDisplayValue("Is there a place?");
  });

  it("staff read it without the admissions door, and a vacancy opens its own screen", async () => {
    await mountStaff(<SchoolProfile />, "TEACHER", { [`GET ${PATH}`]: () => json({ ...PROFILE, canEnquire: false, website: null, about: "", achievements: [], highlights: [] }) });
    await screen.findByText("ZZ Hillside");
    expect(screen.getByText("The school has not written about itself yet.")).toBeTruthy();
    expect(screen.queryByText("Admissions")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send enquiry" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Physics teacher, / }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/vacancy", params: { postingId: POSTING } });
  });

  it("a refusal is an alert with a retry; no id is an error that asks nothing", async () => {
    const { calls } = await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: refused("ZZ no such school", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no such school");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
    mockRouter.params = {};
    const second = await mountStaff(<SchoolProfile />, "PARENT", {});
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent(/That link did not work/);
    expect(second.calls().some((c) => c.line.startsWith("GET /api/v1/community"))).toBe(false);
  });
});

describe("applying from a school's profile", () => {
  const ADMISSIONS = `GET /api/v1/shared/schools/${ID}/admissions`;
  const CYCLE = "czz000000000000000cycle1";
  const APP = "czz00000000000000000app1";
  const OPEN = { cycleId: CYCLE, name: "ZZ Admissions 2026-27", academicYearName: "2026-27", grades: [{ grade: "1", seats: 5, remaining: 3 }], documents: [], testRequired: false, notice: "", closesAt: "2026-12-31" };
  const MINE = [{ id: APP, serial: "ADM/2026-27/0001", status: "OFFERED", childName: "ZZ Kabir", gradeApplied: "1", applicantName: "ZZ Parent", cycleName: "ZZ Admissions 2026-27", schoolName: "ZZ Hillside", documentsMissing: 0, testBooked: true, createdAt: hourAgo, updatedAt: hourAgo }];

  it("a guardian sees the open cycle with its seats and the door to the form, and their own applications here", async () => {
    await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: () => json(PROFILE), [ADMISSIONS]: () => json({ open: OPEN, mine: MINE }) });
    expect(await screen.findByText("Apply for a place")).toBeTruthy();
    expect(screen.getByText("ZZ Admissions 2026-27 · 2026-27")).toBeTruthy();
    expect(screen.getByText("Grade 1 · 3 of 5 seats left")).toBeTruthy();
    expect(screen.getByText(/^Closes .*2026$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Apply: ZZ Admissions 2026-27" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/apply", params: { schoolId: ID, school: "ZZ Hillside", cycleId: CYCLE } });
    expect(screen.getByText("Your applications here")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Kabir/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/my-application", params: { id: APP } });
  });

  // QA-17 (24 Oct 2026): a mid-year round beside next year's admissions; only the newest was offered.
  it("every open cycle is shown, each with its own door to the form", async () => {
    const MID = { ...OPEN, cycleId: "czz000000000000000cycle2", name: "ZZ Mid-year transfers", grades: [{ grade: "5", seats: 2, remaining: 2 }], closesAt: null };
    await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: () => json(PROFILE), [ADMISSIONS]: () => json({ open: MID, cycles: [MID, OPEN], mine: [] }) });
    expect(await screen.findByText("ZZ Mid-year transfers · 2026-27")).toBeTruthy();
    expect(screen.getByText("ZZ Admissions 2026-27 · 2026-27")).toBeTruthy();
    expect(screen.getByText("Grade 5 · 2 of 2 seats left")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Apply: ZZ Admissions 2026-27" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/apply", params: { schoolId: ID, school: "ZZ Hillside", cycleId: CYCLE } });
    await fireEvent.press(screen.getByRole("button", { name: "Apply: ZZ Mid-year transfers" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/apply", params: { schoolId: ID, school: "ZZ Hillside", cycleId: MID.cycleId } });
  });

  it("with no open cycle there is no door, and the office is never asked", async () => {
    const { calls } = await mountStaff(<SchoolProfile />, "PARENT", { [`GET ${PATH}`]: () => json(PROFILE), [ADMISSIONS]: () => json({ open: null, mine: [] }) });
    await screen.findByText("ZZ Hillside");
    await waitFor(() => expect(calls().some((c) => c.line === ADMISSIONS)).toBe(true));
    expect(screen.queryByText("Apply for a place")).toBeNull();
    const staff = await mountStaff(<SchoolProfile />, "ADMIN", { [`GET ${PATH}`]: () => json(PROFILE) });
    await screen.findAllByText("ZZ Hillside");
    expect(staff.calls().some((c) => c.line === ADMISSIONS)).toBe(false);
  });
});
