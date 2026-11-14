import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import type { RoleCode } from "@edulink/contracts";
import { CollegeRoleHome } from "@/screens/college/role-home";
import { RecruiterHome } from "@/screens/recruiter/home";
import { StudentConsentScreen } from "@/screens/college/consent";
import { InvitePeople } from "@/screens/staff/invites";
import { More } from "@/screens/shared/more";
import RecruiterRegister from "@/app/(auth)/recruiter-register";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me for a role at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[], institutionKind = "COLLEGE") => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind });

const GRANTS = ["ATTENDANCE", "RESULTS", "MONEY", "HOSTEL_TRANSPORT", "PLACEMENT", "MESSAGES"] as const;
// A grant is one guardian's since TA-555 (the owner's decision of 14 November 2026): the list comes guardian by guardian.
const lines = (applies: boolean, on: string[]) => GRANTS.map((grant) => ({ grant, on: !applies || on.includes(grant), grantedAt: on.includes(grant) ? "2026-10-04T05:00:00.000Z" : null }));
const guardian = (id: string, name: string, relation: string, applies: boolean, on: string[]) => ({ guardianshipId: id, name, relation, since: "2026-06-12T05:00:00.000Z", grants: lines(applies, on) });
const consent = (applies: boolean, on: string[] = [], extra: { secondOn?: string[]; claims?: { id: string; claimantName: string; relation: string; createdAt: string }[] } = {}) => ({
  applies,
  grants: lines(applies, on),
  guardians: [guardian("g1", "ZZ Sunil Pathak", "PARENT", applies, on), ...(extra.secondOn ? [guardian("g2", "ZZ Meena Pathak", "GUARDIAN", applies, extra.secondOn)] : [])],
  claims: extra.claims ?? [],
});

