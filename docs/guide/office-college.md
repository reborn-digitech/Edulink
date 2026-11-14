Roles: ADMIN

# The office's guide (college)

This guide is for the registrar's office of a college, a junior college or an autonomous college: the people who sign in with the Admin role at a college. You start at `/admin`, the "Overview", which at a college carries the college's stream tiles instead of the school checklist. Everything in the office's school guide still applies (people, the calendar, certificates, fees, filings, the modules); this guide covers what a college has besides: "Academics" (always on at a college), "College admissions", "Accounts", "Library, hostel and bus", "Exam cell", "Placement", "IQAC desk", "Committees and minutes", "Faculty records", "The college" and "Stream records", all under "Running things". Each of these is in the menu only while the college has its module on; "Academics" cannot be switched off. The college's streams, chosen when the college was made, decide which modules, filings, duties and records the office sees.

## How do I set the college's profile and streams?

The "College profile" at `/admin/settings/college` ("Open the college profile" on "School settings") holds the references the regulators know the college by; the IQAC desk and the filings read them from here.

1. Fill "Affiliating university", "AISHE code" (as AISHE issued it, like C-12345), "NIRF category", "AICTE approval reference", "UGC approval reference", "NAAC grade" and "NAAC grade valid until".
2. Under "Streams the college teaches" tick every stream the college teaches. Its modules, regulators, filings and duties follow them.
3. Press "Save the references". A college must keep at least one stream.

Changing streams later switches no module on or off; the modules a stream brought were switched on when the college was made, and "Modules" on "School settings" switches the rest. The streams decide which duties the office may give a faculty member and which stream records the college keeps.

## How do I invite faculty and give them duties?

"Invite people" at `/admin/invites/new` offers a college's six staff roles (faculty, head of department, exam controller, IQAC, placement officer, accounts) and no teacher role; the first choice is faculty. Students and parents are invited or admitted as at a school.

1. Choose "Invite them as", paste "Emails" or "Upload CSV or Excel", and press "Send {count} invitations".
2. On "People" at `/admin/people`, open a faculty member's or head's row menu and press "Duties".
3. Tick the duties the college's streams offer (a lab in-charge, the anti-ragging squad, an NSS or NCC officer, the research dean, the exam flying squad, a teaching-practice coordinator) and press "Save". Each duty opens its own pages for that person under `/duties/…`.

The row shows "Duties: {duties}". A college whose streams offer no duty says so and points to the college profile. "Staff record…" on the same menu holds the staff record an appointment letter quotes; "Faculty records" below hold what the regulators count.

## How do I set up departments and programmes?

"Academics" at `/admin/academics` has the tabs "Set-up", "Programmes and courses", "Terms, rooms, divisions", "Students", "Offerings and load", "Timetable", "Registration", "Attendance", "Condonations" and "Substitutions". The office writes; the head reads.

