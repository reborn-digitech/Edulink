/**
 * THE OFFICIAL ORGANISERS the competitions crawler starts from (competitions-crawler, 12 October 2026).
 * Organisers' own sites only: no coaching site, no aggregator, no news site. Each root URL was checked by
 * hand on 12 October 2026 with a plain GET under the crawler's User-Agent before it was listed here
 * (docs/plans/competitions-crawler.md lists the answers, and the URLs that did not answer:
 * https://www.mscepune.in/ gave no answer where https://mscepune.in/ does, and https://mtsexam.org/
 * fails its certificate where https://www.mtsexam.org/ does not). `npm run competitions:crawl --
 * --check-sources` asks them again.
 *
 * seedCompetitionSources adds a source only when its root URL is not in the table at all, so a source
 * the desk disabled or removed (a stamp, never a delete) is never switched back on by a fixture run.
 */
import type { PrismaClient } from "@prisma/client";
import type { CompetitionSourceKind, StreamCode } from "@edulink/contracts";

export type SeedSource = { name: string; rootUrl: string; organiser: string; kind: CompetitionSourceKind; /** college-content (12 Oct 2026): a college organiser's streams. */ streams?: StreamCode[] };

export const OFFICIAL_SOURCES: SeedSource[] = [
  { name: "Science Olympiads (HBCSE)", rootUrl: "https://olympiads.hbcse.tifr.res.in/", organiser: "Homi Bhabha Centre for Science Education, TIFR", kind: "OLYMPIAD" },
  { name: "National Standard Examinations (IAPT)", rootUrl: "https://iapt.org.in/", organiser: "Indian Association of Physics Teachers", kind: "OLYMPIAD" },
  { name: "National Talent Search Examination (NCERT)", rootUrl: "https://ncert.nic.in/national-talent-examination.php", organiser: "National Council of Educational Research and Training", kind: "TALENT_SEARCH" },
  { name: "Science Olympiad Foundation", rootUrl: "https://sofworld.org/", organiser: "Science Olympiad Foundation", kind: "OLYMPIAD" },
  { name: "SilverZone Olympiads", rootUrl: "https://www.silverzone.org/", organiser: "SilverZone Foundation", kind: "OLYMPIAD" },
  { name: "NSTSE (Unified Council)", rootUrl: "https://www.unifiedcouncil.com/", organiser: "Unified Council", kind: "TALENT_SEARCH" },
  { name: "CBSE academic (science exhibition)", rootUrl: "https://cbseacademic.nic.in/", organiser: "Central Board of Secondary Education", kind: "SCIENCE_FAIR" },
  { name: "INSPIRE Awards – MANAK (DST)", rootUrl: "https://www.inspireawards-dst.gov.in/", organiser: "Department of Science and Technology, Government of India", kind: "SCIENCE_FAIR" },
  { name: "Vidyarthi Vigyan Manthan", rootUrl: "https://vvm.org.in/", organiser: "Vijnana Bharati", kind: "TALENT_SEARCH" },
  { name: "Maharashtra Talent Search Examination (MTSE)", rootUrl: "https://www.mtsexam.org/", organiser: "Centre for Talent Search and Excellence, N. Wadia College, Pune", kind: "TALENT_SEARCH" },
  { name: "Maharashtra State Council of Examination", rootUrl: "https://mscepune.in/", organiser: "Maharashtra State Council of Examination, Pune", kind: "TALENT_SEARCH" },
  { name: "Bebras India", rootUrl: "https://www.bebras.in/", organiser: "Bebras India (CSpathshala, ACM India)", kind: "OTHER" },
  { name: "ISRO for students", rootUrl: "https://www.isro.gov.in/Students.html", organiser: "Indian Space Research Organisation", kind: "QUIZ" },
  // ---- college-content (12 Oct 2026): the college organisers. Each root answered 200 to a plain GET under the crawler's
  // User-Agent on 12 October 2026 (the Bar Council's in 661 bytes: a page drawn by script, which the crawler will record as
  // refused); www.aicte-india.org redirects to www.aicte.gov.in, which is listed; education.icar.gov.in gave no answer, so
  // ICAR's main site is listed instead.
  { name: "Bar Council of India", rootUrl: "https://www.barcouncilofindia.org/", organiser: "Bar Council of India", kind: "MOOT_COURT", streams: ["LAW"] },
  { name: "NLSIU moot courts", rootUrl: "https://www.nls.ac.in/", organiser: "National Law School of India University, Bengaluru", kind: "MOOT_COURT", streams: ["LAW"] },
  { name: "NALSAR moot courts", rootUrl: "https://nalsar.ac.in/", organiser: "NALSAR University of Law, Hyderabad", kind: "MOOT_COURT", streams: ["LAW"] },
  { name: "Smart India Hackathon", rootUrl: "https://sih.gov.in/", organiser: "Ministry of Education's Innovation Cell and AICTE", kind: "HACKATHON" },
  { name: "AICTE student events", rootUrl: "https://www.aicte.gov.in/", organiser: "All India Council for Technical Education", kind: "COLLEGE_EVENT", streams: ["ENGINEERING", "MANAGEMENT", "PHARMACY", "ARCHITECTURE"] },
  { name: "Pharmacy Council of India", rootUrl: "https://www.pci.nic.in/", organiser: "Pharmacy Council of India", kind: "COLLEGE_EVENT", streams: ["PHARMACY"] },
  { name: "ICAR student events", rootUrl: "https://icar.org.in/", organiser: "Indian Council of Agricultural Research", kind: "COLLEGE_EVENT", streams: ["AGRICULTURE"] },
  // ---- end college-content ----
];

/** Adds the official organisers not yet in the table; never touches one already there (enabled, disabled or removed). */
export async function seedCompetitionSources(db: Pick<PrismaClient, "competitionSource">): Promise<{ added: number; present: number }> {
  const present = new Set((await db.competitionSource.findMany({ select: { rootUrl: true } })).map((s) => s.rootUrl));
  let added = 0;
  for (const s of OFFICIAL_SOURCES) {
    if (present.has(s.rootUrl)) continue;
    await db.competitionSource.create({ data: { ...s, enabled: true, official: true, addedByRole: "FIXTURE" } });
    added++;
  }
  return { added, present: OFFICIAL_SOURCES.length - added };
}
