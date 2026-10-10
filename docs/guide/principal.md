Roles: PRINCIPAL

# The head's guide

This guide is for the head of a school, and for a college principal under the headings that say at a college. You sign in with the Principal role and start at `/principal`, the "Dashboard"; at a college the dashboard sends you on to "The college" at `/principal/college`. A head reads and decides. There is no register, no gradebook and no class set-up on these pages: the teachers mark and the office sets up, and the head's pages read what they wrote and decide what the rules leave to the head. The menu's first five entries are "Dashboard", "Classes", "Leave", "Reviews" and "Exams"; the rest sit under "More" in "Day to day" (messages, the assistant), "School life" (the feed, the student council, vacancies, enquiries, competitions, sessions, past years) and "Running things" (every office page the head reads, and the ones the head decides on). A page behind a module is in the menu only while the school has that module on. The command palette's quick actions are "Review leave requests" and "Class insights".

## What do I see on the dashboard?

The "Dashboard" at `/principal` reads the school over a window you choose with "How far back".

1. The year strip says which term runs ("{name} runs to {date}.") and offers "Finish {name}" when a term or the year has run its course; "Set up the year" when there is none.
2. "Attendance not marked today" names the classes with no register yet; "Attendance" and "Pupils" give the window's figures, with "Past attendance" for a class's month at `/attendance/history`.
3. "{count} leave requests waiting" opens the leave queue; approving arranges cover for the attendance they mark.
4. "PEN corrections" lists the office's proposals with "{count} waiting", each with "Approve" or "Reject" ("Why not").
5. "Syllabus coverage" shows "Overall", "{percent}% of the year gone" and "{count} classes behind"; "Classes worth a look" lists classes with "Attendance below {percent}% over this window".
6. "Teacher reviews" shows the ratings so far, with "Manage rounds".

Nothing on the dashboard is stored; it is worked out from the registers, marks and syllabus progress every time you open it.

## How do I approve or decline leave?

"Staff leave" at `/principal/leave` ("Review leave requests" quick action) lists "Waiting for you ({count})" and "Already decided". The office may decide leave too, so a school whose head is away is not stuck.

1. Open a request. It shows the days, the balance ("{used} of {entitlement} used this year · {remaining} left", or "No entitlement on file · {used} days approved this year") and "This request would go {over} days over" when it would.
2. Under "Who covers their classes" read the classes they are due in ("Applies to {count} classes they are due in.") and "They suggested {name}."; choose "Cover, subject by subject", each colleague marked "free for every lesson" or with "{count} clashes", or leave "Nobody — arrange it later".
3. Press "Approve and arrange cover", or "Approve" when "They mark no attendance and have no timetabled lessons, so no cover is needed."
4. Or press "Decline", write "Why (they will see this)" and press "Confirm decline".

The person is told. Approved leave shows on the calendar's "Staff away", on the staff register as "On leave", on the substitutions board and on the class's staffing page as cover "from approved leave". The decision is written to your decision log.

## How do I read a class?

"Classes" at `/principal/classes` ("Class insights" quick action) reads every class over the window: "Class by class" with "Attendance" and "Progress", sorted "By name", "Lowest attendance first" or "Lowest progress first", filtered by "Grade".

1. Each row shows "{count} pupils", "{count} attendance sessions marked", "{count} with no marks yet" and the report cards' state ("{title}: {published} published, {drafts} draft").
2. Open a class at `/principal/classes/{classId}`. "Worth a look" lists pupils with "Attendance below {percent}%" or "No marks recorded yet" (usually work not yet marked rather than anything about them); "Everybody" lists the roll "In alphabetical order" with each pupil's attendance, progress and report card ("draft" or "No report card").
3. "Past attendance" opens the class's month.

When you are named the class's teacher the page offers "Write report cards": "You are this class’s teacher, so these are yours to write". Otherwise the cards are the class teacher's; the head reads them.

## How do I read the staff roster and write an appraisal?

