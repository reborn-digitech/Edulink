# Demo schools

Two complete demo schools built by `npm run demo:schools` (apps/web). Every account below signs in with the same password:

**Password for every demo account: `Relay-Demo-2026`**

Re-running the script is safe; it adds nothing the second time and resets every password to the one above.

| | Sunrise Public School | Saraswati Vidya Mandir |
|---|---|---|
| Slug / school id | `sunrise-public-school` / `cmubsk1ea0001gnndzlk0ipvb` | `saraswati-vidya-mandir` / `cmubsk3r005r2gnndrv8yhuer` |
| Join code | SUNRI-HKPF | SARAS-DM6F |
| City, board, medium | Pune · CBSE · English | Nashik · MSBSHSE · Marathi (app locale `mr`) |
| Filing identity | UDISE 27250200201, affiliation 1130456, Haveli block | UDISE 27200300301, index 20.03.001, Nashik block |
| Grades | 5–10, one class per grade (section A), 8 pupils each | 5–10, one class per grade (section A), 8 pupils each |
| Directory page | /explore/cmubsk1ea0001gnndzlk0ipvb | /explore/cmubsk3r005r2gnndrv8yhuer |

## Staff — Sunrise Public School

| Email | Name | Role | Look at |
|---|---|---|---|
| sunrise.admin@demo.relay.test | Meenal Joshi | Admin | /admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies, /enquiries |
| sunrise.principal@demo.relay.test | Dr Rajesh Kulkarni | Principal | /principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant) |
| sunrise.teacher1@demo.relay.test | Priya Nair | Teacher · form, Grade 5 | /teacher, /teacher/classes/cmubsk1fn001agnndv57hga2a, /teacher/attendance?classId=cmubsk1fn001agnndv57hga2a, /bulletin |
| sunrise.teacher2@demo.relay.test | Sameer Deshpande | Teacher · form, Grade 6 | /teacher, /teacher/classes/cmubsk1ha002xgnnddzyxcbe7, /teacher/attendance?classId=cmubsk1ha002xgnnddzyxcbe7, /bulletin |
| sunrise.teacher3@demo.relay.test | Kavita Rao | Teacher · form, Grade 7 | /teacher, /teacher/classes/cmubsk1in004jgnnd0knv9kfw, /teacher/attendance?classId=cmubsk1in004jgnnd0knv9kfw, /bulletin |
| sunrise.teacher4@demo.relay.test | Arjun Mehta | Teacher · form, Grade 8 | /teacher, /teacher/classes/cmubsk1jz0066gnnde8rr67yd, /teacher/attendance?classId=cmubsk1jz0066gnnde8rr67yd, /bulletin |
| sunrise.teacher5@demo.relay.test | Neha Bhosale | Teacher · form, Grade 9 | /teacher, /teacher/classes/cmubsk1lg007tgnndqmlpwd1i, /teacher/attendance?classId=cmubsk1lg007tgnndqmlpwd1i, /bulletin |
| sunrise.teacher6@demo.relay.test | Vinod Sharma | Teacher · form, Grade 10 | /teacher, /teacher/classes/cmubsk1n4009ggnndc3p4dqlj, /teacher/attendance?classId=cmubsk1n4009ggnndc3p4dqlj, /bulletin |
| sunrise.subject1@demo.relay.test | Farida Sheikh | Teacher · subject only | /teacher (timetable, no form class) |
| sunrise.subject2@demo.relay.test | Rohit Patil | Teacher · subject only | /teacher (timetable, no form class) |
| sunrise.spare1@demo.relay.test | Anjum Qureshi | Teacher · unattached | /teacher (empty state), /vacancies (has applied to the other school), /enquiries |

## Staff — Saraswati Vidya Mandir

