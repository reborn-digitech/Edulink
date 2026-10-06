/**
 * THE PER-STREAM SPEC TABLE of the demo colleges for every stream (6 October
 * 2026), read by scripts/demo-college-stream.ts (the builder) and
 * scripts/demo-college-check.ts (the checker). Names, departments,
 * programmes, courses, the affiliating university, the roster's local names
 * and the few words a stream's records need. What a college of the stream is
 * switched on for, files and offers its teachers is NOT here: it is
 * STREAM_PRESETS (packages/contracts v1/streams.ts) and DUTY_BUILT, read by
 * the builder, so a preset change moves the demo with it.
 *
 * Every person is made up; every email is `<prefix>.<role>@demo.relay.test`.
 * Every year written here is the scripts' 2026–27 literal and goes through
 * scripts/demo-calendar.ts.
 */
import type { Regulator, StreamCode } from "@edulink/contracts";

export type Gender = "M" | "F";
/** [code, name, semester, lecture, tutorial, practical credits]; a course with practical credits at a lab stream gets a LAB hour per batch. */
export type CourseRow = [code: string, name: string, semester: 1 | 2 | 3, l: number, t: number, p: number];
export type ProgrammeSpec = { code: string; name: string; level: "UG" | "PG" | "DIPLOMA"; years: number; intake: number; regulator: Regulator; courses: CourseRow[] };
export type DepartmentSpec = { code: string; name: string; hod: string; lab?: string; programme: ProgrammeSpec };
export type StudentRow = { name: string; gender: Gender; birth: string; category: "OPEN" | "OBC" };
export type StreamSpec = {
  stream: Exclude<StreamCode, "ARTS" | "SCIENCE" | "COMMERCE" | "ENGINEERING">;
  slug: string;
  name: string;
  /** The email prefix (`sim.registrar@…`) and the codes' prefix in capitals. */
  prefix: string;
  kind: "COLLEGE" | "AUTONOMOUS_COLLEGE";
  university: string;
  aishe: string;
  city: string;
  address: string;
  phone: string;
  brand: string;
  naacGrade: "A++" | "A+" | "A" | "B++" | "B+" | "B";
  nirf: "MANAGEMENT" | "PHARMACY" | "LAW" | "ARCHITECTURE" | "AGRICULTURE" | "COLLEGE";
  /** AICTE approves the college's programmes: an extension-of-approval reference is recorded. */
  aicte: boolean;
  depts: [DepartmentSpec, DepartmentSpec];
  pos: [string, string, string];
  /** registrar, principal, f1–f4, exams, iqac, tpo (where PLACEMENT is on), accounts, librarian, warden, driver. */
  staff: { registrar: string; principal: string; principalTitle: string; f1: string; f2: string; f3: string; f4: string; exams: string; iqac: string; tpo: string; accounts: string; librarian: string; warden: string; driver: string };
  /** Eight: 1–3 second year of the first programme (1 the twins' elder sister or brother), 4–6 second year of the second, 7–8 the twins in the first year of the first, both seventeen. */
  students: [StudentRow, StudentRow, StudentRow, StudentRow, StudentRow, StudentRow, StudentRow, StudentRow];
  parent: string;
  alumnus: { name: string; gender: Gender };
  recruiter: { name: string; company: string; pan14: string; sector: string; role: string; packageRupees: number; jd: string } | null;
  /** Annual tuition per programme, in paise (first, second). */
  tuition: [number, number];
  hostel: { name: string; kind: "BOYS" | "GIRLS" };
  route: { name: string; stops: [string, number, number][] };
  library: [isbn: string, title: string, author: string, publisher: string, year: number][];
  /** [kind, title, indexing, year, lakhs, by]: by is a staff key. */
  research: [string, string, string, number, number | null, "hodA" | "hodB" | "f1" | "f2" | "f3" | "f4"][];
  /** The practical record's two experiments per lab course (lab streams only). */
  experiments: Record<string, [string, string]>;
};

const pune = (n: number): [string, number, number][] => [
  ["Swargate bus stand", 18.50106, 73.86326],
  ["Deccan Gymkhana bus stop", 18.51741, 73.84123],
  ["The college's main gate", 18.5 + n / 1000, 73.8 + n / 1000],
];

