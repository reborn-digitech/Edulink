/**
 * The fixed ids of the ZZ library and hostel at ZZ Northgate
 * (scripts/zz-library-hostel.ts writes the rows with them), so the API
 * catalog's samples can name a title, a copy, a fine, a hostel, a bed, a
 * leave or a visitor without a field of their own in the sweep's fixture.
 * Each is in the shape the contracts' cuid check accepts. Only ZZ data.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const LIBRARY_FIXTURE = {
  title: (n: number) => pad("zzlibtitle", n),
  copy: (n: number) => pad("zzlibcopy", n),
  /** Pupil 01's overdue loan, and pupil 02's current one. */
  overdueIssue: pad("zzlibissue", 1),
  currentIssue: pad("zzlibissue", 2),
  /** A loan returned late long ago, whose fines are the due one and the settled one. */
  returnedIssue: pad("zzlibissue", 3),
  /** Pupil 01's place in the queue for title 1, and their cancelled one for title 2. */
  reservation: pad("zzlibresv", 1),
  cancelledReservation: pad("zzlibresv", 2),
  dueFine: pad("zzlibfine", 1),
  settledFine: pad("zzlibfine", 2),
  /** The accession of copy 1, as a scan would read it. */
  accession: (n: number) => `ZZ-${String(n).padStart(4, "0")}`,
} as const;

export const HOSTEL_FIXTURE = {
  hostel: pad("zzhostel", 1),
  room: (n: number) => pad("zzhroom", n),
  /** Pupil 01's bed is allotment 1. */
  allotment: (n: number) => pad("zzhallot", n),
  /** Pupil 01's approved leave, already out and back (the gate's doors are no-ops on it), and their cancelled ask. */
  returnedLeave: pad("zzhleave", 1),
  cancelledLeave: pad("zzhleave", 2),
  /** A visitor who has already signed out. */
  visitorOut: pad("zzhvisit", 1),
} as const;

