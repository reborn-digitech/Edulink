Roles: TEACHER

# The teacher's guide (school)

This guide is for a teacher at a school on Shalaghar: a class teacher who marks attendance and builds report cards, or a subject teacher who sets work, enters exam marks and plans lessons. You start at `/teacher`, the "Today" page. The bottom bar on a phone and the rail on a desk carry your five daily pages: "Today", "Attendance", "Classes", "Assignments" and "Exams". The "More" menu groups the rest: "Day to day" holds "Timetable", "Messages", "Practice", "Meetings" and "Assistant"; "Running things" holds "Leave", "Staff attendance", "Incidents", "Signatures", "Write questions", "Me", "My appraisal", "Waiting to join", "My payslips", "My letters" and "Things issued to me"; "School life" holds "Social Media", "Experts", "Vacancies", "Enquiries", "Mentoring", "Guidance", "Competitions", "Past years" and "Library". A page behind a module ("My payslips", "Things issued to me", "Library", "Assistant") is only in the menu while the school has that module on. The command palette offers the quick actions "Mark the attendance", "New assignment", "Message a parent", "Apply for leave", "I'm in", "Enter exam marks" and "Report cards".

## How do I start my day?

Open `/teacher`. The "Today" page shows the date and the school's name, then "Your lessons": today's teaching period by period, with a "Covering" chip on a lesson you are taking for somebody else, and "Open the timetable" for the week. Above the lessons, "Marks to enter" lists papers already sat that are not fully marked ("Open the marks grid"), and "Covering today" lists lessons the office has asked you to take. If you are a class teacher, three tiles follow: "Attendance left" (how many of your classes are still unmarked), "Classes" (with the number of students) and "To grade" (hand-ins waiting; tap it to open the assignments list narrowed to "To mark"). Under them, "Attendance" lists each class with "Done" or "Take it", and "Coming up" lists work due soon with "See all".

1. Read "Your lessons" for the day's periods and rooms.
2. Tap a class marked "Take it" to open its attendance.
3. Tap "To grade" when the tile is not zero.

On a Sunday or a holiday the page says no school is held and offers no attendance to take. A teacher with no class and no lesson sees "No classes assigned yet" with a way to the "Social Media" feed; ask the office to add you to a class.

## How do I mark today's attendance?

Open `/teacher/attendance` ("Attendance" in the bar, or the floating "Mark the attendance" button on "Today" and "Classes"). The page lists only the classes you are down to mark today; with one class it opens the roll straight away.

1. Pick the class. Chips at the top switch between "Yesterday", "Today" and "Not marked yet".
2. Press "Mark all {count} present" to fill the common case in one tap; a toast offers to undo.
3. Change any pupil with the four buttons on their row: "Present", "Late", "Absent" or "Excused".
4. Tap the note icon beside a name to write a "Note for {name}" and press "Save note". Only staff and that student's guardians can read it.
5. Use "Find a student…" to jump to a name in a long roll.

Every tap saves itself; the pill at the top reads "Saving", "Saved", "Attendance complete" or, offline, "Saved on this device" and "{count} waiting to sync" until the connection returns. A line under a name such as "Absent — Illness, told by the family" means the family sent an absence note before you marked. If a colleague marks the same roll, the page says "Updated by a colleague." On a closed day the page warns "The school is shut on {date}" and that everyone marked absent will be counted absent; a cover row says "You are covering this attendance until {date}." A future day is read-only. "This attendance is not yours today" means the office has not given you this class's register; ask an admin.

## How do I read back attendance already marked?

The "Past attendance" button on `/teacher/attendance` opens `/attendance/history`. It is not in the menu; it is reached from the register.

1. Choose the "Class" and the "Month", then press "Show".
2. Read the grid: one row per pupil, one column per session, a letter per mark ("P present · L late · A absent · E excused · blank not marked") and a "Rate" column.
3. Use the arrows beside the month to step back; the month cannot go past this one.

Only the class teacher of a class, an admin or the principal can read its attendance back; a teacher covering a class this week sees no "Past attendance" door. The CSV and Excel downloads on this page are the office's, not a teacher's.

## How do I record that I am in?

Open `/teacher/attendance/me` ("Staff attendance", or the "I'm in" quick action). The header says when the staff day starts, the grace minutes and "Late after {time}".

1. Under "Today", press "I'm in".
2. Read the toast: "Checked in. Have a good day." or "Checked in — after {time}, so it is marked late."

