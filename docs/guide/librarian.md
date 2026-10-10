Roles: LIBRARIAN

# The librarian's guide (school and college)

This guide is for the librarian of a school or college on Shalaghar: the person at the desk who lends and takes back books, keeps the catalogue, writes and waives fines, and counts the shelves. You start at `/library`, the "Library" desk. The bar carries "Library", "Catalogue", "Overdue" and "Reservations". The "More" menu holds "Fines", "Reading room" and "Global feed" under "Day to day", and "Stock-take", "Reports", "Account", "Leave" and "Staff attendance" under "Running things"; "Assistant" is there while the school has the Assistant module on. At a college the menu adds "The college library" and "No-dues". The desk pages are in the menu only when the school has the Library module on; the home page says so when it is off. The principal reads these pages but cannot write on them.

## How do I lend a book and take one back?

Open `/library` ("Library"). The tiles count "Overdue", "Ready to collect", "Waiting in the queue" and "Fines due". The header reads "Scan or type a book's number to lend it or take it back. A late book writes its fine; a book someone reserved is held for them."

1. Under "Scan or type a code", type the "Code" ("A book's accession number, a library card, or an ISBN.") and press "Find".
2. A copy on loan shows "with {name}, due {date}" and "Take it back"; press it to return the book.
3. A copy on the shelf shows "Lend to whom? Type a name, a pupil code or a card"; press "Find the person", then "Lend" next to the borrower. Each person shows "holds {count} of {limit}" and "owes {amount}"; the button is disabled for somebody at their limit.
4. Under "Take a book back", scan or type "the accession number of a book coming back" when you do not need the lookup.

The toast reads "Lent "{title}" to {name}, due back on {due}.", ""{title}" is back on the shelf.", ""{title}" is back, late: its fine is written." or ""{title}" is back and held for {name}, first in the queue." A code that finds a book opens the book (with "{count} of {of} on the shelf"); one that finds a person opens their member page. "Nothing in the library has the code {code}." means a mistyped code.

## How do I add books to the catalogue?

Open `/library/catalogue` ("Catalogue"): "Every book the library holds, its copies on the shelf, and the queue for it." Use "Search the catalogue" to find a title; each shows "{count} of {of} on the shelf" and "{count} waiting".

1. Under "Add a book", fill in "Title", "Author", "ISBN" ("Ten or thirteen digits, as printed; leave empty if it has none."), "Publisher", "Year", "Subject", "Language", "Kind of book" and "Rack".
2. Give the "Accession numbers of the copies" ("For example B-0101 B-0102.") and press "Add the book". The toast reads "Added "{title}"."
3. For many books at once, under "Import from a spreadsheet" paste "The rows, header first" (title, author, isbn, copies, accession, and the rest if you have them) and press "Import"; the result reads "{titles} new books, {matched} already here, {copies} copies added, {skipped} rows skipped."

A second import of the same sheet adds nothing, and an ISBN already in the catalogue is refused with "The library already has a book with this ISBN. Add a copy to it instead."

## How do I correct a book, its copies and its queue?

Open a title from the catalogue or the desk (`/library/titles/{id}`). "Copies" lists each accession number with its state ("On the shelf", "On loan", "Lost", "Withdrawn", "Being mended"), "held for {name}" or "seen in the stock-take".

1. Change a copy's "State of the copy" and press "Set"; "Add a copy" adds another accession number.
2. Under "Correct the book", change the fields and press "Save the book".
3. For a periodical, under "Subscription and volumes" set "How often it comes", "Subscribed from" and "Subscribed until" and press "Save the subscription"; record each arrival with "Volume", "Issue" and "Received on" and "Record the volume".

"The queue" lists who is waiting for the book in order, or "Nobody is waiting for this book."

## How do I renew a loan or write a fine?

Open a borrower from the desk (`/library/members/{id}`). The header shows "holds {count} of {limit}" and "owes {amount}".

1. Under "On loan", press "Renew" on a loan; the toast reads "Renewed: due back on {due}."
2. Under "A fine for damage or a lost book", choose "Which book", "For" ("Damage" or "Lost book") and the "Amount in rupees", and press "Write the fine". "A lost book ends the loan and the copy is marked lost. A pupil's fine goes on the fee account where the school has chosen a fee head for fines."
3. Under "Fines", write "Why waive it?" and press "Waive" to let a fine go.

A fine shows "on the fee account" or "paid at the school office". "Record as paid" is the office's button, not the desk's: a counter payment is recorded by the office. "Reservations" lists the borrower's places in queues; "Leave the queue" drops one.

## How do I chase overdue books and keep the queues?

Open `/library/overdue` ("Overdue"): "Loans past their due day, the oldest first.", with "{count} overdue" and "{days} days late" on each. Under "Tell the borrowers", press "Send the notices": "Each borrower, and a pupil's guardians, is told once a day through the app's notices." The result reads "{sent} told now; {already} already told today." Open `/library/reservations` ("Reservations"): "Ready ones first: their copy waits at the desk for the person named. Then each book's queue in the order it was placed." A ready one reads "ready at the desk ({accession})"; "Leave the queue" removes a reservation.

