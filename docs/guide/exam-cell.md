Roles: EXAM_CONTROLLER

# The exam controller's guide (college)

This guide is for the controller of examinations at a college, whose home is `/exam-cell` ("Exam cell"). Every page here is behind the Exams module; while the college has it off the home says so and nothing else opens. An affiliated college's cell takes forms with eligibility and no-dues, issues hall tickets, seats the halls, assigns invigilation, enters the university's marks twice or imports its result file, computes results under the scheme, decides revaluations and backlogs and issues grade cards. An autonomous college does all that and conducts its own papers: question papers in a sealed store, printing lists, central assessment, degrees and the convocation. The menu's "Day to day" holds "Messages"; "Running things" holds "Account", "Leave", "Staff attendance", "My letters" and "Exam flying squad". The office and the principal read the cell's pages; only you write them, except where this guide says the principal decides. Fees are recorded as demands on each student's ledger and paid there; nothing is paid in the app.

## How is a session's life laid out?

Open `/exam-cell`. "Exam sessions" lists each session with its term, kind, "{forms} forms, {submitted} submitted, {approved} approved" and its status: "Draft", "Taking forms", "Sittings", "Assessment", "Published" or "Closed". A session moves forward in that order and never back. Press a session to open its tabs: "Forms", "Sittings", "Marks", "Results" and, at an autonomous college, "Conduct". The buttons "After results" and "Results analytics" at the top open the pages that stand outside any one session. When a grace proposal is waiting the home shows "Grace proposals waiting" with "The principal decides each proposal."

## How do I create a session?

Open `/exam-cell` and use "New session". If the college has no terms yet the card says "The college has no terms yet; the office adds them in academics first."

1. Give the "Name", choose the "Term" and the "Kind" ("Regular" or "Supplementary").
2. Choose the "Fee head for exam fees", or "None (no demand is raised)".
3. Set "Forms open" and "Forms close", "Fee per course (₹)", "Fee per backlog course (₹)", "Photocopy fee (₹)" and "Revaluation fee (₹)".
4. Set the late fee: "Late fee from" and "Late fee (₹)".
5. Press "Create session".

The session starts as a "Draft". While it is a draft or taking forms, "Change the session" on its Forms tab rewrites every field and "Save" keeps it; after that the window and fees are fixed.

## How do I put my signature on the papers I issue?

Open `/exam-cell`. "Your signature" says "No signature yet: papers you issue print a bare line until you add one." Choose "A PNG of your signature" and press "Save signature". It then reads "Your signature is on file: it is printed on the grade cards and transcripts you issue." The image is kept in the record, never as a link, and is drawn with the college's seal on every grade card, transcript and degree certificate issued after it; a hall ticket prints the "Controller of examinations" line. A new PNG replaces the old one for the papers issued from then on; papers already issued keep what they printed. Only the controller's own signature is used here; the office and the principal do not sign the cell's papers.

## How do I generate forms and open the window?

Open the session (its first tab is "Forms"). "The form window" reads "Opens {opens}, closes {closes}. {course} a course, {backlog} a backlog."

1. Press "Generate forms". Every registered student gets a draft form from their registrations and open backlogs; the message says "Forms written: {count}." Pressing it again writes nothing twice.
2. Press "Open the form window". The session becomes "Taking forms" and each student may submit from their own exams page.
3. "Forms" lists every form with its courses (a backlog marked "backlog"), "Not submitted", "Submitted", "Approved" or "Refused", its fee and "on the ledger: {status}".

A student's own submission is refused without attendance eligibility (from the term's eligibility list, condonations counted) or with a no-dues line open; the fee becomes a demand on their ledger when they submit. "Submit for the student" submits a draft form on their behalf while the window is open.

## How do I approve or refuse a form?

Open the session's "Forms" tab. Under a "Submitted" form that is not yet locked:

1. Write a "Reason" if you refuse, or if you waive the fee.
2. Tick "Waive the fee" when the college waives it; the reason is recorded against the form.
3. Press "Approve" or "Refuse".

An approved form is the student's seat in the session; its courses are what the marks sheets and results read. "Forms for the university" cuts the submitted and approved forms as a CSV on the export page: copy it or press "Download". Its headings are the university's and stay in English.

## How do I move the session on?

Open the session's "Forms" tab. One button offers the next step: "Open the form window" (a draft), "Lock forms and start sittings" (taking forms), "Move to assessment" (sittings), and once results are published, "Close the session". Locking the forms freezes every approved form (each is marked "Locked") and starts the sittings; nothing more can be submitted or decided. Each move says "The session has moved on." What each stage allows: forms are generated and the session rewritten only as a "Draft" or while "Taking forms"; marks are entered during "Sittings" and "Assessment" and before publication; a run is computed at any stage and publishing makes the session "Published"; "Close the session" is offered only after that. A closed session changes no more, though its after-results work (revaluations, backlogs, papers) goes on from "After results".

## How do I make the date sheet and the halls?

Open the session's "Sittings" tab. "Date sheet" says "Each paper with its halls. Seating is on alternate seats; two papers at one hour may share a hall."

1. Choose the "Course", the "When" (date and time) and the "Minutes", and press "Add paper". Adding a course already on the sheet moves it.
2. Each paper shows its time, length and "{count} sitting". Under it, add a hall with its "Hall" name and "Seats" (at least two) and press "Add hall".
3. Press "Seat this paper" to seat it on alternate seats, or "Seat every paper" under "Hall tickets and seating" for all at once. A paper that does not fit says "{count} did not fit: add a hall."
4. "Seating" opens the paper's plan hall by hall: "Seat {n}" with the student and hall-ticket number, and "{count} without a seat: add a hall" if any.
5. "Attendance sheet" on a hall is the hall's sheet for its paper as a PDF, with seat, name, answer-book number and a signature column.

The papers are also what the exam flying squad sees on its desk.

## How do I issue hall tickets?

Open the session's "Sittings" tab. "Hall tickets and seating" says "{count} approved forms have no hall ticket yet." Press "Issue hall tickets": every approved form without a ticket gets one, numbered, with the photo and a QR to the public check, and the message says "{count} hall tickets issued." The student (and a minor's guardian) opens the PDF from their own exams page; the form on the Forms tab shows the ticket number. Seat first or after; the ticket carries the seats that are built.

## How do I assign and swap invigilation?

Open the session's "Sittings" tab. Under "Invigilation":

1. Choose the "Hall" (shown as paper and hall) and the "Member of staff", and press "Assign duty".
2. To swap, choose the "Duty", the "Swap to" member, write the "Reason" and press "Swap".
3. On the date sheet each hall shows its invigilators as "Assigned", "Swapped" or "Done"; press "Done" beside one after the paper.

The member of staff sees the duty on their "Exam duties" page. Remuneration for invigilation is recorded separately below.

## How do I record a case of unfair means and the committee's decision?

Open the session's "Sittings" tab, "Unfair means".

1. Choose the "Paper" and the "Student" (any student sitting the session), write "What happened" and press "Record a case".
2. When the committee has met, choose the "Committee's decision" ("No action", "Warning", "Paper cancelled", "Whole session cancelled" or "Debarred from the next session"), write the committee's "Note" and press "Record".

The decision is recorded once and cannot be changed. The flying squad's desk lists each case as "Waiting for the committee" or "Decided", without the note.

## How do I record remuneration?

Open the session's "Sittings" tab, "Remuneration": "A record of what is owed; the college pays it outside the app." Choose the "Member of staff", "For" ("Paper setter", "Moderator", "Invigilator" or "Assessor"), "How many" and the "Rate (₹)", and press "Save". The line reads "{count} × {rate} = {amount} ({duties} duties on record)", the last figure being the duties the session holds for that person, so a count that differs from it is yours to explain. The member of staff sees the same line on their "Exam duties" page under "Remuneration", with the same words: "A record of what is owed; the college pays it outside the app." No money moves and nothing reaches payroll; it is a record for the college's own accounts.

