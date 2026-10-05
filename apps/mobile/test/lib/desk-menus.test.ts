/**
 * The college desks' More on the phone (5 Oct 2026, the link walk's role audit): the web's NAV gives the IQAC, the
 * TPO and the accounts desk their own pages, and the phone's More gave them only the account, leave, check-in and
 * payslips. Each desk page is now an entry that opens the web signed in, under the module the web's entry carries,
 * so a desk with a module off never sees a link to a page that would say "not switched on".
 */
import { MENU, menuFor } from "@/lib/nav";

const webOf = (role: keyof typeof MENU) => MENU[role].filter((i) => i.web).map((i) => [i.web, i.module ?? null]);

describe("the desks' own pages in More", () => {
  it("the IQAC: the predictor, filings, surveys, registers, grievances, faculty records and the placement table", () => {
    expect(webOf("IQAC")).toEqual([
      ["/iqac/predictor", "IQAC"],
      ["/iqac/documents", "IQAC"],
      ["/iqac/surveys", "IQAC"],
      ["/iqac/registers", "IQAC"],
      ["/iqac/grievances", "IQAC"],
      ["/admin/faculty-records", "IQAC"],
      ["/placement/analytics", "PLACEMENT"],
    ]);
  });

  it("the TPO: drives, students, companies, internships and the table, all under placement", () => {
    expect(webOf("TPO")).toEqual([
      ["/placement/drives", "PLACEMENT"],
      ["/placement/students", "PLACEMENT"],
      ["/placement/companies", "PLACEMENT"],
      ["/placement/internships", "PLACEMENT"],
      ["/placement/analytics", "PLACEMENT"],
    ]);
  });

  it("the accounts desk: its pages, and payroll and stores only while those modules are on", () => {
    const shown = (modules: string[]) => menuFor("ACCOUNTS", modules).flatMap((g) => g.items).filter((i) => i.web).map((i) => i.web);
    expect(shown(["SCHOLARSHIPS", "PAYROLL", "INVENTORY"])).toEqual(["/accounts/structures", "/accounts/scholarships", "/accounts/no-dues", "/accounts/concessions", "/accounts/students", "/admin/fees", "/admin/payroll", "/admin/inventory"]);
    expect(shown([])).toEqual(["/accounts/structures", "/accounts/no-dues", "/accounts/concessions", "/accounts/students", "/admin/fees"]);
  });

  it("gives the accounts desk its look-up as a screen of the phone's own", () => {
    expect(MENU.ACCOUNTS.find((i) => i.screen === "/(app)/accounts-lookup")?.labelKey).toBe("collegeDesks.lookupTitle");
  });

  it("keeps each desk's own account entries first", () => {
    for (const role of ["IQAC", "TPO", "ACCOUNTS"] as const) expect(MENU[role].slice(0, 2).map((i) => i.screen)).toEqual(["/(app)/account", "/(app)/leave"]);
  });
});