"Staff" at `/principal/staff` lists everyone on the staff with the record the office keeps ("Staff number", "Designation", "Qualification", "Joined the school on", "Class teacher of {classes}") and "Leave this year" ("{used} of {entitlement} days used · {remaining} left", "{pending} more being asked for"). "Search by name, staff number or designation", filter by "Role" and "Subject".

1. The office keeps these records; "Nothing on file yet — the office fills this in." means so. The page only reads them.
2. Press "Observations and appraisal" on a person (`/principal/staff/{membershipId}/appraisal`).
3. Press "Add an entry": "Kind", "Date", "Rating" (1 to 5, or "No rating"), "What you saw or agreed", and tick "Visible to them" when they should read it; "Save". Until it is ticked, only you and the office can read the entry.
4. On an entry: "Edit", "Hide from them", "Show them", "Remove" ("Yes, remove it").

Entries are filed under the current academic year and listed newest first. The office reads the head's notes and cannot write them.

## How do I read the timetable and cover the gaps?

"Class timetables" at `/principal/timetable` shows any class, any week, with cover and closures already worked in.

1. "Choose a class" and move by "Week" ("← Previous", "This week", "Next →").
2. The page says "{count} lessons have a teacher on leave and no cover this week." with "Arrange cover", or "Every lesson has a teacher assigned."; "{count} lessons have no teacher assigned at all." means the office has a lesson to staff.
3. "Substitutions" at `/admin/substitutions` is the day's board: on an "Uncovered" lesson press "Choose who covers" (the list marks who is "Free", "Busy that period" and "Teaches {subject}"), add a "Note for the substitute" and press "Assign"; "Clear" uncovers it. "Print the board" prints the day.
4. "Staff attendance" at `/admin/staff-attendance` is the staff register: the head may mark it ("Mark everyone present", "Save the register") and read "The month, person by person"; the check-in time is the office's to set.

A lesson of a teacher marked absent or on leave appears on the board by itself. The substitute is told and the board shows "Taken", "Declined" or "Not answered yet".

## How do I follow exams and report cards?

"Exams" at `/exams` has the tabs "Marks", "Upcoming", "Date sheet" and "Report cards": marks as they come in, the exams ahead, the published date sheets and the cards issued ("{count} cards issued"). Filter by "Exam kind".

1. The office schedules the series and publishes the date sheets at `/admin/exams`; the head reads them here.
2. "Report card rules" at `/admin/report-cards` show the grading scale, the co-scholastic areas, the exam-kind weights, each term's share and the printed layout; "The school office sets this up. You can read it here, not change it." "Preview a card" draws a sample.
3. A set of report cards whose layout asks for "The principal" on a signature line waits for you on "Signatures" (below) once the class teacher publishes it.

"Report cards are built class by class by the class teacher."; the head builds a set only for a class the head is named teacher of.

## How do I sign papers?

"Signatures and seal" at `/admin/signatures` holds "Your signature" and "Papers waiting for your signature". The seal is the office's: "Only a school admin sets the seal."

1. Under "Your signature" sign inside the box with a mouse, a finger or a pen, or "Upload a picture" (a PNG or JPEG), then save. "Clear" and "Remove" undo it.
2. Under "Papers waiting for your signature" each paper says "Issued by {name} on {date}" (a set says "{count} report cards"). Press "Open the paper" and read it.
3. Press "Sign" or "Decline". One signature signs every card of a set.

Your signature is drawn at once on a paper you issue yourself, and on a paper somebody else issues only after you sign it here. A paper already signed keeps its own copy even if you remove your signature later. A template that names "The principal" on a line and finds no signature on file prints the line empty until you add one.

## How do I issue or revoke a certificate?

"Certificates" at `/admin/certificates` lists the templates the office designed; the head reads them ("The school office sets this up. You can read it here, not change it.") and may issue from them.

