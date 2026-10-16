/**
 * The company's own site at the root and a truthful sign-in page (company-site, 16 October 2026).
 *
 * The company's details come from the environment alone (src/lib/company.ts) and each appears only once it is set;
 * the operator is told what is missing; the root page renders with none of them and with all of them and says nothing
 * invented in either; a signed-in person is sent home; and the sign-in page's quotation is gone with its keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");

let session: { role: string | null } | null = null;
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  getSession: async () => (session ? { user: { id: "zz-user", isSuperuser: false, isAppAdmin: false }, sessionId: "zz-s", membershipId: null, schoolId: null, role: session.role } : null),
  sessionForLocale: async () => null,
}));

import CompanySite from "@/app/page";
import { WhoSignsIn } from "@/app/login/who-signs-in";
import { CompanyDetailsCard } from "@/app/root/company-card";
import { COMPANY_ENV, COMPANY_FIELDS, COMPANY_REQUIRED, companyDetailsMissing, companyFrom, companyHasDetails, companyRequiredMissing } from "@/lib/company";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { ROLE_HOME } from "@/lib/constants";
import { robotsFor, SITEMAP_PATHS } from "@/lib/robots";

/** Every name the module reads, the older SUPPORT_EMAIL included, so the developer's own .env cannot leak into a case. */
const NAMES = [...Object.values(COMPANY_ENV), "SUPPORT_EMAIL"];
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const name of NAMES) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
  session = null;
});
afterEach(() => {
  for (const name of NAMES) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

const FULL: Record<string, string> = {
  COMPANY_LEGAL_NAME: "ZZ Shalaghar Test Private Limited",
  COMPANY_BRAND_LINE: "ZZ brand line for the test.",
  COMPANY_CIN: "U85500MH2026PTC000001",
  COMPANY_GSTIN: "27ABCDE1234F1Z5",
  COMPANY_REGISTERED_ADDRESS: "ZZ Line One| ZZ Line Two |ZZ City 400001",
  COMPANY_CORRESPONDENCE_ADDRESS: "ZZ Post Box 1|ZZ Town",
  COMPANY_SUPPORT_EMAIL: "zz.support@demo.relay.test",
  COMPANY_SUPPORT_PHONE: "+91 98765 43210",
  COMPANY_GRIEVANCE_OFFICER_NAME: "ZZ Grievance Person",
  COMPANY_GRIEVANCE_OFFICER_DESIGNATION: "ZZ Designation",
  COMPANY_GRIEVANCE_OFFICER_EMAIL: "zz.grievance@demo.relay.test",
  COMPANY_FOUNDED_YEAR: "2025",
  COMPANY_DIRECTORS: "ZZ Director One|ZZ Director Two",
};

async function renderRoot(): Promise<string> {
  const page = await CompanySite();
  return renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], page));
}

