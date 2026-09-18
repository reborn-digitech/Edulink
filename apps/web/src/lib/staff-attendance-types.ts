import type { z } from "zod";
import type { myStaffAttendanceSchema, staffAttendanceStatusSchema, staffMonthSchema, staffRegisterSchema } from "@edulink/contracts";

/** The contract types the library returns; kept apart so a client file can import them without the server-only library. */
export type StaffAttendanceStatus = z.infer<typeof staffAttendanceStatusSchema>;
export type StaffRegisterView = z.infer<typeof staffRegisterSchema>;
export type StaffMonthView = z.infer<typeof staffMonthSchema>;
export type MyStaffAttendanceView = z.infer<typeof myStaffAttendanceSchema>;
