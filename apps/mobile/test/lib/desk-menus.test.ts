/**
 * The college desks' More on the phone (5 Oct 2026, the link walk's role audit): the web's NAV gives the IQAC, the
 * TPO and the accounts desk their own pages, and the phone's More gave them only the account, leave, check-in and
 * payslips. Each desk page is now an entry that opens the web signed in, under the module the web's entry carries,
 * so a desk with a module off never sees a link to a page that would say "not switched on".
 */
import { MENU, menuFor } from "@/lib/nav";

/** The web pages a role's More opens there; my appointment letters are every member of staff's (QA-66), left out here. */
const webOf = (role: keyof typeof MENU) => MENU[role].filter((i) => i.web && i.web !== "/account/letters").map((i) => [i.web, i.module ?? null]);

describe("the desks' own pages in More", () => {
  // The parity batch (10 Oct 2026, R-4): every page the three desks once opened on the web is a screen of the phone's own.
  const screensOf = (role: keyof typeof MENU) => MENU[role].filter((i) => i.screen && i.screen !== "/(app)/assistant").map((i) => [i.screen, i.module ?? null]);

  it("the IQAC: the predictor, filings, surveys, registers, grievances, faculty records and the placement table, native", () => {
    expect(webOf("IQAC")).toEqual([]);
    expect(screensOf("IQAC")).toEqual(
      expect.arrayContaining([
        ["/(app)/iqac-predictor", "IQAC"],
        ["/(app)/iqac-filings", "IQAC"],
        ["/(app)/iqac-surveys", "IQAC"],
        ["/(app)/research", "IQAC"],
        ["/(app)/iqac-grievances", "IQAC"],
        ["/(app)/faculty-records", "IQAC"],
        ["/(app)/placement-table", "PLACEMENT"],
      ]),
    );
  });

  it("the TPO: drives, students, companies, internships and the table, all native under placement", () => {
    expect(webOf("TPO")).toEqual([]);
    expect(screensOf("TPO")).toEqual(expect.arrayContaining([["/(app)/placement-drives", "PLACEMENT"], ["/(app)/placement-students", "PLACEMENT"], ["/(app)/placement-companies", "PLACEMENT"], ["/(app)/supervision", "PLACEMENT"], ["/(app)/placement-table", "PLACEMENT"]]));
  });

  it("the accounts desk: its pages native, and payroll and stores only while those modules are on", () => {
    const shown = (modules: string[]) => menuFor("ACCOUNTS", modules).flatMap((g) => g.items).filter((i) => i.screen && i.screen !== "/(app)/assistant").map((i) => i.screen);
    expect(webOf("ACCOUNTS")).toEqual([]);
    // The person's own pages first, in More's "Me" area (27 Oct 2026, item 3): the account and my payslips.
    expect(shown(["SCHOLARSHIPS", "PAYROLL", "INVENTORY"])).toEqual(["/(app)/account", "/(app)/payslips", "/(app)/accounts-lookup", "/(app)/fee-structures", "/(app)/scholarship-claims", "/(app)/no-dues", "/(app)/concessions", "/(app)/leave", "/(app)/my-attendance", "/(app)/fees", "/(app)/payroll", "/(app)/inventory"]);
    // My appointment letters open on the web, signed in (QA-66).
    expect(menuFor("ACCOUNTS", []).flatMap((g) => g.items).some((i) => i.web === "/account/letters")).toBe(true);
    expect(shown([])).toEqual(["/(app)/account", "/(app)/accounts-lookup", "/(app)/fee-structures", "/(app)/no-dues", "/(app)/concessions", "/(app)/leave", "/(app)/my-attendance", "/(app)/fees"]);
  });

  it("gives the accounts desk its look-up as a screen of the phone's own", () => {
    expect(MENU.ACCOUNTS.find((i) => i.screen === "/(app)/accounts-lookup")?.labelKey).toBe("collegeDesks.lookupTitle");
  });

  it("keeps each desk's own account entries first", () => {
    for (const role of ["IQAC", "TPO", "ACCOUNTS"] as const) expect(MENU[role].slice(0, 2).map((i) => i.screen)).toEqual(["/(app)/account", "/(app)/leave"]);
  });

  it("the library, the warden, a teacher and a head reach the college's web-only pages natively (the parity batch)", () => {
    expect(MENU.LIBRARIAN.map((i) => i.screen)).toEqual(expect.arrayContaining(["/(app)/e-resources", "/(app)/no-dues"]));
    expect(MENU.WARDEN.map((i) => i.screen)).toEqual(expect.arrayContaining(["/(app)/hostel-expulsions", "/(app)/hostel-squad", "/(app)/no-dues"]));
    expect(MENU.FACULTY.map((i) => i.screen)).toEqual(expect.arrayContaining(["/(app)/supervision", "/(app)/research", "/(app)/faculty-profile"]));
    expect(MENU.HOD.map((i) => i.screen)).toEqual(expect.arrayContaining(["/(app)/supervision", "/(app)/research", "/(app)/no-dues", "/(app)/faculty-profile"]));
    for (const role of ["ADMIN", "PRINCIPAL", "TEACHER"] as const) expect(MENU[role].some((i) => i.screen === "/(app)/my-items" && i.module === "INVENTORY")).toBe(true);
    for (const role of ["ADMIN", "PRINCIPAL"] as const) expect(MENU[role].map((i) => i.screen)).toEqual(expect.arrayContaining(["/(app)/stream-records", "/(app)/office-transport", "/(app)/office-hostel", "/(app)/office-academics", "/(app)/office-admissions", "/(app)/accounts", "/(app)/exam-cell", "/(app)/placement-cell", "/(app)/faculty-records"]));
  });

  it("what still opens the web for the office and the head: the library desk, the campus settings, the committees and the accreditation file", () => {
    // In the menu's order since the seven groups (27 Oct 2026, item 3): the council's notices under Communication, the rest under Modules.
    expect(webOf("ADMIN")).toEqual([["/bulletin/council", null], ["/library", "LIBRARY"], ["/admin/college-campus", "ACADEMICS"], ["/admin/committees", "IQAC"]]);
    expect(webOf("PRINCIPAL")).toEqual([["/bulletin/council", null], ["/library/reports", "LIBRARY"], ["/principal/accreditation", "IQAC"], ["/admin/committees", "IQAC"]]);
  });
});
