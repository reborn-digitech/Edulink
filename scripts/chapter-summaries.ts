/**
 * One honest line per drill chapter, in three languages.
 *
 * Every generated topic used to carry the same sentence — "Generated practice
 * drills for class N. Every answer is machine-checked." — which made the
 * practice page read like a photocopy. This table replaces it with a line that
 * says what the chapter actually drills, written per chapter FAMILY (the slug
 * key shared across grades) with per-slug overrides wherever the treatment
 * deepens with the grade — G3's "pushes and pulls" and G11's "laws of motion"
 * are not the same chapter and must not share a sentence.
 *
 * Consumed in two places, deliberately the same table:
 *   - scripts/apply-chapter-summaries.ts writes it onto the live rows, and
 *   - scripts/gen-quiz-bank.ts (mkTopic) bakes it into any future regeneration,
 * so the database and a from-scratch rebuild can never disagree about a
 * chapter's one-liner.
 *
 * ⚠ The hi/mr lines are the author's own, like every other translated string
 * in this repository — a native reader must review them before a real school
 * relies on them.
 */

export type SummaryTriple = { en: string; hi: string; mr: string };

const S = (en: string, hi: string, mr: string): SummaryTriple => ({ en, hi, mr });

/**
 * Family defaults, keyed by the slug's tail (`drill-g7-eq7` → `eq7`).
 * These read truthfully at every grade the family spans; anything that only
 * reads truthfully at SOME grades lives in BY_SLUG below instead.
 */
const FAMILY: Record<string, SummaryTriple> = {
  /* Civics — the same four counting skills at every grade, dressed in that
     grade's institutions. */
  "civ-quorum": S(
    "How many members a meeting needs before it can decide — quorums, counted out.",
    "किसी बैठक को निर्णय लेने के लिए कितने सदस्य चाहिए — कोरम की गिनती।",
    "बैठकीला निर्णय घेण्यासाठी किती सदस्य लागतात — कोरमची मोजणी.",
  ),
  "civ-majority": S(
    "Votes for and against, and how many it takes to carry a decision.",
    "पक्ष और विपक्ष के मत — और निर्णय पारित होने के लिए कितने मत चाहिए।",
    "बाजूने आणि विरोधात मते — निर्णय मंजूर होण्यासाठी किती मते लागतात.",
  ),
  "civ-rep": S(
    "How many people each representative speaks for, worked out from the numbers.",
    "हर प्रतिनिधि कितने लोगों की आवाज़ है — आँकड़ों से निकालकर।",
    "प्रत्येक प्रतिनिधी किती लोकांचे प्रतिनिधित्व करतो — आकड्यांतून काढून.",
  ),
  "civ-term": S(
    "Terms of office and election years — working out when the next one falls.",
    "कार्यकाल और चुनाव के वर्ष — अगला चुनाव कब होगा, यह निकालना।",
    "कार्यकाळ आणि निवडणुकीची वर्षे — पुढची निवडणूक कधी, हे काढणे.",
  ),

  /* Economics */
  "eco-prices": S(
    "What things cost once discounts and taxes have taken their turn.",
    "छूट और कर लगने के बाद चीज़ों की असली कीमत।",
    "सूट आणि कर लागल्यावर वस्तूंची खरी किंमत.",
  ),
  "eco-income": S(
    "Earning, saving and spending — income arithmetic from daily life.",
    "कमाई, बचत और खर्च — रोज़मर्रा की आमदनी का हिसाब।",
    "कमाई, बचत आणि खर्च — रोजच्या उत्पन्नाचे गणित.",
  ),
  "eco-growth": S(
    "Yields and outputs growing year on year — how much more, and how fast.",
    "साल-दर-साल बढ़ती उपज और उत्पादन — कितना ज़्यादा, कितनी तेज़ी से।",
    "वर्षानुवर्षे वाढणारे उत्पन्न — किती जास्त, किती वेगाने.",
  ),

  /* Geography */
  "geo-maps": S(
    "Map scale — turning centimetres on paper into kilometres on the ground.",
    "मानचित्र का पैमाना — कागज़ के सेंटीमीटर से ज़मीन के किलोमीटर तक।",
    "नकाशाचे प्रमाण — कागदावरील सेंटिमीटरपासून जमिनीवरील किलोमीटरपर्यंत.",
  ),
  "geo-globe": S(
    "The turning globe — day, night, and time from place to place.",
    "घूमती पृथ्वी — दिन, रात और जगह-जगह का समय।",
    "फिरणारी पृथ्वी — दिवस, रात्र आणि ठिकठिकाणचा वेळ.",
  ),
  "geo-pop": S(
    "Population counts and densities — how people spread across places.",
    "जनसंख्या और घनत्व — लोग जगहों में कैसे बँटे हैं।",
    "लोकसंख्या आणि घनता — लोक ठिकठिकाणी कसे विखुरले आहेत.",
  ),

  /* History — the two skills families; era chapters are all per-slug. */
  "hist-timeline": S(
    "Reading timelines — putting events in order and counting the years between.",
    "समयरेखा पढ़ना — घटनाओं को क्रम में रखना और बीच के वर्ष गिनना।",
    "कालरेषा वाचणे — घटना क्रमाने लावणे आणि मधली वर्षे मोजणे.",
  ),
  "hist-century": S(
    "Centuries, decades and calendars — placing any year in its century.",
    "शताब्दी, दशक और कैलेंडर — किसी भी वर्ष को उसकी सदी में रखना।",
    "शतक, दशक आणि दिनदर्शिका — कोणतेही वर्ष त्याच्या शतकात बसवणे.",
  ),

  /* Science — defaults fit the lower and middle grades; the board-year
     treatments override per slug below. */
  "sci-motion": S(
    "How things move — distance, time and speed, from everyday examples.",
    "चीज़ें कैसे चलती हैं — दूरी, समय और चाल, रोज़ के उदाहरणों से।",
    "वस्तू कशा हलतात — अंतर, वेळ आणि वेग, रोजच्या उदाहरणांतून.",
  ),
  "sci-matter": S(
    "Sorting materials — what floats, dissolves, melts and mixes.",
    "पदार्थों की छँटाई — क्या तैरता, घुलता, पिघलता और मिलता है।",
    "पदार्थांची वर्गवारी — काय तरंगते, विरघळते, वितळते आणि मिसळते.",
  ),
  "sci-force": S(
    "Pushes and pulls — what forces do to the things they meet.",
    "धक्का और खिंचाव — बल चीज़ों पर क्या असर डालते हैं।",
    "ढकलणे आणि ओढणे — बल वस्तूंवर काय परिणाम करते.",
  ),
  "sci-elec": S(
    "Bulbs, batteries and switches — what makes a circuit work.",
    "बल्ब, बैटरी और स्विच — परिपथ कैसे चलता है।",
    "बल्ब, बॅटरी आणि स्विच — परिपथ कसे चालते.",
  ),
  "sci-work": S(
    "When a push counts as work, and where the energy goes.",
    "कब कोई धक्का 'कार्य' कहलाता है, और ऊर्जा कहाँ जाती है।",
    "केव्हा जोर 'कार्य' ठरतो, आणि ऊर्जा कुठे जाते.",
  ),
};