1. Open "Issue a certificate" at `/admin/certificates/issue`. Under "Requests from families" press "Issue this" on a request, or "Decline" with "Why not"; the family is told.
2. Or choose the "Pupil" ("Find a pupil by name or code") and the "Template", add "Purpose", "Remark" and, for a transfer certificate before the last day, "Date of leaving", then "Issue". The page warns which fields the record has nothing for, and that a blank prints as a dash.
3. "Issued certificates" at `/admin/certificates/issued` lists every paper with "Open" and "Revoke" ("Why it is revoked"). A revoked paper stays on the list and the public check says so.

The paper is numbered, frozen, and the family told. The decision is written to your decision log.

## How do I approve a PEN correction or a family's record change?

"Pupil records" at `/admin/records` is the head's to read and correct as the office does; two decisions there are the head's own.

1. A PEN correction the office proposed ("From {from} to {to}", "Proposed by {name}", "Reason: {reason}") needs the principal and a guardian to both approve before it changes: press "Approve" or "Reject" with "Why not", on the dashboard's "PEN corrections" or on the pupil's record. With no guardian linked the row says "No guardian linked; the principal’s word settles it".
2. Under "Changes families have asked for" read "{field}: {from} → {to}" and press "Approve and update" or "Decline" with "A sentence for the family (optional)".
3. "Ask the families" or "Ask this family" asks for what is blank; "Edit the record" corrects a pupil's record yourself; "Find a pupil by PEN" looks a number up.

A family cannot change a record itself. "Filings" at `/admin/filings` shows what the portals know the school as and "Ready to file" ("{ready} of {total} pupils have every UDISE+ field"); the sheets themselves do not download for the head: "Only an admin can download the sheets, because each names children."

## How do I decide an admission?

"Admissions" at `/admin/admissions` shows each cycle's "Grades and seats" with "Applied", "Offered", "Accepted", "Admitted", "Waitlisted" and "Seats left", and the "Applications". The office opens a cycle; the head may edit it, open or close it, publish sittings and decide applications.

1. Open an application. Press "Mark the documents checked", "Record the result" ("Score", "Note"), then "Offer the seat" with "Answer by", the "Fee structure for admitted pupils" and a "Note to the family".
2. Or "Waitlist", "Decline the application" or "Back to the pool", each with a "Note".
3. Once the family accepts, "Admit to the roll" with "Class" and "Admission register number".
4. On the cycle, "Publish sittings" for the entrance test ("First sitting starts", "Minutes each", "How many in a row", "Children per sitting", "Where") and "Cancel" a sitting; "Open", "Close" and "Edit" the cycle.

Admitting creates the pupil's account, links the applicant as guardian, starts the pupil record and puts the pupil on the fee structure. Offers and admissions are written to your decision log.

## What do I read on fees, texts and the calendar?

These office pages are in the head's menu to read.

1. "Fees" at `/admin/fees`: "Asked for", "Collected", "Outstanding", "Overdue", "Pupils on a plan", "Pupils without a plan", "By grade", "How old the outstanding is", "This month, by method" and "Recent payments"; "Dues" lists every pupil with what is due, paid and overdue; "Structures" and "Fee heads" show what each grade pays. The office takes payments, grants concessions and confirms UPI claims.
2. "Texts & WhatsApp" at `/admin/messaging`: "Sent this month", "Delivered", "Failed", "Not sent", "SMS segments used", "Guardians with a number", the "Notices sent" and each notice's report person by person. The office switches the channels and sends.
3. "School calendar" at `/admin/calendar`: the "Academic year", the "Terms", the closures, "Staff away" and "Birthdays". The head may add a year ("Add this year") and terms ("Add"), and close or reopen the year ("End {name}", "Reopen"); the office adds and edits the closures.
4. "Circulars" at `/admin/circulars`: each notice's "Told", "Opened" and "Acknowledged", class by class, and "Chase the rest" once a day for the families still waiting.
5. "Syllabus" at `/admin/syllabus`: the office's chapter lists, read-only, and "Syllabus coverage" at `/admin/syllabus/coverage` with each class's "Where we are".

"Trends" at `/principal/trends` (below) reads the fees collected per term beside attendance and marks.