/** Text a reader sees, tags and attributes gone and the common entities read back. */
const visible = (html: string) => html.replace(/<\/?a\b[^>]*>/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ");

describe("the company's details (src/lib/company.ts)", () => {
  it("with nothing set, everything is missing and nothing is made up", () => {
    const c = companyFrom({});
    expect(c).toEqual({});
    expect(companyDetailsMissing(c)).toEqual([...COMPANY_FIELDS]);
    expect(companyRequiredMissing(c)).toEqual([...COMPANY_REQUIRED]);
    expect(companyHasDetails(c)).toBe(false);
  });

  it("with everything set, nothing is missing and the lists are split on |", () => {
    const c = companyFrom(FULL, new Date("2026-10-16T00:00:00Z"));
    expect(companyDetailsMissing(c)).toEqual([]);
    expect(companyRequiredMissing(c)).toEqual([]);
    expect(c.registeredAddress).toEqual(["ZZ Line One", "ZZ Line Two", "ZZ City 400001"]);
    expect(c.directors).toEqual(["ZZ Director One", "ZZ Director Two"]);
    expect(c.foundedYear).toBe(2025);
    expect(c.grievanceOfficer).toEqual({ name: "ZZ Grievance Person", designation: "ZZ Designation", email: "zz.grievance@demo.relay.test" });
  });

  it("a value in the wrong shape is treated as unset, not repaired or shown", () => {
    const c = companyFrom(
      { ...FULL, COMPANY_CIN: "U12345", COMPANY_GSTIN: "27ABCDE1234F1Z", COMPANY_SUPPORT_EMAIL: "not an address", COMPANY_GRIEVANCE_OFFICER_EMAIL: "x@", COMPANY_FOUNDED_YEAR: "2099", COMPANY_SUPPORT_PHONE: "12345", COMPANY_LEGAL_NAME: "   " },
      new Date("2026-10-16T00:00:00Z"),
    );
    expect(companyDetailsMissing(c)).toEqual(["legalName", "cin", "gstin", "supportEmail", "supportPhone", "grievanceOfficer.email", "foundedYear"]);
    expect(companyRequiredMissing(c)).toEqual(["legalName", "supportEmail", "grievanceOfficer.email"]);
  });

  it("takes a CIN and a GSTIN in lower case or with spaces, as people paste them", () => {
    const c = companyFrom({ COMPANY_CIN: "u85500 mh2026 ptc000001", COMPANY_GSTIN: "27abcde1234f1z5" });
    expect([c.cin, c.gstin]).toEqual(["U85500MH2026PTC000001", "27ABCDE1234F1Z5"]);
  });

  it("the support address falls back to the SUPPORT_EMAIL /privacy already reads", () => {
    expect(companyFrom({ SUPPORT_EMAIL: "zz.help@demo.relay.test" }).supportEmail).toBe("zz.help@demo.relay.test");
    expect(companyFrom({ SUPPORT_EMAIL: "zz.help@demo.relay.test", COMPANY_SUPPORT_EMAIL: "zz.own@demo.relay.test" }).supportEmail).toBe("zz.own@demo.relay.test");
  });

  it("every field has an environment name, and .env.example and the runbook list each one", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    const runbook = readFileSync(join(process.cwd(), "..", "..", "docs", "runbooks", "deploy.md"), "utf8");
    expect(runbook).toContain("## Company details");
    for (const name of Object.values(COMPANY_ENV)) {
      expect(example, name).toContain(`# ${name}=`);
      expect(runbook, name).toContain(`\`${name}\``);
    }
  });
});