export const STREAM_SPECS: StreamSpec[] = [
  {
    stream: "MANAGEMENT",
    slug: "saraswati-management",
    name: "Saraswati Institute of Management",
    prefix: "sim",
    kind: "COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41917",
    city: "Pune",
    address: "Survey No. 12, Paud Road, Kothrud",
    phone: "+912025381917",
    brand: "#7c3aed",
    naacGrade: "A",
    nirf: "MANAGEMENT",
    aicte: true,
    depts: [
      { code: "DBA", name: "Department of Business Administration", hod: "Dr Shubhangi Natu", programme: { code: "BBA", name: "Bachelor of Business Administration", level: "UG", years: 3, intake: 120, regulator: "UGC", courses: [["BBA101", "Principles of Management", 1, 3, 1, 0], ["BBA102", "Business Communication", 1, 3, 0, 0], ["BBA201", "Business Economics", 2, 3, 1, 0], ["BBA202", "Financial Accounting", 2, 3, 1, 0], ["BBA301", "Marketing Management", 3, 3, 1, 0], ["BBA302", "Human Resource Management", 3, 3, 0, 0]] } },
      { code: "DMS", name: "Department of Management Studies", hod: "Dr Ajit Paranjape", programme: { code: "MBA", name: "Master of Business Administration", level: "PG", years: 2, intake: 120, regulator: "AICTE", courses: [["MBA201", "Financial Management", 2, 3, 1, 0], ["MBA202", "Operations Management", 2, 3, 0, 0], ["MBA301", "Strategic Management", 3, 3, 1, 0], ["MBA302", "Business Analytics", 3, 3, 0, 0]] } },
    ],
    pos: ["Apply management theory to a business decision.", "Analyse a firm's markets, money and people.", "Communicate and lead in a team, ethically."],
    staff: { registrar: "Sunil Bhagwat", principal: "Dr Rekha Vaidya", principalTitle: "Director", f1: "Prof Amruta Joshi", f2: "Prof Kunal Sabnis", f3: "Prof Nandini Rao", f4: "Prof Tejas Mahajan", exams: "Dr Pradeep Kher", iqac: "Dr Sarika Phatak", tpo: "Ninad Kelkar", accounts: "Vaishali Jagtap", librarian: "Mangesh Sathe", warden: "Bharati Chavan", driver: "Ramesh Shelar" },
    students: [
      { name: "Gauri Deshmukh", gender: "F", birth: "2006-05-14", category: "OPEN" },
      { name: "Harsh Agarwal", gender: "M", birth: "2006-09-02", category: "OPEN" },
      { name: "Prachi Salunkhe", gender: "F", birth: "2006-11-23", category: "OBC" },
      { name: "Aniket Bhonsle", gender: "M", birth: "2003-02-10", category: "OPEN" },
      { name: "Ritu Malhotra", gender: "F", birth: "2003-07-19", category: "OPEN" },
      { name: "Sagar Kadam", gender: "M", birth: "2002-12-05", category: "OBC" },
      { name: "Riya Deshmukh", gender: "F", birth: "2009-03-21", category: "OPEN" },
      { name: "Rohan Deshmukh", gender: "M", birth: "2009-03-21", category: "OPEN" },
    ],
    parent: "Vivek Deshmukh",
    alumnus: { name: "Pooja Iyer", gender: "F" },
    recruiter: { name: "Shweta Menon", company: "Sahyadri Consulting Pvt Ltd", pan14: "27AAHCS6142K1Z", sector: "CONSULTING", role: "Management trainee — business analysis", packageRupees: 750_000, jd: "Market sizing, client workshops and the monthly review pack; six months rotating through two client teams." },
    tuition: [9_000_000, 16_000_000],
    hostel: { name: "Savitribai Hostel", kind: "GIRLS" },
    route: { name: "Route 1 — Swargate to Kothrud", stops: pune(17) },
    library: [["9789332587236", "Marketing Management", "Philip Kotler", "Pearson", 2017], ["9789352605934", "Financial Management", "Prasanna Chandra", "McGraw Hill", 2017], ["9789353163051", "Human Resource Management", "Gary Dessler", "Pearson", 2019]],
    research: [["PUBLICATION", "Working-capital practice of small manufacturers in Pune", "UGC_CARE", 2025, null, "hodB"], ["PROJECT", "Self-help groups and microcredit in Haveli taluka (ICSSR minor project)", "NONE", 2026, 3.2, "f3"], ["PUBLICATION", "Campus recruitment and the first-job gap", "PEER_REVIEWED", 2026, null, "f1"]],
    experiments: {},
  },
  {
    stream: "LAW",
    slug: "saraswati-law",
    name: "Saraswati Law College",
    prefix: "slc",
    kind: "COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41918",
    city: "Pune",
    address: "1180 Shivajinagar, near the district court",
    phone: "+912025531918",
    brand: "#9f1239",
    naacGrade: "B++",
    nirf: "LAW",
    aicte: false,
    depts: [
      { code: "LAWI", name: "Department of Integrated Law", hod: "Dr Medha Kulkarni", programme: { code: "BALLB", name: "BA LLB (five-year integrated)", level: "UG", years: 5, intake: 120, regulator: "BCI", courses: [["LAW101", "Legal Methods", 1, 4, 0, 0], ["LAW102", "Legal English", 1, 3, 1, 0], ["LAW201", "Law of Contract I", 2, 4, 0, 0], ["LAW202", "Political Science I", 2, 3, 1, 0], ["LAW301", "Constitutional Law I", 3, 4, 0, 0], ["LAW302", "Law of Torts", 3, 3, 1, 0]] } },
      { code: "LLB", name: "Department of Legal Studies", hod: "Dr Rajendra Patwardhan", programme: { code: "LLB", name: "LLB (three-year)", level: "UG", years: 3, intake: 120, regulator: "BCI", courses: [["LLB201", "Family Law I", 2, 4, 0, 0], ["LLB202", "Criminal Law I", 2, 4, 0, 0], ["LLB301", "Jurisprudence", 3, 4, 0, 0], ["LLB302", "Property Law", 3, 3, 1, 0]] } },
    ],
    pos: ["Read, interpret and apply statutes and case law.", "Argue a case orally and in writing.", "Practise with the ethics the Bar Council asks of an advocate."],
    staff: { registrar: "Anand Gadgil", principal: "Dr Jayashree Bapat", principalTitle: "Principal", f1: "Prof Saurabh Limaye", f2: "Prof Ketaki Ghate", f3: "Prof Imran Shaikh", f4: "Prof Leena D'Souza", exams: "Dr Mohan Karve", iqac: "Dr Asmita Joglekar", tpo: "Rahul Sawant", accounts: "Deepa Kulkarni", librarian: "Shrikant Mule", warden: "Suresh Gaikwad", driver: "Babasaheb Jadhav" },
    students: [
      { name: "Aditi Ranade", gender: "F", birth: "2006-06-12", category: "OPEN" },
      { name: "Kabir Sethi", gender: "M", birth: "2006-08-30", category: "OPEN" },
      { name: "Mrunal Pawar", gender: "F", birth: "2006-12-01", category: "OBC" },
      { name: "Faisal Qureshi", gender: "M", birth: "2003-03-14", category: "OPEN" },
      { name: "Neha Bhosale", gender: "F", birth: "2003-10-09", category: "OPEN" },
      { name: "Vinayak More", gender: "M", birth: "2002-11-17", category: "OBC" },
      { name: "Ishan Ranade", gender: "M", birth: "2009-04-02", category: "OPEN" },
      { name: "Isha Ranade", gender: "F", birth: "2009-04-02", category: "OPEN" },
    ],
    parent: "Milind Ranade",
    alumnus: { name: "Akshay Kulkarni", gender: "M" },
    recruiter: { name: "Meenal Kale", company: "Kale and Associates, Advocates", pan14: "27AAFFK3921L1Z", sector: "OTHER", role: "Associate — civil litigation", packageRupees: 600_000, jd: "Drafting plaints and written statements, research for briefs, appearances before the civil court with a partner." },
    tuition: [6_000_000, 5_000_000],
    hostel: { name: "Ambedkar Hostel", kind: "BOYS" },
    route: { name: "Route 1 — Swargate to Shivajinagar", stops: pune(18) },
    library: [["9789351451907", "Constitutional Law of India", "J. N. Pandey", "Central Law Agency", 2019], ["9789388822268", "The Law of Torts", "Ratanlal and Dhirajlal", "LexisNexis", 2019], ["9789386245694", "Law of Contract", "Avtar Singh", "Eastern Book Company", 2017]],
    research: [["PUBLICATION", "Mediation in family courts of Maharashtra: a five-year reading", "UGC_CARE", 2025, null, "hodA"], ["PUBLICATION", "Legal aid clinics in law colleges and access to justice", "PEER_REVIEWED", 2026, null, "f2"], ["PROJECT", "Survey of undertrial prisoners in Yerawada (state legal services authority)", "NONE", 2026, 2.5, "hodB"]],
    experiments: {},
  },
  {
    stream: "EDUCATION",
    slug: "saraswati-education",
    name: "Saraswati College of Education",
    prefix: "sce",
    kind: "COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41919",
    city: "Pune",
    address: "Survey No. 7, Karve Nagar",
    phone: "+912025441919",
    brand: "#b45309",
    naacGrade: "A",
    nirf: "COLLEGE",
    aicte: false,
    depts: [
      { code: "ITE", name: "Department of Integrated Teacher Education", hod: "Dr Vandana Kher", programme: { code: "ITEP", name: "B.A. B.Ed. (Integrated Teacher Education Programme)", level: "UG", years: 4, intake: 50, regulator: "NCTE", courses: [["ITE101", "Childhood and Growing Up", 1, 3, 1, 0], ["ITE102", "Foundations of Education", 1, 3, 0, 0], ["ITE201", "Learning and Teaching", 2, 3, 1, 0], ["ITE202", "Language across the Curriculum", 2, 3, 0, 0], ["ITE301", "Pedagogy of Mathematics", 3, 3, 1, 0], ["ITE302", "Assessment for Learning", 3, 3, 0, 0]] } },
      { code: "EDU", name: "Department of Education", hod: "Dr Prakash Shinde", programme: { code: "BED", name: "B.Ed. (two-year)", level: "UG", years: 2, intake: 100, regulator: "NCTE", courses: [["BED201", "Knowledge and Curriculum", 2, 3, 1, 0], ["BED202", "Pedagogy of a School Subject", 2, 3, 0, 0], ["BED301", "School Internship", 3, 2, 0, 0], ["BED302", "Inclusive Education", 3, 3, 0, 0]] } },
    ],
    pos: ["Plan, teach and assess a lesson for a real classroom.", "Understand how children grow and learn.", "Work with every child, school and parent fairly."],
    staff: { registrar: "Shailaja Dixit", principal: "Dr Arvind Phadke", principalTitle: "Principal", f1: "Prof Manisha Kale", f2: "Prof Sandeep Wagh", f3: "Prof Swapnali Ghorpade", f4: "Prof Yogesh Patil", exams: "Dr Kalpana Mehta", iqac: "Dr Nilesh Ambekar", tpo: "Archana Bhave", accounts: "Santosh Kamble", librarian: "Usha Deshpande", warden: "Sunita Pawar", driver: "Vitthal Shinde" },
    students: [
      { name: "Snehal Gokhale", gender: "F", birth: "2006-07-18", category: "OPEN" },
      { name: "Tushar Mane", gender: "M", birth: "2006-10-04", category: "OPEN" },
      { name: "Komal Jadhav", gender: "F", birth: "2006-12-20", category: "OBC" },
      { name: "Rupali Thakur", gender: "F", birth: "2002-04-25", category: "OPEN" },
      { name: "Mahesh Gavade", gender: "M", birth: "2001-09-13", category: "OPEN" },
      { name: "Shital Waghmare", gender: "F", birth: "2002-01-30", category: "OBC" },
      { name: "Sai Gokhale", gender: "M", birth: "2009-05-11", category: "OPEN" },
      { name: "Sara Gokhale", gender: "F", birth: "2009-05-11", category: "OPEN" },
    ],
    parent: "Sanjay Gokhale",
    alumnus: { name: "Prajakta Joshi", gender: "F" },
    recruiter: { name: "Anjali Sharma", company: "Jnanadeep Educational Trust", pan14: "27AAATJ4417P1Z", sector: "EDTECH", role: "Primary teacher — mathematics", packageRupees: 360_000, jd: "Teach mathematics to classes 3 to 5 in the trust's two English-medium schools; a term's induction with a mentor teacher." },
    tuition: [5_000_000, 6_500_000],
    hostel: { name: "Tarabai Hostel", kind: "GIRLS" },
    route: { name: "Route 1 — Swargate to Karve Nagar", stops: pune(19) },
    library: [["9789353145194", "Childhood and Growing Up", "S. K. Mangal", "PHI Learning", 2019], ["9789386650788", "Assessment for Learning", "Kiran Walia", "Pearson", 2018], ["9789387506695", "Pedagogy of Mathematics", "Sudhir Kumar", "Pearson", 2018]],
    research: [["PUBLICATION", "Activity-based mathematics in Zilla Parishad schools of Pune", "UGC_CARE", 2025, null, "hodB"], ["PUBLICATION", "Mother-tongue instruction in the foundational stage", "PEER_REVIEWED", 2026, null, "f1"], ["PROJECT", "Remedial reading for class 3 (district education office)", "NONE", 2026, 1.8, "hodA"]],
    experiments: {},
  },
  {
    stream: "PHARMACY",
    slug: "saraswati-pharmacy",
    name: "Saraswati College of Pharmacy",
    prefix: "scp",
    kind: "COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41920",
    city: "Pune",
    address: "Gat No. 33, Nanded City Road, Narhe",
    phone: "+912024691920",
    brand: "#0e7490",
    naacGrade: "A",
    nirf: "PHARMACY",
    aicte: true,
    depts: [
      { code: "PCEU", name: "Department of Pharmaceutics", hod: "Dr Shilpa Gadre", lab: "Pharmaceutics Lab", programme: { code: "BPHARM", name: "B.Pharm", level: "UG", years: 4, intake: 100, regulator: "PCI", courses: [["BP101", "Human Anatomy and Physiology I", 1, 3, 1, 1], ["BP102", "Pharmaceutical Analysis I", 1, 3, 1, 0], ["BP201", "Human Anatomy and Physiology II", 2, 3, 1, 1], ["BP202", "Pharmaceutical Organic Chemistry I", 2, 3, 1, 1], ["BP301", "Pharmaceutical Organic Chemistry II", 3, 3, 1, 1], ["BP302", "Physical Pharmaceutics I", 3, 3, 1, 0]] } },
      { code: "PCHEM", name: "Department of Pharmaceutical Chemistry", hod: "Dr Ravindra Ingle", lab: "Pharmaceutical Chemistry Lab", programme: { code: "DPHARM", name: "D.Pharm", level: "DIPLOMA", years: 2, intake: 60, regulator: "PCI", courses: [["DP201", "Pharmacology", 2, 3, 0, 1], ["DP202", "Community Pharmacy and Management", 2, 3, 0, 0], ["DP301", "Pharmaceutical Chemistry", 3, 3, 0, 1], ["DP302", "Hospital and Clinical Pharmacy", 3, 3, 0, 0]] } },
    ],
    pos: ["Apply pharmaceutical sciences to the making and testing of medicines.", "Dispense and counsel safely in a pharmacy.", "Practise to the Pharmacy Council's code and the drug laws."],
    staff: { registrar: "Prashant Oak", principal: "Dr Madhuri Kulkarni", principalTitle: "Principal", f1: "Prof Sachin Bhalerao", f2: "Prof Aparna Ghaisas", f3: "Prof Mayur Dhole", f4: "Prof Priti Rane", exams: "Dr Vikram Bedekar", iqac: "Dr Seema Apte", tpo: "Nitin Lokhande", accounts: "Jyoti Bhagat", librarian: "Anil Pethe", warden: "Dnyaneshwar Kale", driver: "Shankar Pol" },
    students: [
      { name: "Tanmay Chitale", gender: "M", birth: "2006-04-09", category: "OPEN" },
      { name: "Sakshi Nair", gender: "F", birth: "2006-08-21", category: "OPEN" },
      { name: "Pranav Ghodke", gender: "M", birth: "2006-10-28", category: "OBC" },
      { name: "Dhanashree Patil", gender: "F", birth: "2005-03-03", category: "OPEN" },
      { name: "Yogita Sonawane", gender: "F", birth: "2005-07-26", category: "OPEN" },
      { name: "Akash Mhaske", gender: "M", birth: "2005-01-12", category: "OBC" },
      { name: "Om Chitale", gender: "M", birth: "2009-02-17", category: "OPEN" },
      { name: "Ovi Chitale", gender: "F", birth: "2009-02-17", category: "OPEN" },
    ],
    parent: "Hemant Chitale",
    alumnus: { name: "Rucha Dandekar", gender: "F" },
    recruiter: { name: "Vikas Agashe", company: "Indrayani Pharmaceuticals Ltd", pan14: "27AABCI5528D1Z", sector: "PHARMA_HEALTH", role: "Production chemist trainee", packageRupees: 420_000, jd: "Tablet and capsule lines under GMP; batch records, in-process checks and a year's rotation through quality control." },
    tuition: [11_000_000, 8_000_000],
    hostel: { name: "Dhanvantari Hostel", kind: "BOYS" },
    route: { name: "Route 1 — Swargate to Narhe", stops: pune(20) },
    library: [["9788123926513", "Textbook of Pharmaceutical Chemistry", "Jayashree Ghosh", "S. Chand", 2014], ["9788120334575", "Tortora's Principles of Anatomy and Physiology", "Gerard Tortora", "Wiley", 2017], ["9789351520665", "Physical Pharmaceutics", "C. V. S. Subrahmanyam", "Vallabh Prakashan", 2015]],
    research: [["PUBLICATION", "Sustained-release matrix tablets of metformin with natural gums", "SCOPUS", 2026, null, "hodA"], ["PATENT", "A taste-masked paediatric paracetamol suspension", "NONE", 2025, null, "f1"], ["PROJECT", "Antimicrobial screening of Western Ghats plant extracts (state grant)", "NONE", 2025, 6.5, "hodB"]],
    experiments: {
      BP301: ["Preparation of benzoic acid from benzamide", "Preparation of acetanilide from aniline"],
      BP101: ["Study of the compound microscope", "Recording of blood pressure"],
      DP301: ["Limit test for chlorides", "Limit test for sulphates"],
    },
  },
  {
    stream: "ARCHITECTURE",
    slug: "saraswati-architecture",
    name: "Saraswati School of Architecture",
    prefix: "ssa",
    kind: "AUTONOMOUS_COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41921",
    city: "Pune",
    address: "Survey No. 58, Baner Road, Aundh",
    phone: "+912025881921",
    brand: "#4d7c0f",
    naacGrade: "A",
    nirf: "ARCHITECTURE",
    aicte: false,
    depts: [
      { code: "ARCH", name: "Department of Architecture", hod: "Dr Sunanda Mhatre", programme: { code: "BARCH", name: "B.Arch", level: "UG", years: 5, intake: 80, regulator: "COA", courses: [["AR101", "Architectural Design I", 1, 2, 0, 3], ["AR102", "Building Materials and Construction I", 1, 3, 0, 1], ["AR201", "Architectural Design II", 2, 2, 0, 3], ["AR202", "History of Architecture I", 2, 3, 0, 0], ["AR301", "Architectural Design III", 3, 2, 0, 3], ["AR302", "Structural Systems I", 3, 3, 1, 0]] } },
      { code: "UD", name: "Department of Urban Design", hod: "Dr Abhay Karandikar", programme: { code: "MARCH", name: "M.Arch (Urban Design)", level: "PG", years: 2, intake: 20, regulator: "COA", courses: [["MA201", "Urban Design Studio I", 2, 2, 0, 4], ["MA202", "Research Methods in Design", 2, 3, 0, 0], ["MA301", "Advanced Urban Design Studio", 3, 2, 0, 4], ["MA302", "Sustainable Urbanism", 3, 3, 0, 0]] } },
    ],
    pos: ["Design buildings and places that answer their site and people.", "Build with an understanding of structure, services and materials.", "Practise to the Council of Architecture's standards."],
    staff: { registrar: "Kishor Vaze", principal: "Dr Anuradha Naik", principalTitle: "Principal", f1: "Prof Rohit Paranjpe", f2: "Prof Gayatri Kanade", f3: "Prof Siddhesh Nene", f4: "Prof Mitali Sarnaik", exams: "Dr Harish Deo", iqac: "Dr Vrushali Bendre", tpo: "Amol Khedekar", accounts: "Sangeeta Ware", librarian: "Rajani Bapat", warden: "Prakash Zende", driver: "Maruti Kokate" },
    students: [
      { name: "Ananya Phadnis", gender: "F", birth: "2006-01-25", category: "OPEN" },
      { name: "Devansh Kapoor", gender: "M", birth: "2006-05-17", category: "OPEN" },
      { name: "Shravani Kumbhar", gender: "F", birth: "2006-09-09", category: "OBC" },
      { name: "Nikhil Dabholkar", gender: "M", birth: "2001-06-06", category: "OPEN" },
      { name: "Tanvi Rege", gender: "F", birth: "2001-11-11", category: "OPEN" },
      { name: "Omkar Hande", gender: "M", birth: "2001-02-22", category: "OBC" },
      { name: "Arnav Phadnis", gender: "M", birth: "2009-01-30", category: "OPEN" },
      { name: "Avani Phadnis", gender: "F", birth: "2009-01-30", category: "OPEN" },
    ],
    parent: "Abhijit Phadnis",
    alumnus: { name: "Siddharth Vaidya", gender: "M" },
    recruiter: { name: "Kavya Iyer", company: "Studio Vastu Architects LLP", pan14: "27AAKFS7731B1Z", sector: "OTHER", role: "Junior architect", packageRupees: 480_000, jd: "Working drawings and municipal submissions for housing projects; site visits with a project architect." },
    tuition: [15_000_000, 12_000_000],
    hostel: { name: "Laurie Baker Hostel", kind: "BOYS" },
    route: { name: "Route 1 — Swargate to Aundh", stops: pune(21) },
    library: [["9780470641910", "Architecture: Form, Space, and Order", "Francis D. K. Ching", "Wiley", 2014], ["9780199463152", "Indian Architecture", "Percy Brown", "Oxford University Press", 2016], ["9780415507769", "Time-Saver Standards for Building Types", "Joseph De Chiara", "McGraw Hill", 2001]],
    research: [["PUBLICATION", "Courtyard houses of Pune's old city and their thermal comfort", "SCOPUS", 2026, null, "hodA"], ["PROJECT", "Street vending zones for the Aundh ward (municipal study)", "NONE", 2025, 4.0, "hodB"], ["CONFERENCE", "Low-cost housing with stabilised earth blocks", "PEER_REVIEWED", 2026, null, "f2"]],
    experiments: {},
  },
  {
    stream: "AGRICULTURE",
    slug: "saraswati-agriculture",
    name: "Saraswati College of Agriculture",
    prefix: "sca",
    kind: "COLLEGE",
    university: "Mahatma Phule Krishi Vidyapeeth, Rahuri",
    aishe: "C-41922",
    city: "Shirur",
    address: "Gat No. 410, Pune–Ahmednagar Road, Shirur",
    phone: "+912138221922",
    brand: "#15803d",
    naacGrade: "B++",
    nirf: "AGRICULTURE",
    aicte: false,
    depts: [
      { code: "AGRO", name: "Department of Agronomy", hod: "Dr Bhaskar Thorat", lab: "Soil Science Lab", programme: { code: "BSCAG", name: "B.Sc. (Hons) Agriculture", level: "UG", years: 4, intake: 120, regulator: "ICAR", courses: [["AGR101", "Fundamentals of Agronomy", 1, 2, 0, 1], ["AGR102", "Fundamentals of Soil Science", 1, 2, 0, 1], ["AGR201", "Principles of Genetics", 2, 2, 0, 1], ["AGR202", "Agricultural Microbiology", 2, 2, 0, 1], ["AGR301", "Crop Production Technology I", 3, 1, 0, 1], ["AGR302", "Agricultural Economics", 3, 2, 0, 0]] } },
      { code: "HORT", name: "Department of Horticulture", hod: "Dr Sunita Kharade", lab: "Horticulture Lab", programme: { code: "BSCHORT", name: "B.Sc. (Hons) Horticulture", level: "UG", years: 4, intake: 60, regulator: "ICAR", courses: [["HOR201", "Fundamentals of Horticulture", 2, 2, 0, 1], ["HOR202", "Plant Propagation and Nursery Management", 2, 1, 0, 1], ["HOR301", "Production Technology of Fruit Crops", 3, 2, 0, 1], ["HOR302", "Plant Pathology", 3, 2, 0, 0]] } },
    ],
    pos: ["Grow crops well on Maharashtra's soils and seasons.", "Advise a farmer on seed, water, nutrients and pests.", "Run an experiment in the field and read its numbers."],
    staff: { registrar: "Dattatray Jagtap", principal: "Dr Shivaji Pawar", principalTitle: "Associate dean and principal", f1: "Prof Ganesh Bhosale", f2: "Prof Rupali Kadam", f3: "Prof Santosh Nalawade", f4: "Prof Priyanka Gaikwad", exams: "Dr Ashok Kale", iqac: "Dr Manjusha Raut", tpo: "Vijay Shitole", accounts: "Sudhir Dhumal", librarian: "Kavita Wable", warden: "Balasaheb Ghule", driver: "Hanumant Khaire" },
    students: [
      { name: "Pratiksha Shinde", gender: "F", birth: "2006-03-08", category: "OPEN" },
      { name: "Rohit Gade", gender: "M", birth: "2006-07-07", category: "OPEN" },
      { name: "Swati Lokhande", gender: "F", birth: "2006-10-19", category: "OBC" },
      { name: "Akshay Daund", gender: "M", birth: "2006-02-01", category: "OPEN" },
      { name: "Pooja Jagdale", gender: "F", birth: "2006-05-28", category: "OPEN" },
      { name: "Sachin Kolekar", gender: "M", birth: "2005-12-12", category: "OBC" },
      { name: "Yash Shinde", gender: "M", birth: "2009-06-14", category: "OPEN" },
      { name: "Yashashri Shinde", gender: "F", birth: "2009-06-14", category: "OPEN" },
    ],
    parent: "Ramdas Shinde",
    alumnus: { name: "Ajinkya Pawar", gender: "M" },
    recruiter: { name: "Mahesh Kulkarni", company: "Godavari Agro Inputs Pvt Ltd", pan14: "27AAGCG2954E1Z", sector: "FMCG_RETAIL", role: "Field officer — crop advisory", packageRupees: 360_000, jd: "Crop advisory for sugarcane and onion growers in two talukas; demonstration plots and farmer meetings." },
    tuition: [7_500_000, 7_500_000],
    hostel: { name: "Krishi Hostel", kind: "BOYS" },
    route: { name: "Route 1 — Shirur bus stand to the college", stops: [["Shirur bus stand", 18.82721, 74.37378], ["Ranjangaon MIDC gate", 18.75722, 74.25124], ["The college's main gate", 18.81022, 74.35118]] },
    library: [["9788171640164", "Principles of Agronomy", "S. R. Reddy", "Kalyani Publishers", 2016], ["9788122417463", "Introductory Soil Science", "D. K. Das", "Kalyani Publishers", 2015], ["9788122434620", "Fundamentals of Horticulture", "K. V. Peter", "New India Publishing", 2014]],
    research: [["PUBLICATION", "Drip fertigation of onion on the black soils of Shirur", "UGC_CARE", 2025, null, "hodA"], ["PROJECT", "Pomegranate bacterial blight survey (state agriculture department)", "NONE", 2026, 5.5, "hodB"], ["PUBLICATION", "Soil organic carbon under sugarcane trash mulching", "SCOPUS", 2026, null, "f1"]],
    experiments: {
      AGR301: ["Seed rate calculation and seed treatment", "Fertiliser calculation for a kharif crop"],
      AGR101: ["Identification of crops and seeds", "Study of tillage implements"],
      HOR301: ["Layout of an orchard by the square system", "Training and pruning of a grapevine"],
    },
  },
  {
    stream: "VOCATIONAL",
    slug: "saraswati-vocational",
    name: "Saraswati Vocational College",
    prefix: "svc",
    kind: "COLLEGE",
    university: "Savitribai Phule Pune University",
    aishe: "C-41923",
    city: "Pimpri-Chinchwad",
    address: "Plot 22, Sector 26, Nigdi Pradhikaran",
    phone: "+912027651923",
    brand: "#c2410c",
    naacGrade: "B+",
    nirf: "COLLEGE",
    aicte: false,
    depts: [
      { code: "VSD", name: "Department of Software Development", hod: "Dr Smita Bendre", lab: "Computer Lab", programme: { code: "BVSD", name: "B.Voc. Software Development", level: "UG", years: 3, intake: 50, regulator: "UGC", courses: [["VSD101", "Computer Fundamentals", 1, 2, 0, 2], ["VSD102", "Communication Skills", 1, 2, 1, 0], ["VSD201", "Web Design", 2, 2, 0, 2], ["VSD202", "Database Basics", 2, 2, 0, 1], ["VSD301", "Programming in Java", 3, 2, 0, 2], ["VSD302", "Software Testing", 3, 3, 0, 0]] } },
      { code: "VFP", name: "Department of Food Processing", hod: "Dr Ajay Mahajan", lab: "Food Processing Lab", programme: { code: "BVFP", name: "B.Voc. Food Processing", level: "UG", years: 3, intake: 50, regulator: "UGC", courses: [["VFP201", "Food Microbiology", 2, 2, 0, 1], ["VFP202", "Food Safety Standards", 2, 3, 0, 0], ["VFP301", "Fruit and Vegetable Processing", 3, 2, 0, 2], ["VFP302", "Food Packaging Technology", 3, 3, 0, 0]] } },
    ],
    pos: ["Do the job of the trade to the NSQF level of the year.", "Work safely and to the industry's standard.", "Learn on the job and keep learning."],
    staff: { registrar: "Ravindra Lad", principal: "Dr Shubhada Joshi", principalTitle: "Principal", f1: "Prof Amit Kshirsagar", f2: "Prof Sneha Bhat", f3: "Prof Rahul Dhage", f4: "Prof Kirti Sontakke", exams: "Dr Anil Shinde", iqac: "Dr Medha Pande", tpo: "", accounts: "Sameer Borate", librarian: "Jayant Kulkarni", warden: "Nanda Pawar", driver: "Ashok Gaikwad" },
    students: [
      { name: "Kshitija Mohite", gender: "F", birth: "2006-02-14", category: "OPEN" },
      { name: "Jay Solanki", gender: "M", birth: "2006-06-26", category: "OPEN" },
      { name: "Nikita Sawant", gender: "F", birth: "2006-09-30", category: "OBC" },
      { name: "Rahul Chavan", gender: "M", birth: "2006-01-19", category: "OPEN" },
      { name: "Sayali Raut", gender: "F", birth: "2006-04-11", category: "OPEN" },
      { name: "Vishal Kamble", gender: "M", birth: "2005-11-05", category: "OBC" },
      { name: "Parth Mohite", gender: "M", birth: "2009-07-04", category: "OPEN" },
      { name: "Pari Mohite", gender: "F", birth: "2009-07-04", category: "OPEN" },
    ],
    parent: "Dilip Mohite",
    alumnus: { name: "Swapnil Desai", gender: "M" },
    recruiter: null,
    tuition: [4_000_000, 4_000_000],
    hostel: { name: "Ahilya Hostel", kind: "GIRLS" },
    route: { name: "Route 1 — Pimpri to Nigdi", stops: [["Pimpri bus stop", 18.62786, 73.80045], ["Chinchwad station", 18.64223, 73.79317], ["The college's main gate", 18.65511, 73.77214]] },
    library: [["9789332555457", "Head First Java", "Kathy Sierra", "O'Reilly", 2015], ["9789387472099", "Software Testing", "Ron Patton", "Pearson", 2018], ["9788122427271", "Food Science", "B. Srilakshmi", "New Age International", 2015]],
    research: [["PUBLICATION", "Apprenticeship-embedded degrees and the first year at work", "PEER_REVIEWED", 2025, null, "hodA"], ["PROJECT", "Shelf life of millet cookies in small bakeries (MSME cluster study)", "NONE", 2026, 2.2, "hodB"], ["PUBLICATION", "Test-first teaching of Java to first-generation learners", "UGC_CARE", 2026, null, "f1"]],
    experiments: {
      VSD301: ["Classes and objects: a bank account", "Exception handling in a file reader"],
      VSD101: ["Assembling a desktop computer", "Installing an operating system"],
      VFP301: ["Preparation of mango jam", "Preparation of tomato ketchup"],
    },
  },
  {
    stream: "HEALTH_SCIENCES",
    slug: "saraswati-health",
    name: "Saraswati Institute of Health Sciences",
    prefix: "sih",
    kind: "COLLEGE",
    university: "Maharashtra University of Health Sciences, Nashik",
    aishe: "C-41924",
    city: "Nashik",
    address: "Survey No. 91, Gangapur Road",
    phone: "+912532341924",
    brand: "#be123c",
    naacGrade: "A",
    nirf: "COLLEGE",
    aicte: false,
    depts: [
      { code: "MSN", name: "Department of Medical-Surgical Nursing", hod: "Dr Shobha Wagh", lab: "Nursing Foundations Lab", programme: { code: "BSCN", name: "B.Sc. Nursing", level: "UG", years: 4, intake: 60, regulator: "INC", courses: [["NUR101", "Applied Anatomy", 1, 3, 0, 1], ["NUR102", "Applied Physiology", 1, 3, 0, 0], ["NUR201", "Applied Biochemistry", 2, 2, 0, 0], ["NUR202", "Nursing Foundations I", 2, 3, 0, 1], ["NUR301", "Applied Microbiology and Infection Control", 3, 2, 0, 1], ["NUR302", "Pharmacology I", 3, 3, 0, 0]] } },
      { code: "CHN", name: "Department of Community Health Nursing", hod: "Dr Rekha Deore", lab: "Community Health Nursing Lab", programme: { code: "PBBSCN", name: "Post Basic B.Sc. Nursing", level: "UG", years: 2, intake: 30, regulator: "INC", courses: [["PBN201", "Nursing Foundation", 2, 3, 0, 1], ["PBN202", "Nutrition and Dietetics", 2, 2, 0, 0], ["PBN301", "Community Health Nursing", 3, 2, 0, 1], ["PBN302", "Nursing Research and Statistics", 3, 3, 0, 0]] } },
    ],
    pos: ["Give safe, kind nursing care in the ward and the community.", "Apply the sciences of the body to a patient's care.", "Work to the Indian Nursing Council's code."],
    staff: { registrar: "Mahendra Ahire", principal: "Dr Varsha Nikam", principalTitle: "Principal", f1: "Prof Jayashri Sonar", f2: "Prof Rajesh Bagul", f3: "Prof Manasi Kulkarni", f4: "Prof Deepak Pagare", exams: "Dr Sunil Gite", iqac: "Dr Asha Thakare", tpo: "Pankaj Borse", accounts: "Lata Shewale", librarian: "Vandana Pingle", warden: "Shalini Gangurde", driver: "Kailas Sangle" },
    students: [
      { name: "Priyanka Bachhav", gender: "F", birth: "2006-03-27", category: "OPEN" },
      { name: "Ashwini Kale", gender: "F", birth: "2006-06-15", category: "OPEN" },
      { name: "Bhagyashri Jadhav", gender: "F", birth: "2006-10-10", category: "OBC" },
      { name: "Manoj Pawar", gender: "M", birth: "1999-04-04", category: "OPEN" },
      { name: "Sushma Patil", gender: "F", birth: "1998-12-18", category: "OPEN" },
      { name: "Kiran Gaikwad", gender: "F", birth: "1999-08-22", category: "OBC" },
      { name: "Neel Bachhav", gender: "M", birth: "2009-08-08", category: "OPEN" },
      { name: "Nidhi Bachhav", gender: "F", birth: "2009-08-08", category: "OPEN" },
    ],
    parent: "Nitin Bachhav",
    alumnus: { name: "Monali Deshmukh", gender: "F" },
    recruiter: { name: "Aditi Sathe", company: "Sanjeevani Multispeciality Hospital Pvt Ltd", pan14: "27AAJCS8846H1Z", sector: "PHARMA_HEALTH", role: "Staff nurse", packageRupees: 330_000, jd: "Staff nurse on the medical and surgical wards; three months' orientation with a nurse educator." },
    tuition: [12_000_000, 8_000_000],
    hostel: { name: "Florence Hostel", kind: "GIRLS" },
    route: { name: "Route 1 — CBS to Gangapur Road", stops: [["Nashik CBS", 20.00203, 73.78567], ["College Road, Bhonsala gate", 20.01312, 73.76219], ["The institute's main gate", 20.01844, 73.74412]] },
    library: [["9789386217646", "Textbook of Anatomy and Physiology for Nurses", "P. R. Ashalatha", "Jaypee", 2017], ["9789352704507", "Fundamentals of Nursing", "Suresh K. Sharma", "Elsevier", 2018], ["9789352701803", "Community Health Nursing", "K. Park", "Banarsidas Bhanot", 2018]],
    research: [["PUBLICATION", "Hand hygiene compliance in a district hospital's wards", "UGC_CARE", 2025, null, "hodA"], ["PROJECT", "Anaemia among adolescent girls of Trimbak block (district health society)", "NONE", 2026, 3.0, "hodB"], ["PUBLICATION", "Simulation-based teaching of intravenous cannulation", "SCOPUS", 2026, null, "f1"]],
    experiments: {
      NUR301: ["Hand hygiene and personal protective equipment", "Culture smear and Gram staining"],
      NUR101: ["Identification of the bones of the upper limb", "Study of the heart model"],
      PBN301: ["Family health assessment: a home visit record", "Preparation of oral rehydration solution"],
    },
  },
];

export function specOf(arg: string): StreamSpec | undefined {
  const a = arg.trim().toUpperCase();
  return STREAM_SPECS.find((s) => s.stream === a || s.slug.toUpperCase() === a || s.prefix.toUpperCase() === a);
}