You can check in once a day; after that the card shows the mark and the time. On a closed day it says "The school is closed today; there is nothing to check in to." Below, the month's tiles count "In" (the percentage), "Present", "Late", "Half", "Absent" and "Leave", and the list shows each marked day with who recorded it ("the office", "a check-in" or "approved leave"). "Previous month" and "Next month" move the view; approved leave shows itself without a check-in.

## How do I see my timetable?

Open `/timetable` ("Timetable" under "Day to day"). It shows your lessons for a real week, with "Previous", "This week" and "Next" to move. Cover you are taking on shows here too, marked as somebody else's lesson, and a lesson whose teacher is away says so. A free slot reads "Free". If the office has not set the school day up, the page says "No timetable yet"; if you have no lessons on the grid, "Nothing timetabled for you". The office builds the timetable; a teacher reads it.

## How do I take or decline a cover?

When the office asks you to take a lesson for a colleague, it appears on `/teacher` under "Covering today" with the period, the subject, the class and "Covering for {name}".

1. Press "I’ll take it" to accept; the toast says "Noted — the lesson is yours." and the row shows "Taken".
2. Press "I can’t" to decline, write "Why you cannot take it" (a clash, a duty, leave) and press "Tell the office".

A decline tells the office and the head, and the lesson shows as uncovered on their board again; the row shows "Declined" with "You said: {reason}". Either answer can be changed until the office reassigns the lesson. A cover that includes a class's attendance lets you mark it on `/teacher/attendance` for the days named.

## How do I see my classes and open one?

Open `/teacher/classes` ("Classes"). Each class card shows the number of students, the subject, the room, how many pieces of work are set, and "Attendance done" or "Attendance to do" for today. Tap a class to open `/teacher/classes/{classId}`.

1. Use the header button "Mark the attendance" (or "Edit today's attendance" once taken).
2. Read the four tiles: "Attendance today", "To mark", "Attendance concern" (pupils below 90% in 28 days; tap it to filter the roll) and "No guardian" (tap it to list the children nobody receives notifications for).
3. Use the row of buttons for "Report cards", "Enter exam marks", "Syllabus" and "Analytics".
4. Under "Class join code", press "Copy" to copy the code pupils type at the join page, or "Show poster" then "Print it" for a classroom card. There is no QR code; pupils type the code.
5. In "Who is in this class", each name opens the pupil's page; a chip reads "Allergy", "Condition", "Medicine" or "{count} open" (an open incident). The first-aid icon records an incident for that pupil; the chat icon opens "Message {name}’s guardians".
6. "Recent work" lists the last five assignments with "Set work" to add one.

A class you do not teach, or one in another school, is not found.

## How do I set work for a class?

Open `/teacher/assignments/new` ("New assignment" from the "Assignments" page, the quick action, or "Set work" on a class page).

1. Choose the "Class".
2. Give the work a "Title" and, optionally, "Instructions" (students see this with the task) and "Handouts" (up to 5 files, 5 MB each, PDF or an image).
3. Pick a "Category" (Homework, Classwork, Quiz, Test, Project or Reading) and "Points available"; leave points blank for unmarked work.
4. Set the "Due date" and "Due time" (defaults to the end of the school day). A due date already past asks you to tick "This due date has passed; set the work anyway".
5. Press "Publish to {count} students" to set it now, "Publish and set another" to keep the class and category and start a fresh sheet, or "Save as draft".

Publishing tells every student in the class and their guardians ("{count} students and their guardians were told."). A draft is seen by nobody until you open it and press "Publish now" on the bar that reads "This is still a draft." The "Assignments" list at `/teacher/assignments` shows this year's work by default with an "All years" tab, a "Show" filter ("To mark", "Past due", "Draft") and a "Class" filter, and each row says "{graded} of {roster} marked".

## How do I mark work that was handed in?

Open the assignment from `/teacher/assignments` or from the "To grade" tile. The page shows the title, the class, the points and the due time, the instructions, "Files for the class" and the gradebook.

1. Read the four tiles: "Students", "Handed in", "Marked" and "Class average".
2. For each row, type the mark in the box ("Mark for {name}"); the percentage badge updates as you type. A row reads "Handed in", "Handed in late" or "Not handed in".
3. Tap the pictures icon ("See {name}'s work") to read the words and photographs the pupil handed in.
4. Tap the note icon to add a comment ("The student and their guardians see this.").
5. Press "Save marks" on the bar that counts your unsaved changes.