| Email | Name | Role | Look at |
|---|---|---|---|
| svm.admin@demo.relay.test | Sunil Wagh | Admin | /admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies, /enquiries |
| svm.principal@demo.relay.test | Vandana Pathak | Principal | /principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant) |
| svm.teacher1@demo.relay.test | Manisha Kale | Teacher · form, Grade 5 | /teacher, /teacher/classes/cmubsk3rt05sbgnndixs2zmlc, /teacher/attendance?classId=cmubsk3rt05sbgnndixs2zmlc, /bulletin |
| svm.teacher2@demo.relay.test | Prashant Gaikwad | Teacher · form, Grade 6 | /teacher, /teacher/classes/cmubsk3sj05tygnndpd9m9j8m, /teacher/attendance?classId=cmubsk3sj05tygnndpd9m9j8m, /bulletin |
| svm.teacher3@demo.relay.test | Sarika Bhagat | Teacher · form, Grade 7 | /teacher, /teacher/classes/cmubsk3t705vlgnndm2iair75, /teacher/attendance?classId=cmubsk3t705vlgnndm2iair75, /bulletin |
| svm.teacher4@demo.relay.test | Yogesh Sonawane | Teacher · form, Grade 8 | /teacher, /teacher/classes/cmubsk3tu05x7gnndob5k9vyw, /teacher/attendance?classId=cmubsk3tu05x7gnndob5k9vyw, /bulletin |
| svm.teacher5@demo.relay.test | Archana More | Teacher · form, Grade 9 | /teacher, /teacher/classes/cmubsk3um05yugnndwztnvjdb, /teacher/attendance?classId=cmubsk3um05yugnndwztnvjdb, /bulletin |
| svm.teacher6@demo.relay.test | Dattatray Pagar | Teacher · form, Grade 10 | /teacher, /teacher/classes/cmubsk3vb060hgnndbh02pgt6, /teacher/attendance?classId=cmubsk3vb060hgnndbh02pgt6, /bulletin |
| svm.subject1@demo.relay.test | Sheetal Ahire | Teacher · subject only | /teacher (timetable, no form class) |
| svm.subject2@demo.relay.test | Ganesh Tambe | Teacher · subject only | /teacher (timetable, no form class) |
| svm.spare1@demo.relay.test | Rupali Chavan | Teacher · unattached | /teacher (empty state), /vacancies (has applied to the other school), /enquiries |

## Pupils

Every pupil is a minor with a birthdate that fits the grade. Pupil accounts open /student, /student/practice, /student/record, /student/certificates, /report-cards and /bulletin. Parent accounts open /parent with the child switcher, /parent/fees, /parent/health, /parent/meetings, /parent/practice, /parent/certificates, /parent/applications and /enquiries.

### Sunrise Public School