describe("a college staff role's home (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("says the screens are coming while the role's module is on, with the college's feed and the account", async () => {
    await mountStaff(<CollegeRoleHome role="FACULTY" />, "FACULTY", {}, { me: atCollege("FACULTY", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("The Faculty screens are on their way")).toBeTruthy();
    expect(screen.getByText("Your Faculty home at ZZ Vidya College.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Read the college's feed" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
    await fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

  it("says the module is off at a college that has not switched it on, in the college's words", async () => {
    await mountStaff(<CollegeRoleHome role="TPO" />, "TPO", {}, { me: atCollege("TPO", ["ALUMNI", "ACADEMICS"], "AUTONOMOUS_COLLEGE") });
    expect(await screen.findByText("Placement is not switched on")).toBeTruthy();
    expect(screen.getByText(/This college has not switched on Placement/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
  });

  it("never says the module is off to accounts, which hangs on none", async () => {
    await mountStaff(<CollegeRoleHome role="ACCOUNTS" />, "ACCOUNTS", {}, { me: atCollege("ACCOUNTS", ["ALUMNI"]) });
    expect(await screen.findByText("The Accounts screens are on their way")).toBeTruthy();
  });

  it("offers my own leave in More and no search; the college's feed is a tab now, not repeated here", async () => {
    await mountStaff(<More />, "HOD", {}, { me: atCollege("HOD", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByRole("button", { name: "Leave" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Social Media" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
  });
});

describe("the recruiter (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("is greeted by the company, told no college has invited them yet, and asked to confirm their address", async () => {
    await mountStaff(<RecruiterHome />, "RECRUITER", { "GET /api/v1/recruiter/me": () => json({ name: "ZZ Nikhil Rao", companyName: "ZZ Zeta Analytics", createdAt: "2026-10-04T05:00:00.000Z", emailVerified: false }) }, { me: { ...me("RECRUITER"), contexts: [], active: { schoolId: null, role: "RECRUITER", membershipId: null } } });
    expect(await screen.findByText("Recruiting for ZZ Zeta Analytics")).toBeTruthy();
    expect(screen.getByText("No drives yet")).toBeTruthy();
    expect(screen.getByText(/Confirm your email address/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

});

describe("what an adult student lets their family see (4 Oct 2026)", () => {
  it("lists the six grants for the guardian, and grants one to them with a press", async () => {
    let on: string[] = [];
    const { calls } = await mountStaff(<StudentConsentScreen />, "STUDENT", {
      "GET /api/v1/student/consent": () => json(consent(true, on)),
      "POST /api/v1/student/consent": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { grant: string; on: boolean };
        on = body.on ? [...on, body.grant] : on.filter((g) => g !== body.grant);
        return json(consent(true, on));
      },
    }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("ZZ Sunil Pathak")).toBeTruthy();
    expect(screen.getByText("Parent · Linked 12/06/2026")).toBeTruthy();
    expect(screen.getByText("Results")).toBeTruthy();
    const grants = screen.getAllByRole("button", { name: /^Let them see it: / });
    expect(grants).toHaveLength(6);
    await fireEvent.press(screen.getByRole("button", { name: "Let them see it: Results, ZZ Sunil Pathak" }));
    expect(await screen.findByRole("button", { name: "Stop sharing: Results, ZZ Sunil Pathak" })).toBeTruthy();
    expect(screen.getByText("ZZ Sunil Pathak can see it now.")).toBeTruthy();
    // TA-555: the grant names the guardian it is given to.
    expect(calls().find((c) => c.line === "POST /api/v1/student/consent")?.body).toEqual({ grant: "RESULTS", on: true, guardianshipId: "g1" });
  });

  it("TA-555: each guardian has their own buttons, and a grant to one is sent for that one alone", async () => {
    const { calls } = await mountStaff(<StudentConsentScreen />, "STUDENT", {
      "GET /api/v1/student/consent": () => json(consent(true, ["RESULTS"], { secondOn: [] })),
      "POST /api/v1/student/consent": () => json(consent(true, ["RESULTS"], { secondOn: ["MONEY"] })),
    }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("ZZ Meena Pathak")).toBeTruthy();
    expect(screen.getByText("Each guardian has their own switches. A guardian linked later starts with nothing.")).toBeTruthy();
    // The first guardian holds RESULTS; the second, linked later, holds nothing.
    expect(screen.getByRole("button", { name: "Stop sharing: Results, ZZ Sunil Pathak" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Let them see it: Results, ZZ Meena Pathak" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Let them see it: Fees and money, ZZ Meena Pathak" }));
    expect(await screen.findByRole("button", { name: "Stop sharing: Fees and money, ZZ Meena Pathak" })).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/student/consent")?.body).toEqual({ grant: "MONEY", on: true, guardianshipId: "g2" });
  });

  it("TA-555: ending a guardian's link is asked about first, and nothing is sent until confirmed", async () => {
    const { calls } = await mountStaff(<StudentConsentScreen />, "STUDENT", {
      "GET /api/v1/student/consent": () => json(consent(true, ["RESULTS"], { secondOn: [] })),
      "POST /api/v1/student/guardians/g2/end": () => json(consent(true, ["RESULTS"])),
    }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "End ZZ Meena Pathak's link" }));
    expect(calls().some((c) => c.line === "POST /api/v1/student/guardians/g2/end")).toBe(false);
    expect(screen.getByText(/^End ZZ Meena Pathak's link\? They will stop seeing anything of yours at once/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().some((c) => c.line === "POST /api/v1/student/guardians/g2/end")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "End ZZ Meena Pathak's link" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "End ZZ Meena Pathak's link" })[0]!);
    expect(await screen.findByText("ZZ Meena Pathak is no longer linked to you.")).toBeTruthy();
    expect(screen.queryByText("ZZ Meena Pathak")).toBeNull();
    expect(calls().filter((c) => c.line === "POST /api/v1/student/guardians/g2/end")).toHaveLength(1);
  });

  it("TA-555: somebody asking to be the student's guardian waits for the student's own yes or no", async () => {
    const claims = [{ id: "k1", claimantName: "ZZ Arvind Rao", relation: "OTHER", createdAt: "2026-11-13T05:00:00.000Z" }];
    const { calls } = await mountStaff(<StudentConsentScreen />, "STUDENT", {
      "GET /api/v1/student/consent": () => json(consent(true, [], { claims })),
      "POST /api/v1/student/guardian-claims/k1/decide": () => json(consent(true, [])),
    }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("Asking to be your guardian")).toBeTruthy();
    expect(screen.getByText("ZZ Arvind Rao")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ Arvind Rao" }));
    expect(await screen.findByText("You declined ZZ Arvind Rao's request.")).toBeTruthy();
    expect(screen.queryByText("Asking to be your guardian")).toBeNull();
    expect(calls().find((c) => c.line === "POST /api/v1/student/guardian-claims/k1/decide")?.body).toEqual({ decision: "DECLINE" });
  });

  it("tells a minor their guardians see everything, with no button", async () => {
    await mountStaff(<StudentConsentScreen />, "STUDENT", { "GET /api/v1/student/consent": () => json(consent(false)) }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText(/Your guardians see all of this without asking/)).toBeTruthy();
    expect(screen.getByText("Your guardians: ZZ Sunil Pathak.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Let them see it/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^End / })).toBeNull();
  });

  it("says so when a grant is refused", async () => {
    await mountStaff(<StudentConsentScreen />, "STUDENT", {
      "GET /api/v1/student/consent": () => json(consent(true)),
      "POST /api/v1/student/consent": () => json({ error: "Your guardians already see everything; there is nothing to grant.", code: "FORBIDDEN" }, 403),
    }, { me: atCollege("STUDENT", ["ALUMNI", "ACADEMICS"]) });
    const grants = await screen.findAllByRole("button", { name: /^Let them see it: / });
    await fireEvent.press(grants[0]!);
    expect(await screen.findByText("Your guardians already see everything; there is nothing to grant.")).toBeTruthy();
  });
});

describe("inviting at a college (4 Oct 2026)", () => {
  it("offers the college's staff roles and no Teacher", async () => {
    await mountStaff(
      <ToastProvider>
        <InvitePeople />
      </ToastProvider>,
      "ADMIN",
      {
        "GET /api/v1/admin/classes": () => json({ classes: [], activeCount: 0, archivedCount: 0, leaderlessCount: 0 }),
        "GET /api/v1/admin/people/invites": () => json({ invites: [], counts: { PENDING: 0, ACCEPTED: 0, REVOKED: 0 } }),
      },
      { me: atCollege("ADMIN", ["ALUMNI", "ACADEMICS"]) },
    );
    expect(await screen.findByRole("radio", { name: "Faculty" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Exam controller" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Teacher" })).toBeNull();
  });
});

describe("the recruiter's own sign-up (4 Oct 2026)", () => {
  // QA-25 (24 Oct 2026): a form in order is 202 {sent: true} and no session, the same whether or not the address had an account.
  it("registers from the phone: the four fields, the server's refusal under its field, then the one sentence and the way to sign in", async () => {
    let tries = 0;
    mockRouter.back.mockClear();
    const { calls } = await mountStaff(<RecruiterRegister />, "RECRUITER", {
      "POST /api/v1/auth/recruiter/register": () => {
        tries += 1;
        if (tries === 1) return json({ error: "Use a longer password.", code: "BAD_REQUEST", issues: { password: "Use a longer password." } }, 422);
        return json({ sent: true }, 202);
      },
    });
    await fireEvent.changeText(await screen.findByLabelText("Your name"), "ZZ Nikhil Rao");
    await fireEvent.changeText(screen.getByLabelText("Company"), "ZZ Zeta Analytics");
    await fireEvent.changeText(screen.getByLabelText("Work email"), "zz.recruiter@zz.test");
    await fireEvent.changeText(screen.getByLabelText("Password"), "a long zz password");
    await fireEvent.press(screen.getByRole("button", { name: "Create my recruiter account" }));
    expect(await screen.findByText("Use a longer password.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Create my recruiter account" }));
    await waitFor(() => expect(tries).toBe(2));
    expect(calls().find((c) => c.line === "POST /api/v1/auth/recruiter/register")?.body).toMatchObject({ name: "ZZ Nikhil Rao", companyName: "ZZ Zeta Analytics", email: "zz.recruiter@zz.test", device: "Shalaghar app" });
    expect(await screen.findByText("We have sent a message to zz.recruiter@zz.test. Open it to carry on: a new account is confirmed from its link, and then you sign in with your password.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Go to sign in" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