## How do I enter marks, or import the university's result file?

Open the session's "Marks" tab. "Marks by course" shows each course of the approved forms with "{matched} of {expected} agreed, {mismatched} disagree"; press a course to open its sheet. The sheet's heading says "External out of {external}; internal out of {internal}, from the HOD's lock. Type AB for absent."

1. Each row shows the student, the "Internal" marks (from the HOD's lock; "(university's)" when they came from the file instead), "Entry one", "Entry two" and the standing "External" mark with its version, or "Waiting" or "Entries differ".
2. Type each mark in "Your entry" ("marks or AB") and press "Save my entry". A mark stands only when two people's entries agree; the office may make the second entry. The message says "Saved: {matched} agree, {mismatched} differ, {pending} wait for a second entry."
3. Or paste the university's file under "The university's result file": "Paste the CSV with a header row naming PRN, SEAT_NO, COURSE_CODE, INTERNAL and EXTERNAL; AB is absent. Rows that match nobody are listed." Press "Import". The message counts "{created} written, {updated} rewritten, {unchanged} unchanged, {unmatched} not written."

Entries are taken while the session is in sittings or assessment and before publication. The file is reconciled student by student by PRN or seat number; a row whose student was entered twice by hand is refused with "These marks were entered twice by hand; correct them there."

## How do I propose grace marks or record the moderation committee's note?

Open the session's "Marks" tab with a course chosen.

1. Under "Grace" ("Under the scheme's rule, with the principal's approval."), choose the "Student", the "Marks" (half marks allowed, up to twenty), the "Rule" ("To pass the course" or "To reach the next class") and the "Reason"; press "Propose". The line reads "Waiting for the principal" until the principal approves or refuses it on the exam cell's home; approved grace becomes the mark's next version.
2. Under "Moderation committee", write the committee's "Note" and press "Record". It is kept against the chosen course, or the "Whole session" when none is chosen.

## How do I compute and publish the results?

Open the session's "Results" tab. "Result runs" says "Each run is kept. Publishing one supersedes the one before; a change after publication is a new run."

1. Press "Compute results". The run is computed under each programme's scheme from the locked internal marks and the agreed external marks; the message says "Results computed. Students: {count}."
2. Press "Run {number}" to read it: each student's card lists every course with credits, internal, external, total, grade and "Pass", "Fail", "ATKT" or "Absent", then the SGPA, credits earned and class.
3. The run's line summarises "{students} students: {passed} passed, {atkt} ATKT, {failed} failed ({rate}%)".
4. Press "Publish". The students are told; the session becomes "Published"; backlogs open for each failed course and the term's credits wait for the Academic Bank.
5. "Results for the university" cuts the run as a CSV on the export page.

After publication a new run needs "Why a new run", and a run that changes a published result is the principal's to publish: beside it the page says "This run corrects a published result: the principal publishes it." The placement cell reads the published CGPA; the IQAC's predictor counts the passes.

## How do I correct a published mark?

Open the session's "Marks" tab with the course chosen; after publication the card "Correct a published mark" appears: "A new version with your reason; then compute a new run." Choose the "Student", type the new "External" mark, write the "Reason" and press "Correct". The message says "Corrected as a new version; compute a new run." Then compute the run on the Results tab, and the principal publishes it. A revaluation that changes marks does the same; the Results tab warns "Revaluations that changed marks and wait for a corrected run: {count}."

## How do I conduct the college's own papers (autonomous)?

Only at an autonomous college; elsewhere the "Conduct" tab says "The university conducts this college's exams; question papers, printing and central assessment are its own." Open the session's "Conduct" tab.