describe("the root page is the company's site", () => {
  it("renders with no company detail set, and invents none", async () => {
    const html = await renderRoot();
    const text = visible(html);
    expect(html).toContain('data-testid="company-site"');
    for (const href of ["/login", "/register", "/register/expert", "/join", "/privacy", "/delete-account"]) expect(html).toContain(`href="${href}"`);
    // No About section, no "Built by", no address anywhere, no grievance block: there is nothing to say yet.
    expect(html).not.toContain('data-testid="company-about"');
    expect(html).not.toContain('data-testid="built-by"');
    expect(html).not.toContain('data-testid="grievance-officer"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
    expect(text).not.toContain(t("company.cin"));
    expect(text).not.toContain(t("landing.grievanceTitle"));
    // The pricing line asks without an address to write to, and claims no price.
    expect(text).toContain(t("landing.pricingBody"));
    expect(text).not.toMatch(/₹|\bfree\b/i);
    // No Terms link until the owner provides the terms.
    expect(html).not.toContain('href="/terms"');
    // The old shop window's claims are gone with their keys.
    for (const gone of ["Year 5", "ten seconds", "five minutes", "No card needed", "Amara O."]) expect(text).not.toContain(gone);
  });

  it("lists what a school and a college use today, and nothing behind a platform switch", async () => {
    const text = visible(await renderRoot());
    for (const key of ["landing.schoolsAttendance", "landing.schoolsFees", "landing.schoolsFilings", "modules.transportName", "modules.websiteName", "modules.iqacName", "modules.placementName", "landing.moreComing"] as const) {
      expect(text, key).toContain(t(key));
    }
    expect(text).not.toContain(t("modules.assistantName"));
    expect(text).not.toMatch(/assistant|question bank|job board|WhatsApp|SMS/i);
  });

  it("renders every company detail once all are set, each exactly as given", async () => {
    Object.assign(process.env, FULL);
    const html = await renderRoot();
    const text = visible(html);
    expect(html).toContain('data-testid="company-about"');
    expect(html).toContain('data-testid="grievance-officer"');
    for (const value of ["ZZ Shalaghar Test Private Limited", "ZZ brand line for the test.", "U85500MH2026PTC000001", "27ABCDE1234F1Z5", "ZZ Line One", "ZZ Line Two", "ZZ City 400001", "ZZ Post Box 1", "ZZ Town", "+91 98765 43210", "ZZ Grievance Person, ZZ Designation", "2025", "ZZ Director One", "ZZ Director Two"]) {
      expect(text, value).toContain(value);
    }
    expect(html).toContain('href="mailto:zz.support@demo.relay.test"');
    expect(html).toContain('href="mailto:zz.grievance@demo.relay.test"');
    expect(html).toContain('href="tel:+919876543210"');
    expect(text).toContain(t("landing.footerBuiltBy", { name: "ZZ Shalaghar Test Private Limited" }));
    // The words the DPDP Act asks for: who answers, how to reach them, and the Board after.
    expect(text).toContain(t("landing.grievanceTitle"));
    expect(text).toContain(t("landing.grievanceWrite", { email: "zz.grievance@demo.relay.test" }));
    expect(text).toContain(t("landing.grievanceBoard"));
    expect(text).toContain(t("landing.pricingAsk", { email: "zz.support@demo.relay.test" }));
  });

  it("draws only the details that are set", async () => {
    process.env.COMPANY_LEGAL_NAME = "ZZ Only The Name Private Limited";
    const html = await renderRoot();
    expect(html).toContain('data-testid="company-about"');
    expect(visible(html)).toContain(t("company.legalName"));
    expect(html).not.toContain('data-testid="grievance-officer"');
    for (const label of ["company.cin", "company.gstin", "company.registeredAddress", "company.supportEmail", "company.directors"] as const) expect(visible(html), label).not.toContain(t(label));
  });

  it.each([
    ["ADMIN", ROLE_HOME.ADMIN],
    ["PARENT", ROLE_HOME.PARENT],
    [null, "/switch"],
  ])("sends a signed-in person (%s) home rather than showing the site", async (role, home) => {
    session = { role };
    const error = await CompanySite().then(() => null, (e: unknown) => e as { digest?: string });
    expect(error?.digest).toMatch(new RegExp(`^NEXT_REDIRECT;[a-z]+;${home.replace(/\//g, "\\/")};`));
  });
});

describe("the sign-in page says only what is true", () => {
  it("the quotation's keys are gone from every language, and no page asks for them", () => {
    for (const dictionary of [en, hi, mr]) {
      expect(Object.keys(dictionary.login)).not.toContain("quote");
      expect(Object.keys(dictionary.login)).not.toContain("quoteAttribution");
    }
    for (const file of ["src/app/login/page.tsx", "src/app/login/code/page.tsx", "src/app/login/who-signs-in.tsx"]) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/login\.quote|<blockquote/);
    }
    expect(readFileSync(join(process.cwd(), "src/app/login/page.tsx"), "utf8")).toContain("<WhoSignsIn");
  });

  it("the panel says who signs in, the other ways in and the languages, and the support line only with an address", () => {
    const without = renderToStaticMarkup(WhoSignsIn({ t }));
    expect(without).toContain('data-testid="login-who"');
    expect(visible(without)).toContain(t("login.whoTitle"));
    expect(without).toContain('href="/join"');
    expect(without).toContain('href="/register/expert"');
    expect(without).not.toContain('data-testid="login-support"');
    expect(without).not.toContain("mailto:");

    process.env.COMPANY_SUPPORT_EMAIL = "zz.support@demo.relay.test";
    const withEmail = renderToStaticMarkup(WhoSignsIn({ t }));
    expect(withEmail).toContain('data-testid="login-support"');
    expect(visible(withEmail)).toContain(t("login.whoSupport", { email: "zz.support@demo.relay.test" }));
  });
});

describe("the operator's card (/root)", () => {
  it("names what is missing while a required detail is unset, and goes once they are all set", async () => {
    const card = await CompanyDetailsCard();
    const html = renderToStaticMarkup(card!);
    expect(html).toContain('data-testid="company-details-card"');
    expect(visible(html)).toContain(t("company.cin"));
    expect(html).toContain("deploy.md#company-details");

    for (const name of ["COMPANY_LEGAL_NAME", "COMPANY_REGISTERED_ADDRESS", "COMPANY_SUPPORT_EMAIL", "COMPANY_GRIEVANCE_OFFICER_NAME", "COMPANY_GRIEVANCE_OFFICER_EMAIL"]) process.env[name] = FULL[name];
    expect(await CompanyDetailsCard()).toBeNull();
  });
});

describe("robots and the sitemap", () => {
  it("every page in the app host's sitemap is one the layout lets a search engine index, the root first", () => {
    expect(SITEMAP_PATHS[0]).toBe("/");
    for (const path of SITEMAP_PATHS) expect(robotsFor(`GET ${path}`), path).toEqual({ index: true, follow: true });
  });
});
