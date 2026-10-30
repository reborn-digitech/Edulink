<!-- helpIndex: false -->
# Demo schools

Two complete demo schools built by `npm run demo:schools` (apps/web). Every account below signs in with the same password:

**Password for every demo account: `Relay-Demo-2026`**

Re-running the script is safe; it adds nothing the second time and resets every password to the one above.

**Pages behind a platform switch.** A path followed by "(behind X)" belongs to a part of the platform the operator switches on at /root/features (the vacancy board, expert and teacher sessions, mentoring, the practice pages, the assistant). While X is off, that page is the app's 404 for every account below, and the workflow row that names it describes data that waits for the switch. When this roster was written: ASSISTANT off, EXPERT_SESSIONS off, JOB_BOARD off, QUESTION_BANK off, QUESTION_GIG off, TEACHER_SESSIONS off, TEXT_MESSAGING off. `npm run demo:school-check` lists every such path as a fact.

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
| sunrise.admin@demo.relay.test | Meenal Joshi | Admin | /admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies (behind JOB_BOARD), /enquiries; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sunrise.principal@demo.relay.test | Dr Rajesh Kulkarni | Principal | /principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant) |
| sunrise.teacher1@demo.relay.test | Priya Nair | Teacher · form, Grade 5 | /teacher, /teacher/classes/cmubsk1fn001agnndv57hga2a, /teacher/attendance?classId=cmubsk1fn001agnndv57hga2a, /bulletin |
| sunrise.teacher2@demo.relay.test | Sameer Deshpande | Teacher · form, Grade 6 | /teacher, /teacher/classes/cmubsk1ha002xgnnddzyxcbe7, /teacher/attendance?classId=cmubsk1ha002xgnnddzyxcbe7, /bulletin |
| sunrise.teacher3@demo.relay.test | Kavita Rao | Teacher · form, Grade 7 | /teacher, /teacher/classes/cmubsk1in004jgnnd0knv9kfw, /teacher/attendance?classId=cmubsk1in004jgnnd0knv9kfw, /bulletin |
| sunrise.teacher4@demo.relay.test | Arjun Mehta | Teacher · form, Grade 8 | /teacher, /teacher/classes/cmubsk1jz0066gnnde8rr67yd, /teacher/attendance?classId=cmubsk1jz0066gnnde8rr67yd, /bulletin |
| sunrise.teacher5@demo.relay.test | Neha Bhosale | Teacher · form, Grade 9 | /teacher, /teacher/classes/cmubsk1lg007tgnndqmlpwd1i, /teacher/attendance?classId=cmubsk1lg007tgnndqmlpwd1i, /bulletin |
| sunrise.teacher6@demo.relay.test | Vinod Sharma | Teacher · form, Grade 10 | /teacher, /teacher/classes/cmubsk1n4009ggnndc3p4dqlj, /teacher/attendance?classId=cmubsk1n4009ggnndc3p4dqlj, /bulletin |
| sunrise.subject1@demo.relay.test | Farida Sheikh | Teacher · subject only | /teacher (timetable, no form class) |
| sunrise.subject2@demo.relay.test | Rohit Patil | Teacher · subject only | /teacher (timetable, no form class) |
| sunrise.spare1@demo.relay.test | Anjum Qureshi | Teacher · unattached | /teacher (empty state), /vacancies (behind JOB_BOARD) (has applied to the other school), /enquiries |
| sunrise.pupil49@demo.relay.test | Ayaan Bhatt | Alumnus (left grade 8) | /alumni, /bulletin, /remarks, /record |
| sunrise.driver01@demo.relay.test | Ramesh Gaikwad | Driver | /driver (2 routes on MH 12 SR 4521: Route 2 then Route 1, morning and evening; the week's trips ended, today's still to run until their time); riders aarav.deshmukh, sunrise.pupil11, sunrise.pupil17, sunrise.pupil25, sunrise.pupil33, sunrise.pupil41, sunrise.pupil07, sunrise.pupil12, sunrise.pupil18, sunrise.pupil26, sunrise.pupil34, sunrise.pupil42 |
| sunrise.librarian@demo.relay.test | Shalini Apte | Librarian | /library, /library/catalogue (40 titles, 66 copies, 14 in Devanagari), /library/overdue (four overdue), /library/reservations (one held, one queued), /library/fines (due, settled, waived), /library/reading-room |
| sunrise.warden@demo.relay.test | Prakash More | Warden | /hostel, /hostel/rollcall, /hostel/leave (one out, one asking), /hostel/rooms, /hostel/visitors, /hostel/menu — Tilak House; boarders sunrise.pupil01, sunrise.pupil03, sunrise.pupil05, sunrise.pupil45, sunrise.pupil47, sunrise.pupil02, sunrise.pupil04, sunrise.pupil06, sunrise.pupil44, sunrise.pupil46 |
| sunrise.attendant01@demo.relay.test | Sakharam Jadhav | Driver (bus attendant) | /driver (rides both routes as the attendant) |
| sunrise.warden2@demo.relay.test | Sunanda Gokhale | Warden | /hostel — Savitribai House |
| sunrise.support01@demo.relay.test | Sakharam Shinde | Support staff (cleaner), paid in cash | /account/payslips (the slip of last month, paid in cash), /account |
| sunrise.alumni01@demo.relay.test | Neha Kulkarni | Alumnus (left grade 10 in 2018), listed, mentor | /alumni, /alumni/directory, /alumni/staff, /bulletin |
| sunrise.alumni02@demo.relay.test | Rohan Deshpande | Alumnus (left grade 10 in 2019), listed | /alumni, /alumni/directory, /alumni/staff, /bulletin |
| sunrise.alumni03@demo.relay.test | Aditi Joshi | Alumnus (left grade 10 in 2021), listed | /alumni, /alumni/directory, /alumni/staff, /bulletin |
| sunrise.alumni04@demo.relay.test | Kunal Patil | Alumnus (left grade 10 in 2023), listed | /alumni, /alumni/directory, /alumni/staff, /bulletin |
| sunrise.alumni05@demo.relay.test | Sana Sheikh | Alumnus (left grade 10 in 2024), listed | /alumni, /alumni/directory, /alumni/staff, /bulletin |

## Staff — Saraswati Vidya Mandir

| Email | Name | Role | Look at |
|---|---|---|---|
| svm.admin@demo.relay.test | Sunil Wagh | Admin | /admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies (behind JOB_BOARD), /enquiries; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| svm.principal@demo.relay.test | Vandana Pathak | Principal | /principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant) |
| svm.teacher1@demo.relay.test | Manisha Kale | Teacher · form, Grade 5 | /teacher, /teacher/classes/cmubsk3rt05sbgnndixs2zmlc, /teacher/attendance?classId=cmubsk3rt05sbgnndixs2zmlc, /bulletin |
| svm.teacher2@demo.relay.test | Prashant Gaikwad | Teacher · form, Grade 6 | /teacher, /teacher/classes/cmubsk3sj05tygnndpd9m9j8m, /teacher/attendance?classId=cmubsk3sj05tygnndpd9m9j8m, /bulletin |
| svm.teacher3@demo.relay.test | Sarika Bhagat | Teacher · form, Grade 7 | /teacher, /teacher/classes/cmubsk3t705vlgnndm2iair75, /teacher/attendance?classId=cmubsk3t705vlgnndm2iair75, /bulletin |
| svm.teacher4@demo.relay.test | Yogesh Sonawane | Teacher · form, Grade 8 | /teacher, /teacher/classes/cmubsk3tu05x7gnndob5k9vyw, /teacher/attendance?classId=cmubsk3tu05x7gnndob5k9vyw, /bulletin |
| svm.teacher5@demo.relay.test | Archana More | Teacher · form, Grade 9 | /teacher, /teacher/classes/cmubsk3um05yugnndwztnvjdb, /teacher/attendance?classId=cmubsk3um05yugnndwztnvjdb, /bulletin |
| svm.teacher6@demo.relay.test | Dattatray Pagar | Teacher · form, Grade 10 | /teacher, /teacher/classes/cmubsk3vb060hgnndbh02pgt6, /teacher/attendance?classId=cmubsk3vb060hgnndbh02pgt6, /bulletin |
| svm.subject1@demo.relay.test | Sheetal Ahire | Teacher · subject only | /teacher (timetable, no form class) |
| svm.subject2@demo.relay.test | Ganesh Tambe | Teacher · subject only | /teacher (timetable, no form class) |
| svm.spare1@demo.relay.test | Rupali Chavan | Teacher · unattached | /teacher (empty state), /vacancies (behind JOB_BOARD) (has applied to the other school), /enquiries |
| svm.pupil49@demo.relay.test | Siddhesh Thakare | Alumnus (left grade 8) | /alumni, /bulletin, /remarks, /record |

## Pupils

Every pupil is a minor with a birthdate that fits the grade. Pupil accounts open /student, /student/practice (behind QUESTION_BANK), /student/record, /student/certificates, /report-cards and /bulletin. Parent accounts open /parent with the child switcher, /parent/fees, /parent/health, /parent/meetings, /parent/practice (behind QUESTION_BANK), /parent/certificates, /parent/applications and /enquiries.

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

