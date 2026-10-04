/**
 * The fixed ids of the ZZ exam cell (scripts/zz-exams.ts writes the rows with
 * them), so the API catalog's samples and the suite can name a session, a
 * form or a paper without a field of their own in the sweep's fixture. Each
 * is in the shape the contracts' cuid check accepts. Only ZZ data.
 *
 *   pastSession     ZZ Vidya College, last term's sitting, PUBLISHED (run 1)
 *   formsSession    ZZ Vidya College, this term's sitting, taking forms
 *   conductSession  ZZ Shastri Autonomous College, in CONDUCT, with a sealed paper
 *   form(1..3)      the past session's forms of zz.cstudent01..03
 *   form(4..6)      this session's forms of zz.cstudent01..03 (02 approved, with hall ticket 4)
 *   schedule(1|2)   the past session's two papers; schedule(3) this session's PHY101; schedule(4) Shastri's paper
 *   room(1)         the hall of schedule(1); room(3) of schedule(3)
 *   document(1)     zz.cstudent02's grade card
 *   revaluation(1)  zz.cstudent03's revaluation, decided unchanged
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const EXAMS_FIXTURE = {
  pastSession: pad("zzexsess", 1),
  formsSession: pad("zzexsess", 2),
  conductSession: pad("zzexsess", 3),
  pastTerm: pad("zzexterm", 1),
  shastriTerm: pad("zzexterm", 2),
  form: (n: number) => pad("zzexform", n),
  ticket: (n: number) => pad("zzexticket", n),
  schedule: (n: number) => pad("zzexsched", n),
  room: (n: number) => pad("zzexroom", n),
  invigilation: (n: number) => pad("zzexinvig", n),
  run: pad("zzexrun", 1),
  revaluation: pad("zzexreval", 1),
  document: pad("zzexdoc", 1),
  paper: pad("zzexpaper", 1),
  allocation: pad("zzexalloc", 1),
  feeHead: pad("zzexhead", 1),
  /** Shastri's own minimal academics (it has none of the academics fixture's): a department, programme, scheme and one course. */
  shastri: { department: pad("zzexsdept", 1), programme: pad("zzexsprog", 1), scheme: pad("zzexsscheme", 1), course: pad("zzexscourse", 1) },
} as const;
