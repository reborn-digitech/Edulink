# Data-flow audit — latest run

Run: 2026-10-24T06:21:41.880Z · schools: Saraswati Arts and Science College, Saraswati College of Agriculture, Saraswati College of Education, Saraswati College of Pharmacy, Saraswati Institute of Health Sciences, Saraswati Institute of Management, Saraswati Institute of Technology, Saraswati Law College, Saraswati School of Architecture, Saraswati Vidya Mandir, Saraswati Vocational College, Sunrise Public School, ZZ Northgate School · 0 FAIL · 6 WARN · 191 INFO

Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.

## WARN (6)

| check | school | detail |
|---|---|---|
| fee-payment | Sunrise Public School | payment cmvlzha9h000sgpgjvwelyiml is REVERSED yet still holds 750000 in allocations |
| fee-payment | Sunrise Public School | payment cmvlzh2lu000fgpgjghw9mu29 is REVERSED yet still holds 500000 in allocations |
| fee-payment | Sunrise Public School | payment cmvlzho65001sgpgjbc1vswez is REVERSED yet still holds 750000 in allocations |
| fee-payment | Sunrise Public School | payment cmvlzlu9v0044gpgjy014ns04 is REVERSED yet still holds 1250000 in allocations |
| usage-sample | Saraswati Vidya Mandir | 2026-10 pupils: stored 48 vs recomputed 49 (computed 2026-10-01T02:02:15.579Z) |
| usage-sample | Sunrise Public School | 2026-10 messages: stored 0 vs recomputed 7 (computed 2026-10-01T02:02:15.579Z) |

## INFO (191)

