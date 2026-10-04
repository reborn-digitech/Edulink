import { principalCollegeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { principalCollege } from "@/lib/college-principal";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/principal/college — the college at a glance and the approvals
 * waiting, for the head's and the registrar's phone (campaign 2026-10-04,
 * G-4). Read from principalCollege(), the function behind the web's
 * /principal/college, and cut to what a phone shows; a school is a 404.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const c = await principalCollege(ctx);
    const g = c.glance;
    const cycle = g.predictor?.cycle ?? null;
    return ok(
      principalCollegeSchema.parse({
        school: { name: c.school.name, affiliatingUniversity: c.school.affiliatingUniversity ?? null },
        today: c.today,
        term: c.term,
        faculty: g.faculty,
        fees: g.fees ? { year: g.fees.year, demandPaise: g.fees.demandPaise, collectedPaise: g.fees.collectedPaise, outstandingPaise: g.fees.outstandingPaise, defaulters: g.fees.defaulters } : null,
        scholarships: g.scholarships ? { applied: g.scholarships.applied, sanctioned: g.scholarships.sanctioned, disbursed: g.scholarships.disbursed, disbursedPaise: g.scholarships.disbursedPaise } : null,
        hostel: g.hostel ? { occupancyPercent: g.hostel.occupancyPercent, occupied: g.hostel.occupied, beds: g.hostel.beds } : null,
        grievances: g.grievances,
        incidentsOpen: g.incidentsOpen,
        predictor: cycle ? { cgpa: cycle.cgpa ?? null, grade: cycle.grade ?? null, nextGrade: g.predictor?.nextBand?.grade ?? null, distance: g.predictor?.nextBand?.distance ?? null } : null,
        lectures: g.lectures.map((d) => ({ departmentId: d.departmentId, name: d.name, lectures: d.lectures, marked: d.marked, presentPercent: d.presentPercent })),
        approvals: c.approvals,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/principal/college");
  }
}