## How do I start a teacher review round?

"Teacher reviews" at `/admin/reviews` is the head's as much as the office's: "Ratings" and "Review rounds".

1. Under "Open a new round" choose "Teachers to include" ("Everyone" or named ones), "Who is asked" ("Students", "Parents" or "Students and parents") and "Open until", then "Start a review round".
2. The round shows "{count} answers"; "Close now" ends it early.

Answers are only ever aggregated; nobody can see who said what. The dashboard's "Teacher reviews" card shows the ratings and "Unchanged since the previous round ({latest})" when they are.

## How do I record an incident or write a health card?

The "Incident log" at `/admin/incidents` is the whole school's ("Open", "Closed", "All"), with "When", "Pupil", "Class", "What kind", "How serious", "Family" and "Follow-up".

1. From a pupil's profile press "Record an incident" (`/incidents/new`): "What kind", "How serious", "When", "Where", "In one line", "What happened", "What was done" and "Tell the family now", then "Record it". Switch the family notice off only for something the head will raise in person.
2. On an incident "Add a note" for follow-up and, once done, "Close the incident"; nothing more can be added after.
3. On the same profile the "Health card" has "Edit the card" ("Blood group", "Allergies", "Conditions", "Medicines", "Diet", "Teachers should know", "Family doctor", "Who to call"), "Save the card", "Record a check-up" ("Date", "Height (cm)", "Weight (kg)", "Sight", "Notes") and "Print the card".

The office and the head write the card and close incidents; a teacher of the class reads the card and records incidents for their own pupils.

## What do I do when the assistant tells me a pupil may need someone?

When a pupil asks the assistant something that reads as self-harm, the pupil is given a helpline sentence and a caring adult at the school is told: the school's counsellor (a member of staff whose designation on the staff record names a counsellor), else the head, else the office.

1. The notice arrives among your notifications, marked urgent: "A pupil may need someone to talk to" — "{name} ({className}) asked the assistant something that suggests they may be struggling. Their words are not shared; please check in with them today."
2. Check in with the pupil that day. Nobody is told twice for the same pupil in a school day, and the pupil's words are never shown to anyone.
3. The office sets the "Helpline sentence" on the "Assistant" card of `/admin`; left blank, the national helpline is named.

Your own "Assistant" at `/assistant` answers questions about using the platform, naming the page and the steps; the tutor for school subjects is for pupils and teachers. A conversation is deleted thirty days after it was last used.

## How do I read my decisions and the school's trends?

"Decisions" at `/principal/decisions` is your own log: "What you have decided, newest first: leave, PEN changes, record changes, certificates, joins and admissions. Each line is written as the decision is made and cannot be edited." Filter by "Kind" and "Month". The office reads this log and cannot change it.

"Trends" at `/principal/trends` reads each term as numbers, worked out afresh every time you open the page.

1. Choose "How far back" ("Last {count} years").
2. "Term by term" gives "Attendance", "Exam average", "Over the pass line", "Fees collected" and "Incidents"; "By subject" the mean of every marked paper per term; "By teacher" credits papers to whoever the timetable has teaching that class and subject, else the class's lead teacher; "The same grade, two years" sets this year's grade against last year's.

Nothing here ranks anyone. "Past years" at `/archive` opens a closed year as the head saw it; the current year lives on the ordinary pages.

## Who is waiting to join, and who reads what?

"Waiting to join" at `/joins` shows "Pupils asking to join" by the school's or a class's code and "Guardians asking to be linked" ("{claimant} asks to be linked to {child}"); the entry is in the menu only while somebody waits. The head reads both lists and may make a claimant a child's guardian or decline with "A sentence for them (optional)"; a pupil's join is let in by the office or a teacher of the class the code named. Nobody here can see anything of the school until they are let in.

