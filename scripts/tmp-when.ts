import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const riv = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" }, select: { id: true } });
  const hols = await db.holiday.findMany({ where: { schoolId: riv.id }, select: { name: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  console.log(JSON.stringify(hols.map(h => `${h.name} @ ${h.createdAt.toISOString()}`), null, 1));
  const principal = await db.membership.findFirst({ where: { schoolId: riv.id, role: "PRINCIPAL" }, select: { joinedAt: true, user: { select: { name: true } } } });
  console.log("principal:", JSON.stringify(principal));
}
main().finally(() => db.$disconnect());
