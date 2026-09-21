/** ZZ fixtures the admissions screen tests share: a cycle, a sitting, an application at any stage. Only ZZ data, ids in the contracts' cuid shape. */
export const CYCLE = "czz000000000000000cycle1";
export const CLOSED_CYCLE = "czz000000000000000cycle2";
export const SCHOOL = "czz000000000000000school1";
export const A1 = "czz00000000000000000app1";
export const A2 = "czz00000000000000000app2";
export const A3 = "czz00000000000000000app3";
export const SLOT1 = "czz0000000000000000slot01";
export const SLOT2 = "czz0000000000000000slot02";
export const ISO = "2026-09-18T05:00:00.000Z";

export const DOCUMENTS = [
  { key: "birth", name: "ZZ Birth certificate", required: true },
  { key: "photo", name: "ZZ Photograph", required: false },
];

export const cycle = (extra: Record<string, unknown> = {}) => ({
  id: CYCLE,
  academicYearId: "czz0000000000000000year1",
  name: "ZZ Admissions 2026-27",
  grades: [
    { grade: "1", seats: 5 },
    { grade: "2", seats: 3 },
  ],
  documents: DOCUMENTS,
  testRequired: true,
  notice: "ZZ Bring the originals.",
  feeStructureId: null,
  opensAt: null,
  closesAt: "2026-12-31",
  status: "OPEN",
  academicYearName: "2026-27",
  feeStructureName: null,
  seats: [
    { grade: "1", seats: 5, applied: 3, offered: 1, accepted: 1, admitted: 0, waitlisted: 1 },
    { grade: "2", seats: 3, applied: 0, offered: 0, accepted: 0, admitted: 0, waitlisted: 0 },
  ],
  counts: { SUBMITTED: 3, OFFERED: 1, ACCEPTED: 1, ADMITTED: 0, DECLINED: 0, WAITLISTED: 1, WITHDRAWN: 0 },
  updatedAt: ISO,
  ...extra,
});

export const CYCLES_VIEW = { cycles: [cycle(), cycle({ id: CLOSED_CYCLE, name: "ZZ Admissions 2025-26", status: "CLOSED", academicYearName: "2025-26" })], years: [{ id: "czz0000000000000000year1", name: "2026-27", isCurrent: true }], structures: [] };

export const slot = (id = SLOT1, extra: Record<string, unknown> = {}) => ({ id, startsAt: "2031-01-15T04:30:00.000Z", endsAt: "2031-01-15T05:00:00.000Z", location: "ZZ Hall", note: null, capacity: 5, booked: 2, cancelledAt: null, ...extra });

const CAN = { uploadDocuments: false, bookTest: false, respond: false, withdraw: false, verifyDocuments: false, recordTest: false, offer: false, decide: false, admit: false };

export const application = (extra: Record<string, unknown> = {}, can: Partial<typeof CAN> = {}) => ({
  id: A1,
  serial: "ADM/2026-27/0001",
  status: "SUBMITTED",
  cycle: { id: CYCLE, name: "ZZ Admissions 2026-27", academicYearName: "2026-27", testRequired: true, documents: DOCUMENTS, status: "OPEN" },
  school: { id: SCHOOL, name: "ZZ Hillside" },
  applicantUserId: "u-parent",
  applicantName: "ZZ Parent",
  applicantPhone: "+91 98765 00000",
  applicantEmail: null,
  relation: "PARENT",
  childName: "ZZ Kabir",
  childBirthdate: "2020-04-01",
  gradeApplied: "1",
  previousSchool: null,
  addressLine: "1 ZZ Road",
  city: "Pune",
  note: null,
  documents: [{ key: "photo", fileId: "f1", name: "kabir.jpg", mime: "image/jpeg", size: 204800, uploadedAt: ISO }],
  documentsMissing: ["birth"],
  documentsVerifiedAt: null,
  testSlot: null,
  testScore: null,
  testNote: null,
  testedAt: null,
  offeredAt: null,
  offerExpiresAt: null,
  offerNote: null,
  respondedAt: null,
  decisionNote: null,
  decidedAt: null,
  admittedMembershipId: null,
  admittedAt: null,
  feeStructureName: null,
  createdAt: ISO,
  can: { ...CAN, ...can },
  openSlots: [],
  ...extra,
});

export const row = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  serial: "ADM/2026-27/0001",
  status: "SUBMITTED",
  childName: "ZZ Kabir",
  gradeApplied: "1",
  applicantName: "ZZ Parent",
  cycleName: "ZZ Admissions 2026-27",
  schoolName: "ZZ Hillside",
  documentsMissing: 0,
  testBooked: false,
  createdAt: ISO,
  updatedAt: ISO,
  ...extra,
});
