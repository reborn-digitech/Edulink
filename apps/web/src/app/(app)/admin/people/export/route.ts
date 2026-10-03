import type { Prisma } from "@prisma/client";
import { exportResponse } from "@/lib/export-file";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { readJsonArray } from "@/lib/json";
import { audit } from "@/lib/audit";
import { SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";

/**
 * Directory export.
 *
 * Admin-only, scoped to their own school, and audited — this endpoint emits
 * every student's name and code in one file, so "who downloaded the whole
 * directory, and when" is a question the school will eventually need answered.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const url = new URL(request.url);

    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
    const roleParam = url.searchParams.get("role");
    const roleFilter = SCHOOL_ROLES.includes(roleParam as SchoolRole)
      ? (roleParam as SchoolRole)
      : null;
    const classIdParam = url.searchParams.get("classId");

    // Re-scope the class filter; the id came from a query string.
    const klass = classIdParam
      ? await db.class.findFirst({
          where: { id: classIdParam, schoolId: ctx.schoolId },
          select: { id: true },
        })
      : null;

    // The same three views the page offers: here, paused, left. Anything
    // else in the parameter means the default.
    const statusParam = url.searchParams.get("status");
    const view = statusParam === "SUSPENDED" || statusParam === "LEFT" ? statusParam : "ACTIVE";
    const where: Prisma.MembershipWhereInput = {
      schoolId: ctx.schoolId,
      ...(view === "LEFT"
        ? { leftAt: { not: null } }
        : view === "SUSPENDED"
          ? { status: "SUSPENDED", leftAt: null }
          : { status: "ACTIVE", leftAt: null }),
      // Everyone but the alumni, who have a chip of their own: a school's leavers would otherwise outnumber its roll (3 Oct 2026).
      ...(roleFilter ? { role: roleFilter } : { role: { not: "ALUMNUS" } }),
      ...(klass
        ? {
            OR: [
              { enrollments: { some: { classId: klass.id, status: "ACTIVE" } } },
              { classTeachers: { some: { classId: klass.id } } },
            ],
          }
        : {}),
      ...(query
        ? {
            user: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { preferredName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    const members = await db.membership.findMany({
      where,
      include: {
        user: { select: { name: true, preferredName: true, email: true } },
        enrollments: { where: { status: "ACTIVE" }, include: { class: { select: { name: true } } } },
        classTeachers: { include: { class: { select: { name: true } } } },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
      // Hard cap so one click cannot try to stream a million rows.
      take: 5000,
    });

    const rows = members.map((member) => ({
      name: member.user.name,
      preferred_name: member.user.preferredName ?? "",
      email: member.user.email ?? "",
      role: member.role,
      title: member.title ?? "",
      grade: member.gradeLevel ?? "",
      subjects: readJsonArray<string>(member.subjects).join("; "),
      classes: [
        ...member.enrollments.map((e) => e.class.name),
        ...member.classTeachers.map((t) => t.class.name),
      ].join("; "),
      student_code: member.studentCode ?? "",
      joined: member.joinedAt.toISOString().slice(0, 10),
    }));

    const csv = toCsv(rows, [
      "name", "preferred_name", "email", "role", "title",
      "grade", "subjects", "classes", "student_code", "joined",
    ]);

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "directory.export",
      meta: { rows: rows.length, role: roleFilter, query: query || null },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return exportResponse(request, { filename: `edulink-directory-${stamp}.csv`, csv });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[directory export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
