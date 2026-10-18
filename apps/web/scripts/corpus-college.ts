/**
 * VIDURA PASS 4 (docs/plans/vidura.md, pass 4; 18 October 2026): the college tutor's public sources.
 *
 *   npm run corpus:fetch -- --source=wikipedia [--stream=LAW,COMMERCE]   the Wikipedia subset, one article a request
 *   npm run corpus:fetch -- --source=indiacode,nptel,swayam               writes down why each is not taken
 *
 * WHAT IS TAKEN. A subset of English Wikipedia for the professional streams (STREAMS in packages/contracts): for each
 * stream the articles below, chosen against what the councils' syllabi teach in a first degree (law first: the
 * Constitution's articles as Wikipedia describes them, the codes, torts, contract, jurisprudence). Each is read through
 * the MediaWiki API as plain text (the "extracts" of the TextExtracts extension, with its revision), never a rendered
 * page; written as `<slug>.txt` under storage/corpus/wikipedia/<stream>/<subject>/ with its manifest entry: the
 * permanent address of the revision read, the licence as the API's own site information names it (CC BY-SA 4.0), and
 * the attribution every passage of it carries in a citation (corpus-lib.ts `Attribution`). An article chosen for two
 * streams is fetched once, under the first, and its entry lists both. A stub (under MIN_ARTICLE_CHARS) is not kept.
 *
 * WHAT IS NOT TAKEN, AND WHY (each written to `<source>/_refused/index/manifest.json` with `fetched: false`):
 *   - India Code (indiacode.gov.in): its Copyright Policy (last updated 22 June 2026) reserves the legislative texts
 *     to the Legislative Department and forbids, without its written permission, commercial use, reproduction and
 *     "systematic extraction, scraping, or harvesting of substantial portions" of the portal. The plan called the bare
 *     acts public domain; the portal's own terms say otherwise, so nothing is fetched until the department's written
 *     permission is on file (or counsel reads the Copyright Act's section 52(1)(q) as covering this use). Linking to it
 *     is allowed by its Hyper Linking Policy, so it stays on the reference allow-list (links only).
 *   - The Constitution of India from legislative.gov.in: the page is rendered by script (no document a plain fetch can
 *     see), the same reason MUHS and BCI were refused in Phase A; India Code's copy falls under the policy above.
 *   - NPTEL: "Distributed under Creative Commons Attribution-ShareAlike, CC BY-NC-SA" (the site's footer). Vidura is
 *     part of the paid student and teacher plans, so passages in its answers are a commercial use the non-commercial
 *     clause does not allow. Linked from the allow-list, never copied.
 *   - SWAYAM: its Terms of Use make course materials "for your personal use in connection with those courses and
 *     programs only", and its courses sit behind a sign-in this fetcher never uses. Linked, never copied.
 *
 * Nothing fetched is run: the articles are text, read by the ingest (corpus-ingest.ts) as data.
 */
import type { Attribution, Licence, ManifestEntry } from "./corpus-lib";

/** The streams the subset serves, with the subject word their documents are filed under. */
export const WIKIPEDIA_STREAMS = ["LAW", "COMMERCE", "MANAGEMENT", "ENGINEERING", "PHARMACY", "EDUCATION", "ARCHITECTURE", "AGRICULTURE", "HEALTH_SCIENCES"] as const;
export type WikipediaStream = (typeof WIKIPEDIA_STREAMS)[number];

export const STREAM_SUBJECT: Record<WikipediaStream, string> = {
  LAW: "Law",
  COMMERCE: "Commerce",
  MANAGEMENT: "Management",
  ENGINEERING: "Engineering",
  PHARMACY: "Pharmacy",
  EDUCATION: "Education",
  ARCHITECTURE: "Architecture",
  AGRICULTURE: "Agriculture",
  HEALTH_SCIENCES: "Health sciences",
};

/** An article shorter than this (in characters of plain text) is a stub and is not kept. */
export const MIN_ARTICLE_CHARS = 2_000;
/** A longer article is cut at the last section heading before this many characters. */
export const MAX_ARTICLE_CHARS = 150_000;

/**
 * The articles per stream, by their Wikipedia titles (a title that redirects is followed; one that does not exist is
 * reported and skipped). Chosen on 18 October 2026 against the first-degree syllabi the corpus already holds (SPPU,
 * AICTE, PCI, MPKV) and the BCI's compulsory papers for law.
 */
