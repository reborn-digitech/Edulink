Roles: ACCOUNTS

# The accounts desk's guide (school and college)

This guide is for the accounts desk of a school or college on Shalaghar: the person who keeps the fee ledger, the fee structures, the concessions and scholarship claims, the no-dues, the payroll and the purchases. No money moves through Shalaghar: the institution's own bank and gateway hold it, and these pages are its books. You start at `/accounts`, the "Accounts" page. The bar carries "Accounts", "Social Media", "Fee structures", "Scholarships" and "No-dues". The "More" menu holds "Messages", "Concessions" and "A student's account" under "Day to day", and "Account", "Leave", "Staff attendance", "My letters", "Fee ledger", "Tally export", "HR and payroll", "Inventory and assets" and "Refunds outside the slab" under "Running things"; "Assistant" is there while the school has the Assistant module on. "Scholarships" needs the Scholarships module, "HR and payroll" the Payroll module, "Inventory and assets" the Inventory module and "Refunds outside the slab" the Admissions module. At a school, "Accounts", "Fee structures", "Scholarships", "No-dues", "Concessions", "A student's account" and the refunds page say "For colleges" ("This page is a college office's. A school has nothing here."); a school's desk works on "Fee ledger", "Tally export", "HR and payroll" and "Inventory and assets".

## What does the Accounts page show?

Open `/accounts` ("Accounts"): "The college's money for {year}, as its books show it. No money moves here: the college's own bank and gateway hold it." The tiles show "Demanded", "Collected", "Outstanding" and "Owed by the state" (with "{n} concessions wait for the principal" when some do). Buttons lead to "Fee structures", "Concessions", "Scholarships", "No-dues", "A student's account", "Fee ledger", "Payroll", "Purchases" and "Fixed-asset register". "Seats awaiting their refund" lists cancelled seats whose admission fee was paid and whose refund has no bank reference yet, with "Applicant", "Cancelled on", "Fee paid" and "Refund": "Record the refund on the seat's page." "Collection against demand" is "By programme and term, this academic year." ("Programme", "Term", "Demand", "Collected", "Outstanding"); "Defaulters" lists each "Student" with "Overdue", "Oldest due date" and "Waiting", or "Nobody is overdue."; "Scholarship receivable by age" shows what the state still owes in "Up to 30 days", "31 to 90 days", "91 to 180 days" and "Over 180 days"; "Income and expense" shows "Fees collected (₹)", "Scholarships disbursed (₹)", "Purchases (₹)" and "Salaries with employer's share (₹)". Under "The auditor's schedules", each downloads as a sheet: "Collection against demand", "Defaulters", "Scholarship receivable", "Income and expense" and "Three-year finance table".

## How do I set the year's fee structures and raise the demands?

Open `/accounts/structures` ("Fee structures"): "Fees for {year} by programme, year of study and category, as the fee regulating authority approved them." "This year's structures" lists each with "Programme", "Year of study", "Category", "Approval reference", "Terms", "Total" and "Students". The page needs fee heads and programmes first ("Add fee heads and programmes first.").

1. Under "Add a structure", choose the "Programme", "Year of study" and "Category", give the "Approval reference" ("As the authority's order gives it.") and a "Name".
2. For each term, set its "Term" label ("Odd semester", "Even semester") and "Due on", and the amount under each fee head; set "Late fee {n}: after days" and "Late fee {n}: amount (₹)" for the late slabs.
3. Press "Save and publish": "Published as soon as it is saved: an approved fee is not a draft."
4. Press "Raise this year's demands": "Each active student goes on the structure their programme, year and category call for. Raising again changes nothing."

The toast reads "The structure is saved and published." A programme, year and category that already have a structure this year are refused. "The office's concession limit" ("A concession worth more than {amount} waits for the principal.") is the office's to change, not the desk's.

## How do I grant a concession?

Open `/accounts/concessions` ("Concessions"): "Each with the authority that sanctioned it. One worth more than {amount} waits for the principal and is not applied until approved."

1. Under "Grant a concession", choose the "Student", "On the head" (a fee head or "Every head"), the "Kind" ("A percentage" or "An amount per term") and the "Percentage or amount" ("12.5 for 12.5 %, or rupees per term.").
2. Write the "Reason" and who it was "Sanctioned by" ("The governing body, the trust, the fee regulating authority.").
3. Press "Grant".

The toast reads "The concession is applied." or "The concession is above the limit and waits for the principal." "Waiting for the principal" lists each with "Student", "Worth", "Reason", "Sanctioned by" and "Granted by"; the desk sees "Waits for the principal", and "Approve" and "Refuse" are the principal's buttons.

## How do I record a scholarship claim?

