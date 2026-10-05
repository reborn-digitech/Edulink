# Data-flow audit — latest run

Run: 2026-10-05T09:37:23.143Z · schools: Saraswati Arts and Science College, Saraswati Institute of Technology, Saraswati Vidya Mandir, Sunrise Public School, ZZ Northgate School · 1 FAIL · 0 WARN · 66 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## FAIL (1)

| check | school | detail |
|---|---|---|
| attendance-session | ZZ Northgate School | 8 register(s) count as taken with no marks |

## INFO (66)

| check | school | detail |
|---|---|---|
| gig-earnings | platform | 0 contributed question(s) in the bank, 0 payment(s) recorded |
| gig-seats | platform | 8 slot(s) offered |
| gig-money | platform | 2 seat payment(s), 1 payout(s), 1 invoice(s) |
| user-minor | all | 172 dated account(s) checked, 0 out of step |
| admission | Saraswati Vidya Mandir | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | Sunrise Public School | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | ZZ Northgate School | 6 of 7 applications carry no PEN — the field is optional on the form |
| certificate | Saraswati Vidya Mandir | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | CC/2026–27/0001 printed "—" for: record.conduct |
| quiz | Sunrise Public School | 1 attempt(s) were opened and never answered |
| question-stat | server | 1753 bucket(s) over 1753 (question, grade) pair(s) match the answer rows exactly |
| filings-api | Saraswati Arts and Science College | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Arts and Science College | staff ready 0/1; missing gender=1, socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, joinedOn=1, serviceJoinedOn=1 |
| filings-api | Saraswati Institute of Technology | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Institute of Technology | staff ready 0/1; missing gender=1, socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, joinedOn=1, serviceJoinedOn=1 |
| filings-api | Saraswati Vidya Mandir | staff ready 10/10 |
| filings-api | Sunrise Public School | staff ready 10/10 |
| filings-api | ZZ Northgate School | staff ready 8/11; missing gender=3, socialCategory=3, academicQualification=3, professionalQualification=3, appointmentType=3, joinedOn=3, serviceJoinedOn=3 |
| cards-api | Saraswati Arts and Science College | the sampled child has no report card to read |
| cards-api | Saraswati Institute of Technology | the sampled child has no report card to read |
| cards-api | Saraswati Vidya Mandir | the sampled child has no report card to read |
| cards-api | Sunrise Public School | the sampled child has no report card to read |
| cards-api | ZZ Northgate School | the sampled child has no report card to read |
| board-api | Saraswati Arts and Science College | 2026-10-05: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Institute of Technology | 2026-10-05: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Vidya Mandir | 2026-10-05: 0 away, 0 lessons, 0 covered |
| board-api | Sunrise Public School | 2026-10-05: 0 away, 0 lessons, 0 covered |
| board-api | ZZ Northgate School | 2026-10-05: 1 away, 6 lessons, 2 covered |
| overview-api | Saraswati Arts and Science College | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Institute of Technology | principal: attendance null%, registers missing today 5 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Vidya Mandir | principal: attendance 91%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 91%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 8 (holidays and empty classes are not excluded) |
| usage-sample | Saraswati Arts and Science College | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Institute of Technology | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | ZZ Northgate School | no row for 2026-10 yet (usage:sample has not run) |
| population | all | school tables with no rows: AdmissionRound, AlumniGift, AlumniMeet, AlumniMeetRegistration, AlumniNote, AlumniReferral, AssessmentAllocation, AttendanceCondonation, AttendanceCover, CapAllotment, CollegeApplication, CollegeOfficeSettings, Convocation, CourseFile, CourseFileItem, ExamGrace, ExamModerationNote, ExamSquadVisit, ExpertInvite, GatewayEvent, GlobalPostHide, HostelExpulsion, Invigilation, IqacFile, LateRegistration, Malpractice, MootCourt, NoDuesClearance, PracticeSchool, Project, Revaluation, ReviewRound, StaffAdvance, StudentConsent, Submission, TeachingPracticePosting |
| population | all | nullable columns never populated: AcademicsSettings.updatedByUserId, ActionTakenReport.fileId, ActionTakenReport.postId, Activity.theme, Activity.departmentId, Activity.fileId, AdmissionCycle.opensAt, AdmissionCycle.closesAt, AlumniProfile.mutedAt, AlumniProfile.mutedByUserId, AlumniProfile.muteReason, Asset.warrantyUntil, Asset.depreciationRateBp, Asset.lastAuditedAt, Asset.disposedAt, Assignment.rubric, AttendanceRecord.note, AttendanceSession.note, Backlog.clearedSessionId, Backlog.clearedAt, BusAssignment.attendantMembershipId, CertificateRequest.feeDemandId, CertificateRequest.feePaise, CollegeFiling.fileId, Comment.parentCommentId, CommitteeMeeting.minutesFileId, Conversation.closedAt, Conversation.closedByUserId, ConversationMessage.clientId, CorpsEnrolment.leftOn, CourseOffering.capacity, CreditPush.apaarId, CreditPush.abcRef, CreditPush.pushedAt, CreditPush.error, DriveApplication.withdrawnAt, EarnedBadge.academicYearId, EntranceSlot.note, ExamDocument.signaturePng, ExamDocument.sealPng, ExamDocument.revokedAt, ExamDocument.revokedReason, ExamForm.feeDemandId, ExamForm.waiverReason, ExamForm.refusalReason, ExamMark.reason, ExamRoom.roomId, FacultyRecord.apaarFacultyId, FacultyRecord.panSealed, FacultyRecord.panLast4, FacultyRecord.publicProfileAt, FeeConcession.approvedAt, FeeConcession.approvedByUserId, FeeConcession.authority, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.gatewayOrderId, FeePayment.gatewayPaymentId, FeePayment.gatewayMethod, FeePayment.note, FeePayment.payerUserId, FeePayment.confirmedByUserId, FeePayment.claimedAt, FeePayment.failedReason, FeePayment.reversedAt, FeePayment.reversedByUserId, FeePayment.reversalReason, FeeRefund.gatewayRefundId, FeeRefund.cutsJson, FeeRefund.failedReason, GigBooking.cancelledAt, GigBooking.cancelledByUserId, GigBooking.cancelReason, GigBooking.rating, GigBooking.feedback, GigBooking.ratedAt, GigBooking.remindedAt, Grade.submissionId, Grade.letter, Grade.comment, Grievance.fileId, Grievance.escalatedAt, GuardianClaim.decidedAt, GuardianClaim.decidedByUserId, GuardianClaim.declineReason, HostelAllotment.toDate, HostelAllotment.feeDemandId, HostelAllotment.endedByUserId, HostelLeave.decisionNote, Incident.hostelId, Internship.reportFileId, Internship.parentDeclarationFileId, Internship.refusedReason, InventoryItem.archivedAt, InventoryRequest.decidedByUserId, InventoryRequest.decidedAt, InventoryRequest.decisionNote, Invite.classId, Invite.acceptedByUserId, Invite.acceptedAt, Invite.relation, Invite.studentMembershipId, IssuedCertificate.remark, IssuedCertificate.studentName, JoinRequest.decidedAt, JoinRequest.decidedByMembershipId, JoinRequest.declineReason, LabBatchMember.untilKey, Lecture.roomId, Lecture.substituteMembershipId, Lecture.cancelledAt, LectureAttendance.clientId, LibraryCopy.seenAt, LibraryFine.waivedAt, LibraryFine.waivedByUserId, LibraryFine.waivedReason, LibraryFine.demandId, LibraryIssue.remindedOn, LibraryIssue.noticedOn, LibraryReservation.fulfilledAt, LibrarySettings.fineHeadId, LibrarySettings.stockTakeStartedAt, LibrarySettings.updatedByUserId, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, Offer.letterFileId, Offer.declinedAt, OperatorAccess.endedAt, OutboundMessage.skipReason, OutboundMessage.error, OutboundMessage.deliveredAt, Payslip.lopOverrideHalfDays, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, PlacementProfile.dreamByUserId, Post.rejectionReason, Post.pinnedAt, Post.audienceGrade, Post.remindedAt, Post.audienceTarget, Post.consentBy, Post.consentQuestion, PracticeAssignment.archivedAt, Programme.archivedAt, ProgrammeEnrolment.roundId, PupilRecord.guardianPhone, PupilRecord.alternatePhone, PupilRecord.freeUniform, PupilRecord.freeTextbook, PupilRecord.extracurricular, PupilRecord.stream, PupilRecord.vocationalCourse, PupilRecord.vocationalTradeId, PupilRecord.vocationalJobRoleId, PupilRecord.vocationalExamAppeared, PupilRecord.abcId, PupilRecord.admissionRoundId, PupilRecord.apaarId, PurchaseRecord.billFileId, QuestionPaper.moderatedByUserId, QuestionPaper.moderatedAt, QuestionPaper.moderationNote, QuizResponse.gradeLevel, QuizResponse.seconds, RemarkThread.closedAt, Report.resolvedAt, Report.resolutionNote, ReportCard.practice, ReportCardItem.comment, ResearchItem.fileId, ResultRun.reason, RoundResult.feedback, SalaryStructure.archivedAt, ScholarshipClaim.disbursedPaise, ScholarshipClaim.disbursedAt, ScholarshipClaim.disbursementRef, ScholarshipClaim.alumniGiftId, ScholarshipClaim.lapsedAt, SchoolRecord.admissionNumber, SchoolRecord.formerMembershipId, SchoolRecord.supersededAt, SchoolRecord.supersededReason, StaffAppraisal.strengths, StaffAppraisal.targets, StaffAppraisal.rating, StaffRecord.qualification, StaffRecord.appointedSubject, StaffSalary.updatedByUserId, StockMovement.toDepartment, StockMovement.requestId, Substitution.acknowledgedAt, Substitution.declineReason, Substitution.declinedAt, Survey.termId, Survey.offeringId, SurveyResponse.respondentMembershipId, SurveyResponse.source, TimetablePeriod.archivedAt, TransportAllotment.feeHeadId, Trip.startReason, Trip.lowBatteryAt, Vendor.address |
| bank-source | server | in-app questions the importer spares: none |
| inventory-stock | Saraswati Institute of Technology | 3 stock rows checked |
| inventory-stock | ZZ Northgate School | 2 stock rows checked |
| payroll-slip | Saraswati Institute of Technology | 15 payslips checked |
| payroll-slip | ZZ Northgate School | 3 payslips checked |
| payroll-run | Saraswati Institute of Technology | 1 runs (1 locked) checked |
| payroll-run | ZZ Northgate School | 1 runs (1 locked) checked |
| academics-internal-lock | Saraswati Arts and Science College | 2 locked offerings checked |
| academics-internal-lock | Saraswati Institute of Technology | 1 locked offerings checked |
| academics-internal-lock | ZZ Vidya College | 1 locked offerings checked |
| college-prn | ZZ Vidya College | 3 seats checked against their records |
| college-prn | Saraswati Arts and Science College | 10 seats checked against their records |
| college-prn | Saraswati Institute of Technology | 12 seats checked against their records |
| exam-sgpa | Saraswati Arts and Science College | 8 term results checked |
| exam-sgpa | Saraswati Institute of Technology | 10 term results checked |
| exam-sgpa | ZZ Vidya College | 3 term results checked |
| iqac-cgpa | Saraswati Arts and Science College | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Institute of Technology | 1 NAAC cycle(s) checked |
| iqac-cgpa | ZZ Vidya College | 1 NAAC cycle(s) checked |
| iqac-filing | Saraswati Arts and Science College | 1 filing(s) regenerated and compared |
| iqac-filing | Saraswati Institute of Technology | 1 filing(s) regenerated and compared |
| iqac-filing | ZZ Vidya College | 1 filing(s) regenerated and compared |
| iqac-filing | ZZ Shastri Autonomous College | 1 filing(s) regenerated and compared |
| iqac-grievance | Saraswati Arts and Science College | 2 grievance(s) checked |
| iqac-grievance | ZZ Vidya College | 2 grievance(s) checked |
| placement-season | Saraswati Arts and Science College | 1 season row(s) and 0 students' internship credits checked |
| placement-season | Saraswati Institute of Technology | 1 season row(s) and 1 students' internship credits checked |
| placement-season | ZZ Vidya College | 1 season row(s) and 0 students' internship credits checked |
