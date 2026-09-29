# Data-flow audit — latest run

Run: 2026-09-29T10:07:35.773Z · schools: Saraswati Vidya Mandir, Sunrise Public School, ZZ Northgate School · 0 FAIL · 4 WARN · 21 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## WARN (4)

| check | school | detail |
|---|---|---|
| report-card | ZZ Northgate School | 6 card(s) carry no subjects/scale snapshot and render with today's config |
| report-card-attendance | Sunrise Public School | 8 card(s) predate a register edit inside their window — the snapshot is stale until regenerated |
| fees-api | Saraswati Vidya Mandir | 1 plan(s) belong to pupils off the roll — they count as onPlan and their dues drop out of the dues page |
| fees-api | Sunrise Public School | 1 plan(s) belong to pupils off the roll — they count as onPlan and their dues drop out of the dues page |

## INFO (21)

| check | school | detail |
|---|---|---|
| admission | Saraswati Vidya Mandir | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | Sunrise Public School | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | ZZ Northgate School | 6 of 7 applications carry no PEN — the field is optional on the form |
| certificate | Saraswati Vidya Mandir | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | CC/2026–27/0001 printed "—" for: record.conduct |
| quiz | Sunrise Public School | 1 attempt(s) were opened and never answered |
| quiz | ZZ Northgate School | 1 attempt(s) were opened and never answered |
| filings-api | Saraswati Vidya Mandir | staff ready 10/10 |
| filings-api | Sunrise Public School | staff ready 10/10 |
| filings-api | ZZ Northgate School | staff ready 8/11; missing gender=3, socialCategory=3, academicQualification=3, professionalQualification=3, appointmentType=3, joinedOn=3, serviceJoinedOn=3 |
| cards-api | Saraswati Vidya Mandir | the sampled child has no report card to read |
| cards-api | Sunrise Public School | the sampled child has no report card to read |
| cards-api | ZZ Northgate School | the sampled child has no report card to read |
| board-api | Saraswati Vidya Mandir | 2026-09-29: 0 away, 0 lessons, 0 covered |
| board-api | Sunrise Public School | 2026-09-29: 0 away, 0 lessons, 0 covered |
| board-api | ZZ Northgate School | 2026-09-29: 0 away, 0 lessons, 0 covered |
| overview-api | Saraswati Vidya Mandir | principal: attendance 92%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 91%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 8 (holidays and empty classes are not excluded) |
| population | all | school tables with no rows: ExpertInvite, GatewayEvent, GlobalPostHide, ScheduledDeparture |
| population | all | nullable columns never populated: AdmissionCycle.opensAt, AdmissionCycle.closesAt, Assignment.rubric, AttendanceRecord.note, AttendanceSession.note, EarnedBadge.academicYearId, Enquiry.closedAt, EntranceSlot.note, ExamSeries.archivedAt, FeeConcession.revokedAt, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.confirmedByUserId, FeePayment.failedReason, FeePayment.reversedAt, FeePayment.reversedByUserId, FeePayment.reversalReason, FeeRefund.gatewayRefundId, FeeStructure.archivedAt, Grade.letter, Grade.comment, GuardianClaim.decidedAt, GuardianClaim.decidedByUserId, GuardianClaim.declineReason, Invite.classId, Invite.acceptedByUserId, Invite.acceptedAt, Invite.relation, Invite.studentMembershipId, IssuedCertificate.remark, JobPosting.closedAt, JoinRequest.decidedAt, JoinRequest.decidedByMembershipId, JoinRequest.declineReason, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, OperatorAccess.endedAt, OutboundMessage.error, OutboundMessage.deliveredAt, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, Post.rejectionReason, Post.pinnedAt, Post.audienceGrade, PracticeAssignment.archivedAt, PupilRecord.guardianPhone, RemarkThread.closedAt, Report.resolvedAt, Report.resolutionNote, ReportCardItem.comment, StaffRecord.qualification, StaffRecord.appointedSubject, TimetablePeriod.archivedAt |
