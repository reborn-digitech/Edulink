import type { SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";
import type { Role } from "./constants";

/**
 * How each module is named and described, as KEYS (client-safe: no data
 * layer here, so the admin's switch and the nav can read it). `role` is the
 * role the module brings, named on the switch ("Adds the Librarian role");
 * inventory and payroll bring none.
 */
export const MODULE_META: Record<SchoolModuleCode, { nameKey: TranslationKey; whatKey: TranslationKey; role: Role | null }> = {
  TRANSPORT: { nameKey: "modules.transportName", whatKey: "modules.transportWhat", role: "DRIVER" },
  LIBRARY: { nameKey: "modules.libraryName", whatKey: "modules.libraryWhat", role: "LIBRARIAN" },
  HOSTEL: { nameKey: "modules.hostelName", whatKey: "modules.hostelWhat", role: "WARDEN" },
  INVENTORY: { nameKey: "modules.inventoryName", whatKey: "modules.inventoryWhat", role: null },
  PAYROLL: { nameKey: "modules.payrollName", whatKey: "modules.payrollWhat", role: null },
  ALUMNI: { nameKey: "modules.alumniName", whatKey: "modules.alumniWhat", role: "ALUMNUS" },
};
