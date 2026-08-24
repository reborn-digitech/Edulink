import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const riv = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" }, select: { id: true } });
  const hols = await db.holiday.findMany({ where: { schoolId: riv.id }, select: { name: true, startDateKey: true, endDateKey: true } }).catch(async () => {
    // maybe model named differently
    return [];
  });
  console.log(JSON.stringify(hols));
}
main().finally(() => db.$disconnect());