Sunita's pages: /parent (switch between the children with `?child=<membershipId>` — Aarav `cmubsk1he0032gnndh08eqxx0`, Anaya `cmubsk3t905vqgnndkuhrkr6a`), /parent/fees (a plan and demands at each school), /parent/health (both cards), /parent/certificates (a bonafide issued to Aarav; Anaya's pending ask), /parent/meetings (one booked at each school), /parent/practice (behind QUESTION_BANK) (both children's quiz activity), /parent/applications, /enquiries (her admission enquiry to Saraswati about a third child: /enquiries/cmubsk57e0bkignndvhj0gbgh), /explore/cmubsk1ea0001gnndzlk0ipvb and /explore/cmubsk3r005r2gnndrv8yhuer, and the bell.

## The expert

| Email | Name | Look at |
|---|---|---|
| vikram.sethi@demo.relay.test | Dr Vikram Sethi | /expert (two confirmed "Robotics for grade 8" workshops next week: /expert/bookings/cmvq9uolg03m4gp4n2gw0e6cs (behind EXPERT_SESSIONS) at Sunrise, /expert/bookings/cmvq9uolo03mcgp4n7tbbj6lf (behind EXPERT_SESSIONS) at Saraswati), /expert/availability (behind EXPERT_SESSIONS) (slots over the next two weeks), /mentoring/cmubsk5830bllgnnda3lqepvp (behind EXPERT_SESSIONS) (active mentorship with Lavanya Kulkarni, grade 9 at Sunrise, three messages), /expert/profile |
| anjali.rao@expert.test | Dr Anjali Rao (existing demo expert) | /expert/bookings/cmvq9uolw03mmgp4nxnd67meb (behind EXPERT_SESSIONS) — a careers talk booked by Saraswati |

## Workflows seeded, and where to see each

| Workflow | Where |
|---|---|
| People, roles, classes | /admin/people, /admin/classes, /admin/classes/<id>; /principal/staff |
| Timetable, Mon–Sat, 6 periods + a break, every class staffed | /admin/timetable, /teacher (today's lessons), /principal/timetable |
| Class registers, last 10 open days; the whole of last year's register on the archived classes | /admin/attendance, /teacher/attendance?classId=<id>, /parent/attendance |
| School calendar for both years: holidays, an exam span, the annual day | /admin/calendar |
| Staff register, last 10 days, one late, one absent, today a check-in | /admin/staff-attendance |
| Leave: one pending (cover nominated), one approved | /principal/leave, /teacher/leave |
| Substitutions today (a subject teacher absent, a free colleague covering) | /admin/substitutions |
| Academic years: 2025–26 closed, 2026–27 current with two terms, 2027–28 waiting | /admin/settings, /admin/calendar |
| Last year's annual report card, published, for every pupil in grades 6–10 | /report-cards (pupil), /parent/grades → cards, /admin/report-cards |
| Term 1 exams and published term cards for grades 6 and 9 (a draft set too) | /admin/exams, /admin/report-cards, /teacher/classes/cmubsk1ha002xgnnddzyxcbe7/report-cards |
| Fees: a structure per grade, every pupil on a plan, two cash receipts per grade, a 25 % tuition concession (grade 7), a bus-fee refund on a cash payment (grade 6) | /admin/fees, /admin/fees/dues, /parent/fees, /fees/receipts |
| Texts: every parent numbered, SMS and WhatsApp on, one broadcast sent | /admin/messaging |
| Health cards (three per school plus both Deshmukh children), one check-up | /parent/health, /admin/people → a pupil |
| Incidents: one closed, one open with a note | /admin/incidents, /teacher/incidents, /parent/incidents |
| Circular asking for an acknowledgement, told to every parent, opened by some | /admin/circulars, /bulletin/cmubsk2v0022rgnndkgf87dmq (Sunrise), /bulletin/cmubsk4gp07tsgnndo7qrm2bx (Saraswati) |
| Social feed: 8 posts per school (school, class, two by pupils, one pending review), comments, reads; a global post | /bulletin, /bulletin/global (post cmubsk58d0blzgnndre55ppcs), /teacher (review queue) |
| Syllabus for grades 6 and 9, progress and two lesson plans | /admin/syllabus, /admin/syllabus/coverage, /teacher/classes/<id>/syllabus |
| Certificates: templates in the school's language, issued papers (one answering an ask), asks pending and declined, pupil records for every class | /admin/certificates, /admin/certificates/issue, /admin/certificates/issued, /admin/records, /student/certificates, /certificates/check |
| Filings identity and readiness | /admin/filings |
| Admissions: an OPEN 2027–28 cycle for grades 5 and 6 with a test and sittings, seven applications from a parent of the other school in every state, one walk-in | /admin/admissions, /admin/admissions/applications, /explore/<schoolId>, /parent/applications (as the applying parent) |
| Vacancies: an open posting at each school with the other school's spare teacher applying | /admin/vacancies (behind JOB_BOARD), /vacancies (behind JOB_BOARD), /enquiries/cmubsk56w0bjmgnndwwubmaid (as svm.spare1@demo.relay.test or Sunrise's principal), /enquiries/cmubsk5770bjugnndu8gv854q |
| Admission enquiries from parents of the other school | /enquiries (as each school's admin) |
| Quiz practice: 2–5 finished attempts per pupil in grades 6–9 with badges | /student/practice (behind QUESTION_BANK), /parent/practice (behind QUESTION_BANK), /teacher/practice (behind QUESTION_BANK), /principal (practice insights) |
| Meetings: two teachers per school with slots next week, Sunita booked at each | /teacher/meetings, /parent/meetings |
| Experts: a published expert, slots, a confirmed workshop at each school with messages, an active mentorship | /experts (behind EXPERT_SESSIONS), /experts/bookings/<id> (behind EXPERT_SESSIONS) (as an admin), /expert, /mentoring (behind EXPERT_SESSIONS) |
| A pending teacher invitation (`<school>.invite1@demo.relay.test`) | /admin/people → invitations |
| A remark thread between the grade-7 form teacher and a parent, the reply unread by the teacher | /teacher/remarks, /parent/remarks |
| An OPEN report on a comment under the robotics post | /admin/safety (or the review queue) |
| A practice assignment for grade 6 with a target level | /teacher/practice (behind QUESTION_BANK), /student/practice (behind QUESTION_BANK) |
| A grade-9 entry in the platform's "Autumn Science Fair" with a result and the school's standing | /competitions, /admin/competitions |
| A pupil who left in August with a transfer record (`<school>.pupil49`, Ayaan Bhatt / Siddhesh Thakare); a grade-8 departure scheduled for 30 April | /admin/people → departures, /admin/certificates |
| Pupil records with coded category and religion, caste, parents' occupations, income, the previous school's TC; staff records with dates of birth and of joining service; roll numbers in every class | /admin/records, /admin/filings, /student/record |
| Sunrise transport: 2 routes with 8 stops on MH 12 SR 4521 (sunrise.driver01 driving, sunrise.attendant01 attending), 12 riders (Route 1: aarav.deshmukh, sunrise.pupil11, sunrise.pupil17, sunrise.pupil25, sunrise.pupil33, sunrise.pupil41; Route 2: sunrise.pupil07, sunrise.pupil12, sunrise.pupil18, sunrise.pupil26, sunrise.pupil34, sunrise.pupil42), the last six open days' trips ended with the bus's track and the ticks, today's once over, the driver's location consent, an OPEN incident on Route 1, the Term 2 route fee raised per rider by the office's own route fees | /admin/transport, /admin/transport/trips/<id>, /driver, /parent/transport (as a rider's parent), /student/transport (as a rider), /admin/incidents, /parent/fees |
| Sunrise hostel: Tilak House (boys, sunrise.warden): sunrise.pupil01, sunrise.pupil03, sunrise.pupil05, sunrise.pupil45, sunrise.pupil47; Savitribai House (girls, sunrise.warden2): sunrise.pupil02, sunrise.pupil04, sunrise.pupil06, sunrise.pupil44, sunrise.pupil46; the week's menu, both roll calls of the last seven days, one boarder out on home leave (sunrise.pupil05), one back from last weekend, one ask waiting (sunrise.pupil04), a visitor yesterday, this month's mess bill per boarder by the office's own mess bill | /admin/hostel, /hostel, /hostel/rollcall, /hostel/leave, /hostel/night, /hostel/visitors, /hostel/menu, /student/hostel, /parent/hostel, /parent/fees |
| Sunrise library: 40 titles (14 in Devanagari: Hindi, Marathi, Sanskrit), 15 loans (four overdue, three back late with a fine due, settled and waived), two reservations (one copy held), the reading-room register; sunrise.librarian at the desk | /library, /library/catalogue, /library/overdue, /library/reservations, /library/fines, /library/reading-room, /student/library, /parent/library, /teacher/library (as sunrise.teacher2) |

## Sunrise's other modules (inventory, payroll, website, alumni, reviews, online payments)

| Module | What is there | Where |
|---|---|---|
| Inventory | 25 items in six categories, two vendors, 2 purchase records with their scanned bills, 14 issues (chalk to every form teacher, the games kit to the PE teacher, robotics kits and beakers from the lab, booklets to the exam desk, cleaner to housekeeping), 5 tagged assets (projectors in grades 9 and 10, the office laptop), a half-term stock count at the main store, one waiting ask from the grade-7 teacher | /admin/inventory, /admin/inventory/items, /admin/inventory/purchases, /admin/inventory/movements, /admin/inventory/assets, /admin/inventory/requests; /account/items as a teacher |
| Payroll | Settings, a teaching and a support structure, 17 salaries (bank for most, UPI for the driver and the warden, cash for the cleaner); 2026-09 PAID with 17 recorded payments (bank batch with UTRs, UPI with UTRs, cash), shared with the head, PF, bank and UPI files cut; 2026-10 DRAFT; a recorded advance (the PE teacher) and a waiting ask (the grade-6 teacher) | /admin/payroll, /admin/payroll/runs/2026-09, /admin/payroll/runs/2026-10, /admin/payroll/salaries, /admin/payroll/advances; /account/payslips as any member of staff |
| Website | Published, 6 pages (home, about, academics, admissions, gallery, contact); a school post with a picture as news and hero, the teachers' photos as an album (placeholder pictures, consent ticked), a prospectus PDF, one open review link (shown once when made), three days of visits, one new enquiry; www.sunrisepublicschool.test waiting for its DNS (PENDING_DNS) | /admin/website, /admin/website/publish, /admin/website/domain, /admin/website/review; /sites/sunrise-public-school as the admin or the head; http://sunrise-public-school.localhost:3000/ in development |
| Alumni | The feed open to alumni posts; 5 adult alumni each listed in the directory, sunrise.alumni01 a mentor; 6 alumni posts; sunrise.pupil49 (a minor, not listed) with a room with his grade-8 teacher; a note from the office | /admin/alumni; /alumni, /alumni/directory as an alumnus |
| Reviews | A parents' round answered (160 answers) and closed by the head; a pupils' round open (64 answers so far, grades 9 and 10) | /admin/reviews; /reviews as a grade 5–10 pupil |
| Online fees (TEST mode) | The school's gateway rzp_test_SunriseDemo2026 (TEST) on the devbox transport (no account anywhere is called) and its UPI id; online, paid (Nitya Pawar, sunrise.parent35: PAID); online, failed at the bank (Aarna Patil, sunrise.parent44: FAILED); upi, claim waiting for the office (Chirag Pawar, sunrise.parent03: CLAIMED); upi, claim confirmed by the office (Gautam Patil, sunrise.parent28: PAID) | /admin/fees/settings, /admin/fees/claims, /admin/fees; /parent/fees as each parent; /dev/payments as the operator |

A school has no faculty profiles (they are a college's), so the teachers' photos are an album on the Gallery page, not the Faculty page.

<!-- demo-college:begin -->
## Saraswati Arts and Science College (the demo college)

Built by `npm run demo:college` (from `apps/web`; idempotent, run it again to put things back; it does not need `demo:schools` first). Slug `saraswati-college`, join code `SARAS-CMRK-TX6R`, kind COLLEGE, Pune, affiliated to Savitribai Phule Pune University, AISHE C-41873 (made up), NAAC A until 31 December 2028. Every module the college is offered is on. The password is the demo schools' shared one, `Relay-Demo-2026`, for every account below. Sign in by hand, or for a browser check mint a session: `npm run zz:token -- ROLE email@demo.relay.test` (then `--purge`).

Dates (G4-29): the college is dated from the day the script runs (`scripts/demo-calendar.ts`). The academic year is the one whose odd term began most recently; its odd term (1 July to 30 November) is current and the even term before it past; every other date moves with them by whole years; the registers are the four Monday-to-Saturday weeks before the run's week, inside the odd term. From December to June the college shows the odd term just ended, since its offerings are odd-semester ones. A run over a college built for another academic year is refused (the script promotes nobody); `--calendar` prints the dates and writes nothing; `DEMO_TODAY=YYYY-MM-DD` pins the day.

What is in it: Physics (head Dr Vasudha Paranjpe) and Commerce (head Dr Sanjay Bhide); BSc Physics and BCom on the SPPU NEP 2024 scheme with programme and course outcomes; the odd term 2026–27 (current) and the even term 2025–26; divisions SY BSc Physics A, SY BCom A and FY BCom A; seven offerings on a Mon–Sat grid with lecture registers from 2026-09-28 to 2026-10-24 (dated from the run's day, demo-calendar.ts); internal marks countersigned and locked on PHY301 and COM301, PHY302's unit test waiting for a countersign; the Summer 2026 sitting with the university's result file imported and run 1 published (SGPA for every second-year student, one ATKT and its backlog); Sahyadri Data Labs Pvt Ltd (GSTIN checked by the TPO) with an OPEN drive and two applicants, last season's closed drive with the alumna's accepted offer and the 2025 season; a NAAC cycle (affiliated UG, 2022–27) computed by the IQAC desk, with faculty records, research, activities and three committees; the IQAC's own rows: the Student Satisfaction Survey 2025–26 closed with ten responses (the salt wiped, as the desk closes one) and its action-taken report, two RESOLVED grievances (a timetable clash and a scholarship not shown on a demand, both closed within fifteen working days, as the grievance committee's minutes say), and the 2025 AQAR built by the filings library, sent, signed off by the principal and FILED; fee structures by programme, year and category, a demand per semester for every student, four odd semesters paid by bank and one scholarship claim sanctioned.

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
| sac.registrar@demo.relay.test | Smita Kulkarni | Admin (registrar) | /admin | /admin/academics (programmes, terms, divisions, timetable), /admin/college-admissions, /accounts, /exam-cell, /placement; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sac.principal@demo.relay.test | Dr Anil Deshpande | PRINCIPAL | /principal | /principal/accreditation (the NAAC cycle), /exam-cell (results), /accounts/concessions |
| sac.hod.physics@demo.relay.test | Dr Vasudha Paranjpe | HOD | /hod | /hod/defaulters (Rutuja under 75 % in PHY301), /faculty (teaches PHY302, marks waiting for a countersign) |
| sac.hod.commerce@demo.relay.test | Dr Sanjay Bhide | HOD | /hod | /hod (Commerce: COM301 locked), /faculty (teaches COM302 and COM102) |
| sac.faculty1@demo.relay.test | Dr Neelima Gadgil | FACULTY | /faculty | PHY301: four weeks of registers, internal marks locked |
| sac.faculty2@demo.relay.test | Prof Rahul Shirole | FACULTY | /faculty | MAT301's registers |
| sac.faculty3@demo.relay.test | Prof Ashwini Mane | FACULTY | /faculty | COM301 (locked) and COM101 (the first years) |
| sac.exams@demo.relay.test | Prakash Joglekar | EXAM_CONTROLLER | /exam-cell | Summer 2026 sitting: result file imported, run 1 published, one ATKT and its backlog |
| sac.iqac@demo.relay.test | Dr Meghana Phadke | IQAC | /iqac | /iqac/predictor (the NAAC cycle's metrics and CGPA), /iqac/registers, /iqac/surveys (the closed Student Satisfaction Survey 2025–26, ten responses, its action-taken report), /iqac/grievances (two resolved), /iqac/documents (the 2025 AQAR, filed and signed off) |
| sac.tpo@demo.relay.test | Nitin Kale | TPO | /placement | /placement/drives (the OPEN drive with two applicants), /placement/companies, /placement/analytics (2025 season) |
| sac.accounts@demo.relay.test | Sushma Rane | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/structures, /accounts/scholarships |
| sac.student01@demo.relay.test | Aditya Patil | Student, SY BSc Physics (OPEN) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 7.00; applied to the open drive (/student/placement); odd semester paid |
| sac.student02@demo.relay.test | Sakshi Jadhav | Student, SY BSc Physics (OBC) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 8.00; OBC post-matric scholarship sanctioned (/student/scholarships, /student/money) |
| sac.student03@demo.relay.test | Omkar Shinde | Student, SY BSc Physics (OPEN) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 8.33; odd semester paid |
| sac.student04@demo.relay.test | Pranav Kulkarni | Student, SY BSc Physics (OPEN) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 8.00 |
| sac.student05@demo.relay.test | Rutuja Pawar | Student, SY BSc Physics (OBC) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 5.00; ATKT in PHY202 with a backlog; under 75 % in PHY301; not eligible for the open drive |
| sac.student06@demo.relay.test | Tejas More | Student, SY BCom (OPEN) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 8.43; applied to the open drive (/student/placement); odd semester paid |
| sac.student07@demo.relay.test | Snehal Gaikwad | Student, SY BCom (OBC) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 7.43 |
| sac.student08@demo.relay.test | Yash Chavan | Student, SY BCom (OPEN) | /student | /student/academics, /student/exams, /student/money; last term's SGPA 8.14 |
| sac.student09@demo.relay.test | Pooja Bhosale | Student, FY BCom (OPEN) | /student | /student/academics, /student/exams, /student/money; a minor of 17; her guardian sees everything; odd semester paid |
| sac.student10@demo.relay.test | Kunal Deshmukh | Student, FY BCom (OPEN) | /student | /student/academics, /student/exams, /student/money |
| sac.parent09@demo.relay.test | Ravindra Bhosale | Parent of Pooja Bhosale (a minor) | /parent | /parent/academics, /parent/results, /parent/fees |
| sac.alumni01@demo.relay.test | Shreya Wagh | Alumna (BCom, left May 2025) | /alumni | /alumni/college (placed through last season's drive, a mentor), the directory |
| recruiter.sahyadri@demo.relay.test | Kiran Mehendale | Recruiter, Sahyadri Data Labs Pvt Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |
<!-- demo-college:end -->

<!-- demo-college-stream:begin -->
## The demo colleges for every stream (demo:college-stream)

Built by `npm run demo:college-stream -- --all` (or `--stream=LAW`; from `apps/web`; `scripts/demo-college-stream.ts` with the spec table in `scripts/demo-college-stream-specs.ts`; idempotent, run it again to put things back) and checked by `npm run demo:college-check -- --slug=<slug>`. One generic script: the modules, filings and duties of each college are its stream's preset (STREAM_PRESETS, DUTY_BUILT). **The password for every account below is `Relay-Demo-2026`.** For a browser check mint a session: `npm run zz:token -- ROLE email@demo.relay.test` (then `--purge`).

Dates (G4-29): dated from the day the script runs (`scripts/demo-calendar.ts`), as the other demo colleges. In each college: this odd term's offerings with registers for the four weeks before the run's week, internal marks locked on one offering and waiting on another, last term's sitting published with grade cards (imported at an affiliated college, double entry at the autonomous one), this term's sitting in CONDUCT, fee structures with one scholarship sanctioned, a NAAC cycle computed, the year's filings generated, a NAAC peer-team visit file, the library, a hostel with its boarders, Route 1 with three riders, September's payroll locked. The law college's BCI return is last year's: generating a year's return freezes that year's moots (R-53), so this year's moot desk stays open.

### Saraswati Institute of Management (MANAGEMENT)

Slug `saraswati-management`, join code `SARAS-XRNT-WCD4`, kind COLLEGE, stream MANAGEMENT, Pune, affiliated to Savitribai Phule Pune University (AISHE C-41917, made up). Modules: the MANAGEMENT preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. Bachelor of Business Administration (Department of Business Administration, head Dr Shubhangi Natu) and Master of Business Administration (Department of Management Studies, head Dr Ajit Paranjape), regulator UGC and AICTE. Duties offered and given: NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NIRF 2026–27, AICTE_DISCLOSURE 2026–27, and last year's AQAR filed. 

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| sim.registrar@demo.relay.test | Sunil Bhagwat | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sim.principal@demo.relay.test | Dr Rekha Vaidya | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| sim.hod.dba@demo.relay.test | Dr Shubhangi Natu | HOD | /hod | /hod (Business Administration), the locked internal marks of BBA301, teaches BBA302 |
| sim.hod.dms@demo.relay.test | Dr Ajit Paranjape | HOD | /hod | /hod (Management Studies), MBA301's unit test waiting for the countersign, teaches MBA302 |
| sim.faculty1@demo.relay.test | Prof Amruta Joshi | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches BBA301 in BBA year 2 · A; /duties/nss; /duties/exam-squad |
| sim.faculty2@demo.relay.test | Prof Kunal Sabnis | FACULTY · NCC_OFFICER | /faculty | teaches BBA101 in BBA year 1 · A; /duties/ncc |
| sim.faculty3@demo.relay.test | Prof Nandini Rao | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches MBA301 in MBA year 2 · A; /duties/anti-ragging |
| sim.faculty4@demo.relay.test | Prof Tejas Mahajan | FACULTY · RESEARCH_DEAN | /faculty | teaches BBA102 in BBA year 1 · A; /duties/research |
| sim.exams@demo.relay.test | Dr Pradeep Kher | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| sim.iqac@demo.relay.test | Dr Sarika Phatak | IQAC | /iqac | /iqac/predictor, /iqac/documents (NIRF, AICTE_DISCLOSURE), /iqac/visits (the NAAC visit file) |
| sim.tpo@demo.relay.test | Ninad Kelkar | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| sim.accounts@demo.relay.test | Vaishali Jagtap | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| sim.librarian@demo.relay.test | Mangesh Sathe | LIBRARIAN | /library | the catalogue, one book out |
| sim.warden@demo.relay.test | Bharati Chavan | WARDEN | /hostel | Savitribai Hostel: its boarders, the squad's night round |
| sim.driver@demo.relay.test | Ramesh Shelar | DRIVER | /driver | Route 1 — Swargate to Kothrud, three riders |
| sim.student01@demo.relay.test | Gauri Deshmukh | STUDENT (OPEN) | /student | BBA year 2 · A; granted ATTENDANCE and RESULTS to Vivek Deshmukh; boards at Savitribai Hostel; odd semester paid |
| sim.student02@demo.relay.test | Harsh Agarwal | STUDENT (OPEN) | /student | BBA year 2 · A; applied to the open drive; a library book out; odd semester paid |
| sim.student03@demo.relay.test | Prachi Salunkhe | STUDENT (OBC) | /student | BBA year 2 · A; OBC post-matric scholarship sanctioned; boards at Savitribai Hostel; rides Route 1 |
| sim.student04@demo.relay.test | Aniket Bhonsle | STUDENT (OPEN) | /student | MBA year 2 · A; applied to the open drive; odd semester paid; an internship |
| sim.student05@demo.relay.test | Ritu Malhotra | STUDENT (OPEN) | /student | MBA year 2 · A; under 75 % in one course; boards at Savitribai Hostel |
| sim.student06@demo.relay.test | Sagar Kadam | STUDENT (OBC) | /student | MBA year 2 · A; ATKT with a backlog |
| sim.student07@demo.relay.test | Riya Deshmukh | STUDENT (OPEN) | /student | BBA year 1 · A; a minor of seventeen; Vivek Deshmukh sees everything; boards at Savitribai Hostel; rides Route 1; odd semester paid |
| sim.student08@demo.relay.test | Rohan Deshmukh | STUDENT (OPEN) | /student | BBA year 1 · A; a minor of seventeen; Vivek Deshmukh sees everything; rides Route 1 |
| sim.parent@demo.relay.test | Vivek Deshmukh | PARENT of Gauri Deshmukh, Riya Deshmukh, Rohan Deshmukh | /parent?child=cmuwjop310021gq80v7sj7u45 | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| sim.alumni01@demo.relay.test | Pooja Iyer | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| sim.recruiter@demo.relay.test | Shweta Menon | RECRUITER, Sahyadri Consulting Pvt Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati Law College (LAW)

Slug `saraswati-law`, join code `SARAS-CJHD-6F6G`, kind COLLEGE, stream LAW, Pune, affiliated to Savitribai Phule Pune University (AISHE C-41918, made up). Modules: the LAW preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. BA LLB (five-year integrated) (Department of Integrated Law, head Dr Medha Kulkarni) and LLB (three-year) (Department of Legal Studies, head Dr Rajendra Patwardhan), regulator BCI. Duties offered and given: NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: BCI_RETURN 2025–26, NIRF 2026–27, and last year's AQAR filed. 

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| slc.registrar@demo.relay.test | Anand Gadgil | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| slc.principal@demo.relay.test | Dr Jayashree Bapat | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| slc.hod.lawi@demo.relay.test | Dr Medha Kulkarni | HOD | /hod | /hod (Integrated Law), the locked internal marks of LAW301, teaches LAW302 |
| slc.hod.llb@demo.relay.test | Dr Rajendra Patwardhan | HOD | /hod | /hod (Legal Studies), LLB301's unit test waiting for the countersign, teaches LLB302 |
| slc.faculty1@demo.relay.test | Prof Saurabh Limaye | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches LAW301 in BALLB year 2 · A; /duties/nss; /duties/exam-squad |
| slc.faculty2@demo.relay.test | Prof Ketaki Ghate | FACULTY · NCC_OFFICER | /faculty | teaches LAW101 in BALLB year 1 · A; /duties/ncc |
| slc.faculty3@demo.relay.test | Prof Imran Shaikh | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches LLB301 in LLB year 2 · A; /duties/anti-ragging |
| slc.faculty4@demo.relay.test | Prof Leena D'Souza | FACULTY · RESEARCH_DEAN | /faculty | teaches LAW102 in BALLB year 1 · A; /duties/research |
| slc.exams@demo.relay.test | Dr Mohan Karve | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| slc.iqac@demo.relay.test | Dr Asmita Joglekar | IQAC | /iqac | /iqac/predictor, /iqac/documents (BCI_RETURN, NIRF), /iqac/visits (the NAAC visit file) |
| slc.tpo@demo.relay.test | Rahul Sawant | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| slc.accounts@demo.relay.test | Deepa Kulkarni | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| slc.librarian@demo.relay.test | Shrikant Mule | LIBRARIAN | /library | the catalogue, one book out |
| slc.warden@demo.relay.test | Suresh Gaikwad | WARDEN | /hostel | Ambedkar Hostel: its boarders, the squad's night round |
| slc.driver@demo.relay.test | Babasaheb Jadhav | DRIVER | /driver | Route 1 — Swargate to Shivajinagar, three riders |
| slc.student01@demo.relay.test | Aditi Ranade | STUDENT (OPEN) | /student | BALLB year 2 · A; granted ATTENDANCE and RESULTS to Milind Ranade; odd semester paid; in a moot; an internship |
| slc.student02@demo.relay.test | Kabir Sethi | STUDENT (OPEN) | /student | BALLB year 2 · A; applied to the open drive; boards at Ambedkar Hostel; a library book out; odd semester paid; in a moot |
| slc.student03@demo.relay.test | Mrunal Pawar | STUDENT (OBC) | /student | BALLB year 2 · A; OBC post-matric scholarship sanctioned; rides Route 1; in a moot |
| slc.student04@demo.relay.test | Faisal Qureshi | STUDENT (OPEN) | /student | LLB year 2 · A; applied to the open drive; boards at Ambedkar Hostel; odd semester paid; in a moot; an internship |
| slc.student05@demo.relay.test | Neha Bhosale | STUDENT (OPEN) | /student | LLB year 2 · A; under 75 % in one course; in a moot |
| slc.student06@demo.relay.test | Vinayak More | STUDENT (OBC) | /student | LLB year 2 · A; ATKT with a backlog; boards at Ambedkar Hostel; in a moot |
| slc.student07@demo.relay.test | Ishan Ranade | STUDENT (OPEN) | /student | BALLB year 1 · A; a minor of seventeen; Milind Ranade sees everything; boards at Ambedkar Hostel; rides Route 1; odd semester paid |
| slc.student08@demo.relay.test | Isha Ranade | STUDENT (OPEN) | /student | BALLB year 1 · A; a minor of seventeen; Milind Ranade sees everything; rides Route 1 |
| slc.parent@demo.relay.test | Milind Ranade | PARENT of Aditi Ranade, Ishan Ranade, Isha Ranade | /parent?child=cmuwjoiwu0021gq4lxah7dxou | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| slc.alumni01@demo.relay.test | Akshay Kulkarni | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| slc.recruiter@demo.relay.test | Meenal Kale | RECRUITER, Kale and Associates, Advocates (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati College of Education (EDUCATION)

Slug `saraswati-education`, join code `SARAS-MK3C-QGTC`, kind COLLEGE, stream EDUCATION, Pune, affiliated to Savitribai Phule Pune University (AISHE C-41919, made up). Modules: the EDUCATION preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.A. B.Ed. (Integrated Teacher Education Programme) (Department of Integrated Teacher Education, head Dr Vandana Kher) and B.Ed. (two-year) (Department of Education, head Dr Prakash Shinde), regulator NCTE. Duties offered and given: PRACTICE_TEACHING_COORDINATOR, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NCTE_RETURN 2026–27, NIRF 2026–27, and last year's AQAR filed. 

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| sce.registrar@demo.relay.test | Shailaja Dixit | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sce.principal@demo.relay.test | Dr Arvind Phadke | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| sce.hod.ite@demo.relay.test | Dr Vandana Kher | HOD | /hod | /hod (Integrated Teacher Education), the locked internal marks of ITE301, teaches ITE302 |
| sce.hod.edu@demo.relay.test | Dr Prakash Shinde | HOD | /hod | /hod (Education), BED301's unit test waiting for the countersign, teaches BED302 |
| sce.faculty1@demo.relay.test | Prof Manisha Kale | FACULTY · PRACTICE_TEACHING_COORDINATOR, RESEARCH_DEAN | /faculty | teaches ITE301 in ITEP year 2 · A; /duties/teaching-practice; /duties/research |
| sce.faculty2@demo.relay.test | Prof Sandeep Wagh | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches ITE101 in ITEP year 1 · A; /duties/nss; /duties/exam-squad |
| sce.faculty3@demo.relay.test | Prof Swapnali Ghorpade | FACULTY · NCC_OFFICER | /faculty | teaches BED301 in BED year 2 · A; /duties/ncc |
| sce.faculty4@demo.relay.test | Prof Yogesh Patil | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches ITE102 in ITEP year 1 · A; /duties/anti-ragging |
| sce.exams@demo.relay.test | Dr Kalpana Mehta | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| sce.iqac@demo.relay.test | Dr Nilesh Ambekar | IQAC | /iqac | /iqac/predictor, /iqac/documents (NCTE_RETURN, NIRF), /iqac/visits (the NAAC visit file) |
| sce.tpo@demo.relay.test | Archana Bhave | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| sce.accounts@demo.relay.test | Santosh Kamble | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| sce.librarian@demo.relay.test | Usha Deshpande | LIBRARIAN | /library | the catalogue, one book out |
| sce.warden@demo.relay.test | Sunita Pawar | WARDEN | /hostel | Tarabai Hostel: its boarders, the squad's night round |
| sce.driver@demo.relay.test | Vitthal Shinde | DRIVER | /driver | Route 1 — Swargate to Karve Nagar, three riders |
| sce.student01@demo.relay.test | Snehal Gokhale | STUDENT (OPEN) | /student | ITEP year 2 · A; granted ATTENDANCE and RESULTS to Sanjay Gokhale; odd semester paid |
| sce.student02@demo.relay.test | Tushar Mane | STUDENT (OPEN) | /student | ITEP year 2 · A; applied to the open drive; a library book out; odd semester paid; an internship |
| sce.student03@demo.relay.test | Komal Jadhav | STUDENT (OBC) | /student | ITEP year 2 · A; OBC post-matric scholarship sanctioned; boards at Tarabai Hostel; rides Route 1 |
| sce.student04@demo.relay.test | Rupali Thakur | STUDENT (OPEN) | /student | BED year 2 · A; applied to the open drive; boards at Tarabai Hostel; odd semester paid; posted for teaching practice |
| sce.student05@demo.relay.test | Mahesh Gavade | STUDENT (OPEN) | /student | BED year 2 · A; under 75 % in one course; posted for teaching practice |
| sce.student06@demo.relay.test | Shital Waghmare | STUDENT (OBC) | /student | BED year 2 · A; ATKT with a backlog; boards at Tarabai Hostel; posted for teaching practice |
| sce.student07@demo.relay.test | Sai Gokhale | STUDENT (OPEN) | /student | ITEP year 1 · A; a minor of seventeen; Sanjay Gokhale sees everything; rides Route 1; odd semester paid |
| sce.student08@demo.relay.test | Sara Gokhale | STUDENT (OPEN) | /student | ITEP year 1 · A; a minor of seventeen; Sanjay Gokhale sees everything; boards at Tarabai Hostel; rides Route 1 |
| sce.parent@demo.relay.test | Sanjay Gokhale | PARENT of Snehal Gokhale, Sai Gokhale, Sara Gokhale | /parent?child=cmuwjopp101wvgq80a631hxzf | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| sce.alumni01@demo.relay.test | Prajakta Joshi | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| sce.recruiter@demo.relay.test | Anjali Sharma | RECRUITER, Jnanadeep Educational Trust (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati College of Pharmacy (PHARMACY)

Slug `saraswati-pharmacy`, join code `SARAS-CJPC-4YR6`, kind COLLEGE, stream PHARMACY, Pune, affiliated to Savitribai Phule Pune University (AISHE C-41920, made up). Modules: the PHARMACY preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT, INVENTORY) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.Pharm (Department of Pharmaceutics, head Dr Shilpa Gadre) and D.Pharm (Department of Pharmaceutical Chemistry, head Dr Ravindra Ingle), regulator PCI. Duties offered and given: LAB_INCHARGE, CLINICAL_COORDINATOR, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: PCI_INSPECTION 2026–27, NIRF 2026–27, AICTE_DISCLOSURE 2026–27, and last year's AQAR filed. 

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| scp.registrar@demo.relay.test | Prashant Oak | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| scp.principal@demo.relay.test | Dr Madhuri Kulkarni | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| scp.hod.pceu@demo.relay.test | Dr Shilpa Gadre | HOD | /hod | /hod (Pharmaceutics), the locked internal marks of BP301, teaches BP302 |
| scp.hod.pchem@demo.relay.test | Dr Ravindra Ingle | HOD | /hod | /hod (Pharmaceutical Chemistry), DP301's unit test waiting for the countersign, teaches DP302 |
| scp.faculty1@demo.relay.test | Prof Sachin Bhalerao | FACULTY · LAB_INCHARGE, ANTI_RAGGING_SQUAD | /faculty | teaches BP301 in BPHARM year 2 · A; /duties/lab; /duties/anti-ragging |
| scp.faculty2@demo.relay.test | Prof Aparna Ghaisas | FACULTY · CLINICAL_COORDINATOR, RESEARCH_DEAN | /faculty | teaches BP101 in BPHARM year 1 · A; /duties/clinical; /duties/research |
| scp.faculty3@demo.relay.test | Prof Mayur Dhole | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches DP301 in DPHARM year 2 · A; /duties/nss; /duties/exam-squad |
| scp.faculty4@demo.relay.test | Prof Priti Rane | FACULTY · NCC_OFFICER | /faculty | teaches BP102 in BPHARM year 1 · A; /duties/ncc |
| scp.exams@demo.relay.test | Dr Vikram Bedekar | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| scp.iqac@demo.relay.test | Dr Seema Apte | IQAC | /iqac | /iqac/predictor, /iqac/documents (PCI_INSPECTION, NIRF, AICTE_DISCLOSURE), /iqac/visits (the NAAC visit file) |
| scp.tpo@demo.relay.test | Nitin Lokhande | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| scp.accounts@demo.relay.test | Jyoti Bhagat | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| scp.librarian@demo.relay.test | Anil Pethe | LIBRARIAN | /library | the catalogue, one book out |
| scp.warden@demo.relay.test | Dnyaneshwar Kale | WARDEN | /hostel | Dhanvantari Hostel: its boarders, the squad's night round |
| scp.driver@demo.relay.test | Shankar Pol | DRIVER | /driver | Route 1 — Swargate to Narhe, three riders |
| scp.student01@demo.relay.test | Tanmay Chitale | STUDENT (OPEN) | /student | BPHARM year 2 · A; granted ATTENDANCE and RESULTS to Hemant Chitale; boards at Dhanvantari Hostel; odd semester paid |
| scp.student02@demo.relay.test | Sakshi Nair | STUDENT (OPEN) | /student | BPHARM year 2 · A; applied to the open drive; a library book out; odd semester paid; an internship |
| scp.student03@demo.relay.test | Pranav Ghodke | STUDENT (OBC) | /student | BPHARM year 2 · A; OBC post-matric scholarship sanctioned; boards at Dhanvantari Hostel; rides Route 1 |
| scp.student04@demo.relay.test | Dhanashree Patil | STUDENT (OPEN) | /student | DPHARM year 2 · A; applied to the open drive; odd semester paid |
| scp.student05@demo.relay.test | Yogita Sonawane | STUDENT (OPEN) | /student | DPHARM year 2 · A; under 75 % in one course |
| scp.student06@demo.relay.test | Akash Mhaske | STUDENT (OBC) | /student | DPHARM year 2 · A; ATKT with a backlog; boards at Dhanvantari Hostel |
| scp.student07@demo.relay.test | Om Chitale | STUDENT (OPEN) | /student | BPHARM year 1 · A; a minor of seventeen; Hemant Chitale sees everything; boards at Dhanvantari Hostel; rides Route 1; odd semester paid |
| scp.student08@demo.relay.test | Ovi Chitale | STUDENT (OPEN) | /student | BPHARM year 1 · A; a minor of seventeen; Hemant Chitale sees everything; rides Route 1 |
| scp.parent@demo.relay.test | Hemant Chitale | PARENT of Tanmay Chitale, Om Chitale, Ovi Chitale | /parent?child=cmuwjoq0z0304gq80hanl4khr | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| scp.alumni01@demo.relay.test | Rucha Dandekar | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| scp.recruiter@demo.relay.test | Vikas Agashe | RECRUITER, Indrayani Pharmaceuticals Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati School of Architecture (ARCHITECTURE)

Slug `saraswati-architecture`, join code `SARAS-YM6P-P4XC`, kind AUTONOMOUS_COLLEGE, stream ARCHITECTURE, Pune, affiliated to Savitribai Phule Pune University (AISHE C-41921, made up). Modules: the ARCHITECTURE preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.Arch (Department of Architecture, head Dr Sunanda Mhatre) and M.Arch (Urban Design) (Department of Urban Design, head Dr Abhay Karandikar), regulator COA. Duties offered and given: STUDIO_COORDINATOR, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NIRF 2026–27, and last year's AQAR filed. **Not built here:** the Council of Architecture has no return kind in the app (DS-12); studios and juries are kept since 10 Oct 2026 (R-56, the studio half).

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| ssa.registrar@demo.relay.test | Kishor Vaze | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| ssa.principal@demo.relay.test | Dr Anuradha Naik | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| ssa.hod.arch@demo.relay.test | Dr Sunanda Mhatre | HOD | /hod | /hod (Architecture), the locked internal marks of AR301, teaches AR302 |
| ssa.hod.ud@demo.relay.test | Dr Abhay Karandikar | HOD | /hod | /hod (Urban Design), MA301's unit test waiting for the countersign, teaches MA302 |
| ssa.faculty1@demo.relay.test | Prof Rohit Paranjpe | FACULTY · STUDIO_COORDINATOR, RESEARCH_DEAN | /faculty | teaches AR301 in BARCH year 2 · A; /duties/studio; /duties/research |
| ssa.faculty2@demo.relay.test | Prof Gayatri Kanade | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches AR101 in BARCH year 1 · A; /duties/nss; /duties/exam-squad |
| ssa.faculty3@demo.relay.test | Prof Siddhesh Nene | FACULTY · NCC_OFFICER | /faculty | teaches MA301 in MARCH year 2 · A; /duties/ncc |
| ssa.faculty4@demo.relay.test | Prof Mitali Sarnaik | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches AR102 in BARCH year 1 · A; /duties/anti-ragging |
| ssa.exams@demo.relay.test | Dr Harish Deo | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT (a paper sealed, one assigned); Summer 2026 published (double entry), grade cards, one ATKT |
| ssa.iqac@demo.relay.test | Dr Vrushali Bendre | IQAC | /iqac | /iqac/predictor, /iqac/documents (NIRF), /iqac/visits (the NAAC visit file) |
| ssa.tpo@demo.relay.test | Amol Khedekar | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| ssa.accounts@demo.relay.test | Sangeeta Ware | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| ssa.librarian@demo.relay.test | Rajani Bapat | LIBRARIAN | /library | the catalogue, one book out |
| ssa.warden@demo.relay.test | Prakash Zende | WARDEN | /hostel | Laurie Baker Hostel: its boarders, the squad's night round |
| ssa.driver@demo.relay.test | Maruti Kokate | DRIVER | /driver | Route 1 — Swargate to Aundh, three riders |
| ssa.student01@demo.relay.test | Ananya Phadnis | STUDENT (OPEN) | /student | BARCH year 2 · A; granted ATTENDANCE and RESULTS to Abhijit Phadnis; odd semester paid |
| ssa.student02@demo.relay.test | Devansh Kapoor | STUDENT (OPEN) | /student | BARCH year 2 · A; applied to the open drive; boards at Laurie Baker Hostel; a library book out; odd semester paid; an internship |
| ssa.student03@demo.relay.test | Shravani Kumbhar | STUDENT (OBC) | /student | BARCH year 2 · A; OBC post-matric scholarship sanctioned; rides Route 1 |
| ssa.student04@demo.relay.test | Nikhil Dabholkar | STUDENT (OPEN) | /student | MARCH year 2 · A; applied to the open drive; boards at Laurie Baker Hostel; odd semester paid |
| ssa.student05@demo.relay.test | Tanvi Rege | STUDENT (OPEN) | /student | MARCH year 2 · A; under 75 % in one course |
| ssa.student06@demo.relay.test | Omkar Hande | STUDENT (OBC) | /student | MARCH year 2 · A; ATKT with a backlog; boards at Laurie Baker Hostel |
| ssa.student07@demo.relay.test | Arnav Phadnis | STUDENT (OPEN) | /student | BARCH year 1 · A; a minor of seventeen; Abhijit Phadnis sees everything; boards at Laurie Baker Hostel; rides Route 1; odd semester paid |
| ssa.student08@demo.relay.test | Avani Phadnis | STUDENT (OPEN) | /student | BARCH year 1 · A; a minor of seventeen; Abhijit Phadnis sees everything; rides Route 1 |
| ssa.parent@demo.relay.test | Abhijit Phadnis | PARENT of Ananya Phadnis, Arnav Phadnis, Avani Phadnis | /parent?child=cmuwjoqeh048sgq80czss8902 | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| ssa.alumni01@demo.relay.test | Siddharth Vaidya | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| ssa.recruiter@demo.relay.test | Kavya Iyer | RECRUITER, Studio Vastu Architects LLP (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati College of Agriculture (AGRICULTURE)

Slug `saraswati-agriculture`, join code `SARAS-TVWM-NVGQ`, kind COLLEGE, stream AGRICULTURE, Shirur, affiliated to Mahatma Phule Krishi Vidyapeeth, Rahuri (AISHE C-41922, made up). Modules: the AGRICULTURE preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.Sc. (Hons) Agriculture (Department of Agronomy, head Dr Bhaskar Thorat) and B.Sc. (Hons) Horticulture (Department of Horticulture, head Dr Sunita Kharade), regulator ICAR. Duties offered and given: LAB_INCHARGE, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NIRF 2026–27, and last year's AQAR filed. **Not built here:** the farm and field work are not kept (the registrar's home says so); ICAR has no return kind in the app.

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| sca.registrar@demo.relay.test | Dattatray Jagtap | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sca.principal@demo.relay.test | Dr Shivaji Pawar | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| sca.hod.agro@demo.relay.test | Dr Bhaskar Thorat | HOD | /hod | /hod (Agronomy), the locked internal marks of AGR301, teaches AGR302 |
| sca.hod.hort@demo.relay.test | Dr Sunita Kharade | HOD | /hod | /hod (Horticulture), HOR301's unit test waiting for the countersign, teaches HOR302 |
| sca.faculty1@demo.relay.test | Prof Ganesh Bhosale | FACULTY · LAB_INCHARGE, RESEARCH_DEAN | /faculty | teaches AGR301 in BSCAG year 2 · A; /duties/lab; /duties/research |
| sca.faculty2@demo.relay.test | Prof Rupali Kadam | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches AGR101 in BSCAG year 1 · A; /duties/nss; /duties/exam-squad |
| sca.faculty3@demo.relay.test | Prof Santosh Nalawade | FACULTY · NCC_OFFICER | /faculty | teaches HOR301 in BSCHORT year 2 · A; /duties/ncc |
| sca.faculty4@demo.relay.test | Prof Priyanka Gaikwad | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches AGR102 in BSCAG year 1 · A; /duties/anti-ragging |
| sca.exams@demo.relay.test | Dr Ashok Kale | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| sca.iqac@demo.relay.test | Dr Manjusha Raut | IQAC | /iqac | /iqac/predictor, /iqac/documents (NIRF), /iqac/visits (the NAAC visit file) |
| sca.tpo@demo.relay.test | Vijay Shitole | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| sca.accounts@demo.relay.test | Sudhir Dhumal | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| sca.librarian@demo.relay.test | Kavita Wable | LIBRARIAN | /library | the catalogue, one book out |
| sca.warden@demo.relay.test | Balasaheb Ghule | WARDEN | /hostel | Krishi Hostel: its boarders, the squad's night round |
| sca.driver@demo.relay.test | Hanumant Khaire | DRIVER | /driver | Route 1 — Shirur bus stand to the college, three riders |
| sca.student01@demo.relay.test | Pratiksha Shinde | STUDENT (OPEN) | /student | BSCAG year 2 · A; granted ATTENDANCE and RESULTS to Ramdas Shinde; odd semester paid |
| sca.student02@demo.relay.test | Rohit Gade | STUDENT (OPEN) | /student | BSCAG year 2 · A; applied to the open drive; boards at Krishi Hostel; a library book out; odd semester paid; an internship |
| sca.student03@demo.relay.test | Swati Lokhande | STUDENT (OBC) | /student | BSCAG year 2 · A; OBC post-matric scholarship sanctioned; rides Route 1 |
| sca.student04@demo.relay.test | Akshay Daund | STUDENT (OPEN) | /student | BSCHORT year 2 · A; applied to the open drive; boards at Krishi Hostel; odd semester paid |
| sca.student05@demo.relay.test | Pooja Jagdale | STUDENT (OPEN) | /student | BSCHORT year 2 · A; under 75 % in one course |
| sca.student06@demo.relay.test | Sachin Kolekar | STUDENT (OBC) | /student | BSCHORT year 2 · A; ATKT with a backlog; boards at Krishi Hostel |
| sca.student07@demo.relay.test | Yash Shinde | STUDENT (OPEN) | /student | BSCAG year 1 · A; a minor of seventeen; Ramdas Shinde sees everything; boards at Krishi Hostel; rides Route 1; odd semester paid |
| sca.student08@demo.relay.test | Yashashri Shinde | STUDENT (OPEN) | /student | BSCAG year 1 · A; a minor of seventeen; Ramdas Shinde sees everything; rides Route 1 |
| sca.parent@demo.relay.test | Ramdas Shinde | PARENT of Pratiksha Shinde, Yash Shinde, Yashashri Shinde | /parent?child=cmuwjoqpo05bmgq80dxdhu7l5 | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| sca.alumni01@demo.relay.test | Ajinkya Pawar | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| sca.recruiter@demo.relay.test | Mahesh Kulkarni | RECRUITER, Godavari Agro Inputs Pvt Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |

### Saraswati Vocational College (VOCATIONAL)

Slug `saraswati-vocational`, join code `SARAS-WFCD-MPKR`, kind COLLEGE, stream VOCATIONAL, Pimpri-Chinchwad, affiliated to Savitribai Phule Pune University (AISHE C-41923, made up). Modules: the VOCATIONAL preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.Voc. Software Development (Department of Software Development, head Dr Smita Bendre) and B.Voc. Food Processing (Department of Food Processing, head Dr Ajay Mahajan), regulator UGC. Duties offered and given: LAB_INCHARGE, NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NIRF 2026–27, and last year's AQAR filed. 

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| svc.registrar@demo.relay.test | Ravindra Lad | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| svc.principal@demo.relay.test | Dr Shubhada Joshi | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| svc.hod.vsd@demo.relay.test | Dr Smita Bendre | HOD | /hod | /hod (Software Development), the locked internal marks of VSD301, teaches VSD302 |
| svc.hod.vfp@demo.relay.test | Dr Ajay Mahajan | HOD | /hod | /hod (Food Processing), VFP301's unit test waiting for the countersign, teaches VFP302 |
| svc.faculty1@demo.relay.test | Prof Amit Kshirsagar | FACULTY · LAB_INCHARGE, RESEARCH_DEAN | /faculty | teaches VSD301 in BVSD year 2 · A; /duties/lab; /duties/research |
| svc.faculty2@demo.relay.test | Prof Sneha Bhat | FACULTY · NSS_OFFICER, EXAM_SQUAD | /faculty | teaches VSD101 in BVSD year 1 · A; /duties/nss; /duties/exam-squad |
| svc.faculty3@demo.relay.test | Prof Rahul Dhage | FACULTY · NCC_OFFICER | /faculty | teaches VFP301 in BVFP year 2 · A; /duties/ncc |
| svc.faculty4@demo.relay.test | Prof Kirti Sontakke | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches VSD102 in BVSD year 1 · A; /duties/anti-ragging |
| svc.exams@demo.relay.test | Dr Anil Shinde | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| svc.iqac@demo.relay.test | Dr Medha Pande | IQAC | /iqac | /iqac/predictor, /iqac/documents (NIRF), /iqac/visits (the NAAC visit file) |
| svc.accounts@demo.relay.test | Sameer Borate | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| svc.librarian@demo.relay.test | Jayant Kulkarni | LIBRARIAN | /library | the catalogue, one book out |
| svc.warden@demo.relay.test | Nanda Pawar | WARDEN | /hostel | Ahilya Hostel: its boarders, the squad's night round |
| svc.driver@demo.relay.test | Ashok Gaikwad | DRIVER | /driver | Route 1 — Pimpri to Nigdi, three riders |
| svc.student01@demo.relay.test | Kshitija Mohite | STUDENT (OPEN) | /student | BVSD year 2 · A; granted ATTENDANCE and RESULTS to Dilip Mohite; boards at Ahilya Hostel; odd semester paid |
| svc.student02@demo.relay.test | Jay Solanki | STUDENT (OPEN) | /student | BVSD year 2 · A; a library book out; odd semester paid |
| svc.student03@demo.relay.test | Nikita Sawant | STUDENT (OBC) | /student | BVSD year 2 · A; OBC post-matric scholarship sanctioned; boards at Ahilya Hostel; rides Route 1 |
| svc.student04@demo.relay.test | Rahul Chavan | STUDENT (OPEN) | /student | BVFP year 2 · A; odd semester paid |
| svc.student05@demo.relay.test | Sayali Raut | STUDENT (OPEN) | /student | BVFP year 2 · A; under 75 % in one course; boards at Ahilya Hostel |
| svc.student06@demo.relay.test | Vishal Kamble | STUDENT (OBC) | /student | BVFP year 2 · A; ATKT with a backlog |
| svc.student07@demo.relay.test | Parth Mohite | STUDENT (OPEN) | /student | BVSD year 1 · A; a minor of seventeen; Dilip Mohite sees everything; rides Route 1; odd semester paid |
| svc.student08@demo.relay.test | Pari Mohite | STUDENT (OPEN) | /student | BVSD year 1 · A; a minor of seventeen; Dilip Mohite sees everything; boards at Ahilya Hostel; rides Route 1 |
| svc.parent@demo.relay.test | Dilip Mohite | PARENT of Kshitija Mohite, Parth Mohite, Pari Mohite | /parent?child=cmuwjor2e06jsgq80r6pm7x8t | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| svc.alumni01@demo.relay.test | Swapnil Desai | ALUMNUS (left May 2025) | /alumni | /alumni/college |

### Saraswati Institute of Health Sciences (HEALTH_SCIENCES)

Slug `saraswati-health`, join code `SARAS-WNHW-4R4J`, kind COLLEGE, stream HEALTH_SCIENCES, Nashik, affiliated to Maharashtra University of Health Sciences, Nashik (AISHE C-41924, made up). Modules: the HEALTH_SCIENCES preset's (ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC, PLACEMENT) and LIBRARY, HOSTEL, TRANSPORT, PAYROLL. B.Sc. Nursing (Department of Medical-Surgical Nursing, head Dr Shobha Wagh) and Post Basic B.Sc. Nursing (Department of Community Health Nursing, head Dr Rekha Deore), regulator INC. Duties offered and given: LAB_INCHARGE, CLINICAL_COORDINATOR, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD. Filings generated: NIRF 2026–27, and last year's AQAR filed. **Not built here:** the councils' returns (NMC, DCI, INC) are not built; the clinical desk is (/duties/clinical: the hospital with two wards, a rotation of two postings, a logbook entry in each state).

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
| sih.registrar@demo.relay.test | Mahendra Ahire | ADMIN (registrar) | /admin | /admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sih.principal@demo.relay.test | Dr Varsha Nikam | PRINCIPAL | /principal | /principal/college, /principal/accreditation, /iqac/documents |
| sih.hod.msn@demo.relay.test | Dr Shobha Wagh | HOD | /hod | /hod (Medical-Surgical Nursing), the locked internal marks of NUR301, teaches NUR302 |
| sih.hod.chn@demo.relay.test | Dr Rekha Deore | HOD | /hod | /hod (Community Health Nursing), PBN301's unit test waiting for the countersign, teaches PBN302 |
| sih.faculty1@demo.relay.test | Prof Jayashri Sonar | FACULTY · LAB_INCHARGE, EXAM_SQUAD | /faculty | teaches NUR301 in BSCN year 2 · A; /duties/lab; /duties/exam-squad |
| sih.faculty2@demo.relay.test | Prof Rajesh Bagul | FACULTY · CLINICAL_COORDINATOR | /faculty | teaches NUR101 in BSCN year 1 · A; /duties/clinical |
| sih.faculty3@demo.relay.test | Prof Manasi Kulkarni | FACULTY · ANTI_RAGGING_SQUAD | /faculty | teaches PBN301 in PBBSCN year 2 · A; /duties/anti-ragging |
| sih.faculty4@demo.relay.test | Prof Deepak Pagare | FACULTY · RESEARCH_DEAN | /faculty | teaches NUR102 in BSCN year 1 · A; /duties/research |
| sih.exams@demo.relay.test | Dr Sunil Gite | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT; Summer 2026 published (the university's file imported), grade cards, one ATKT |
| sih.iqac@demo.relay.test | Dr Asha Thakare | IQAC | /iqac | /iqac/predictor, /iqac/documents (NIRF), /iqac/visits (the NAAC visit file) |
| sih.tpo@demo.relay.test | Pankaj Borse | TPO | /placement | /placement/drives (the OPEN drive, two applicants), /placement/internships |
| sih.accounts@demo.relay.test | Lata Shewale | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked) |
| sih.librarian@demo.relay.test | Vandana Pingle | LIBRARIAN | /library | the catalogue, one book out |
| sih.warden@demo.relay.test | Shalini Gangurde | WARDEN | /hostel | Florence Hostel: its boarders, the squad's night round |
| sih.driver@demo.relay.test | Kailas Sangle | DRIVER | /driver | Route 1 — CBS to Gangapur Road, three riders |
| sih.student01@demo.relay.test | Priyanka Bachhav | STUDENT (OPEN) | /student | BSCN year 2 · A; granted ATTENDANCE and RESULTS to Nitin Bachhav; odd semester paid |
| sih.student02@demo.relay.test | Ashwini Kale | STUDENT (OPEN) | /student | BSCN year 2 · A; applied to the open drive; a library book out; odd semester paid; an internship |
| sih.student03@demo.relay.test | Bhagyashri Jadhav | STUDENT (OBC) | /student | BSCN year 2 · A; OBC post-matric scholarship sanctioned; boards at Florence Hostel; rides Route 1 |
| sih.student04@demo.relay.test | Manoj Pawar | STUDENT (OPEN) | /student | PBBSCN year 2 · A; applied to the open drive; odd semester paid |
| sih.student05@demo.relay.test | Sushma Patil | STUDENT (OPEN) | /student | PBBSCN year 2 · A; under 75 % in one course; boards at Florence Hostel |
| sih.student06@demo.relay.test | Kiran Gaikwad | STUDENT (OBC) | /student | PBBSCN year 2 · A; ATKT with a backlog; boards at Florence Hostel |
| sih.student07@demo.relay.test | Neel Bachhav | STUDENT (OPEN) | /student | BSCN year 1 · A; a minor of seventeen; Nitin Bachhav sees everything; rides Route 1; odd semester paid |
| sih.student08@demo.relay.test | Nidhi Bachhav | STUDENT (OPEN) | /student | BSCN year 1 · A; a minor of seventeen; Nitin Bachhav sees everything; boards at Florence Hostel; rides Route 1 |
| sih.parent@demo.relay.test | Nitin Bachhav | PARENT of Priyanka Bachhav, Neel Bachhav, Nidhi Bachhav | /parent?child=cmuwjorew07q9gq8009857kp9 | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| sih.alumni01@demo.relay.test | Monali Deshmukh | ALUMNUS (left May 2025) | /alumni | /alumni/college (placed through last season's drive) |
| sih.recruiter@demo.relay.test | Aditi Sathe | RECRUITER, Sanjeevani Multispeciality Hospital Pvt Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |
<!-- demo-college-stream:end -->

<!-- demo-transfer:begin -->
## The transferred pupil (demo:transfer)

Ishaan Pawar sat grade 5 at Sunrise Public School in 2025–26 and is in grade 6 at Saraswati Vidya Mandir in 2026–27. Built by `npm run demo:transfer` after `npm run demo:schools` (idempotent), through the real office functions: Sunrise's `recordDeparture` on 30 April 2026 (TC/2025–26/0001, reason TRANSFERRED, the alumnus kept), Saraswati's admission cycle "Mid-year admissions 2026–27 (transfers)", the father's walk-in application with the boy's PEN and date of birth, offer, acceptance, `admit` into Grade 6 · A with admission number SVM/2026/0107, then the father's guardian claim approved by the office. The password is the demo's, `Relay-Demo-2026`.

| Who | Email | Where to look |
| --- | --- | --- |
| Ishaan Pawar, the pupil (grade 6 at Saraswati; left grade 5 at Sunrise) | `ishaan.pawar@demo.relay.test` | /student (Saraswati), /student/record, /record (the Sunrise leaving certificate), /switch (the Sunrise alumnus side) |
| Prakash Pawar, his father | `prakash.pawar@demo.relay.test` | /parent (both schools), /parent/record?child=… ("Previous schools": Sunrise's TC and the annual report, as the guardian at Sunrise), /parent/fees |
| Saraswati's office (Sunil Wagh) | `saraswati.admin@demo.relay.test` | /admin/college-admissions is the college's; here /admin/admissions → "Mid-year admissions 2026–27 (transfers)" → the application (the admit panel's "Copy from the previous school's record", already copied), /admin/records → Ishaan (previous school, PEN, the copied category, religion, caste, mother tongue, place of birth, nationality and parents' names; "Previous schools": Sunrise's TC and last year's report card), /admin/people → Ishaan → the Sunrise certificate |
| Sunrise's office (Meenal Joshi) | `sunrise.admin@demo.relay.test` | /admin/people → departures → Ishaan (TC/2025–26/0001), /admin/certificates/issued, /alumni |

What the walk found is in the script's report (`npm run demo:transfer` prints it) and in docs/audit-2026-10-05/08-remaining-risks.md under the transfer gaps.
<!-- demo-transfer:end -->

<!-- demo-accounts:begin -->
## Three more demo accounts (demo:accounts)

Built by `npm run demo:accounts` (from `apps/web`; idempotent; after `demo:schools`, `demo:college` and `zz:fixtures`). The password is the shared `Relay-Demo-2026`.

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
| demo.expert01@demo.relay.test | Dr Kavita Ranade | EXPERT, through the public application (application cmvlvoint0002gp6c0tqmwygv, approved by the operator, invitation accepted, published and identity-checked) | /expert | /expert/availability (2 open slots), /expert/profile; the operator's /root/experts (the approved application) |
| demo.recruiter01@demo.relay.test | Rhea Fernandes | RECRUITER, Sahyadri Data Labs Pvt Ltd (invited by recruiter.sahyadri@demo.relay.test and accepted; no membership) | /recruiter | Saraswati Arts and Science College: OPEN; Saraswati Arts and Science College: CLOSED |
| demo.parent.two@demo.relay.test | Rohini Jadhav | PARENT of Nakul Jadhav (Sunrise Public School, grade 6) and Hrishikesh Pawar (Saraswati Vidya Mandir, grade 5) | /parent | the child switcher across two schools: `?child=cmubsk1i70045gnnd0cbs2cpb` and `?child=cmubsk3sf05tpgnndty15cuso`; /parent/fees at each school |
<!-- demo-accounts:end -->

<!-- demo-college-engineering:begin -->
## Saraswati Institute of Technology (the demo engineering college)

Built by `npm run demo:college-engineering` (from `apps/web`; `scripts/demo-college-engineering.ts`, a second script beside the arts college's; idempotent, run it again to put things back). Slug `saraswati-tech`, join code `SARAS-4MDF-N7W6`, kind AUTONOMOUS_COLLEGE, streams ENGINEERING, Pune, affiliated to Savitribai Phule Pune University for the degree and autonomous in conduct, AISHE C-41902 and an AICTE extension-of-approval reference (both made up), NAAC A until 31 March 2029. Every module a college is offered is on: the eight the ENGINEERING preset turns on and the four the roster's librarian, warden, driver and payroll need. The password is the demo schools' shared one, `Relay-Demo-2026`. For a browser check mint a session: `npm run zz:token -- ROLE email@demo.relay.test` (then `--purge`).

Dates (G4-29): the college is dated from the day the script runs (`scripts/demo-calendar.ts`). The academic year is the one whose odd term began most recently; its odd term (1 July to 30 November) is current and the even term before it past; every other date moves with them by whole years; the registers are the four Monday-to-Saturday weeks before the run's week, inside the odd term. From December to June the college shows the odd term just ended, since its offerings are odd-semester ones. A run over a college built for another academic year is refused (the script promotes nobody); `--calendar` prints the dates and writes nothing; `DEMO_TODAY=YYYY-MM-DD` pins the day.

What is in it: Computer Engineering (head Dr Anagha Kelkar) and Mechanical Engineering (head Dr Vikas Phadnis); BE programmes (AICTE, four years) on the institute's autonomous scheme "SIT Autonomous 2024" with programme and course outcomes; the odd term 2026–27 (current) and the even term 2025–26; divisions SE Computer A and B, SE Mechanical A and B and FE Computer A; lab batches A and B (capacity 20) in every second-year division and A in the first year's; ten offerings on a Mon–Sat grid, each lab course with one LAB hour per batch in Computer Lab 1 or the Strength of Materials Lab; registers from 2026-09-28 to 2026-10-24 (dated from the run's day, demo-calendar.ts), the LAB hours registered for their batch only; a practical record for every lab student (experiment 1 signed by the department's lab in-charge, CE301 experiment 2 in SE Computer A waiting for a signature); internal marks locked on CE301 in SE Computer A, ME302's unit test in SE Mechanical A waiting for a countersign; Winter 2026 in CONDUCT with hall tickets, the CE301 paper set by Prof Rasika Dixit and sealed, ME302's assigned to Prof Sameer Kulkarni; Summer 2026 published from marks the cell entered by double entry, a grade card for each of the ten who sat, one ATKT; Deccan Robotics Pvt Ltd (verified by the TPO) with an OPEN drive and two applicants, last season's closed drive with the alumnus's offer and the 2025 season, a SUMMER internship credited; NAAC's autonomous cycle (2023–28) computed; the NBA SAR for Computer Engineering for 2026–27 as a draft (75 marks from the records and 152 self-assessed by the HOD on three criteria, of 1,000); the AICTE mandatory disclosure published at /public/disclosure/saraswati-tech; fee structures under the FRA, a demand per semester, six odd semesters paid by bank, one scholarship claim sanctioned; Visvesvaraya Hostel (boys) with four boarders and the squad's night round; Route 1 with three riders; lab stock, three assets and one breadboard written off as a breakage; a salary for each of the fifteen staff and September's payroll locked; duties: a LAB_INCHARGE per department (Prof Nikhil Bapat, Prof Sameer Kulkarni), ANTI_RAGGING_SQUAD and NSS_OFFICER (Prof Rasika Dixit, three students enrolled, one activity), RESEARCH_DEAN (Dr Anagha Kelkar), EXAM_SQUAD (Prof Pallavi Sathe).

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
| sit.registrar@demo.relay.test | Madhavi Ranade | Admin (registrar) | /admin | /admin (the engineering home), /admin/academics, /admin/stream-records (lab batches, practicals), /admin/people (duties on the row menu), /accounts, /admin/inventory; holds the head's pages, given by the principal at /principal/staff: /principal/leave, /principal/trends, /admin/reviews, /admin/safety |
| sit.principal@demo.relay.test | Dr Shrikant Gokhale | PRINCIPAL | /principal | /principal/college, /principal/accreditation (the autonomous NAAC cycle), /exam-cell, /iqac/documents (the NBA SAR to sign off once sent) |
| sit.hod.comp@demo.relay.test | Dr Anagha Kelkar | HOD · RESEARCH_DEAN | /hod | /hod/nba?year=2026 (this year's SAR draft, three criteria written; the page opens on last year's, empty), /hod/practicals, /duties/research (holds RESEARCH_DEAN), /faculty (teaches CE302) |
| sit.hod.mech@demo.relay.test | Dr Vikas Phadnis | HOD | /hod | /hod (Mechanical), /hod/practicals, /faculty (teaches ME301 in SE Mechanical A) |
| sit.faculty1@demo.relay.test | Prof Nikhil Bapat | FACULTY · LAB_INCHARGE | /faculty | CE301 in SE Computer A (internal marks locked) and CE102; /duties/lab (LAB_INCHARGE, Computer Lab 1: stock, the breakage, rows to sign), /faculty/practicals |
| sit.faculty2@demo.relay.test | Prof Rasika Dixit | FACULTY · ANTI_RAGGING_SQUAD, NSS_OFFICER | /faculty | CE301 in SE Computer B and CE101; the CE301 paper set and sealed (/faculty/exams); /duties/anti-ragging and /duties/nss (ANTI_RAGGING_SQUAD, NSS_OFFICER) |
| sit.faculty3@demo.relay.test | Prof Sameer Kulkarni | FACULTY · LAB_INCHARGE | /faculty | ME302 in both SE Mechanical divisions (A's unit test waiting for a countersign), the ME302 paper assigned; /duties/lab (LAB_INCHARGE, Strength of Materials Lab) |
| sit.faculty4@demo.relay.test | Prof Pallavi Sathe | FACULTY · EXAM_SQUAD | /faculty | ME301 in SE Mechanical B; /duties/exam-squad (EXAM_SQUAD: the Winter 2026 papers ahead) |
| sit.exams@demo.relay.test | Dr Hemant Joshi | EXAM_CONTROLLER | /exam-cell | Winter 2026 in CONDUCT (the sealed CE301 paper, the ME302 paper assigned, hall tickets); Summer 2026 published (marks by double entry, grade cards, one ATKT) |
| sit.iqac@demo.relay.test | Dr Swati Marathe | IQAC | /iqac | /iqac/predictor (the autonomous cycle), /iqac/documents (the engineering filings, the NBA SAR draft, the AICTE disclosure published), /iqac/documents/nba?year=2026 (the SAR draft with its figures) |
| sit.tpo@demo.relay.test | Rahul Wagh | TPO | /placement | /placement/drives (Deccan Robotics' OPEN drive, two applicants), /placement/internships (the SUMMER internship), /placement/analytics (2025 season) |
| sit.accounts@demo.relay.test | Kavita Deshmukh | ACCOUNTS | /accounts | /accounts (collection, defaulters), /accounts/structures (FRA approvals), /accounts/scholarships, /admin/payroll (September locked) |
| sit.librarian@demo.relay.test | Sunanda Apte | LIBRARIAN | /library | the catalogue (engineering titles), one book out with Rohan |
| sit.warden@demo.relay.test | Ganesh Pawar | WARDEN | /hostel | four boarders (one a minor), the anti-ragging squad's round |
| sit.driver@demo.relay.test | Dattatray Kale | DRIVER | /driver | Route 1 — Hadapsar to campus, three riders |
| sit.student01@demo.relay.test | Aarya Kulkarni | Student, SE Computer A (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 6.50 (grade card); applied to the open drive; rides Route 1; NSS volunteer; odd semester paid |
| sit.student02@demo.relay.test | Rohan Deshpande | Student, SE Computer A (OBC) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 7.50 (grade card); OBC post-matric scholarship sanctioned; a library book out |
| sit.student03@demo.relay.test | Ishita Patil | Student, SE Computer A (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 9.00 (grade card); summer internship at Deccan Robotics, credited (/student/placement); rides Route 1; odd semester paid |
| sit.student04@demo.relay.test | Siddharth Joshi | Student, SE Computer B (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 7.50 (grade card); boards at Visvesvaraya Hostel; odd semester paid |
| sit.student05@demo.relay.test | Neha Gaikwad | Student, SE Computer B (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 7.50 (grade card) |
| sit.student06@demo.relay.test | Varun Shinde | Student, SE Computer B (OBC) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 8.00 (grade card); NSS volunteer |
| sit.student07@demo.relay.test | Aditya Pawar | Student, SE Mechanical A (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 8.50 (grade card); applied to the open drive; boards at Visvesvaraya Hostel; odd semester paid |
| sit.student08@demo.relay.test | Shruti More | Student, SE Mechanical A (OBC) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 8.00 (grade card); NSS volunteer |
| sit.student09@demo.relay.test | Omkar Jadhav | Student, SE Mechanical B (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 3.50 (grade card); ATKT in ME201 with a backlog; boards at Visvesvaraya Hostel |
| sit.student10@demo.relay.test | Pratik Bhosale | Student, SE Mechanical B (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); last term's SGPA 8.00 (grade card); under 75 % in ME302; odd semester paid |
| sit.student11@demo.relay.test | Anushka Kale | Student, FE Computer A (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); rides Route 1; a minor of 17; her guardian sees everything; odd semester paid |
| sit.student12@demo.relay.test | Yash Thorat | Student, FE Computer A (OPEN) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026); boards at Visvesvaraya Hostel; a minor of 17 |
| sit.parent11@demo.relay.test | Suresh Kale | Parent of Anushka Kale (a minor) | /parent | /parent/academics, /parent/results, /parent/fees, the bus (Route 1) |
| sit.alumni01@demo.relay.test | Kedar Limaye | Alumnus (BE Computer, left May 2025) | /alumni | /alumni/college (placed through last season's drive, a mentor) |
| sit.recruiter@demo.relay.test | Meera Iyer | Recruiter, Deccan Robotics Pvt Ltd (no membership) | /recruiter | the OPEN drive and its two consented applicants |
<!-- demo-college-engineering:end -->