"Messages" at `/remarks` holds every conversation between staff, pupils and families; "New message" writes to anyone at the school. "Social Media" at `/bulletin` is the feed, where "Share something" posts to everyone you choose; "Student council" at `/bulletin/council` shows the council's members and notices. "Vacancies" at `/admin/vacancies` lists the school's postings and the enquiries each drew; "Enquiries" at `/enquiries` the conversations about admission and vacancies, which the head may answer and close. "Competitions" at `/competitions` are open to pupils across every school. "Sessions" at `/admin/sessions` lists every session the pupils asked for or booked, with the switch "Let our teachers offer free one-to-one guidance to our pupils". "Account" at `/account` holds your own settings; "My payslips" (`/account/payslips`), "My letters" (`/account/letters`) and "Things issued to me" (`/account/items`) are your own, where the school has those modules on.

## What do I read in the modules?

Each of these is in the menu only when the school has that module on.

1. "Attendance devices" at `/admin/attendance-devices`: the readers, their badges and "Last punches" with "What became of it". The office registers devices.
2. "Transport" at `/admin/transport`: "Trips today" with "{boarded} of {riders} on board", "Buses on the road" on the map, "Missed starts", the routes, buses, drivers and seats. "Open trip" shows a trip's stops and roster.
3. "HR and payroll" at `/admin/payroll`: "You read the summary and the runs' totals. A run's payslips appear here once the office shares them." The office may "Share the payslips with the head" on a run.
4. "Inventory and assets" at `/admin/inventory`: "You can read the stores and the register here; the school office makes the entries."
5. "Library" at `/library`: the desk's counts ("Overdue", "Ready to collect", "Waiting in the queue", "Fines due"), the catalogue and the reports.
6. "Hostel" at `/admin/hostel`: "Boarders", "Out on leave", "Absent at roll call", "Visitors today" and the houses' beds; "Open the hostel pages" for the warden's pages. A proposal to end a boarder's place at `/hostel/expulsions` is decided by the principal alone: "Approve" or "Refuse" with "Note (optional)"; an approval ends the place on the day and tells the student and the family.

The head does not lend books, mark roll calls or record stock; those are the librarian's, the warden's and the office's.

## What do I see at a college?

At a college the head's home is "The college" at `/principal/college`: "Waiting for your word", "The college at a glance · {date}", "Today's lectures by department", "The ten cheapest metrics to move", "Results and outcomes", "Faculty", "Governance", "Placements and alumni", "Money" and "The accreditation file".

1. "Waiting for your word" lists what the regulations leave to the principal, each with "Decide" to its own page; "Nothing waits for you today." otherwise.
2. "The college at a glance · {date}" shows "Faculty present" ("{n} of {total}", with those on leave, absent and not marked), "Fees received, {year}", "Scholarships disbursed", "Hostel occupancy", "Open grievances" ("{overdue} past the fifteen working days"), "Open incidents", the "NAAC predictor" ("{distance} short of {grade}") and the "NIRF estimate". "The platform's estimate from the college's own rows. It does not score for NAAC."
3. "Today's lectures by department" gives each "Department" its lectures, "Marked" and "Present". "Results and outcomes" shows the exam cell's published results for the term ("Passed", "Open backlogs", "Toppers") with "Analytics". "Faculty" gives students per faculty member against the norm, the term's load and the research items. "Governance" lists the committees and when each last met, with "Decision log" and "Committees and minutes". "Money" gives three years of "Fees demanded", "Fees received", "Scholarships", "Salaries" and "Purchases", with "Accounts". "The accreditation file" offers "Sign off".

Every figure is one of the other pages' own numbers, computed on read; no payment is made in the app.

## How do I decide academic and money matters at a college?

Each decision is made on its own page and written to the decision log at `/principal/decisions`; "Waiting for your word" on "The college" links each one.