## How do I read the fines?

Open `/library/fines` ("Fines"). The header reads "Fines still due: {amount}." Switch between "Show only those due" and "Show every fine"; each fine shows its amount, its reason, "Due", "Paid" or "Waived", and "on the fee account" or "paid at the school office". A fine on the fee account is paid with the fees; "Shalaghar never takes the money."

## How do I count the shelves?

Open `/library/stocktake` ("Stock-take"): "Start a stock-take, scan each book on the shelves, and read what has not been seen. Books out on loan are not looked for."

1. Press "Start a stock-take"; the page reads "Stock-take running since {since}" with tiles "Copies to find", "Seen" and "Not seen yet".
2. Scan or type each "Accession number" and press "Mark seen"; the toast reads "{accession} seen: {seen} of {total}."
3. Read "Not seen yet" (each with "rack {rack}") and press "Finish the stock-take" when done: "The stock-take is finished: {seen} of {total} seen."

## What do the reports and the reading room show?

Open `/library/reports` ("Reports"): tiles "Books", "Copies", "On loan", "Overdue", "Borrowers" and "Fines due", then "Loans each month" (the last twelve months), "Borrowed most" ("lent {count} times") and "Overdue by class". Open `/library/reading-room` ("Reading room"): "Sign readers in and out at the desk; the day's register is below."

1. Under "Sign a reader in or out", type the "Library card or student code" and press "Sign in" or "Sign out"; "A reader already inside is not signed in twice."
2. Pick a "Day" and press "Show the day" for an earlier register.

Tiles count "Readers", "Students", "Staff", "Inside now", "Not signed out", "Average stay" and "Busiest hour"; the "Register for {day}" table has "Reader", "In", "Out", "Minutes" and a "Sign out" column with "Sign {name} out".

## How do I record that I am in, and apply for leave?

Open `/account/attendance` ("Staff attendance"), the "My attendance" page, and press "I'm in" under "Today"; the toast reads "Checked in. Have a good day." or "Checked in — after {time}, so it is marked late." Open `/account/leave` ("Leave"): "Ask to be away. The office answers, and you see its answer here." Press "Apply for leave", set "First day away", "Last day away" and the "Kind of leave", write "Why" and press "Send to the office"; "Withdraw this request" takes back a waiting one. "Leave this year" shows your balance.

## Where are my account, the feed and the assistant?

`/account` ("Account") has "Sign-in and schools", "Preferences" ("Notifications", "Language", "Appearance and reading") and "Devices", with "Sign out" at the foot; its "Leave" card opens `/account/leave`, and "My payslips" appears when the school has the Payroll module on. `/bulletin/global` ("Global feed") shows the posts every school has chosen to share. Press "Ask the assistant" on any page or open `/assistant` ("Assistant"): it answers how to use Shalaghar, which page to open and the steps to take there; type in "Your question" and press "Ask", and do not type names or phone numbers. It also answers counts from the desk's own pages (books overdue, reservations waiting, fines due, copies on loan), from the platform's own figures and never a list of borrowers, and under "Sources" it links the post it read.

## At a college

### How do I keep the e-resources and the ISBN list?

Open `/library/college` ("The college library"): "E-resources and their use, a publisher's ISBN list, and this year's numbers for NAAC criterion 4." At a school the page says "For colleges". Tiles show "Titles", "Periodicals", "E-resources" ("opened {n} times"), "Loans in {year}" ("{n} per student") and "Library spend this year".

1. Under "E-resources", give the "E-resource" name, its "Link" (it must start with https://) and "Kind" ("N-LIST", "DELNET", "E-journal", "E-book", "Database" or "Other") and press "Add". Students and staff open each in a new tab, and the table counts "Opened".
2. Under "A publisher's ISBN list", paste "One book a line" ("ISBN, title, author, publisher, year.") and press "Import": "{added} titles added, {already} already in the catalogue, {invalid} ISBNs did not check." Copies are then added at the desk as the books arrive.

### How do I clear the library's line of a no-dues?

Open `/accounts/no-dues` ("No-dues"): "Before an exam form, on leaving the hostel and on leaving the college, every desk says the student owes it nothing. Each desk clears its own line; a new due reopens it."

1. Choose the event: "Exam form", "Leaving the hostel" or "Leaving the college".
2. Open a student from "Still open for {event}"; the table shows each "Desk" with "Owed", "Items out" and "Status".
3. On the "Library" line, write a "Note" if a book is still out or a fine still due, and press "Clear this line".

Only the library's line is yours; the "Accounts", "Hostel" and "Laboratory" lines are those desks'. When every line is cleared the page reads "Every desk has cleared."; "Everyone is clear" means no active student has an open line for that event.
