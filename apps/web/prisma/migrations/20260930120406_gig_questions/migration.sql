-- CreateTable
CREATE TABLE "GigSettings" (
    "id" TEXT NOT NULL DEFAULT 'gigs',
    "questionRatePaise" INTEGER NOT NULL DEFAULT 1000,
    "questionFreeCount" INTEGER NOT NULL DEFAULT 20,
    "questionMonthlyCap" INTEGER NOT NULL DEFAULT 200,
    "questionMonthlyBudgetPaise" INTEGER NOT NULL DEFAULT 500000,
    "questionDailyLimit" INTEGER NOT NULL DEFAULT 20,
    "questionPendingLimit" INTEGER NOT NULL DEFAULT 50,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionContribution" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorSchoolName" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "choices" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "solution" TEXT NOT NULL,
    "stemHi" TEXT NOT NULL,
    "choicesHi" TEXT NOT NULL,
    "solutionHi" TEXT NOT NULL,
    "stemMr" TEXT NOT NULL,
    "choicesMr" TEXT NOT NULL,
    "solutionMr" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "questionId" TEXT,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigEarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "basis" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "upiId" TEXT NOT NULL,
    "utr" TEXT NOT NULL,
    "note" TEXT,
    "paidByUserId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigPayee" (
    "userId" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigPayee_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionContribution_questionId_key" ON "QuestionContribution"("questionId");

-- CreateIndex
CREATE INDEX "QuestionContribution_authorUserId_status_idx" ON "QuestionContribution"("authorUserId", "status");

-- CreateIndex
CREATE INDEX "QuestionContribution_status_submittedAt_idx" ON "QuestionContribution"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GigEarning_contributionId_key" ON "GigEarning"("contributionId");

-- CreateIndex
CREATE INDEX "GigEarning_userId_month_idx" ON "GigEarning"("userId", "month");

-- CreateIndex
CREATE INDEX "GigEarning_month_idx" ON "GigEarning"("month");

-- CreateIndex
CREATE INDEX "GigEarning_paymentId_idx" ON "GigEarning"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "GigPayment_utr_key" ON "GigPayment"("utr");

-- CreateIndex
CREATE INDEX "GigPayment_userId_paidAt_idx" ON "GigPayment"("userId", "paidAt");

-- AddForeignKey
ALTER TABLE "QuestionContribution" ADD CONSTRAINT "QuestionContribution_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionContribution" ADD CONSTRAINT "QuestionContribution_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "QuizTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigEarning" ADD CONSTRAINT "GigEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigEarning" ADD CONSTRAINT "GigEarning_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "QuestionContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigEarning" ADD CONSTRAINT "GigEarning_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "GigPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigPayment" ADD CONSTRAINT "GigPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigPayee" ADD CONSTRAINT "GigPayee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