1. A late registration: "Academics" at `/admin/academics/registration`, under "Late registrations", "Approve" or "Refuse" the office's ask ("Term", "Open until", "Reason").
2. A condonation the head of department forwarded: `/admin/academics/condonations`, each with "Attendance {percent} · the department's floor {floor}%"; "Approve" or "Refuse". Below the department's floor the decision is always the principal's.
3. A concession above the office's limit: "Concessions" at `/accounts/concessions` under "Waiting for the principal", with the student, what it is "Worth", the "Reason" and who it was "Sanctioned by"; "Approve" or "Refuse". It is not applied until approved.
4. A refund outside the slab on a cancelled seat: "Refunds outside the slab" at `/admin/college-admissions/refunds` (each row "{amount} asked; the slab gives {slab} · {name} · {date}"), "Approve" or "Refuse" with "Note (optional)". An approval becomes the refund the college pays from its own account.
5. A seat beyond the limits: on an application at `/admin/college-admissions/{applicationId}`, under "A seat beyond the limits", give the "Reason for the supernumerary seat" and press "Approve as supernumerary"; the register carries the reason.
The office prepares each ask and reads your answer on the same page.

## How do I decide a hostel expulsion, grace marks or a grievance at a college?

These three are the principal's alone; the warden, the exam cell and the office bring them.

1. A hostel expulsion: `/hostel/expulsions`, "Approve" or "Refuse" the warden's or the office's proposal with its reason, the incident it rests on and the day it takes effect.
2. Grace marks: "Exam cell" at `/exam-cell` under "Grace proposals waiting" ("{marks} grace marks for {student} in {course}"), "Approve" or "Refuse". "The exam cell proposes; you decide. Approved grace becomes the mark's next version."

3. A student grievance at `/iqac/grievances` is the office's and the principal's to "Acknowledge", "Resolve" or "Send to the Ombudsperson" within its fifteen working days.

Ragging and harassment complaints are read by the office and the head alone. Faculty leave is decided on "Staff leave" at `/principal/leave` as at a school; the head of department arranges the cover.

## How do I sign off the accreditation file at a college?

"Accreditation file" at `/principal/accreditation` holds "The IQAC's predictor to read and its NAAC documents to sign off or return with a note." Only when the college has the IQAC module on.

1. Read the "Predicted CGPA" and "Band" ("{distance} below {grade}, which starts at {min}."), the "Grievances" count and "Actionable insights": "How to move to the next band: the cheapest steps first, each with the page where it is made and who makes it." "NAAC predictor" opens the IQAC's full predictor.
2. Under "Waiting for your sign-off" press "Download" to read a document the IQAC sent.
3. Write "Your note (it goes into the AQAR; a return needs one)" and press "Sign off", or "Return with a note".

The IQAC generates each filing from the live records at `/iqac/documents`, sends the NAAC ones to you with "Send to the principal", and marks them filed on the portal after your sign-off. The platform's NAAC and NIRF figures read as provisional until the IQAC coordinator signs the benchmark list.

## What else does a college head read?

These pages are in the college head's menu to read; the office or the module's role writes them.

1. "Academics" at `/admin/academics`: the departments and their heads, programmes, schemes and courses, terms, rooms and divisions, students' seats, "Offerings and load", the "Weekly timetable", attendance against each programme's rule and the day's "Lectures to cover on {date}".
2. "Accounts" at `/accounts`: "Collection against demand", "Defaulters", "Scholarship receivable by age", "Income and expense" and "The auditor's schedules"; "Fee structures", "Scholarships", "No-dues" and "A student's account".
3. "College admissions" at `/admin/college-admissions`: the rounds, "Vacancies after {round}", the applications and the "Admission register".
4. "Exam cell" at `/exam-cell`: the sessions, their forms, seating, marks and results, and "Results analytics".
5. "Placement" at `/placement`: "Final year", "Placed", "Median salary", "Placement index" and the drives.
6. "Committees and minutes" at `/admin/committees`, "Faculty records" at `/admin/faculty-records` ("{students} students to {fullTime} full-time teachers", each teacher's designation, appointment, qualification and API score), and "Stream records" at `/admin/stream-records` (lab batches, the practical record, moot courts, teaching practice, NSS and NCC).

"Staff" at `/principal/staff` and the appraisal pages cover a college's faculty and heads of department as they do a school's teachers.