1. "Question papers" says "Kept sealed. Opening one is logged and audited." Choose the "Paper" (a course on the date sheet) and the "Setter" (a faculty member or HOD) and press "Appoint". The setter uploads and seals the paper from their "Exam duties" page; it then reads "Sealed" with "sealed {date}".
2. Press "Open the sealed paper" to open the PDF; every opening is counted ("opened {count} times") and audited. Write the "Moderation note" and press "Mark moderated"; a moderated paper can no longer be replaced by its setter.
3. Under "Printing lists", set "Spare per hall" and press "Draw printing lists": each hall's line reads "{seated} seated + {spare} spare = {count} to print".
4. Under "Central assessment", choose the "Paper", the "Assessor", a "Bundle" name and "How many" answer books, and press "Allot". When the bundle comes back press "Returned".

The assessor sees the bundle on their "Exam duties" page as "with you" until it is returned.

## How do I decide a photocopy or revaluation request?

Open `/exam-cell/after` ("After results"). "Photocopies and revaluations" lists each request with the student, course, kind ("Photocopy" or "Revaluation"), session, "asked {date}", the fee and "on the ledger: {status}". The student asks from their own exams page while the revaluation window is open, and the fee goes on their ledger.

1. Choose the "Outcome": "Photocopy given" for a photocopy; "Marks unchanged" or "Marks changed" for a revaluation.
2. For a change, type the "New external marks".
3. Write a "Note" if needed and press "Decide".

A changed mark is a new version; the request then reads "The marks changed: compute a corrected run." with "Open the session's results", and after the run "A corrected run is computed: the principal publishes it." The student's result shows "Under correction" until the corrected run is published.

## How do I follow backlogs?

Open `/exam-cell/after`. "Backlogs" says "A failed course may be sat again for seven years from the first failure." Each line shows the student, the course, "{count} attempts", "may be sat until {date}" and "Open", "Cleared" or "Past the limit". A backlog opens when a result publishes a fail, is added to the student's next form from their own exams page ("Add backlog {course}") or by the form generation, and clears when a later run passes it. Nothing is typed here.

## How do I issue a grade card, transcript or degree certificate?

Open `/exam-cell/after`. "Grade cards and transcripts" says "Numbered, signed with your signature and the seal, each with a code anyone can check."

1. Choose the "Student" and the "Paper": "Grade card", "Transcript" or, at an autonomous college, "Degree certificate".
2. Press "Issue".

The paper is listed with its serial, kind, student and date; press the serial for the PDF. The student opens it from their own exams page. Each paper carries a QR and a check code: anyone can confirm it at `/certificates/exam` ("Check an exam paper"), which says whether a grade card, transcript, degree certificate or hall ticket is real, from which college and when, never whose.

## How do I send credits to the Academic Bank, or draw the convocation list?

Open `/exam-cell/after`. "Academic Bank of Credits" lists each student's term credits as "Waiting to be sent", "Sent" or "Not sent". When the bank is connected the card says "Sending is a test stand-in: rows are marked sent with a made-up reference. The real Academic Bank is not connected." and offers "Send waiting credits"; otherwise "The Academic Bank is not connected yet: credits wait here until it is." At an autonomous college, "Convocation" draws the year's graduates: type the "Year", tick "Final list" to finalise, and press "Draw the list". Each year reads "{count} graduates" and "Draft" or "Final".

## How do I read the pass rates and the first-year index?

Open `/exam-cell/analytics` ("Results analytics"): "Pass rates from published results only." Choose a term from the row of terms. "First year" reads "{appeared} appeared · mean SGPA {mean} · index {api} · passed without a backlog {rate}%", NBA's academic performance index being the mean SGPA times the share who passed. "By course", "By faculty" and "By division" list "{passed} of {appeared} passed" with the rate; "Over sessions" gives each published session's rate. Until a result is published each reads "No published results yet."

## How do I read the flying squad's desk?