1. On "Set-up" under "Load and ratios" set "Fewest hours a week", "Most hours a week", "Students per faculty member" (the AICTE norm is twenty) and "Students per mentor", then "Save".
2. Under the departments press "Add department": "Code", "Name", "Head of department" and "Lowest the head may condone (%)". Below that floor a condonation goes to the principal. Under "Faculty and departments" place each faculty member in a department.
3. On "Programmes and courses" press "Add programme": "Code", "Name", "Level", "Years", "Intake", "Stream", "Regulator" ("As the stream says" unless you choose one), "Attendance rule (%)" (left blank: the regulator's; 75, pharmacy 80, law 70) and the NEP exits ("Exit after year {year}"). "Programme outcomes" take one a line and "Save outcomes".
A department must exist before its programmes. The head of a department may write its programme outcomes too.

## How do I add schemes and courses?

"Programmes and courses" at `/admin/academics/programmes` also holds the "Schemes" and the "Courses" of each programme.

1. Press "Add scheme" for the university's scheme: "Programme", "From the year", "Pass mark (%)", "ATKT limit", "Credits for the programme", "Internal marks", "University marks", "Fewest credits a term", "Most credits a term" and the "Grading table" (one grade a line: the grade, its points and the lowest percentage for it).
2. Press "Add course": "Scheme", "Code", "Name", "Semester", "Lecture credits", "Tutorial credits", "Practical credits", "Kind" ("Core", "Elective", "Minor", "Honours", "Open elective") and "Course outcomes". The "CO–PO map (CO1 PO2 3)" is written on the course's row and saved.

A programme must exist before its scheme, and a scheme before its courses. The head of a department and the course's faculty may write a course's map too.

## How do I set the academic year, the terms, rooms and divisions?

The college's academic year is made on the "School calendar" at `/admin/calendar` under "Academic year", as at a school. Its terms, with their registration windows, are made on "Terms, rooms, divisions" at `/admin/academics/terms`.

1. Under "Terms" press "Add term": "Name" (the odd and the even semester each as a term), "Academic year", "Starts", "Ends", "Registration opens" and "Registration closes". The row says "Registration opens {date}", "Registration open until {date}" or "Registration closed".
2. Under "Rooms and labs" press "Add room": "Name", "Capacity" and "Kind of room". The timetable refuses a room too small.
3. Under "Divisions" press "Add division": "Name", "Programme" and "Year of study". A division is a class of the college: its roll numbers, notices and feed are the class's.

"The university's calendar" at `/admin/college-campus` pastes the academic calendar the university publishes ("One entry a line": first day, last day, HOLIDAY, EXAM or EVENT, name; then "Import"); each entry goes on the college's calendar once.

## How do I give students their seats and register them?

"Students" at `/admin/academics/students` holds each student's seat: programme and scheme, year and semester, division with roll number, and the university's PRN.

1. On a student's row fill "Programme", "Scheme", "Year of entry", "Year of study", "Semester", "Division", "Roll number" and "PRN", then "Save seat".
2. "Registration" at `/admin/academics/registration`: under "Register on a student's behalf" choose the "Student" and press "Show", then register them on the term's offerings within the window and the scheme's credits.
3. Under "Late registrations", for a student who missed the window, fill "Term", "Open until" and "Reason" and press "Ask the principal". The principal's "Approve" or "Refuse" is shown on the row ("Late registration open until {until}").

A student admitted through "College admissions" gets a seat in the same step when the programme has a scheme; the seat keeps the record's PRN. Students register themselves from their own pages inside the window.

## How do I read offerings, build the timetable and cover lectures?

"Offerings and load" at `/admin/academics/offerings` lists each course offered this term, to a division or "Shared across divisions", its faculty member ("No faculty yet" when none) and its weekly "Hours (L+T+P)", then "Load and the ratio": each faculty member's hours against the band and students per faculty member by department.

1. The college day's periods (the bells) are set on the "Timetable" page at `/admin/timetable` under "The school day"; the "Weekly timetable" at `/admin/academics/timetable` says "No bells yet" until they are.
2. On "Weekly timetable" choose a "Division" and press "Add the hour": "Offering", "Day", "Period", "Lecture, lab or tutorial", "Room" ("The offering's own room" or another) and, for a lab hour, the "Lab batch" ("The whole division" or one batch). "Take an hour off the grid" removes one.
3. "Substitutions" at `/admin/academics/substitutions` shows "Lectures to cover on {date}": lectures whose faculty member is on leave or absent on the staff register, and who stands in. The one standing in is told.

A clash of faculty, room, division or student, or a room too small, is refused. Faculty leave is approved by the office or the principal on "Staff leave" at `/principal/leave`, as at a school.

## How do I read attendance and send a condonation on?

"Attendance" at `/admin/academics/attendance` shows "Students", "Below the rule" and "Student-courses": lectures held and attended per course against each student's programme rule; condoned shortfalls count as eligible.

1. "Condonations" at `/admin/academics/condonations` lists each ask with "Attendance {percent} · the department's floor {floor}%".
2. The head of department presses "Approve" above the department's floor, or "Forward to the principal"; the principal decides what is forwarded; "Refuse" ends it. The office reads every ask.

The term's eligibility list, read by the exam cell when forms open, comes from these figures. Faculty mark lectures from their own pages; the office does not mark them.

## How do I run an admission round?

"College admissions" at `/admin/college-admissions` takes the intake from the CET Cell's rounds or the college's own: the seats, the allotment list, scrutiny, the anti-ragging undertaking, the offer, the fee and the seat. Only when the college has the Admissions module on.

1. Press "Open a round": "Name", "Kind" ("CAP round 1", "CAP round 2", "CAP round 3", "Institute-level round" or "Merit list"), "Intake year", "Programme" (or "Every programme"), "Opens on", "Closes on" and "Seats by category", then "Save the round".
2. On a CAP round paste "The CET Cell's allotment list" as the portal shows it, in the order the hint gives, and press "Import"; the same list twice adds nothing. Each allotment waits under "Allotted, no application yet" with "CET application id" and "Merit number"; press "Make the application". In an institute-level or merit round the office types the application itself.
3. "Vacancies after {round}" shows "Seats" against admissions by "Category" and what is "Vacant"; "Admission register" downloads the intake's register as the university inspects it.

The rounds table shows "Allotted", "Applications" and "Admitted" per round.

## How do I scrutinise, offer and admit a college applicant?

Open an application from the round at `/admin/college-admissions/{applicationId}`.

1. Under "Document scrutiny" attach each document's "Scan or photo", mark it "Verified" or "Rejected" with a "Note", and "Save". The page says "Every document is verified." when done; a verified document needs a file.
2. Under "Anti-ragging undertaking" record it as given by the student and a parent. The UGC's portal remains the legal record.
3. Under "The seat" press "Offer the seat": the admission fee is the first term of the category's first-year structure. Then "Record the fee received" with "Amount (₹)", "How it was paid" ("Bank transfer", "UPI", "Cheque", "Cash") and "Bank reference"; the fee is recorded, never collected here.
4. Fill "University PRN", "APAAR id (12 digits)" and "ABC id (12 digits)" and press "Admit": the account, membership, record, programme enrolment, academic seat and fee plan are made in one step.

Once the round's seats for the category or the programme's intake are taken, an offer is refused; the principal may give the seat as supernumerary under "A seat beyond the limits" with the "Reason for the supernumerary seat".

## How do I cancel a seat and record its refund?

A cancelled seat is handled on the same application page at `/admin/college-admissions/{applicationId}`; the refund follows the authority's slab.

1. "Cancel the seat" takes "Reason" and "Last date of admission"; the page then shows "Refund allowed: {amount} ({slab}). The college pays it from its own bank." and the office records it with "Record the refund paid". 2. For a refund outside the slab fill "Refund to ask for (₹)" and "Why the slab should not apply" and press "Ask the principal"; the bank reference waits for the answer.
3. "Refunds outside the slab" at `/admin/college-admissions/refunds` lists them with the principal's answer.

"Seats awaiting their refund" on "Accounts" lists cancelled seats with no bank reference yet.

## How do I set fee structures by programme, year and category?

"Accounts" at `/accounts` is the college's money as its books show it: "Demanded", "Collected", "Outstanding" and "Owed by the state", "Collection against demand" by programme and term, "Defaulters", "Scholarship receivable by age", "Income and expense" and "The auditor's schedules" to download. No money moves here.

1. Open "Fee structures" at `/accounts/structures` and press "Add a structure": "Name", "Programme", "Year of study", "Category", "Approval reference" (as the fee regulating authority's order gives it), each "Term" ("Odd semester", "Even semester") with its lines by head and "Due on", and the late-fee slabs ("Late fee {n}: after days", "Late fee {n}: amount (₹)"), then "Save and publish". An approved fee is not a draft: it is published as soon as it is saved.
2. Press "Raise this year's demands": each active student goes on the structure their programme, year and category call for, with each term's demand. Raising again changes nothing.
3. Under "The office's concession limit" set "Limit (₹)" and "Save": a concession worth more waits for the principal.

Fee heads and programmes must exist first. Exam fees are raised by the exam cell as demands on the same ledgers; the mess and the bus are billed from "Library, hostel and bus". Payments are taken as at a school, from the pupil's ledger under "Fees".

## How do I grant a concession, record a scholarship or clear no-dues?

The accounts desk's pages sit beside "Accounts": "Concessions", "Scholarships", "No-dues" and "A student's account".

1. "Concessions" at `/accounts/concessions`: under "Grant a concession" choose the student, "On the head" (or "Every head"), "Kind" ("A percentage" or "An amount per term"), "Percentage or amount", the reason and "Sanctioned by" (the governing body, the trust, the fee regulating authority), then "Grant". One above the office's limit shows "Waits for the principal" and is not applied until approved.
2. "Scholarships" at `/accounts/scholarships`: "Record a claim" filed on the state portal ("Student", "Scheme", "Applied on", "Portal application id", "Expected"; empty works it out from the scheme). On a claim, "Record the sanction" ("Amount (₹)", "On"), "Record the disbursement" (with "Bank reference"), or "Close it" as "Lapsed" or "Rejected" with a "Reason". "Download the reconciliation sheet" per scheme.
3. "No-dues" at `/accounts/no-dues`: before an exam form, on leaving the hostel and on leaving the college, every desk says the student owes it nothing. Each desk clears its own line with "Clear this line" and a "Note"; a new due reopens it. "Still open for {event}" lists who is not clear.

What the state still owes on claims applied for or sanctioned is shown by age on "Accounts". A rejected claim puts the demand back on the student and tells them.

## How do I read a student's ledger and record their leaving?

"A student's account" at `/accounts/students` shows one student's ledger with the scholarship set against each term, and their leaving.

1. "Choose a student" and press "Open". The ledger shows per "Term" the "Demand", what the "Scholarship covers", "Paid", "You owe" and "Late fee if paid today".
2. Under "Leaving the college" the leaving clearance must be complete ("Every desk has cleared."); otherwise the page says "The leaving clearance is still open. Each desk must clear its line first." Fill "Left on", "Reason" ("Completed the programme", "Transferred", "Left") and "Caution deposit returned: bank reference", then "Record the leaving".

The departure is recorded, the TC's record kept and the alumnus opened; a real parent's guardianship stays. A college certificate (migration, provisional, course completion) is issued from "Certificates" as below.

## How do I issue college certificates?

"Certificates" at `/admin/certificates` works as at a school; at a college the "Kind" and "Start from" lists add "Migration certificate", "Provisional certificate" and "Course completion certificate" beside the transfer, leaving, bonafide, character and study certificates, the custom one and the "Letter of appointment".

1. Press "New template", choose "Start from", fill "Template name", "Kind", "Language of the document" and "Serial prefix", lay out the rows and signatures, and "Save the template".
2. On "Issue a certificate" at `/admin/certificates/issue` choose the "Pupil" (the student) and the "Template", add "Purpose" and "Remark", and press "Issue". The college's own facts fill the placeholders.
3. Answer a student's request under "Requests from families" with "Issue this", or "Decline" with "Why not"; "Set the fee" puts a demand on the student's ledger.

Grade cards, transcripts and degree certificates are the exam cell's documents, not these templates. An issued paper carries its public check code.

## How do I set the college's library, hostel and bus terms?

"Library, hostel and bus" at `/admin/college-campus` holds the college's settings for the modules it has on, and the university's calendar.

1. "The college library": read "Titles", "Periodicals", "E-resources", "Loans in {year}" and "Library spend this year"; set "Books a faculty member holds", "Days a faculty member keeps a book", "Books a student holds", "Days a student keeps a book" and "Book bank: extra books" (for a student holding a scholarship), then "Save". Add an "E-resource" with "Kind" and "Link" (https only) and "Add".
2. "The college hostel": read "Occupancy", "Boarders in {year}", "Hostel incidents", "Squad rounds" and "Late returns"; set "Curfew", "Mess charge a month (₹)" and "Night-outs allowed". Choose a "Month" and press "Bill the month's mess" to put the mess on each boarder's ledger; a month billed twice bills nobody twice.
3. "The college bus": set a route's "Kind" ("A route with a roster" or "A campus loop") and "Fee per term (₹)"; choose the "Term" ("Odd semester", "Even semester") and "Due on" and press "Raise the term's route fees" on each rider's ledger, once per student, route and term.

The houses, rooms, beds, routes and buses themselves are made on the module pages as at a school. The library's criterion-4 numbers and the hostel's occupancy table for the year are read by the IQAC desk.

## What does the office do in the exam cell?

"Exam cell" at `/exam-cell` is the exam controller's; the office reads it, and may make one of the two entries of a course's external marks. Only when the college has the Exams module on.

1. "Exam sessions" lists each session with "{forms} forms, {submitted} submitted, {approved} approved" and "published {date}"; the controller creates one with "New session" ("Name", "Term", "Kind", "Fee head for exam fees", "Forms open", "Forms close", "Fee per course (₹)", "Fee per backlog course (₹)"). Fees are recorded as demands on each student's ledger and paid there.
2. Open a session for its forms (exported as the university takes them), date sheet, halls and seating, invigilation, malpractice, the marks sheets and the results; "Results analytics" at `/exam-cell/analytics` gives pass rates by course, faculty and division.
3. On a course's marks sheet during conduct or assessment, "Your entry" takes your entry of the external marks; two people must agree before a mark stands.

"Grace proposals waiting" are decided by the principal alone. Hall tickets, grade cards, transcripts and degree certificates are drawn by the exam cell; the office reads them with the student.

## What does the office see of placement and alumni?

"Placement" at `/placement` is the placement officer's; the office reads it. Only when the college has the Placement module on.

1. Read "Final year", "Placed", "Median salary" and "Placement index", "Waiting for you" ("{count} requirements from recruiters", "{count} internships to approve") and the "Drives" with their stage.
2. The office's side of the alumni is at `/admin/alumni/college` ("The college's alumni"): "Record the gift" ("Alumnus", "Kind of gift", "Amount in rupees", "Receipt number the college issued", "Received on", "Note"), since money never passes through the app; "Put it on the calendar" for a "Meet or reunion" ("On", "Venue", "Batch"); "Referrals from alumni"; and "Batches", the AQAR's alumni table.

The placement table's sheets for the NBA and NIRF are the placement officer's to cut; the office reads the counts on "The college".

## How do I keep the IQAC desk?

"IQAC desk" at `/iqac` is the IQAC coordinator's, and the office may do everything there. Only when the college has the IQAC module on.

1. Under "NAAC cycle" press "Open the cycle" with "Window from" and "Window to" (up to five years; one open at a time); the predictor fills itself from the college's records and "Recompute from the records" refreshes it. "The ten cheapest metrics to move" and the "NIRF estimate" are the platform's estimates; it does not score for NAAC.
2. On "Filings" at `/iqac/documents` choose the "Filing" and press "Generate from the records"; "Send to the principal" sends a NAAC document for sign-off; "Mark as filed on the portal" records the filing. A greyed filing says "Filed by a college teaching {streams}."
3. Under "Mandatory disclosure" press "Publish a fresh snapshot" (no student and no PAN) or "Take the page down", at a college whose streams bring the AICTE disclosure.
Surveys, the research and activity registers and the regulators' calendar are on the same desk; the IQAC coordinator keeps them day to day.

## How do I keep the committees, the faculty records and grievances?

"Committees and minutes" and "Faculty records" are the office's to write; the principal reads them and the IQAC cites them. The minutes and the action taken of the Internal Complaints Committee and the anti-ragging committee are the exception: like their grievances, they are read by the office and the principal alone, and the IQAC sees only that a meeting was held and on which date, so those minutes are never cited as evidence.

1. "Committees and minutes" at `/admin/committees`: "Add a committee" with "Kind", "Name" and "Members, one per line: name, then a comma and their role", then "Save the committee". Under "Meetings" record "Date", the "Minutes" file and "Action taken" with "Save the meeting".
2. "Faculty records" at `/admin/faculty-records`: for each teacher "Designation", "Appointment", "Highest qualification", "Qualified NET, SET or SLET", "Teaching years before joining", "Joined the college on", "APAAR faculty id" and "PAN" (typed once and sealed, shown by its last four), then "Save the record".

3. "Student grievances" at `/iqac/grievances` are the office's and the principal's to act on: "Acknowledge", "Resolve" with "What the committee did or decided", or "Send to the Ombudsperson", each within its fifteen-working-day limit.

Ragging and harassment complaints are read by the office and the head alone; the IQAC reads only the counts it cites.

## How do I keep the stream records?

"Stream records" at `/admin/stream-records` shows what the college's streams ask it to keep for the year: "Labs and the practical record", "Moot courts and law internships", "Teaching practice" and "NSS and NCC", each with its counts. A college whose streams bring none says so, with "Change the streams".

1. "Lab batches" at `/admin/stream-records/lab-batches`: each division is split into batches by roll number, "Most in a batch" (twenty unless you say), named A, B, C…; "Move" a "Student" "To batch". A change made now applies from the date shown; a lab already marked keeps the batches it was marked with.
2. "The practical record" at `/admin/stream-records/practicals`: each experiment a student performed, its marks and who signed it. The course's teacher writes; the teacher or a lab in-charge signs, and a signed row is final.
3. "Moot courts" at `/admin/stream-records/moot-courts` (law only): "Record a moot court" with "Name of the moot", "Held on", "Kind", at least two teams ("Team name", "Choose the team's students", "Outcome"), "Result" and "Judges' notes". "Internships" count each law student's weeks against the Bar Council's minimum.
4. "Teaching practice", "The NSS unit" and "The NCC unit" open the duty desks at `/duties/teaching-practice`, `/duties/nss` and `/duties/ncc`, where the office may add practice schools and postings, enrol students and record activities with their hours.

The year's figures ("Signed", "Waiting to be signed", "Meeting the BCI weeks", "Meeting the NCTE weeks", "NSS hours this year", "Camps") are the ones the council returns and the IQAC read.

## What does the office read on "The college"?

"The college" at `/principal/college` is the head's dashboard, which the office reads too: "Waiting for your word" (what the regulations leave to the principal, each with "Decide"), "The college at a glance · {date}" ("Faculty present", "Fees received", "Scholarships disbursed", "Hostel occupancy", "Open grievances", "Open incidents", "NAAC predictor", "NIRF estimate"), "Today's lectures by department", "The ten cheapest metrics to move", "Results and outcomes", "Faculty", "Governance", "Placements and alumni", "Money" and "The accreditation file".

1. Read what waits for the principal and prepare it: a late registration, a forwarded condonation, a concession above the limit, a refund outside the slab, a hostel expulsion, a grace proposal, a NAAC document.
2. Read the figures; each is one of the other pages' own numbers, computed on read.

No payment is made in the app; the money figures are the college's own records. The principal's decisions are written to the decision log at `/principal/decisions`, which the office reads.