Marks are saved as one batch; the toast says "Marks saved: {count}" and students and guardians are told about new marks only. A mark more than twice the points is refused as a typo ("Check those marks"). The buttons "Export gradebook (CSV)" and "Export gradebook (Excel)" download the class's whole gradebook: every assignment, the marks and whether the work came in.

## How do I decide whether the assistant gives pupils the answer to an assignment?

On the assignment's page (`/teacher/assignments/{assignmentId}`), under the instructions, the card "The assistant and this assignment" explains the rule: when a pupil asks the assistant a question that matches this assignment, it gives a hint first (the idea, the chapter and a guiding question), never the answer.

1. Tick or untick "Give the worked answer when the same question is asked a second time".
2. Wait for the toast "The assistant's rule for this assignment is saved."

Ticked (the default), the same question asked again in the same conversation gets the worked answer; unticked, it stays a hint. Only a teacher of the assignment's class can change this; the office reading the page is not offered the switch.

## How do I set how much each kind of work counts?

On a class page (`/teacher/classes/{classId}`), the card "Grade weights" decides how much each kind of work counts towards the overall mark.

1. Type a category name (for example "Homework") and its weight in percent; press "Add a category" for more.
2. Watch the running total: "Total {percent}%" turns green at 100%, or says "— must be 100%".
3. Press "Save weights".

Saving with no categories turns weighting off and the overall mark goes back to a straight points total. A category with nothing marked in it yet is left out and the rest are scaled up to fill 100%. A warning names work filed under a category that is not in the list. Exam marks join a weighted overall only through a category named "Exam"; the "Exams" page tells you when that weight is missing.

## How do I enter exam marks?

Open `/teacher/exams` ("Exams", or the quick action "Enter exam marks"). The page has two tabs: "Enter marks" and "Report cards" (which opens `/exams?tab=cards` and lists your classes).

1. Pick the class chip, then the paper chip ("{series} · {subject} · {date}"). Papers appear once the office sets up the grade's exam series.
2. Type each pupil's marks in the box beside their name; the paper's maximum is shown ("This paper is out of {max}. Halves are fine.").
3. Leave a box empty for a child who did not sit the paper: an absence is not a zero.
4. Press "Save marks". The page says "Marks saved."

To work from a spreadsheet, press "Download marks sheet (Excel)", type into its last column, then "Fill from Excel": the boxes are filled and a line reports "{filled} of {total} boxes filled from the sheet. Check them, then save." Nothing is saved by the upload itself. Offline, a saved sheet waits on the device and sends when you are back online. "Export marks (CSV)" and "Export marks (Excel)" download the whole exam for the class: every paper, the total and the grade. Saved marks flow straight into the pupils' grades pages and the report-card builder.

## How do I build and publish report cards?

Open `/teacher/classes/{classId}/report-cards` ("Report cards" on the class page, the quick action "Report cards", or the "Report cards" tab of "Exams"). The builder has three steps.

