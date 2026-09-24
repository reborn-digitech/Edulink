# Data-flow audit — latest run

Run: 2026-09-24T01:21:02.680Z · schools: Saraswati Vidya Mandir, Sunrise Public School, ZZ Northgate School · 0 FAIL · 6 WARN · 20 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## WARN (6)

| check | school | detail |
|---|---|---|
| report-card | ZZ Northgate School | 6 card(s) carry no subjects/scale snapshot and render with today's config |
| report-card-attendance | Saraswati Vidya Mandir | 40 closed-year card(s) carry an attendance figure with no register behind it (the year's registers were never entered here) |
| report-card-attendance | Sunrise Public School | 40 closed-year card(s) carry an attendance figure with no register behind it (the year's registers were never entered here) |
| exam-sitting | ZZ Northgate School | series "Unit Test 1" has no term although "Term 1" covers its first paper — it stays off term and annual cards |
| exam-sitting | ZZ Northgate School | series "ZZ E2E Unit Test" has no term although "Term 1" covers its first paper — it stays off term and annual cards |
| attendance-session | ZZ Northgate School | 18 register(s) count as taken with no marks — the session is upserted before any mark is validated |

## INFO (20)

| check | school | detail |
|---|---|---|
| admission | Saraswati Vidya Mandir | 7 of 7 applications carry no PEN — the field is optional on the form |
| admission | Sunrise Public School | 7 of 7 applications carry no PEN — the field is optional on the form |
| admission | ZZ Northgate School | 7 of 7 applications carry no PEN — the field is optional on the form |
| certificate | Saraswati Vidya Mandir | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | CC/2026–27/0001 printed "—" for: record.conduct |
| quiz | ZZ Northgate School | 1 attempt(s) were opened and never answered |
| filings-api | Saraswati Vidya Mandir | staff ready 10/10 |
| filings-api | Sunrise Public School | staff ready 10/10 |
| filings-api | ZZ Northgate School | staff ready 8/11; missing gender=3, socialCategory=3, academicQualification=3, professionalQualification=3, appointmentType=3, joinedOn=3 |
| cards-api | Saraswati Vidya Mandir | the sampled child has no report card to read |
| cards-api | Sunrise Public School | the sampled child has no report card to read |
| cards-api | ZZ Northgate School | the sampled child has no report card to read |
| board-api | Saraswati Vidya Mandir | 2026-09-24: 1 away, 5 lessons, 1 covered |
| board-api | Sunrise Public School | 2026-09-24: 1 away, 5 lessons, 1 covered |
| board-api | ZZ Northgate School | 2026-09-24: 1 away, 6 lessons, 1 covered |
| overview-api | Saraswati Vidya Mandir | principal: attendance 93%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 93%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 8 (holidays and empty classes are not excluded) |
| population | all | school tables with no rows: CompetitionEntry, CompetitionStanding, ExpertInvite, FeeConcession, FeeRefund, GatewayEvent, GlobalPostHide, Holiday, Invite, PracticeAssignment, RemarkThread, Report, ScheduledDeparture, SchoolRecord |
| population | all | nullable columns never populated: AdmissionCycle.opensAt, AdmissionCycle.closesAt, Application.penNumber, Assignment.rubric, AttendanceRecord.note, AttendanceSession.note, EarnedBadge.academicYearId, Enquiry.closedAt, EntranceSlot.note, ExamSeries.archivedAt, ExamSlot.startMinute, ExamSlot.endMinute, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.confirmedByUserId, FeePayment.failedReason, FeePayment.reversedAt, FeePayment.reversedByUserId, FeePayment.reversalReason, FeeStructure.archivedAt, Grade.letter, Grade.comment, HealthCard.doctorName, HealthCard.doctorPhone, IssuedCertificate.remark, JobPosting.closedAt, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.leftAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, OperatorAccess.endedAt, OutboundMessage.error, OutboundMessage.deliveredAt, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, Post.rejectionReason, Post.pinnedAt, Post.audienceGrade, PupilRecord.caste, ReportCardItem.comment, StaffRecord.staffNumber, StaffRecord.qualification, TimetablePeriod.archivedAt |
