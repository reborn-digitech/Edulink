-- Every foreign key to "User" gets its own index. Without one, deleting a person makes Postgres
-- scan the referencing table once per deleted row to prove nothing still points at them;
-- on "User"."mergedIntoUserId" (a self-reference) that was a full scan of "User" per user, and a
-- fleet of 757,000 test accounts took an hour to not delete. Found by the load test, 15 Sep 2026.

-- CreateIndex
CREATE INDEX "AuthToken_userId_idx" ON "AuthToken"("userId");

-- CreateIndex
CREATE INDEX "Comment_authorUserId_idx" ON "Comment"("authorUserId");

-- CreateIndex
CREATE INDEX "ConversationMessage_authorUserId_idx" ON "ConversationMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "EnquiryMessage_authorUserId_idx" ON "EnquiryMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "ExpertMessage_authorUserId_idx" ON "ExpertMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "MeetingBooking_parentUserId_idx" ON "MeetingBooking"("parentUserId");

-- CreateIndex
CREATE INDEX "MentorMessage_authorUserId_idx" ON "MentorMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "Post_authorUserId_idx" ON "Post"("authorUserId");

-- CreateIndex
CREATE INDEX "PostAck_userId_idx" ON "PostAck"("userId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE INDEX "RemarkMessage_authorUserId_idx" ON "RemarkMessage"("authorUserId");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_idx" ON "Report"("reporterUserId");

-- CreateIndex
CREATE INDEX "ReviewResponse_respondentUserId_idx" ON "ReviewResponse"("respondentUserId");

-- CreateIndex
CREATE INDEX "User_mergedIntoUserId_idx" ON "User"("mergedIntoUserId");