/** The ZZ library's twenty titles (title 1 is the sweep's sample, sent back unchanged). ISBNs are valid ISBN-13s on the 979-8 range, made up. */
export const LIBRARY_FIXTURE_TITLES: { isbn: string | null; title: string; author: string; publisher: string; year: number | null; subject: string; language: "EN" | "HI" | "MR" | "OTHER"; category: "GENERAL" | "FICTION" | "NON_FICTION" | "REFERENCE" | "TEXTBOOK" | "CHILDREN" }[] = [
  { isbn: "9798000000014", title: "ZZ The Tiger in the Well", author: "ZZ Anil Kulkarni", publisher: "ZZ Press", year: 2019, subject: "Stories", language: "EN", category: "CHILDREN" },
  { isbn: "9798000000021", title: "ZZ Numbers Everywhere", author: "ZZ Sunita Rao", publisher: "ZZ Press", year: 2021, subject: "Mathematics", language: "EN", category: "NON_FICTION" },
  { isbn: "9798000000038", title: "ZZ Rivers of Maharashtra", author: "ZZ Vijay Pawar", publisher: "ZZ Press", year: 2018, subject: "Geography", language: "MR", category: "NON_FICTION" },
  { isbn: "9798000000045", title: "ZZ Panchatantra Retold", author: "ZZ Meena Iyer", publisher: "ZZ Press", year: 2015, subject: "Stories", language: "HI", category: "CHILDREN" },
  { isbn: "9798000000052", title: "ZZ A First Dictionary", author: "ZZ Editors", publisher: "ZZ Press", year: 2020, subject: "English", language: "EN", category: "REFERENCE" },
  { isbn: "9798000000069", title: "ZZ Science at Home", author: "ZZ Kiran Joshi", publisher: "ZZ Press", year: 2022, subject: "Science", language: "EN", category: "NON_FICTION" },
  { isbn: "9798000000076", title: "ZZ The Monsoon Kite", author: "ZZ Rohan Desai", publisher: "ZZ Press", year: 2017, subject: "Stories", language: "EN", category: "FICTION" },
  { isbn: "9798000000083", title: "ZZ Shivaji's Forts", author: "ZZ Prakash More", publisher: "ZZ Press", year: 2016, subject: "History", language: "MR", category: "NON_FICTION" },
  { isbn: "9798000000090", title: "ZZ Grammar Made Easy", author: "ZZ Lata Nair", publisher: "ZZ Press", year: 2019, subject: "English", language: "EN", category: "TEXTBOOK" },
  { isbn: "9798000000106", title: "ZZ Stars and Planets", author: "ZZ Arjun Mehta", publisher: "ZZ Press", year: 2023, subject: "Science", language: "EN", category: "NON_FICTION" },
  { isbn: null, title: "ZZ Village Tales", author: "ZZ Kusum Patil", publisher: "ZZ Press", year: 2010, subject: "Stories", language: "MR", category: "FICTION" },
  { isbn: null, title: "ZZ Hindi Poems for Children", author: "ZZ Ramesh Verma", publisher: "ZZ Press", year: 2012, subject: "Hindi", language: "HI", category: "CHILDREN" },
  { isbn: "9798000000113", title: "ZZ Fun with Fractions", author: "ZZ Sunita Rao", publisher: "ZZ Press", year: 2022, subject: "Mathematics", language: "EN", category: "TEXTBOOK" },
  { isbn: "9798000000120", title: "ZZ Birds of the Western Ghats", author: "ZZ Neha Kamat", publisher: "ZZ Press", year: 2020, subject: "Science", language: "EN", category: "NON_FICTION" },
  { isbn: "9798000000137", title: "ZZ The Clever Crow", author: "ZZ Meena Iyer", publisher: "ZZ Press", year: 2014, subject: "Stories", language: "EN", category: "CHILDREN" },
  { isbn: "9798000000144", title: "ZZ Atlas of India", author: "ZZ Editors", publisher: "ZZ Press", year: 2021, subject: "Geography", language: "EN", category: "REFERENCE" },
  { isbn: "9798000000151", title: "ZZ Games We Play", author: "ZZ Sameer Khan", publisher: "ZZ Press", year: 2019, subject: "Sport", language: "EN", category: "GENERAL" },
  { isbn: "9798000000168", title: "ZZ Clean Water, Healthy Village", author: "ZZ Asha Gokhale", publisher: "ZZ Press", year: 2018, subject: "Health", language: "MR", category: "NON_FICTION" },
  { isbn: "9798000000175", title: "ZZ The Lost Notebook", author: "ZZ Rohan Desai", publisher: "ZZ Press", year: 2024, subject: "Stories", language: "EN", category: "FICTION" },
  { isbn: "9798000000182", title: "ZZ Drawing Animals", author: "ZZ Pooja Shah", publisher: "ZZ Press", year: 2020, subject: "Art", language: "EN", category: "GENERAL" },
];

/** The ZZ hostel's rooms: room 1 is the sweep's sample, sent back unchanged. */
export const HOSTEL_FIXTURE_ROOMS = [
  { number: "101", floor: "1", beds: 4, kind: "DORMITORY" as const },
  { number: "102", floor: "1", beds: 2, kind: "SHARED" as const },
  { number: "201", floor: "2", beds: 2, kind: "SHARED" as const },
  { number: "SB1", floor: "G", beds: 1, kind: "SICK_BAY" as const },
];

/** The ZZ hostel's mess menu, Monday to Sunday, sent back unchanged by the sweep. */
export const HOSTEL_FIXTURE_MENU: { weekday: number; meal: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"; items: string }[] = [1, 2, 3, 4, 5, 6, 7].flatMap((weekday) => [
  { weekday, meal: "BREAKFAST" as const, items: weekday % 2 ? "Poha, milk, banana" : "Upma, milk, apple" },
  { weekday, meal: "LUNCH" as const, items: "Chapati, dal, rice, sabzi" },
  { weekday, meal: "DINNER" as const, items: weekday === 7 ? "Puri, chana, kheer" : "Chapati, dal, rice, sabzi" },
]);
