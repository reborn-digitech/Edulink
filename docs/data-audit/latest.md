# Data-flow audit — latest run

Run: 2026-10-01T02:27:12.239Z · schools: Saraswati Vidya Mandir, Sunrise Public School, ZZ Northgate School · 0 FAIL · 3 WARN · 24 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## WARN (3)

| check | school | detail |
|---|---|---|
| report-card | ZZ Northgate School | 6 card(s) carry no subjects/scale snapshot and render with today's config |
| fees-api | Saraswati Vidya Mandir | 1 plan(s) belong to pupils off the roll — they count as onPlan and their dues drop out of the dues page |
| fees-api | Sunrise Public School | 1 plan(s) belong to pupils off the roll — they count as onPlan and their dues drop out of the dues page |

## INFO (24)

| check | school | detail |
|---|---|---|
| gig-earnings | platform | 0 contributed question(s) in the bank, 0 payment(s) recorded |
| gig-seats | platform | 6 slot(s) offered |
| admission | Saraswati Vidya Mandir | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | Sunrise Public School | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | ZZ Northgate School | 6 of 7 applications carry no PEN — the field is optional on the form |
| certificate | Saraswati Vidya Mandir | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | CC/2026–27/0001 printed "—" for: record.conduct |
| quiz | Sunrise Public School | 1 attempt(s) were opened and never answered |
| quiz | ZZ Northgate School | 1 attempt(s) were opened and never answered |
| question-stat | server | 1759 bucket(s) over 1759 (question, grade) pair(s) match the answer rows exactly |
| filings-api | Saraswati Vidya Mandir | staff ready 10/10 |
| filings-api | Sunrise Public School | staff ready 10/10 |
| filings-api | ZZ Northgate School | staff ready 8/11; missing gender=3, socialCategory=3, academicQualification=3, professionalQualification=3, appointmentType=3, joinedOn=3, serviceJoinedOn=3 |
| cards-api | Saraswati Vidya Mandir | the sampled child has no report card to read |
| cards-api | Sunrise Public School | the sampled child has no report card to read |
| cards-api | ZZ Northgate School | the sampled child has no report card to read |
| board-api | Saraswati Vidya Mandir | 2026-10-01: 0 away, 0 lessons, 0 covered |
| board-api | Sunrise Public School | 2026-10-01: 0 away, 0 lessons, 0 covered |
| board-api | ZZ Northgate School | 2026-10-01: 1 away, 6 lessons, 1 covered |
| overview-api | Saraswati Vidya Mandir | principal: attendance 91%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 91%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 8 (holidays and empty classes are not excluded) |
| population | all | school tables with no rows: AbsenceNote, ExpertInvite, GatewayEvent, GlobalPostHide, LessonPlanTemplate, ScheduledDeparture, StaffAppraisal |
| population | all | nullable columns never populated: AdmissionCycle.opensAt, AdmissionCycle.closesAt, Assignment.rubric, AttendanceRecord.note, AttendanceSession.note, EarnedBadge.academicYearId, Enquiry.closedAt, EntranceSlot.note, ExamSeries.archivedAt, FeeConcession.revokedAt, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.confirmedByUserId, FeePayment.failedReason, FeePayment.reversedAt, FeePayment.reversedByUserId, FeePayment.reversalReason, FeeRefund.gatewayRefundId, FeeRefund.cutsJson, FeeRefund.failedReason, FeeStructure.archivedAt, GigBooking.cancelledAt, GigBooking.cancelledByUserId, GigBooking.cancelReason, GigBooking.rating, GigBooking.feedback, GigBooking.ratedAt, GigBooking.remindedAt, Grade.letter, Grade.comment, GuardianClaim.decidedAt, GuardianClaim.decidedByUserId, GuardianClaim.declineReason, Invite.classId, Invite.acceptedByUserId, Invite.acceptedAt, Invite.relation, Invite.studentMembershipId, IssuedCertificate.remark, IssuedCertificate.studentName, JobPosting.closedAt, JoinRequest.decidedAt, JoinRequest.decidedByMembershipId, JoinRequest.declineReason, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, OperatorAccess.endedAt, OutboundMessage.error, OutboundMessage.deliveredAt, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, Post.rejectionReason, Post.pinnedAt, Post.audienceGrade, PracticeAssignment.archivedAt, PupilRecord.guardianPhone, PupilRecord.alternatePhone, PupilRecord.freeUniform, PupilRecord.freeTextbook, PupilRecord.extracurricular, PupilRecord.stream, PupilRecord.vocationalCourse, PupilRecord.vocationalTradeId, PupilRecord.vocationalJobRoleId, PupilRecord.vocationalExamAppeared, QuizResponse.gradeLevel, QuizResponse.seconds, RemarkThread.closedAt, Report.resolvedAt, Report.resolutionNote, ReportCardItem.comment, StaffRecord.qualification, StaffRecord.appointedSubject, Substitution.acknowledgedAt, Substitution.declineReason, Substitution.declinedAt, TimetablePeriod.archivedAt |
