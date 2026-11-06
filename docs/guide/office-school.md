Roles: ADMIN

# The office's guide (school)

This guide is for the school office: the people who sign in with the Admin role. You start at `/admin`, the "Overview". The menu's first five entries ("Overview", "People", "Classes", "Timetable", "Exams") are the ones you open most; the rest sit under "More" in three groups: "Day to day" (your messages), "School life" (the feed, the student council, experts, vacancies, enquiries, mentoring, sessions, past years) and "Running things" (everything else the office runs). A page that belongs to a module is in the menu only while the school has that module switched on at `/admin/settings/modules`. The command palette offers the same pages and a few quick actions: "Invite a teacher", "Admit pupils from a list", "Create a class", "Build the timetable", "Schedule an exam", "Review leave requests" and "School branding". The floating "Invite people" button is on "People" and "Classes". This guide follows a school year: setting up, every day, every term, records and papers, the year's end, the modules, and the pages shared with everyone.

## How do I finish setting up the school?

The "Overview" at `/admin` carries a "Finish setting up" card with the checklist ("Setup progress", "{done} of {total} done — you can come back to this any time.") until everything on it is done, then says "Your school is fully set up".

1. Open `/admin`. The header shows the "School code" with "Copy code"; people can join with it.
2. Work through the checklist's links: "Set up the year", "Create a class first", "Invite your first teacher".
3. Read the other cards every morning: "Attendance marked" ("{done} of {total} today"), "Exams & report cards", "Lessons without a teacher" (with "Post a vacancy" and "Open the timetable"), "Overnight housekeeping" and the "Vidura" card.

The welcome message is dismissed with "Dismiss welcome message". When a term or the year has run its course the overview offers "Finish {name}" and "Update the calendar".

## How do I set the school's details, logo and colour?

"School settings" at `/admin/settings` holds the "Details", "Logo", "Modules", "Whose posts to show", "Teaching week", "Pupils' own eyes", "School directory" and "Notification housekeeping" cards, and "This month's usage".

1. Under "Details" fill "School name", "Accent colour" (or keep "Role colours"), "Contact email", "Phone", "Website", "Address", "Town or city", "Postcode", "Country", "Region or state", "Lowest grade", "Highest grade" and "Timezone", then "Save".
2. Under "Logo" press "Choose an image", adjust "Zoom", "Move sideways" and "Move up and down", then "Save this logo". Square works best; it is cropped to 512×512. "Remove" takes it off.
3. Under "Teaching week" tick the days the school teaches and press "Save the week". Registers, staff attendance, leave and the timetable follow it; the page tells you how many timetable lessons now sit on a day the school does not teach.
4. Under "Pupils' own eyes" set "Pupils may read their own health card and incidents from age" and "Save"; blank means pupils never read them.
5. Under "Notification housekeeping" set "Mark unread as read after (days)" and "Remove read notices after (days)".

The school code shown on this page cannot be changed. The "School branding" quick action opens this page.

## How do I switch a module on or off?

Modules live at `/admin/settings/modules`, reached by "Open modules" on "School settings". Transport, library, hostel, inventory, payroll and alumni are the school's modules; a module that adds a role says so ("Adds the {role} role.").

1. Open `/admin/settings/modules`.
2. Press "Switch {module} on" or "Switch {module} off" on the module's row. The row shows "On since {date}" or "Off".

Switching a module off hides its pages from every menu until it is on again. "Whose posts to show" at `/admin/settings/feed` chooses, under "Show posts from", whether the global feed shows schools, colleges or both; press "Save".

## How do I set up the academic year and its terms?

The "School calendar" at `/admin/calendar` holds the "Academic year", the "Terms" and the days the school is shut.