| Class | Pupils | Parents |
|---|---|---|
| Grade 5 · A | Advait Kulkarni (sunrise.pupil01@demo.relay.test), Bhavya Shinde (sunrise.pupil02@demo.relay.test), Chirag Pawar (sunrise.pupil03@demo.relay.test), Diya Mehta (sunrise.pupil04@demo.relay.test), Eshaan Nair (sunrise.pupil05@demo.relay.test), Falak Kadam (sunrise.pupil06@demo.relay.test), Gauri Joshi (sunrise.pupil07@demo.relay.test), Harsh Gokhale (sunrise.pupil08@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN |
| Grade 6 · A | Aarav Deshmukh (aarav.deshmukh@demo.relay.test), Jai Verma (sunrise.pupil10@demo.relay.test), Kiara Bhosale (sunrise.pupil11@demo.relay.test), Laksh Patil (sunrise.pupil12@demo.relay.test), Mihika Deshpande (sunrise.pupil13@demo.relay.test), Nakul Jadhav (sunrise.pupil14@demo.relay.test), Ojaswini Sharma (sunrise.pupil15@demo.relay.test), Parth Reddy (sunrise.pupil16@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN; Aarav's parent is Sunita |
| Grade 7 · A | Rhea Kulkarni (sunrise.pupil17@demo.relay.test), Sarthak Shinde (sunrise.pupil18@demo.relay.test), Tara Pawar (sunrise.pupil19@demo.relay.test), Utkarsh Mehta (sunrise.pupil20@demo.relay.test), Vanya Nair (sunrise.pupil21@demo.relay.test), Yuvraj Kadam (sunrise.pupil22@demo.relay.test), Zara Joshi (sunrise.pupil23@demo.relay.test), Aditya Gokhale (sunrise.pupil24@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN |
| Grade 8 · A | Bhumi Iyer (sunrise.pupil25@demo.relay.test), Dhruv Verma (sunrise.pupil26@demo.relay.test), Esha Bhosale (sunrise.pupil27@demo.relay.test), Gautam Patil (sunrise.pupil28@demo.relay.test), Hiya Deshpande (sunrise.pupil29@demo.relay.test), Ishaan Jadhav (sunrise.pupil30@demo.relay.test), Jiya Sharma (sunrise.pupil31@demo.relay.test), Kabir Reddy (sunrise.pupil32@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN |
| Grade 9 · A | Lavanya Kulkarni (sunrise.pupil33@demo.relay.test), Manas Shinde (sunrise.pupil34@demo.relay.test), Nitya Pawar (sunrise.pupil35@demo.relay.test), Om Mehta (sunrise.pupil36@demo.relay.test), Pari Nair (sunrise.pupil37@demo.relay.test), Reyansh Kadam (sunrise.pupil38@demo.relay.test), Saanvi Joshi (sunrise.pupil39@demo.relay.test), Tanish Gokhale (sunrise.pupil40@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN |
| Grade 10 · A | Urvi Iyer (sunrise.pupil41@demo.relay.test), Vivaan Verma (sunrise.pupil42@demo.relay.test), Yashvi Bhosale (sunrise.pupil43@demo.relay.test), Aarna Patil (sunrise.pupil44@demo.relay.test), Darsh Deshpande (sunrise.pupil45@demo.relay.test), Ira Jadhav (sunrise.pupil46@demo.relay.test), Krish Sharma (sunrise.pupil47@demo.relay.test), Myra Reddy (sunrise.pupil48@demo.relay.test) | 5 of 8 have a parent: `sunrise.parentNN@demo.relay.test` for pupil NN |

### Saraswati Vidya Mandir

| Class | Pupils | Parents |
|---|---|---|
| Grade 5 · A | Aarohi Sonawane (svm.pupil01@demo.relay.test), Bhushan Jadhav (svm.pupil02@demo.relay.test), Chaitanya Kale (svm.pupil03@demo.relay.test), Devika More (svm.pupil04@demo.relay.test), Eknath Pagar (svm.pupil05@demo.relay.test), Gargi Borse (svm.pupil06@demo.relay.test), Hrishikesh Pawar (svm.pupil07@demo.relay.test), Ishwari Deshmukh (svm.pupil08@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN |
| Grade 6 · A | Jayesh Patil (svm.pupil09@demo.relay.test), Ketaki Wagh (svm.pupil10@demo.relay.test), Lalit Thakare (svm.pupil11@demo.relay.test), Mrunal Gaikwad (svm.pupil12@demo.relay.test), Ninad Shinde (svm.pupil13@demo.relay.test), Omkar Bhosale (svm.pupil14@demo.relay.test), Pranali Ahire (svm.pupil15@demo.relay.test), Rutuja Nikam (svm.pupil16@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN |
| Grade 7 · A | Anaya Deshmukh (anaya.deshmukh@demo.relay.test), Tejas Jadhav (svm.pupil18@demo.relay.test), Uma Kale (svm.pupil19@demo.relay.test), Vedant More (svm.pupil20@demo.relay.test), Yash Pagar (svm.pupil21@demo.relay.test), Aditi Borse (svm.pupil22@demo.relay.test), Bhargav Pawar (svm.pupil23@demo.relay.test), Chinmay Deshmukh (svm.pupil24@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN; Anaya's parent is Sunita |
| Grade 8 · A | Dnyaneshwari Patil (svm.pupil25@demo.relay.test), Girish Wagh (svm.pupil26@demo.relay.test), Hemangi Thakare (svm.pupil27@demo.relay.test), Ishan Gaikwad (svm.pupil28@demo.relay.test), Janhavi Shinde (svm.pupil29@demo.relay.test), Kunal Bhosale (svm.pupil30@demo.relay.test), Madhura Ahire (svm.pupil31@demo.relay.test), Nachiket Nikam (svm.pupil32@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN |
| Grade 9 · A | Onkar Sonawane (svm.pupil33@demo.relay.test), Pradnya Jadhav (svm.pupil34@demo.relay.test), Rohan Kale (svm.pupil35@demo.relay.test), Sanika More (svm.pupil36@demo.relay.test), Tanmay Pagar (svm.pupil37@demo.relay.test), Vaibhavi Borse (svm.pupil38@demo.relay.test), Yogita Pawar (svm.pupil39@demo.relay.test), Abhishek Deshmukh (svm.pupil40@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN |
| Grade 10 · A | Bhakti Patil (svm.pupil41@demo.relay.test), Darshan Wagh (svm.pupil42@demo.relay.test), Gayatri Thakare (svm.pupil43@demo.relay.test), Harshad Gaikwad (svm.pupil44@demo.relay.test), Kalyani Shinde (svm.pupil45@demo.relay.test), Mandar Bhosale (svm.pupil46@demo.relay.test), Nupur Ahire (svm.pupil47@demo.relay.test), Prathamesh Nikam (svm.pupil48@demo.relay.test) | 5 of 8 have a parent: `svm.parentNN@demo.relay.test` for pupil NN |

## The cross-school parent

| Email | Name | Phone | Children |
|---|---|---|---|
| sunita.deshmukh@demo.relay.test | Sunita Deshmukh | +91 98220 11223 | **Aarav Deshmukh** (aarav.deshmukh@demo.relay.test) in Sunrise Grade 6 · A, and **Anaya Deshmukh** (anaya.deshmukh@demo.relay.test) in Saraswati Grade 7 · A |

Sunita's pages: /parent (switch between the children with `?child=<membershipId>` — Aarav `cmubsk1he0032gnndh08eqxx0`, Anaya `cmubsk3t905vqgnndkuhrkr6a`), /parent/fees (a plan and demands at each school), /parent/health (both cards), /parent/certificates (a bonafide issued to Aarav; Anaya's pending ask), /parent/meetings (one booked at each school), /parent/practice (both children's quiz activity), /parent/applications, /enquiries (her admission enquiry to Saraswati about a third child: /enquiries/cmubsk57e0bkignndvhj0gbgh), /explore/cmubsk1ea0001gnndzlk0ipvb and /explore/cmubsk3r005r2gnndrv8yhuer, and the bell.

## The expert

| Email | Name | Look at |
|---|---|---|
| vikram.sethi@demo.relay.test | Dr Vikram Sethi | /expert (two confirmed "Robotics for grade 8" workshops next week: /expert/bookings/cmubsk57u0bl5gnnddkt3g1xf at Sunrise, /expert/bookings/cmubsk5810bldgnndd8fvskhh at Saraswati), /expert/availability (slots over the next two weeks), /mentoring/cmubsk5830bllgnnda3lqepvp (active mentorship with Lavanya Kulkarni, grade 9 at Sunrise, three messages), /expert/profile |
| anjali.rao@expert.test | Dr Anjali Rao (existing demo expert) | /expert/bookings/cmubsk58c0blvgnndouogyy95 — a careers talk booked by Saraswati |

## Workflows seeded, and where to see each

| Workflow | Where |
|---|---|
| People, roles, classes | /admin/people, /admin/classes, /admin/classes/<id>; /principal/staff |
| Timetable, Mon–Sat, 6 periods + a break, every class staffed | /admin/timetable, /teacher (today's lessons), /principal/timetable |
| Class registers, last 10 teaching days | /admin/attendance, /teacher/attendance?classId=<id>, /parent/attendance |
| Staff register, last 10 days, one late, one absent, today a check-in | /admin/staff-attendance |
| Leave: one pending (cover nominated), one approved | /principal/leave, /teacher/leave |
| Substitutions today (a subject teacher absent, a free colleague covering) | /admin/substitutions |
| Academic years: 2025–26 closed, 2026–27 current with two terms, 2027–28 waiting | /admin/settings, /admin/calendar |
| Last year's annual report card, published, for every pupil in grades 6–10 | /report-cards (pupil), /parent/grades → cards, /admin/report-cards |
| Term 1 exams and published term cards for grades 6 and 9 (a draft set too) | /admin/exams, /admin/report-cards, /teacher/classes/cmubsk1ha002xgnnddzyxcbe7/report-cards |
| Fees: a structure per grade, every pupil on a plan, two cash receipts per grade | /admin/fees, /admin/fees/dues, /parent/fees, /fees/receipts |
| Texts: every parent numbered, SMS and WhatsApp on, one broadcast sent | /admin/messaging |
| Health cards (three per school plus both Deshmukh children), one check-up | /parent/health, /admin/people → a pupil |
| Incidents: one closed, one open with a note | /admin/incidents, /teacher/incidents, /parent/incidents |
| Circular asking for an acknowledgement, told to every parent, opened by some | /admin/circulars, /bulletin/cmubsk2v0022rgnndkgf87dmq (Sunrise), /bulletin/cmubsk4gp07tsgnndo7qrm2bx (Saraswati) |
| Social feed: 8 posts per school (school, class, two by pupils, one pending review), comments, reads; a global post | /bulletin, /bulletin/global (post cmubsk58d0blzgnndre55ppcs), /teacher (review queue) |
| Syllabus for grades 6 and 9, progress and two lesson plans | /admin/syllabus, /admin/syllabus/coverage, /teacher/classes/<id>/syllabus |
| Certificates: templates in the school's language, issued papers (one answering an ask), asks pending and declined, pupil records for every class | /admin/certificates, /admin/certificates/issue, /admin/certificates/issued, /admin/records, /student/certificates, /certificates/check |
| Filings identity and readiness | /admin/filings |
| Admissions: an OPEN 2027–28 cycle for grades 5 and 6 with a test and sittings, seven applications from a parent of the other school in every state, one walk-in | /admin/admissions, /admin/admissions/applications, /explore/<schoolId>, /parent/applications (as the applying parent) |
| Vacancies: an open posting at each school with the other school's spare teacher applying | /admin/vacancies, /vacancies, /enquiries/cmubsk56w0bjmgnndwwubmaid (as svm.spare1@demo.relay.test or Sunrise's principal), /enquiries/cmubsk5770bjugnndu8gv854q |
| Admission enquiries from parents of the other school | /enquiries (as each school's admin) |
| Quiz practice: 2–5 finished attempts per pupil in grades 6–9 with badges | /student/practice, /parent/practice, /teacher/practice, /principal (practice insights) |
| Meetings: two teachers per school with slots next week, Sunita booked at each | /teacher/meetings, /parent/meetings |
| Experts: a published expert, slots, a confirmed workshop at each school with messages, an active mentorship | /experts, /experts/bookings/<id> (as an admin), /expert, /mentoring |

Not seeded: a review round (deliberately skipped as cheap only through the UI), fee refunds and online payments, competitions.