1. "1. What goes on the card": choose "Build from a term" (pick the "Term"; its papers, title and attendance window are set for you), "Build the annual card" (every term of the year, combined by the terms' shares) or "Pick the papers yourself" (tick exams or single papers; an unmarked paper is flagged "unmarked").
2. "2. Generate the drafts": check "What this report is called" and press "Generate for the class". The toast says "{count} drafts ready".
3. Review each card: "Preview" opens it; the box "A sentence for the family…" saves the class teacher's remark when you leave it; under "Co-scholastic", pick a grade per area on the school's scale, add a "Note" and press "Save".
4. Press "Publish all {count}".

Publishing sends the cards to pupils and families ("{count} report cards sent out"). "Withdraw all" takes a published set back to draft. "Download every card as one PDF" prints the set. Regenerating keeps the co-scholastic grades and leaves published cards alone. Homework and classwork marks never go on a card; only the scheduled exams do.

## How do I sign report cards, and how do I set my signature?

Open `/teacher/signatures` ("Signatures"). The page shows your signature as it is drawn on the report cards of the classes you teach.

1. Under "Papers waiting for your signature", press "Open the paper" to read a set, then "Sign" or "Decline". One signature signs every card of a set ("{count} report cards").
2. Under "Your signature", sign inside the box with a mouse, a finger or a pen, or press "Upload a picture" (a PNG or a JPEG; the white paper is taken out). Press "Clear" to start again and "Save the signature" to keep it.
3. Press "Remove" to take your signature away; papers already signed keep their own copy.

A paper waits for you only when its template asks for the class teacher's signature. You will be told "{count} report cards of {className}, {title}, wait for your signature". A teacher has no seal to set; only a school admin sets the seal.

## How do I track the syllabus and plan lessons?

Open `/teacher/classes/{classId}/syllabus` ("Syllabus" on the class page). Pick a subject chip; the tiles show "Where we are" (the percentage covered) and "Chapters" (done of total).

1. In "Chapters", move a chapter with "Not started", "In progress" or "Mark done". The toast says "Progress saved." and the row records who moved it and when.
2. In "Lessons", under "Plan a lesson", set the "Day", the "Chapter" (or "Not a chapter" for a revision day), the "Topic", "Notes", "Homework set" and the "Status" ("Planned", "Taught" or "Skipped"); the button reads "Plan a lesson" or "Log a lesson taught".
3. On a lesson already listed, press "Taught", "Skipped" or "Back to planned". Marking a lesson taught moves its chapter to in progress.
4. Press "Keep as template" beside a lesson to keep its words for the whole staff. Under "Copy a template in", pick the "Template", a "Chapter" and a "Day" and press "Copy it in"; your own template can be removed with "Remove this template".

The office writes the grade's chapter list; "No syllabus for this subject yet" means it has not. The head sees how far each class has got against how far the year has gone.

## How do I read a class's numbers?

Open `/teacher/classes/{classId}/analytics` ("Analytics" on the class page). Choose the window ("This term" or "Last 30 days"). The tiles show "Attendance", "Exams", "Work handed in" and "Flagged". Below are "Attendance, week by week", "Exams" (the class average per exam and how many pupils fell in each quarter of the scale), "Hand-ins" ("Assignments", "Expected", "Handed in", "Late", "Missing") and "Pupils to look at", flagged by a threshold ("Attendance", "Marks falling", "Late work") in alphabetical order, never ranked. Everything is worked out afresh each time the page opens; nothing is stored.

## How do I record an incident or a sick-room visit?

From a pupil's row on the class page (the first-aid icon) or from their page, open `/incidents/new?student={id}` ("Record an incident for {name}").

1. Choose "What kind": "Injury", "Illness or sick room", "Behaviour", "Safeguarding concern" or "Other".
2. Choose "How serious" ("Minor", "Moderate", "Serious") and "When" (now, or an earlier time; never the future).
3. Fill "Where", "In one line" (what a parent should read first), "What happened" and "What was done".
4. Leave "Tell the family now" ticked unless the head will raise it in person, then press "Record it".

The record is never edited afterwards; follow-up goes in notes. The toast says "Recorded. The family has been told." or "Recorded. The family has not been told." The page moves to the record at `/incidents/{incidentId}`, where "Add a note" keeps the follow-up while the incident is open; closing it ("Close the incident") is the office's or the head's. `/teacher/incidents` ("Incidents") lists the incidents of the pupils in your classes under "Open", "Closed" and "All", with "Family told {when}" or "Family not told by the app" on each row.

## How do I read a pupil's health card?

Tap a pupil's name anywhere (the class roll, the register history, a flagged list) to open their page at `/people/{membershipId}`. For a pupil you teach, the "Health card" card shows the blood group, "Allergies", "Conditions", "Medicines", "Diet", "Teachers should know", the "Family doctor" and "Who to call", with "Print the card" for a copy and "Check-ups" below. The office or a guardian fills the card in; a teacher reads it here and cannot edit it. The same page lists the pupil's incidents ("On {name}'s file") with "Record an incident", their class and class teacher, and their badges. No marks, attendance or contact details live on this page.

## How do I message a pupil's guardians?

Open `/remarks/new` ("Message a parent", or the chat icon on a pupil's row). The form is one conversation per pupil, with them and their guardians.

1. Under "Which student?", use "Find a student…" and pick the name. A child with "No guardian" is flagged before you write.
2. Give a "Subject" (chips suggest common ones) and write the "Message".
3. Press "Send".

The toast says "Message sent" and "Their guardians are notified." The thread opens at `/remarks/{threadId}`. `/remarks` ("Messages") lists two kinds of room: "Conversations" (people writing to people, started with "New message" from the people list) and "About a pupil"; a filter shows unread only.

## How do I offer meeting times to families?

Open `/teacher/meetings` ("Meetings"). Under "Offer times", a run of back-to-back slots is one form.

1. Set the "Day", "From" (a time), "Minutes each", "How many" and, optionally, "Where".
2. Press "Offer these times".

"Your upcoming slots" lists each slot as "Still open" or "Booked" with "Booked for {child} by {parent}" and the family's note. Only families of children you actually teach can book. Press "Cancel" on a slot to take it back; the family is told straight away, and a booking tells you.

## How do I apply for leave?

Open `/teacher/leave` ("Leave", or the quick action "Apply for leave"). The card "Leave this year" shows your entitlement and days used.

1. Press "Apply for leave".
2. Set "First day away" and "Last day away" and choose the "Kind of leave": "Casual leave", "Sick leave", "Unpaid leave" or "Other".
3. Write "Why". The principal reads this; it is not shown to other staff and never to students or parents.
4. Optionally pick "Who could cover your classes (optional)"; it is a suggestion, and the principal may name somebody else.
5. Press "Send to the principal".

Each request lists with "waiting", "approved" or "declined" and the decision note. Press "Withdraw this request" (the cross) on a waiting or approved request; the cover it caused is released. If the school has no active principal, the office answers and the buttons read "Send to the office". Approved leave covers your attendance duties automatically.

## How do I set practice and see where the class stands?

Open `/teacher/practice` ("Practice"). Pick the class chip. The tiles count "pupils practiced this week", "questions answered", "level badges earned" and "questions missed". "Worth re-teaching" names chapters where several pupils are stuck at a level; "Where the class stands" shows how many pupils stand on each rung of each chapter. Counts, never rankings.

1. Under "Set a chapter", choose the "Chapter" and the "Target rung" (L1 to L6), add a "Note (optional)" and a "Due date (optional)".
2. Press "Set practice".

"Chapters you set" shows "{reached} of {total} reached" per chapter with each pupil's rung, and "Remove" takes a chapter down. There is nothing to mark; the ladder checks every answer itself.

## How do I print a worksheet?

Press "Worksheets" on the practice page to open `/teacher/worksheets`. Pick the "Chapter", the "Target rung" and the number of "Questions" (1 to 30), then press "Build the worksheet". The paper opens at `/teacher/worksheets/print` with a name and date line; the "Answer key" prints on its own sheet. The same link always prints the same paper; "Reshuffle" makes a fresh one. The questions come from the practice bank.

## How do I offer free guidance to pupils?

Open `/teacher/guidance` ("Guidance"). Only when the office has switched on teachers' guidance; otherwise the page says "Your school has not switched on teachers' guidance. Ask the office." A teacher's guidance is always free and always a one-to-one of thirty minutes with a pupil of your own school.

1. Under "Offer a time", say "What it is about", set "Starts" and give a "Meeting link" (an https link to your own room).
2. Press "Offer it".

"Your times" lists each time with "{taken} of {seats} seats taken" and the pupil's name and purpose once a seat is asked for; a pupil's seat waits for a guardian. After the time has begun, press "Held" or "Did not come" for each seat. "Cancel this time" with a "Reason" gives every seat back and tells each family.

## How do I write practice questions for the bank?

Writing questions for the practice bank is not offered to teachers at present: the bank's new questions are read and accepted by the platform's content team, and the "Write questions" page is not in the menu. If the company still owes you for questions it took earlier, your home page says how much under "Money owed for your questions"; open `/teacher/payee` ("Where you are paid") to check the "UPI id" and "Name on the account" it will pay, and press "Save" if they have changed. The company pays by UPI after each month ends.

## How do I let in a pupil who typed my class code?

Open `/joins` ("Waiting to join"; it appears in the menu only while somebody waits). Under "Pupils asking to join", each row names the person, "By the class's code" or "By the school's code", the class and their age.

1. Press "Let in" to admit them; the toast says "They are in".
2. Or press "Decline", write "A sentence for them (optional)" and press "Decline" again.

Nobody waiting can see anything of the school until they are let in. A teacher decides joins by the codes of the classes they teach; guardians' claims are the office's.

## How do I post on Social Media and review pupils' posts?

Open `/bulletin` ("Social Media"). Press "New post" to open `/bulletin/new`: choose "Who sees it" ("One class" or "Whole school"), a "Title", "What do you want to say?", "Photos & videos", "Tags", the "Category" and "Who is it for?" ("Everyone", "Parents and guardians", "Students" or "Staff"), then press "Post it". A staff post publishes straight away to everyone you choose. Tick "Ask for a “seen and understood”" to see who has not acknowledged a notice. The "To review" tab lists pupils' posts and held comments waiting for a teacher: open a post and press "Publish it", or "Send back" with a note under "Why not? The student will see this." "Global feed" opens posts every school shares.

## How do I book an expert or set up mentoring?

Open `/experts` ("Experts") to browse "Available experts" with their headline, specialisms and open times; press "Book" on a time and confirm the topic. "Your bookings" lists live bookings with their conversation. Open `/mentoring` ("Mentoring") to pair a pupil with a mentor: press "Set up mentoring", choose the "Pupil" and the "Mentor", say "What is the mentoring for?" and press "Ask the guardian". A guardian is asked first; nobody can send a message until they agree, and every message can be read by the guardians and the school. A pupil's own request for a mentor is decided by the office, not by a teacher.

## How do I use vacancies, enquiries and competitions?

`/vacancies` ("Vacancies") lists teaching posts at schools across the platform; open one to read it and send an enquiry to the hiring contact the school named. `/enquiries` ("Enquiries") lists the conversations you opened and the ones addressed to your school, with "Open" and "Closed" filters. `/competitions` ("Competitions") lists competitions "From your school" and "For every school"; pupils enter them, a guardian consents, and staff record results from the entries list.

## How do I look at a past year?

Open `/archive` ("Past years"). Pick a year from the shelf. A teacher's view shows "Your classes", "Attendance" (registers taken), "Assignments" and "Report cards" as totals, then a table per class. A closed year never changes again; the current year lives on the ordinary pages.

## How do I keep my profile, and read my appraisal?

Open `/teacher/profile` ("Me"). Press "Change my look" to pick an avatar, set the name you are called and a line about you, and press "Save". "Your staff record" shows what the office keeps on file (staff number, designation, qualification, joining date, leave days); only the office changes it. "Leave this year" shows your balance. "Teaching subjects" were chosen when you joined; ask the office for changes. "Ratings" shows averages from review rounds; individual answers are never shown to anyone. Open `/teacher/appraisals` ("My appraisal") to read the observations, targets and appraisals the head has marked visible to you, newest first.

## Where are my payslips, letters and the things issued to me?

`/account/payslips` ("My payslips"; only when the school has the Payroll module on) lists each locked month with "Payslip (PDF)", a "Yearly statement", "Your salary" (the structure you are paid on) and "Advances": enter an "Amount" and "What for" and press "Ask for an advance"; one ask waits at a time. `/account/letters` ("My letters") lists the appointment letters the office issued to you, each with "PDF". `/account/items` ("Things issued to me"; only when the school has the Inventory module on) lists what the stores gave you and the assets you look after; under "Ask the stores", pick an "Item" or "Something else (say what)", a "Quantity" and a "Note", and press "Send the ask"; "Take back" withdraws a waiting ask.

## How do I use the library?

Open `/teacher/library` ("Library"; only when the school has the Library module on). The page shows "On loan" (with due dates), "Reservations" (your place in each queue, with "Leave the queue"), "Fines" (a staff fine is paid at the school office; Shalaghar never takes the money) and "The catalogue". Search by title, author, subject or ISBN and press "Reserve" to join a title's queue; the desk lends and takes back. "Returned lately" lists what you brought back.

## How do I ask the assistant?

Press "Ask the assistant" on any page to open the panel, or open `/assistant` ("Assistant"; only while the school has the Assistant module on). For a teacher it answers two kinds of question: how to use Shalaghar (which page to open and the steps to take there), and topics from the textbooks, naming the book, the chapter and the page it read. A teacher's topic questions are not limited to their own subjects or classes. It also answers questions about your own records from the pages you already see (which registers are still to be marked, your leave balance, comments waiting for review, unread messages), counting from the platform's own figures, and under "Sources" it links the post, the circular or the message thread it read; it gives counts and class names, never a list of pupils.

1. Type in "Your question" and press "Ask" (Enter sends; Shift+Enter is a new line). Do not type names, phone numbers or anyone's details.
2. Read the answer and its "Sources"; a book citation opens the publisher's copy in a new tab.
3. Answer "Was this helpful?" with "Yes" or "No".

A conversation remembers what was said in that conversation only. It is not a general chatbot; anything else gets one sentence saying what it is for. Each conversation is deleted thirty days after it was last used; "Delete this conversation" removes one sooner. "New conversation" starts afresh, and "All conversations" lists the last thirty days.