Open `/accounts/scholarships` ("Scholarships"; only when the college has the Scholarships module on): "Claims filed on the state portal, with what was sanctioned and paid." Under "Show", filter by "Status" and "Scheme"; with a scheme chosen, "Download the reconciliation sheet" gives this year's sheet for it. "Claims" lists "Student", "Scheme", "Portal application id", "Applied on", "Expected", "Sanctioned", "Disbursed" and "Status" ("Applied", "Sanctioned", "Disbursed", "Lapsed" or "Rejected").

1. Under "Record a claim", choose the "Student" and the "Scheme", give the "Portal application id" and "Applied on", and leave "Expected" empty "to work it out from the scheme" ("The expected amount starts as the scheme's share of the year's tuition, development and exam fees; the sanction replaces it."). Press "Record".
2. When the portal answers, open "Update" on the claim. On an applied claim give the "Amount (₹)" and "On" and press "Record the sanction"; on a sanctioned one give the "Amount (₹)", "On" and "Bank reference" and press "Record the disbursement". To end a claim instead, set its "Status" to "Lapsed" or "Rejected", write the "Reason" and press "Close it".

The toasts read "The claim is recorded." and "The claim is updated." A scheme not open to the student's category or income is refused; a disbursement cannot exceed the sanction.

## How do I read one student's account?