1. Under "Academic year" press "Start the academic year" (later "Add next year"), fill "Year name" (for example 2026–27), "Starts" and "Ends", then "Add this year". The first year becomes the current one; a later one shows "Waiting" until you move into it.
2. Under "Terms" fill "Term name", "Starts" and "Ends" and press "Add". Terms may not overlap. A term is closed with "Mark finished" and reopened with "Reopen".
3. Under "Add to the calendar" fill "What is it", "Kind", "Starts", tick "It lasts more than a day" to set "Ends", add a "Note", and press "Add to calendar". The kind "Competition — the school is open; pupils may enrol" adds a competition the school runs: "One line about it", "Enrolment closes" (the event's last day when left empty), "Lowest year" and "Highest year", "Pupils may enrol" (off, the event is on every agenda for information only), "Internal board" ("No internal board", "Board for staff only", "Board for the whole school") and "A pupil's own enrolment waits for a guardian's yes". The competition and its calendar entry are made together; the entry's line shows "Enrol by {date}", the board and how many pupils are taking part, with "Open the competition" for its page, where entries and results are recorded. "Edit" changes both; "Remove" takes it off the calendar and keeps the competition, withdrawn, when pupils had entered. Only a holiday warns teachers off marking attendance.
4. The list under "This school's calendar" shows "Coming up" or the "Whole year", with "Edit {name}" and "Remove {name}" on each entry; "Staff away" shows approved leave and "Birthdays" the staff birthdays.

Exams report into a term and report cards are built from one; a school that reports once a year needs no terms. Fees and trends need the academic year set here.

## How do I create a class?

Classes are made at `/admin/classes/new` ("Create a class", also the "Create a class" quick action) and listed at `/admin/classes`.

1. Fill "Class name" (whatever the school calls it), "Subject" if the class is for one subject, "Grade or year" (or "Not tied to a grade"), "Section (optional)", "Room" and "Colour".
2. Choose a "Class teacher"; only assigned teachers can mark this class's attendance.
3. Press "Create class". The page shows the class's join code with "Copy class code", then "Create another" or "Done".

On `/admin/classes` each row's menu offers "Copy join code", "New join code" (the old one stops working), "Archive class" and "Restore class". The "No class teacher" filter finds classes nobody leads; until a teacher is assigned the office stands in as guardian for consent. "Move the school up a year" at the top is the year-end promotion.

## How do I put teachers and pupils on a class?

Open a class from `/admin/classes` to its staffing page at `/admin/classes/{classId}`.

1. Under "Who marks the attendance" press "Add a teacher", choose somebody, choose "As" "Class teacher", "Subject teacher — with attendance" or "Subject teacher — no attendance", then "Assign". Each row has "Attendance duty for {name}" ("Marks the attendance" or "Does not") and "Take {name} off this class".
2. Press "Arrange cover" when a teacher is away: choose "Who is covering", "First day", "Last day" and "Why (optional)". Cover from approved leave appears by itself; "Cancel cover for {name}" removes it.
3. Under "Who is in this class" press "Add students", search by name, tick pupils and press "Add {count} to the class". "Take {name} off this class" removes one pupil, keeping everything they did.

The page warns "This class has no class teacher. Nobody is down to write its report cards." and "Nobody but an admin can mark this attendance." when that is so. "Report cards" and "Enter exam marks" open the class's builder and marks grid.

## How do I build the timetable?

The "Timetable" at `/admin/timetable` ("Build the timetable" quick action) has "The school day", shared by every class, and "A class's week".

1. Under "The school day" press "Start from a typical day" for a suggested set of periods, or "Add one period" with "Name", "Starts", "Ends" (24-hour time) and "Kind", then "Add". "Edit" changes a period, "Retire" removes it keeping its lessons, "Bring back" restores it.
2. Choose a class under "Choose a class" and press "Open". Click a slot to set the lesson: "Subject", "Teacher" (the list says who is "Free at this time" and who is "Already teaching then") and "Room", then "Save". "Remove" clears a slot.
3. "Copy day" copies one day's lessons onto another ("Pick a day", "Onto").
4. "Copy this week to sister sections" copies the subjects and periods onto the "Sections" you tick, with "Copy the week" and "Confirm". Teachers are left blank for you to fill.
5. "Import a timetable from a sheet": paste or upload a sheet with the columns day, period, class, subject, teacher, room, press "Check the sheet", then "Write {count} lessons".

A lesson with no teacher shows as unstaffed to the class and is counted on the overview under "Lessons without a teacher".

## How do I invite teachers, pupils and parents?

Invitations are sent from `/admin/invites/new` ("Invite people", the floating button, and the "Invite a teacher" quick action) and listed at `/admin/invites`, the "Invites" tab of "People".

1. Choose "Invite them as", and for pupils an "Add to class" ("Assign to class" is optional; they can join later with the class code).
2. Paste "Emails" one per line, or "Upload CSV or Excel" (a header row is optional, files up to 2 MB).
3. The page says "{count} ready to invite" and "{count} need a look"; press "Send {count} invitations".
4. On `/admin/invites` filter by "Role" and "Link" ("Expired links"); each row offers "Resend" (the previous link stops working) and "Withdraw".

Anyone can instead join with the school code or a class code; they then wait on `/joins`. A parent is linked to a pupil from the pupil's row on "People" with "Link a parent…": fill "Parent's email", "Their name (optional)" and "They are the child's…", then "Send the link". Nothing about the child is shared until the parent accepts.

## How do I admit pupils from a list?

"Admit pupils" at `/admin/intake` (the "Admit pupils from a list" quick action and the link on "People") takes the admission list in one go.

1. Press "Download Excel template" if you want the columns laid out. The columns, by header: name (required), date of birth (dd/mm/yyyy), class, guardian email, guardian name, relation, pupil email. A pen column takes the eleven-digit UDISE+ PEN.
2. Paste the "Admission list" or "Upload CSV or Excel". The page reads the columns it recognised and says "{count} ready to admit", "{count} with a guardian to invite", "{count} without a date of birth", "{count} without a class" and "{count} need a look" ("No class by that name").
3. Press "Admit {count} pupils".
4. Press "Download this list": it carries each pupil's "Student code", "Sign-in handle" and "Sign-in code", and the codes are shown only here.

Parents get a link to accept; the guardianship exists when they do. A pupil with no email signs in at /first-signin with the handle and code and chooses a password. A row with a PEN and date of birth of a pupil already known on Shalaghar transfers that pupil in ("Transferred in"), once the server's operator has checked your school.

## How do I look after the directory?

"People" at `/admin/people` lists everyone, with "Search the directory", "Filter by class", "Sort by", the tabs "In the school", "Paused ({count})", "Left ({count})" and "Everyone", and "Export CSV" and "Export Excel".

1. Open a row's menu ("Actions for {name}").
2. For staff: "Staff record…" ("Staff number", "Designation", "Qualification", "Joined the school on", "Joined service on", "Date of birth", "Leave days a year", and the UDISE+ fields "Gender", "Social category", "Highest academic qualification", "Highest professional qualification", "Nature of appointment", "Subject appointed for"), "Subjects…" and, at a college, "Duties".
3. For pupils: "Date of birth…" (a parent links with the student code and this date), "Legal name…" (the name certificates, report cards and filings print; choose "Why it is being corrected"), "Issue sign-in code" (a one-time code shown once: "Write this down now — it is not shown again."), "Link a parent…", "Issue a certificate", "Record as left" and "Remove".
4. For anyone but yourself: "Pause access" with "Why (kept in the audit log)", later "Restore".

"Remove" is only for a pupil who was never really here; it is refused once attendance, marks, hand-ins or report cards exist, and the page says to use "Record as left" instead. The staff record's joining date is the one an appointment letter quotes. A member of staff can read their own record; only the office changes it.

## How do I read the attendance and tell a family?

"Attendance insights" at `/admin/attendance` reads the registers for the child, not the day; the registers themselves are marked by the class teachers.

1. "Eight weeks of the whole school" shows days attended as a share of days marked, week by week.
2. "Worth a conversation" lists pupils with low attendance or a run of absences, sorted by "Lowest attendance first", "Longest run of absences first" or "By name", over a "Window" of the "Last 30 days", "Last 60 days" or "Last 90 days". Press "Tell the family" on a pupil to send their family a notice.
3. "Compliance exports": choose "Class" and "Month" and press "Download attendance (CSV)" or "Download attendance (Excel)"; "Download enrolment summary (CSV)" or "Download enrolment summary (Excel)" gives the annual return's enrolment table.
4. "Past attendance" at `/attendance/history` shows one class's month ("Class", "Month", "Show") with "Download this month as CSV" or "Download this month as Excel".

A pupil with "No guardian linked" cannot be told. The office may also mark a class's attendance itself from the teacher's pages when nobody else can.

## How do I keep the staff register?

"Staff attendance" at `/admin/staff-attendance` is the "Staff register" for a day and "The month, person by person".

1. Pick the "Day" ("Previous day", "Today", "Next day"). A closed day says "Closed: {name}".
2. Mark each person, or press "Mark everyone present", add a "Note" where needed, and press "Save the register". An approved leave shows itself as "On leave".
3. Press "Change the check-in time" to set "Staff day starts" and "Grace" (minutes), then "Save". A person who checks in on their own phone after the grace is late.
4. The month table ("Present", "Late", "Half", "Absent", "Leave", "Unmarked", "In") downloads with "Download the month (CSV)" or "Download the month (Excel)".

A person marked absent or on leave has their lessons listed on the substitutions board. A locked payroll month reads unpaid leave and absence from this register.

## How do I register an attendance device?

"Attendance devices" at `/admin/attendance-devices` holds biometric and RFID readers whose punches mark staff check-ins and pupils present.

1. Under "Register the device" fill "Name", "Where it stands", "Kind" ("Biometric", "RFID card", "Face", "Other") and "Whom it marks" ("Staff only", "Pupils only", "Staff and pupils"). The device's key is shown once.
2. Under "Badges" fill "Code" (the card's number or the reader's enrolment number; never a fingerprint and never Aadhaar) and "Person", then "Save the badge". "Remove" takes a badge away.
3. On a device's row use "New key" (the old key stops at once), "Disable" and "Enable".
4. "Last punches" lists each punch with "When", "Device" and "What became of it" ("Marked", "Already marked", "Unknown code", "School closed that day").

Nothing already marked is overwritten by a punch. Registering a device needs the server's sealing key to be set; the page says so otherwise.

## How do I cover the lessons of staff who are away?

"Substitutions" at `/admin/substitutions` is the "Board for {date}": every lesson of a teacher marked absent or on leave, who covers it, and who is free.

1. Pick the "Day" ("Previous day", "Today", "Next day"). "Nobody is away" means every lesson has its teacher.
2. On an "Uncovered" lesson press "Choose who covers": the list marks each colleague "Free", "Busy that period" and "Teaches {subject}" with their load ("{count} today"). Add a "Note for the substitute" and press "Assign".
3. "Change" picks somebody else; "Clear" uncovers the lesson again.
4. "Print the board" opens a printable board at `/admin/substitutions/print` with "Print or save as PDF".

The substitute is told and the board shows "Taken", "Declined" (with the reason) or "Not answered yet". A clash with a lesson the substitute already teaches is refused.

## How do I approve leave?

"Staff leave" at `/principal/leave` is in the office's menu too ("Review leave requests" quick action), because a school whose head is on leave still has leave to approve.

1. Open "Waiting for you ({count})"; "Already decided" holds the rest.
2. Each request shows the days, the balance ("{used} of {entitlement} used this year · {remaining} left" or "No entitlement on file · {used} days approved this year") and "Who covers their classes", with the person they suggested.
3. Choose "Cover, subject by subject" or leave "Nobody — arrange it later", then press "Approve and arrange cover" (or "Approve" when no cover is needed).
4. To refuse, press "Decline", write "Why (they will see this)" and press "Confirm decline".

Approved leave shows on the calendar under "Staff away", on the staff register as "On leave" and on the substitutions board. The "Staff" roster at `/principal/staff` lists everyone with the record the office keeps and their leave this year, with "Edit in the directory".

## How do I schedule exams?

"Exams" at `/admin/exams` ("Schedule an exam" quick action) holds one series per grade with a dated paper per subject.

1. Under "New exam series" fill "Name" (for example Term 1), "Grade", "Kind of exam" and "Term" (or "No term"), then "Create the series".
2. On the series press "Add a paper": "Subject", "Day", "Starts", "Ends", "Out of", and tick "Even if the school is closed that day (a Sunday or a holiday)" when it is. "Remove the {subject} paper" is refused once marks are saved against it.
3. Press "Publish" when the dates are settled: families and pupils then see the date sheet. A draft is seen by staff only.
4. Press "Archive" when the term closes.

Filter the list by "Exam kind", "Sheet" ("Draft", "Published") and grade. Teachers enter marks from their own pages; the office may enter them too from a class's "Enter exam marks" link.

## How do I set the report card rules?

"Report card rules" at `/admin/report-cards` say how every card is worked out and printed.

1. "Grading scale": "Start from a board's scale" or "Custom", then bands with "Grade", "From %", "Points" and "Descriptor"; "Add a band", "Remove". The page says "Every mark from 0 to 100 has a grade." or names a gap or an overlap.
2. "Co-scholastic areas": "Add an area" and "Add a grade" for the scale ("Grade", "Means").
3. "Weight of each kind of exam": "Unit tests", "Mid-term", "Final" in percent; all zero means marks over maximum.
4. "Each term's share of the annual card": in percent, or every term blank for equal shares.
5. "Printed layout": tick "Attendance", "Practice annexure", "Co-scholastic grades", "Grade points", "School address and contact", "Signature lines", "Class teacher's remark", "Tint the letterhead with the school colour"; set "Left signature" and "Right signature" ("Nobody; the line only", "The class teacher", "A school admin", "The principal"), "Print the school seal", "Line under the school's name (board, affiliation number)", "Footer line" and "Paper" ("A4" or "Letter").
6. Press "Save the rules". "Preview a card" draws a sample.

A card already issued keeps the rules it was built with. The cards are built class by class from the class's "Report cards" link: "Build from a term", "Build the annual card" or "Pick the papers yourself", "Generate for the class", then "Publish all {count}"; "Withdraw all" takes a published set back to draft, and "Download every card as one PDF" prints them.

## How do I write the syllabus?

"Syllabus" at `/admin/syllabus` holds the chapter list for each grade and subject, in teaching order.

1. Under "Choose a grade and a subject" pick "Grade" and "Subject" and press "Syllabus".
2. "Add a chapter" with its "Periods", or "Paste chapters, one per line" and press "Add" (a number after a tab or comma is its periods). "Move up", "Move down" and "Remove {title}" reorder the list.
3. Press "Save the list". Removing a chapter removes every class's progress on it.
4. "Syllabus coverage" at `/admin/syllabus/coverage` shows "Overall", "{percent}% of the year gone", "Behind" and each class's "Where we are" ("On track", "In progress", "Not started").

Every class of that grade ticks its way through the list from the teacher's pages, and the head sees how far each has got.

## How do I run a teacher review round?

"Teacher reviews" at `/admin/reviews` shows "Ratings" and "Review rounds".

1. Under "Open a new round" choose "Teachers to include" ("Everyone" or named ones), "Who is asked" ("Students", "Parents" or "Students and parents") and "Open until", then "Start a review round".
2. The people you chose find the questionnaire on their Feedback page; the round shows "{count} answers".
3. "Close now" ends a round before its date.

Answers are only ever shown aggregated; no respondent is traceable. The "Ratings" card shows each teacher's standing as the answers come in, and the head reads the same page and may open a round too.

## How do I set up fee heads and structures?

"Fees" at `/admin/fees` shows "Asked for", "Collected", "Outstanding", "Overdue", "Pupils on a plan", "Pupils without a plan", "UPI payments to confirm", "By grade", "How old the outstanding is", "This month, by method" and "Recent payments". The academic year must be set on the calendar first.

1. "Fee heads" at `/admin/fees/heads`: "Add a head" with "Name", "Code", "Kind" and "Order"; "Retire" keeps a head on every structure that already uses it.
2. "Fee structures" at `/admin/fees/structures`, "New structure": "Name", "Grade" (or "Every grade"), between one and twelve instalments each with "Label", "Due on" and lines ("Head", "Amount (₹)"); "Add a line", "Add an instalment", "Save structure".
3. On the structure press "Publish"; its numbers are frozen from then on. Under "Put pupils on this structure" choose "Whole class" ("Choose a class") or named pupils and press "Assign". A pupil already paid on another structure is not moved. "Open to families" lets a guardian put their child on the plan themselves.
A pupil's plan and dues are read on their ledger under "Dues"; the structure page lists the pupils on it with "Due", "Paid", "Outstanding" and "Overdue".

## How do I set how families pay?

"How families pay" at `/admin/fees/settings` sets what the school tells families to pay to. Money goes to the school and only the school; Shalaghar holds none of it and takes no share.

1. Under "UPI id" fill "UPI id" and "Payee name"; parents' UPI apps open with this as payee and the amount filled in, and they type the UTR back for the office to confirm.
2. Under "Receipts" set the "Serial prefix" and "Bank details on receipts", printed at the foot of every receipt.
3. Under "Fees for pupils" set "Pupils may see their fee dues from age"; blank means pupils see no fees, and a pupil never sees a way to pay.
4. Under "Payment gateway" enter the school's own Razorpay "Key id", "Mode" ("Test" or "Live"), "Key secret" and "Webhook secret", then "Save keys". The secrets are sealed and never shown again; "Remove the gateway" stops online payment.

Online payment needs the server to allow it; the page says when it does not. UPI id and counter payments work either way.

## How do I take a payment or grant a concession?

"Dues" at `/admin/fees/dues` lists every pupil on a plan ("Everyone", "Something due", "Overdue", "Fully paid", by "Class"); open a pupil for their ledger at `/admin/fees/pupils/{studentMembershipId}`.

1. Under "Take a payment" fill "Amount (₹)", "How" ("Cash", "Cheque", "Bank transfer", "UPI"), "Reference" (cheque number, UTR or bank reference), "Taken on", "Note" and "For" ("Oldest due first" or an instalment), then "Record and issue receipt". The receipt is numbered and opens with "Receipt".
2. Under "Concessions" press "Grant a concession": "Kind" ("Percent" or "Amount per instalment (₹)"), "On" (a head or "Every head"), "Reason", then "Grant"; the open instalments are recalculated. "Revoke" takes it back.
3. On a payment, "Reverse" (with "Why is this being reversed?") keeps the row and its receipt on file; "Refund" records money paid back ("Amount to refund (₹)", "Why?"). Pay the family back first for a counter payment; an online payment is refunded through the gateway.
4. "Put on a structure" and "Take off the plan" (only while nothing is paid) change the pupil's plan.
A receipt is frozen as issued and the family reads it from their own pages.

## How do I confirm UPI claims, import a bank statement and export to Tally?

"UPI payments to confirm" at `/admin/fees/claims` lists the families who paid to the school's UPI id and gave a UTR; the fees overview links the other bulk tools.

1. Check each claim's "UTR" against the bank statement and press "Confirm" (a receipt is issued) or "Reject" with "Tell the family why". "Match a bank statement" pastes a "Statement CSV", "Match", then "Confirm {count} matched".
2. On "Dues", "Send reminders to everyone overdue" texts the overdue families.
3. On `/admin/fees`, "Download collections (CSV)", "Download collections (Excel)", "Download outstanding (CSV)" and "Download outstanding (Excel)" cut the registers between "From" and "To".
4. "Import a bank statement" matches pasted credits to pupils by UTR, cheque number or student code ("Check the statement", "Record the matched lines").
5. "Carry forward to the new year" ("From", "To", "Carry forward") turns every pupil's outstanding into an opening balance in the new one.

"Tally export" at `/admin/fees/tally` downloads "Receipts and refunds" between "From" and "To", and a locked payroll "Month", as "Tally XML" or "Day book (CSV)"; "Ledgers the vouchers name" lists the ledgers to create in Tally first.

## How do I text families?

"Texts & WhatsApp" at `/admin/messaging` reaches families who do not have the app. Every text is one of the fixed templates, sent on WhatsApp when the family allows it and by SMS otherwise.

1. Under "Channels" tick "Send SMS" and "Send WhatsApp", set the "Monthly cap (messages)", choose the "Automatic texts" (absence notices, fee reminders and so on) and press "Save". The "On this server" card says what the server still needs.
2. "Send a test to me" texts your own number past the caps, to prove the wiring.
3. Press "New notice" (`/admin/messaging/new`): fill "Label (for your records)", "The notice" (5 to 300 characters), "Who" ("Every guardian", "One class", "One grade", "Families with fees overdue") and "How" ("Text (WhatsApp or SMS)", "App notification"). Press "Check reach" to see "{count} guardians", by WhatsApp, by SMS and "{count} cannot be texted", then "Send now".
4. "Notices sent" lists every notice with "Sent", "Delivered", "Failed" and "Not sent"; open one for the report person by person and "Try the failed ones again".

"Text the guardian phone the office entered when the guardian has no proved number" sends absence notices, fee reminders and circulars to the number typed on a pupil's record; check the records before switching it on, since a wrong number texts a stranger about the child.

## How do I send a circular and chase acknowledgements?

A circular is a post on the feed that asks for a “seen and understood”. "Circulars" at `/admin/circulars` shows how far each got.

1. Press "Write a notice" (it opens `/bulletin/new`): fill "Title", choose "Category", "Who is it for?" ("Everyone", "Parents and guardians", "Students", "Staff") and "Which grade?", tick "Ask for a “seen and understood”", and press "Post it".
2. On `/admin/circulars` each notice shows "Told", "Opened" and "Acknowledged", class by class.
3. Press "Chase the rest" to remind the families not yet acknowledged; it works once a day.

Families are told on publish; a family that has switched texts off is reached in the app only.

## How do I record an incident or keep a health card?

The "Incident log" at `/admin/incidents` lists every incident of the school ("Open", "Closed", "All") with "When", "Pupil", "Class", "What kind", "How serious", "Family" ("Family told {when}" or "Family not told by the app") and "Follow-up".

1. Open a pupil's profile from "People" and press "Record an incident" (`/incidents/new`): "What kind", "How serious", "When", "Where", "In one line", "What happened", "What was done", and "Tell the family now" (on unless the head will raise it in person), then "Record it". What happened is never edited afterwards.
2. On the incident press "Add a note" for follow-up; "Close the incident" once follow-up is done, after which nothing more can be added.
3. On the same profile, the "Health card" has "Edit the card": "Blood group", "Allergies", "Conditions", "Medicines", "Diet", "Teachers should know", "Family doctor" and "Who to call" ("Add a person", up to three), then "Save the card". "Record a check-up" takes "Date", "Height (cm)", "Weight (kg)", "Sight" and "Notes". "Print the card" prints it.

A teacher of the class reads the card; the office and the head write it. A pupil old enough reads their own card and incidents only when "Pupils' own eyes" on "School settings" allows it.

## How do I keep pupil records complete?

"Pupil records" at `/admin/records` says which records are complete enough to issue a certificate or cut a filing ("Complete", "{count} missing", "Still blank: {fields}", "Still blank for the filing: {fields}").

1. Filter "All pupils", "Complete", "Only incomplete" or "Missing for the filing".
2. Press "Ask the families" to ask every incomplete pupil's family, or "Ask this family" on one row. They send the details from their phone.
3. Under "Changes families have asked for" read each change ("{field}: {from} → {to}") and press "Approve and update" or "Decline" with "A sentence for the family (optional)". A family cannot change a record itself.
4. "Edit the record" on a pupil (`/admin/records/{membershipId}`) corrects it yourself: the parents, the place of birth, "Category", "Religion", the admission register, the last school and the UDISE+ fields; "Save the record".
5. "Find a pupil by PEN": type the eleven digits and press "Find". The answer says the pupil is on the roll here, at another school on Shalaghar, has left one, or that nobody holds that PEN.

A PEN already on record is corrected under "Propose a correction to the PEN": fill "Corrected PEN" (or tick "Remove the number instead") and "Why", then "Send for approval". The principal and a guardian must both approve before it changes; "PEN corrections" lists where each stands, with "Withdraw". A pupil's "Identity card (PDF)" downloads from the record page, and "Give a new student code" is for a card that was lost or copied.

## How do I design a certificate template?

"Certificates" at `/admin/certificates` lists "Templates", with "Issue a certificate", "Issued certificates" and "Appointment letters". A template is designed once, in English, Hindi or Marathi.

1. Press "New template" (`/admin/certificates/new`). Choose "Start from" a preset: "Transfer certificate", "Leaving certificate (Nirgam Utara)", "Bonafide certificate", "Character certificate", "Study certificate", "Letter of appointment" or "Custom".
2. Fill "Template name", "Kind", "Language of the document" and "Serial prefix" (the serial is prefix, academic year and a number, such as TC/2026–27/0001), and tick "Offered when issuing".
3. Write the "Heading", "Opening paragraph" and "Closing paragraph", using "Insert a detail" to place a value filled from the pupil's record. Add "Rows" with "Label" and "Value" ("Choose the detail"), reorder with "Drag to move", "Move up", "Move down".
4. Under "Layout" tick "School logo", "School address", "Heading in the school colour", choose "Left signature" and "Right signature" ("Nobody; the line only", "A school admin", "The principal"), "Print the school seal", a "Footer line" and the "Paper", then "Save the template".

A detail the certificate cannot fill is refused and named. "Retire" takes a template off the issuing list; certificates issued from it stand. A certificate already issued keeps the wording it was issued with.

## How do I issue, revoke or decline a certificate?

"Issue a certificate" at `/admin/certificates/issue` fills a template from the pupil's record, numbers it and freezes it. Requests from families wait on the same page.

1. Under "Requests from families" the waiting requests come first. Press "Issue this" on one and the form above fills with the pupil, the kind's first template and the purpose, with "Choose another request" to go back; or press "Decline" and say "Why not" (the family reads the reason). While a request waits, "Fee (₹)" and "Set the fee" put a demand on the pupil's ledger, which the family pays on its Fees page or at the office; once a request is answered it folds away under "Answered requests" and its fee can no longer be changed.
2. Or choose a "Pupil" ("Find a pupil by name or code") and a "Template", add "Purpose" (for a bonafide or study certificate), "Remark" and "Date of leaving" (for a transfer certificate issued before the last day), and press "Issue".
3. The page warns that the record has nothing for some fields, with "Fill the record"; a blank prints as a dash. It also warns when your signature, another signer's or the seal is not on file.
4. "Issued certificates" at `/admin/certificates/issued` lists every paper ("Serial", "Heading", "Pupil", "Issued on") with "Open" and "Revoke" ("Why it is revoked"). A revoked paper stays on the list and the public check says so.

The family is told on issue and reads the paper from their own pages, with "Download PDF". The paper's line "Verify this certificate at {url} with code {code}." lets anyone check it.

## How do I add my signature and the school seal?

"Signatures and seal" at `/admin/signatures` holds "Your signature", the "School seal" and "Papers waiting for your signature".

1. Under "Your signature" sign inside the box ("Sign inside the box with a mouse, a finger or a pen.") or "Upload a picture" (a PNG or JPEG), then save; "Clear" and "Remove" undo it.
2. Under "School seal" upload the seal; a round or square picture on a white ground works best. Only a school admin sets the seal.
3. Under "Papers waiting for your signature" press "Open the paper" on a certificate or a set of report cards somebody else issued whose template asks for your signature, read it, then "Sign" or "Decline".

Your signature is drawn at once on a paper you issue, and on a paper somebody else issues only after you approve it. Papers already signed keep their own copy if you remove your signature later.

## How do I issue an appointment letter?

"Appointment letters" at `/admin/certificates/appointments` issues a letter to a member of staff from an APPOINTMENT template, filled from their staff record.

1. Make a template from the "Letter of appointment" preset on the templates page if "No appointment letter template yet" shows.
2. Check the member's staff record first: a detail it lacks prints as a dash.
3. Choose "Template", "Member of staff", "Purpose" and "Remark", then "Issue the letter".

"Letters issued" lists each letter; the member reads and prints it from "My letters" at `/account/letters`, where your own letters are too.

## How do I cut the UDISE+ and board sheets?

"Filings" at `/admin/filings` cuts the returns from what the app already holds. Nothing is uploaded from here: download a sheet and paste or check it on the portal.

1. Under "What the portals know the school as" fill "UDISE+ code", "Board", "Affiliation or index number", "Medium of instruction", "District", "Block" and "Management", then "Save".
2. "Ready to file" says "{ready} of {total} pupils have every UDISE+ field" and "{ready} of {total} teachers have every profile field", with "Pupil records", "Staff records" and "Ask the families".
3. Under "Sheets" download, as "CSV" or "Excel", the UDISE+ student sheet, the enrolment tables, the teacher profile, and per "Grade" the CBSE candidates or the Maharashtra board's pre-list.

Codes follow the UDISE+ bulk sheet; Aadhaar is always blank. Every download is recorded in the safety centre because each names children; only an admin can download them.

## How do I open an admission cycle?

"Admissions" at `/admin/admissions` opens a cycle for the year; every family that applies moves through "Applications".

1. Press "New cycle" (`/admin/admissions/new`): "Name", "Academic year", "Opens on", "Closes on", "Fee structure for admitted pupils", tick "Entrance test" if there is one, write the "Notice to families", add "Grades and seats" ("Grade", "Seats", "Add a grade") and "Documents asked for" ("Document", "Key", "Required"), then "Save the cycle".
2. Press "Open" on the cycle; it then shows on your page in the directory. "Close" ends it; "Edit" changes it.
3. With a test, open the cycle and under "Entrance-test sittings" fill "First sitting starts", "Minutes each", "How many in a row", "Children per sitting", "Where" and "Note for families", then "Publish sittings". "Cancel" releases and tells the families booked on one.
The school's directory profile is kept under "School directory" on "School settings": "About the school", "Admissions contact", "Save profile", "Publish to the directory" or "Remove from the directory".

## How do I move an application from form to seat?

"Applications" at `/admin/admissions/applications` is the pipeline: every application to the school, newest first, filtered by "Cycle", "Stage" and "Grade".

1. "Enter a walk-in" at `/admin/admissions/applications/new` enters a family that came with a paper form ("Cycle", "Grade applied for", "Child's name", "Date of birth", "Last school", "UDISE+ PEN (if the child has one)", "Applicant", "Relation to the child", "Phone", "Email"), then "Enter the application".
2. On an application: "Mark the documents checked"; "Record the result" ("Score", "Note"); "Offer the seat" with "Answer by", the fee structure and a "Note to the family"; or "Waitlist", "Decline the application", "Back to the pool".
3. Once accepted, "Admit to the roll" with "Class" and "Admission register number": it creates the pupil's account, links the applicant as guardian, starts the pupil record and puts the pupil on the fee structure. The "First sign-in code" is shown once.

After a cycle is closed, "Delete the forms not admitted" removes the applications and documents of families it did not admit; admitted children's applications stay.

## How do I record that a pupil has left, and issue the TC?

A departure is recorded from the pupil's row on "People" with "Record as left".

1. Fill "Why", "Conduct on the certificate" ("Excellent", "Good", "Satisfactory" or "Leave blank"), "Where they went" (optional), "Last day" and "A line for their next school" (optional, the family reads it), then "Record it".
2. A future "Last day" schedules it: the pupil keeps access through that day and comes off the roll the morning after ("Leaving on {date}"). "Cancel scheduled leaving" gives it up before it comes.
3. The leaving certificate is issued with the record; the row shows "Left {when}", "went to {where}" and "Open the certificate". The family is told and can read it.
4. "Undo leaving" puts a pupil recorded by mistake back on the roll and withdraws the certificate; add them to a class again from the class page.

A transfer certificate or Nirgam Utara on the school's own template is issued from `/admin/certificates/issue` as well. A pupil who moves to another school on Shalaghar is brought in there by their PEN and date of birth on that school's intake list, carrying their record and leaving certificate.

## How do I move the school up a year and close it?

"Move the school up a year" at `/admin/promotion` (linked from "Classes" and the calendar) moves every class at the year's end; closing the year is a separate step on the calendar.

1. For each class choose where it "Goes to": "Existing class", "New class" ("New class name", "Grade", "Section"), "Leaving the school (top grade)" or "Stays as it is".
2. "Hold back or sort pupils" ticks a pupil to "Hold back" or sends one elsewhere ("Where {name} goes").
3. Set "Leavers' last day" (written on each graduating pupil's certificate; empty means today), read the summary ("Moving up: {moving} · Leaving: {leaving} · Held back: {held} · New classes: {newClasses}"), press "Move the school up" and confirm with "Yes, move them up".
4. On `/admin/calendar` under "Academic year" press "End {name}", choose the year to "Move into" and confirm "Yes, close {name}". Every pupil's badges are written down, the year's exam series are archived and open review rounds closed; marks and cards stay as they are. "Reopen" brings the latest closed year back.

Nothing is deleted: last year's classes are archived with their registers and marks, and the closed year appears under "Past years" at `/archive` for everyone. This cannot be undone from the promotion screen.

## How do I run the transport module?

Only when the school has the Transport module on. "Transport" at `/admin/transport` has the tabs "Today", "Routes", "Buses", "Drivers", "Pupils" and "Settings".

1. "Routes": "New route" with "Route name", "Runs" ("Morning and evening", "Morning", "Evening"), "Note" and "Stops" in the morning's order ("Stop", "Latitude", "Longitude", "Geofence (metres)", "Morning time", "Evening time", "Add stop"), then "Save route". Name public places, never a pupil's home.
2. "Buses": "Add bus" with "Registration", "Seats" and "On the road", then "Save bus". "Roster file" downloads a bus's roster.
3. "Drivers": invite a driver from "People" with the Driver role, then "Put a bus on a route" with "Bus", "Route", "Driver", "Attendant" and "From"; "End" closes an assignment on its last day.
4. "Pupils": "Give pupils a seat": choose "Class", tick the riders, choose "Route", "Stop", "Picked up in the morning", "Set down in the evening" and the "Transport fee head", then "Give seats to {count}". "End seat" ends one.
5. "Settings": "Families see the driver's name and telephone" (off: families see the registration only).

"Today" shows "Buses on the road" on the map, "Trips today" with "{boarded} of {riders} on board", "Missed starts" (not started ten minutes after the first stop's time; the office is told once) and "Open trip" for a trip's stops, track and roster. The driver's phone is the bus's GPS and is not a certified tracking device.

## How do I set the library's rules?

Only when the school has the Library module on. The library desk at `/library` lends and takes books back; the office's rules are at `/admin/library`.

1. On "Library rules" set "Books a pupil may hold", "Days a pupil keeps a book", "Books a member of staff may hold", "Days a member of staff keeps a book", "Renewals allowed on one loan", "Fine for each day late, in rupees" (zero charges no fine) and "Fee head for pupils' fines", then "Save the rules".
2. At the desk (`/library`): "Scan or type a code" (an accession number, a library card or an ISBN) and "Find"; "Lend" to a person ("Find the person"), "Take it back", or "Take a book back" by accession number.

A pupil's fine becomes a due on their fee account under the chosen head; staff fines are paid at the office. The office may also settle a fine at its own counter.

## How do I set up a hostel?

Only when the school has the Hostel module on. "Hostel" at `/admin/hostel` is the office's glance: "Boarders", "Out on leave", "Absent at roll call", "Visitors today", "Beds", "On leave today", "Came back late this week" and "Today's visitors". The day's work is the warden's.

1. Press "Open the hostel pages" and go to "Rooms" (`/hostel/rooms`).
2. Under "A new hostel" fill "Name", "Who boards", "Places", "Warden in charge" and "Mark who eats at each meal", then "Save the hostel". Only the office makes a house.
3. Add rooms with "Room number", "Floor", "Beds" and "Kind of room", then "Add the room".
4. "Give a pupil a bed": "Pupil", "Bed", "From", then "Give the bed"; "Give up the bed" ends it with a "Last day".

The warden takes the roll call, decides leave, keeps the visitor book and proposes an expulsion; the office may correct a roll call and propose one too. A hostel fee is charged through the fees module.

## How do I run the stores and the asset register?

Only when the school has the Inventory module on. "Inventory and assets" at `/admin/inventory` has the tabs "Overview", "Items", "Movements", "Purchases", "Assets", "Asks", "Reports" and "Categories and vendors".

1. "Categories and vendors": "Add category" with "Name" and "Rate a year (%)"; "Add vendor" with "Name", "Phone", "GSTIN", "Address".
2. "Items": "Add or change an item" with "Code", "Name", "Category", "Unit", "Reorder at", "Kind", then "Save item".
3. "Purchases": "Record a bill" with "Vendor", "Date of the bill", "Invoice number", "Place", "Scan of the bill" and its "Lines"; a line that names an item brings that many into stock. Nothing here pays anyone.
4. "Movements": "Record a movement" ("Item", "Kind", "Quantity", "Place", "Issued to", "Room", "Department", "Reference"), and "Stock-take" ("Count this place", "Save the count for {location}"). Stock is never negative.
5. "Assets": "Add an asset" with "Tag number", "Name", "Category", "Vendor", "Bought on", "Cost", "Warranty until", "Place", "Custodian", "Condition", "Depreciation" and "Rate a year (%)". On an asset: "Change the custodian", "Move it", "Seen today", "Send for repair", "Back from repair", "Dispose of it" (final). "Print tags" prints QR tags.
6. "Asks": "Give it" (from a "Place") or "Decline" with "Why not".

"Reports" offers "Stock on hand", "Used month by month", "Assets by place", "Assets by custodian", and "Stock on hand (CSV)" and "Fixed-asset register (CSV)" (or Excel). Your own things are at "Things issued to me" (`/account/items`).

## How do I set up payroll?

Only when the school has the Payroll module on. "HR and payroll" at `/admin/payroll` has "Overview", "Salaries", "Structures", "Advances" and "Statutory settings". No money moves through the app: the bank file goes to your bank.

1. "Statutory settings": "Provident fund (PF)", "PF on the whole basic, past the wage ceiling", "Employees' State Insurance (ESI)", "Professional tax", "Employer's name on the payslip", "PF establishment code", "ESI employer code", then "Save". "The rates in force" are the published ones; your accountant should confirm them.
2. "Structures": "New structure" with "Name" and components ("What the slip calls it", "Worked out as", "Value"), then "Make the structure".
3. "Salaries": for each person "Structure", "From", "Basic a month", "PF UAN", "ESI number", "PAN", "Paid by", "Bank account number", "IFSC", "Bank", then "Save the salary". The PAN and account are sealed and shown by their last four.
A new "From" date on a salary is a revision; the earlier salary stays for the months before it.

## How do I run the month's payroll?

"Monthly runs" on `/admin/payroll` drafts a month from the staff register, approved leave and the salaries; unpaid leave and unexcused absence lose pay.

1. Choose "Month" and press "Draft this month". On the run (`/admin/payroll/runs/{month}`) open a slip to set "Arrears", "TDS this month", "Loss-of-pay days" and "Note on the slip" ("Save the slip"); "Draw again from the register" takes in today's register; tick "I have checked every slip" and press "Lock the run".
2. After locking, "Files for the portals and the bank" cuts the PF ECR, ESI, bank advice, PT and TDS files; "Share the payslips with the head" lets the principal read the slips.
3. "Advances": "Record an advance" ("Who", "Amount", "Taken back each month", "What for"), or answer a member's ask with "Record it" or "Decline".

Each person is told their slip is ready when the run locks and reads it at "My payslips" (`/account/payslips`), where yours are too, with "Ask for an advance". "Yearly statement" gives a person's earnings statement.

## How do I keep in touch with alumni?

Only when the school has the Alumni module on. "Alumni" at `/admin/alumni` lists pupils who left, by batch.

1. "Batches" shows "{count} alumni, {listed} in the directory"; "Open the alumni directory" opens the listed ones.
2. Under "The feed" choose what alumni may do on the school's feed and "Save". Their posts always wait for the office.
3. "Write to alumni": "Who" ("For every alumnus" or a batch), "Title", the note, then "Send". "Notes sent" shows "{count} reached".
4. Under "Every alumnus" search by name; on a person "Mark as mentor" or "Remove mentor", "Pause messages" with "Reason (they are told)" or "Restore messages".

A pupil recorded as left keeps a link to the school as an alumnus. At a college the page also records gifts and meets; see the college guide.

## Who switches Vidura on, and how do I read its usage?

Shalaghar's operator switches Vidura on for a school, under the student and teacher plans; the office does not, and the card says so: "Vidura is not switched here: the platform's operator switches it on for a school, under the student and teacher plans." While Vidura is on for the school, the "Vidura" card on `/admin` shows this month's use against the school's budget ("{used} of {budget} used this month ({percent}%)", with a bar) and the counts "Questions", "Answered with the fixed sentence", "Sent on the counsellor route", "People who asked", "Marked helpful" and "Marked not helpful". Counts only: no question and no answer is shown. While the operator has Vidura off for the whole platform, the card says "Vidura is switched off for the whole platform just now."

1. Fill the "Helpline sentence" shown to a pupil whose question is about hurting themselves; left blank, the national helpline is named.
2. Press "Save"; the toast reads "Vidura's settings are saved."

When a pupil's question suggests they may be struggling, the school's counsellor (a staff record whose designation names a counsellor), else the head, else the office is told who, never their words.

## How do I ask Vidura, and what will it answer?

Vidura is Shalaghar's assistant. Its one way in is the round button at the bottom right of every page, labelled "Ask Vidura" for screen readers; on a phone-width screen it sits above the bottom bar, and above the page's own round quick-action button where one is shown. The button is there only while Shalaghar's operator has Vidura switched on for the platform and for your school; the office does not switch it. There is no menu entry for Vidura, and opening `/assistant` takes you back to the page you came from with its drawer open.

Pressing the button opens Vidura's drawer. On a computer it docks at the right of the window and the page stays usable beside it, so you can follow the steps while you read them, and it stays open as you move between pages. On a phone it opens as a sheet from the bottom of the screen, and following a link from inside it closes it. Escape closes it, and so does "Close Vidura" (the cross).

For the office it answers questions about using the platform, naming the page and the steps; topic questions from the books are for pupils, teachers, faculty and heads of department. It is not a general chatbot: anything else gets one sentence saying what it is for. Vidura knows the page it opened beside: "How do I use this page?" or "how do I do this here?" is answered from that page's own help and your own figures shown there. Under "My records", or when Vidura picks it, it answers counts from the pages the office already sees (pupils enrolled, certificate requests waiting, fees overdue, applications in), from the platform's own figures, with class names and never a list of children, and under "Sources" it links the circular or the message thread it read.

1. Type in "Your question" and press "Ask". Do not type names, phone numbers or anyone's details. An empty conversation shows "What Vidura is for" and, under "Try asking", three questions for your role and the page you are on (on a page other than your home the first is "How do I use this page?"); pressing one asks it.
2. To send one question a particular way, choose under "Mode for your next question": "Vidura picks" (the default), "Using Shalaghar" (how the platform works, which page and which steps) or "My records" (your own figures, counts and links, read from the pages you already see). The pick sends only your next question that way, then Vidura picks again, and no pick gets past a refusal. Each answer wears a small label naming the mode it was answered in.
3. Answer "Was this helpful?" with "Yes" or "No".
4. "New conversation" starts afresh. "Your conversations" lists the conversations of the last thirty days inside the drawer: press one to re-read it and ask more in it, "Delete this conversation" removes one sooner, and "Back to the conversation" returns.

Answers are set out with headings, numbered steps, bold for what matters, and a small table when your own figures have several rows. A definition is short (about sixty words) and a how-to gives numbered steps (up to about 250 words). If an answer stops at its length limit it says "The answer stopped at its length limit." and "Go on" continues it; "Go on" counts as one of your questions for the day, and an answer can be continued at most twice. Each person has twenty questions a day, a conversation remembers what was said in it only, and each conversation is deleted thirty days after it was last used.

When Vidura cannot answer (its one sentence saying what it is for, a refusal, or an answer saying it is not sure), the answer shows "Vidura could not answer this; a person at your school can." and one button: "Ask the principal", which opens a message conversation with them. Nothing of your question is copied into the message; you write your own.

## How do I deal with reports and the audit log?

The "Safety centre" at `/admin/safety` has "To deal with", "Resolved" and "Audit log", and "When the Shalaghar team opened your school".

1. On a report read "What the reporter said" and open the content with "Open it" or "Open the post".
2. Press "Take it down" with "Why is it coming down? The author sees this.", or "Nothing wrong — close it" with "Why is this alright? Only staff see this." For a reported person, "Pause their access" or "Open in the directory".
3. "Audit log" has "Search the audit log" and "Sensitive only".

A pupil's post on the feed waits for a teacher's or the office's approval before it shows; held comments wait the same way.

## How do I let people in who joined with a code?

"Waiting to join" at `/joins` lists "Pupils asking to join" (by the school's or a class's code, with "Age {age}" or "No date of birth given") and "Guardians asking to be linked" ("{claimant} asks to be linked to {child}"). The entry shows in the menu only while somebody waits.

1. Press "Let in" on a pupil, or "Decline" with "A sentence for them (optional)".
2. On a guardian's claim, make them the child's guardian or decline. A guardian the child already has may decide too.

Nobody here can see anything of the school until you let them in.

## How do I write to people and read what the school posts?

"Messages" at `/remarks` holds every conversation between your staff, your pupils and their families. "New message" writes to anyone at the school or opens a thread about a pupil with the family in it.

"Social Media" at `/bulletin` is the school's feed: "Share something" posts to everyone you choose ("Who is it for?"), and "Share with every school" puts a post on the global feed. "Student council" at `/bulletin/council`: "Name the council" ("Council name"), list "Members" by student code with a role each, and post "A notice from the council" ("Title", "Notice", "For"); a member's notice waits for the office's review, the office's is live. "Experts" at `/experts` books time with a curated expert; "Mentoring" at `/mentoring` pairs a pupil with an expert ("Set up mentoring"), and a guardian must agree before it starts. "Sessions" at `/admin/sessions` lists every session your pupils asked for or booked, which the office may cancel, with the switch "Let our teachers offer free one-to-one guidance to our pupils". A competition the school runs is added on the "School calendar" (above) and reaches every pupil's and guardian's agenda, where they enrol; `/competitions` lists them and, while the operator has the competition marketplace on, the platform's competitions for every school. The office records entries' results from a competition's page. "Enquiries" at `/enquiries` are conversations with families and teachers who asked about admission or a vacancy; the school's side may close one.

## How do I post a vacancy?

"Your school’s postings" at `/admin/vacancies` lists what the school has put on the board and the enquiries each drew.

1. Press "Post a vacancy" (`/admin/vacancies/new`): "Title", "Description", "Subjects", "Position" and "Hiring contact" (an active admin, principal or teacher), then "Post a vacancy".
2. Every teacher on the platform sees it at `/vacancies`; enquiries land on the hiring contact at `/enquiries`.
3. "Close" takes it off the board; its enquiries stay answerable.

The overview's "Lessons without a teacher" card also offers "Post a vacancy".

## How do I read the school across years?

"Trends" at `/principal/trends` is in the office's menu too: each term as numbers, worked out afresh on every open.

1. Choose "How far back" ("Last {count} years").
2. Read "Term by term" ("Attendance", "Exam average", "Over the pass line", "Fees collected", "Incidents"), "By subject", "By teacher" and "The same grade, two years".

Nothing here ranks anyone. "Past years" at `/archive` opens a closed year as this role saw it: "Report cards", "Badges", "Exam series" and the classes with "Pupils on the roll".

## What does the office see at a college?

At a college the Admin is the registrar's office, and the menu adds "Academics", "College admissions", "Accounts", "Library, hostel and bus", "Exam cell", "Placement", "IQAC desk", "Committees and minutes", "Faculty records", "The college" and "Stream records", each behind the college's modules. Those pages are in the office's college guide, with the college profile and streams, invitations of faculty and their duties, and the college's certificates. The school's pages above stay as they are: the calendar, people, fees, filings, certificates, signatures and the modules work the same way at a college, with "Fees" standing beside the college's "Accounts".
