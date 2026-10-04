import type { SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";
import type { Role } from "./constants";

/**
 * How each module is named and described, as KEYS (client-safe: no data
 * layer here, so the admin's switch and the nav can read it). `role` is the
 * role the module brings, named on the switch ("Adds the Librarian role");
 * inventory and payroll bring none, and of the college's, admissions and
 * scholarships (the office's work, and ACCOUNTS hangs on no module).
 */
export const MODULE_META: Record<SchoolModuleCode, { nameKey: TranslationKey; whatKey: TranslationKey; role: Role | null }> = {
  TRANSPORT: { nameKey: "modules.transportName", whatKey: "modules.transportWhat", role: "DRIVER" },
  LIBRARY: { nameKey: "modules.libraryName", whatKey: "modules.libraryWhat", role: "LIBRARIAN" },
  HOSTEL: { nameKey: "modules.hostelName", whatKey: "modules.hostelWhat", role: "WARDEN" },
  INVENTORY: { nameKey: "modules.inventoryName", whatKey: "modules.inventoryWhat", role: null },
  PAYROLL: { nameKey: "modules.payrollName", whatKey: "modules.payrollWhat", role: null },
  ALUMNI: { nameKey: "modules.alumniName", whatKey: "modules.alumniWhat", role: "ALUMNUS" },
  // The college's six (4 Oct 2026), offered on a college's modules page only (modulesForKind).
  ACADEMICS: { nameKey: "modules.academicsName", whatKey: "modules.academicsWhat", role: "FACULTY" },
  EXAMS: { nameKey: "modules.examsName", whatKey: "modules.examsWhat", role: "EXAM_CONTROLLER" },
  IQAC: { nameKey: "modules.iqacName", whatKey: "modules.iqacWhat", role: "IQAC" },
  PLACEMENT: { nameKey: "modules.placementName", whatKey: "modules.placementWhat", role: "TPO" },
  ADMISSIONS: { nameKey: "modules.admissionsName", whatKey: "modules.admissionsWhat", role: null },
  SCHOLARSHIPS: { nameKey: "modules.scholarshipsName", whatKey: "modules.scholarshipsWhat", role: null },
};
