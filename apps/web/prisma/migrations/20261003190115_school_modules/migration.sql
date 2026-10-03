-- The optional parts of the school version, switched on per school (the owner's decision of
-- 3 October 2026): one row per module a school has on; absence is off.
-- CreateTable
CREATE TABLE "SchoolModule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabledByUserId" TEXT,
    "settingsJson" TEXT,

    CONSTRAINT "SchoolModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolModule_schoolId_module_key" ON "SchoolModule"("schoolId", "module");

-- AddForeignKey
ALTER TABLE "SchoolModule" ADD CONSTRAINT "SchoolModule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every school that exists today starts with ALUMNI on, as a new school does
-- (createSchool writes the same row): a pupil who leaves keeps a link to the
-- school unless the admin switches it off. The other five stay off.
INSERT INTO "SchoolModule" ("id", "schoolId", "module", "enabledAt")
SELECT 'smod_' || md5(random()::text || s."id"), s."id", 'ALUMNI', CURRENT_TIMESTAMP
FROM "School" s
ON CONFLICT ("schoolId", "module") DO NOTHING;
