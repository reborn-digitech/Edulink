import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * THE COMPANY BEHIND SHALAGHAR (company-site, 16 October 2026): its legal details, read from the environment and
 * nowhere else, so the owner fills them in one place (docs/runbooks/deploy.md, "Company details"; the names are in
 * .env.example) and nobody writes a company detail into a page.
 *
 * NOTHING IS INVENTED. Every field is optional; a field that is unset, or set to something that is not the shape the
 * law gives it (a CIN that is not 21 characters, a GSTIN that is not 15), is simply not there: the home page renders
 * only what is set, and the operator's /root shows "Company details to fill" until the required ones are set.
 *
 * Read per call rather than once at import, so a test can hand it any environment and the server reads what it was
 * started with.
 */

export type GrievanceOfficer = { name?: string; designation?: string; email?: string };

export type Company = {
  legalName?: string;
  /** One line the owner writes about the company, e.g. "Shalaghar is a product of …". Shown as written. */
  brandLine?: string;
  /** Corporate Identification Number from the MCA register: 21 characters. */
  cin?: string;
  /** GST registration: 15 characters. */
  gstin?: string;
  /** The registered office, one entry per line. */
  registeredAddress?: string[];
  /** Where letters go, when it is not the registered office; one entry per line. */
  correspondenceAddress?: string[];
  /** COMPANY_SUPPORT_EMAIL, or the older SUPPORT_EMAIL /privacy and /delete-account read. */
  supportEmail?: string;
  supportPhone?: string;
  /** The person the DPDP Act, 2023 s.8(9) asks a data fiduciary to publish; present when any of the three is set. */
  grievanceOfficer?: GrievanceOfficer;
  foundedYear?: number;
  directors?: string[];
};

/** Every field the company page can show, in the order the operator's card lists what is missing. */
export const COMPANY_FIELDS = [
  "legalName",
  "brandLine",
  "cin",
  "gstin",
  "registeredAddress",
  "correspondenceAddress",
  "supportEmail",
  "supportPhone",
  "grievanceOfficer.name",
  "grievanceOfficer.designation",
  "grievanceOfficer.email",
  "foundedYear",
  "directors",
] as const;
export type CompanyField = (typeof COMPANY_FIELDS)[number];

/** Until every one of these is set, the operator's home shows the card. A grievance officer needs a name and an address to write to. */
export const COMPANY_REQUIRED: readonly CompanyField[] = ["legalName", "registeredAddress", "supportEmail", "grievanceOfficer.name", "grievanceOfficer.email"];

/** The environment variable each field is read from (.env.example lists them; the runbook explains them). */
export const COMPANY_ENV: Record<CompanyField, string> = {
  legalName: "COMPANY_LEGAL_NAME",
  brandLine: "COMPANY_BRAND_LINE",
  cin: "COMPANY_CIN",
  gstin: "COMPANY_GSTIN",
  registeredAddress: "COMPANY_REGISTERED_ADDRESS",
  correspondenceAddress: "COMPANY_CORRESPONDENCE_ADDRESS",
  supportEmail: "COMPANY_SUPPORT_EMAIL",
  supportPhone: "COMPANY_SUPPORT_PHONE",
  "grievanceOfficer.name": "COMPANY_GRIEVANCE_OFFICER_NAME",
  "grievanceOfficer.designation": "COMPANY_GRIEVANCE_OFFICER_DESIGNATION",
  "grievanceOfficer.email": "COMPANY_GRIEVANCE_OFFICER_EMAIL",
  foundedYear: "COMPANY_FOUNDED_YEAR",
  directors: "COMPANY_DIRECTORS",
};

/** The dictionary key naming each field, for the operator's card and the home page's labels. */
export const COMPANY_FIELD_KEY: Record<CompanyField, TranslationKey> = {
  legalName: "company.legalName",
  brandLine: "company.brandLine",
  cin: "company.cin",
  gstin: "company.gstin",
  registeredAddress: "company.registeredAddress",
  correspondenceAddress: "company.correspondenceAddress",
  supportEmail: "company.supportEmail",
  supportPhone: "company.supportPhone",
  "grievanceOfficer.name": "company.grievanceName",
  "grievanceOfficer.designation": "company.grievanceDesignation",
  "grievanceOfficer.email": "company.grievanceEmail",
  foundedYear: "company.foundedYear",
  directors: "company.directors",
};

/** Where the operator's card sends the owner: the runbook section on the repository the owner watches. */
export const COMPANY_RUNBOOK_URL = "https://github.com/reborn-digitech/Edulink/blob/master/docs/runbooks/deploy.md#company-details";

