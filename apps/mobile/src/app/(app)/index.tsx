import { Fragment } from "react";
import { useParamsKey } from "@/components/back-to";
import { useRole, useSession } from "@/lib/session";
import { ConsoleHome } from "@/screens/shared/console-home";
import { TeacherHome } from "@/screens/teacher/home";
import { ParentHome } from "@/screens/family/parent-home";
import { StudentHome } from "@/screens/family/student-home";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { AdminHome } from "@/screens/staff/admin-home";
import { ExpertHome } from "@/screens/expert/home";
import { LibraryDesk } from "@/screens/library/desk";
import { WardenHome } from "@/screens/hostel/warden";
import { DriverHome } from "@/screens/driver/home";
import { AlumniHome } from "@/screens/alumni/home";
import { FacultyHomeScreen } from "@/screens/academics/faculty";
import { HodHomeScreen } from "@/screens/academics/hod";
import { IqacHome } from "@/screens/iqac/home";
import { AccountsHomeScreen } from "@/screens/college-office/accounts-home";
import { TpoHome } from "@/screens/placement/tpo";
import { RecruiterPlacementHome } from "@/screens/placement/recruiter";
import { ExamCellHome } from "@/screens/exams/controller-home";
import { MyPayslips } from "@/screens/shared/payslips";

/**
 * The home tab, drawn under its params (TA-013): the guardian's overview asked
 * for another child (`?child=`), or a recruiter's drive, draws that one rather
 * than keeping the first.
 */
export default function Home() {
  const asked = useParamsKey();
  return (
    <Fragment key={asked}>
      <HomeFor />
    </Fragment>
  );
}

/** Each role's "today", "overview", "dashboard" or "bookings" — the same page the web opens first. */
function HomeFor() {
  const role = useRole();
  const session = useSession();
  // No school role: the operator's or the content team's console (the layout gives them a stack).
  if (role === null && session.status === "signed-in") return <ConsoleHome me={session.me} />;
  if (role === "TEACHER") return <TeacherHome />;
  if (role === "PARENT") return <ParentHome />;
  if (role === "STUDENT") return <StudentHome />;
  if (role === "PRINCIPAL") return <PrincipalHome />;
  if (role === "ADMIN") return <AdminHome />;
  if (role === "EXPERT") return <ExpertHome />;
  // The module roles (3 Oct 2026), one line each so each module's builder replaces only its own.
  if (role === "DRIVER") return <DriverHome />;
  if (role === "LIBRARIAN") return <LibraryDesk />;
  if (role === "WARDEN") return <WardenHome />;
  if (role === "ALUMNUS") return <AlumniHome />;
  // The college's seven (4 Oct 2026), one line each so each module's builder replaces only its own.
  if (role === "FACULTY") return <FacultyHomeScreen />;
  if (role === "HOD") return <HodHomeScreen />;
  if (role === "EXAM_CONTROLLER") return <ExamCellHome />;
  // The IQAC desk at a glance (the IQAC module, 4 Oct 2026).
  if (role === "IQAC") return <IqacHome />;
  if (role === "TPO") return <TpoHome />;
  // The accounts desk at a glance (the college office, 4 Oct 2026).
  if (role === "ACCOUNTS") return <AccountsHomeScreen />;
  if (role === "RECRUITER") return <RecruiterPlacementHome />;
  // owner-batch-item2a (27 Oct 2026): support staff, given a login, open on their own payslips.
  if (role === "SUPPORT") return <MyPayslips />;
  return null;
}
