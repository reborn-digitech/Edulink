/**
 * English — the source dictionary.
 *
 * THIS FILE DEFINES THE TYPE. `hi.ts` and `mr.ts` are declared `Dictionary`,
 * which is `typeof en`, so adding a key here and forgetting to translate it is a
 * COMPILE error rather than an English word surfacing inside a Hindi sentence
 * six weeks later. That is the whole reason the dictionaries are TypeScript and
 * not JSON: JSON cannot fail a build.
 *
 * Keys are named for what the string MEANS, not what it says. `shell.signOut`
 * survives a copy change; `shell.signOutButton1` does not survive anything.
 *
 * `{name}` placeholders are substituted by `format()` in dictionary.ts. There is
 * deliberately no plural machinery: every counted string here reads correctly at
 * one and at many in all three languages ("3 unread", "1 unread"), and a plural
 * system nobody needs is a plural system nobody maintains. The day a string
 * needs real agreement, add it then, for that string.
 */

export const en = {
  /* ---------------------------------------------------------------------- */
  /* Navigation — the union of every NAV label, keyed by meaning              */
  /* ---------------------------------------------------------------------- */
  nav: {
    overview: "Overview",
    today: "Today",
    directory: "Directory",
    classes: "Classes",
    invites: "Invites",
    bulletin: "Bulletin",
    experts: "Experts",
    mentoring: "Mentoring",
    competitions: "Competitions",
    calendar: "Calendar",
    safety: "Safety",
    settings: "Settings",
    register: "Register",
    work: "Work",
    messages: "Messages",
    myWork: "My work",
    grades: "Grades",
    practice: "Practice",
    me: "Me",
    attendance: "Attendance",
    bookings: "Bookings",
    availability: "Availability",
    profile: "Profile",
    account: "Account",
    dashboard: "Dashboard",
    leave: "Leave",
    reportCards: "Report cards",
    staff: "Staff",
    timetable: "Timetable",
  },

  /* ---------------------------------------------------------------------- */
  /* Actions — the FAB and the command palette                               */
  /* ---------------------------------------------------------------------- */
  action: {
    invitePeople: "Invite people",
    invitePeopleHint: "Add teachers or students to your school",
    takeRegister: "Take the register",
    takeRegisterHint: "Mark today's attendance",
    offerTime: "Offer a time",
    offerTimeHint: "Add a slot schools can book",
    inviteTeacher: "Invite a teacher",
    inviteTeacherHint: "Send an invitation email",
    createClass: "Create a class",
    createClassHint: "Add a new class or section",
    buildTimetable: "Build the timetable",
    buildTimetableHint: "Set the school day and slot in lessons",
    schoolBranding: "School branding",
    schoolBrandingHint: "Logo and colours",
    newAssignment: "New assignment",
    newAssignmentHint: "Post work to a class",
    messageParent: "Message a parent",
    messageParentHint: "Start a private thread",
    whatIsDue: "What is due",
    whatIsDueHint: "Your upcoming work",
    shareSomething: "Share something",
    shareSomethingHint: "Post to your class bulletin",
    messageTeacher: "Message a teacher",
    messageTeacherHint: "Open a conversation",
    notificationSettings: "Notification settings",
    notificationSettingsHint: "Choose what you are told",
    editProfile: "Edit profile",
    editProfileHint: "Headline, bio and specialisms",
    reviewLeave: "Review leave requests",
    reviewLeaveHint: "Approve or decline time away",
    classInsights: "Class insights",
    classInsightsHint: "Attendance and progress by class",
    applyLeave: "Apply for leave",
    applyLeaveHint: "Ask the principal for time away",
  },

  /* ---------------------------------------------------------------------- */
  /* Form fields — shared by every form in the app                           */
  /* ---------------------------------------------------------------------- */
  field: {
    /**
     * Screen-reader-only, and it was the last English word on a fully
     * translated login form. Sighted readers get the red asterisk beside the
     * label; this is what the asterisk MEANS, said for somebody who cannot see
     * it — so leaving it in English told a Marathi reader nothing at all.
     */
    required: "(required)",
    /** dd/mm/yyyy everywhere, whatever the browser's locale says. */
    datePlaceholder: "dd/mm/yyyy",
    dateHint: "Day, month, year — for example 05/04/2026",
    dateInvalid: "Give the date as dd/mm/yyyy",
    openCalendar: "Open the calendar",
  },

  /* ---------------------------------------------------------------------- */
  /* The shell around every signed-in page                                   */
  /* ---------------------------------------------------------------------- */
  shell: {
    mainNav: "Main",
    search: "Search",
    switchRole: "Switch role",
    notifications: "Notifications",
    notificationsUnread: "Notifications, {count} unread",
    yourAccount: "Your account",
    signOut: "Sign out",
    yourChildren: "Your children",
    skipToContent: "Skip to content",
    serverAdmin: "Server administration",
    serverAdminHint: "Schools on this server",
    offline: "Offline — your changes are saved and will sync",
    homeLink: "EduLink home",
  },

  /* ---------------------------------------------------------------------- */
  /* ⌘K palette                                                              */
  /* ---------------------------------------------------------------------- */
  palette: {
    dialogLabel: "Search and commands",
    placeholder: "Search pages and actions…",
    inputLabel: "Search pages and actions",
    groupActions: "Actions",
    groupGoTo: "Go to",
    empty: "Nothing matches “{query}”. Try a page name like “{example}”.",
    switchContext: "Switch role or school",
    switchContextHint: "You belong to more than one",
    accountEntry: "Your account and appearance",
  },

  /* ---------------------------------------------------------------------- */
  /* Roles — on badges, in the side rail, in the switcher                    */
  /* ---------------------------------------------------------------------- */
  role: {
    admin: "School admin",
    adminPlural: "Admins",
    principal: "Principal",
    principalPlural: "Principals",
    teacher: "Teacher",
    teacherPlural: "Teachers",
    student: "Student",
    studentPlural: "Students",
    parent: "Parent",
    parentPlural: "Parents",
    expert: "Expert",
    expertPlural: "Experts",
  },

  /* ---------------------------------------------------------------------- */
  /* Language, and the switcher itself                                       */
  /* ---------------------------------------------------------------------- */
  language: {
    title: "Language",
    description: "Applies to this account on every device",
    groupLabel: "Choose a language",
    readIn: "Read in",
    saved: "Language changed",
    partial:
      "Navigation, your account and the login page are translated. The rest of EduLink is still in English.",
  },

  /* ---------------------------------------------------------------------- */
  /* The account page                                                        */
  /* ---------------------------------------------------------------------- */
  account: {
    title: "Your account",
    loginName: "Login name",
    noEmail: "No email",
    belongTitle: "Where you belong",
    belongOne: "One place",
    belongMany: "You can switch at any time",
    belongNone: "Not at a school just now",
    belongNoneBody: "You are not an active member of any school on EduLink. Your account, and anything a school recorded about you, stays yours.",
    switch: "Switch",
    notificationsTitle: "Notifications",
    notificationsDescription: "What you are told, and when",
    appearanceTitle: "Appearance and reading",
    appearanceDescription: "Applies to this account on every device",
    devicesTitle: "Signed-in devices",
    devicesCount: "{count} active",
    unknownDevice: "Unknown device",
    /**
     * Not called "merge". The people who need this do not have a word for it —
     * they have a situation, which is the one the description names.
     */
    /**
     * "Record", not "transcript" or "profile". A transcript is a document a
     * school issues; this is everything, and it is the child's.
     */
    recordTitle: "Your school record",
    recordDescription: "Report cards, attendance and badges — kept whatever school you are at",
    recordAction: "Open it",
    mergeTitle: "Another account?",
    mergeDescription: "Changed school and had to start again with a new login",
    mergeAction: "Join them",
  },

  /* ---------------------------------------------------------------------- */
  /* Appearance and notification preferences                                 */
  /* ---------------------------------------------------------------------- */
  prefs: {
    push: "Push notifications",
    pushHint: "Absences, new grades and teacher messages, even when the app is closed.",
    email: "Email",
    emailHint: "A copy by email. Sign-in links always arrive regardless of this setting.",
    quietHours: "Quiet hours",
    quietHoursHint:
      "Nothing will buzz your phone between these times. Messages still arrive — you will see them in the app, so nothing is ever lost.",
    useQuietHours: "Use quiet hours",
    from: "From",
    until: "Until",
    quietHoursMidnight: "Crossing midnight is fine — 21:00 until 07:00 works as you would expect.",
    saveNotifications: "Save notification settings",
    saveAppearance: "Save appearance",
    colourScheme: "Colour scheme",
    colourSchemeHint: "System follows your phone or computer.",
    system: "System",
    light: "Light",
    dark: "Dark",
    contrast: "Contrast",
    contrastHint: "High contrast makes borders solid and text pure black or white.",
    normal: "Normal",
    high: "High",
    typeface: "Typeface",
    typefaceHint:
      "Dyslexia-friendly widens letter spacing and line height, and uses OpenDyslexic or Atkinson Hyperlegible if you have them installed.",
    default: "Default",
    dyslexic: "Dyslexia-friendly",
    motion: "Motion",
    motionHint: "Reduced removes slides and bounces. Your system setting is honoured automatically too.",
    full: "Full",
    reduced: "Reduced",
    saved: "Saved",
    notSaved: "Not saved",
    notSavedHint: "Check the highlighted fields.",
  },

  /* ---------------------------------------------------------------------- */
  /* Logging in                                                              */
  /* ---------------------------------------------------------------------- */
  login: {
    title: "Log in",
    welcome: "Welcome back",
    subtitlePrefix: "Log in to your school, or",
    joinWithCode: "join with a code",
    expired: "That link has expired. Ask for a new one below.",
    newSchoolPrefix: "Setting up a new school?",
    registerHere: "Register it here",
    emailOrLoginName: "Email, mobile number or login name",
    emailLabel: "Email",
    emailPlaceholder: "you@school.org",
    emailOrHandlePlaceholder: "you@school.org, 98765 43210, or amara.k4f9",
    studentHint: "Students: use the login name your school gave you.",
    password: "Password",
    submit: "Log in",
    emailMeALink: "Email me a link",
    or: "or",
    useMagicLink: "Email me a sign-in link instead",
    usePassword: "Use my password instead",
    checkEmail: "Check your email",
    magicSent:
      "If an account exists for {email}, a sign-in link is on its way. It works once and expires in 20 minutes.",
    useDifferentEmail: "Use a different email",
    signIn: "Sign in",
    forgot: "Forgotten your password?",
  },

  /* ---------------------------------------------------------------------- */
  /* Access paused                                                           */
  /* ---------------------------------------------------------------------- */
  suspended: {
    title: "Your access is paused",
    one: "{school} has paused your access.",
    many: "These schools have paused your access:",
    nothingLost:
      "Nothing has been deleted. Your work, marks and attendance are all still there, and they will be waiting for you if access is restored.",
    whatToDo:
      "Only the school can restore it. Contact the school office if you think this is a mistake.",
    stillYours:
      "This affects these schools only. Anything else you use EduLink for still works as normal.",
    signOut: "Sign out",
  },

  /* ---------------------------------------------------------------------- */
  /* Feature names — the ones that used to be Sanskrit-derived               */
  /* ---------------------------------------------------------------------- */
  feature: {
    experts: "Experts",
    expertsTagline: "Book a session with someone from outside the school",
    mentoring: "Mentoring",
    mentoringTagline: "One expert, one pupil, over time",
    practice: "Practice",
    practiceTagline: "Questions that get harder as you get better",
    calendar: "School calendar",
    academicYear: "Academic year",
  },
  /* ---------------------------------------------------------------------- */
  /* A guardian's pages â the screens this product exists to put in a hand    */
  /* ---------------------------------------------------------------------- */
  parent: {
    consentTitle: "Waiting for you",
    consentBody: "They cannot take part until you say yes.",
    notTakenYet: "The register has not been taken yet",
    attendance: "Attendance",
    averageGrade: "Average grade",
    streak: "Attendance streak",
    noRecordsYet: "No records yet",
    lastFourWeeks: "Last 4 weeks",
    nothingGradedYet: "Nothing graded yet",
    // `{count}` is substituted by format(); see the note at the top of this
    // file on why there is no plural machinery.
    acrossPieces: "Across {count} pieces",
    streakStart: "Starts on the next day in",
    streakDays: "{count} school days in a row",
    recentAttendance: "Recent attendance",
    nothingRecordedYet: "Nothing recorded yet",
    attendanceEmpty: "Once the register is taken, it will show up here the moment it happens.",
    recentGrades: "Recent grades",
    newestFirst: "Newest first",
    progressReport: "Progress report",
    gradesEmpty: "Grades appear here as soon as a teacher returns work.",
    comingUp: "Coming up",
    workDueSoon: "Work due soon",
    nothingDue: "Nothing due right now.",
    noDueDate: "No due date",
    teacherMessages: "Teacher messages",
    teacherMessagesBody: "Private conversations about your child",
    open: "Open",
    noMessages: "No messages yet",
    noMessagesBody: "If a teacher wants a quiet word, it will arrive here — and you can reply.",
    linkAnother: "Link another child",
    work: "Work",

    overview: "Overview",
    reportCards: "Report cards",
    byCategory: "By category",
    everyPiece: "Every piece of work",
    noGradesYet: "No grades yet",
    gradesLongEmpty: "As soon as a teacher returns a piece of work, it will appear here with any comment they left.",
    whereMarksCome: "Where the marks are coming from",
    overall: "Overall",
    piecesGraded: "Pieces graded",
    subjects: "Subjects",
    issuedBy: "Issued by {name}",

    settings: "Settings",
    settingsBody: "How and when the school reaches you",
    linkAnotherShort: "Link another",
    linked: "Linked",
    notifications: "Notifications",
    whoYouHearAbout: "Who you hear about",
    yourAccount: "Your account",
    whatYouAreTold: "What you are told, and when",
    accountBody: "Appearance, signed-in devices and signing out",

    thisWeek: "This week",
    nextWeek: "Next →",
    noTimetableYet: "No timetable yet",
    nothingTimetabled: "Nothing timetabled this week",
    noSchoolDay: "{school} has not set its school day up. There is nothing to show until it does.",
    coverNote: "If a teacher is away, whoever is covering shows in their place.",
    week: "Week",

    sundaySession: "Sunday session",
    dayByDay: "Day by day",
    noAttendanceYet: "No attendance recorded yet",
    attendanceLongEmpty: "As soon as a teacher takes the register, every day will be listed here.",

    chooseChild: "Choose a child",
    seeDashboard: "See their dashboard",
    studentCode: "Student code",
    dateOfBirth: "Their date of birth",
    youAreTheir: "You are their…",
    codeHint: "On the letter from school, or in your child's app under Me",
    dobHint: "We ask for this so a code alone is never enough to see a child's record",
    goToDashboard: "Go to my dashboard",
    alreadyLinked: "Already linked",
    relationParent: "Parent",
    relationGuardian: "Guardian",
    relationOther: "Other family member",
    today: "Today",
    gradeLevel: "Grade {level}",
  },
  /* ---------------------------------------------------------------------- */
  /* The four marks a register can carry — shown to staff and to families     */
  /* ---------------------------------------------------------------------- */
  attendance: {
    present: "Present",
    presentShort: "P",
    presentHint: "Here on time",
    late: "Late",
    lateShort: "L",
    lateHint: "Arrived after the bell",
    absent: "Absent",
    absentShort: "A",
    absentHint: "Not here, no reason given",
    excused: "Excused",
    excusedShort: "E",
    excusedHint: "Away with a known reason",
  },
  /* ---------------------------------------------------------------------- */
  /* A pupil's own pages                                                     */
  /* ---------------------------------------------------------------------- */
  student: {
    today: "Today",
    whatIsDue: "What is due",
    nothingDue: "Nothing due right now",
    nothingDueBody: "Enjoy it. New work will show up here the moment a teacher sets it.",
    recentMarks: "Your recent marks",
    marksEmpty: "When a teacher marks your work, it will appear here.",
    yourAttendance: "Your attendance",
    attendanceEmpty: "Nothing recorded yet.",
    lastTwoWeeks: "The last two weeks",
    streak: "Streak",
    attendance: "Attendance",
    lastFourWeeks: "Last 4 weeks",
    myGrades: "My grades",
    reportCards: "Report cards",
    noGradesYet: "No grades yet",
    newestFirst: "Everything, newest first",
    issuedBy: "Issued by your class teacher",
    gradesEmpty: "When a teacher marks your work it appears here, along with anything they wrote to you.",
    overall: "Overall",
    marked: "Marked",
    yourBest: "Your best",
    pointsOf: "{earned} of {available} points",
    piecesOfWork: "Pieces of work",
    myWork: "My work",
    fromTeacher: "From your teacher",
    yourFiles: "Your files",
    markedAlready: "Marked already",
    workEmpty: "Nothing is waiting for you. New work shows up here the moment a teacher sets it.",
    handedIn: "Handed in",
    changeIt: "Change it",
    handItIn: "Hand it in",
    yourAnswer: "Your answer",
    cancel: "Cancel",
    handedInCheer: "Handed in 🎉",
    teacherTold: "Your teacher has been told about “{title}”.",
    answerPlaceholder: "Type or paste your work here.",
    myProfile: "My profile",
    howYouLook: "How you look",
    schoolsBeenTo: "Schools you have been to",
    yourBadges: "Your badges",
    classmatesSee: "Your teacher and classmates see this",
    recordNote: "Written by each school when you left. Your new school can see this too.",
    fullName: "Your full name",
    loginName: "Your login name",
    studentCode: "Student code",
    codeHint: "A grown-up at home needs this to link to you",
    nameHint: "Your full name is what your teacher sees on the register, so only they can change it.",
    unsaved: "Unsaved changes",
    save: "Save",
    notSaved: "Not saved",
    saved: "Saved",
    chooseAvatar: "Choose your avatar",
    callYou: "What should we call you?",
    aboutYou: "A bit about you",
    aboutPlaceholder: "I like football and I am learning the drums.",
    practice: "Practice",
    finished: "Finished",
    noTopics: "No practice topics yet",
    noTopicsBody: "Your school has not added any practice questions for your class yet.",
    subjects: "Subjects",
    badgeEarned: "Badge earned",
    welcomeBody: "This is your dashboard. Your work, your marks and your attendance all live here.",
    saveLogin: "Your login name — save this with a grown-up",
    copy: "Copy",
    useThis: "Use this and your password to log back in.",
    copied: "Login name copied",
    couldNotCopy: "Could not copy",
    writeItDown: "Write it down instead.",
    hideMessage: "Hide this message",
  },
  /* ---------------------------------------------------------------------- */
  /* A teacher's pages — the role staff live in every day                    */
  /* ---------------------------------------------------------------------- */
  teacher: {
    today: "Today",
    seeAll: "See all",
    registers: "Registers",
    registersLeft: "Registers left",
    classes: "Classes",
    toGrade: "To grade",
    comingUp: "Coming up",
    workDueIn: "Work due in your classes",
    nothingDue: "Nothing due. A good moment to set something.",
    noClassesYet: "No classes assigned yet",
    noClassesBody: "Ask an admin to add you to a class, and your day will appear here.",
    studentsCount: "{count} students",

    takeRegister: "Take the register",
    createClass: "Create a class",
    done: "Done",
    toDo: "To do",
    noRegisterToday: "No register for you today",
    noRegisterBody: "You are not down to mark any register today. An admin assigns class teachers, and can arrange cover if somebody is away.",
    notYourRegister: "This register is not yours today",
    notYoursBody: "An admin assigns who takes each register, and can arrange cover when somebody is away.",
    classNotFound: "That class could not be found",
    mayBeArchived: "It may have been archived.",

    searchClass: "Search this class",
    clearSearch: "Clear search",
    findStudent: "Find a student…",
    saving: "Saving…",
    notSaved: "Not saved",
    guardiansSeeNote: "Only staff and this student’s guardians can see this.",
    cancel: "Cancel",
    saveNote: "Save note",
    retry: "Retry",
    didNotSave: "That did not save",
    someNotSaved: "Some marks were not saved",
    markedPresent: "{count} marked present",
    nowChange: "Now just change the ones who are not.",
    noLongerInClass: "{count} student(s) are no longer in this class.",
    attendanceFor: "Attendance for {name}",
    noteFor: "Note for {name}",
    notePlaceholder: "Left early for a dentist appointment",

    assignments: "Assignments",
    newAssignment: "New assignment",
    setSomeWork: "Set some work",
    draft: "Draft",
    marked: "Marked",
    noAssignmentsYet: "No assignments yet",
    assignmentsBelong: "Assignments belong to a class. Once you have one, you can set work here.",
    assignmentsBelongAdmin: "Assignments belong to a class. Ask an admin to add you to one.",
    setWorkBlurb: "Set a piece of work and everyone in the class — and their families — is told straight away.",
    allAssignments: "All assignments",
    filesForClass: "Files for the class",
    markWork: "Mark work",

    stillDraft: "This is still a draft. Students cannot see it and nobody has been told.",
    publishNow: "Publish now",
    published: "Published",
    couldNotPublish: "Could not publish",
    classTold: "The class and their guardians have been told.",

    classField: "Class",
    title: "Title",
    instructions: "Instructions",
    instructionsHint: "Optional — students see this with the task.",
    handouts: "Handouts",
    handoutsHint: "Optional. Up to 5 files, 5 MB each — PDF or an image. Everyone in the class can open these once the work is set.",
    category: "Category",
    pointsAvailable: "Points available",
    pointsHint: "Leave blank for unmarked work.",
    dueDate: "Due date",
    dueTime: "Due time",
    dueTimeHint: "Defaults to the end of the school day.",
    saveAsDraft: "Save as draft",
    couldNotSave: "Could not save",
    titlePlaceholder: "Fractions worksheet 3",
    instructionsPlaceholder: "Complete questions 1–12. Show your working.",

    handedInLate: "Handed in late",
    notHandedIn: "Not handed in",
    handedIn: "Handed in",
    familySeesThis: "The student and their guardians see this.",
    saveMarks: "Save marks",
    checkMarks: "Check those marks",
    students: "Students",
    classAverage: "Class average",
    outstanding: "{count} outstanding",
    toGoCount: "{count} to go",
    markFor: "Mark for {name}",
    commentPlaceholder: "Lovely working out — keep showing your steps.",
    marksSaved: "{count} marks saved",

    myClasses: "My classes",
    noClassesAssigned: "No classes assigned to you yet",
    noClassesAssignedBody: "Ask an admin to add you to a class. Everything else — the register, work, messages — follows from there.",
    reportCards: "Report cards",
    reportCardsBlurb: "Choose the tests that count, write a remark, publish to families",
    noGuardian: "No guardian",
    setWork: "Set work",
    nothingSetYet: "Nothing set yet for this class.",
    whoIsInClass: "Who is in this class",
    nobodyJoined: "Nobody has joined yet",
    shareCodeBlurb: "Share the class code above and students can add themselves.",
    recentWork: "Recent work",
    attendanceOver: "Attendance over the last {days} days",
    registerToday: "Register today",
    toMark: "To mark",
    attendanceConcern: "Attendance concern",
    belowNinety: "Below 90% in {days} days",

    classJoinCode: "Class join code",
    studentsEnterAt: "Students enter this at",
    copy: "Copy",
    joinEduLink: "Join EduLink",
    goTo: "Go to",
    printIt: "Print it",
    noQr: "No QR code yet — students type the code above.",
    codeCopied: "Class code copied",
    couldNotCopy: "Could not copy",
    selectToCopy: "Select the code to copy it.",

    noPublishedWork: "This class has no published assignments yet. Set some work and mark it first.",
    reportName: "What this report is called",
    generateForClass: "Generate for the class",
    withdrawAll: "Withdraw all",
    preview: "Preview",
    draftsReady: "{count} drafts ready",
    notPublished: "Not published",
    cardsSent: "{count} report cards sent out",
    notWithdrawn: "Not withdrawn",
    withdrawnCount: "{count} withdrawn",
    remarkNotSaved: "Remark not saved",
    noMarkYet: "Nobody has a mark for this yet — it will be blank on every card",
    remarkPlaceholder: "A sentence for the family…",
    reports: "Reports",

    gradeWeights: "Grade weights",
    weightsBlurb: "Decide how much each kind of work counts towards this class",
    addCategory: "Add a category",
    saveWeights: "Save weights",
    weightsSaved: "Weights saved.",
    categoryName: "Category {n} name",
    categoryWeight: "Category {n} weight, percent",
    removeCategory: "Remove category {n}",
    categoryPlaceholder: "Homework",

    leave: "Leave",
    applyForLeave: "Apply for leave",
    kindOfLeave: "Kind of leave",
    whoCouldCover: "Who could cover your classes (optional)",
    coverHint: "A suggestion. The principal decides, and may name somebody else.",
    noSuggestion: "No suggestion",
    sendToPrincipal: "Send to the principal",
    sentToPrincipal: "Sent to the principal",
    firstDay: "First day away",
    lastDay: "Last day away",
    withdrawRequest: "Withdraw this request",
    withdrawn: "Withdrawn",
  },
} as const;