type Env = Record<string, string | undefined>;

/** A list in one variable: entries separated by "|" (an address's own commas stay inside its line). */
const LIST_SEPARATOR = "|";

const text = (value: string | undefined): string | undefined => {
  const v = value?.replace(/\s+/g, " ").trim();
  return v ? v : undefined;
};
const list = (value: string | undefined): string[] | undefined => {
  const items = (value ?? "").split(LIST_SEPARATOR).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
};
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const email = (value: string | undefined): string | undefined => {
  const v = text(value);
  return v && EMAIL.test(v) ? v : undefined;
};
/** L or U, five digits (industry), two letters (state), four digits (year), three letters (type), six digits. */
const CIN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
/** Two digits (state), the ten characters of a PAN, the entity number, Z, and a check character. */
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const coded = (value: string | undefined, shape: RegExp): string | undefined => {
  const v = text(value)?.toUpperCase().replace(/\s/g, "");
  return v && shape.test(v) ? v : undefined;
};
/** A phone number as people write it: digits, spaces, +, -, brackets; at least ten digits. */
const phone = (value: string | undefined): string | undefined => {
  const v = text(value);
  return v && /^[+\d][\d\s()-]*$/.test(v) && v.replace(/\D/g, "").length >= 10 ? v : undefined;
};
const year = (value: string | undefined, now: Date): number | undefined => {
  const v = text(value);
  if (!v || !/^\d{4}$/.test(v)) return undefined;
  const n = Number(v);
  return n >= 1900 && n <= now.getUTCFullYear() ? n : undefined;
};

/** The company as the given environment describes it. A value the law would not recognise is left out, not repaired. */
export function companyFrom(env: Env, now: Date = new Date()): Company {
  const grievance: GrievanceOfficer = {
    name: text(env.COMPANY_GRIEVANCE_OFFICER_NAME),
    designation: text(env.COMPANY_GRIEVANCE_OFFICER_DESIGNATION),
    email: email(env.COMPANY_GRIEVANCE_OFFICER_EMAIL),
  };
  const out: Company = {
    legalName: text(env.COMPANY_LEGAL_NAME),
    brandLine: text(env.COMPANY_BRAND_LINE),
    cin: coded(env.COMPANY_CIN, CIN),
    gstin: coded(env.COMPANY_GSTIN, GSTIN),
    registeredAddress: list(env.COMPANY_REGISTERED_ADDRESS),
    correspondenceAddress: list(env.COMPANY_CORRESPONDENCE_ADDRESS),
    supportEmail: email(env.COMPANY_SUPPORT_EMAIL) ?? email(env.SUPPORT_EMAIL),
    supportPhone: phone(env.COMPANY_SUPPORT_PHONE),
    grievanceOfficer: grievance.name || grievance.designation || grievance.email ? grievance : undefined,
    foundedYear: year(env.COMPANY_FOUNDED_YEAR, now),
    directors: list(env.COMPANY_DIRECTORS),
  };
  // Drop the keys that are unset, so a caller can test `"cin" in company` or spread it without carrying undefineds.
  for (const key of Object.keys(out) as (keyof Company)[]) if (out[key] === undefined) delete out[key];
  if (out.grievanceOfficer) for (const key of Object.keys(out.grievanceOfficer) as (keyof GrievanceOfficer)[]) if (out.grievanceOfficer[key] === undefined) delete out.grievanceOfficer[key];
  return out;
}

/** The company as this server was started with. */
export function company(): Company {
  return companyFrom(process.env);
}

function isSet(c: Company, field: CompanyField): boolean {
  switch (field) {
    case "grievanceOfficer.name":
      return Boolean(c.grievanceOfficer?.name);
    case "grievanceOfficer.designation":
      return Boolean(c.grievanceOfficer?.designation);
    case "grievanceOfficer.email":
      return Boolean(c.grievanceOfficer?.email);
    default:
      return c[field] !== undefined;
  }
}

/** Every field that is unset (or set in a shape the law does not give it), in COMPANY_FIELDS order. */
export function companyDetailsMissing(c: Company = company()): CompanyField[] {
  return COMPANY_FIELDS.filter((field) => !isSet(c, field));
}

/** The required fields still missing; the operator's card shows while this is not empty. */
export function companyRequiredMissing(c: Company = company()): CompanyField[] {
  return COMPANY_REQUIRED.filter((field) => !isSet(c, field));
}

/** Whether the home page has anything to say about the company at all. */
export function companyHasDetails(c: Company = company()): boolean {
  return companyDetailsMissing(c).length < COMPANY_FIELDS.length;
}
