Roles: ACCOUNTS

# The accounts desk's guide (college)

This guide is for the accounts desk at a college, whose home is `/accounts` ("Accounts"). It covers what a college's desk does that a school's does not: fee structures by programme, year of study and category as the fee regulating authority approved them, a demand per term raised on every active student, concessions granted with their sanctioning authority (above the office's limit, the principal's to approve), the scholarship claims filed on the state portal and set against each student's ledger, the no-dues before an exam form or a leaving, and the seats awaiting their refund. The fee ledger, the Tally export, payroll and the stores are the same pages the school's office uses, and the school accounts guide describes them in full; this guide names them once. The menu holds "Accounts", "Fee structures", "Scholarships", "No-dues", then "Day to day" with "Messages", "Concessions" and "A student's account", and "Running things" with "Account", "Leave", "Staff attendance", "My letters", "Fee ledger", "Tally export", "Payroll", "Inventory and assets" and "Refunds outside the slab". No money moves here: the college's own bank and gateway hold it, and the platform records what was received.

## How do I read the college's money at a glance?

Open `/accounts`. "The college's money for {year}, as its books show it. No money moves here: the college's own bank and gateway hold it."

1. The four tiles: "Demanded", "Collected", "Outstanding" and "Owed by the state" (with "{n} concessions wait for the principal" when any do).
2. The button row opens each desk: "Fee structures", "Concessions", "Scholarships", "No-dues", "A student's account", "Fee ledger", "Payroll", "Purchases", "Fixed-asset register" and "Seats awaiting refund ({n})".
3. "Collection against demand" is by programme and term for this academic year; until structures are published and demands raised it says "No demands yet".
4. "Defaulters" lists who is overdue with the amount and "Oldest due date"; a name opens their account.
5. "Scholarship receivable by age" is what the state still owes on claims applied for or sanctioned, in bands up to 30, 90 and 180 days and over.
6. "Income and expense" counts fees collected, scholarships disbursed, purchases and salaries with the employer's share, this academic year.

"The auditor's schedules" download each as a sheet: "Collection against demand", "Defaulters", "Scholarship receivable", "Income and expense" and the "Three-year finance table" (which the AICTE disclosure, NAAC criterion 4 and NIRF read).

## How do I add a fee structure?

Open `/accounts/structures` ("Fee structures"): "Fees for {year} by programme, year of study and category, as the fee regulating authority approved them." The college needs fee heads and programmes first ("Add fee heads and programmes first."); the office makes them.

1. Under "Add a structure" ("Published as soon as it is saved: an approved fee is not a draft."), choose the "Programme", the "Year of study" and the "Category" ("Open", "SC", "ST", "OBC", "VJ/NT", "SBC", "EWS", "NRI", "Institute quota" or "Management quota").
2. Give the "Approval reference" as the authority's order gives it, and a "Name".
3. Under "Term 1" (and "Term 2" if the year has two), set the "Term" label ("Odd semester", "Even semester"), "Due on", and the amount against each fee head.
4. Set the late-fee slabs: "Late fee 1: after days" and "Late fee 1: amount (₹)", and a second if there is one.
5. Press "Save and publish".

"This year's structures" lists each with its terms, totals and how many students are on it. A programme, year and category may have one structure a year. The principal reads this page; the desk and the office write it.

## How do I raise the year's demands?

Open `/accounts/structures`. Under the structures table press "Raise this year's demands": "Each active student goes on the structure their programme, year and category call for. Raising again changes nothing." The message says "{assigned} students put on their structure, {unchanged} already were, {missing} have no structure yet." Each student then has a demand per term on their ledger, which they and their family see on their own money page and pay at the college's counter or bank; the exam cell's session fee is a further demand when a form is submitted. A student with no matching structure is counted under "missing": add that structure and raise again.

## How do I grant a concession?

Open `/accounts/concessions` ("Concessions"): "Each with the authority that sanctioned it. One worth more than {amount} waits for the principal and is not applied until approved."

1. Under "Grant a concession", choose the "Student", the head it is "On the head" (or "Every head"), the "Kind" ("A percentage" or "An amount per term"), the "Percentage or amount" ("12.5 for 12.5 %, or rupees per term."), the "Reason" and "Sanctioned by" (the governing body, the trust, the fee regulating authority).
2. Press "Grant".

Within the office's limit it is applied at once ("The concession is applied."); above it the page says "The concession is above the limit and waits for the principal." and it sits under "Waiting for the principal" with its worth, reason, authority and who granted it, marked "Waits for the principal". The principal approves (applied at once) or refuses (never applied) on the same page; the one who granted it cannot decide it. The limit itself is on `/accounts/structures` under "The office's concession limit" ("A concession worth more than {amount} waits for the principal."), and only the office changes it.

