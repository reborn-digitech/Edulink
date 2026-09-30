/*
  Warnings:

  - Added the required column `authorSchoolId` to the `QuestionContribution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuestionContribution" ADD COLUMN     "authorSchoolId" TEXT NOT NULL;
