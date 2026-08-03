import type { Dictionary } from "./dictionary";

/**
 * हिन्दी.
 *
 * Typed `Dictionary`, so a key added to `en.ts` and not added here fails the
 * BUILD. That is the point of the annotation — without it this is just an object
 * that drifts quietly out of date.
 *
 * WRITTEN BY ME, NOT BY A NATIVE SPEAKER. The terms are the ones an Indian
 * school actually uses — हाज़िरी for the register, अभिभावक for a parent in the
 * school sense — but tone and register are the kind of thing only a teacher who
 * speaks it every day can judge. Treat this as a good first draft that a real
 * speaker should read before it goes near a real school. It is honest to ship
 * and honest to correct; what it is not is verified.
 *
 * Latin strings survive on purpose: "EduLink" is a name, "you@school.org" is an
 * example address, and "OpenDyslexic" is a font you install by that name.
 * `i18n.test.ts` lists them so the check that every other value was translated
 * stays a real check.
 */

export const hi: Dictionary = {
  nav: {
    overview: "अवलोकन",
    today: "आज",
    directory: "निर्देशिका",
    classes: "कक्षाएँ",
    invites: "आमंत्रण",
    bulletin: "सूचना पट",
    experts: "विशेषज्ञ",
    mentoring: "मार्गदर्शन",
    competitions: "प्रतियोगिताएँ",
    calendar: "कैलेंडर",
    safety: "सुरक्षा",
    settings: "सेटिंग्स",
    register: "हाज़िरी",
    work: "कार्य",
    messages: "संदेश",
    myWork: "मेरा कार्य",
    grades: "अंक",
    practice: "अभ्यास",
    me: "मैं",
    attendance: "उपस्थिति",
    bookings: "बुकिंग",
    availability: "उपलब्धता",
    profile: "प्रोफ़ाइल",
    account: "खाता",
    dashboard: "डैशबोर्ड",
    leave: "अवकाश",
    reportCards: "प्रगति पत्रक",
    staff: "स्टाफ़",
  },

  action: {
    invitePeople: "लोगों को आमंत्रित करें",
    invitePeopleHint: "अपने स्कूल में शिक्षक या विद्यार्थी जोड़ें",
    takeRegister: "हाज़िरी लें",
    takeRegisterHint: "आज की उपस्थिति दर्ज करें",
    offerTime: "समय उपलब्ध कराएँ",
    offerTimeHint: "ऐसा समय जोड़ें जिसे स्कूल बुक कर सकें",
    inviteTeacher: "शिक्षक को आमंत्रित करें",
    inviteTeacherHint: "आमंत्रण ईमेल भेजें",
    createClass: "कक्षा बनाएँ",
    createClassHint: "नई कक्षा या अनुभाग जोड़ें",
    schoolBranding: "स्कूल की पहचान",
    schoolBrandingHint: "लोगो और रंग",
    newAssignment: "नया कार्य",
    newAssignmentHint: "किसी कक्षा को कार्य दें",
    messageParent: "अभिभावक को संदेश भेजें",
    messageParentHint: "निजी बातचीत शुरू करें",
    whatIsDue: "क्या बाकी है",
    whatIsDueHint: "आपका आने वाला कार्य",
    shareSomething: "कुछ साझा करें",
    shareSomethingHint: "अपनी कक्षा के सूचना पट पर डालें",
    messageTeacher: "शिक्षक को संदेश भेजें",
    messageTeacherHint: "बातचीत शुरू करें",
    notificationSettings: "सूचना सेटिंग्स",
    notificationSettingsHint: "चुनें कि आपको क्या बताया जाए",
    editProfile: "प्रोफ़ाइल संपादित करें",
    editProfileHint: "परिचय, विवरण और विशेषज्ञता",
    reviewLeave: "अवकाश अनुरोध देखें",
    reviewLeaveHint: "छुट्टी स्वीकृत या अस्वीकृत करें",
    classInsights: "कक्षा की जानकारी",
    classInsightsHint: "कक्षा के अनुसार उपस्थिति और प्रगति",
    applyLeave: "अवकाश के लिए आवेदन करें",
    applyLeaveHint: "प्रधानाचार्य से छुट्टी माँगें",
  },

  shell: {
    mainNav: "मुख्य",
    search: "खोजें",
    switchRole: "भूमिका बदलें",
    notifications: "सूचनाएँ",
    notificationsUnread: "सूचनाएँ, {count} अपठित",
    yourAccount: "आपका खाता",
    signOut: "साइन आउट",
    yourChildren: "आपके बच्चे",
    skipToContent: "सामग्री पर जाएँ",
  },

  palette: {
    dialogLabel: "खोज और आदेश",
    placeholder: "पृष्ठ और क्रियाएँ खोजें…",
    inputLabel: "पृष्ठ और क्रियाएँ खोजें",
    groupActions: "क्रियाएँ",
    groupGoTo: "यहाँ जाएँ",
    empty: "“{query}” से कुछ नहीं मिला। किसी पृष्ठ का नाम आज़माएँ, जैसे “{example}”।",
    switchContext: "भूमिका या स्कूल बदलें",
    switchContextHint: "आप एक से अधिक से जुड़े हैं",
    accountEntry: "आपका खाता और दिखावट",
  },

  role: {
    admin: "स्कूल प्रशासक",
    adminPlural: "प्रशासक",
    principal: "प्रधानाचार्य",
    principalPlural: "प्रधानाचार्यगण",
    teacher: "शिक्षक",
    teacherPlural: "शिक्षकगण",
    student: "विद्यार्थी",
    studentPlural: "विद्यार्थीगण",
    parent: "अभिभावक",
    parentPlural: "अभिभावकगण",
    expert: "विशेषज्ञ",
    expertPlural: "विशेषज्ञगण",
  },

  language: {
    title: "भाषा",
    description: "हर डिवाइस पर इस खाते पर लागू होता है",
    groupLabel: "भाषा चुनें",
    readIn: "इसमें पढ़ें",
    saved: "भाषा बदल गई",
    partial:
      "नेविगेशन, आपका खाता और लॉगिन पृष्ठ अनूदित हैं। EduLink का बाकी हिस्सा अभी अंग्रेज़ी में है।",
  },

  account: {
    title: "आपका खाता",
    loginName: "लॉगिन नाम",
    noEmail: "कोई ईमेल नहीं",
    belongTitle: "आप कहाँ जुड़े हैं",
    belongOne: "एक जगह",
    belongMany: "आप कभी भी बदल सकते हैं",
    switch: "बदलें",
    notificationsTitle: "सूचनाएँ",
    notificationsDescription: "आपको क्या बताया जाए, और कब",
    appearanceTitle: "दिखावट और पठन",
    appearanceDescription: "हर डिवाइस पर इस खाते पर लागू होता है",
    devicesTitle: "साइन-इन डिवाइस",
    devicesCount: "{count} सक्रिय",
    unknownDevice: "अज्ञात डिवाइस",
  },

  prefs: {
    push: "पुश सूचनाएँ",
    pushHint: "अनुपस्थिति, नए अंक और शिक्षक के संदेश — ऐप बंद होने पर भी।",
    email: "ईमेल",
    emailHint: "ईमेल से एक प्रति। साइन-इन लिंक इस सेटिंग की परवाह किए बिना हमेशा आते हैं।",
    quietHours: "शांत समय",
    quietHoursHint:
      "इन समयों के बीच आपका फ़ोन नहीं बजेगा। संदेश फिर भी आते रहेंगे — वे आपको ऐप में दिखेंगे, इसलिए कुछ भी खोता नहीं।",
    useQuietHours: "शांत समय का उपयोग करें",
    from: "से",
    until: "तक",
    quietHoursMidnight: "आधी रात पार करना ठीक है — 21:00 से 07:00 वैसे ही काम करता है जैसा आप सोचते हैं।",
    saveNotifications: "सूचना सेटिंग्स सहेजें",
    saveAppearance: "दिखावट सहेजें",
    colourScheme: "रंग योजना",
    colourSchemeHint: "“सिस्टम” आपके फ़ोन या कंप्यूटर के अनुसार चलता है।",
    system: "सिस्टम",
    light: "हल्का",
    dark: "गहरा",
    contrast: "कंट्रास्ट",
    contrastHint: "उच्च कंट्रास्ट किनारों को ठोस और अक्षरों को पूरी तरह काला या सफ़ेद बनाता है।",
    normal: "सामान्य",
    high: "उच्च",
    typeface: "टाइपफ़ेस",
    typefaceHint:
      "डिस्लेक्सिया-अनुकूल अक्षरों और पंक्तियों के बीच जगह बढ़ाता है, और यदि आपने OpenDyslexic या Atkinson Hyperlegible इंस्टॉल किया है तो उनका उपयोग करता है।",
    default: "डिफ़ॉल्ट",
    dyslexic: "डिस्लेक्सिया-अनुकूल",
    motion: "गति",
    motionHint: "“कम” स्लाइड और उछाल हटा देता है। आपकी सिस्टम सेटिंग भी अपने आप मानी जाती है।",
    full: "पूरी",
    reduced: "कम",
    saved: "सहेज लिया",
    notSaved: "सहेजा नहीं गया",
    notSavedHint: "चिह्नित खानों को जाँचें।",
  },

  login: {
    title: "लॉग इन",
    welcome: "फिर से स्वागत है",
    subtitlePrefix: "अपने स्कूल में लॉग इन करें, या",
    joinWithCode: "कोड से जुड़ें",
    expired: "वह लिंक समाप्त हो चुका है। नीचे से नया माँगें।",
    newSchoolPrefix: "नया स्कूल शुरू कर रहे हैं?",
    registerHere: "इसे यहाँ पंजीकृत करें",
    emailOrLoginName: "ईमेल या लॉगिन नाम",
    emailLabel: "ईमेल",
    emailPlaceholder: "you@school.org",
    emailOrHandlePlaceholder: "you@school.org या amara.k4f9",
    studentHint: "विद्यार्थी: अपने स्कूल से मिला लॉगिन नाम उपयोग करें।",
    password: "पासवर्ड",
    submit: "लॉग इन करें",
    emailMeALink: "मुझे लिंक ईमेल करें",
    or: "या",
    useMagicLink: "इसके बजाय मुझे साइन-इन लिंक ईमेल करें",
    usePassword: "इसके बजाय मेरा पासवर्ड उपयोग करें",
    checkEmail: "अपना ईमेल देखें",
    magicSent:
      "यदि {email} के लिए कोई खाता है, तो साइन-इन लिंक भेजा जा रहा है। वह एक बार काम करता है और 20 मिनट में समाप्त हो जाता है।",
    useDifferentEmail: "कोई दूसरा ईमेल उपयोग करें",
    codeTitle: "अपना कोड डालें",
    codeHint:
      "अपना ऑथेंटिकेटर ऐप खोलें और छह अंकों का कोड डालें। कोड नहीं मिल रहा? आपने जो रिकवरी कोड सहेजे थे, उनमें से कोई भी यहाँ काम करेगा।",
    signIn: "साइन इन",
    recoveryUsed: "रिकवरी कोड उपयोग हुआ",
    recoveryUsedHint: "{count} बचे हैं। नया सेट पाने के लिए दो-चरणीय सत्यापन फिर से सेट करें।",
  },

  suspended: {
    title: "आपकी पहुँच रोकी गई है",
    one: "{school} ने आपकी पहुँच रोक दी है।",
    many: "इन स्कूलों ने आपकी पहुँच रोक दी है:",
    nothingLost:
      "कुछ भी मिटाया नहीं गया है। आपका कार्य, अंक और उपस्थिति सब अब भी सुरक्षित हैं, और पहुँच बहाल होने पर वे आपको वैसे ही मिलेंगे।",
    whatToDo:
      "इसे केवल स्कूल ही बहाल कर सकता है। यदि आपको लगता है कि यह गलती है, तो स्कूल कार्यालय से संपर्क करें।",
    stillYours:
      "यह केवल इन्हीं स्कूलों पर लागू होता है। EduLink पर आपका बाकी सब कुछ पहले की तरह चलता रहेगा।",
    signOut: "साइन आउट",
  },

  feature: {
    experts: "विशेषज्ञ",
    expertsTagline: "स्कूल के बाहर के किसी व्यक्ति के साथ सत्र बुक करें",
    mentoring: "मार्गदर्शन",
    mentoringTagline: "एक विशेषज्ञ, एक विद्यार्थी, लंबे समय तक",
    practice: "अभ्यास",
    practiceTagline: "ऐसे सवाल जो आपके बेहतर होने के साथ कठिन होते जाते हैं",
    calendar: "स्कूल कैलेंडर",
    academicYear: "शैक्षणिक वर्ष",
  },
};