export const WIKIPEDIA_ARTICLES: Record<WikipediaStream, string[]> = {
  LAW: [
    "Constitution of India", "Preamble to the Constitution of India", "Fundamental rights in India", "Directive Principles", "Fundamental Duties of India",
    "Basic structure doctrine", "Judicial review in India", "Public interest litigation in India", "Article 21 of the Constitution of India", "Article 14 of the Constitution of India",
    "Federalism in India", "Parliament of India", "President of India", "Supreme Court of India", "High courts of India",
    "Emergency in India", "Amendment of the Constitution of India", "Writ", "Habeas corpus", "Mandamus", "Certiorari", "Quo warranto",
    "Tort", "Negligence", "Defamation", "Nuisance", "Vicarious liability", "Strict liability", "Rylands v Fletcher", "Res ipsa loquitur", "Volenti non fit injuria",
    "Contract", "Indian Contract Act, 1872", "Offer and acceptance", "Consideration", "Void contract", "Specific performance", "Quasi-contract", "Indian Partnership Act, 1932",
    "Bharatiya Nyaya Sanhita", "Indian Penal Code", "Mens rea", "Actus reus", "Bail", "First information report", "Bharatiya Nagarik Suraksha Sanhita", "Bharatiya Sakshya Adhiniyam",
    "Indian Evidence Act, 1872", "Burden of proof (law)", "Hearsay", "Code of Civil Procedure (India)", "Res judicata",
    "Jurisprudence", "Natural law", "Legal positivism", "Rule of law", "Separation of powers", "Natural justice", "Precedent", "Equity (law)", "Administrative law", "Delegated legislation",
    "Hindu Marriage Act, 1955", "Hindu Succession Act, 1956", "Special Marriage Act, 1954", "Muslim personal law", "Uniform Civil Code", "Transfer of Property Act, 1882", "Easement",
    "Consumer Protection Act, 2019", "Right to Information Act, 2005", "Information Technology Act, 2000", "Arbitration and Conciliation Act, 1996", "Negotiable Instruments Act, 1881",
    "Insolvency and Bankruptcy Code, 2016", "Intellectual property", "Copyright Act, 1957", "Patents Act, 1970", "Trademark", "Environmental law", "Public international law", "Lok Adalat", "Bar Council of India",
  ],
  COMMERCE: [
    "Accounting", "Double-entry bookkeeping", "Balance sheet", "Income statement", "Cash flow statement", "Trial balance", "Depreciation", "Accounting standard", "Indian Accounting Standards",
    "Audit", "Cost accounting", "Management accounting", "Financial ratio", "Working capital", "Time value of money", "Net present value", "Internal rate of return", "Capital budgeting",
    "Cost of capital", "Goods and Services Tax (India)", "Income tax in India", "Reserve Bank of India", "Monetary policy of India", "Inflation", "Gross domestic product",
    "Supply and demand", "Price elasticity of demand", "Market structure", "Perfect competition", "Monopoly", "Oligopoly", "Partnership", "Sole proprietorship", "Stock exchange",
    "Securities and Exchange Board of India", "Mutual fund", "Insurance", "Negotiable instrument", "Cheque", "Bill of exchange", "E-commerce", "International trade",
    "Balance of payments", "Foreign exchange market", "Fiscal policy", "Microeconomics", "Macroeconomics", "Bank reconciliation statement", "Journal entry", "Ledger",
  ],
  MANAGEMENT: [
    "Management", "Planning", "Organizational structure", "Leadership", "Motivation", "Maslow's hierarchy of needs", "Two-factor theory", "Theory X and Theory Y",
    "Human resource management", "Recruitment", "Performance appraisal", "Marketing", "Marketing mix", "Market segmentation", "Brand", "Consumer behaviour", "SWOT analysis",
    "Porter's five forces analysis", "Strategic management", "Operations management", "Supply chain management", "Inventory", "Just-in-time manufacturing", "Total quality management",
    "Six Sigma", "Project management", "Critical path method", "Program evaluation and review technique", "Decision-making", "Organizational behavior", "Organizational culture",
    "Change management", "Entrepreneurship", "Business plan", "Corporate finance", "Risk management", "Corporate social responsibility", "Corporate governance",
    "Customer relationship management", "Management information system", "Fayolism", "Scientific management", "Balanced scorecard", "Product life-cycle management (marketing)", "Break-even (economics)",
  ],
  ENGINEERING: [
    "Bending moment", "Shear and moment diagram", "Stress (mechanics)", "Strain (mechanics)", "Hooke's law", "Young's modulus", "Beam (structure)", "Truss", "Moment of inertia",
    "Laws of thermodynamics", "Carnot cycle", "Heat transfer", "Fluid mechanics", "Bernoulli's principle", "Reynolds number", "Ohm's law", "Kirchhoff's circuit laws", "Transformer",
    "Electric motor", "Semiconductor", "Transistor", "Diode", "Operational amplifier", "Logic gate", "Flip-flop (electronics)", "Microprocessor", "Control theory", "PID controller",
    "Fourier transform", "Laplace transform", "Data structure", "Stack (abstract data type)", "Queue (abstract data type)", "Linked list", "Binary tree", "Sorting algorithm",
    "Time complexity", "Operating system", "Database", "SQL", "Database normalization", "Computer network", "OSI model", "Internet protocol suite", "Object-oriented programming",
    "Software development process", "Machine learning", "Reinforced concrete", "Surveying", "Soil mechanics", "Internal combustion engine", "Refrigeration", "Hydraulic machinery",
  ],
  PHARMACY: [
    "Pharmacology", "Pharmacokinetics", "Pharmacodynamics", "Bioavailability", "Drug metabolism", "Absorption (pharmacology)", "Distribution (pharmacology)", "Biological half-life",
    "Clearance (pharmacology)", "Therapeutic index", "Drug interaction", "Adverse drug reaction", "Pharmacovigilance", "Pharmaceutics", "Dosage form", "Tablet (pharmacy)", "Capsule (pharmacy)",
    "Emulsion", "Suspension (chemistry)", "Pharmacognosy", "Medicinal chemistry", "Analgesic", "Antibiotic", "Nonsteroidal anti-inflammatory drug", "Beta blocker", "Diuretic", "Insulin",
    "Vaccine", "Clinical trial", "Good manufacturing practice", "Drugs and Cosmetics Act, 1940", "Pharmacopoeia", "Indian Pharmacopoeia", "Receptor (biochemistry)", "Agonist",
    "Receptor antagonist", "Enzyme inhibitor", "Chromatography", "High-performance liquid chromatography", "Sterilization (microbiology)", "Biopharmaceutical", "Generic drug",
    "Over-the-counter drug", "Prodrug", "Dose–response relationship", "Drug development",
  ],
  EDUCATION: [
    "Bloom's taxonomy", "Pedagogy", "Constructivism (philosophy of education)", "Behaviorism", "Piaget's theory of cognitive development", "Zone of proximal development",
    "Theory of multiple intelligences", "Formative assessment", "Summative assessment", "Educational assessment", "Curriculum", "Lesson plan", "Inclusion (education)",
    "Educational psychology", "Microteaching", "Classroom management", "Educational technology", "Right of Children to Free and Compulsory Education Act, 2009",
    "National Education Policy 2020", "Experiential learning", "Cooperative learning", "Differentiated instruction", "Intelligence quotient", "Learning disability",
    "Teacher education", "Philosophy of education", "Sociology of education", "Montessori education", "Universal Design for Learning", "Action research", "Reflective practice",
    "Reliability (statistics)", "Validity (statistics)", "Operant conditioning", "Classical conditioning", "Social learning theory", "Scaffolding (education)", "Gagné's nine events of instruction",
  ],
  ARCHITECTURE: [
    "Architecture", "Proportion (architecture)", "Golden ratio", "Classical order", "Vernacular architecture", "Sustainable architecture", "Green building", "Passive solar building design",
    "Building information modeling", "Architectural drawing", "Floor plan", "Urban planning", "Landscape architecture", "Modern architecture", "Le Corbusier", "Brutalist architecture",
    "Indo-Saracenic architecture", "Mughal architecture", "Hindu temple architecture", "Dravidian architecture", "Vastu shastra", "Building code", "National Building Code of India",
    "Load-bearing wall", "Arch", "Dome", "Vault (architecture)", "Masonry", "Architectural acoustics", "Daylighting", "Ergonomics", "Universal design", "Interior design",
    "Building material", "Brick", "Prestressed concrete", "Architectural style", "Form follows function", "Visual design elements and principles", "Chandigarh",
  ],
  AGRICULTURE: [
    "Agriculture in India", "Soil fertility", "Soil", "Fertilizer", "Nitrogen fixation", "Crop rotation", "Irrigation", "Drip irrigation", "Green Revolution in India", "Organic farming",
    "Integrated pest management", "Pesticide", "Plant breeding", "Agronomy", "Horticulture", "Animal husbandry", "Operation Flood", "Agricultural economics", "Minimum support price (India)",
    "Soil erosion", "Soil conservation", "Kharif crop", "Rabi crop", "C4 carbon fixation", "Plant nutrition", "Micronutrient", "Seed", "Germination", "Weed", "Agroforestry",
    "Sericulture", "Agricultural extension", "Precision agriculture", "Food security", "Biofertilizer", "Vermicompost", "Rainwater harvesting", "Watershed management", "Soil pH", "Hybrid seed",
  ],
  HEALTH_SCIENCES: [
    "Anatomy", "Physiology", "Homeostasis", "Circulatory system", "Heart", "Blood pressure", "Hypertension", "Diabetes", "Respiratory system", "Nervous system", "Kidney", "Immune system",
    "Antibody", "Inflammation", "Infection", "Epidemiology", "Public health", "Vaccination", "Nutrition", "Malnutrition", "Vitamin", "Anemia", "Tuberculosis", "Malaria", "Dengue fever",
    "Hand washing", "Nursing process", "Vital signs", "First aid", "Cardiopulmonary resuscitation", "Wound healing", "Pathology", "Microbiology", "Medical ethics", "Informed consent",
    "Triage", "National Health Mission", "Tooth decay", "Periodontal disease", "Sepsis",
  ],
};