Open `/accounts/students` ("A student's account"): "One student's ledger with the scholarship set against it, and their leaving." Choose a student under "Choose a student" and press "Open" (a defaulter's name on `/accounts` opens here too). "{name}, {year}" lists each "Term" with "Due", "Demand", "Scholarship covers", "Paid", "You owe" and "Late fee if paid today": "What the scholarship is expected to cover is set against each term; the family owes the rest." The student's claims follow. "Leaving the college" shows "Every desk has cleared." or "The leaving clearance is still open. Each desk must clear its line first." with a link to the no-dues; "Record the leaving" ("Left on", "Completed the programme", "Transferred" or "Left", "Caution deposit returned: bank reference") is the office's form.

## How do I clear the accounts line of a no-dues?

Open `/accounts/no-dues` ("No-dues"): "Before an exam form, on leaving the hostel and on leaving the college, every desk says the student owes it nothing. Each desk clears its own line; a new due reopens it."

1. Choose the event: "Exam form", "Leaving the hostel" or "Leaving the college".
2. Open a student from "Still open for {event}"; the table shows each "Desk" ("Accounts", "Library", "Hostel", "Laboratory") with "Owed", "Items out" and "Status".
3. On the "Accounts" line, write a "Note" if money is still owed and you are clearing it anyway, and press "Clear this line".

Only the accounts line is yours; the others are those desks'. When every line is cleared the page reads "Every desk has cleared."; "Everyone is clear" means no active student has an open line for that event.

## How do I keep the fee ledger?

Open `/admin/fees` ("Fee ledger"), the "Fees" page: "What the school has asked for this year, what has arrived, and what is still to come." Buttons lead to "Dues", "Confirm UPI payments", "Structures", "Fee heads" and "Settings"; until the heads and structures exist, "Set up" shows the three steps "Fee heads", "Structures" and "How families pay" ("Your UPI id, your gateway, your receipt series."). The tiles show "Asked for", "Collected", "Outstanding", "Overdue", "Pupils on a plan", "Pupils without a plan" and "UPI payments to confirm"; then "By grade", "How old the outstanding is" ("Not yet due", "1–30 days", "31–90 days", "Over 90 days"), "This month, by method" and "Recent payments" (each with its receipt serial).

1. Under "Download collections (CSV)", set "From" and "To" and choose "Download collections (CSV)", "Download collections (Excel)", "Download outstanding (CSV)" or "Download outstanding (Excel)".
2. Under "Carry forward to the new year", choose "From" and "To" and press "Carry forward": "Every pupil's outstanding from the old year becomes an opening balance in the new one, due on its first day." The result reads "{pupils} pupils, {amount} carried forward."
3. Under "Import a bank statement", paste "The statement" (date, description, reference, credit), press "Check the statement", read "{count} to record", "{count} claims to confirm", "{count} already in the ledger" and "{count} to key by hand", then press "Record the matched lines".

`/admin/fees/dues` ("Dues") lists "Every pupil on a plan, with what is due, paid and overdue. Open a pupil to take a payment or grant a concession." with "Everyone", "Something due", "Overdue" and "Fully paid", a "Class" filter and "Search by name or code". `/admin/fees/claims` ("Confirm UPI payments") lists "Families who paid to the school's UPI id and gave a UTR. Check each against the bank statement, then confirm; a receipt is issued on confirmation." with "Confirm or reject" on each, and "Match a bank statement" to confirm rows that match by UTR and amount together.

## How do I export to Tally?

Open `/admin/fees/tally` ("Tally export"): "The fee receipts and a locked payroll month as vouchers your accountant imports into Tally. Export only: no money moves through the platform."

1. Under "Receipts and refunds", set "From" and "To", choose the "File" ("Tally XML" or "Day book (CSV)") and press "Download"; "reversed receipts are left out; at most {days} days."
2. Under "Payroll", choose a locked "Month" and press "Download": "A locked month as one journal voucher: the gross, the employer's share, each deduction's liability and the net payable." It reads "No payroll month is locked yet." until one is.

"Ledgers the vouchers name" says "Create these ledgers in the company in Tally, or rename yours to match, before importing." The page notes that the files follow Tally's published import shape and have not been imported into a real Tally here.

## How do I run the payroll?

Open `/admin/payroll` ("HR and payroll"; only when the school has the Payroll module on): "Salary structures, each person's salary, and the monthly payroll. No money moves through the app: the bank file goes to your bank." The tabs are "Overview", "Salaries", "Structures", "Advances" and "Statutory settings". The tiles show "Staff with a salary", "Last net pay", "Last month's cost" and "Paid last run".

1. Under "Monthly runs", choose the "Month" and press "Draft this month": "Draft a month from the staff register and approved leave, review each slip, then lock it."
2. Open the month ("Payroll for {month}"). Under "Review and lock", open a slip to set "Arrears", "TDS this month", "Loss-of-pay days (the register says {found})" and a "Note on the slip", and press "Save the slip"; "Draw again from the register" takes in today's register and salaries.
3. Tick "I have checked every slip" and press "Lock the run". The run then reads "Locked by {name} on {date}. Nothing in it can change now."

"Files for the portals and the bank" cuts each file from the locked run: "Upload them yourself; nothing is sent from here." Each slip has "Payslip (PDF)" and a "Yearly statement"; "Share the payslips with the head" lets the principal read them ("The head sees this run's totals only." until then). "Cost by month" and "Cost by department" follow the locked months. Under "Advances", decide a staff member's ask ("Decline" with "Why not") or "Record an advance" the school has already given ("Who", "Amount", "Taken back each month", "What for", "Record it"); "{count} advance asks waiting" on the overview leads there.

## How do I record a bill and an asset?

Open `/admin/inventory` ("Inventory and assets"; only when the school has the Inventory module on): "What the school keeps in its stores, what it owns, who holds it and where it is." The tabs are "Overview", "Items", "Movements", "Purchases", "Assets", "Asks", "Reports" and "Categories and vendors"; the overview shows "Items", "Running low", "Assets", "In repair", "Asks waiting" and "Book value", then "Running low", "Asks waiting" and "Latest movements".

1. On "Purchases" (`/admin/inventory/purchases`), under "Record a bill", choose the "Vendor" (or type the "Vendor's name"), give the "Invoice number", "Date of the bill", the "Scan of the bill" and the "Place", fill in the "Lines" ("Line {n}: item", "quantity", "price each"; "A line without an item is the bill's alone (a repair, a service).") and press "Record the bill". "Nothing here pays anyone: it is the record of the bill and what it brought in."
2. On "Assets" (`/admin/inventory/assets`), under "Add an asset", give the "Name", "Tag number" ("What is painted or stuck on it, such as PRJ-001."), "Category", "Bought on", "Cost", "Vendor", "Depreciation", "Rate a year (%)", "Warranty until", "Custodian", "Place" and "Condition", and press "Add the asset". "Fixed-asset register (CSV)" downloads the register and "Print tags" prints the tags.

## How do I follow a refund outside the slab?

Open `/admin/college-admissions/refunds` ("Refunds outside the slab"; only when the college has the Admissions module on): "Refunds the office asked for on cancelled seats beyond what the slab gives. Only the principal decides; an approval becomes the refund the college pays from its own account." Each reads "{amount} asked; the slab gives {slab} · {name} · {date}" and opens the seat's page; "Approve" and "Refuse" are the principal's. The page reads "No refund asked outside the slab" when there is none.

## How do I message, post, record that I am in and apply for leave?

`/remarks` ("Messages") is where a student or a family writes to the desk and you answer; "New message" starts one. `/bulletin` ("Social Media") is the school's feed. Open `/account/attendance` ("Staff attendance") and press "I'm in" under "Today"; the toast reads "Checked in. Have a good day." or "Checked in — after {time}, so it is marked late." Open `/account/leave` ("Leave"): press "Apply for leave", set "First day away", "Last day away" and the "Kind of leave", write "Why" and press "Send to the office"; "Withdraw this request" takes back a waiting one. `/account/letters` ("My letters") lists the appointment letters the office issued to you, each with "PDF". `/account` ("Account") has "Sign-in and schools", "Preferences" and "Devices", with "Sign out" at the foot. Press "Ask the assistant" on any page or open `/assistant` ("Assistant"): it answers how to use Shalaghar, which page to open and the steps to take there, and nothing else; do not type names or phone numbers.
