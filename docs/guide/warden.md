Roles: WARDEN

# The warden's guide (school and college)

This guide is for the warden of a hostel at a school or college on Shalaghar: the person who takes the roll call, decides leave, keeps the gate, gives beds, puts up the mess menu and records what happens in the hostel. You start at `/hostel`, the "Hostel" page. The bar carries "Hostel", "Roll call", "Leave" and "Rooms". The "More" menu holds "Tonight", "Visitors" and "Global feed" under "Day to day", and "Expulsions", "Mess menu", "Incidents", "Account", "Leave" and "Staff attendance" under "Running things". At a college the menu adds "Squad, rooms and numbers" and "No-dues". The hostel pages are in the menu only when the school has the Hostel module on. The principal reads these pages but cannot write on them.

## What does the Hostel page show?

Open `/hostel` ("Hostel"): "Tonight's roll call, who is out, what waits for you, and who was absent." The tiles count "Boarders", "Out on leave", "Leave to decide" and "Visitors today". Each hostel shows "{occupied} of {beds} beds taken" and either "{slot} roll call taken by {name}." or "{slot} roll call not taken yet." with "Take the roll call". "Absent at the last roll call" lists each boarder with "room {room}". If the office has made no hostel yet, the page reads "The school office has not made a hostel yet."

## How do I take the roll call?

Open `/hostel/rollcall` ("Roll call", or "Take the roll call" on the home page). "Everyone is ticked present; a boarder out on approved leave is ticked on leave. Mark who is absent and save once: their guardians are told at once."

1. Choose the "Hostel" and the "Roll call" ("Morning" or "Night") and press "Open".
2. On the sheet "{hostel}: {slot} roll call, {date}", each boarder ("room {room}, bed {bed}") has "Present", "On leave" and "Absent"; mark who is absent.
3. Press "Save the roll call". The toast reads "Roll call saved: {present} present, {onLeave} on leave, {absent} absent."

A sheet already taken reads "Taken {at} by {name}." and cannot be taken twice; "A roll call is for today, or last night's sent this morning." The office alone can correct a roll call once it is taken, under "Correct this roll call" with "Why it is being corrected". Each absent boarder's family is told "{name} was marked absent at tonight's roll call at {hostel}. The warden is looking into it."

## How do I decide leave and keep the gate?

Open `/hostel/leave` ("Leave"): "Asks waiting for a guardian, asks ready for you to decide, and approved leave to sign out and back in at the gate. A late return is told to the office and the family." Switch between "Open", "Today" and "All". Each ask shows its kind ("Home", "In town", "Medical" or at a college "Night out"), "{from} to {to}", and "consent from {name}".

1. An ask "Waiting for a guardian" shows "Waiting for a guardian's consent"; a boarder under eighteen needs that first.
2. On an ask "Waiting for the warden", write "A note (optional)" and press "Approve" or "Decline"; the toast reads "Leave approved; the family is told." or "Leave declined; the family is told."
3. When an approved boarder goes, press "Sign out at the gate" ("{name} signed out."); when they return, "Sign back in" ("{name} is back." or "{name} is back, late: the office and the family are told.").

Open `/hostel/night` ("Tonight"), "Tonight at the gate": "Who is away tonight and by when each is due back: the leave's end, or for an outing at a college the hostel's curfew." "The night before", "Tonight" and "The night after" move the night; each boarder reads "Due back by {time}" (or "Due back by the curfew, {time}") with the state "Not gone out", "Out", "Not back yet", "Back" or "Back late", and the same "Sign out at the gate" and "Sign back in". "The hostels' rules" shows "Curfew {time}" and "Night-outs allowed" or "No night-outs"; "A school's hostel keeps no curfew: a return is late only after the leave's end."

## How do I give a bed, add a room and read a health card?

Open `/hostel/rooms` ("Rooms"): "Who sleeps where, a free bed for a pupil, a bed given up. The office makes the houses; the office and the warden make rooms and allot beds."

