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
    switch: "Switch",
    notificationsTitle: "Notifications",
    notificationsDescription: "What you are told, and when",
    appearanceTitle: "Appearance and reading",
    appearanceDescription: "Applies to this account on every device",
    devicesTitle: "Signed-in devices",
    devicesCount: "{count} active",
    unknownDevice: "Unknown device",
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
    emailOrLoginName: "Email or login name",
    emailLabel: "Email",
    emailPlaceholder: "you@school.org",
    emailOrHandlePlaceholder: "you@school.org or amara.k4f9",
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
    codeTitle: "Enter your code",
    codeHint:
      "Open your authenticator app and type the six-digit code. No recovery code to hand? Any of the ones you saved works here too.",
    signIn: "Sign in",
    recoveryUsed: "Recovery code used",
    recoveryUsedHint: "{count} left. Set two-factor up again to get a fresh set.",
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
} as const;