/** The MediaWiki API's address for one article's plain text, its revision and its canonical address. */
export function wikipediaApiUrl(title: string): string {
  const q = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "extracts|revisions|info",
    explaintext: "1",
    exsectionformat: "wiki",
    rvprop: "ids|timestamp",
    inprop: "url",
    titles: title,
  });
  return `https://en.wikipedia.org/w/api.php?${q.toString()}`;
}

/** The site's own words for its licence (the API's siteinfo rightsinfo). */
export const WIKIPEDIA_RIGHTS_URL = "https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=rightsinfo&format=json&formatversion=2";

export type WikipediaPage = { title: string; pageid: number; revid: number; timestamp: string; extract: string; fullurl: string };

/** One article out of the API's answer; null when the title does not exist or the answer carries no text. Pure. */
export function wikipediaPageOf(json: unknown): WikipediaPage | null {
  const page = (json as { query?: { pages?: unknown[] } })?.query?.pages?.[0] as
    | { missing?: boolean; invalid?: boolean; title?: string; pageid?: number; extract?: string; fullurl?: string; revisions?: { revid?: number; timestamp?: string }[] }
    | undefined;
  if (!page || page.missing || page.invalid || !page.title || !page.pageid || typeof page.extract !== "string") return null;
  const rev = page.revisions?.[0];
  if (!rev?.revid || !rev.timestamp) return null;
  return { title: page.title, pageid: page.pageid, revid: rev.revid, timestamp: rev.timestamp, extract: page.extract, fullurl: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}` };
}

/** An article cut to MAX_ARTICLE_CHARS at its last section heading before the cap. Pure. */
export function trimArticle(text: string, max = MAX_ARTICLE_CHARS): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const cut = head.lastIndexOf("\n==");
  return cut > max / 2 ? head.slice(0, cut) : head;
}

/** The permanent address of the revision read. */
export function permalinkOf(page: Pick<WikipediaPage, "title" | "revid">): string {
  return `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title.replace(/ /g, "_"))}&oldid=${page.revid}`;
}

/** The licence as recorded: the site's own name for it, the licence's address. */
export function wikipediaLicence(rights: { url?: string; text?: string } | null): Licence {
  return {
    name: "CC BY-SA 4.0",
    url: rights?.url || "https://creativecommons.org/licenses/by-sa/4.0/",
    text: `${rights?.text || "Creative Commons Attribution-Share Alike 4.0"} (the site's own rights information). Text is available under the Creative Commons Attribution-ShareAlike 4.0 License; every passage carries its article, revision and licence in its citation.`,
  };
}