| check | school | detail |
|---|---|---|
| gig-earnings | platform | 0 contributed question(s) in the bank, 0 payment(s) recorded |
| gig-seats | platform | 12 slot(s) offered |
| gig-money | platform | 3 seat payment(s), 1 payout(s), 1 invoice(s) |
| user-minor | all | 245 dated account(s) checked, 0 out of step |
| admission | Saraswati Vidya Mandir | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | Sunrise Public School | 6 of 7 applications carry no PEN — the field is optional on the form |
| admission | ZZ Northgate School | 6 of 7 applications carry no PEN — the field is optional on the form |
| certificate | Saraswati Vidya Mandir | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | CC/2026–27/0001 printed "—" for: record.conduct |
| certificate | Sunrise Public School | TC/2025–26/0001 printed "—" for: pupil.motherName, pupil.nationality, pupil.religion, pupil.caste, pupil.category, pupil.motherTongue, pupil.placeOfBirth, pupil.previousSchool, issue.remark |
| quiz | Saraswati Vidya Mandir | 1 attempt(s) were opened and never answered |
| quiz | Sunrise Public School | 4 attempt(s) were opened and never answered |
| question-stat | server | 3153 bucket(s) over 3153 (question, grade) pair(s) match the answer rows exactly |
| filings-api | Saraswati Arts and Science College | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Arts and Science College | staff ready 0/1; missing gender=1, socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, joinedOn=1, serviceJoinedOn=1 |
| filings-api | Saraswati College of Agriculture | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati College of Agriculture | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati College of Education | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati College of Education | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati College of Pharmacy | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati College of Pharmacy | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati Institute of Health Sciences | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Institute of Health Sciences | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati Institute of Management | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Institute of Management | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati Institute of Technology | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Institute of Technology | staff ready 0/1; missing gender=1, socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, joinedOn=1, serviceJoinedOn=1 |
| filings-api | Saraswati Law College | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Law College | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati School of Architecture | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati School of Architecture | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Saraswati Vidya Mandir | staff ready 10/10 |
| filings-api | Saraswati Vocational College | filing identity blank: udiseCode, board, affiliationNumber, district, block, medium, managementType |
| filings-api | Saraswati Vocational College | staff ready 0/1; missing socialCategory=1, academicQualification=1, professionalQualification=1, appointmentType=1, serviceJoinedOn=1 |
| filings-api | Sunrise Public School | staff ready 10/10 |
| filings-api | ZZ Northgate School | staff ready 8/11; missing gender=3, socialCategory=3, academicQualification=3, professionalQualification=3, appointmentType=3, joinedOn=3, serviceJoinedOn=3 |
| cards-api | Saraswati Arts and Science College | the sampled child has no report card to read |
| cards-api | Saraswati College of Agriculture | the sampled child has no report card to read |
| cards-api | Saraswati College of Education | the sampled child has no report card to read |
| cards-api | Saraswati College of Pharmacy | the sampled child has no report card to read |
| cards-api | Saraswati Institute of Health Sciences | the sampled child has no report card to read |
| cards-api | Saraswati Institute of Management | the sampled child has no report card to read |
| cards-api | Saraswati Institute of Technology | the sampled child has no report card to read |
| cards-api | Saraswati Law College | the sampled child has no report card to read |
| cards-api | Saraswati School of Architecture | the sampled child has no report card to read |
| cards-api | Saraswati Vidya Mandir | the sampled child has no report card to read |
| cards-api | Saraswati Vocational College | the sampled child has no report card to read |
| cards-api | Sunrise Public School | the sampled child has no report card to read |
| cards-api | ZZ Northgate School | the sampled child has no report card to read |
| board-api | Saraswati Arts and Science College | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati College of Agriculture | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati College of Education | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati College of Pharmacy | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Institute of Health Sciences | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Institute of Management | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Institute of Technology | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Law College | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati School of Architecture | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Saraswati Vidya Mandir | 2026-10-24: 1 away, 4 lessons, 1 covered |
| board-api | Saraswati Vocational College | 2026-10-24: 0 away, 0 lessons, 0 covered |
| board-api | Sunrise Public School | 2026-10-24: 1 away, 4 lessons, 1 covered |
| board-api | ZZ Northgate School | 2026-10-24: 0 away, 0 lessons, 0 covered |
| overview-api | Saraswati Arts and Science College | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati College of Agriculture | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati College of Education | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati College of Pharmacy | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Institute of Health Sciences | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Institute of Management | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Institute of Technology | principal: attendance null%, registers missing today 5 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Law College | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati School of Architecture | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Vidya Mandir | principal: attendance 95%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | Saraswati Vocational College | principal: attendance null%, registers missing today 3 (holidays and empty classes are not excluded) |
| overview-api | Sunrise Public School | principal: attendance 95%, registers missing today 6 (holidays and empty classes are not excluded) |
| overview-api | ZZ Northgate School | principal: attendance null%, registers missing today 8 (holidays and empty classes are not excluded) |
| usage-sample | Saraswati Arts and Science College | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati College of Agriculture | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati College of Education | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati College of Pharmacy | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Institute of Health Sciences | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Institute of Management | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Institute of Technology | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Law College | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati School of Architecture | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | Saraswati Vocational College | no row for 2026-10 yet (usage:sample has not run) |
| usage-sample | ZZ Northgate School | no row for 2026-10 yet (usage:sample has not run) |
| population | all | school tables with no rows: AdmissionRound, AlumniGift, AlumniMeet, AlumniMeetRegistration, AlumniReferral, AssessmentAllocation, AttendanceCondonation, AttendanceCover, AttendancePunch, CapAllotment, CollegeApplication, CollegeOfficeSettings, Convocation, CourseFile, CourseFileItem, ExamGrace, ExamModerationNote, ExpertInvite, FacultyPublicProfile, GlobalPostHide, HostelExpulsion, Invigilation, IqacFile, IqacScenario, LateRegistration, LibraryVolume, Malpractice, NoDuesClearance, PlacementTalk, PlacementTalkRsvp, Project, ReadingRoomVisit, Revaluation, SoftSkillsEnrolment, SoftSkillsSession, SoftSkillsTraining, StaffAdvance |
| population | all | nullable columns never populated: AcademicsSettings.updatedByUserId, ActionTakenReport.fileId, ActionTakenReport.postId, Activity.theme, Activity.departmentId, Activity.fileId, AdmissionCycle.opensAt, AdmissionCycle.closesAt, AlumniNote.batchYear, AlumniProfile.mutedAt, AlumniProfile.mutedByUserId, AlumniProfile.muteReason, Asset.warrantyUntil, Asset.depreciationRateBp, Asset.lastAuditedAt, Asset.disposedAt, Assignment.rubric, AssistantMessage.matchedAssignmentId, AssistantMessage.helpful, AssistantMessage.cachedAnswerId, AssistantMessage.gateReasons, AssistantMessage.scope, AttendanceDevice.disabledAt, AttendanceDevice.lastPunchAt, AttendanceRecord.note, AttendanceSession.note, Backlog.clearedSessionId, Backlog.clearedAt, BusAssignment.attendantMembershipId, CertificateRequest.feeDemandId, ClinicalPosting.labBatchId, ClinicalSite.archivedAt, CollegeFiling.fileId, Comment.parentCommentId, CommitteeMeeting.minutesFileId, Conversation.closedAt, Conversation.closedByUserId, ConversationMessage.clientId, CorpsEnrolment.leftOn, CourseOffering.capacity, CreditPush.apaarId, CreditPush.abcRef, CreditPush.pushedAt, CreditPush.error, DriveApplication.withdrawnAt, EarnedBadge.academicYearId, EntranceSlot.note, ExamDocument.signaturePng, ExamDocument.sealPng, ExamDocument.revokedAt, ExamDocument.revokedReason, ExamForm.feeDemandId, ExamForm.waiverReason, ExamForm.refusalReason, ExamMark.reason, ExamRoom.roomId, FacultyRecord.apaarFacultyId, FacultyRecord.panSealed, FacultyRecord.panLast4, FacultyRecord.publicProfileAt, FacultyRecord.publicPhotoConsentAt, FacultyRecord.publicPhotoFileId, FeeConcession.approvedAt, FeeConcession.approvedByUserId, FeeConcession.authority, FeeDemand.carriedToDemandId, FeeHead.retiredAt, FeePayment.gatewayMethod, FeePayment.confirmedByUserId, FeePayment.claimedAt, FeeRefund.gatewayRefundId, FeeRefund.cutsJson, FeeRefund.failedReason, GigBooking.cancelledAt, GigBooking.cancelledByUserId, GigBooking.cancelReason, GigBooking.rating, GigBooking.feedback, GigBooking.ratedAt, GigBooking.remindedAt, GigBooking.joinRemindedAt, Grade.submissionId, Grade.letter, Grade.comment, Grievance.fileId, Grievance.escalatedAt, GuardianClaim.declineReason, HostelAllotment.toDate, HostelAllotment.feeDemandId, HostelAllotment.endedByUserId, HostelLeave.decisionNote, Incident.hostelId, Internship.reportFileId, Internship.parentDeclarationFileId, Internship.refusedReason, InventoryItem.archivedAt, InventoryRequest.decidedByUserId, InventoryRequest.decidedAt, InventoryRequest.decisionNote, Invite.classId, Invite.acceptedByUserId, Invite.acceptedAt, Invite.relation, Invite.studentMembershipId, IssuedCertificate.remark, JoinRequest.decidedAt, JoinRequest.decidedByMembershipId, JoinRequest.declineReason, LabBatchMember.untilKey, Lecture.substituteMembershipId, Lecture.cancelledAt, LectureAttendance.clientId, LibraryCopy.seenAt, LibraryFine.waivedAt, LibraryFine.waivedByUserId, LibraryFine.waivedReason, LibraryFine.demandId, LibraryIssue.remindedOn, LibraryIssue.noticedOn, LibraryReservation.fulfilledAt, LibrarySettings.fineHeadId, LibrarySettings.stockTakeStartedAt, LibrarySettings.updatedByUserId, LibraryTitle.frequency, LibraryTitle.subscriptionFrom, LibraryTitle.subscriptionUntil, MeetingBooking.cancelledAt, MeetingSlot.cancelledAt, Membership.suspendedAt, Membership.suspendedReason, MentorThread.closedAt, MentorThread.declineReason, Offer.letterFileId, Offer.declinedAt, OperatorAccess.endedAt, OutboundMessage.error, OutboundMessage.deliveredAt, Payslip.lopOverrideHalfDays, PeerTeamVisit.departmentId, PeerVisitItem.url, PenChangeRequest.principalDecidedAt, PenChangeRequest.principalUserId, PenChangeRequest.principalApproved, PenChangeRequest.guardianDecidedAt, PenChangeRequest.guardianUserId, PenChangeRequest.guardianApproved, PenChangeRequest.decisionReason, PenChangeRequest.appliedAt, PlacementProfile.dreamByUserId, Post.rejectionReason, Post.pinnedAt, Post.audienceTarget, Post.consentBy, Post.consentQuestion, Post.authorCommitteeId, PracticeAssignment.archivedAt, PracticeSchool.archivedAt, Programme.archivedAt, ProgrammeEnrolment.roundId, PupilRecord.guardianPhone, PupilRecord.alternatePhone, PupilRecord.freeUniform, PupilRecord.freeTextbook, PupilRecord.extracurricular, PupilRecord.stream, PupilRecord.vocationalCourse, PupilRecord.vocationalTradeId, PupilRecord.vocationalJobRoleId, PupilRecord.vocationalExamAppeared, PupilRecord.abcId, PupilRecord.admissionRoundId, PupilRecord.apaarId, PurchaseRecord.billFileId, QuestionPaper.moderatedByUserId, QuestionPaper.moderatedAt, QuestionPaper.moderationNote, QuizResponse.gradeLevel, QuizResponse.seconds, RemarkThread.closedAt, Report.resolvedAt, Report.resolutionNote, ReportCard.practice, ReportCardItem.comment, ResearchItem.fileId, ResultRun.reason, RoundResult.feedback, SalaryStructure.archivedAt, ScholarshipClaim.disbursedPaise, ScholarshipClaim.disbursedAt, ScholarshipClaim.disbursementRef, ScholarshipClaim.alumniGiftId, ScholarshipClaim.lapsedAt, SchoolRecord.formerMembershipId, SchoolRecord.supersededAt, SchoolRecord.supersededReason, SchoolSiteDomain.dnsCheckedAt, SchoolSiteDomain.dnsError, SchoolSiteDomain.certCheckedAt, SchoolSiteDomain.certError, SchoolSiteDomain.verifiedAt, SchoolSiteEnquiry.readAt, SchoolSiteEnquiry.readByUserId, SchoolSiteEnquiry.closedAt, SocialConnection.tokenExpiresAt, SocialConnection.error, SocialPost.fileId, SocialPost.pictureToken, StaffAppraisal.strengths, StaffAppraisal.targets, StaffAppraisal.rating, StaffRecord.qualification, StaffRecord.appointedSubject, StaffSalary.updatedByUserId, StockMovement.toDepartment, StockMovement.requestId, StudentConsent.revokedAt, StudioSubmission.fileId, StudioSubmission.fileName, StudioSubmission.fileMime, StudioSubmission.fileSize, Substitution.acknowledgedAt, Substitution.declineReason, Substitution.declinedAt, Survey.termId, Survey.offeringId, SurveyResponse.respondentMembershipId, SurveyResponse.source, TimetablePeriod.archivedAt, TransportAllotment.feeHeadId, Trip.startReason, Trip.lowBatteryAt, Vendor.address |
| bank-source | server | in-app questions the importer spares: none |
| inventory-stock | Saraswati College of Pharmacy | 2 stock rows checked |
| inventory-stock | Saraswati Institute of Technology | 3 stock rows checked |
| inventory-stock | ZZ Northgate School | 2 stock rows checked |
| payroll-slip | Saraswati College of Agriculture | 15 payslips checked |
| payroll-slip | Saraswati College of Education | 15 payslips checked |
| payroll-slip | Saraswati College of Pharmacy | 15 payslips checked |
| payroll-slip | Saraswati Institute of Health Sciences | 15 payslips checked |
| payroll-slip | Saraswati Institute of Management | 15 payslips checked |
| payroll-slip | Saraswati Institute of Technology | 15 payslips checked |
| payroll-slip | Saraswati Law College | 15 payslips checked |
| payroll-slip | Saraswati School of Architecture | 15 payslips checked |
| payroll-slip | Saraswati Vocational College | 14 payslips checked |
| payroll-slip | ZZ Northgate School | 3 payslips checked |
| payroll-run | Saraswati College of Agriculture | 1 runs (1 locked) checked |
| payroll-run | Saraswati College of Education | 1 runs (1 locked) checked |
| payroll-run | Saraswati College of Pharmacy | 1 runs (1 locked) checked |
| payroll-run | Saraswati Institute of Health Sciences | 1 runs (1 locked) checked |
| payroll-run | Saraswati Institute of Management | 1 runs (1 locked) checked |
| payroll-run | Saraswati Institute of Technology | 1 runs (1 locked) checked |
| payroll-run | Saraswati Law College | 1 runs (1 locked) checked |
| payroll-run | Saraswati School of Architecture | 1 runs (1 locked) checked |
| payroll-run | Saraswati Vocational College | 1 runs (1 locked) checked |
| payroll-run | ZZ Northgate School | 1 runs (1 locked) checked |
| academics-internal-lock | Saraswati Arts and Science College | 2 locked offerings checked |
| academics-internal-lock | Saraswati College of Agriculture | 1 locked offerings checked |
| academics-internal-lock | Saraswati College of Education | 1 locked offerings checked |
| academics-internal-lock | Saraswati College of Pharmacy | 1 locked offerings checked |
| academics-internal-lock | Saraswati Institute of Health Sciences | 1 locked offerings checked |
| academics-internal-lock | Saraswati Institute of Management | 1 locked offerings checked |
| academics-internal-lock | Saraswati Institute of Technology | 1 locked offerings checked |
| academics-internal-lock | Saraswati Law College | 1 locked offerings checked |
| academics-internal-lock | Saraswati School of Architecture | 1 locked offerings checked |
| academics-internal-lock | Saraswati Vocational College | 1 locked offerings checked |
| academics-internal-lock | ZZ Vidya College | 1 locked offerings checked |
| college-prn | ZZ Shastri Autonomous College | 4 seats checked against their records |
| college-prn | ZZ Vidya College | 3 seats checked against their records |
| college-prn | Saraswati Law College | 8 seats checked against their records |
| college-prn | Saraswati Institute of Management | 8 seats checked against their records |
| college-prn | Saraswati School of Architecture | 8 seats checked against their records |
| college-prn | Saraswati College of Education | 8 seats checked against their records |
| college-prn | Saraswati Institute of Health Sciences | 8 seats checked against their records |
| college-prn | Saraswati College of Agriculture | 8 seats checked against their records |
| college-prn | Saraswati College of Pharmacy | 8 seats checked against their records |
| college-prn | Saraswati Vocational College | 8 seats checked against their records |
| college-prn | Saraswati Arts and Science College | 10 seats checked against their records |
| college-prn | Saraswati Institute of Technology | 12 seats checked against their records |
| exam-sgpa | Saraswati Arts and Science College | 8 term results checked |
| exam-sgpa | Saraswati College of Agriculture | 6 term results checked |
| exam-sgpa | Saraswati College of Education | 6 term results checked |
| exam-sgpa | Saraswati College of Pharmacy | 6 term results checked |
| exam-sgpa | Saraswati Institute of Health Sciences | 6 term results checked |
| exam-sgpa | Saraswati Institute of Management | 6 term results checked |
| exam-sgpa | Saraswati Institute of Technology | 10 term results checked |
| exam-sgpa | Saraswati Law College | 6 term results checked |
| exam-sgpa | Saraswati School of Architecture | 6 term results checked |
| exam-sgpa | Saraswati Vocational College | 6 term results checked |
| exam-sgpa | ZZ Vidya College | 3 term results checked |
| iqac-cgpa | Saraswati Arts and Science College | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati College of Agriculture | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati College of Education | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati College of Pharmacy | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Institute of Health Sciences | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Institute of Management | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Institute of Technology | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Law College | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati School of Architecture | 1 NAAC cycle(s) checked |
| iqac-cgpa | Saraswati Vocational College | 1 NAAC cycle(s) checked |
| iqac-cgpa | ZZ Vidya College | 1 NAAC cycle(s) checked |
| iqac-scenario | ZZ Vidya College | 1 saved scenario(s) checked |
| punch-key | ZZ Vidya College | 1 device key(s) opened and checked |
| iqac-filing | Saraswati Arts and Science College | 1 filing(s) regenerated and compared |
| iqac-filing | Saraswati College of Agriculture | 2 filing(s) regenerated and compared |
| iqac-filing | Saraswati College of Education | 3 filing(s) regenerated and compared |
| iqac-filing | Saraswati College of Pharmacy | 4 filing(s) regenerated and compared |
| iqac-filing | Saraswati Institute of Health Sciences | 2 filing(s) regenerated and compared |
| iqac-filing | Saraswati Institute of Management | 3 filing(s) regenerated and compared |
| iqac-filing | Saraswati Institute of Technology | 1 filing(s) regenerated and compared |
| iqac-filing | Saraswati Law College | 3 filing(s) regenerated and compared |
| iqac-filing | Saraswati School of Architecture | 2 filing(s) regenerated and compared |
| iqac-filing | Saraswati Vocational College | 2 filing(s) regenerated and compared |
| iqac-filing | ZZ Shastri Autonomous College | 1 filing(s) regenerated and compared |
| iqac-filing | ZZ Vidya College | 1 filing(s) regenerated and compared |
| iqac-grievance | Saraswati Arts and Science College | 2 grievance(s) checked |
| iqac-grievance | Saraswati College of Agriculture | 2 grievance(s) checked |
| iqac-grievance | Saraswati College of Education | 2 grievance(s) checked |
| iqac-grievance | Saraswati College of Pharmacy | 2 grievance(s) checked |
| iqac-grievance | Saraswati Institute of Health Sciences | 2 grievance(s) checked |
| iqac-grievance | Saraswati Institute of Management | 2 grievance(s) checked |
| iqac-grievance | Saraswati Law College | 2 grievance(s) checked |
| iqac-grievance | Saraswati School of Architecture | 2 grievance(s) checked |
| iqac-grievance | Saraswati Vocational College | 2 grievance(s) checked |
| iqac-grievance | ZZ Vidya College | 2 grievance(s) checked |
| placement-season | Saraswati Arts and Science College | 1 season row(s) and 0 students' internship credits checked |
| placement-season | Saraswati College of Agriculture | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati College of Education | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati College of Pharmacy | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati Institute of Health Sciences | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati Institute of Management | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati Institute of Technology | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati Law College | 1 season row(s) and 1 students' internship credits checked |
| placement-season | Saraswati School of Architecture | 1 season row(s) and 1 students' internship credits checked |
| placement-season | ZZ Vidya College | 1 season row(s) and 0 students' internship credits checked |
