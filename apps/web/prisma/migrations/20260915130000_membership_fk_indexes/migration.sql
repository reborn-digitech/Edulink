-- Every remaining foreign key without a leading index — thirty-three columns pointing at Membership, School, Class and
-- AttendanceSession. Postgres creates none of these on its own, and each one is a per-row scan of the referencing
-- table whenever the referenced row is deleted: the fleet teardown spent a minute and a half per five schools on
-- "Membership" because "AttendanceRecord"."studentMembershipId" (2.2 million rows) had only a composite index it
-- does not lead. Found by the load test, 15 Sep 2026.

-- CreateIndex
CREATE INDEX "Assignment_authorMembershipId_idx" ON "Assignment"("authorMembershipId");

-- CreateIndex
CREATE INDEX "AttendanceCover_createdByMembershipId_idx" ON "AttendanceCover"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "AttendanceCover_classId_idx" ON "AttendanceCover"("classId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentMembershipId_idx" ON "AttendanceRecord"("studentMembershipId");

-- CreateIndex
CREATE INDEX "AttendanceSession_takenByMembershipId_idx" ON "AttendanceSession"("takenByMembershipId");

-- CreateIndex
CREATE INDEX "Competition_organizerSchoolId_idx" ON "Competition"("organizerSchoolId");

-- CreateIndex
CREATE INDEX "CompetitionEntry_studentMembershipId_idx" ON "CompetitionEntry"("studentMembershipId");

-- CreateIndex
CREATE INDEX "ExamSeries_createdByMembershipId_idx" ON "ExamSeries"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "ExpertBooking_bookedByMembershipId_idx" ON "ExpertBooking"("bookedByMembershipId");

-- CreateIndex
CREATE INDEX "ExpertInvite_invitedByMembershipId_idx" ON "ExpertInvite"("invitedByMembershipId");

-- CreateIndex
CREATE INDEX "GlobalPostHide_hiddenByMembershipId_idx" ON "GlobalPostHide"("hiddenByMembershipId");

-- CreateIndex
CREATE INDEX "Grade_studentMembershipId_idx" ON "Grade"("studentMembershipId");

-- CreateIndex
CREATE INDEX "Grade_gradedByMembershipId_idx" ON "Grade"("gradedByMembershipId");

-- CreateIndex
CREATE INDEX "Invite_createdByMembershipId_idx" ON "Invite"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "JobPosting_hiringContactMembershipId_idx" ON "JobPosting"("hiringContactMembershipId");

-- CreateIndex
CREATE INDEX "JobPosting_postedByMembershipId_idx" ON "JobPosting"("postedByMembershipId");

-- CreateIndex
CREATE INDEX "LeaveRequest_nominatedCoverMembershipId_idx" ON "LeaveRequest"("nominatedCoverMembershipId");

-- CreateIndex
CREATE INDEX "LeaveRequest_decidedByMembershipId_idx" ON "LeaveRequest"("decidedByMembershipId");

-- CreateIndex
CREATE INDEX "MeetingSlot_teacherMembershipId_idx" ON "MeetingSlot"("teacherMembershipId");

-- CreateIndex
CREATE INDEX "MentorThread_createdByMembershipId_idx" ON "MentorThread"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "Post_reviewedByMembershipId_idx" ON "Post"("reviewedByMembershipId");

-- CreateIndex
CREATE INDEX "Post_authorMembershipId_idx" ON "Post"("authorMembershipId");

-- CreateIndex
CREATE INDEX "PracticeAssignment_createdById_idx" ON "PracticeAssignment"("createdById");

-- CreateIndex
CREATE INDEX "PracticeAssignment_classId_idx" ON "PracticeAssignment"("classId");

-- CreateIndex
CREATE INDEX "QuizAttempt_studentMembershipId_idx" ON "QuizAttempt"("studentMembershipId");

-- CreateIndex
CREATE INDEX "RemarkThread_teacherMembershipId_idx" ON "RemarkThread"("teacherMembershipId");

-- CreateIndex
CREATE INDEX "ReportCard_createdByMembershipId_idx" ON "ReportCard"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "ReviewResponse_teacherMembershipId_idx" ON "ReviewResponse"("teacherMembershipId");

-- CreateIndex
CREATE INDEX "ReviewRound_createdByMembershipId_idx" ON "ReviewRound"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "ReviewRoundTeacher_schoolId_idx" ON "ReviewRoundTeacher"("schoolId");

-- CreateIndex
CREATE INDEX "School_admissionsContactMembershipId_idx" ON "School"("admissionsContactMembershipId");

-- CreateIndex
CREATE INDEX "Submission_studentMembershipId_idx" ON "Submission"("studentMembershipId");

-- CreateIndex
CREATE INDEX "TimetableSlot_teacherMembershipId_idx" ON "TimetableSlot"("teacherMembershipId");

