# Data-flow audit — latest run

Run: 2026-10-03T21:00:00.356Z · schools: Saraswati Vidya Mandir, Sunrise Public School, ZZ Northgate School · 0 FAIL · 2 WARN · 30 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## WARN (2)

| check | school | detail |
|---|---|---|
| report-card | ZZ Northgate School | 6 card(s) carry no subjects/scale snapshot and render with today's config |
| usage-sample | ZZ Northgate School | 2026-10 messages: stored 0 vs recomputed 11 (computed 2026-10-01T02:02:15.579Z) |

## INFO (30)

| check | school | detail |
|---|---|---|
| gig-earnings | platform | 0 contributed question(s) in the bank, 0 payment(s) recorded |
| gig-seats | platform | 7 slot(s) offered |
| gig-money | platform | 2 seat payment(s), 1 payout(s), 1 invoice(s) |
| user-minor | all | 149 dated account(s) checked, 0 out of step |
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
| board-api | Saraswati Vidya Mandir | 2026-10-04 is closed; no board |
| board-api | Sunrise Public School | 2026-10-04 is closed; no board |
| board-api | ZZ Northgate School | 2026-10-04 is closed; no board |
| overview-api | Saraswati Vidya Mandir | principal: attendance 91%, registers missing today 0 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 91%, registers missing today 0 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 0 (holidays and empty classes are not excluded) |
| population | all | school tables with no rows: AlumniNote, ExpertInvite, GlobalPostHide, StaffAdvance |
| population | all | nullable columns never populated: AdmissionCycle.opensAt, AdmissionCycle.closesAt, AlumniProfile.mutedAt, AlumniProfile.mutedByUserId, AlumniProfile.muteReason, Asset.vendorId, Asset.warrantyUntil, Asset.depreciationRateBp, Asset.lastAuditedAt, Asset.disposedAt, Assignment.rubric, AttendanceRecord.note, AttendanceSession.note, BusAssignment.attendantMembershipId, Conversation.closedAt, Conversation.closedByUserId, EarnedBadge.academicYearId, EntranceSlot.note, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.confirmedByUserId, FeePayment.failedReason, FeePayment.reversedAt, FeePayment.reversedByUserId, FeePayment.reversalReason, FeeRefund.gatewayRefundId, FeeRefund.cutsJson, FeeRefund.failedReason, GigBooking.cancelledAt, GigBooking.cancelledByUserId, GigBooking.cancelReason, GigBooking.rating, GigBooking.feedback, GigBooking.ratedAt, GigBooking.remindedAt, Grade.letter, Grade.comment, GuardianClaim.decidedAt, GuardianClaim.decidedByUserId, GuardianClaim.declineReason, HostelAllotment.toDate, HostelAllotment.feeDemandId, HostelAllotment.endedByUserId, HostelLeave.decisionNote, Incident.hostelId, InventoryItem.archivedAt, InventoryRequest.decidedByUserId, InventoryRequest.decidedAt, InventoryRequest.decisionNote, Invite.classId, Invite.acceptedByUserId, Invite.acceptedAt, Invite.relation, Invite.studentMembershipId, IssuedCertificate.remark, IssuedCertificate.studentName, JoinRequest.decidedAt, JoinRequest.decidedByMembershipId, JoinRequest.declineReason, LibraryCopy.seenAt, LibraryFine.waivedAt, LibraryFine.waivedByUserId, LibraryFine.waivedReason, LibraryFine.demandId, LibraryIssue.remindedOn, LibraryIssue.noticedOn, LibraryReservation.fulfilledAt, LibrarySettings.fineHeadId, LibrarySettings.stockTakeStartedAt, LibrarySettings.updatedByUserId, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, OperatorAccess.endedAt, OutboundMessage.error, OutboundMessage.deliveredAt, PayrollSettings.updatedByUserId, Payslip.lopOverrideHalfDays, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, Post.rejectionReason, Post.pinnedAt, Post.audienceGrade, PracticeAssignment.archivedAt, PupilRecord.guardianPhone, PupilRecord.alternatePhone, PupilRecord.freeUniform, PupilRecord.freeTextbook, PupilRecord.extracurricular, PupilRecord.stream, PupilRecord.vocationalCourse, PupilRecord.vocationalTradeId, PupilRecord.vocationalJobRoleId, PupilRecord.vocationalExamAppeared, PurchaseRecord.billFileId, QuizResponse.gradeLevel, QuizResponse.seconds, RemarkThread.closedAt, Report.resolvedAt, Report.resolutionNote, ReportCardItem.comment, SalaryStructure.archivedAt, SchoolModule.settingsJson, SchoolRecord.admissionNumber, StaffAppraisal.strengths, StaffAppraisal.targets, StaffAppraisal.rating, StaffRecord.qualification, StaffRecord.appointedSubject, StaffSalary.updatedByUserId, StockMovement.toDepartment, StockMovement.requestId, Substitution.acknowledgedAt, Substitution.declineReason, Substitution.declinedAt, TimetablePeriod.archivedAt, TransportAllotment.feeHeadId, Trip.startReason, Trip.lowBatteryAt, Trip.missedNotifiedAt, Vendor.address |
| bank-source | server | in-app questions the importer spares: none |
| inventory-stock | ZZ Northgate School | 2 stock rows checked |
| payroll-slip | ZZ Northgate School | 3 payslips checked |
| payroll-run | ZZ Northgate School | 1 runs (1 locked) checked |
