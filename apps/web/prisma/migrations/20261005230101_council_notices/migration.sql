-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorCommitteeId" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorCommitteeId_fkey" FOREIGN KEY ("authorCommitteeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