/** Per-slug lines — chapters whose treatment belongs to one grade only. */
const BY_SLUG: Record<string, SummaryTriple> = {
  /* ---------- Grade 3 ---------- */
  "drill-g3-money": S(
    "Rupees and paise — counting money, making amounts, giving change.",
    "रुपये और पैसे — पैसे गिनना, रकम बनाना, बाकी लौटाना।",
    "रुपये आणि पैसे — पैसे मोजणे, रक्कम जुळवणे, उरलेले परत देणे.",
  ),
  "drill-g3-addsub": S(
    "Adding and taking away — carrying, borrowing and story sums.",
    "जोड़ और घटाव — हासिल, उधार और कहानी वाले सवाल।",
    "बेरीज आणि वजाबाकी — हातचा, उसनवारी आणि गोष्टीरूप गणिते.",
  ),
  "drill-g3-tables": S(
    "The multiplication tables — forwards, backwards and in word problems.",
    "पहाड़े — सीधे, उलटे और शब्द-सवालों में।",
    "पाढे — सरळ, उलटे आणि शाब्दिक उदाहरणांत.",
  ),
  "drill-g3-division": S(
    "Sharing equally — division facts and what is left over.",
    "बराबर बाँटना — भाग के तथ्य और शेष क्या बचा।",
    "समान वाटणी — भागाकाराची तथ्ये आणि बाकी काय उरते.",
  ),
  "drill-g3-place": S(
    "Place value — what each digit is worth, and comparing numbers.",
    "स्थानीय मान — हर अंक की कीमत, और संख्याओं की तुलना।",
    "स्थानिक किंमत — प्रत्येक अंकाचे मोल, आणि संख्यांची तुलना.",
  ),
  "drill-g3-units": S(
    "Reading the clock — hours, days and the calendar.",
    "घड़ी पढ़ना — घंटे, दिन और कैलेंडर।",
    "घड्याळ वाचणे — तास, दिवस आणि दिनदर्शिका.",
  ),
  "drill-g3-shapes": S(
    "Sides, corners and patterns in the shapes around us.",
    "हमारे आस-पास की आकृतियों की भुजाएँ, कोने और पैटर्न।",
    "आपल्या भोवतालच्या आकारांच्या बाजू, कोपरे आणि नक्षी.",
  ),
  "drill-g3-mixed": S(
    "The term's sums mixed together — all four operations.",
    "पूरे सत्र के सवाल मिलेजुले — चारों संक्रियाएँ।",
    "सत्रातील गणिते एकत्र — चारही क्रिया.",
  ),

  /* ---------- Grade 4 ---------- */
  "drill-g4-money4": S(
    "Costs, sales and what is left over — the junk seller's arithmetic.",
    "लागत, बिक्री और बचत — कबाड़ीवाले का हिसाब।",
    "खर्च, विक्री आणि शिल्लक — भंगारवाल्याचे गणित.",
  ),
  "drill-g4-bigmul": S(
    "Multiplying bigger numbers — two digits by two digits and beyond.",
    "बड़ी संख्याओं का गुणा — दो अंकों से दो अंक और आगे।",
    "मोठ्या संख्यांचा गुणाकार — दोन अंकी संख्यांपासून पुढे.",
  ),
  "drill-g4-longdiv": S(
    "Long division — sharing big numbers out and checking the remainder.",
    "लंबा भाग — बड़ी संख्याएँ बाँटना और शेष जाँचना।",
    "दीर्घ भागाकार — मोठ्या संख्या वाटणे आणि बाकी तपासणे.",
  ),
  "drill-g4-factors": S(
    "Factors and multiples — what divides what, odds, evens and primes.",
    "गुणनखंड और गुणज — क्या किससे विभाजित होता है, सम-विषम और अभाज्य।",
    "अवयव आणि पट — काय कशाने भागते, सम-विषम आणि मूळ संख्या.",
  ),
  "drill-g4-fracintro": S(
    "Halves and quarters — fair shares of shapes and numbers.",
    "आधा और चौथाई — आकृतियों और संख्याओं के बराबर हिस्से।",
    "अर्धा आणि पाव — आकार व संख्यांचे समान वाटे.",
  ),
  "drill-g4-units4": S(
    "Converting measures — metres, litres, grams and time.",
    "मापों का रूपांतरण — मीटर, लीटर, ग्राम और समय।",
    "मापांचे रूपांतर — मीटर, लिटर, ग्रॅम आणि वेळ.",
  ),
  "drill-g4-geo4": S(
    "Perimeter and area of fields — how much fence, how much ground.",
    "खेतों का परिमाप और क्षेत्रफल — कितनी बाड़, कितनी ज़मीन।",
    "शेतांची परिमिती आणि क्षेत्रफळ — किती कुंपण, किती जमीन.",
  ),
  "drill-g4-mixed": S(
    "Tables and shares practised together.",
    "पहाड़े और बँटवारा, साथ-साथ अभ्यास।",
    "पाढे आणि वाटण्या, एकत्र सराव.",
  ),

  /* ---------- Grade 5 ---------- */
  "drill-g5-shop5": S(
    "Bills, totals and change at the shop counter.",
    "दुकान पर बिल, जोड़ और बाकी।",
    "दुकानात बिल, बेरीज आणि उरलेले पैसे.",
  ),
  "drill-g5-decimals": S(
    "Tenths and hundredths — reading, comparing and computing with decimals.",
    "दशांश और शतांश — दशमलव पढ़ना, तुलना और गणना।",
    "दशांश आणि शतांश — दशांश वाचणे, तुलना आणि आकडेमोड.",
  ),
  "drill-g5-frac5": S(
    "Parts and wholes — equivalent fractions, compared and combined.",
    "अंश और पूर्ण — तुल्य भिन्नों की तुलना और जोड़।",
    "भाग आणि पूर्ण — समतुल्य अपूर्णांकांची तुलना आणि बेरीज.",
  ),
  "drill-g5-avg5": S(
    "Averages from charts — totals shared out evenly.",
    "चार्ट से औसत — कुल को बराबर बाँटकर।",
    "तक्त्यांतून सरासरी — एकूण समान वाटून.",
  ),
  "drill-g5-volume": S(
    "How big and how heavy — volume, weight and their units.",
    "कितना बड़ा, कितना भारी — आयतन, भार और उनकी इकाइयाँ।",
    "किती मोठे, किती जड — आकारमान, वजन आणि त्यांची एकके.",
  ),
  "drill-g5-pct5": S(
    "Percentages — out of a hundred, off a price, of a whole.",
    "प्रतिशत — सौ में से, कीमत पर छूट, पूरे का हिस्सा।",
    "टक्केवारी — शंभरातले, किमतीवरील सूट, पूर्णाचा भाग.",
  ),
  "drill-g5-mixed": S(
    "Ways to multiply and divide, mixed for speed and sureness.",
    "गुणा-भाग के तरीक़े, तेज़ी और पक्केपन के लिए मिलेजुले।",
    "गुणाकार-भागाकाराच्या रीती, वेग आणि पक्केपणासाठी एकत्र.",
  ),
  "drill-g5-scispeed5": S(
    "Fast and slow — speed compared and computed.",
    "तेज़ और धीमा — चाल की तुलना और गणना।",
    "जलद आणि सावकाश — वेगाची तुलना आणि आकडेमोड.",
  ),

  /* ---------- Grade 6 ---------- */
  "drill-g6-integers": S(
    "Integers — numbers below zero, added and subtracted across it.",
    "पूर्णांक — शून्य से नीचे की संख्याएँ, उसके आर-पार जोड़-घटाव।",
    "पूर्णांक — शून्याखालील संख्या, त्यापलीकडे बेरीज-वजाबाकी.",
  ),
  "drill-g6-ratio": S(
    "Ratio and proportion — comparing quantities and scaling them fairly.",
    "अनुपात और समानुपात — मात्राओं की तुलना और सही अनुपात में बढ़ाना।",
    "गुणोत्तर आणि प्रमाण — राशींची तुलना आणि योग्य प्रमाणात वाढ.",
  ),
  "drill-g6-angles": S(
    "Angles and elementary shapes — measured, named, classified.",
    "कोण और मूल आकृतियाँ — मापना, नाम देना, वर्गीकरण।",
    "कोन आणि मूलभूत आकार — मोजणे, नावे, वर्गीकरण.",
  ),
  "drill-g6-algintro": S(
    "First algebra — letters standing in for numbers.",
    "पहला बीजगणित — संख्याओं की जगह अक्षर।",
    "पहिले बीजगणित — संख्यांच्या जागी अक्षरे.",
  ),
  "drill-g6-lcmhcf": S(
    "Playing with numbers — HCF, LCM and the games factors play.",
    "संख्याओं से खेल — म.स., ल.स. और गुणनखंडों के खेल।",
    "संख्यांशी खेळ — मसावि, लसावि आणि अवयवांचे खेळ.",
  ),
  "drill-g6-mensuration6": S(
    "Perimeter and area — rectangles, squares and figures built from them.",
    "परिमाप और क्षेत्रफल — आयत, वर्ग और उनसे बनी आकृतियाँ।",
    "परिमिती आणि क्षेत्रफळ — आयत, चौरस आणि त्यांपासूनचे आकार.",
  ),
  "drill-g6-mixed": S(
    "Whole-number operations, practised together.",
    "पूर्ण संख्याओं की संक्रियाएँ, साथ-साथ अभ्यास।",
    "पूर्ण संख्यांच्या क्रिया, एकत्र सराव.",
  ),
  "drill-g6-scimeasure": S(
    "Measuring motion — units, instruments and distances.",
    "गति की माप — इकाइयाँ, उपकरण और दूरियाँ।",
    "गतीचे मोजमाप — एकके, उपकरणे आणि अंतरे.",
  ),

  /* ---------- Grade 7 ---------- */
  "drill-g7-profit": S(
    "Cost price, selling price, profit and loss — and the percentages between.",
    "क्रय मूल्य, विक्रय मूल्य, लाभ-हानि — और बीच के प्रतिशत।",
    "खरेदी किंमत, विक्री किंमत, नफा-तोटा — आणि मधली टक्केवारी.",
  ),
  "drill-g7-int7": S(
    "Integers in all four operations, sign rules included.",
    "चारों संक्रियाओं में पूर्णांक, चिह्न के नियमों समेत।",
    "चारही क्रियांत पूर्णांक, चिन्हांच्या नियमांसह.",
  ),
  "drill-g7-eq7": S(
    "Simple equations — undoing operations to find the unknown.",
    "सरल समीकरण — संक्रियाएँ उलटकर अज्ञात निकालना।",
    "साधी समीकरणे — क्रिया उलट करून अज्ञात शोधणे.",
  ),
  "drill-g7-exp7": S(
    "Exponents and powers — read, written and computed.",
    "घातांक और घात — पढ़ना, लिखना और गणना।",
    "घातांक आणि घात — वाचणे, लिहिणे आणि आकडेमोड.",
  ),
  "drill-g7-dec7": S(
    "Fractions and decimals, multiplied and divided.",
    "भिन्न और दशमलव — गुणा और भाग।",
    "अपूर्णांक आणि दशांश — गुणाकार आणि भागाकार.",
  ),
  "drill-g7-mixed": S(
    "Number operations, mixed for fluency.",
    "संख्या-संक्रियाएँ, रवानी के लिए मिलीजुली।",
    "संख्यांच्या क्रिया, सफाईसाठी एकत्र.",
  ),
  "drill-g7-hist-sultans": S(
    "The Delhi Sultans in order — rulers, dates and the years between.",
    "दिल्ली के सुलतान क्रम से — शासक, तिथियाँ और बीच के वर्ष।",
    "दिल्लीचे सुलतान क्रमाने — राज्यकर्ते, तारखा आणि मधली वर्षे.",
  ),
  "drill-g7-hist-mughal": S(
    "The Mughal emperors and their dates, in order.",
    "मुग़ल बादशाह और उनकी तिथियाँ, क्रम से।",
    "मुघल सम्राट आणि त्यांच्या तारखा, क्रमाने.",
  ),
  "drill-g7-hist-c18": S(
    "The eighteenth century's successor states — who rose when.",
    "अठारहवीं सदी के उत्तराधिकारी राज्य — कौन कब उभरा।",
    "अठराव्या शतकातील उत्तराधिकारी राज्ये — कोण केव्हा उदयास आले.",
  ),
  "drill-g7-sci-motion": S(
    "Motion and time — speed read off, and computed.",
    "गति और समय — चाल पढ़ना और निकालना।",
    "गती आणि वेळ — वेग वाचणे आणि काढणे.",
  ),
  "drill-g7-sci-matter": S(
    "Density — mass over volume, and why some things sink.",
    "घनत्व — आयतन पर द्रव्यमान, और कुछ चीज़ें क्यों डूबती हैं।",
    "घनता — आकारमानामागचे वस्तुमान, आणि काही वस्तू का बुडतात.",
  ),
  "drill-g7-sci-force": S(
    "Forces measured — springs, friction and their effects.",
    "बल की माप — कमानी, घर्षण और उनके असर।",
    "बलाचे मोजमाप — स्प्रिंग, घर्षण आणि त्यांचे परिणाम.",
  ),
  "drill-g7-sci-elec": S(
    "Current's effects — heating, magnetism and simple circuit sums.",
    "धारा के असर — गर्मी, चुंबकत्व और सरल परिपथ के सवाल।",
    "विद्युतधारेचे परिणाम — उष्णता, चुंबकत्व आणि साधी परिपथ गणिते.",
  ),

  /* ---------- Grade 8 ---------- */
  "drill-g8-ci8": S(
    "Simple and compound interest, step by step.",
    "साधारण और चक्रवृद्धि ब्याज, चरण दर चरण।",
    "सरळ आणि चक्रवाढ व्याज, टप्प्याटप्प्याने.",
  ),
  "drill-g8-lineq": S(
    "Linear equations in one variable — solved and checked.",
    "एक चर के रैखिक समीकरण — हल और जाँच।",
    "एका चलातील रेषीय समीकरणे — सोडवणे आणि पडताळणे.",
  ),
  "drill-g8-roots": S(
    "Squares, cubes and their roots — spotting perfect powers.",
    "वर्ग, घन और उनके मूल — पूर्ण घात पहचानना।",
    "वर्ग, घन आणि त्यांची मुळे — पूर्ण घात ओळखणे.",
  ),
  "drill-g8-circle8": S(
    "Circles — circumference and area, forwards and backwards.",
    "वृत्त — परिधि और क्षेत्रफल, सीधे और उलटे।",
    "वर्तुळ — परीघ आणि क्षेत्रफळ, सरळ आणि उलट.",
  ),
  "drill-g8-solids": S(
    "Cubes, cuboids and cylinders — surface area and volume.",
    "घन, घनाभ और बेलन — पृष्ठीय क्षेत्रफल और आयतन।",
    "घन, इष्टिकाचिती आणि दंडगोल — पृष्ठफळ आणि घनफळ.",
  ),
  "drill-g8-poly8": S(
    "Algebraic expressions — added, multiplied and evaluated.",
    "बीजीय व्यंजक — जोड़, गुणा और मान निकालना।",
    "बैजिक पदावली — बेरीज, गुणाकार आणि किंमत काढणे.",
  ),
  "drill-g8-mixed": S(
    "Number operations, mixed for fluency.",
    "संख्या-संक्रियाएँ, रवानी के लिए मिलीजुली।",
    "संख्यांच्या क्रिया, सफाईसाठी एकत्र.",
  ),
  "drill-g8-scielements": S(
    "Elements and their symbols — the alphabet of chemistry.",
    "तत्व और उनके प्रतीक — रसायन की वर्णमाला।",
    "मूलद्रव्ये आणि त्यांची चिन्हे — रसायनशास्त्राची मुळाक्षरे.",
  ),
  "drill-g8-hist-trade": S(
    "The Company's climb from trade to territory, dated battle by battle.",
    "कंपनी का व्यापार से राज तक का सफ़र — लड़ाई दर लड़ाई, तिथियों में।",
    "कंपनीचा व्यापारातून राज्यापर्यंतचा प्रवास — लढाईमागून लढाई, तारखांसह.",
  ),
  "drill-g8-hist-rebel": S(
    "1857 and after — the rebellion's dates, places and aftermath.",
    "1857 और उसके बाद — विद्रोह की तिथियाँ, जगहें और परिणाम।",
    "१८५७ आणि नंतर — उठावाच्या तारखा, ठिकाणे आणि परिणाम.",
  ),
  "drill-g8-hist-natmove": S(
    "From the Congress's founding to 1947, dated step by step.",
    "कांग्रेस की स्थापना से 1947 तक, तिथि दर तिथि।",
    "काँग्रेसच्या स्थापनेपासून १९४७ पर्यंत, तारखेमागून तारीख.",
  ),
  "drill-g8-sci-matter": S(
    "Density — mass over volume, and why some things sink.",
    "घनत्व — आयतन पर द्रव्यमान, और कुछ चीज़ें क्यों डूबती हैं।",
    "घनता — आकारमानामागचे वस्तुमान, आणि काही वस्तू का बुडतात.",
  ),
  "drill-g8-sci-force": S(
    "Force and pressure — spreading a push over an area.",
    "बल और दाब — किसी क्षेत्र पर फैला धक्का।",
    "बल आणि दाब — क्षेत्रावर पसरलेला जोर.",
  ),
  "drill-g8-sci-elec": S(
    "Currents through liquids — conduction and electroplating.",
    "द्रवों से गुज़रती धारा — चालन और विद्युत-लेपन।",
    "द्रवांतून जाणारी धारा — वहन आणि विद्युत-लेपन.",
  ),
  "drill-g8-sci-motion": S(
    "Speed, distance and time — practised numerically.",
    "चाल, दूरी और समय — आँकड़ों में अभ्यास।",
    "वेग, अंतर आणि वेळ — आकड्यांत सराव.",
  ),

  /* ---------- Grade 9 ---------- */
  "drill-g9-poly9": S(
    "Polynomials — values, zeros, factors and identities.",
    "बहुपद — मान, शून्यक, गुणनखंड और सर्वसमिकाएँ।",
    "बहुपदी — किंमती, शून्यके, अवयव आणि नित्यसमीकरणे.",
  ),
  "drill-g9-coord": S(
    "Coordinate geometry — plotting points and reading the plane.",
    "निर्देशांक ज्यामिति — बिंदु आँकना और तल पढ़ना।",
    "निर्देशक भूमिती — बिंदू मांडणे आणि प्रतल वाचणे.",
  ),
  "drill-g9-tri9": S(
    "Areas of triangles — Heron's formula at work.",
    "त्रिभुजों का क्षेत्रफल — हीरोन का सूत्र काम पर।",
    "त्रिकोणांचे क्षेत्रफळ — हेरॉनचे सूत्र प्रत्यक्षात.",
  ),
  "drill-g9-stats9": S(
    "Statistics — mean, median and mode from real data.",
    "सांख्यिकी — असली आँकड़ों से माध्य, माध्यिका और बहुलक।",
    "संख्याशास्त्र — खऱ्या आकडेवारीतून मध्य, मध्यक आणि बहुलक.",
  ),
  "drill-g9-prob9": S(
    "Probability from experiments — counting the outcomes that count.",
    "प्रयोगों से प्रायिकता — काम के परिणाम गिनना।",
    "प्रयोगांतून संभाव्यता — मोजके निकाल मोजणे.",
  ),
  "drill-g9-solids9": S(
    "Surface areas and volumes — cones, spheres and cylinders.",
    "पृष्ठीय क्षेत्रफल और आयतन — शंकु, गोले और बेलन।",
    "पृष्ठफळ आणि घनफळ — शंकू, गोल आणि दंडगोल.",
  ),
  "drill-g9-mixed": S(
    "Number systems — rationals, irrationals and exponent laws.",
    "संख्या पद्धति — परिमेय, अपरिमेय और घातांक नियम।",
    "संख्या पद्धती — परिमेय, अपरिमेय आणि घातांक नियम.",
  ),
  "drill-g9-scimoles9": S(
    "Atoms, molecules and the mole — counting matter by weighing it.",
    "परमाणु, अणु और मोल — तौलकर पदार्थ गिनना।",
    "अणू, रेणू आणि मोल — वजन करून पदार्थ मोजणे.",
  ),
  "drill-g9-hist-frrev": S(
    "The French Revolution year by year — 1789 to Napoleon.",
    "फ़्रांसीसी क्रांति वर्ष दर वर्ष — 1789 से नेपोलियन तक।",
    "फ्रेंच राज्यक्रांती वर्षामागून वर्ष — १७८९ ते नेपोलियन.",
  ),
  "drill-g9-hist-russia": S(
    "Russia's revolutions and the years around 1917.",
    "रूस की क्रांतियाँ और 1917 के आसपास के वर्ष।",
    "रशियाच्या क्रांत्या आणि १९१७ च्या आसपासची वर्षे.",
  ),
  "drill-g9-hist-nazism": S(
    "Weimar to war — the dates of Nazism's rise.",
    "वाइमर से युद्ध तक — नात्सीवाद के उभार की तिथियाँ।",
    "वायमारपासून युद्धापर्यंत — नाझीवादाच्या उदयाच्या तारखा.",
  ),
  "drill-g9-sci-motion": S(
    "Uniform motion and acceleration — the equations of motion at work.",
    "एकसमान गति और त्वरण — गति के समीकरण काम पर।",
    "एकसमान गती आणि त्वरण — गतीची समीकरणे प्रत्यक्षात.",
  ),
  "drill-g9-sci-matter": S(
    "States of matter and the changes between them, with the numbers.",
    "पदार्थ की अवस्थाएँ और उनके बीच के बदलाव — आँकड़ों समेत।",
    "पदार्थाच्या अवस्था आणि त्यांमधले बदल — आकड्यांसह.",
  ),
  "drill-g9-sci-force": S(
    "Newton's laws — F = ma and momentum, computed.",
    "न्यूटन के नियम — F = ma और संवेग, गणना सहित।",
    "न्यूटनचे नियम — F = ma आणि संवेग, आकडेमोडीसह.",
  ),
  "drill-g9-sci-elec": S(
    "Ohm's law — V, I and R in circuit calculations.",
    "ओम का नियम — परिपथ की गणना में V, I और R।",
    "ओहमचा नियम — परिपथ आकडेमोडीत V, I आणि R.",
  ),
  "drill-g9-sci-work": S(
    "Work, kinetic and potential energy, and power — computed.",
    "कार्य, गतिज और स्थितिज ऊर्जा, और शक्ति — गणना सहित।",
    "कार्य, गतिज आणि स्थितिज ऊर्जा, आणि शक्ती — आकडेमोडीसह.",
  ),
  "drill-g9-geo-globe": S(
    "India's size and location — extents, neighbours and standard time.",
    "भारत का आकार और स्थिति — विस्तार, पड़ोसी और मानक समय।",
    "भारताचा आकार व स्थान — विस्तार, शेजारी आणि प्रमाण वेळ.",
  ),

  /* ---------- Grade 10 ---------- */
  "drill-g10-quad": S(
    "Quadratic equations — factorising, completing the square, the formula.",
    "द्विघात समीकरण — गुणनखंड, वर्ग पूर्ण करना, सूत्र।",
    "वर्गसमीकरणे — अवयव, वर्ग पूर्ण करणे, सूत्र.",
  ),
  "drill-g10-ap": S(
    "Arithmetic progressions — nth terms and sums.",
    "समांतर श्रेढ़ी — n-वाँ पद और योग।",
    "अंकगणिती श्रेढी — n-वे पद आणि बेरीज.",
  ),
  "drill-g10-trig": S(
    "First trigonometry — sine, cosine and tangent at work.",
    "पहली त्रिकोणमिति — ज्या, कोज्या और स्पर्शज्या काम पर।",
    "पहिली त्रिकोणमिती — sin, cos आणि tan प्रत्यक्षात.",
  ),
  "drill-g10-prob10": S(
    "Probability — single events, counted carefully.",
    "प्रायिकता — एकल घटनाएँ, सावधानी से गिनी हुईं।",
    "संभाव्यता — एकेरी घटना, काळजीपूर्वक मोजलेल्या.",
  ),
  "drill-g10-coord10": S(
    "Coordinate geometry — distance, midpoint and section.",
    "निर्देशांक ज्यामिति — दूरी, मध्य-बिंदु और विभाजन।",
    "निर्देशक भूमिती — अंतर, मध्यबिंदू आणि विभाजन.",
  ),
  "drill-g10-mixed": S(
    "Real numbers — HCF, LCM and Euclid's steps.",
    "वास्तविक संख्याएँ — म.स., ल.स. और यूक्लिड के चरण।",
    "वास्तव संख्या — मसावि, लसावि आणि युक्लिडच्या पायऱ्या.",
  ),
  "drill-g10-interest10": S(
    "Simple and compound interest — what borrowing costs and saving earns.",
    "साधारण और चक्रवृद्धि ब्याज — उधार की कीमत, बचत की कमाई।",
    "सरळ आणि चक्रवाढ व्याज — कर्जाची किंमत, बचतीची कमाई.",
  ),
  "drill-g10-eco-income": S(
    "Per capita income — a country's income shared over its people.",
    "प्रति व्यक्ति आय — देश की आय, लोगों में बाँटकर।",
    "दरडोई उत्पन्न — देशाचे उत्पन्न, लोकांमध्ये वाटून.",
  ),
  "drill-g10-eco-growth": S(
    "Percentage growth year on year — compounded and compared.",
    "साल-दर-साल प्रतिशत वृद्धि — चक्रवृद्धि और तुलना।",
    "वर्षागणिक टक्केवारी वाढ — चक्रवाढ आणि तुलना.",
  ),
  "drill-g10-sciwaves10": S(
    "Sound and waves — frequency, wavelength and speed.",
    "ध्वनि और तरंगें — आवृत्ति, तरंगदैर्घ्य और चाल।",
    "ध्वनी आणि लहरी — वारंवारता, तरंगलांबी आणि वेग.",
  ),
  "drill-g10-hist-eunat": S(
    "Europe's nationalisms and their landmark years.",
    "यूरोप के राष्ट्रवाद और उनके मील-पत्थर वर्ष।",
    "युरोपातील राष्ट्रवाद आणि त्यांची महत्त्वाची वर्षे.",
  ),
  "drill-g10-hist-indnat": S(
    "Nationalism in India — satyagrahas, marches and their years.",
    "भारत में राष्ट्रवाद — सत्याग्रह, यात्राएँ और उनके वर्ष।",
    "भारतातील राष्ट्रवाद — सत्याग्रह, मोर्चे आणि त्यांची वर्षे.",
  ),
  "drill-g10-hist-global": S(
    "Trade, migration and the making of a global world, in dates.",
    "व्यापार, प्रवास और वैश्विक दुनिया का बनना — तिथियों में।",
    "व्यापार, स्थलांतर आणि जागतिक जगाची घडण — तारखांत.",
  ),
  "drill-g10-sci-motion": S(
    "Uniform motion and acceleration — the equations of motion at work.",
    "एकसमान गति और त्वरण — गति के समीकरण काम पर।",
    "एकसमान गती आणि त्वरण — गतीची समीकरणे प्रत्यक्षात.",
  ),
  "drill-g10-sci-matter": S(
    "Density and states of matter — practised numerically.",
    "घनत्व और पदार्थ की अवस्थाएँ — आँकड़ों में अभ्यास।",
    "घनता आणि पदार्थाच्या अवस्था — आकड्यांत सराव.",
  ),
  "drill-g10-sci-force": S(
    "Newton's laws — F = ma and momentum, computed.",
    "न्यूटन के नियम — F = ma और संवेग, गणना सहित।",
    "न्यूटनचे नियम — F = ma आणि संवेग, आकडेमोडीसह.",
  ),
  "drill-g10-sci-elec": S(
    "Ohm's law, series and parallel — power and heating computed.",
    "ओम का नियम, श्रेणी और समांतर — शक्ति और ऊष्मा की गणना।",
    "ओहमचा नियम, एकसर आणि समांतर — शक्ती व उष्णतेची आकडेमोड.",
  ),
  "drill-g10-sci-work": S(
    "Energy calculations — work, power and efficiency.",
    "ऊर्जा की गणनाएँ — कार्य, शक्ति और दक्षता।",
    "ऊर्जेची आकडेमोड — कार्य, शक्ती आणि कार्यक्षमता.",
  ),
  "drill-g10-geo-globe": S(
    "Longitude and time — the hours the turning Earth carries.",
    "देशांतर और समय — घूमती पृथ्वी के साथ चलते घंटे।",
    "रेखांश आणि वेळ — फिरत्या पृथ्वीबरोबर बदलणारे तास.",
  ),

  /* ---------- Grade 11 ---------- */
  "drill-g11-counting": S(
    "Permutations and combinations — counting without listing.",
    "क्रमचय और संचय — बिना सूची बनाए गिनना।",
    "क्रमांतरे आणि संयोग — यादी न करता मोजणे.",
  ),
  "drill-g11-seq11": S(
    "Sequences and series — APs, GPs and their sums.",
    "अनुक्रम और श्रेणी — स.श्रे., गु.श्रे. और उनके योग।",
    "क्रम आणि श्रेणी — अंकगणिती, भूमिती श्रेढी आणि त्यांच्या बेरजा.",
  ),
  "drill-g11-lines": S(
    "Straight lines — slopes, intercepts and equations.",
    "सरल रेखाएँ — ढाल, अंतःखंड और समीकरण।",
    "सरळ रेषा — उतार, छेद आणि समीकरणे.",
  ),
  "drill-g11-trig11": S(
    "Trigonometric functions — identities and values beyond the triangle.",
    "त्रिकोणमितीय फलन — त्रिभुज से आगे सर्वसमिकाएँ और मान।",
    "त्रिकोणमितीय फले — त्रिकोणापलीकडची नित्यसमीकरणे आणि किंमती.",
  ),
  "drill-g11-stats11": S(
    "Statistics — variance and standard deviation from data.",
    "सांख्यिकी — आँकड़ों से प्रसरण और मानक विचलन।",
    "संख्याशास्त्र — आकडेवारीतून प्रचरण आणि प्रमाण विचलन.",
  ),
  "drill-g11-quad11": S(
    "Complex numbers and quadratics — roots real and otherwise.",
    "सम्मिश्र संख्याएँ और द्विघात — वास्तविक और अन्य मूल।",
    "संमिश्र संख्या आणि वर्गसमीकरणे — वास्तव आणि इतर मुळे.",
  ),
  "drill-g11-mixed": S(
    "Number practice across the year's methods.",
    "साल भर की विधियों पर संख्या-अभ्यास।",
    "वर्षभराच्या पद्धतींवर संख्यांचा सराव.",
  ),
  "drill-g11-hist-culture": S(
    "Renaissance and after — the years when culture turned.",
    "पुनर्जागरण और उसके बाद — जब संस्कृति ने करवट ली।",
    "प्रबोधन आणि नंतर — संस्कृतीने वळण घेतलेली वर्षे.",
  ),
  "drill-g11-hist-industry": S(
    "The Industrial Revolution's inventions and their dates.",
    "औद्योगिक क्रांति के आविष्कार और उनकी तिथियाँ।",
    "औद्योगिक क्रांतीतील शोध आणि त्यांच्या तारखा.",
  ),
  "drill-g11-hist-modern": S(
    "Japan, China and the paths to modernisation, dated.",
    "जापान, चीन और आधुनिकीकरण की राहें — तिथियों समेत।",
    "जपान, चीन आणि आधुनिकीकरणाचे मार्ग — तारखांसह.",
  ),
  "drill-g11-eco-income": S(
    "Incomes averaged, compared and shared out.",
    "आमदनी का औसत, तुलना और बँटवारा।",
    "उत्पन्नाची सरासरी, तुलना आणि वाटणी.",
  ),
  "drill-g11-eco-growth": S(
    "Percentage growth year on year — compounded and compared.",
    "साल-दर-साल प्रतिशत वृद्धि — चक्रवृद्धि और तुलना।",
    "वर्षागणिक टक्केवारी वाढ — चक्रवाढ आणि तुलना.",
  ),
  "drill-g11-sci-motion": S(
    "Kinematics in a straight line — velocity, acceleration and displacement.",
    "सरल रेखा में शुद्धगतिकी — वेग, त्वरण और विस्थापन।",
    "सरळ रेषेतील शुद्धगतिकी — वेग, त्वरण आणि विस्थापन.",
  ),
  "drill-g11-sci-matter": S(
    "Fluids — pressure, buoyancy and flow, computed.",
    "तरल — दाब, उत्प्लावन और प्रवाह, गणना के साथ।",
    "द्रव — दाब, प्लावकता आणि प्रवाह, आकडेमोडीसह.",
  ),
  "drill-g11-sci-force": S(
    "Newton's laws applied — friction, tension and circular motion.",
    "न्यूटन के नियम व्यवहार में — घर्षण, तनाव और वृत्तीय गति।",
    "न्यूटनचे नियम प्रत्यक्षात — घर्षण, ताण आणि वर्तुळाकार गती.",
  ),
  "drill-g11-sci-elec": S(
    "Current electricity — resistance, EMF and simple networks.",
    "विद्युत धारा — प्रतिरोध, विद्युत वाहक बल और सरल जाल।",
    "विद्युतधारा — रोध, विद्युतचालक बल आणि साधी जाळी.",
  ),
  "drill-g11-sci-work": S(
    "The work–energy theorem, conservation and power.",
    "कार्य-ऊर्जा प्रमेय, संरक्षण और शक्ति।",
    "कार्य-ऊर्जा प्रमेय, अक्षय्यता आणि शक्ती.",
  ),
  "drill-g11-geo-globe": S(
    "Earth's rotation and time — hours from degrees.",
    "पृथ्वी का घूर्णन और समय — अंशों से घंटे।",
    "पृथ्वीचे परिवलन आणि वेळ — अंशांतून तास.",
  ),

  /* ---------- Grade 12 ---------- */
  "drill-g12-matrices": S(
    "Matrices and determinants — operations, inverses and systems.",
    "आव्यूह और सारणिक — संक्रियाएँ, व्युत्क्रम और समीकरण-निकाय।",
    "सारणी (मॅट्रिक्स) आणि निर्धारक — क्रिया, व्यस्त आणि समीकरणसंच.",
  ),
  "drill-g12-vectors": S(
    "Vectors — components, dot products and directions.",
    "सदिश — घटक, अदिश गुणनफल और दिशाएँ।",
    "सदिश — घटक, बिंदुगुणाकार आणि दिशा.",
  ),
  "drill-g12-deriv": S(
    "Continuity and differentiability — derivatives put to work.",
    "सांतत्य और अवकलनीयता — अवकलज काम पर।",
    "सातत्य आणि विकलनीयता — विकलज प्रत्यक्ष वापरात.",
  ),
  "drill-g12-integ": S(
    "Integrals — standard forms and definite values.",
    "समाकलन — मानक रूप और निश्चित मान।",
    "संकलन — प्रमाण रूपे आणि निश्चित किंमती.",
  ),
  "drill-g12-prob12": S(
    "Probability — conditional, independent, and Bayes.",
    "प्रायिकता — सशर्त, स्वतंत्र और बेज़।",
    "संभाव्यता — सशर्त, स्वतंत्र आणि बेज.",
  ),
  "drill-g12-series12": S(
    "Sequences and series, revised for the board year.",
    "अनुक्रम और श्रेणी — बोर्ड वर्ष के लिए दोहराई।",
    "क्रम आणि श्रेणी — बोर्ड वर्षासाठी उजळणी.",
  ),
  "drill-g12-mixed": S(
    "Number practice across the year's methods.",
    "साल भर की विधियों पर संख्या-अभ्यास।",
    "वर्षभराच्या पद्धतींवर संख्यांचा सराव.",
  ),
  "drill-g12-eco-prices": S(
    "GST on the bill — rates, splits and final prices.",
    "बिल पर जीएसटी — दरें, बँटवारा और अंतिम कीमत।",
    "बिलावरील जीएसटी — दर, विभागणी आणि अंतिम किंमत.",
  ),
  "drill-g12-eco-income": S(
    "GDP, GNP and the national income aggregates, from their parts.",
    "जीडीपी, जीएनपी और राष्ट्रीय आय के समुच्चय — घटकों से।",
    "जीडीपी, जीएनपी आणि राष्ट्रीय उत्पन्नाची एकत्रित मापे — घटकांतून.",
  ),
  "drill-g12-eco-growth": S(
    "Percentage growth year on year — compounded and compared.",
    "साल-दर-साल प्रतिशत वृद्धि — चक्रवृद्धि और तुलना।",
    "वर्षागणिक टक्केवारी वाढ — चक्रवाढ आणि तुलना.",
  ),
  "drill-g12-hist-country": S(
    "Colonial revenue systems and the countryside, in years.",
    "औपनिवेशिक राजस्व व्यवस्थाएँ और देहात — वर्षों में।",
    "वसाहती महसूल व्यवस्था आणि ग्रामीण भाग — वर्षांत.",
  ),
  "drill-g12-hist-gandhi": S(
    "Gandhi's movements dated — Champaran to Quit India.",
    "गांधी के आंदोलन तिथियों में — चंपारण से भारत छोड़ो तक।",
    "गांधींची आंदोलने तारखांत — चंपारण ते चले जाव.",
  ),
  "drill-g12-hist-consti": S(
    "Framing the Constitution — the assembly, the debates, the dates.",
    "संविधान का निर्माण — सभा, बहसें और तिथियाँ।",
    "संविधानाची घडण — सभा, चर्चा आणि तारखा.",
  ),
  "drill-g12-sci-motion": S(
    "Kinematics revised — the equations of motion at board level.",
    "शुद्धगतिकी की दोहराई — बोर्ड स्तर पर गति के समीकरण।",
    "शुद्धगतिकीची उजळणी — बोर्ड पातळीवर गतीची समीकरणे.",
  ),
  "drill-g12-sci-matter": S(
    "Bulk properties of matter, revised with numbers.",
    "पदार्थ के स्थूल गुणों की दोहराई, आँकड़ों के साथ।",
    "पदार्थाच्या स्थूल गुणधर्मांची उजळणी, आकड्यांसह.",
  ),
  "drill-g12-sci-force": S(
    "Mechanics revised for the board year.",
    "बोर्ड वर्ष के लिए यांत्रिकी की दोहराई।",
    "बोर्ड वर्षासाठी यांत्रिकीची उजळणी.",
  ),
  "drill-g12-sci-elec": S(
    "Circuit analysis for the board year — resistors, cells and power.",
    "बोर्ड वर्ष के लिए परिपथ विश्लेषण — प्रतिरोध, सेल और शक्ति।",
    "बोर्ड वर्षासाठी परिपथ विश्लेषण — रोधक, विद्युतघट आणि शक्ती.",
  ),
  "drill-g12-sci-work": S(
    "Work and power revised at board level.",
    "बोर्ड स्तर पर कार्य और शक्ति की दोहराई।",
    "बोर्ड पातळीवर कार्य आणि शक्तीची उजळणी.",
  ),
  "drill-g12-geo-globe": S(
    "Longitude and time — the hours the turning Earth carries.",
    "देशांतर और समय — घूमती पृथ्वी के साथ चलते घंटे।",
    "रेखांश आणि वेळ — फिरत्या पृथ्वीबरोबर बदलणारे तास.",
  ),

  /* Latitude/longitude arithmetic replaces day-and-night from G6 up. */
  "drill-g6-geo-globe": S(
    "Latitudes and longitudes — and the time difference each degree makes.",
    "अक्षांश और देशांतर — और हर अंश से बनता समय का अंतर।",
    "अक्षांश आणि रेखांश — आणि प्रत्येक अंशाने होणारा वेळेचा फरक.",
  ),
  "drill-g7-geo-globe": S(
    "Latitudes and longitudes — and the time difference each degree makes.",
    "अक्षांश और देशांतर — और हर अंश से बनता समय का अंतर।",
    "अक्षांश आणि रेखांश — आणि प्रत्येक अंशाने होणारा वेळेचा फरक.",
  ),
  "drill-g8-geo-globe": S(
    "Latitudes and longitudes — and the time difference each degree makes.",
    "अक्षांश और देशांतर — और हर अंश से बनता समय का अंतर।",
    "अक्षांश आणि रेखांश — आणि प्रत्येक अंशाने होणारा वेळेचा फरक.",
  ),
};

/** The one line for a drill topic, or null for a slug this table does not know. */
export function chapterSummary(slug: string): SummaryTriple | null {
  const bySlug = BY_SLUG[slug];
  if (bySlug) return bySlug;
  const match = /^drill-g\d+-(.+)$/.exec(slug);
  return (match && FAMILY[match[1]!]) || null;
}