Open `/duties/exam-squad` ("Exam flying squad"). You read what the squad's members log: "Papers" from two days ago to sixty days ahead with their halls and visit counts, "The squad's visits" newest first, each "All in order" or "Something found" with its note, and "Cases of unfair means" as you entered them. A visit that found something tells the exam controllers. Only a faculty member or HOD holding the squad duty logs a visit; the office gives that duty. "No paper is being sat" offers "Exam cell" to schedule the papers.

## How do I use Vidura, and manage my own account?

Vidura is Shalaghar's assistant. Its one way in is the round button at the bottom right of every page, labelled "Ask Vidura" for screen readers; on a phone-width screen it sits above the bottom bar, and above the page's own round quick-action button where one is shown. The button is there only while Shalaghar's operator has Vidura switched on for the platform and for your college; the office does not switch it. There is no menu entry for Vidura, and opening `/assistant` takes you back to the page you came from with its drawer open.

Pressing the button opens Vidura's drawer. On a computer it docks at the right of the window and the page stays usable beside it, so you can follow the steps while you read them, and it stays open as you move between pages. On a phone it opens as a sheet from the bottom of the screen, and following a link from inside it closes it. Escape closes it, and so does "Close Vidura" (the cross).

For you it answers how to use Shalaghar, which page to open and the steps to take there, and your own records; topic questions from the books are for pupils, teachers, faculty and heads of department. It is not a general chatbot: anything else gets one sentence saying what it is for. Vidura knows the page it opened beside: "How do I use this page?" or "how do I do this here?" is answered from that page's own help and your own figures shown there. Under "My records", or when Vidura picks it, it answers counts from the exam cell's own pages (forms waiting, open backlogs, revaluations pending, credits to push), from the platform's own figures and never a list of students, and under "Sources" it links the post or the message thread it read.

1. Type in "Your question" and press "Ask". Do not type names, phone numbers or anyone's details. An empty conversation shows "What Vidura is for" and, under "Try asking", three questions for your role and the page you are on (on a page other than your home the first is "How do I use this page?"); pressing one asks it.
2. To send one question a particular way, choose under "Mode for your next question": "Vidura picks" (the default), "Using Shalaghar" (how the platform works, which page and which steps) or "My records" (your own figures, counts and links, read from the pages you already see). The pick sends only your next question that way, then Vidura picks again, and no pick gets past a refusal. Each answer wears a small label naming the mode it was answered in.
3. Answer "Was this helpful?" with "Yes" or "No".
4. "New conversation" starts afresh. "Your conversations" lists the conversations of the last thirty days inside the drawer: press one to re-read it and ask more in it, "Delete this conversation" removes one sooner, and "Back to the conversation" returns.

Answers are set out with headings, numbered steps, bold for what matters, and a small table when your own figures have several rows. A definition is short (about sixty words) and a how-to gives numbered steps (up to about 250 words). If an answer stops at its length limit it says "The answer stopped at its length limit." and "Go on" continues it; "Go on" counts as one of your questions for the day, and an answer can be continued at most twice. Each person has twenty questions a day, a conversation remembers what was said in it only, and each conversation is deleted thirty days after it was last used.

When Vidura cannot answer (its one sentence saying what it is for, a refusal, or an answer saying it is not sure), the answer shows "Vidura could not answer this; a person at your school can." and one button: "Ask the registrar's office", which opens a message conversation with them. Nothing of your question is copied into the message; you write your own.

Your own leave is at `/account/leave` ("Leave": "Apply for leave" with "First day away", "Last day away", "Kind of leave" and "Why"; the office or the principal decides), your check-in at `/account/attendance` ("I'm in"), your appointment letters at `/account/letters` ("My letters", each with a "PDF"), and `/account` holds your sign-in, language, appearance and devices. `/remarks` ("Messages", "New message") and `/bulletin` ("Social Media", "New post") are the college's messages and feed.