1. Under "Give a pupil a bed", choose the "Pupil", the "Bed" ("{hostel}: room {room}, bed {bed}") and "From", and press "Give the bed"; the toast reads "{name} has room {room}, bed {bed}." "Only pupils without a bed are listed, and only free beds. A hostel fee is charged by the fees module."
2. To end a stay, set the "Last day" on the boarder and press "Give up the bed" ("{name}'s bed is given up.").
3. Under each hostel, add a room with "Room number", "Floor", "Beds" and "Kind of room" ("Dormitory", "Shared room", "Single room" or "Sick bay"), and press "Add the room".

"A new hostel" (its name, who boards, "Places" and the "Warden in charge") is the office's form, not the warden's. Each boarder has a "Health card" link to `/hostel/health/{id}`, "Health and emergency card": "What a warden needs at night. Opening it is recorded, and the family sees that you read it." It shows "Blood group", "Allergies", "Conditions", "Medicines", "Food", "Doctor" and "People to call"; "The family and the office have not filled in this card yet." when empty. The fees a boarder pays are not on these pages: the fees module demands the hostel fee and the office's ledger records it.

## How do I sign a visitor in?

Open `/hostel/visitors` ("Visitors"): "Who came to see which boarder, when they came and went, and who let them in."

1. Under "A visitor at the gate", choose "To see", give the "Visitor's name", "Relation" and a "Note", and press "Sign in" ("{name} signed in.").
2. When they leave, press "Sign them out" ("Signed out.").
3. Pick a "Day" and press "Open" to read an earlier day's book; each line says "in {at}", "out {at}" and "let in by {name}".

## How do I put up the mess menu and mark who ate?

Open `/hostel/menu` ("Mess menu"): "Each hostel's week of meals, Monday to Sunday. A meal left empty is not served. Boarders and families read today's."

1. For each hostel, fill in "Breakfast", "Lunch", "Snacks" and "Dinner" for "Monday" to "Sunday" and press "Save the menu".
2. Where the office has ticked "Mark who eats at each meal" for a hostel, "Who ate today ({date})" lists the boarders by meal; tick them and press "Save who ate" ("Saved for {count} boarders.").

A hostel without mess attendance refuses the sheet: "This hostel does not keep mess attendance."

## How do I record an incident?

Open `/hostel/incidents` ("Incidents"): "What happened in the hostel, written in the school's incident log with the hostel's tag. The family is told as the log tells them; the office follows up and closes it there."

1. Under "Record an incident", choose the "Pupil", "What kind" and "How serious", write it "In a line", say "What happened" and "What was done", and tick "Tell the family now" if they should hear at once.
2. Press "Record it". The toast reads "Recorded in the school's incident log."

The list shows each incident with its hostel, kind, seriousness, time, "open" or "closed" and "by {name}". Closing it is the office's, in the school's incident log.

## How do I propose an expulsion?

Open `/hostel/expulsions` ("Expulsions"), "Hostel expulsions": "A proposal to end a boarder's place: the warden or the office proposes it with the reason, the incident it rests on and the day it takes effect; only the principal decides. An approval ends the place on that day and tells the student and the family."

1. Under "Propose an expulsion", choose the "Boarder", "The incident it rests on" (or "No incident"), "Takes effect on" and write "The reason".
2. Press "Send to the principal". The toast reads "Proposed. The principal is told."

Each proposal reads "{hostel} {room} · from {date} · proposed by {name}"; "Withdraw" takes back one that is still asked. "Approve" and "Refuse" are the principal's buttons.

## How do I record that I am in, and apply for leave?

Open `/account/attendance` ("Staff attendance"), the "My attendance" page, and press "I'm in" under "Today"; the toast reads "Checked in. Have a good day." or "Checked in — after {time}, so it is marked late." Open `/account/leave` ("Leave"): "Ask to be away. The office answers, and you see its answer here." Press "Apply for leave", set "First day away", "Last day away" and the "Kind of leave", write "Why" and press "Send to the office"; "Withdraw this request" takes back a waiting one. "Leave this year" shows your balance.

## Where are my account, the feed and Vidura?

`/account` ("Account") has "Sign-in and schools", "Preferences" ("Notifications", "Language", "Appearance and reading") and "Devices", with "Sign out" at the foot; its "Leave" card opens `/account/leave`, and "My payslips" appears when the school has the Payroll module on. `/bulletin/global` ("Global feed") shows the posts every school has chosen to share.