/** What each passage of the article carries in its citation. Pure. */
export function wikipediaAttribution(page: Pick<WikipediaPage, "title" | "revid" | "timestamp">, licence: Licence): Attribution {
  return { kind: "WIKIPEDIA", title: page.title, revision: page.revid, revisedAt: page.timestamp, url: permalinkOf(page), licence: licence.name ?? "CC BY-SA 4.0", licenceUrl: licence.url };
}

/** The folder an article is filed under: wikipedia/<stream>/<subject>. */
export function wikipediaFolder(stream: WikipediaStream): string {
  return `wikipedia/${stream.toLowerCase()}/${STREAM_SUBJECT[stream].toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** The manifest entry for an article fetched for a stream. Pure (the caller adds the file, checksum and size). */
export function wikipediaEntry(page: WikipediaPage, stream: WikipediaStream, licence: Licence, file: string): Omit<ManifestEntry, "retrievedAt" | "sha256" | "bytes" | "fetched"> {
  return {
    file,
    title: page.title,
    board: "Wikipedia",
    gradeOrProgramme: stream,
    subject: STREAM_SUBJECT[stream],
    language: "en",
    edition: `revision ${page.revid}`,
    year: page.timestamp.slice(0, 4),
    sourceUrl: permalinkOf(page),
    licence,
    source: "wikipedia",
    kind: "encyclopedia",
    audience: "COLLEGE",
    streams: [stream],
    attribution: wikipediaAttribution(page, licence),
    extra: { pageid: page.pageid, revid: page.revid, revisedAt: page.timestamp, canonicalUrl: page.fullurl },
  };
}

/** The sources the plan named that are written down as refused, with their own words and where they are. */
export const REFUSED_SOURCES: { source: "indiacode" | "nptel" | "swayam"; board: string; url: string; error: string; licence: Licence; kind: ManifestEntry["kind"] }[] = [
  {
    source: "indiacode",
    board: "India Code (Legislative Department)",
    url: "https://indiacode.gov.in/",
    error:
      "not fetched: the portal's Copyright Policy (last updated 22 June 2026) forbids, without the Legislative Department's prior written permission, commercial use, reproduction and the systematic extraction of its content; links only (its Hyper Linking Policy allows linking)",
    licence: {
      url: "https://indiacode.gov.in/info/copyright-policy",
      text:
        'Without obtaining prior written permission from the Legislative Department, Ministry of Law and Justice, Government of India, the following activities are strictly prohibited: Commercial Exploitation … Reproduction and Distribution … Database Extraction: Systematic extraction, scraping, or harvesting of substantial portions of the Portal\'s database or content. Permitted Use: Limited personal, non-commercial use of the Portal content is permitted … (Copyright Policy, last updated June 22, 2026)',
    },
    kind: "law-text",
  },
  {
    source: "indiacode",
    board: "Legislative Department (the Constitution of India)",
    url: "https://www.legislative.gov.in/constitution-of-india/",
    error: "rendered by script: the page links no document a plain fetch can see; India Code's copy of the Constitution falls under the portal's Copyright Policy",
    licence: { url: "https://www.legislative.gov.in/" },
    kind: "law-text",
  },
  {
    source: "nptel",
    board: "NPTEL",
    url: "https://nptel.ac.in/",
    error: "not fetched: CC BY-NC-SA (the site's footer); Vidura is part of the paid plans, a commercial use the non-commercial clause does not allow; links only",
    licence: { name: "CC BY-NC-SA", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", text: "Distributed under Creative Commons Attribution-ShareAlike CC BY - NC - SA (the site's footer, read 18 October 2026)" },
    kind: "course",
  },
  {
    source: "swayam",
    board: "SWAYAM",
    url: "https://swayam.gov.in/",
    error: "not fetched: its Terms of Use make course materials for a learner's personal use in connection with the course only, and the courses sit behind a sign-in; links only",
    licence: {
      url: "https://swayam.gov.in/terms_of_use",
      text:
        "Unless otherwise expressly stated on the SWAYAM Site, the texts, exams, video, images, and other instructional materials provided with the courses and programs offered on the SWAYAM Site are for your personal use in connection with those courses and programs only. (Terms of Use, \"Your Right to use Content on the SWAYAM Site\")",
    },
    kind: "course",
  },
];