## How do I record a scholarship claim and follow it?

Only when the college has the Scholarships module on. Open `/accounts/scholarships` ("Scholarships"): "Claims filed on the state portal, with what was sanctioned and paid." The schemes' figures and their source are named in the heading.

1. Under "Record a claim", choose the "Student" and the "Scheme" (the post-matric scholarships for SC, ST and OBC, VJ/NT and SBC, the Rajarshi Shahu Maharaj fee scholarships, EBC, minority, PM-USP, or "Other"), give the "Portal application id", "Applied on" and the "Expected" amount (or leave it empty to work it out from the scheme). Press "Record".
2. "Claims" lists each with its scheme and year, portal id, "Expected", "Sanctioned", "Disbursed", its status ("Applied", "Sanctioned", "Disbursed", "Lapsed" or "Rejected") and how many days it has waited.
3. Press "Update" on an applied claim: give the "Amount (₹)" and "On" and press "Record the sanction". On a sanctioned one, give the "Amount (₹)", "On" and the "Bank reference" and press "Record the disbursement".
4. To close a claim that lapsed or was rejected, choose "Lapsed" or "Rejected" under "Status", write the "Reason" and press "Close it".

A disbursement is written on the student's ledger as the bank credit it is; a lapse or rejection reverts the demand to the student, who is told. The same student, scheme and year is one claim. Filter by "Status" and "Scheme" with "Show"; with a scheme chosen, "Download the reconciliation sheet" gives that scheme's sheet for the year.

## How do I read one student's ledger?

Open `/accounts/students` ("A student's account"): "One student's ledger with the scholarship set against it, and their leaving." Choose the "Student" and press "Open". The ledger, headed "{name}, {year}", lists each term with "Due", "Demand", "Scholarship covers", "Paid", "You owe" and "Late fee if paid today"; "What the scholarship is expected to cover is set against each term; the family owes the rest." The student's claims are listed under it. Payments themselves are recorded on the fee ledger (below); this page reads them.

## How do I clear a student's no-dues?

Open `/accounts/no-dues` ("No-dues"): "Before an exam form, on leaving the hostel and on leaving the college, every desk says the student owes it nothing. Each desk clears its own line; a new due reopens it."

1. Choose the event: "Exam form", "Leaving the hostel" or "Leaving the college".
2. "Still open for {event}" lists every active student with a line open and "Desks still open"; press a student.
3. Their lines show each "Desk" ("Accounts", "Library", "Hostel", "Laboratory") with "Owed", "Items out" and "Cleared" or "Still open".
4. On the "Accounts" line, write a "Note" and press "Clear this line".

Only the accounts line is yours: the librarian clears the library's, the warden the hostel's, the head of department the laboratory's, and the office any. A line with money still owed needs the note to say why it is cleared. The exam cell refuses a student's form while a desk is open; the exam form's clearance is once an academic year, leaving once.

## How is a leaving student cleared?

Open `/accounts/students` and choose the student. "Leaving the college" says "The leaving clearance is still open. Each desk must clear its line first." until every desk has cleared, with "No-dues" opening the student's leaving lines. Once it reads "Every desk has cleared.", the office (not the desk) records the leaving with "Left on", the "Reason" ("Completed the programme", "Transferred" or "Left") and "Caution deposit returned: bank reference", and presses "Record the leaving"; the message gives the caution deposit to be returned. The desk clears its line and reads the rest.

## How do I follow the seats awaiting their refund?

Only when the college has the Admissions module on. Open `/accounts` and press "Seats awaiting refund ({n})". "Seats awaiting their refund" lists "Cancelled seats whose admission fee was paid and whose refund has no bank reference yet, the oldest first. Record the refund on the seat's page." Each row shows the applicant and number, programme, the day cancelled, the admission fee and the refund the slab gives; a row whose office has asked for a refund outside the slab says so. Press the applicant to open the seat's page and record the bank reference that closes the case. The slab is fixed: all of it less the processing charge fifteen days or more before the last date, 90 % before the last date, 80 % within fifteen days after, 50 % up to thirty days after, nothing later.

## How do I read a refund asked outside the slab?

