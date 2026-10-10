-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "imageSpec" TEXT;

-- AlterTable
ALTER TABLE "QuizQuestionTranslation" ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageKey" TEXT;