Vidura is Shalaghar's assistant. Its one way in is the round button at the bottom right of every page, labelled "Ask Vidura" for screen readers; on a phone-width screen it sits above the bottom bar, and above the page's own round quick-action button where one is shown. The button is there only while Shalaghar's operator has Vidura switched on for the platform and for your school; the office does not switch it. There is no menu entry for Vidura, and opening `/assistant` takes you back to the page you came from with its drawer open.

Pressing the button opens Vidura's drawer. On a computer it docks at the right of the window and the page stays usable beside it, so you can follow the steps while you read them, and it stays open as you move between pages. On a phone it opens as a sheet from the bottom of the screen, and following a link from inside it closes it. Escape closes it, and so does "Close Vidura" (the cross).

For you it answers how to use Shalaghar, which page to open and the steps to take there, and your own records; topic questions from the books are for pupils, teachers, faculty and heads of department. It is not a general chatbot: anything else gets one sentence saying what it is for. Vidura knows the page it opened beside: "How do I use this page?" or "how do I do this here?" is answered from that page's own help and your own figures shown there. Under "My records", or when Vidura picks it, it answers counts from the hostel's own pages (boarders, beds occupied, leave requests open, visitors today), from the platform's own figures and never a list of boarders, and under "Sources" it links the post it read.

1. Type in "Your question" and press "Ask". Do not type names, phone numbers or anyone's details. An empty conversation shows "What Vidura is for" and, under "Try asking", three questions for your role and the page you are on (on a page other than your home the first is "How do I use this page?"); pressing one asks it.
2. To send one question a particular way, choose under "Mode for your next question": "Vidura picks" (the default), "Using Shalaghar" (how the platform works, which page and which steps) or "My records" (your own figures, counts and links, read from the pages you already see). The pick sends only your next question that way, then Vidura picks again, and no pick gets past a refusal. Each answer wears a small label naming the mode it was answered in.
3. Answer "Was this helpful?" with "Yes" or "No".
4. "New conversation" starts afresh. "Your conversations" lists the conversations of the last thirty days inside the drawer: press one to re-read it and ask more in it, "Delete this conversation" removes one sooner, and "Back to the conversation" returns.

Answers are set out with headings, numbered steps, bold for what matters, and a small table when your own figures have several rows. A definition is short (about sixty words) and a how-to gives numbered steps (up to about 250 words). If an answer stops at its length limit it says "The answer stopped at its length limit." and "Go on" continues it; "Go on" counts as one of your questions for the day, and an answer can be continued at most twice. Each person has twenty questions a day, a conversation remembers what was said in it only, and each conversation is deleted thirty days after it was last used.

Your menu has no "Messages", so when Vidura cannot answer it offers no button to write to a person at the school.

## At a college

### How do I log a squad round and move a boarder?

Open `/hostel/squad` ("Squad, rooms and numbers"): "The anti-ragging squad's rounds, a boarder's move to another bed, and this year's numbers for NAAC criterion 5." At a school the page says "For colleges". Tiles show "Occupancy" ("{occupied} of {beds} beds"), "Boarders in {year}", "Hostel incidents", "Squad rounds" ("{n} found something") and "Late returns".

1. Under "Anti-ragging squad rounds", choose the "Hostel", set "When", list the "Squad members", add a "Note", tick "The round found something the committee must take up" if it did, and press "Log the round" ("The round is logged.").
2. Under "Move a boarder", choose the "Boarder", the "Room" and the "Bed" and press "Move".

A college's hostel keeps a curfew and may allow night-outs, which the "Tonight" page applies at the gate; "Night out" is a kind of leave a boarder can ask for only where the hostel allows it.

### How do I clear the hostel's line of a no-dues?

Open `/accounts/no-dues` ("No-dues"): "Before an exam form, on leaving the hostel and on leaving the college, every desk says the student owes it nothing. Each desk clears its own line; a new due reopens it."

1. Choose the event: "Exam form", "Leaving the hostel" or "Leaving the college".
2. Open a student from "Still open for {event}"; the table shows each "Desk" with "Owed", "Items out" and "Status".
3. On the "Hostel" line, write a "Note" if something is still owed, and press "Clear this line".

Only the hostel's line is yours; "Accounts", "Library" and "Laboratory" are those desks'. When every line is cleared the page reads "Every desk has cleared."
