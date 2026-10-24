-- QA-30 (QA campaign of 24 October 2026): one drive per recruiter requirement at a college.
-- Two presses of Accept at once made two DRAFT drives of one requirement; placement.ts answers the
-- losing press with the drive the winner made. Drives with no requirement are not held (NULLs are distinct).
-- CreateIndex
CREATE UNIQUE INDEX "Drive_schoolId_requirementId_key" ON "Drive"("schoolId", "requirementId");