Open `/admin/college-admissions/refunds` ("Refunds outside the slab"): "Refunds the office asked for on cancelled seats beyond what the slab gives. Only the principal decides; an approval becomes the refund the college pays from its own account." Each ask reads "{amount} asked; the slab gives {slab} · {name} · {date}" with its reason and "With the principal", "Approved" or "Refused". The office asks from the cancelled seat's page and the principal decides here; the desk reads, then records the approved refund's bank reference on the seat's page. The principal cannot decide an ask they made themselves.

## Where are the fee ledger, the Tally export, payroll and the stores?

These are the office's pages, open to the desk too, and the school accounts guide gives their steps. `/admin/fees` ("Fee ledger") is where cash, cheque, bank transfer and counter UPI payments are recorded and receipts issued, families' UPI claims confirmed against the bank statement, a payment reversed or refunded, and collections downloaded. `/admin/fees/tally` ("Tally export") gives "Receipts and refunds" between "From" and "To" and a locked payroll "Month" as Tally XML or a day-book CSV with "Download"; it is export only, and "Ledgers the vouchers name" lists what to create in Tally first. `/admin/payroll` ("HR and payroll") drafts a month from the staff register and approved leave, reviews each slip and locks it; `/admin/inventory` ("Inventory and assets") keeps the stores, purchases and the fixed-asset register. Payroll and inventory are there only when the college has those modules on.

## How do I use Vidura, and manage my own account?

Vidura is Shalaghar's assistant. Its one way in is the round button at the bottom right of every page, labelled "Ask Vidura" for screen readers; on a phone-width screen it sits above the bottom bar, and above the page's own round quick-action button where one is shown. The button is there only while Shalaghar's operator has Vidura switched on for the platform and for your college; the office does not switch it. There is no menu entry for Vidura, and opening `/assistant` takes you back to the page you came from with its drawer open.

Pressing the button opens Vidura's drawer. On a computer it docks at the right of the window and the page stays usable beside it, so you can follow the steps while you read them, and it stays open as you move between pages. On a phone it opens as a sheet from the bottom of the screen, and following a link from inside it closes it. Escape closes it, and so does "Close Vidura" (the cross).

For you it answers how to use Shalaghar, which page to open and the steps to take there, and your own records; topic questions from the books are for pupils, teachers, faculty and heads of department. It is not a general chatbot: anything else gets one sentence saying what it is for. Vidura knows the page it opened beside: "How do I use this page?" or "how do I do this here?" is answered from that page's own help and your own figures shown there. Under "My records", or when Vidura picks it, it answers figures from the desk's own pages (fees outstanding, overdue and collected, claims waiting, scholarship claims), from the platform's own figures and never a list of students, and under "Sources" it links the post or the message thread it read.

1. Type in "Your question" and press "Ask". Do not type names, phone numbers or anyone's details. An empty conversation shows "What Vidura is for" and, under "Try asking", three questions for your role and the page you are on (on a page other than your home the first is "How do I use this page?"); pressing one asks it.
2. To send one question a particular way, choose under "Mode for your next question": "Vidura picks" (the default), "Using Shalaghar" (how the platform works, which page and which steps) or "My records" (your own figures, counts and links, read from the pages you already see). The pick sends only your next question that way, then Vidura picks again, and no pick gets past a refusal. Each answer wears a small label naming the mode it was answered in.
3. Answer "Was this helpful?" with "Yes" or "No".
4. "New conversation" starts afresh. "Your conversations" lists the conversations of the last thirty days inside the drawer: press one to re-read it and ask more in it, "Delete this conversation" removes one sooner, and "Back to the conversation" returns.

Answers are set out with headings, numbered steps, bold for what matters, and a small table when your own figures have several rows. A definition is short (about sixty words) and a how-to gives numbered steps (up to about 250 words). If an answer stops at its length limit it says "The answer stopped at its length limit." and "Go on" continues it; "Go on" counts as one of your questions for the day, and an answer can be continued at most twice. Each person has twenty questions a day, a conversation remembers what was said in it only, and each conversation is deleted thirty days after it was last used.

When Vidura cannot answer (its one sentence saying what it is for, a refusal, or an answer saying it is not sure), the answer shows "Vidura could not answer this; a person at your school can." and one button: "Ask the registrar's office", which opens a message conversation with them. Nothing of your question is copied into the message; you write your own.

Your own leave is at `/account/leave` ("Leave": "Apply for leave" with "First day away", "Last day away", "Kind of leave" and "Why"; the office or the principal decides), your check-in at `/account/attendance` ("I'm in"), your appointment letters at `/account/letters` ("My letters", each with a "PDF"), and `/account` holds your sign-in, language, appearance and devices. `/remarks` ("Messages", "New message") and `/bulletin` ("Social Media", "New post") are the college's messages and feed.
