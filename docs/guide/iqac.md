Roles: IQAC

# The IQAC coordinator's guide (college)

This guide is for the coordinator of a college's Internal Quality Assurance Cell, whose home is `/iqac` ("IQAC desk"). The desk keeps the accreditation file all year from the college's own records: the NAAC cycle and its predictor, the simulator, the filings (SSR, AQAR, IIQA, NIRF, AISHE, the affiliation return, the AICTE disclosure and the councils' returns by stream), the surveys, the research and activity registers, the grievance line, the peer-team visit file, and the faculty records the office writes. Every page is behind the IQAC module; the office and the principal read the desk, the IQAC writes it. One sentence is on every page that shows a score and should be read first: "Shalaghar does not score for NAAC and promises no grade. Every number here is your own record read against the platform's benchmarks, and every qualitative score is the IQAC's own provisional judgement." The menu's "Day to day" holds "Messages", "NAAC predictor", "Filings", "Surveys" and "Assistant"; "Running things" holds "Account", "Leave", "Staff attendance", "My letters", "Placement table", "Research and activities", "Grievances", "Peer-team visits" and "Faculty records". A row of desk links under each page's heading moves between "IQAC desk", "NAAC predictor", "Simulator", "Filings", "Surveys", "Research and activities", "Grievances" and "Peer-team visits".

## How do I open a NAAC cycle?

Open `/iqac`. Without a cycle the page says "No NAAC cycle yet" and "Open a cycle over the five years the assessment will read, and the predictor fills itself from the college's records."

1. Set "Window from" and "Window to" (at most five years; the defaults are the last five).
2. Press "Open the cycle".

The message says "The cycle is open and its quantitative metrics are computed." One cycle is open at a time; "Close the cycle" on the predictor closes it, after which it reads as it stands. The framework (affiliated UG or autonomous) follows the college's kind.

## How do I read the desk?

Open `/iqac`. "NAAC cycle" shows the "Predicted CGPA", the "Band" with "{distance} below {grade}, which starts at {min}." and how many metrics have a score; "Recompute from the records" recounts every quantitative metric now. Below it, "Actionable insights" summarises the way to the next band and its three best steps; "The ten cheapest metrics to move" ranks "+{gain} CGPA per {unit}"; four tiles count "Research", "Activities", "Surveys" open and "Grievances" open (with "Past its time limit" when any is overdue); "The regulators' calendar" lists each window ("NAAC AQAR", "AISHE data capture", "NIRF data capture", "AICTE extension of approval" where the streams bring it, "University affiliation return") with "Filed this year" once it is, and warns "Dates move each year: check the regulator's own notice."; "NIRF estimate" counts what NIRF's published formulas give; and at a management, engineering or pharmacy college "Mandatory disclosure" is published from here.

## How do I score a qualitative metric with evidence?

Open `/iqac/predictor` ("NAAC predictor"): "Criteria, key indicators and metrics, each with its value, the records behind it and why it reads what it reads." Each criterion folds to its name and "{score} of 4"; open it, then open a metric.

1. A "Quantitative" metric shows its value, "From the records" (each fact with "counted from the records", "entered by the IQAC" or "not in the records") and why it reads what it reads. It is computed, never typed.
2. A "Qualitative" metric is yours: choose "Score, 0 to 4" (in halves), "Cite a record" (a research item, an activity or a committee meeting) or "Attach a document", write "What the evidence shows", and press "Save the score".

A score needs at least one cited record or one attached file. "Recompute from the records" at the top recounts the quantitative metrics; the "By term" tile keeps the CGPA's trend from each computation. A link from an insight opens its metric in its criterion.

## How do I enter the figures the platform does not hold?

Open `/iqac/predictor` and scroll to "Figures the platform does not hold": "Sanctioned posts, bandwidth, expenditure: enter each with the document it comes from, and the cycle is recomputed."

1. Fill the figures: "Sanctioned teaching posts", "Internet bandwidth (Mbps)", "Computers for students", the five-year expenditure lines in ₹ lakh, "Seats earmarked for reserved categories, five years", "Green campus facilities in place (0 to 4)", "Quality certifications held (ISO, NBA)", "Courses focused on employability", "New courses in the window" and "All courses offered".
2. Attach "The document behind these figures".
3. Press "Save and recompute".

The message says "Saved, and the cycle recomputed." A metric that reads 0 because a figure is missing says so in its "why" line.

## How do I sign the benchmark list?

Open `/iqac/predictor`. "The benchmark list" says "The NAAC benchmarks the predictor scores against and the NIRF band minimums. Every figure reads provisional until the IQAC coordinator reads this list and signs it; a change to the list makes them provisional again." Press "Show the list ({naac} NAAC benchmarks, {nirf} NIRF bands)" to read it, then "I have read the list: sign it" and confirm. Until then every NAAC and NIRF figure on the desk carries "Provisional"; after it, "Signed" with your name and the day. Only the IQAC coordinator signs.

## How do I use the simulator?

Open `/iqac/simulator` ("Simulator"): "Change the figures and see the grade. Everything is worked out in your browser with the predictor's own formulas; nothing is saved until you save a scenario."

1. Move a slider or type a figure under any criterion; the "Predicted CGPA", "Band" and NIRF estimate recompute at once. "Reset to today" puts everything back.
2. Under "Save as a scenario", give a "Name" and press "Save the scenario".
3. "Saved scenarios" lists each with its result, today's and the difference; "Load into the simulator" starts from it, "Show as insights" says what it still lacks, "Remove" deletes it. "Compare" sets two of one kind side by side with the figures and scores that differ.

At an engineering college the "NBA SAR simulator" tab does the same for a department's SAR. The IQAC and the principal save scenarios; a closed cycle takes none; the college keeps at most a hundred.

## How do I generate a filing?

Open `/iqac/documents` ("Filings"): "Each is cut from the live records when you generate it and kept with its fingerprint. The NAAC documents go to the principal for sign-off before they are filed." "What your streams file" shows a card per filing, yours marked "Your filing" and the others greyed as "Filed by a college teaching {streams}."; "Councils not built yet" names the councils whose returns are not made in the app (keep them as you do now).

1. Under "Generate a filing", choose the "Filing" ("Self-study report (data)", "AQAR (yearly, September)", "IIQA", "NIRF data", "AISHE data capture", "AICTE mandatory disclosure", "Affiliation return", or a council's return your streams bring), the "Year" ("2025 for 2025-26"), the "NAAC cycle", and for the NBA report the "Department (NBA report only)".
2. Tick "Make it again" only for a year already filed: "a second draft beside the filed one."
3. Press "Generate from the records".

Each filing is listed with the date, its format, "Fingerprint" and its headline figures; "Download" gives the CSV or PDF. A council's return has "Figures and worksheet" first (see below), and NIRF has its own insights page.

## How do I send a filing to the principal and mark it filed?

Open `/iqac/documents`. A NAAC document (the SSR, AQAR and IIQA) is signed off: press "Send to the principal" on a "Draft" or "Returned" one; it reads "With the principal" until the principal signs it off ("Signed off", with "Signed off {date}") or returns it with a note ("The principal's note: {note}"). The others need no sign-off. When the portal has taken a filing, attach "The portal's acknowledgement (optional)" and press "Mark as filed on the portal"; it reads "Filed", and the regulators' calendar shows "Filed this year".

## How do I fill a council's worksheet?

Open `/iqac/documents` and press "Figures and worksheet" on the PCI inspection data, the Bar Council return, the NCTE return or the NBA self-assessment report (each at `/iqac/documents/pci`, `/bci`, `/ncte` or `/nba`). Choose the "Year" (and for NBA the "Department") and press "Show". "From the records, as they stand" lists the figures; "Generating the filing freezes these figures with its fingerprint." Under "Compliance items" (BCI, NCTE) choose each item's "Status" ("Complied", "Not complied" or "Not applicable") with a "Note"; under "The report's criteria" (NBA) give the "Self-assessed marks" and "The department's account" for each item not marked "From the records". Press "Save the worksheet". The engineering department's HOD writes their own department's NBA worksheet too; once the report is with the principal or signed off the worksheet is read-only.

## How do I publish the AICTE mandatory disclosure?

Only at a college whose streams bring it (management, engineering, pharmacy). Open `/iqac`. "Mandatory disclosure" says "AICTE asks every approved institution to publish its disclosure. Publishing takes a snapshot of the records now: programmes, faculty, results, placement and committees, with no student and no PAN." Press "Publish a fresh snapshot"; the card reads "Published {date}: anyone can read it at {url}." with "Open". "Take the page down" removes it. Each faculty member's own public page, which they publish themselves, is linked from the disclosure.

## How do I open a survey and read its results?

Open `/iqac/surveys` ("Surveys and feedback"): "Course feedback, NAAC's student satisfaction survey, the exit survey and the alumni, employer, parent and teachers' surveys. Everyone sees totals only; anonymous surveys keep no name at all."

1. Under "Open a survey", choose the kind (the field is labelled "Filing": "Student satisfaction survey (NAAC)", "Course feedback", "Exit survey", "Alumni survey", "Employer survey", "Parent survey" or "Teachers' survey"), give the "Title", "Opens on" and "Closes on", and for course feedback the "Course offering (course feedback only)". Press "Open the survey".
2. Each survey lists its dates, "{n} responses" and "Anonymous" or "Names kept, never shown"; press "Results".
3. "Close now" closes it early: "Closed. Nobody can answer it now, and no answer can be matched to a person."

The students, alumni and teachers it asks answer from their own pages. Results show each question's mean on 0 to 4 and the count of each answer, never a respondent, and nothing below five answers ("Fewer than five answers: the results stay hidden so no answer can be traced to anyone."). The satisfaction survey's mean feeds the predictor; a course feedback's totals are read by its teacher and the department's HOD.

## How do I write the action-taken report, or take in a paper form?

Open the survey's results from `/iqac/surveys`. Under "Action taken", write "What the college did about it", attach a "Document (optional)", tick "Publish it to everyone the survey asked" to show it to them, and press "Save the report". For an employer's or a parent's survey, "Make a link for one respondent" mints a signed link that takes one answer and stops working when the survey closes; under "Type in a paper form", give "Whose form it is (company or person)", choose each answer and press "Add the response".

## How do I keep the research and activity registers?

Open `/iqac/registers` ("Research and activities"). "Research" is the college's whole register ("The college's items") with "{teachers} teachers · {publications} publications and {books} books per teacher". Add an item with its "Kind", "Title", "Indexed in (publications)", "Year", "Amount in ₹ lakh (grants, consultancy)", the "Faculty member" (or "The college"), and a "Document (optional)"; press "Add to the register". "Remove" takes any item off. Under "Activities", record one with its "Kind" (an FDP, a workshop, an extension activity, NSS, NCC, a guest lecture, an audit, a value-added course, career guidance and so on), "Title", "Date", "Participants (head count)", "Skill (skills programmes)" where it is one, "Staff who took part" and a "Document (optional)"; press "Add the activity". Teachers add their own research from their research page, HODs their department's activities, and the NSS and NCC officers' activities land here too; the predictor counts them all.

## How do I follow grievances and their time limits?

Open `/iqac/grievances` ("Student grievances"): "Each grievance with its fifteen-working-day limit. The office and the principal act; the IQAC reads the counts it cites." Choose a "Month" and press "Show"; the tiles count "Filed", "Resolved", "Within the limit", "Past the limit", "To the Ombudsperson" and "Open now". Each grievance shows its kind, who raised it (or "Name withheld"), the committee, "Due by {date}", "Past its time limit" when overdue, and its state ("Waiting for the committee", "The committee is looking into it", "Resolved", "With the Ombudsperson"). The buttons "Acknowledge", "Resolve" and "Send to the Ombudsperson" are the office's and the principal's; ragging and harassment are read by them alone, and you see that such a grievance exists. The grievance committee's minutes are kept by the office with the other committees.

## How do I keep a peer-team visit file?

Open `/iqac/visits` ("Peer-team visits"): "The visit's schedule, the evidence index and the SAR pack in one place, for NAAC and NBA." "Make the file as soon as the dates are known."

1. Under "A new visit", choose "For" (NAAC, or NBA at an engineering college), give the "Title", the "NAAC cycle" or the "Department", "Academic year begins", "First day" and "Last day" (at most seven days), and "The visiting team" one a line as name, role. Press "Make the file".
2. The "SAR pack" reads the cycle's IIQA, SSR and AQARs from the filings with their state and hash, and the CGPA as last computed; "Not generated yet: {kinds}" names what is missing.
3. Under "Schedule", add each slot with "Day", "From", "To", "What happens", "Where" and "Who takes it"; press "Add the slot".
4. Under "Evidence index", add a line with "Criterion or metric" (as 3.2.1 or 4.5), "What it is", what it "Points at" ("Filing", "IQAC file", "Metric's score", "NBA worksheet", "Link" or "Note") and the target; press "Add the line". The badges count lines per criterion; a line whose target is gone reads "Missing".
5. "Download the index (CSV)" gives the team's table; "Mark the visit done" when it is over.

An engineering department's HOD keeps their own NBA visits; the principal and the office read every file.

## How do I read the faculty records?

Open `/admin/faculty-records` ("Faculty records"): "What NAAC, NIRF and AICTE count about each teacher: designation, appointment, qualification, experience and the API score inputs. The PAN is sealed and shown by its last four." The heading gives "{students} students to {fullTime} full-time teachers". Each teacher's card shows their designation, "API score {score}", "{fdps} FDPs · {publications} publications" and "Incomplete" where the record is not whole. The office writes these records; you read them, and they feed the predictor's faculty metrics and each teacher's public page.

## How do I read the placement table?

Only when the college has the Placement module on. Open `/placement/analytics` ("Placement table"): "Computed from the offers and the profiles on every read. NBA, NIRF and the cell's own rates come from the same rows." "The batches" gives three years of "Final year (N)", "Placed (X)", "Higher studies (Y)", "Entrepreneurs (Z)", the "Placement index" and the "Median salary"; "NBA sheet", "NIRF sheet" and "The batch's offers" download as CSV. "Published seasons" is the table as the placement cell published it, which the filings read. You read it; the placement officer publishes and sets the season.

## How do I use the assistant, and manage my own account?

Open `/assistant` or press the launcher in the top bar. For the IQAC the assistant answers questions about using the platform (which page, which steps); topic questions are for students and teachers. Press "New conversation", type "Your question" and press "Ask"; conversations are kept thirty days. Your own leave is at `/account/leave` ("Leave": "Apply for leave" with "First day away", "Last day away", "Kind of leave" and "Why"; the office or the principal decides), your check-in at `/account/attendance` ("I'm in"), your appointment letters at `/account/letters` ("My letters", each with a "PDF"), and `/account` holds your sign-in, language, appearance and devices. `/remarks` ("Messages", "New message") and `/bulletin` ("Social Media", "New post") are the college's messages and feed. The assistant also answers figures from the IQAC's own pages (open grievances, the cycle's CGPA, the registers' counts, a survey's responses), from the platform's own figures, and under "Sources" it links the post or the message thread it read.
