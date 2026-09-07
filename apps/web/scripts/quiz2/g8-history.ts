/**
 * Class 8 History — NCERT "Our Pasts III", chapter by chapter, through the
 * conceptual engine. The colonial centuries: a trading company that became
 * a government, revenue systems that reshaped the countryside, and a
 * rebellion the rulers renamed. Every fact keeps its evidence habit —
 * who wrote the record, and whose story it leaves out.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Our Pasts – III (Class 8)";
const LICENCE = "CC-BY-SA-4.0";

export const G8_HISTORY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — How, When and Where (dating the recent past)                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-how-when-where",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 1 — How, When and Where",
      hi: "अध्याय 1 — कैसे, कब और कहाँ",
      mr: "प्रकरण 1 — कसे, केव्हा आणि कुठे",
    },
    name: {
      en: "How, When and Where",
      hi: "कैसे, कब और कहाँ",
      mr: "कसे, केव्हा आणि कुठे",
    },
    summary: {
      en: "How the recent past is read: dates that carry an argument, an empire's own paperwork weighed against the silences in it, a survey that mapped to rule — and the periods historians name and the ones they distrust.",
      hi: "हाल का अतीत कैसे पढ़ा जाता है: तारीख़ें जो तर्क ढोती हैं, साम्राज्य की अपनी काग़ज़ी कार्रवाई उसकी चुप्पियों के आगे तौली हुई, शासन के लिए बना सर्वेक्षण — और वे काल जिन्हें इतिहासकार नाम देते हैं और जिन पर भरोसा नहीं करते।",
      mr: "अलीकडचा भूतकाळ कसा वाचला जातो: युक्तिवाद वाहणाऱ्या तारखा, साम्राज्याचे स्वतःचे दप्तर त्यातल्या शांततेपुढे तोललेले, राज्यासाठी बनवलेली पाहणी — आणि इतिहासकार नाव देतात ते कालखंड आणि ज्यांवर अविश्वास ठेवतात ते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "dates-argument",
        name: {
          en: "Dates carry arguments",
          hi: "तारीख़ें तर्क ढोती हैं",
          mr: "तारखा युक्तिवाद वाहतात",
        },
        kind: "idea",
        prompt: {
          en: "Why is 1947 called a turning point but 1946 is not — what does the CHOICE of a date reveal about the historian?",
          hi: "1947 मोड़ क्यों कहलाता है पर 1946 नहीं — तारीख़ का चुनाव इतिहासकार के बारे में क्या उजागर करता है?",
          mr: "1947 वळण का म्हणतात पण 1946 नाही — तारखेची निवड इतिहासकाराबद्दल काय उघड करते?",
        },
        statement: {
          en: "Choosing which dates matter is itself an argument — a date is highlighted because something the historian thinks important changed then.",
          hi: "कौन-सी तारीख़ें मायने रखती हैं यह चुनना स्वयं एक तर्क है — तारीख़ इसलिए उभारी जाती है कि इतिहासकार की नज़र में तब कोई महत्वपूर्ण चीज़ बदली।",
          mr: "कोणत्या तारखा महत्त्वाच्या हे निवडणे हाच एक युक्तिवाद — तारीख म्हणून ठळक केली जाते की इतिहासकाराच्या मते तेव्हा काहीतरी महत्त्वाचे बदलले.",
        },
        detail: {
          en: "A history of kings marks battles; a history of farming might mark a new seed — the same century, different milestones.",
          hi: "राजाओं का इतिहास लड़ाइयाँ अंकित करता है; खेती का इतिहास शायद नया बीज — वही सदी, अलग मील के पत्थर।",
          mr: "राजांचा इतिहास लढाया नोंदवतो; शेतीचा इतिहास कदाचित नवे बी — तेच शतक, वेगळे मैलाचे दगड.",
        },
        extra: {
          en: "Ask of any timeline: whose story does its choice of dates tell, and whose does it skip?",
          hi: "किसी भी कालक्रम से पूछिए: उसकी तारीख़ों का चुनाव किसकी कहानी कहता है, और किसकी छोड़ देता है?",
          mr: "कोणत्याही कालरेषेला विचारा: तिच्या तारखांची निवड कोणाची कथा सांगते, आणि कोणाची वगळते?",
        },
        pair: {
          left: {
            en: "A highlighted date",
            hi: "उभारी गई तारीख़",
            mr: "ठळक केलेली तारीख",
          },
          right: {
            en: "an argument in disguise",
            hi: "भेस बदला तर्क",
            mr: "वेष बदललेला युक्तिवाद",
          },
        },
      },
      {
        id: "official-records",
        name: {
          en: "Official records",
          hi: "सरकारी अभिलेख",
          mr: "अधिकृत दस्तऐवज",
        },
        kind: "source",
        prompt: {
          en: "The colonial state wrote reports, surveys and censuses obsessively. What are these government papers called — the richest yet most one-sided source of the period?",
          hi: "औपनिवेशिक राज्य ने जुनूनी ढंग से रिपोर्ट, सर्वेक्षण और जनगणनाएँ लिखीं। इन सरकारी काग़ज़ों को क्या कहते हैं — इस काल का सबसे समृद्ध पर सबसे एकपक्षीय स्रोत?",
          mr: "वसाहती राज्याने झपाटल्यागत अहवाल, पाहण्या आणि जनगणना लिहिल्या. या सरकारी कागदांना काय म्हणतात — या काळाचा सर्वांत समृद्ध पण सर्वांत एकतर्फी स्रोत?",
        },
        statement: {
          en: "Official records are the state's own paperwork — abundant and detailed, but written from the ruler's desk and blind to much it did not wish to see.",
          hi: "सरकारी अभिलेख राज्य की अपनी काग़ज़ी कार्रवाई हैं — प्रचुर और विस्तृत, पर शासक की मेज़ से लिखे और उसके अनदेखे बहुत-कुछ के प्रति अंधे।",
          mr: "अधिकृत दस्तऐवज म्हणजे राज्याचे स्वतःचे दप्तर — विपुल आणि तपशीलवार, पण शासकाच्या टेबलावरून लिहिलेले आणि त्याला न पाहायचे असलेल्या बऱ्याचकडे आंधळे.",
        },
        detail: {
          en: "The British filed everything — but the record shows what officials measured, not always what people lived.",
          hi: "अंग्रेज़ों ने सब कुछ दर्ज किया — पर अभिलेख वह दिखाता है जो अफ़सरों ने नापा, हमेशा वह नहीं जो लोगों ने जिया।",
          mr: "इंग्रजांनी सारे नोंदवले — पण दस्तऐवज ते दाखवतो जे अधिकाऱ्यांनी मोजले, नेहमी ते नाही जे लोक जगले.",
        },
        extra: {
          en: "Diaries, folk songs, pamphlets and newspapers fill the silences the archive leaves.",
          hi: "डायरियाँ, लोकगीत, परचे और अख़बार वे चुप्पियाँ भरते हैं जो अभिलेखागार छोड़ देता है।",
          mr: "रोजनिशी, लोकगीते, पत्रके आणि वृत्तपत्रे अभिलेखागार सोडलेल्या शांतता भरतात.",
        },
        pair: {
          left: {
            en: "The state's paperwork",
            hi: "राज्य की काग़ज़ी कार्रवाई",
            mr: "राज्याचे दप्तर",
          },
          right: {
            en: "rich but one-sided",
            hi: "समृद्ध पर एकपक्षीय",
            mr: "समृद्ध पण एकतर्फी",
          },
        },
      },
      {
        id: "surveys",
        name: { en: "Surveys", hi: "सर्वेक्षण", mr: "पाहण्या (सर्वेक्षणे)" },
        kind: "source",
        prompt: {
          en: "To rule the land the British mapped it, counted it and classified it — which systematic recording tool served knowing AND controlling at once?",
          hi: "भूमि पर शासन के लिए अंग्रेज़ों ने उसे नापा, गिना और वर्गीकृत किया — कौन-सा व्यवस्थित अभिलेखन औज़ार जानने और नियंत्रण, दोनों की एक साथ सेवा करता था?",
          mr: "जमिनीवर राज्य करण्यासाठी इंग्रजांनी ती मोजली, गणली आणि वर्गीकृत केली — कोणते पद्धतशीर नोंद-हत्यार जाणणे आणि नियंत्रण, दोन्ही एकाच वेळी करत होते?",
        },
        statement: {
          en: "Surveys measured and mapped everything — land, revenue, castes, forests — because to govern a thing the state first had to count it.",
          hi: "सर्वेक्षणों ने सब कुछ नापा और मानचित्रित किया — भूमि, राजस्व, जातियाँ, वन — क्योंकि किसी चीज़ पर शासन के लिए राज्य को पहले उसे गिनना पड़ता था।",
          mr: "पाहण्यांनी सारे मोजले आणि नकाशांकित केले — जमीन, महसूल, जाती, वने — कारण एखाद्या गोष्टीवर राज्य करायला राज्याला आधी ती मोजावी लागे.",
        },
        detail: {
          en: "The Survey of India mapped the subcontinent; the census counted its people every ten years from 1881.",
          hi: "भारतीय सर्वेक्षण ने उपमहाद्वीप का मानचित्र बनाया; जनगणना ने 1881 से हर दस वर्ष उसके लोग गिने।",
          mr: "भारतीय सर्वेक्षणाने उपखंडाचा नकाशा केला; जनगणनेने 1881 पासून दर दहा वर्षांनी लोक मोजले.",
        },
        extra: {
          en: "Knowledge was power's tool — a map is easier to tax and to march an army across.",
          hi: "ज्ञान सत्ता का औज़ार था — नक़्शे पर कर लगाना और सेना दौड़ाना आसान है।",
          mr: "ज्ञान हे सत्तेचे हत्यार — नकाशावर कर लावणे आणि सैन्य पळवणे सोपे.",
        },
        pair: {
          left: {
            en: "Counted to be controlled",
            hi: "नियंत्रण को गिना गया",
            mr: "नियंत्रणासाठी मोजलेले",
          },
          right: {
            en: "a map that rules",
            hi: "शासन करता नक़्शा",
            mr: "राज्य करणारा नकाशा",
          },
        },
      },
      {
        id: "periodisation",
        name: { en: "Periodisation", hi: "काल-विभाजन", mr: "कालविभाजन" },
        kind: "idea",
        prompt: {
          en: "James Mill split India's past into 'Hindu', 'Muslim' and 'British' ages. Which act of dividing history into named periods was he performing — and distorting?",
          hi: "जेम्स मिल ने भारत के अतीत को 'हिंदू', 'मुस्लिम' और 'ब्रिटिश' युगों में बाँटा। इतिहास को नामित कालों में बाँटने का कौन-सा काम वह कर रहा था — और बिगाड़ रहा था?",
          mr: "जेम्स मिलने भारताच्या भूतकाळाला 'हिंदू', 'मुस्लीम' आणि 'ब्रिटिश' युगांत वाटले. इतिहासाला नावाच्या कालखंडांत वाटण्याचे कोणते काम तो करत होता — आणि बिघडवत होता?",
        },
        statement: {
          en: "Periodisation labels stretches of the past — but Mill's religion-named ages judged more than they described, and historians distrust them.",
          hi: "काल-विभाजन अतीत के हिस्सों को नाम देता है — पर मिल के धर्म-नामित युगों ने वर्णन से ज़्यादा फ़ैसला सुनाया, और इतिहासकार उन पर भरोसा नहीं करते।",
          mr: "कालविभाजन भूतकाळाच्या भागांना नावे देते — पण मिलच्या धर्म-नावाच्या युगांनी वर्णनाहून जास्त निवाडा दिला, आणि इतिहासकार त्यांवर अविश्वास ठेवतात.",
        },
        detail: {
          en: "Mill cast the 'British' age as light after two dark ages — a story that flattered the ruler and slandered the ruled.",
          hi: "मिल ने 'ब्रिटिश' युग को दो अंधकार-युगों के बाद प्रकाश बताया — ऐसी कहानी जो शासक की चापलूसी और शासित की निंदा करती थी।",
          mr: "मिलने 'ब्रिटिश' युगाला दोन अंधकार-युगांनंतरचा प्रकाश म्हटले — अशी कथा जी शासकाची खुशामत आणि शासितांची निंदा करी.",
        },
        extra: {
          en: "Naming a period is never neutral — the name smuggles in a verdict.",
          hi: "किसी काल को नाम देना कभी तटस्थ नहीं — नाम अपने साथ एक फ़ैसला छिपा लाता है।",
          mr: "एखाद्या कालखंडाला नाव देणे कधीच तटस्थ नाही — नाव सोबत एक निवाडा लपवून आणते.",
        },
        pair: {
          left: {
            en: "History cut into ages",
            hi: "युगों में कटा इतिहास",
            mr: "युगांत कापलेला इतिहास",
          },
          right: {
            en: "the name smuggles a verdict",
            hi: "नाम में छिपा फ़ैसला",
            mr: "नावात लपलेला निवाडा",
          },
        },
      },
      {
        id: "national-archives",
        name: {
          en: "The National Archives",
          hi: "राष्ट्रीय अभिलेखागार",
          mr: "राष्ट्रीय अभिलेखागार",
        },
        kind: "source",
        prompt: {
          en: "Where are the colonial state's letters, orders and files kept for historians to read — the great storehouse born of the record-keeping habit itself?",
          hi: "औपनिवेशिक राज्य के पत्र, आदेश और फ़ाइलें इतिहासकारों के पढ़ने को कहाँ रखी हैं — वह विशाल भंडार जो अभिलेख-रखने की आदत से ही जन्मा?",
          mr: "वसाहती राज्याची पत्रे, हुकूम आणि फायली इतिहासकारांना वाचण्यासाठी कुठे ठेवल्या आहेत — नोंद-ठेवण्याच्या सवयीतूनच जन्मलेले ते विशाल कोठार?",
        },
        statement: {
          en: "The National Archives holds the colonial paper mountain — its very existence is a legacy of the state's mania for recording.",
          hi: "राष्ट्रीय अभिलेखागार औपनिवेशिक काग़ज़-पर्वत सँभालता है — उसका होना ही राज्य की अभिलेख-सनक की विरासत है।",
          mr: "राष्ट्रीय अभिलेखागार वसाहती कागद-पर्वत सांभाळते — त्याचे असणेच राज्याच्या नोंद-ध्यासाचा वारसा.",
        },
        pair: {
          left: {
            en: "The paper mountain",
            hi: "काग़ज़-पर्वत",
            mr: "कागद-पर्वत",
          },
          right: {
            en: "a mania preserved",
            hi: "सँभाली गई सनक",
            mr: "जपलेला ध्यास",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the source to what it reveals best: A-a district officer's revenue report, B-a peasant's protest song, C-a colonial census table. Which trio is right?",
          hi: "स्रोत को उसकी सबसे अच्छी गवाही से मिलाइए: अ-ज़िला अफ़सर की राजस्व-रिपोर्ट, ब-किसान का विरोध-गीत, स-औपनिवेशिक जनगणना-तालिका। कौन-सी तिकड़ी सही है?",
          mr: "साधनाला त्याच्या उत्तम साक्षीशी जुळवा: अ-जिल्हा अधिकाऱ्याचा महसूल-अहवाल, ब-शेतकऱ्याचे निषेध-गीत, क-वसाहती जनगणना-तक्ता. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: what the state wanted to collect · B: how the taxed actually felt · C: how officials classified people",
            hi: "अ: राज्य क्या वसूलना चाहता था · ब: करदाता वास्तव में कैसा महसूस करते थे · स: अफ़सरों ने लोगों को कैसे वर्गीकृत किया",
            mr: "अ: राज्याला काय वसूल करायचे होते · ब: करदात्यांना खरे कसे वाटले · क: अधिकाऱ्यांनी लोकांचे वर्गीकरण कसे केले",
          },
          {
            en: "A: how the taxed felt · B: what the state collected · C: peasant emotion",
            hi: "अ: करदाता कैसा महसूस करते थे · ब: राज्य क्या वसूलता था · स: किसान की भावना",
            mr: "अ: करदात्यांना कसे वाटले · ब: राज्याने काय वसूल केले · क: शेतकऱ्याची भावना",
          },
          {
            en: "A: how officials classified people · B: revenue targets · C: protest feeling",
            hi: "अ: अफ़सरों का वर्गीकरण · ब: राजस्व-लक्ष्य · स: विरोध की भावना",
            mr: "अ: अधिकाऱ्यांचे वर्गीकरण · ब: महसूल-लक्ष्य · क: निषेधाची भावना",
          },
          {
            en: "All three sources reveal exactly the same thing",
            hi: "तीनों स्रोत ठीक एक ही बात उजागर करते हैं",
            mr: "तिन्ही साधने नेमकी एकच गोष्ट उघड करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each source answers what it was made for. The revenue report is the state talking to itself about its takings — perfect for intentions, poor for feelings. The protest song is the taxed answering back — the only voice for how the burden LIVED. The census reveals the categories the rulers imposed. Read the official file for the plan, the song for the experience, and never let one stand in for the other.",
          hi: "हर स्रोत उसी का उत्तर देता है जिसके लिए वह बना। राजस्व-रिपोर्ट राज्य का अपनी वसूली पर अपने-आप से संवाद है — इरादों के लिए बढ़िया, भावनाओं के लिए बुरी। विरोध-गीत करदाता का पलटवार है — भार कैसे जिया गया, इसकी इकलौती आवाज़। जनगणना शासकों द्वारा थोपी श्रेणियाँ उजागर करती है। योजना के लिए सरकारी फ़ाइल पढ़िए, अनुभव के लिए गीत, और एक को दूसरे की जगह कभी मत खड़ा कीजिए।",
          mr: "प्रत्येक साधन ज्यासाठी बनले त्याचे उत्तर देते. महसूल-अहवाल म्हणजे राज्य आपल्या वसुलीबद्दल स्वतःशी बोलणे — हेतूंसाठी उत्तम, भावनांसाठी वाईट. निषेध-गीत म्हणजे करदात्याचा प्रतिवार — ओझे कसे जगले याचा एकमेव आवाज. जनगणना शासकांनी लादलेल्या वर्गवाऱ्या उघड करते. योजनेसाठी सरकारी फाईल वाचा, अनुभवासाठी गीत, आणि एकाला दुसऱ्याच्या जागी कधीही उभे करू नका.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The colonial archive is enormous, yet historians warn a history built on it alone would be distorted. Why can the RICHEST source still mislead?",
          hi: "औपनिवेशिक अभिलेखागार विशाल है, फिर भी इतिहासकार चेताते हैं कि केवल उसी पर बना इतिहास विकृत होगा। सबसे समृद्ध स्रोत फिर भी भटका क्यों सकता है?",
          mr: "वसाहती अभिलेखागार प्रचंड आहे, तरी इतिहासकार बजावतात की केवळ त्यावर बांधलेला इतिहास विकृत असेल. सर्वांत समृद्ध स्रोत तरीही दिशाभूल का करू शकतो?",
        },
        choices: [
          {
            en: "It records the world as the state saw and measured it — the literate ruler's categories and concerns — so it is loud on taxes and censuses and near-silent on the illiterate majority's inner life; abundance is not the same as balance",
            hi: "वह दुनिया को वैसे दर्ज करता है जैसे राज्य ने उसे देखा-नापा — साक्षर शासक की श्रेणियाँ और चिंताएँ — अतः कर और जनगणना पर मुखर, और निरक्षर बहुमत के भीतरी जीवन पर लगभग मौन; प्रचुरता संतुलन नहीं है",
            mr: "तो जग तसे नोंदवतो जसे राज्याने पाहिले-मोजले — साक्षर शासकाच्या वर्गवाऱ्या आणि चिंता — म्हणून कर आणि जनगणनेवर मुखर, आणि निरक्षर बहुसंख्यांच्या अंतरंगावर जवळजवळ मूक; विपुलता म्हणजे समतोल नव्हे",
          },
          {
            en: "The archive's paper has simply decayed too much to read",
            hi: "अभिलेखागार का काग़ज़ बस इतना सड़ गया कि पढ़ा न जाए",
            mr: "अभिलेखागाराचा कागद नुसता इतका कुजला की वाचता येत नाही",
          },
          {
            en: "Large sources are always less reliable than small ones",
            hi: "बड़े स्रोत छोटे से हमेशा कम विश्वसनीय होते हैं",
            mr: "मोठी साधने लहानांहून नेहमी कमी विश्वासार्ह",
          },
          {
            en: "British officials could not write accurately",
            hi: "अंग्रेज़ अफ़सर सही-सही लिख ही नहीं सकते थे",
            mr: "इंग्रज अधिकारी अचूक लिहूच शकत नव्हते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Size and balance are different virtues. The archive is vast because the state wrote incessantly — but it wrote about what the state cared to see: revenue, order, classification. Millions who never held a pen leave almost no direct trace in it, and the peasant's grief, the weaver's ruin, the woman's day are recorded, if at all, only as an official's aside. A history read only from the ruler's files becomes the ruler's story retold. The corrective is to cross the loud archive with the quiet sources — songs, oral memory, private letters — and to read the official record as much for its silences as its statements.",
          hi: "आकार और संतुलन अलग-अलग गुण हैं। अभिलेखागार विशाल है क्योंकि राज्य निरंतर लिखता रहा — पर उसने वही लिखा जो राज्य देखना चाहता था: राजस्व, व्यवस्था, वर्गीकरण। जिन लाखों ने कभी क़लम नहीं पकड़ी, उनका उसमें लगभग कोई सीधा निशान नहीं, और किसान का शोक, बुनकर की तबाही, स्त्री का दिन — अगर दर्ज है तो केवल किसी अफ़सर की टिप्पणी के रूप में। केवल शासक की फ़ाइलों से पढ़ा इतिहास शासक की ही कहानी का दोहराव बन जाता है। सुधार यह है कि मुखर अभिलेखागार को ख़ामोश स्रोतों — गीत, मौखिक स्मृति, निजी पत्र — से मिलाया जाए, और सरकारी अभिलेख को उसके कथनों जितना ही उसकी चुप्पियों के लिए पढ़ा जाए।",
          mr: "आकार आणि समतोल हे वेगळे गुण. अभिलेखागार प्रचंड कारण राज्य अखंड लिहीत राहिले — पण त्याने तेच लिहिले जे राज्याला पाहायचे होते: महसूल, सुव्यवस्था, वर्गीकरण. ज्या लाखांनी कधी लेखणी धरली नाही, त्यांचा त्यात जवळजवळ थेट मागमूस नाही, आणि शेतकऱ्याचे दुःख, विणकराची नासाडी, स्त्रीचा दिवस — नोंदले असल्यास फक्त एखाद्या अधिकाऱ्याच्या टिपणीच्या रूपात. केवळ शासकाच्या फायलींतून वाचलेला इतिहास शासकाच्याच कथेची पुनरावृत्ती होतो. उपाय म्हणजे मुखर अभिलेखागाराला मूक स्रोतांशी — गीते, मौखिक स्मृती, खासगी पत्रे — जुळवणे, आणि सरकारी दस्तऐवज त्याच्या विधानांइतकाच त्याच्या शांततेसाठी वाचणे.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — From Trade to Territory (a company becomes a king)          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-trade-to-territory",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 2 — From Trade to Territory",
      hi: "अध्याय 2 — व्यापार से साम्राज्य तक",
      mr: "प्रकरण 2 — व्यापारापासून साम्राज्यापर्यंत",
    },
    name: {
      en: "From Trade to Territory",
      hi: "व्यापार से साम्राज्य तक",
      mr: "व्यापारापासून साम्राज्यापर्यंत",
    },
    summary: {
      en: "How a trading company became a government: a battle bought with bribes, a right to revenue that turned merchant into ruler, a doctrine that swallowed heirless kingdoms — and an army of Indian soldiers paid to hold India down.",
      hi: "एक व्यापारिक कंपनी सरकार कैसे बनी: रिश्वतों से ख़रीदी लड़ाई, राजस्व का अधिकार जिसने व्यापारी को शासक बनाया, एक सिद्धांत जो निःसंतान राज्यों को निगल गया — और भारतीय सिपाहियों की सेना जो भारत को ही दबाने के लिए वेतन पाती थी।",
      mr: "एक व्यापारी कंपनी सरकार कशी झाली: लाचांनी विकत घेतलेली लढाई, महसुलाचा अधिकार ज्याने व्यापाऱ्याला शासक केले, वारसहीन राज्ये गिळणारा सिद्धान्त — आणि भारतालाच दाबण्यासाठी पगार घेणारी भारतीय शिपायांची फौज.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "east-india-company",
        name: {
          en: "The East India Company",
          hi: "ईस्ट इंडिया कंपनी",
          mr: "ईस्ट इंडिया कंपनी",
        },
        kind: "power",
        prompt: {
          en: "Which English trading company arrived for pepper and cloth in 1600 and left, two centuries later, ruling a subcontinent?",
          hi: "कौन-सी अंग्रेज़ व्यापारिक कंपनी 1600 में काली मिर्च और कपड़े के लिए आई और दो सदी बाद उपमहाद्वीप पर शासन करती छोड़ गई?",
          mr: "कोणती इंग्रज व्यापारी कंपनी 1600 मध्ये मिरी आणि कापडासाठी आली आणि दोन शतकांनी उपखंडावर राज्य करत गेली?",
        },
        statement: {
          en: "The East India Company came to trade and stayed to rule — a merchant firm with its own army, mint and law.",
          hi: "ईस्ट इंडिया कंपनी व्यापार को आई और शासन को रुक गई — अपनी सेना, टकसाल और क़ानून वाली एक व्यापारी फ़र्म।",
          mr: "ईस्ट इंडिया कंपनी व्यापाराला आली आणि राज्याला थांबली — स्वतःची फौज, टांकसाळ आणि कायदा असलेली एक व्यापारी पेढी.",
        },
        detail: {
          en: "A royal charter gave it a monopoly on English trade with the East — a company built on a licence to be the only buyer.",
          hi: "एक शाही चार्टर ने उसे पूर्व से अंग्रेज़ी व्यापार का एकाधिकार दिया — इकलौता ख़रीदार होने के लाइसेंस पर खड़ी कंपनी।",
          mr: "एका राजशाही सनदेने तिला पूर्वेशी इंग्रजी व्यापाराची मक्तेदारी दिली — एकमेव खरेदीदार असण्याच्या परवान्यावर उभी कंपनी.",
        },
        extra: {
          en: "A company ruling millions was strange even then — Britain's own Parliament kept tightening its leash.",
          hi: "करोड़ों पर शासन करती कंपनी तब भी अजीब थी — ब्रिटेन की अपनी संसद उसकी रस्सी कसती रही।",
          mr: "कोट्यवधींवर राज्य करणारी कंपनी तेव्हाही विचित्र होती — ब्रिटनची स्वतःची संसद तिचा दोर आवळत राहिली.",
        },
        pair: {
          left: {
            en: "A firm that became a state",
            hi: "राज्य बनी फ़र्म",
            mr: "राज्य झालेली पेढी",
          },
          right: {
            en: "army, mint and law of its own",
            hi: "अपनी सेना, टकसाल, क़ानून",
            mr: "स्वतःची फौज, टांकसाळ, कायदा",
          },
        },
      },
      {
        id: "plassey",
        name: {
          en: "The Battle of Plassey",
          hi: "प्लासी का युद्ध",
          mr: "प्लासीची लढाई",
        },
        kind: "event",
        prompt: {
          en: "Which 1757 battle did the Company win less by fighting than by bribing the Nawab's commander to stand aside?",
          hi: "1757 की कौन-सी लड़ाई कंपनी ने लड़कर कम, नवाब के सेनापति को किनारे खड़े रहने की रिश्वत देकर ज़्यादा जीती?",
          mr: "1757 ची कोणती लढाई कंपनीने लढून कमी, नवाबाच्या सेनापतीला बाजूला उभे राहण्याची लाच देऊन जास्त जिंकली?",
        },
        statement: {
          en: "Plassey (1757) was won by treachery bought — Mir Jafar's betrayal, not the Company's soldiers, decided the day.",
          hi: "प्लासी (1757) ख़रीदी गई ग़द्दारी से जीता गया — मीर जाफ़र की बेवफ़ाई ने, कंपनी के सिपाहियों ने नहीं, दिन तय किया।",
          mr: "प्लासी (1757) विकत घेतलेल्या फितुरीने जिंकली — मीर जाफरच्या बेइमानीने, कंपनीच्या शिपायांनी नव्हे, दिवस ठरवला.",
        },
        detail: {
          en: "The Company installed the pliant Mir Jafar as Nawab — a puppet who owed his throne to his patrons.",
          hi: "कंपनी ने आज्ञाकारी मीर जाफ़र को नवाब बिठाया — एक कठपुतली, जिसका तख़्त उसके संरक्षकों का दिया था।",
          mr: "कंपनीने आज्ञाधारक मीर जाफरला नवाब बसवले — एक कठपुतळी, जिचे तख्त त्याच्या आश्रयदात्यांचे देणे.",
        },
        extra: {
          en: "It was the first taste of installing rulers — a habit that would swallow kingdom after kingdom.",
          hi: "यह शासक बिठाने का पहला स्वाद था — एक आदत जो राज्य-दर-राज्य निगलती गई।",
          mr: "हे शासक बसवण्याचे पहिले चवीचे घास — एक सवय जी राज्यामागून राज्य गिळत गेली.",
        },
        pair: {
          left: {
            en: "A battle bought, not fought",
            hi: "लड़ी नहीं, ख़रीदी लड़ाई",
            mr: "लढलेली नव्हे, विकत घेतलेली लढाई",
          },
          right: {
            en: "Mir Jafar's betrayal",
            hi: "मीर जाफ़र की ग़द्दारी",
            mr: "मीर जाफरची फितुरी",
          },
        },
      },
      {
        id: "diwani",
        name: {
          en: "The Diwani of Bengal",
          hi: "बंगाल की दीवानी",
          mr: "बंगालची दिवाणी",
        },
        kind: "grant",
        prompt: {
          en: "Which 1765 right to collect Bengal's land revenue turned the Company from a trader into a government that taxed millions?",
          hi: "1765 का कौन-सा अधिकार, बंगाल का भू-राजस्व वसूलने का, कंपनी को व्यापारी से करोड़ों पर कर लगाती सरकार बना गया?",
          mr: "1765 चा कोणता अधिकार, बंगालचा भू-महसूल वसूल करण्याचा, कंपनीला व्यापाऱ्यातून कोट्यवधींवर कर लावणाऱ्या सरकारात बदलून गेला?",
        },
        statement: {
          en: "The Diwani gave the Company Bengal's revenue in 1765 — now it could buy Indian goods with Indians' own taxes, and rule to collect them.",
          hi: "दीवानी ने 1765 में कंपनी को बंगाल का राजस्व दिया — अब वह भारतीयों के अपने करों से भारतीय माल ख़रीद सकती थी, और वसूली के लिए शासन।",
          mr: "दिवाणीने 1765 मध्ये कंपनीला बंगालचा महसूल दिला — आता ती भारतीयांच्या स्वतःच्या करांतून भारतीय माल घेऊ शके, आणि वसुलीसाठी राज्य.",
        },
        detail: {
          en: "The Mughal emperor granted it — a paper right that made the merchant the master of the richest province.",
          hi: "मुग़ल बादशाह ने इसे दिया — एक काग़ज़ी अधिकार जिसने व्यापारी को सबसे समृद्ध सूबे का स्वामी बना दिया।",
          mr: "मुघल बादशहाने ते दिले — एक कागदी अधिकार ज्याने व्यापाऱ्याला सर्वांत समृद्ध सुभ्याचा मालक केले.",
        },
        extra: {
          en: "Trade that once needed silver from Britain now paid for itself from Bengal — the plunder financed the profit.",
          hi: "जो व्यापार कभी ब्रिटेन से चाँदी माँगता था अब बंगाल से अपना ख़र्च निकालता था — लूट ने मुनाफ़े का ख़र्च उठाया।",
          mr: "जो व्यापार कधी ब्रिटनहून चांदी मागे तो आता बंगालातून स्वतःचा खर्च काढी — लुटीने नफ्याचा खर्च उचलला.",
        },
        pair: {
          left: {
            en: "The right to Bengal's revenue",
            hi: "बंगाल के राजस्व का अधिकार",
            mr: "बंगालच्या महसुलाचा अधिकार",
          },
          right: {
            en: "trader turned ruler",
            hi: "शासक बना व्यापारी",
            mr: "शासक झालेला व्यापारी",
          },
        },
      },
      {
        id: "subsidiary-alliance",
        name: {
          en: "The Subsidiary Alliance",
          hi: "सहायक संधि",
          mr: "तैनाती फौज (सबसिडियरी अलायन्स)",
        },
        kind: "policy",
        prompt: {
          en: "Which arrangement forced allied Indian rulers to host a Company army they had to pay for — and disband their own?",
          hi: "कौन-सी व्यवस्था सहयोगी भारतीय शासकों को कंपनी की सेना रखने पर विवश करती थी, जिसका ख़र्च वे उठाते — और अपनी सेना भंग करते?",
          mr: "कोणती व्यवस्था मित्र भारतीय शासकांना कंपनीची फौज ठेवायला भाग पाडत असे, जिचा खर्च ते उचलत — आणि आपली फौज बरखास्त करत?",
        },
        statement: {
          en: "The Subsidiary Alliance made rulers pay for their own captivity — keep a Company force, foot its bill, and surrender your foreign policy.",
          hi: "सहायक संधि शासकों से उनकी अपनी क़ैद का दाम चुकवाती थी — कंपनी की सेना रखिए, उसका बिल भरिए, और अपनी विदेश-नीति सौंप दीजिए।",
          mr: "तैनाती फौज शासकांकडून त्यांच्याच बंदिवासाची किंमत घेत असे — कंपनीची फौज ठेवा, तिचे बिल भरा, आणि आपले परराष्ट्र-धोरण सोपवा.",
        },
        detail: {
          en: "Rulers who could not pay ceded territory instead — the debt itself ate their lands.",
          hi: "जो शासक चुका न पाते वे ज़मीन दे देते — क़र्ज़ ही उनकी भूमि खा जाता था।",
          mr: "जे शासक देऊ शकत नसत ते जमीन देत — कर्जच त्यांची भूमी खात असे.",
        },
        extra: {
          en: "It disarmed India kingdom by kingdom without a single declared war.",
          hi: "इसने बिना एक भी घोषित युद्ध के भारत को राज्य-दर-राज्य निःशस्त्र किया।",
          mr: "याने एकही जाहीर युद्धाशिवाय भारताला राज्यामागून राज्य निःशस्त्र केले.",
        },
        pair: {
          left: {
            en: "Pay for your own captor",
            hi: "अपने ही बंधक का दाम",
            mr: "आपल्याच बंदिवानाची किंमत",
          },
          right: {
            en: "army hosted, sovereignty surrendered",
            hi: "सेना रखी, संप्रभुता सौंपी",
            mr: "फौज ठेवली, सार्वभौमत्व सोपवले",
          },
        },
      },
      {
        id: "doctrine-lapse",
        name: {
          en: "The Doctrine of Lapse",
          hi: "व्यपगत का सिद्धांत",
          mr: "खालसा धोरण (डॉक्ट्रिन ऑफ लॅप्स)",
        },
        kind: "policy",
        prompt: {
          en: "Under Dalhousie, which rule annexed any kingdom whose ruler died without a natural-born heir — adopted sons refused?",
          hi: "डलहौज़ी के अधीन कौन-सा नियम उस राज्य को हड़प लेता था जिसके शासक की मृत्यु प्राकृतिक उत्तराधिकारी बिना हो — गोद लिए पुत्र नामंज़ूर?",
          mr: "डलहौसीच्या काळात कोणता नियम त्या राज्याला गिळंकृत करी ज्याचा शासक नैसर्गिक वारसाशिवाय मरे — दत्तक पुत्र नामंजूर?",
        },
        statement: {
          en: "The Doctrine of Lapse swallowed heirless kingdoms — the Company simply refused to recognise adopted sons, and annexed.",
          hi: "व्यपगत का सिद्धांत निःसंतान राज्यों को निगल जाता — कंपनी गोद लिए पुत्रों को मानने से इनकार कर देती, और हड़प लेती।",
          mr: "खालसा धोरण वारसहीन राज्ये गिळंकृत करी — कंपनी दत्तक पुत्रांना मानायला नकार देई, आणि गिळंकृत करी.",
        },
        detail: {
          en: "Satara, Jhansi, Nagpur and more fell to it — a legal doctrine wielded as a weapon of expansion.",
          hi: "सतारा, झाँसी, नागपुर और कई इसकी भेंट चढ़े — विस्तार के हथियार की तरह चलाया एक क़ानूनी सिद्धांत।",
          mr: "सातारा, झाशी, नागपूर आणि आणखी याला बळी पडली — विस्ताराचे हत्यार म्हणून वापरलेला एक कायदेशीर सिद्धान्त.",
        },
        extra: {
          en: "The queen of Jhansi's fury at it would blaze into 1857 — annexation breeding rebellion.",
          hi: "झाँसी की रानी का इस पर क्रोध 1857 में भड़क उठेगा — हड़प ने विद्रोह जना।",
          mr: "झाशीच्या राणीचा यावरचा संताप 1857 मध्ये भडकेल — गिळंकृतीने बंड जन्मले.",
        },
        pair: {
          left: {
            en: "No heir, no kingdom",
            hi: "उत्तराधिकारी नहीं, राज्य नहीं",
            mr: "वारस नाही, राज्य नाही",
          },
          right: {
            en: "law as a weapon",
            hi: "हथियार बना क़ानून",
            mr: "हत्यार झालेला कायदा",
          },
        },
      },
      {
        id: "sepoy-army",
        name: { en: "The sepoy army", hi: "सिपाही सेना", mr: "शिपाई फौज" },
        kind: "instrument",
        prompt: {
          en: "Which force of Indian soldiers, trained and paid by the Company, was the actual muscle that conquered and held India?",
          hi: "कंपनी द्वारा प्रशिक्षित और वेतनभोगी भारतीय सिपाहियों की कौन-सी सेना भारत को जीतने और थामने की असली ताक़त थी?",
          mr: "कंपनीने प्रशिक्षित आणि पगारी भारतीय शिपायांची कोणती फौज भारत जिंकण्याची आणि धरून ठेवण्याची खरी ताकद होती?",
        },
        statement: {
          en: "The sepoys were Indians in Company uniform — India was conquered largely by Indian soldiers paid to hold it down.",
          hi: "सिपाही कंपनी की वर्दी में भारतीय थे — भारत बड़े पैमाने पर उन्हीं भारतीय सिपाहियों से जीता गया जो उसे दबाने के लिए वेतन पाते थे।",
          mr: "शिपाई म्हणजे कंपनीच्या गणवेशातले भारतीय — भारत मोठ्या प्रमाणात त्याच भारतीय शिपायांनी जिंकला जे त्याला दाबण्यासाठी पगार घेत.",
        },
        detail: {
          en: "Their grievances — pay, service overseas, respect for caste and faith — would one day turn their guns around.",
          hi: "उनकी शिकायतें — वेतन, समुद्रपार सेवा, जाति-धर्म का आदर — एक दिन उनकी बंदूकें पलट देंगी।",
          mr: "त्यांच्या तक्रारी — पगार, समुद्रापार सेवा, जात-धर्माचा आदर — एक दिवस त्यांच्या बंदुका उलटवतील.",
        },
        extra: {
          en: "An empire held by the ruled is an empire on a fault line — 1857 was the crack.",
          hi: "शासितों से थामा साम्राज्य दरार पर खड़ा साम्राज्य है — 1857 वही दरार थी।",
          mr: "शासितांनी धरलेले साम्राज्य म्हणजे भेगेवर उभे साम्राज्य — 1857 हीच ती भेग.",
        },
        pair: {
          left: {
            en: "Indians in Company uniform",
            hi: "कंपनी की वर्दी में भारतीय",
            mr: "कंपनीच्या गणवेशातले भारतीय",
          },
          right: {
            en: "paid to hold India down",
            hi: "भारत दबाने को वेतन",
            mr: "भारत दाबायला पगार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the Company's rise in order. Which sequence is right?",
          hi: "कंपनी के उदय को क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "कंपनीचा उदय क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Charter to trade (1600) → victory at Plassey (1757) → Diwani of Bengal (1765) → Subsidiary Alliance and Lapse spread the rule",
            hi: "व्यापार का चार्टर (1600) → प्लासी में विजय (1757) → बंगाल की दीवानी (1765) → सहायक संधि और व्यपगत ने शासन फैलाया",
            mr: "व्यापाराची सनद (1600) → प्लासीत विजय (1757) → बंगालची दिवाणी (1765) → तैनाती फौज आणि खालसा धोरणाने राज्य पसरवले",
          },
          {
            en: "Diwani (1765) → charter (1600) → Plassey (1757) → Subsidiary Alliance",
            hi: "दीवानी (1765) → चार्टर (1600) → प्लासी (1757) → सहायक संधि",
            mr: "दिवाणी (1765) → सनद (1600) → प्लासी (1757) → तैनाती फौज",
          },
          {
            en: "Plassey (1757) → charter (1600) → Doctrine of Lapse → Diwani",
            hi: "प्लासी (1757) → चार्टर (1600) → व्यपगत → दीवानी",
            mr: "प्लासी (1757) → सनद (1600) → खालसा धोरण → दिवाणी",
          },
          {
            en: "Charter (1600) → Diwani (1765) → Plassey (1757) → Subsidiary Alliance",
            hi: "चार्टर (1600) → दीवानी (1765) → प्लासी (1757) → सहायक संधि",
            mr: "सनद (1600) → दिवाणी (1765) → प्लासी (1757) → तैनाती फौज",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each step made the next possible. The 1600 charter licensed trade; Plassey in 1757 first put a puppet on a throne; the Diwani in 1765 handed over an entire province's revenue, converting merchant to ruler; and only a rich ruler could then push the Subsidiary Alliance and the Doctrine of Lapse across the map. Money bought armies, armies won revenue, revenue bought more armies — a spiral, read in dates.",
          hi: "हर क़दम ने अगले को संभव किया। 1600 के चार्टर ने व्यापार का लाइसेंस दिया; 1757 के प्लासी ने पहली बार तख़्त पर कठपुतली बिठाई; 1765 की दीवानी ने पूरे सूबे का राजस्व सौंपा, व्यापारी को शासक बनाया; और तभी एक धनी शासक सहायक संधि और व्यपगत को नक़्शे भर फैला सका। पैसे ने सेनाएँ ख़रीदीं, सेनाओं ने राजस्व जीता, राजस्व ने और सेनाएँ — एक भँवर, तारीख़ों में पढ़ा हुआ।",
          mr: "प्रत्येक पाऊल पुढचे शक्य करी. 1600 च्या सनदेने व्यापाराचा परवाना दिला; 1757 च्या प्लासीने पहिल्यांदा तख्तावर कठपुतळी बसवली; 1765 च्या दिवाणीने अख्ख्या सुभ्याचा महसूल सोपवला, व्यापाऱ्याला शासक केले; आणि तेव्हाच श्रीमंत शासक तैनाती फौज आणि खालसा धोरण नकाशाभर पसरवू शकला. पैशाने फौजा घेतल्या, फौजांनी महसूल जिंकला, महसुलाने आणखी फौजा — एक भोवरा, तारखांत वाचलेला.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Company conquered India largely with Indian sepoys and paid for the conquest with Indian revenue. How could a foreign firm rule a subcontinent using the subcontinent's own soldiers and money?",
          hi: "कंपनी ने भारत को बड़े पैमाने पर भारतीय सिपाहियों से जीता और विजय का ख़र्च भारतीय राजस्व से चुकाया। एक विदेशी फ़र्म उपमहाद्वीप को उसी के सिपाहियों और पैसे से कैसे शासित कर सकी?",
          mr: "कंपनीने भारत मोठ्या प्रमाणात भारतीय शिपायांनी जिंकला आणि विजयाचा खर्च भारतीय महसुलाने भरला. एक परकी पेढी उपखंडाला त्याच्याच शिपायांनी आणि पैशाने कशी शासित करू शकली?",
        },
        choices: [
          {
            en: "It exploited a divided land: rulers who would not unite were bribed, allied, or picked off one at a time, while revenue from each conquest paid the sepoys to take the next — the subcontinent financed and manned its own subjugation because it never faced the Company as one",
            hi: "उसने बँटी हुई भूमि का फ़ायदा उठाया: जो शासक एक न होते उन्हें रिश्वत, संधि या एक-एक कर निपटाया जाता, और हर विजय का राजस्व सिपाहियों को अगली विजय का वेतन देता — उपमहाद्वीप ने अपनी ही अधीनता का ख़र्च और सैनिक जुटाए क्योंकि उसने कभी कंपनी का सामना एक होकर नहीं किया",
            mr: "तिने विभागलेल्या भूमीचा फायदा घेतला: जे शासक एक होत नसत त्यांना लाच, तह वा एकेक करून संपवले जाई, आणि प्रत्येक विजयाचा महसूल शिपायांना पुढच्या विजयाचा पगार देई — उपखंडाने आपल्याच अधीनतेचा खर्च आणि सैनिक पुरवले कारण त्याने कधी कंपनीला एकत्र होऊन तोंड दिले नाही",
          },
          {
            en: "The Company's soldiers were simply invincible in every battle",
            hi: "कंपनी के सैनिक हर लड़ाई में बस अजेय थे",
            mr: "कंपनीचे सैनिक प्रत्येक लढाईत नुसते अजिंक्य होते",
          },
          {
            en: "Indians did not notice they were being conquered",
            hi: "भारतीयों ने ध्यान ही नहीं दिया कि वे जीते जा रहे हैं",
            mr: "भारतीयांना जिंकले जात असल्याचे लक्षातच आले नाही",
          },
          {
            en: "The Mughal emperor personally ran the Company",
            hi: "मुग़ल बादशाह ख़ुद कंपनी चलाते थे",
            mr: "मुघल बादशहा स्वतः कंपनी चालवत होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The riddle dissolves once you stop treating 'India' as a single actor. In the 1700s it was dozens of rival kingdoms, and the Company's genius was to face them one at a time — bribing a commander here, allying with a ruler there, annexing an heirless state elsewhere. Each conquest yielded revenue; the revenue paid sepoys; the sepoys won the next conquest. A poor and united subcontinent might have thrown the Company out in a decade; a rich and divided one financed and manned its own defeat. The lesson of 1757–1857 is less about British strength than about the price of disunity — and it is exactly the lesson the freedom movement would later take to heart.",
          hi: "पहेली तभी घुल जाती है जब आप 'भारत' को एक अभिनेता मानना छोड़ दें। 1700 के दशक में वह दर्जनों प्रतिद्वंद्वी राज्य था, और कंपनी की चतुराई थी उन्हें एक-एक कर सामने लेना — यहाँ सेनापति को रिश्वत, वहाँ शासक से संधि, कहीं निःसंतान राज्य की हड़प। हर विजय राजस्व देती; राजस्व सिपाहियों को वेतन; सिपाही अगली विजय जीतते। एक ग़रीब पर एकजुट उपमहाद्वीप कंपनी को दशक भर में बाहर फेंक देता; एक धनी पर बँटा हुआ अपनी ही हार का ख़र्च और सैनिक जुटाता रहा। 1757–1857 का सबक़ ब्रिटिश ताक़त से कम, फूट के दाम के बारे में है — और यही सबक़ आगे स्वतंत्रता आंदोलन ने गाँठ बाँधा।",
          mr: "कोडे तेव्हाच सुटते जेव्हा तुम्ही 'भारत' ला एक कर्ता मानणे सोडता. 1700 च्या दशकात तो डझनभर प्रतिस्पर्धी राज्ये होता, आणि कंपनीची चतुराई त्यांना एकेक करून तोंड देणे — इथे सेनापतीला लाच, तिथे शासकाशी तह, कुठे वारसहीन राज्याची गिळंकृती. प्रत्येक विजय महसूल देई; महसूल शिपायांना पगार; शिपाई पुढचा विजय जिंकत. गरीब पण एकसंध उपखंडाने कंपनीला दशकभरात हाकलले असते; श्रीमंत पण विभागलेल्याने आपल्याच पराभवाचा खर्च आणि सैनिक पुरवले. 1757–1857 चा धडा ब्रिटिश बळाहून कमी, फुटीच्या किमतीबद्दल आहे — आणि हाच धडा पुढे स्वातंत्र्य चळवळीने मनाशी बांधला.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Ruling the Countryside (revenue systems remake the village) */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-ruling-countryside",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 3 — Ruling the Countryside",
      hi: "अध्याय 3 — ग्रामीण क्षेत्र पर शासन",
      mr: "प्रकरण 3 — ग्रामीण भागावर राज्य",
    },
    name: {
      en: "Ruling the Countryside",
      hi: "ग्रामीण क्षेत्र पर शासन",
      mr: "ग्रामीण भागावर राज्य",
    },
    summary: {
      en: "How revenue policy remade the village: a fixed demand that ruined its collectors, a crop planted for a distant factory under threat — and a peasant revolt over indigo that a poet's play carried to the cities.",
      hi: "राजस्व-नीति ने गाँव को कैसे नया गढ़ा: एक नियत माँग जिसने अपने ही वसूलीकर्ताओं को उजाड़ा, दूर के कारख़ाने के लिए धमकी के तले बोई फ़सल — और नील पर किसान-विद्रोह जिसे एक कवि के नाटक ने शहरों तक पहुँचाया।",
      mr: "महसूल-धोरणाने गाव कसे पुन्हा घडवले: एक ठरलेली मागणी जिने आपल्याच वसुलीदारांना उद्ध्वस्त केले, दूरच्या कारखान्यासाठी धमकीखाली पेरलेले पीक — आणि निळीवरचे शेतकरी-बंड जे एका कवीच्या नाटकाने शहरांपर्यंत नेले.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "permanent-settlement",
        name: {
          en: "The Permanent Settlement",
          hi: "स्थायी बंदोबस्त",
          mr: "कायमधारा पद्धत",
        },
        kind: "system",
        prompt: {
          en: "Which 1793 Bengal system fixed the land revenue for ever and made zamindars pay it — on pain of losing their estates?",
          hi: "1793 की कौन-सी बंगाल-व्यवस्था ने भू-राजस्व सदा के लिए तय कर दिया और ज़मींदारों को उसका भुगतान करने पर बाध्य किया — न चुकाने पर जागीर छिन जाने के दंड के साथ?",
          mr: "1793 च्या कोणत्या बंगाल-पद्धतीने भू-महसूल कायमचा ठरवला आणि जमीनदारांना तो भरायला भाग पाडले — न भरल्यास जहागीर गमावण्याच्या शिक्षेसह?",
        },
        statement: {
          en: "The Permanent Settlement fixed the revenue for ever — but the demand was set so high that many zamindars failed and lost their lands.",
          hi: "स्थायी बंदोबस्त ने राजस्व सदा के लिए तय किया — पर माँग इतनी ऊँची रखी गई कि कई ज़मींदार चूक गए और भूमि गँवा बैठे।",
          mr: "कायमधारा पद्धतीने महसूल कायमचा ठरवला — पण मागणी इतकी जास्त ठेवली की अनेक जमीनदार चुकले आणि जमीन गमावली.",
        },
        detail: {
          en: "The state's gain was capped but the peasant's rent was not — the zamindar squeezed below what he could not squeeze from above.",
          hi: "राज्य का लाभ सीमित था पर किसान का किराया नहीं — ज़मींदार नीचे से वह निचोड़ता जो ऊपर से नहीं निचोड़ सकता था।",
          mr: "राज्याचा नफा मर्यादित होता पण शेतकऱ्याचे भाडे नाही — जमीनदार खालून ते पिळत जे वरून पिळता येत नव्हते.",
        },
        extra: {
          en: "Meant to create a loyal landed gentry, it instead broke old families and enriched speculators.",
          hi: "वफ़ादार भूस्वामी वर्ग गढ़ने को बनी, उसने उल्टे पुराने घराने तोड़े और सट्टेबाज़ों को अमीर किया।",
          mr: "इमानी जमीनदार वर्ग घडवायला बनलेली, तिने उलट जुनी घराणी मोडली आणि सट्टेबाजांना श्रीमंत केले.",
        },
        pair: {
          left: {
            en: "Revenue fixed for ever",
            hi: "सदा को तय राजस्व",
            mr: "कायमचा ठरलेला महसूल",
          },
          right: {
            en: "collectors ruined by the demand",
            hi: "माँग से उजड़े वसूलीकर्ता",
            mr: "मागणीने उद्ध्वस्त झालेले वसुलीदार",
          },
        },
      },
      {
        id: "ryotwari",
        name: { en: "The Ryotwari system", hi: "रैयतवाड़ी व्यवस्था", mr: "रयतवारी पद्धत" },
        kind: "system",
        prompt: {
          en: "Which southern system taxed each cultivator (ryot) directly, with no zamindar in between — and revised the demand periodically?",
          hi: "दक्षिण की कौन-सी व्यवस्था हर काश्तकार (रैयत) पर सीधे कर लगाती थी, बीच में कोई ज़मींदार नहीं — और माँग समय-समय पर बदलती?",
          mr: "दक्षिणेची कोणती पद्धत प्रत्येक शेतकऱ्यावर (रयतेवर) थेट कर लावी, मध्ये कोणी जमीनदार नाही — आणि मागणी वेळोवेळी बदलत असे?",
        },
        statement: {
          en: "The Ryotwari system taxed the cultivator directly — no zamindar, a periodically revised demand, and the ryot alone facing the collector.",
          hi: "रैयतवाड़ी व्यवस्था काश्तकार पर सीधे कर लगाती थी — कोई ज़मींदार नहीं, समय-समय पर बदलती माँग, और अकेला रैयत वसूलीकर्ता के सामने।",
          mr: "रयतवारी पद्धत शेतकऱ्यावर थेट कर लावी — कोणी जमीनदार नाही, वेळोवेळी बदलणारी मागणी, आणि एकटी रयत वसुलीदारासमोर.",
        },
        detail: {
          en: "Cutting out the middleman did not lighten the load — the demand often ran too high for the ryot to bear.",
          hi: "बिचौलिया हटाने से बोझ हल्का न हुआ — माँग प्रायः इतनी ऊँची होती कि रैयत सह न पाता।",
          mr: "दलाल काढल्याने ओझे हलके झाले नाही — मागणी बहुधा इतकी जास्त की रयतेला सोसवत नसे.",
        },
        extra: {
          en: "A failed harvest still owed its tax — drought did not pause the demand.",
          hi: "फ़सल चौपट होने पर भी कर देना पड़ता — सूखा माँग नहीं रोकता था।",
          mr: "पीक बुडाले तरी कर द्यावाच लागे — दुष्काळ मागणी थांबवत नसे.",
        },
        pair: {
          left: {
            en: "The cultivator taxed directly",
            hi: "सीधे कर वाला काश्तकार",
            mr: "थेट कर लावलेला शेतकरी",
          },
          right: {
            en: "no middleman, no mercy",
            hi: "बिचौलिया नहीं, रियायत नहीं",
            mr: "दलाल नाही, दयाही नाही",
          },
        },
      },
      {
        id: "indigo",
        name: {
          en: "Indigo cultivation",
          hi: "नील की खेती",
          mr: "निळीची लागवड",
        },
        kind: "crop",
        prompt: {
          en: "Which blue-dye crop were Bengal's peasants forced to plant on their best land, for a price that never covered its cost?",
          hi: "कौन-सी नीली-रंग की फ़सल बंगाल के किसानों को अपनी सबसे अच्छी ज़मीन पर बोने को मजबूर किया गया, ऐसे दाम पर जो लागत तक न ढकता?",
          mr: "कोणते निळ्या-रंगाचे पीक बंगालच्या शेतकऱ्यांना आपल्या उत्तम जमिनीवर पेरायला भाग पाडले, अशा भावाला जो खर्चही भरून काढत नसे?",
        },
        statement: {
          en: "Indigo was grown under compulsion for Britain's textile dyers — planters forced it onto peasants' best fields at ruinous terms.",
          hi: "नील ब्रिटेन के कपड़ा-रंगरेज़ों के लिए ज़बरदस्ती उगाया जाता — बागान-मालिक उसे किसानों के सबसे अच्छे खेतों पर तबाह करने वाली शर्तों पर थोपते।",
          mr: "निळी ब्रिटनच्या कापड-रंगाऱ्यांसाठी सक्तीने पिकवली जाई — मळेवाले ती शेतकऱ्यांच्या उत्तम शेतांवर उद्ध्वस्त करणाऱ्या अटींवर लादत.",
        },
        detail: {
          en: "The crop exhausted the soil and left no room for food — the peasant grew dye and went hungry.",
          hi: "फ़सल मिट्टी चूस लेती और अन्न की जगह न छोड़ती — किसान रंग उगाता और भूखा रहता।",
          mr: "पीक माती शोषी आणि अन्नाला जागा उरवत नसे — शेतकरी रंग पिकवी आणि उपाशी राही.",
        },
        extra: {
          en: "Loans advanced by planters trapped the ryot in a debt he could never clear — the classic snare.",
          hi: "बागान-मालिकों के दिए क़र्ज़ रैयत को ऐसे जाल में फँसाते जो कभी न चुकता — वही पुराना फंदा।",
          mr: "मळेवाल्यांनी दिलेले कर्ज रयतेला अशा जाळ्यात अडकवी जे कधीच फिटत नसे — तोच जुना सापळा.",
        },
        pair: {
          left: {
            en: "Dye on the best land",
            hi: "सबसे अच्छी ज़मीन पर रंग",
            mr: "उत्तम जमिनीवर रंग",
          },
          right: {
            en: "grown at a loss by force",
            hi: "ज़बरन घाटे में उगाया",
            mr: "सक्तीने तोट्यात पिकवलेले",
          },
        },
      },
      {
        id: "indigo-revolt",
        name: {
          en: "The Indigo Revolt",
          hi: "नील विद्रोह",
          mr: "निळी बंड",
        },
        kind: "event",
        prompt: {
          en: "In 1859 which mass refusal saw Bengal's ryots stop planting indigo, defying planters and their loans together?",
          hi: "1859 में कौन-सा सामूहिक इनकार देखा गया, जब बंगाल के रैयतों ने नील बोना बंद कर बागान-मालिकों और उनके क़र्ज़ को साथ ठुकराया?",
          mr: "1859 मध्ये कोणता सामूहिक नकार दिसला, जेव्हा बंगालच्या रयतांनी निळी पेरणे बंद करून मळेवाले आणि त्यांचे कर्ज एकत्र झुगारले?",
        },
        statement: {
          en: "The Indigo Revolt of 1859 was a mass refusal — ryots simply stopped planting, and the planters' system cracked.",
          hi: "1859 का नील विद्रोह एक सामूहिक इनकार था — रैयतों ने बस बोना बंद कर दिया, और बागान-मालिकों की व्यवस्था चटक गई।",
          mr: "1859 चे निळी बंड म्हणजे एक सामूहिक नकार — रयतांनी नुसते पेरणे बंद केले, आणि मळेवाल्यांची पद्धत तडकली.",
        },
        detail: {
          en: "An official commission finally admitted the coercion — a rare state acknowledgement wrung out by resistance.",
          hi: "एक सरकारी आयोग ने अंततः दबाव माना — प्रतिरोध से निचोड़ी गई एक दुर्लभ राजकीय स्वीकृति।",
          mr: "एका सरकारी आयोगाने अखेर सक्ती मान्य केली — प्रतिकाराने पिळून काढलेली एक दुर्मीळ राजमान्यता.",
        },
        extra: {
          en: "Dinabandhu Mitra's play Nil Darpan carried the peasants' cause into the drawing rooms of Calcutta.",
          hi: "दीनबंधु मित्र के नाटक 'नील दर्पण' ने किसानों की व्यथा कलकत्ता के बैठकख़ानों तक पहुँचाई।",
          mr: "दीनबंधू मित्रांच्या 'नील दर्पण' नाटकाने शेतकऱ्यांची व्यथा कलकत्त्याच्या बैठकीच्या खोल्यांपर्यंत नेली.",
        },
        pair: {
          left: {
            en: "The ryots who stopped planting",
            hi: "बोना बंद करते रैयत",
            mr: "पेरणे थांबवणारे रयत",
          },
          right: {
            en: "a system cracked by refusal",
            hi: "इनकार से चटकी व्यवस्था",
            mr: "नकाराने तडकलेली पद्धत",
          },
        },
      },
      {
        id: "cash-crops",
        name: {
          en: "Cash crops for export",
          hi: "निर्यात के लिए नक़दी फ़सलें",
          mr: "निर्यातीसाठी नगदी पिके",
        },
        kind: "policy",
        prompt: {
          en: "Cotton, jute, opium, indigo — which category of crops did colonial policy push farmers to grow for distant markets instead of food?",
          hi: "कपास, जूट, अफ़ीम, नील — औपनिवेशिक नीति ने किसानों को भोजन की जगह दूर के बाज़ारों के लिए कौन-सी श्रेणी की फ़सलें उगवाईं?",
          mr: "कापूस, ताग, अफू, निळी — वसाहती धोरणाने शेतकऱ्यांना अन्नाऐवजी दूरच्या बाजारांसाठी कोणत्या वर्गाची पिके पिकवायला लावली?",
        },
        statement: {
          en: "Cash crops served the empire's factories, not the farmer's plate — fields turned to dye, fibre and opium for export.",
          hi: "नक़दी फ़सलें साम्राज्य के कारख़ानों की सेवा करती थीं, किसान की थाली की नहीं — खेत निर्यात के लिए रंग, रेशे और अफ़ीम में बदल गए।",
          mr: "नगदी पिके साम्राज्याच्या कारखान्यांची सेवा करत, शेतकऱ्याच्या ताटाची नाही — शेते निर्यातीसाठी रंग, धागा आणि अफूत बदलली.",
        },
        detail: {
          en: "When a food-growing land grows dye for distant looms, a bad year turns straight into famine.",
          hi: "जब अन्न उगाने वाली भूमि दूर के करघों के लिए रंग उगाए, तो बुरा साल सीधे अकाल बन जाता है।",
          mr: "जेव्हा अन्न पिकवणारी भूमी दूरच्या मागांसाठी रंग पिकवते, तेव्हा वाईट वर्ष थेट दुष्काळ होते.",
        },
        extra: {
          en: "The village that once fed itself now depended on a market it could not control.",
          hi: "जो गाँव कभी ख़ुद को खिलाता था अब उस बाज़ार पर निर्भर था जिस पर उसका बस न था।",
          mr: "जे गाव कधी स्वतःला पोसे ते आता आपल्या ताब्यात नसलेल्या बाजारावर अवलंबून राहिले.",
        },
        pair: {
          left: {
            en: "Fields turned to export",
            hi: "निर्यात में बदले खेत",
            mr: "निर्यातीत बदललेली शेते",
          },
          right: {
            en: "dye and fibre over food",
            hi: "भोजन पर भारी रंग-रेशा",
            mr: "अन्नावर भारी रंग-धागा",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Compare the two revenue systems. Which contrast is accurate?",
          hi: "दोनों राजस्व-व्यवस्थाओं की तुलना कीजिए। कौन-सा अंतर सही है?",
          mr: "दोन्ही महसूल-पद्धतींची तुलना करा. कोणता फरक बरोबर?",
        },
        choices: [
          {
            en: "Permanent Settlement: zamindar pays a fixed-forever revenue; Ryotwari: the cultivator pays directly, and the demand is revised over time",
            hi: "स्थायी बंदोबस्त: ज़मींदार सदा-नियत राजस्व चुकाता है; रैयतवाड़ी: काश्तकार सीधे चुकाता है, और माँग समय के साथ बदलती है",
            mr: "कायमधारा: जमीनदार कायम-ठरलेला महसूल भरतो; रयतवारी: शेतकरी थेट भरतो, आणि मागणी काळानुसार बदलते",
          },
          {
            en: "Both taxed only zamindars and never the cultivator",
            hi: "दोनों केवल ज़मींदारों पर कर लगाते थे, काश्तकार पर कभी नहीं",
            mr: "दोन्ही फक्त जमीनदारांवर कर लावत, शेतकऱ्यावर कधीच नाही",
          },
          {
            en: "Permanent Settlement revised the demand yearly; Ryotwari fixed it for ever",
            hi: "स्थायी बंदोबस्त माँग हर साल बदलता; रैयतवाड़ी उसे सदा को तय करता",
            mr: "कायमधारा मागणी दरवर्षी बदले; रयतवारी ती कायमची ठरवी",
          },
          {
            en: "Both left the peasant untaxed and prosperous",
            hi: "दोनों ने किसान को बिना कर, समृद्ध छोड़ा",
            mr: "दोन्हींनी शेतकऱ्याला बिनकर, समृद्ध ठेवले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two systems differ in who pays and whether the sum changes. Permanent Settlement put a zamindar between state and soil and froze his revenue for ever; Ryotwari removed the middleman and taxed the cultivator directly, with a demand the state could raise. But note the shared cruelty in the fine print: under both, the sum was pitched so high and enforced so rigidly that failure meant losing the land. Different machinery, the same crushing pressure at the bottom.",
          hi: "दोनों व्यवस्थाएँ इसमें भिन्न हैं कि कौन चुकाता है और रक़म बदलती है या नहीं। स्थायी बंदोबस्त ने राज्य और मिट्टी के बीच ज़मींदार बिठाया और उसका राजस्व सदा को जमा दिया; रैयतवाड़ी ने बिचौलिया हटाकर सीधे काश्तकार पर कर लगाया, ऐसी माँग के साथ जो राज्य बढ़ा सकता था। पर बारीक अक्षरों में साझी क्रूरता देखिए: दोनों में रक़म इतनी ऊँची और वसूली इतनी सख़्त कि चूकना यानी भूमि गँवाना। मशीनरी अलग, तल पर वही कुचलता दबाव।",
          mr: "दोन्ही पद्धती यात भिन्न की कोण भरतो आणि रक्कम बदलते का. कायमधाराने राज्य आणि मातीमध्ये जमीनदार बसवला आणि त्याचा महसूल कायमचा गोठवला; रयतवारीने दलाल काढून थेट शेतकऱ्यावर कर लावला, अशा मागणीसह जी राज्य वाढवू शके. पण बारीक अक्षरांतली सामाईक क्रूरता पाहा: दोन्हींत रक्कम इतकी जास्त आणि वसुली इतकी कडक की चुकणे म्हणजे जमीन गमावणे. यंत्रणा वेगळी, तळाशी तोच चिरडणारा दबाव.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A district that had fed itself for centuries suffered famine after switching largely to indigo and cotton for export. The rains had not failed. What turned prosperity into starvation?",
          hi: "एक ज़िला जो सदियों से ख़ुद को खिलाता था, निर्यात के लिए बड़े पैमाने पर नील और कपास पर आने के बाद अकाल भुगतता है। बारिश नहीं चूकी थी। समृद्धि को भुखमरी में क्या बदल गया?",
          mr: "एक जिल्हा जो शतके स्वतःला पोसत होता, निर्यातीसाठी मोठ्या प्रमाणात निळी आणि कापसावर आल्यावर दुष्काळ भोगतो. पाऊस चुकला नव्हता. समृद्धीचे उपासमारीत काय बदलले?",
        },
        choices: [
          {
            en: "Land that grows dye and fibre grows no food: the district traded self-sufficiency for cash it did not control, so a fall in crop prices or a supply disruption meant money AND grain both vanished at once — export-cropping removed the cushion that home-grown food had always been",
            hi: "जो भूमि रंग और रेशा उगाए वह अन्न नहीं उगाती: ज़िले ने आत्मनिर्भरता को ऐसी नक़दी से बदला जिस पर उसका बस न था, अतः फ़सल-दाम गिरने या आपूर्ति टूटने पर पैसा और अनाज दोनों एक साथ ग़ायब हो गए — निर्यात-खेती ने वह गद्दी हटा दी जो घर का उगाया अन्न सदा रही थी",
            mr: "जी भूमी रंग आणि धागा पिकवते ती अन्न पिकवत नाही: जिल्ह्याने स्वयंपूर्णता अशा नगदीशी बदलली जिच्यावर त्याचा ताबा नव्हता, म्हणून पीक-भाव पडल्यास वा पुरवठा तुटल्यास पैसा आणि धान्य दोन्ही एकदम नाहीसे झाले — निर्यात-शेतीने घरच्या अन्नाची नेहमीची उशी काढून टाकली",
          },
          {
            en: "Indigo and cotton poison the soil for ever, so nothing grew",
            hi: "नील और कपास मिट्टी को हमेशा के लिए ज़हरीला कर देते हैं, अतः कुछ न उगा",
            mr: "निळी आणि कापूस माती कायमची विषारी करतात, म्हणून काही उगवले नाही",
          },
          {
            en: "The famine was pure coincidence, unrelated to the crops",
            hi: "अकाल शुद्ध संयोग था, फ़सलों से असंबंधित",
            mr: "दुष्काळ निव्वळ योगायोग, पिकांशी असंबंधित",
          },
          {
            en: "Export crops always earn so much that famine is impossible",
            hi: "निर्यात-फ़सलें इतना कमाती हैं कि अकाल असंभव है",
            mr: "निर्यात-पिके इतके कमावतात की दुष्काळ अशक्य",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Home-grown food is a buffer you cannot lose to a price crash — you simply eat it. Once a district converts its best land to export dye and fibre, that buffer is gone: the farmer must now BUY grain with the cash his crop earns, and the moment the crop's price falls, a middleman defaults, or transport fails, both his income and his food supply collapse together. The rains stayed loyal; the market did not. This is why colonial cash-cropping made regions richer on paper and hungrier in fact — and why food security, not just income, became a demand of the freedom movement.",
          hi: "घर का उगाया अन्न ऐसी गद्दी है जिसे दाम-गिरावट छीन नहीं सकती — आप उसे बस खा लेते हैं। एक बार ज़िला अपनी सबसे अच्छी ज़मीन निर्यात-रंग और रेशे में बदल दे, वह गद्दी चली जाती है: किसान को अब अपनी फ़सल की कमाई से अनाज ख़रीदना पड़ता है, और जैसे ही फ़सल का दाम गिरे, बिचौलिया चूके या ढुलाई टूटे, उसकी आय और उसका भोजन दोनों साथ ढह जाते हैं। बारिश वफ़ादार रही; बाज़ार नहीं। इसीलिए औपनिवेशिक नक़दी-खेती ने इलाक़ों को काग़ज़ पर अमीर और सच में भूखा बनाया — और इसीलिए केवल आय नहीं, खाद्य-सुरक्षा स्वतंत्रता आंदोलन की माँग बनी।",
          mr: "घरचे पिकवलेले अन्न ही अशी उशी जी भाव-कोसळण्याने हिरावता येत नाही — तुम्ही ते नुसते खाता. एकदा जिल्हा आपली उत्तम जमीन निर्यात-रंग आणि धाग्यात बदलतो, ती उशी जाते: शेतकऱ्याला आता आपल्या पिकाच्या कमाईतून धान्य विकत घ्यावे लागते, आणि पिकाचा भाव पडताच, दलाल बुडताच, वा वाहतूक तुटताच, त्याचे उत्पन्न आणि अन्न दोन्ही एकत्र कोसळतात. पाऊस इमानी राहिला; बाजार नाही. म्हणूनच वसाहती नगदी-शेतीने प्रदेश कागदावर श्रीमंत आणि प्रत्यक्षात भुकेले केले — आणि म्हणूनच केवळ उत्पन्न नव्हे, अन्नसुरक्षा ही स्वातंत्र्य चळवळीची मागणी झाली.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — When People Rebel: 1857 and After                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-1857-rebellion",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 5 — When People Rebel: 1857 and After",
      hi: "अध्याय 5 — जब जनता बग़ावत करती है: 1857 और उसके बाद",
      mr: "प्रकरण 5 — जेव्हा जनता बंड करते: 1857 आणि नंतर",
    },
    name: {
      en: "When People Rebel: 1857 and After",
      hi: "जब जनता बग़ावत करती है: 1857",
      mr: "जेव्हा जनता बंड करते: 1857",
    },
    summary: {
      en: "The great revolt read whole: a greased cartridge lighting long-laid grievance, an old emperor made a symbol, queens and peasants joining sepoys — the crushing that followed, and a company replaced by a crown.",
      hi: "समूचा पढ़ा गया महाविद्रोह: चर्बी वाला कारतूस जो पुरानी शिकायत को जला गया, प्रतीक बनाया गया एक बूढ़ा बादशाह, सिपाहियों से जुड़ती रानियाँ और किसान — उसके बाद का दमन, और कंपनी की जगह ताज।",
      mr: "अख्खे वाचलेले महाबंड: चरबीचे काडतूस ज्याने जुनी तक्रार पेटवली, प्रतीक बनवलेला एक म्हातारा बादशहा, शिपायांशी जुळणाऱ्या राण्या आणि शेतकरी — नंतरचे दडपण, आणि कंपनीच्या जागी राजमुकुट.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cartridge",
        name: {
          en: "The greased cartridge",
          hi: "चर्बी वाला कारतूस",
          mr: "चरबीचे काडतूस",
        },
        kind: "trigger",
        prompt: {
          en: "Which rumour — that new cartridges were greased with cow and pig fat, to be bitten open — was the SPARK that lit the revolt of 1857?",
          hi: "कौन-सी अफ़वाह — कि नए कारतूस गाय और सूअर की चर्बी से चुपड़े हैं, जिन्हें दाँत से खोलना है — 1857 के विद्रोह की चिंगारी बनी?",
          mr: "कोणती अफवा — नवी काडतुसे गाय आणि डुकराच्या चरबीने माखली आहेत, दाताने उघडायची — 1857 च्या बंडाची ठिणगी ठरली?",
        },
        statement: {
          en: "The greased cartridge was the spark, not the cause — biting fat offensive to Hindu and Muslim alike lit a fire long piled with dry grievance.",
          hi: "चर्बी वाला कारतूस चिंगारी था, कारण नहीं — हिंदू और मुसलमान दोनों को अपवित्र लगती चर्बी काटना उस आग को लगा गया जो सूखी शिकायत से बहुत पहले चुनी थी।",
          mr: "चरबीचे काडतूस ही ठिणगी होती, कारण नव्हे — हिंदू आणि मुस्लीम दोघांनाही अपवित्र वाटणारी चरबी चावणे त्या आगीला लागले जी कोरड्या तक्रारीने आधीच रचली होती.",
        },
        detail: {
          en: "Mangal Pandey's defiance at Barrackpore in March 1857 was the first flame — one soldier, one refusal.",
          hi: "मार्च 1857 में बैरकपुर में मंगल पांडे की अवज्ञा पहली लौ थी — एक सिपाही, एक इनकार।",
          mr: "मार्च 1857 मध्ये बॅरकपूरला मंगल पांडेची अवज्ञा ही पहिली ज्योत — एक शिपाई, एक नकार.",
        },
        extra: {
          en: "A spark needs a fuel pile — pay, annexation, humiliation had been stacked for years.",
          hi: "चिंगारी को ईंधन का ढेर चाहिए — वेतन, हड़प, अपमान बरसों से जमे थे।",
          mr: "ठिणगीला इंधनाचा ढीग लागतो — पगार, गिळंकृती, अपमान वर्षानुवर्षे साचले होते.",
        },
        pair: {
          left: {
            en: "The bitten cartridge",
            hi: "दाँत से खुला कारतूस",
            mr: "दाताने उघडलेले काडतूस",
          },
          right: {
            en: "a spark on old grievance",
            hi: "पुरानी शिकायत पर चिंगारी",
            mr: "जुन्या तक्रारीवरची ठिणगी",
          },
        },
      },
      {
        id: "bahadur-shah",
        name: {
          en: "Bahadur Shah Zafar",
          hi: "बहादुर शाह ज़फ़र",
          mr: "बहादूरशाह जफर",
        },
        kind: "symbol",
        prompt: {
          en: "Which aged Mughal emperor did the rebel sepoys of Delhi proclaim their leader, giving a scattered revolt one name to rally to?",
          hi: "किस बूढ़े मुग़ल बादशाह को दिल्ली के विद्रोही सिपाहियों ने अपना नेता घोषित किया, बिखरे विद्रोह को जुटने के लिए एक नाम देते हुए?",
          mr: "कोणत्या म्हाताऱ्या मुघल बादशहाला दिल्लीच्या बंडखोर शिपायांनी आपला नेता घोषित केले, विखुरलेल्या बंडाला एकत्र येण्यासाठी एक नाव देत?",
        },
        statement: {
          en: "Bahadur Shah Zafar became the revolt's symbol — a powerless old poet-king turned into a banner many could gather beneath.",
          hi: "बहादुर शाह ज़फ़र विद्रोह का प्रतीक बने — एक शक्तिहीन बूढ़ा कवि-बादशाह, जिसे ध्वज बनाकर बहुत-से लोग नीचे जुट सके।",
          mr: "बहादूरशाह जफर बंडाचे प्रतीक झाले — एक शक्तिहीन म्हातारा कवी-बादशहा, ज्याला झेंडा करून अनेक जण खाली जमू शकले.",
        },
        detail: {
          en: "That a Mughal name still commanded loyalty across faiths shows what unity the rebels reached for.",
          hi: "कि मुग़ल नाम आज भी धर्मों के आर-पार वफ़ादारी जगाता था, दिखाता है कि विद्रोहियों ने किस एकता की ओर हाथ बढ़ाया।",
          mr: "मुघल नाव आजही धर्मांपार निष्ठा जागवत होते, हे दाखवते की बंडखोरांनी कोणत्या एकतेकडे हात पुढे केला.",
        },
        extra: {
          en: "After the defeat he was exiled to Rangoon — the last Mughal buried far from Delhi.",
          hi: "हार के बाद उन्हें रंगून निर्वासित किया गया — आख़िरी मुग़ल दिल्ली से दूर दफ़न हुए।",
          mr: "पराभवानंतर त्यांना रंगूनला हद्दपार केले — शेवटचा मुघल दिल्लीपासून दूर पुरला गेला.",
        },
        pair: {
          left: {
            en: "The powerless symbol-king",
            hi: "शक्तिहीन प्रतीक-बादशाह",
            mr: "शक्तिहीन प्रतीक-बादशहा",
          },
          right: {
            en: "one banner to rally to",
            hi: "जुटने का एक ध्वज",
            mr: "जमण्यासाठी एक झेंडा",
          },
        },
      },
      {
        id: "rani-lakshmibai",
        name: {
          en: "Rani Lakshmibai",
          hi: "रानी लक्ष्मीबाई",
          mr: "राणी लक्ष्मीबाई",
        },
        kind: "leader",
        prompt: {
          en: "Which queen of Jhansi, her kingdom seized under the Doctrine of Lapse, led her forces in arms and died fighting in 1858?",
          hi: "व्यपगत के सिद्धांत से जिनका राज्य छिना, झाँसी की कौन-सी रानी हथियार लेकर अपनी सेना का नेतृत्व करते हुए 1858 में लड़ते हुए वीरगति को प्राप्त हुईं?",
          mr: "खालसा धोरणाने जिचे राज्य हिरावले, झाशीची कोणती राणी शस्त्र घेऊन आपल्या फौजेचे नेतृत्व करत 1858 मध्ये लढताना धारातीर्थी पडली?",
        },
        statement: {
          en: "Rani Lakshmibai fought for the Jhansi the Company had annexed — her revolt was a queen reclaiming a throne taken by the Doctrine of Lapse.",
          hi: "रानी लक्ष्मीबाई उस झाँसी के लिए लड़ीं जिसे कंपनी ने हड़पा था — उनका विद्रोह व्यपगत से छिने तख़्त को फिर पाने की रानी की लड़ाई थी।",
          mr: "राणी लक्ष्मीबाई त्या झाशीसाठी लढल्या जी कंपनीने गिळंकृत केली होती — त्यांचे बंड म्हणजे खालसा धोरणाने हिरावलेले तख्त पुन्हा मिळवण्याची राणीची लढाई.",
        },
        detail: {
          en: "Nana Sahib at Kanpur and Begum Hazrat Mahal at Lucknow led likewise — the dispossessed became the rebellion's captains.",
          hi: "कानपुर में नाना साहेब और लखनऊ में बेगम हज़रत महल ने भी वैसे ही नेतृत्व किया — बेदख़ल किए गए विद्रोह के सेनापति बने।",
          mr: "कानपूरला नानासाहेब आणि लखनौला बेगम हजरत महल यांनीही तसेच नेतृत्व केले — बेदखल केलेले बंडाचे सेनापती झाले.",
        },
        extra: {
          en: "The revolt's leaders were often those the annexations had robbed — grievance turned to generalship.",
          hi: "विद्रोह के नेता प्रायः वही थे जिन्हें हड़प ने लूटा था — शिकायत सेनापतित्व में बदल गई।",
          mr: "बंडाचे नेते बहुधा तेच होते ज्यांना गिळंकृतीने लुटले होते — तक्रार सेनापतित्वात बदलली.",
        },
        pair: {
          left: {
            en: "The queen who took up arms",
            hi: "हथियार उठाती रानी",
            mr: "शस्त्र उचलणारी राणी",
          },
          right: {
            en: "a throne reclaimed",
            hi: "फिर पाया तख़्त",
            mr: "पुन्हा मिळवलेले तख्त",
          },
        },
      },
      {
        id: "spread",
        name: {
          en: "The spread of the revolt",
          hi: "विद्रोह का फैलाव",
          mr: "बंडाचा प्रसार",
        },
        kind: "fact",
        prompt: {
          en: "Beyond the sepoys, which groups — peasants, artisans, dispossessed rulers, ordinary townsfolk — joined the 1857 rising across the north?",
          hi: "सिपाहियों से आगे, कौन-से समूह — किसान, दस्तकार, बेदख़ल शासक, आम शहरी — 1857 के उत्तरी उभार में शामिल हुए?",
          mr: "शिपायांच्या पलीकडे, कोणते गट — शेतकरी, कारागीर, बेदखल शासक, सामान्य शहरी — 1857 च्या उत्तरेकडील उठावात सामील झाले?",
        },
        statement: {
          en: "The revolt spread beyond the army — peasants crushed by revenue, artisans ruined by imports, rulers stripped of thrones all joined the sepoys.",
          hi: "विद्रोह सेना से आगे फैला — राजस्व से कुचले किसान, आयात से उजड़े दस्तकार, तख़्त से वंचित शासक, सब सिपाहियों से जुड़े।",
          mr: "बंड फौजेच्या पलीकडे पसरले — महसुलाने चिरडलेले शेतकरी, आयातीने उद्ध्वस्त झालेले कारागीर, तख्तापासून वंचित शासक, सारे शिपायांशी जुळले.",
        },
        detail: {
          en: "That so many joined at once shows the rising was no mere 'mutiny' — grievance was general, not merely military.",
          hi: "कि इतने लोग एक साथ जुड़े, दिखाता है कि उभार महज़ 'ग़दर' नहीं था — शिकायत आम थी, केवल सैन्य नहीं।",
          mr: "इतके जण एकदम जुळले, हे दाखवते की उठाव नुसते 'बंड' नव्हते — तक्रार सर्वसामान्य होती, केवळ लष्करी नाही.",
        },
        extra: {
          en: "It was strongest across the Ganga plain — Delhi, Kanpur, Lucknow, Jhansi its burning centres.",
          hi: "वह गंगा-मैदान भर सबसे प्रबल था — दिल्ली, कानपुर, लखनऊ, झाँसी उसके जलते केंद्र।",
          mr: "तो गंगा-मैदानभर सर्वांत जोरदार होता — दिल्ली, कानपूर, लखनौ, झाशी त्याची जळती केंद्रे.",
        },
        pair: {
          left: {
            en: "Not soldiers alone",
            hi: "केवल सिपाही नहीं",
            mr: "केवळ शिपाई नव्हे",
          },
          right: {
            en: "grievance general, not military",
            hi: "आम शिकायत, केवल सैन्य नहीं",
            mr: "सर्वसामान्य तक्रार, केवळ लष्करी नाही",
          },
        },
      },
      {
        id: "crown-rule",
        name: {
          en: "The Crown takes over",
          hi: "ताज का शासन",
          mr: "राजमुकुटाचे राज्य",
        },
        kind: "consequence",
        prompt: {
          en: "After the revolt was crushed, in 1858 the East India Company was abolished and India passed to whose direct rule?",
          hi: "विद्रोह कुचलने के बाद, 1858 में ईस्ट इंडिया कंपनी समाप्त कर दी गई और भारत किसके सीधे शासन में चला गया?",
          mr: "बंड चिरडल्यानंतर, 1858 मध्ये ईस्ट इंडिया कंपनी बरखास्त झाली आणि भारत कोणाच्या थेट राज्यात गेला?",
        },
        statement: {
          en: "In 1858 the Company was dissolved and India came under the British Crown — a firm's rule replaced by a monarch's, promising order and non-interference.",
          hi: "1858 में कंपनी भंग की गई और भारत ब्रिटिश ताज के अधीन आया — फ़र्म का शासन राजशाही से बदला, व्यवस्था और अहस्तक्षेप का वादा करता हुआ।",
          mr: "1858 मध्ये कंपनी बरखास्त झाली आणि भारत ब्रिटिश राजमुकुटाखाली आला — पेढीचे राज्य राजेशाहीने बदलले, सुव्यवस्था आणि अहस्तक्षेपाचे वचन देत.",
        },
        detail: {
          en: "The Queen's Proclamation promised to respect princes and religions — reforms that had frightened people were slowed.",
          hi: "रानी की घोषणा ने राजाओं और धर्मों का आदर करने का वादा किया — जिन सुधारों ने लोगों को डराया था, वे धीमे किए गए।",
          mr: "राणीच्या जाहीरनाम्याने राजे आणि धर्मांचा आदर करण्याचे वचन दिले — ज्या सुधारणांनी लोकांना घाबरवले होते, त्या मंदावल्या.",
        },
        extra: {
          en: "The revolt failed as a war but succeeded as a warning — the empire ruled more carefully ever after.",
          hi: "विद्रोह युद्ध के रूप में विफल हुआ पर चेतावनी के रूप में सफल — साम्राज्य उसके बाद और सावधानी से शासित रहा।",
          mr: "बंड युद्ध म्हणून अपयशी पण इशारा म्हणून यशस्वी — साम्राज्य नंतर अधिक जपून राज्य करत राहिले.",
        },
        pair: {
          left: {
            en: "Company dissolved, 1858",
            hi: "कंपनी भंग, 1858",
            mr: "कंपनी बरखास्त, 1858",
          },
          right: {
            en: "a firm replaced by a crown",
            hi: "फ़र्म की जगह ताज",
            mr: "पेढीच्या जागी राजमुकुट",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The British long called 1857 a 'sepoy mutiny'; Indian historians call it a rebellion or first war of independence. What does each name argue?",
          hi: "अंग्रेज़ों ने 1857 को लंबे समय तक 'सिपाही ग़दर' कहा; भारतीय इतिहासकार उसे विद्रोह या पहला स्वतंत्रता-संग्राम कहते हैं। हर नाम क्या तर्क देता है?",
          mr: "इंग्रजांनी 1857 ला दीर्घकाळ 'शिपाई बंड' म्हटले; भारतीय इतिहासकार त्याला बंड वा पहिले स्वातंत्र्ययुद्ध म्हणतात. प्रत्येक नाव काय युक्तिवाद करते?",
        },
        choices: [
          {
            en: "'Mutiny' shrinks it to disgruntled soldiers, a limited military affair; 'rebellion / first war of independence' argues that peasants, artisans and rulers joined too, making it a broad popular rising against foreign rule",
            hi: "'ग़दर' उसे असंतुष्ट सिपाहियों तक, एक सीमित सैन्य मामले तक सिकोड़ता है; 'विद्रोह / पहला स्वतंत्रता-संग्राम' तर्क देता है कि किसान, दस्तकार और शासक भी जुड़े, जिससे वह विदेशी शासन के विरुद्ध व्यापक जन-उभार बना",
            mr: "'बंड' त्याला असंतुष्ट शिपायांपुरते, मर्यादित लष्करी प्रकरणापुरते आकसते; 'बंड / पहिले स्वातंत्र्ययुद्ध' युक्तिवाद करते की शेतकरी, कारागीर आणि शासकही जुळले, ज्याने ते परकीय राज्याविरुद्ध व्यापक जन-उठाव झाले",
          },
          {
            en: "Both names mean exactly the same thing",
            hi: "दोनों नामों का अर्थ बिलकुल एक है",
            mr: "दोन्ही नावांचा अर्थ अगदी एकच",
          },
          {
            en: "'Mutiny' praises the rebels while 'rebellion' condemns them",
            hi: "'ग़दर' विद्रोहियों की प्रशंसा करता है और 'विद्रोह' उनकी निंदा",
            mr: "'बंड' बंडखोरांची स्तुती करते आणि 'विद्रोह' त्यांची निंदा",
          },
          {
            en: "The names differ only in language, not in meaning",
            hi: "नाम केवल भाषा में भिन्न हैं, अर्थ में नहीं",
            mr: "नावे फक्त भाषेत भिन्न, अर्थात नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A name is a claim about scale and cause. 'Mutiny' locates the trouble in the barracks — a discipline problem, easily contained and easily dismissed. 'Rebellion' or 'first war of independence' widens the lens to the fields and palaces that rose alongside the sepoys, and reframes the whole as a people resisting a foreign power. The evidence — peasants, artisans, dispossessed rulers all in revolt — supports the broader name, which is why the labelling itself became a battleground of history.",
          hi: "नाम पैमाने और कारण का दावा है। 'ग़दर' मुसीबत को बैरकों में रखता है — अनुशासन की समस्या, आसानी से क़ाबू और आसानी से ख़ारिज। 'विद्रोह' या 'पहला स्वतंत्रता-संग्राम' नज़र को उन खेतों और महलों तक चौड़ा करता है जो सिपाहियों संग उठे, और पूरे को एक जनता के विदेशी सत्ता से प्रतिरोध के रूप में गढ़ता है। सबूत — किसान, दस्तकार, बेदख़ल शासक सब विद्रोह में — व्यापक नाम का समर्थन करते हैं, इसीलिए नामकरण स्वयं इतिहास का रणक्षेत्र बन गया।",
          mr: "नाव हे प्रमाण आणि कारणाबद्दलचा दावा. 'बंड' अडचणीला बराकींत ठेवते — शिस्तीची समस्या, सहज आवरता आणि सहज झटकता येणारी. 'बंड / पहिले स्वातंत्र्ययुद्ध' नजर त्या शेतां आणि राजवाड्यांपर्यंत रुंदावते जे शिपायांसोबत उठले, आणि अख्ख्याला परकीय सत्तेला विरोध करणारी जनता म्हणून मांडते. पुरावा — शेतकरी, कारागीर, बेदखल शासक सारे बंडात — व्यापक नावाला आधार देतो, म्हणूनच नामकरणच इतिहासाचे रणक्षेत्र झाले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "1857 failed militarily — the rebels were crushed within a year — yet historians call it a turning point. How can a defeated revolt reshape an empire?",
          hi: "1857 सैन्य रूप से विफल हुआ — विद्रोही साल भर में कुचल दिए गए — फिर भी इतिहासकार उसे मोड़ कहते हैं। एक हारा हुआ विद्रोह साम्राज्य को कैसे बदल सकता है?",
          mr: "1857 लष्करीदृष्ट्या अपयशी झाले — बंडखोर वर्षभरात चिरडले गेले — तरी इतिहासकार त्याला वळण म्हणतात. एक हरलेले बंड साम्राज्याला कसे बदलू शकते?",
        },
        choices: [
          {
            en: "Its consequences outlived its defeat: the Company was abolished and Crown rule began, reforms were slowed to avoid provoking Indians, and a memory of united resistance was planted that later movements drew upon — a lost battle that rewrote how, and how warily, India was ruled",
            hi: "उसके परिणाम उसकी हार से आगे जिए: कंपनी समाप्त हुई और ताज का शासन शुरू, भारतीयों को भड़काने से बचने को सुधार धीमे किए गए, और एकजुट प्रतिरोध की एक स्मृति रोपी गई जिससे आगे के आंदोलनों ने बल लिया — एक हारी लड़ाई जिसने फिर से लिखा कि भारत कैसे, और कितनी सावधानी से, शासित हो",
            mr: "त्याचे परिणाम त्याच्या पराभवाहून अधिक जगले: कंपनी बरखास्त झाली आणि राजमुकुटाचे राज्य सुरू, भारतीयांना चिथावण्याचे टाळायला सुधारणा मंदावल्या, आणि एकसंध प्रतिकाराची एक स्मृती रुजली जिच्यातून पुढच्या चळवळींनी बळ घेतले — एक हरलेली लढाई जिने भारत कसा, आणि किती जपून, राज्य केला जावा हे पुन्हा लिहिले",
          },
          {
            en: "It did not really reshape anything; historians exaggerate",
            hi: "उसने सच में कुछ नहीं बदला; इतिहासकार बढ़ा-चढ़ाकर कहते हैं",
            mr: "त्याने खरे तर काहीच बदलले नाही; इतिहासकार अतिशयोक्ती करतात",
          },
          {
            en: "The rebels actually won and drove the British out",
            hi: "विद्रोहियों ने असल में जीता और अंग्रेज़ों को खदेड़ दिया",
            mr: "बंडखोरांनी खरे तर जिंकले आणि इंग्रजांना हाकलले",
          },
          {
            en: "The empire ignored the revolt entirely and changed nothing",
            hi: "साम्राज्य ने विद्रोह की पूरी अनदेखी की और कुछ नहीं बदला",
            mr: "साम्राज्याने बंडाकडे पूर्ण दुर्लक्ष केले आणि काही बदलले नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A revolt can lose the war and still win the argument about what comes next. Militarily 1857 was crushed; politically it forced a reckoning. London concluded that a trading company could no longer be trusted to hold India, abolished it, and set the Crown to rule directly and more cautiously — respecting princes, slowing the reforms that had alarmed people, reorganising the army so sepoys could never again coordinate so widely. And beyond policy it left a memory: proof that Indians of many faiths and classes had once risen together against foreign rule, a story the freedom movement would tell and retell. Turning points are measured not by who won the battle but by how differently the world runs afterward — and after 1857, the empire ran differently and knew it could fall.",
          hi: "विद्रोह युद्ध हार सकता है और फिर भी 'आगे क्या' का तर्क जीत सकता है। सैन्य रूप से 1857 कुचला गया; राजनीतिक रूप से उसने हिसाब चुकवाया। लंदन ने माना कि व्यापारिक कंपनी पर अब भारत थामने का भरोसा नहीं, उसे समाप्त किया, और ताज को सीधे व अधिक सावधानी से शासन पर बिठाया — राजाओं का आदर, लोगों को डराने वाले सुधार धीमे, सेना का पुनर्गठन ताकि सिपाही फिर कभी इतने व्यापक तालमेल न कर सकें। और नीति से आगे उसने एक स्मृति छोड़ी: प्रमाण कि कई धर्मों-वर्गों के भारतीय कभी साथ मिलकर विदेशी शासन से उठे थे, एक कहानी जिसे स्वतंत्रता आंदोलन बार-बार सुनाता। मोड़ इससे नहीं नपते कि लड़ाई किसने जीती, बल्कि इससे कि उसके बाद दुनिया कितनी अलग चलती है — और 1857 के बाद साम्राज्य अलग चला, और जानता था कि वह गिर सकता है।",
          mr: "बंड युद्ध हरू शकते आणि तरी 'पुढे काय' चा युक्तिवाद जिंकू शकते. लष्करीदृष्ट्या 1857 चिरडले गेले; राजकीयदृष्ट्या त्याने हिशेब मांडायला भाग पाडले. लंडनने ठरवले की व्यापारी कंपनीवर आता भारत धरून ठेवण्याचा विश्वास नाही, ती बरखास्त केली, आणि राजमुकुटाला थेट व अधिक जपून राज्यावर बसवले — राजांचा आदर, लोकांना घाबरवणाऱ्या सुधारणा मंद, फौजेची पुनर्रचना म्हणजे शिपाई पुन्हा इतका व्यापक ताळमेळ करू शकणार नाहीत. आणि धोरणापलीकडे त्याने एक स्मृती सोडली: पुरावा की अनेक धर्म-वर्गांचे भारतीय कधी एकत्र येऊन परकीय राज्याविरुद्ध उठले होते, एक कथा जी स्वातंत्र्य चळवळ पुन्हापुन्हा सांगेल. वळणे यावरून मोजली जात नाहीत की लढाई कोण जिंकले, तर यावरून की नंतर जग किती वेगळे चालते — आणि 1857 नंतर साम्राज्य वेगळे चालले, आणि आपण पडू शकतो हे त्याला ठाऊक झाले.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Tribals, Dikus and the Vision of a Golden Age               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-tribals-dikus",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 4 — Tribals, Dikus and the Vision of a Golden Age",
      hi: "अध्याय 4 — आदिवासी, दिकू और एक स्वर्ण युग की कल्पना",
      mr: "प्रकरण 4 — आदिवासी, दिकू आणि सुवर्णयुगाचे स्वप्न",
    },
    name: {
      en: "Tribals, Dikus and a Golden Age",
      hi: "आदिवासी, दिकू और स्वर्ण युग",
      mr: "आदिवासी, दिकू आणि सुवर्णयुग",
    },
    summary: {
      en: "Forest lives fenced by outsiders: shifting fields banned, a shared forest turned into someone's property, moneylenders and traders as 'dikus' — and Birsa Munda's dream of a land returned to its people.",
      hi: "बाहरी लोगों से घिरी वन-ज़िंदगियाँ: चलती खेती पर रोक, साझा जंगल बना किसी की संपत्ति, साहूकार-व्यापारी बतौर 'दिकू' — और बिरसा मुंडा का सपना, ज़मीन अपने लोगों को लौटी हुई।",
      mr: "बाहेरच्यांनी कुंपणलेली वन-जीवने: फिरती शेती बंदी, सामाईक जंगल कोणाची मालमत्ता झालेले, सावकार-व्यापारी 'दिकू' म्हणून — आणि बिरसा मुंडाचे स्वप्न, जमीन आपल्या लोकांना परतलेली.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "tribal-life",
        name: {
          en: "Tribal forest life",
          hi: "आदिवासी वन-जीवन",
          mr: "आदिवासी वन-जीवन",
        },
        kind: "way",
        prompt: {
          en: "Shifting cultivation, hunting, gathering, herding — which many-sided way of living did India's tribal communities practise on and around the forest?",
          hi: "चलती खेती, शिकार, संग्रहण, पशुचारण — भारत के आदिवासी समुदाय जंगल पर और उसके इर्द-गिर्द कौन-सा बहुआयामी जीवन-ढंग जीते थे?",
          mr: "फिरती शेती, शिकार, गोळा करणे, पशुपालन — भारतातील आदिवासी समुदाय जंगलावर आणि त्याभोवती कोणती बहुआयामी जीवनरीत जगत?",
        },
        statement: {
          en: "Tribal life leaned on the forest many ways at once — cultivating, hunting, gathering and herding, none of it owned as private plots.",
          hi: "आदिवासी जीवन जंगल पर एक साथ कई तरह टिका था — खेती, शिकार, संग्रहण और पशुचारण, कुछ भी निजी खेत के रूप में स्वामित्व में नहीं।",
          mr: "आदिवासी जीवन जंगलावर एकाच वेळी अनेक प्रकारे अवलंबून — शेती, शिकार, गोळा करणे आणि पशुपालन, काहीही खासगी वावर म्हणून मालकीत नाही.",
        },
        detail: {
          en: "The forest was a commons — used by all, owned by none, its bounty shared by custom.",
          hi: "जंगल साझी संपत्ति था — सबका इस्तेमाल, किसी का स्वामित्व नहीं, उसकी देन रिवाज से बँटी।",
          mr: "जंगल ही सामाईक मालमत्ता — साऱ्यांचा वापर, कोणाची मालकी नाही, तिची देणगी रिवाजाने वाटलेली.",
        },
        extra: {
          en: "This very flexibility baffled a state that wanted fixed fields, fixed owners and fixed taxes.",
          hi: "यही लचीलापन उस राज्य को उलझा देता था जो नियत खेत, नियत मालिक और नियत कर चाहता था।",
          mr: "हाच लवचीकपणा त्या राज्याला गोंधळात टाकी जे ठरलेली शेते, ठरलेले मालक आणि ठरलेले कर मागे.",
        },
        pair: {
          left: {
            en: "The many-sided forest life",
            hi: "बहुआयामी वन-जीवन",
            mr: "बहुआयामी वन-जीवन",
          },
          right: {
            en: "a commons, owned by none",
            hi: "साझा, किसी का नहीं",
            mr: "सामाईक, कोणाचे नाही",
          },
        },
      },
      {
        id: "forest-laws",
        name: {
          en: "The colonial forest laws",
          hi: "औपनिवेशिक वन-क़ानून",
          mr: "वसाहती वन-कायदे",
        },
        kind: "policy",
        prompt: {
          en: "Which laws declared forests state property, banned shifting cultivation, and turned free forest-users into trespassers?",
          hi: "किन क़ानूनों ने जंगलों को राजकीय संपत्ति घोषित किया, चलती खेती पर रोक लगाई, और मुक्त वन-उपयोक्ताओं को अतिक्रमी बना दिया?",
          mr: "कोणत्या कायद्यांनी जंगले राज्याची मालमत्ता घोषित केली, फिरती शेती बंद केली, आणि मुक्त वन-वापरकर्त्यांना अतिक्रमक केले?",
        },
        statement: {
          en: "Colonial forest laws made the state the forest's owner — reserving timber for the empire and outlawing the tribes' own use of it.",
          hi: "औपनिवेशिक वन-क़ानूनों ने राज्य को जंगल का स्वामी बना दिया — इमारती लकड़ी साम्राज्य के लिए आरक्षित की और आदिवासियों के अपने उपयोग को ग़ैरक़ानूनी ठहराया।",
          mr: "वसाहती वन-कायद्यांनी राज्याला जंगलाचा मालक केले — इमारती लाकूड साम्राज्यासाठी राखीव ठेवले आणि आदिवासींचा स्वतःचा वापर बेकायदा ठरवला.",
        },
        detail: {
          en: "Railway sleepers and warships needed timber — the forest was reclassified from home to warehouse.",
          hi: "रेल के स्लीपर और युद्धपोतों को लकड़ी चाहिए थी — जंगल घर से बदलकर गोदाम में वर्गीकृत हुआ।",
          mr: "रेल्वेचे स्लीपर आणि युद्धनौकांना लाकूड लागे — जंगल घरातून बदलून गोदामात वर्गीकृत झाले.",
        },
        extra: {
          en: "Shifting cultivators, told to settle on one plot, lost the very rotation that kept their soil alive.",
          hi: "चलती खेती करने वालों को एक खेत पर बसने को कहा गया, वे वही चक्र खो बैठे जो उनकी मिट्टी ज़िंदा रखता था।",
          mr: "फिरती शेती करणाऱ्यांना एका वावरावर स्थिरावायला सांगितले, ते तेच चक्र गमावले जे त्यांची माती जिवंत ठेवी.",
        },
        pair: {
          left: {
            en: "Forest declared state property",
            hi: "राजकीय संपत्ति घोषित जंगल",
            mr: "राज्याची मालमत्ता घोषित जंगल",
          },
          right: {
            en: "users turned trespassers",
            hi: "अतिक्रमी बने उपयोक्ता",
            mr: "अतिक्रमक झालेले वापरकर्ते",
          },
        },
      },
      {
        id: "dikus",
        name: { en: "The dikus", hi: "दिकू", mr: "दिकू" },
        kind: "outsiders",
        prompt: {
          en: "Which word did tribal communities use for the outsiders — moneylenders, traders and officials — who arrived to profit from their land and labour?",
          hi: "अपनी भूमि और श्रम से मुनाफ़ा कमाने आए बाहरी लोगों — साहूकारों, व्यापारियों और अफ़सरों — के लिए आदिवासी समुदाय कौन-सा शब्द इस्तेमाल करते थे?",
          mr: "आपल्या जमीन आणि श्रमातून नफा कमवायला आलेल्या बाहेरच्यांसाठी — सावकार, व्यापारी आणि अधिकारी — आदिवासी समुदाय कोणता शब्द वापरत?",
        },
        statement: {
          en: "Dikus were the outsiders — moneylenders, traders and officials who drained the tribes' land, forest and labour of their worth.",
          hi: "दिकू बाहरी लोग थे — साहूकार, व्यापारी और अफ़सर, जो आदिवासियों की भूमि, जंगल और श्रम का मोल निचोड़ ले जाते थे।",
          mr: "दिकू म्हणजे बाहेरचे — सावकार, व्यापारी आणि अधिकारी, जे आदिवासींच्या जमीन, जंगल आणि श्रमाचे मोल पिळून नेत.",
        },
        detail: {
          en: "The moneylender's loan at ruinous interest was the commonest trap — debt bonded whole families for generations.",
          hi: "तबाह करने वाले ब्याज पर साहूकार का क़र्ज़ सबसे आम फंदा था — क़र्ज़ पूरे परिवारों को पीढ़ियों बाँध देता।",
          mr: "उद्ध्वस्त करणाऱ्या व्याजावरचे सावकाराचे कर्ज हा सर्वांत सामान्य सापळा — कर्ज अख्ख्या कुटुंबांना पिढ्यानपिढ्या बांधे.",
        },
        extra: {
          en: "'Diku' names a relationship, not a race — anyone who came to extract, not to belong.",
          hi: "'दिकू' किसी नस्ल का नहीं, एक संबंध का नाम है — जो भी निचोड़ने आया, बसने नहीं।",
          mr: "'दिकू' कोणत्या वंशाचे नव्हे, एका नात्याचे नाव — जो कोणी पिळायला आला, राहायला नव्हे.",
        },
        pair: {
          left: {
            en: "The extracting outsider",
            hi: "निचोड़ता बाहरी",
            mr: "पिळणारा बाहेरचा",
          },
          right: {
            en: "come to profit, not to belong",
            hi: "मुनाफ़े को आया, बसने नहीं",
            mr: "नफ्याला आलेला, राहायला नव्हे",
          },
        },
      },
      {
        id: "birsa-munda",
        name: { en: "Birsa Munda", hi: "बिरसा मुंडा", mr: "बिरसा मुंडा" },
        kind: "leader",
        prompt: {
          en: "Which young leader of the Munda tribe raised a movement in the 1890s for a just world where the land returned to its people, free of dikus?",
          hi: "मुंडा जनजाति के किस युवा नेता ने 1890 के दशक में एक न्यायी संसार के लिए आंदोलन उठाया, जहाँ ज़मीन दिकुओं से मुक्त होकर अपने लोगों को लौट जाए?",
          mr: "मुंडा जमातीच्या कोणत्या तरुण नेत्याने 1890 च्या दशकात न्याय्य जगासाठी चळवळ उभारली, जिथे जमीन दिकूंपासून मुक्त होऊन आपल्या लोकांना परतेल?",
        },
        statement: {
          en: "Birsa Munda dreamed of a golden age restored — land back with the Mundas, dikus gone, and the community's old dignity renewed.",
          hi: "बिरसा मुंडा ने लौटे स्वर्ण युग का सपना देखा — ज़मीन मुंडाओं के पास वापस, दिकू गए, और समुदाय का पुराना सम्मान फिर बहाल।",
          mr: "बिरसा मुंडांनी परतलेल्या सुवर्णयुगाचे स्वप्न पाहिले — जमीन मुंडांकडे परत, दिकू गेलेले, आणि समुदायाचा जुना सन्मान पुन्हा प्रस्थापित.",
        },
        detail: {
          en: "His movement mixed the political and the spiritual — reform of conduct alongside the reclaiming of land.",
          hi: "उनके आंदोलन ने राजनीतिक और आध्यात्मिक मिलाया — भूमि की वापसी संग आचरण का सुधार।",
          mr: "त्यांच्या चळवळीने राजकीय आणि आध्यात्मिक मिसळले — जमिनीच्या परतीसोबत आचरणाची सुधारणा.",
        },
        extra: {
          en: "He died in jail in 1900, young — but the memory of Birsa outlived the empire that caged him.",
          hi: "वे 1900 में जेल में युवावस्था में चल बसे — पर बिरसा की स्मृति उस साम्राज्य से आगे जी जिसने उन्हें क़ैद किया।",
          mr: "ते 1900 मध्ये तुरुंगात तरुणपणी गेले — पण बिरसाची स्मृती त्यांना कैद करणाऱ्या साम्राज्याहून अधिक जगली.",
        },
        pair: {
          left: {
            en: "The golden age dreamed",
            hi: "देखा गया स्वर्ण युग",
            mr: "पाहिलेले सुवर्णयुग",
          },
          right: {
            en: "land returned to its people",
            hi: "अपने लोगों को लौटी ज़मीन",
            mr: "आपल्या लोकांना परतलेली जमीन",
          },
        },
      },
      {
        id: "loss-of-land",
        name: {
          en: "The loss of land",
          hi: "ज़मीन का छिन जाना",
          mr: "जमीन गमावणे",
        },
        kind: "consequence",
        prompt: {
          en: "Barred from the forest and trapped by debt, many tribals ended up as low-paid labourers on tea gardens and in mines. What was the root of this fall?",
          hi: "जंगल से रोके गए और क़र्ज़ में फँसे, कई आदिवासी चाय-बाग़ानों और खदानों में कम मज़दूरी वाले श्रमिक बन गए। इस पतन की जड़ क्या थी?",
          mr: "जंगलातून रोखलेले आणि कर्जात अडकलेले, अनेक आदिवासी चहा-मळे आणि खाणींत कमी पगारी मजूर झाले. या पतनाचे मूळ काय?",
        },
        statement: {
          en: "Losing the land was the root fall — cut off from the forest that fed them, tribals were pushed into distant, ill-paid wage labour.",
          hi: "ज़मीन खोना मूल पतन था — जिस जंगल ने उन्हें पाला उससे कटकर, आदिवासी दूर की, कम-वेतन वाली मज़दूरी में धकेल दिए गए।",
          mr: "जमीन गमावणे हे मूळ पतन — ज्या जंगलाने त्यांना पोसले त्यापासून तुटून, आदिवासी दूरच्या, कमी-पगारी मजुरीत ढकलले गेले.",
        },
        pair: {
          left: {
            en: "Cut off from the forest",
            hi: "जंगल से कटे हुए",
            mr: "जंगलापासून तुटलेले",
          },
          right: {
            en: "pushed into wage labour",
            hi: "मज़दूरी में धकेले गए",
            mr: "मजुरीत ढकलले गेले",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The colonial state found shifting cultivators hard to govern. Which explanation fits best?",
          hi: "औपनिवेशिक राज्य को चलती खेती करने वालों पर शासन कठिन लगता था। कौन-सी व्याख्या सबसे उपयुक्त है?",
          mr: "वसाहती राज्याला फिरती शेती करणाऱ्यांवर राज्य करणे कठीण वाटे. कोणते स्पष्टीकरण सर्वांत योग्य?",
        },
        choices: [
          {
            en: "A state that taxes land needs fixed fields and fixed owners to count; people who move their fields each cycle fit no register, so the state banned the moving rather than change its own method",
            hi: "जो राज्य भूमि पर कर लगाता है उसे गिनने को नियत खेत और नियत मालिक चाहिए; जो लोग हर चक्र खेत बदलते हैं वे किसी पंजी में नहीं बैठते, अतः राज्य ने अपनी विधि बदलने की जगह चलना ही रोक दिया",
            mr: "जे राज्य जमिनीवर कर लावते त्याला मोजायला ठरलेली शेते आणि ठरलेले मालक लागतात; जे लोक प्रत्येक चक्रात शेत बदलतात ते कोणत्या नोंदवहीत बसत नाहीत, म्हणून राज्याने आपली रीत बदलण्याऐवजी फिरणेच बंद केले",
          },
          {
            en: "Shifting cultivation produces no food at all",
            hi: "चलती खेती कोई अन्न ही नहीं उपजाती",
            mr: "फिरती शेती काहीच अन्न पिकवत नाही",
          },
          {
            en: "The tribals themselves asked to be settled",
            hi: "आदिवासियों ने ख़ुद बसाए जाने को कहा",
            mr: "आदिवासींनी स्वतः स्थिरावायला सांगितले",
          },
          {
            en: "The state simply never noticed shifting cultivators",
            hi: "राज्य ने चलती खेती करने वालों को देखा ही नहीं",
            mr: "राज्याने फिरत्या शेतकऱ्यांना पाहिलेच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A tax on land is a promise to count land — and counting requires the counted to hold still. A fixed field has an owner, an area, a yield and therefore a bill; a field that moves through the forest each cycle has none of these on any fixed date. Rather than invent a way to tax a moving farm, the colonial state outlawed the movement, ordering cultivators onto permanent plots. The convenience of the register, not the welfare of the cultivator, drew the rule — a recurring pattern wherever state power meets a way of life it cannot easily measure.",
          hi: "भूमि पर कर गिनने का वादा है — और गिनने के लिए गिने जाने वाले का ठहरना ज़रूरी है। नियत खेत का मालिक, क्षेत्र, उपज और इसलिए बिल होता है; जो खेत हर चक्र जंगल में घूमता है उसका किसी नियत तारीख़ पर इनमें से कुछ नहीं होता। चलते खेत पर कर लगाने का तरीक़ा गढ़ने की जगह, औपनिवेशिक राज्य ने चलना ही ग़ैरक़ानूनी कर दिया, काश्तकारों को स्थायी खेतों पर बिठाने का आदेश दिया। नियम को काश्तकार का हित नहीं, पंजी की सुविधा खींचती थी — एक बार-बार दोहराता ढर्रा, जहाँ भी राज्य-सत्ता ऐसे जीवन-ढंग से टकराती है जिसे वह आसानी से नाप नहीं सकती।",
          mr: "जमिनीवरचा कर म्हणजे जमीन मोजण्याचे वचन — आणि मोजायला मोजल्या जाणाऱ्याने स्थिर राहणे आवश्यक. ठरलेल्या शेताला मालक, क्षेत्र, उत्पादन आणि म्हणून बिल असते; जे शेत प्रत्येक चक्रात जंगलात फिरते त्याला कोणत्याही ठरलेल्या तारखेला यांतले काही नसते. फिरत्या शेतावर कर लावण्याची रीत शोधण्याऐवजी, वसाहती राज्याने फिरणेच बेकायदा केले, शेतकऱ्यांना कायम वावरांवर बसण्याचा हुकूम दिला. नियमाला शेतकऱ्याचे हित नव्हे, नोंदवहीची सोय ओढी — एक पुन्हापुन्हा दिसणारा साचा, जिथे जिथे राज्य-सत्ता सहज मोजता न येणाऱ्या जीवनरीतीला भिडते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "For centuries a forest sustained a tribe without anyone 'owning' it. Colonial law made it property — and the tribe grew poor on the same land. How does turning a shared forest into property impoverish those already living in it?",
          hi: "सदियों एक जंगल ने किसी के 'स्वामित्व' बिना एक जनजाति को पाला। औपनिवेशिक क़ानून ने उसे संपत्ति बना दिया — और वही जनजाति उसी ज़मीन पर ग़रीब हो गई। साझा जंगल को संपत्ति बनाना उसमें पहले से जी रहे लोगों को कैसे कंगाल कर देता है?",
          mr: "शतके एका जंगलाने कोणाच्या 'मालकी'शिवाय एका जमातीला पोसले. वसाहती कायद्याने ते मालमत्ता केले — आणि तीच जमात त्याच जमिनीवर गरीब झाली. सामाईक जंगल मालमत्ता करणे त्यात आधीच राहणाऱ्यांना कसे कंगाल करते?",
        },
        choices: [
          {
            en: "A commons gives everyone use-rights but no one exclusive ownership; making it property assigns it to an owner — the state or a buyer — and everyone who lived by using it becomes a trespasser overnight, their customary rights erased by a document they never signed",
            hi: "साझी संपत्ति सबको उपयोग का अधिकार देती है पर किसी को अनन्य स्वामित्व नहीं; उसे संपत्ति बनाना उसे एक मालिक — राज्य या ख़रीदार — को सौंप देता है, और जो सब उसे इस्तेमाल कर जीते थे वे रातों-रात अतिक्रमी बन जाते हैं, उनके रिवाजी अधिकार एक ऐसे दस्तावेज़ से मिटे जिस पर उन्होंने कभी दस्तख़त नहीं किए",
            mr: "सामाईक मालमत्ता साऱ्यांना वापराचा हक्क देते पण कोणाला एकमेव मालकी नाही; ती मालमत्ता करणे तिला एका मालकाला — राज्य वा खरेदीदार — सोपवते, आणि जे सारे तिचा वापर करून जगत ते रातोरात अतिक्रमक होतात, त्यांचे रूढ हक्क त्यांनी कधी सही न केलेल्या कागदाने पुसले जातात",
          },
          {
            en: "Property makes forests grow smaller physically",
            hi: "संपत्ति जंगलों को भौतिक रूप से छोटा कर देती है",
            mr: "मालमत्ता जंगले भौतिकदृष्ट्या लहान करते",
          },
          {
            en: "The tribes always secretly wanted to sell the forest",
            hi: "जनजातियाँ हमेशा चुपके से जंगल बेचना चाहती थीं",
            mr: "जमातींना नेहमी गुपचूप जंगल विकायचे होते",
          },
          {
            en: "Nothing changes; ownership is only paperwork",
            hi: "कुछ नहीं बदलता; स्वामित्व केवल काग़ज़ी कार्रवाई है",
            mr: "काहीच बदलत नाही; मालकी फक्त कागदपत्र",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The forest did not shrink; the RULES over it did. A commons is a web of shared, customary use-rights — this family gathers here, that one grazes there, all by unwritten agreement stretching back generations. Converting it to property collapses that web into a single line on a deed: one owner, and everyone else an intruder. The tribe's rights were real but unwritten, so a legal system that recognised only documents simply did not see them — and what the law cannot see, it does not protect. Overnight, people who had used the forest for centuries could be charged for cutting its wood or grazing its clearings. The land was unchanged; the question of who was allowed to live from it had been silently rewritten in the ruler's favour.",
          hi: "जंगल सिकुड़ा नहीं; उस पर के नियम बदले। साझी संपत्ति साझे, रिवाजी उपयोग-अधिकारों का जाल है — यह परिवार यहाँ बीनता है, वह वहाँ चराता है, सब पीढ़ियों पुराने अलिखित समझौते से। उसे संपत्ति बनाना उस जाल को दस्तावेज़ की एक पंक्ति में समेट देता है: एक मालिक, और बाक़ी सब घुसपैठिए। जनजाति के अधिकार असली पर अलिखित थे, अतः केवल दस्तावेज़ मानने वाली क़ानूनी व्यवस्था ने उन्हें देखा ही नहीं — और जो क़ानून न देखे उसे वह बचाता नहीं। रातों-रात, जो लोग सदियों जंगल इस्तेमाल करते थे उसकी लकड़ी काटने या मैदान में चराने के लिए दंडित हो सकते थे। ज़मीन वही रही; उससे कौन जी सकता है यह सवाल चुपचाप शासक के पक्ष में फिर से लिख दिया गया।",
          mr: "जंगल आकसले नाही; त्यावरचे नियम बदलले. सामाईक मालमत्ता ही सामाईक, रूढ वापर-हक्कांचे जाळे — हे कुटुंब इथे गोळा करते, ते तिथे चरवते, सारे पिढ्यांजुन्या अलिखित कराराने. ती मालमत्ता करणे ते जाळे दस्तऐवजाच्या एका ओळीत आवळते: एक मालक, आणि बाकी सारे घुसखोर. जमातीचे हक्क खरे पण अलिखित होते, म्हणून फक्त कागद मानणाऱ्या कायदेशीर व्यवस्थेने ते पाहिलेच नाहीत — आणि जे कायद्याला दिसत नाही ते तो राखत नाही. रातोरात, जे लोक शतके जंगल वापरत ते त्याचे लाकूड कापण्यासाठी वा मोकळवनात चरवण्यासाठी दंडित होऊ शकत. जमीन तीच राहिली; तिच्यातून कोण जगू शकतो हा प्रश्न गुपचूप शासकाच्या बाजूने पुन्हा लिहिला गेला.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — The Making of the National Movement (1870s–1947)            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-8-national-movement",
    subject: "HISTORY",
    classLevel: 8,
    chapter: {
      en: "Chapter 9 — The Making of the National Movement",
      hi: "अध्याय 9 — राष्ट्रीय आंदोलन का निर्माण",
      mr: "प्रकरण 9 — राष्ट्रीय चळवळीची जडणघडण",
    },
    name: {
      en: "The Making of the National Movement",
      hi: "राष्ट्रीय आंदोलन का निर्माण",
      mr: "राष्ट्रीय चळवळीची जडणघडण",
    },
    summary: {
      en: "A freedom movement assembled: a congress of the educated turning into a mass tide, non-cooperation and salt and Quit India, and independence in 1947 shadowed by Partition — a nation learning that unity was its one irreplaceable weapon.",
      hi: "जुड़ता एक स्वतंत्रता आंदोलन: शिक्षितों की सभा जो जन-ज्वार बनी, असहयोग और नमक और भारत छोड़ो, और 1947 की आज़ादी विभाजन की छाया में — एक राष्ट्र सीखता हुआ कि एकता ही उसका इकलौता अपूरणीय हथियार था।",
      mr: "जुळणारी एक स्वातंत्र्य चळवळ: शिक्षितांची सभा जी जनसागर झाली, असहकार आणि मीठ आणि चले जाव, आणि 1947 चे स्वातंत्र्य फाळणीच्या छायेत — एक राष्ट्र शिकत होते की एकता हेच त्याचे एकमेव न भरून येणारे शस्त्र.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "congress",
        name: {
          en: "The Indian National Congress",
          hi: "भारतीय राष्ट्रीय कांग्रेस",
          mr: "भारतीय राष्ट्रीय काँग्रेस",
        },
        kind: "organisation",
        prompt: {
          en: "Which body, founded in 1885, began as a forum of the educated few and grew into the spearhead of the freedom struggle?",
          hi: "1885 में स्थापित कौन-सा संगठन शिक्षित थोड़े लोगों के मंच के रूप में शुरू हुआ और स्वतंत्रता-संग्राम का अगुआ बना?",
          mr: "1885 मध्ये स्थापन झालेली कोणती संस्था शिक्षित थोड्यांच्या व्यासपीठ म्हणून सुरू झाली आणि स्वातंत्र्य-लढ्याची अग्रणी झाली?",
        },
        statement: {
          en: "The Congress began in 1885 as an elite forum and became a mass organisation — the long spine of the national movement.",
          hi: "कांग्रेस 1885 में अभिजात मंच के रूप में शुरू हुई और जन-संगठन बनी — राष्ट्रीय आंदोलन की लंबी रीढ़।",
          mr: "काँग्रेस 1885 मध्ये उच्चभ्रू व्यासपीठ म्हणून सुरू झाली आणि जन-संघटना झाली — राष्ट्रीय चळवळीचा लांब कणा.",
        },
        detail: {
          en: "Early leaders petitioned politely; later ones marched millions — the same body, two tempos.",
          hi: "आरंभिक नेता विनम्र याचिकाएँ देते; बाद वाले करोड़ों को कूच कराते — वही संगठन, दो लय।",
          mr: "सुरुवातीचे नेते नम्र अर्ज देत; नंतरचे कोट्यवधींना कूच करवत — तीच संस्था, दोन लय.",
        },
        extra: {
          en: "The turn from petition to mass action is the movement's central story.",
          hi: "याचिका से जन-कार्रवाई की ओर मुड़ना ही आंदोलन की केंद्रीय कहानी है।",
          mr: "अर्जापासून जन-कृतीकडे वळणे हीच चळवळीची मध्यवर्ती कथा.",
        },
        pair: {
          left: {
            en: "The educated forum",
            hi: "शिक्षितों का मंच",
            mr: "शिक्षितांचे व्यासपीठ",
          },
          right: {
            en: "grown into a mass tide",
            hi: "जन-ज्वार बना",
            mr: "जनसागर झालेले",
          },
        },
      },
      {
        id: "gandhi",
        name: { en: "Mahatma Gandhi", hi: "महात्मा गांधी", mr: "महात्मा गांधी" },
        kind: "leader",
        prompt: {
          en: "Which leader, returning from South Africa in 1915, turned the freedom struggle into a mass movement built on non-violence and truth?",
          hi: "1915 में दक्षिण अफ़्रीका से लौटे किस नेता ने स्वतंत्रता-संग्राम को अहिंसा और सत्य पर खड़े जन-आंदोलन में बदल दिया?",
          mr: "1915 मध्ये दक्षिण आफ्रिकेतून परतलेल्या कोणत्या नेत्याने स्वातंत्र्य-लढ्याला अहिंसा आणि सत्यावर उभ्या जन-चळवळीत बदलले?",
        },
        statement: {
          en: "Gandhi made the struggle a people's movement — satyagraha, non-violent resistance, that ordinary men and women could join.",
          hi: "गांधी ने संघर्ष को जनता का आंदोलन बनाया — सत्याग्रह, अहिंसक प्रतिरोध, जिसमें आम स्त्री-पुरुष शामिल हो सकते थे।",
          mr: "गांधींनी लढ्याला जनतेची चळवळ केली — सत्याग्रह, अहिंसक प्रतिकार, ज्यात सामान्य स्त्री-पुरुष सामील होऊ शकत.",
        },
        detail: {
          en: "His genius was inclusion — a weapon needing no rifle, so peasant and lawyer could wield it alike.",
          hi: "उनकी प्रतिभा समावेश थी — ऐसा हथियार जिसे राइफ़ल नहीं चाहिए, ताकि किसान और वकील दोनों उसे उठा सकें।",
          mr: "त्यांची प्रतिभा समावेश — बंदूक न लागणारे शस्त्र, म्हणून शेतकरी आणि वकील दोघे ते उचलू शकत.",
        },
        extra: {
          en: "Champaran, Kheda and Ahmedabad were his first Indian campaigns — local wrongs, national method.",
          hi: "चंपारण, खेड़ा और अहमदाबाद उनके पहले भारतीय अभियान थे — स्थानीय अन्याय, राष्ट्रीय विधि।",
          mr: "चंपारण, खेडा आणि अहमदाबाद ही त्यांची पहिली भारतीय आंदोलने — स्थानिक अन्याय, राष्ट्रीय रीत.",
        },
        pair: {
          left: {
            en: "Truth-force for everyone",
            hi: "सबके लिए सत्य-बल",
            mr: "साऱ्यांसाठी सत्य-बल",
          },
          right: {
            en: "a weapon needing no rifle",
            hi: "बिना राइफ़ल का हथियार",
            mr: "बंदूक न लागणारे शस्त्र",
          },
        },
      },
      {
        id: "non-cooperation",
        name: {
          en: "Non-Cooperation",
          hi: "असहयोग आंदोलन",
          mr: "असहकार चळवळ",
        },
        kind: "movement",
        prompt: {
          en: "Which 1920–22 movement asked Indians to withdraw from British schools, courts, titles and goods — starving the Raj of the cooperation it ran on?",
          hi: "1920–22 के किस आंदोलन ने भारतीयों से ब्रिटिश स्कूल, अदालतें, उपाधियाँ और माल छोड़ने को कहा — राज को उस सहयोग से भूखा करते हुए जिस पर वह चलता था?",
          mr: "1920–22 च्या कोणत्या चळवळीने भारतीयांना ब्रिटिश शाळा, न्यायालये, पदव्या आणि माल सोडायला सांगितले — राजला त्या सहकार्यापासून उपाशी करत ज्यावर तो चाले?",
        },
        statement: {
          en: "Non-Cooperation withheld the cooperation the empire depended on — boycotting its schools, courts, cloth and honours all at once.",
          hi: "असहयोग ने वह सहयोग रोक लिया जिस पर साम्राज्य टिका था — उसके स्कूल, अदालतें, कपड़ा और सम्मान एक साथ बहिष्कृत।",
          mr: "असहकाराने ते सहकार्य रोखले ज्यावर साम्राज्य अवलंबून होते — त्याच्या शाळा, न्यायालये, कापड आणि सन्मान एकदम बहिष्कृत.",
        },
        detail: {
          en: "It rested on one insight: a foreign rule of the few over the many survives only if the many keep helping it.",
          hi: "वह एक अंतर्दृष्टि पर टिका था: थोड़ों का बहुतों पर विदेशी शासन तभी जीता है जब बहुत उसकी मदद करते रहें।",
          mr: "तो एका अंतर्दृष्टीवर उभा: थोड्यांचे बहुतांवरचे परकीय राज्य तेव्हाच जगते जेव्हा बहुजन त्याला मदत करत राहतात.",
        },
        extra: {
          en: "Gandhi suspended it after the violence at Chauri Chaura — non-violence was a condition, not a tactic.",
          hi: "चौरी चौरा की हिंसा के बाद गांधी ने उसे स्थगित किया — अहिंसा शर्त थी, चाल नहीं।",
          mr: "चौरी चौराच्या हिंसेनंतर गांधींनी तो स्थगित केला — अहिंसा ही अट होती, डाव नव्हे.",
        },
        pair: {
          left: {
            en: "Cooperation withdrawn",
            hi: "वापस लिया सहयोग",
            mr: "मागे घेतलेले सहकार्य",
          },
          right: {
            en: "the Raj starved of its help",
            hi: "मदद से भूखा राज",
            mr: "मदतीविना उपाशी राज",
          },
        },
      },
      {
        id: "salt-march",
        name: { en: "The Salt March", hi: "नमक मार्च (दांडी)", mr: "मीठ यात्रा (दांडी)" },
        kind: "movement",
        prompt: {
          en: "In 1930 which 240-mile march to make salt from the sea defied the British salt tax — turning a kitchen necessity into a symbol of freedom?",
          hi: "1930 में समुद्र से नमक बनाने का कौन-सा 240 मील का मार्च ब्रिटिश नमक-कर की अवज्ञा था — रसोई की एक ज़रूरत को स्वतंत्रता का प्रतीक बनाते हुए?",
          mr: "1930 मध्ये समुद्रातून मीठ बनवण्याची कोणती 240 मैलांची यात्रा ब्रिटिश मीठ-कराची अवज्ञा होती — स्वयंपाकघरातल्या गरजेला स्वातंत्र्याचे प्रतीक करत?",
        },
        statement: {
          en: "The Salt March broke an unjust law by making salt freely from the sea — a simple, universal act of defiance the whole nation could copy.",
          hi: "नमक मार्च ने समुद्र से मुफ़्त नमक बनाकर एक अन्यायी क़ानून तोड़ा — अवज्ञा का सरल, सर्वजनीन कार्य जिसे पूरा राष्ट्र दोहरा सकता था।",
          mr: "मीठ यात्रेने समुद्रातून फुकट मीठ बनवून एक अन्याय्य कायदा मोडला — अवज्ञेचे साधे, सर्वसामान्य कृत्य जे अख्खे राष्ट्र दोहरू शके.",
        },
        detail: {
          en: "Everyone ate salt; taxing it was felt everywhere — so defying it could be joined everywhere.",
          hi: "नमक सब खाते थे; उस पर कर हर जगह महसूस होता था — अतः उसकी अवज्ञा हर जगह जुड़ सकती थी।",
          mr: "मीठ सारे खात; त्यावरचा कर सर्वत्र जाणवे — म्हणून त्याची अवज्ञा सर्वत्र जुळू शके.",
        },
        extra: {
          en: "Choosing salt was strategy — the humblest, most shared grievance made the widest resistance.",
          hi: "नमक चुनना रणनीति थी — सबसे मामूली, सबसे साझी शिकायत ने सबसे व्यापक प्रतिरोध बनाया।",
          mr: "मीठ निवडणे ही रणनीती — सर्वांत साधी, सर्वांत सामाईक तक्रार सर्वांत व्यापक प्रतिकार घडवी.",
        },
        pair: {
          left: {
            en: "Salt made from the sea",
            hi: "समुद्र से बना नमक",
            mr: "समुद्रातून बनवलेले मीठ",
          },
          right: {
            en: "a law broken by everyone",
            hi: "सबका तोड़ा क़ानून",
            mr: "साऱ्यांनी मोडलेला कायदा",
          },
        },
      },
      {
        id: "quit-india",
        name: {
          en: "Quit India, 1942",
          hi: "भारत छोड़ो, 1942",
          mr: "चले जाव, 1942",
        },
        kind: "movement",
        prompt: {
          en: "Which 1942 movement, with the cry 'Do or Die', demanded the British leave India at once, in the midst of the Second World War?",
          hi: "'करो या मरो' के नारे वाला 1942 का कौन-सा आंदोलन, दूसरे विश्वयुद्ध के बीच, माँग करता था कि अंग्रेज़ भारत तुरंत छोड़ें?",
          mr: "'करा किंवा मरा' च्या घोषणेसह 1942 ची कोणती चळवळ, दुसऱ्या महायुद्धाच्या मध्ये, इंग्रजांनी भारत ताबडतोब सोडावा अशी मागणी करी?",
        },
        statement: {
          en: "Quit India demanded an immediate end to British rule — 'Do or Die' — and though its leaders were jailed, it showed the empire's days were counted.",
          hi: "भारत छोड़ो ने ब्रिटिश शासन का तुरंत अंत माँगा — 'करो या मरो' — और नेता जेल गए फिर भी उसने दिखा दिया कि साम्राज्य के दिन गिने-चुने हैं।",
          mr: "चले जावने ब्रिटिश राज्याचा तात्काळ अंत मागितला — 'करा किंवा मरा' — आणि नेते तुरुंगात गेले तरी त्याने दाखवले की साम्राज्याचे दिवस मोजके आहेत.",
        },
        pair: {
          left: {
            en: "'Do or Die'",
            hi: "'करो या मरो'",
            mr: "'करा किंवा मरा'",
          },
          right: {
            en: "leave India at once",
            hi: "भारत तुरंत छोड़ो",
            mr: "भारत ताबडतोब सोडा",
          },
        },
      },
      {
        id: "partition",
        name: {
          en: "Independence and Partition",
          hi: "स्वतंत्रता और विभाजन",
          mr: "स्वातंत्र्य आणि फाळणी",
        },
        kind: "event",
        prompt: {
          en: "In 1947 freedom finally came — but shadowed by which simultaneous event that split the land into two states and uprooted millions?",
          hi: "1947 में आज़ादी आख़िर आई — पर किस साथ घटी घटना की छाया में, जिसने भूमि को दो राज्यों में बाँटा और करोड़ों को उजाड़ा?",
          mr: "1947 मध्ये स्वातंत्र्य अखेर आले — पण कोणत्या सोबत घडलेल्या घटनेच्या छायेत, जिने भूमी दोन राज्यांत विभागली आणि कोट्यवधींना उखडले?",
        },
        statement: {
          en: "Independence in 1947 came with Partition — the land split into India and Pakistan amid vast migration and terrible violence.",
          hi: "1947 की स्वतंत्रता विभाजन संग आई — भूमि भारत और पाकिस्तान में बँटी, विशाल पलायन और भयानक हिंसा के बीच।",
          mr: "1947 चे स्वातंत्र्य फाळणीसह आले — भूमी भारत आणि पाकिस्तानात विभागली, प्रचंड स्थलांतर आणि भयंकर हिंसेच्या मध्ये.",
        },
        detail: {
          en: "The joy of freedom and the grief of partition arrived together — one dawn, two faces.",
          hi: "आज़ादी का हर्ष और विभाजन का शोक साथ आए — एक भोर, दो चेहरे।",
          mr: "स्वातंत्र्याचा आनंद आणि फाळणीचे दुःख एकत्र आले — एक पहाट, दोन चेहरे.",
        },
        extra: {
          en: "Division cost dearly — the movement's long lesson, that unity was its irreplaceable strength, was written again in blood.",
          hi: "बँटवारे का दाम भारी था — आंदोलन का लंबा सबक़, कि एकता उसकी अपूरणीय शक्ति थी, फिर ख़ून से लिखा गया।",
          mr: "विभाजनाची किंमत जबर — चळवळीचा दीर्घ धडा, की एकता हे तिचे न भरून येणारे बळ, पुन्हा रक्ताने लिहिला गेला.",
        },
        pair: {
          left: {
            en: "Freedom's shadowed dawn",
            hi: "छायाग्रस्त आज़ादी की भोर",
            mr: "छायेतली स्वातंत्र्याची पहाट",
          },
          right: {
            en: "one land split in two",
            hi: "दो में बँटी एक भूमि",
            mr: "दोहोंत विभागलेली एक भूमी",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put these milestones of the national movement in order. Which sequence is right?",
          hi: "राष्ट्रीय आंदोलन के इन मील के पत्थरों को क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "राष्ट्रीय चळवळीचे हे मैलाचे दगड क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Congress founded (1885) → Non-Cooperation (1920–22) → Salt March (1930) → Quit India (1942) → Independence and Partition (1947)",
            hi: "कांग्रेस की स्थापना (1885) → असहयोग (1920–22) → नमक मार्च (1930) → भारत छोड़ो (1942) → स्वतंत्रता और विभाजन (1947)",
            mr: "काँग्रेसची स्थापना (1885) → असहकार (1920–22) → मीठ यात्रा (1930) → चले जाव (1942) → स्वातंत्र्य आणि फाळणी (1947)",
          },
          {
            en: "Salt March (1930) → Congress founded (1885) → Quit India (1942) → Non-Cooperation → Independence",
            hi: "नमक मार्च (1930) → कांग्रेस की स्थापना (1885) → भारत छोड़ो (1942) → असहयोग → स्वतंत्रता",
            mr: "मीठ यात्रा (1930) → काँग्रेसची स्थापना (1885) → चले जाव (1942) → असहकार → स्वातंत्र्य",
          },
          {
            en: "Independence (1947) → Salt March (1930) → Congress (1885) → Quit India → Non-Cooperation",
            hi: "स्वतंत्रता (1947) → नमक मार्च (1930) → कांग्रेस (1885) → भारत छोड़ो → असहयोग",
            mr: "स्वातंत्र्य (1947) → मीठ यात्रा (1930) → काँग्रेस (1885) → चले जाव → असहकार",
          },
          {
            en: "Non-Cooperation (1920) → Congress founded (1885) → Independence → Salt March → Quit India",
            hi: "असहयोग (1920) → कांग्रेस की स्थापना (1885) → स्वतंत्रता → नमक मार्च → भारत छोड़ो",
            mr: "असहकार (1920) → काँग्रेसची स्थापना (1885) → स्वातंत्र्य → मीठ यात्रा → चले जाव",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The movement escalates step by step: a debating society in 1885 becomes a mass boycott in the 1920s, a mass boycott becomes open law-breaking in 1930, law-breaking becomes an all-out demand to leave in 1942, and the demand is finally met — at the price of Partition — in 1947. Each stage borrows the crowds and the confidence built by the one before; the order is not a list to memorise but a rising pressure to feel.",
          hi: "आंदोलन क़दम-दर-क़दम चढ़ता है: 1885 की एक बहस-सभा 1920 के दशक में जन-बहिष्कार बनती है, जन-बहिष्कार 1930 में खुला क़ानून-भंग, क़ानून-भंग 1942 में छोड़ने की पूरी माँग, और माँग अंततः पूरी होती है — विभाजन के दाम पर — 1947 में। हर चरण पिछले से बनी भीड़ और आत्मविश्वास उधार लेता है; क्रम रटने की सूची नहीं, महसूस करने का बढ़ता दबाव है।",
          mr: "चळवळ पावला-पावलाने चढते: 1885 ची चर्चा-सभा 1920 च्या दशकात जन-बहिष्कार होते, जन-बहिष्कार 1930 मध्ये उघड कायदा-भंग, कायदा-भंग 1942 मध्ये सोडण्याची संपूर्ण मागणी, आणि मागणी अखेर पूर्ण होते — फाळणीच्या किमतीवर — 1947 मध्ये. प्रत्येक टप्पा आधीच्याने घडवलेली गर्दी आणि आत्मविश्वास उसना घेतो; क्रम ही पाठ करण्याची यादी नव्हे, जाणवण्याचा चढता दबाव.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Gandhi chose SALT — not gold, land or the vote — as the target of his most famous campaign. Why was a pinch of salt a shrewder weapon than a grander grievance?",
          hi: "गांधी ने अपने सबसे मशहूर अभियान का निशाना नमक चुना — सोना, ज़मीन या मताधिकार नहीं। चुटकी भर नमक किसी बड़ी शिकायत से चतुर हथियार क्यों था?",
          mr: "गांधींनी आपल्या सर्वांत प्रसिद्ध आंदोलनाचे लक्ष्य मीठ निवडले — सोने, जमीन वा मताधिकार नव्हे. चिमूटभर मीठ एखाद्या मोठ्या तक्रारीहून चतुर शस्त्र का होते?",
        },
        choices: [
          {
            en: "Because everyone — rich and poor, of every religion and region — uses salt, the tax touched all alike; so defying it was an act any Indian could perform and feel, making the widest possible unity around the humblest possible thing",
            hi: "क्योंकि नमक सब — अमीर-ग़रीब, हर धर्म-क्षेत्र के — इस्तेमाल करते हैं, कर सबको एक-सा छूता था; अतः उसकी अवज्ञा ऐसा कार्य था जिसे कोई भी भारतीय कर और महसूस कर सकता था, सबसे मामूली चीज़ के गिर्द सबसे व्यापक एकता बनाते हुए",
            mr: "कारण मीठ सारे — श्रीमंत-गरीब, प्रत्येक धर्म-प्रदेशाचे — वापरतात, कर साऱ्यांना सारखाच स्पर्शे; म्हणून त्याची अवज्ञा असे कृत्य होते जे कोणताही भारतीय करू आणि जाणवू शके, सर्वांत साध्या गोष्टीभोवती सर्वांत व्यापक एकता घडवत",
          },
          {
            en: "Salt was the single most valuable thing the British owned",
            hi: "नमक अंग्रेज़ों के पास सबसे मूल्यवान अकेली चीज़ थी",
            mr: "मीठ ही इंग्रजांकडची सर्वांत मौल्यवान एकमेव गोष्ट होती",
          },
          {
            en: "The salt tax was the only tax the British ever levied",
            hi: "नमक-कर अंग्रेज़ों का लगाया इकलौता कर था",
            mr: "मीठ-कर हा इंग्रजांनी लावलेला एकमेव कर होता",
          },
          {
            en: "Gandhi simply liked salt more than gold",
            hi: "गांधी को सोने से नमक बस अधिक पसंद था",
            mr: "गांधींना सोन्यापेक्षा मीठ नुसते अधिक आवडे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A protest is only as strong as the number who can join it and feel it their own. Gold or the vote touched the few; salt touched everyone, every day, in every kitchen from palace to hut. By taxing a universal necessity the empire had, without meaning to, handed the movement a grievance shared across every division of wealth, faith and region — and by breaking that one small law, a fisherman in Gujarat and a lawyer in Bengal performed the same act of freedom. Gandhi's insight was that the widest unity gathers not around the grandest cause but around the humblest thing everyone holds in common. Choosing salt turned a tax into a nation.",
          hi: "विरोध उतना ही मज़बूत है जितने लोग उसमें जुड़ें और उसे अपना महसूस करें। सोना या मताधिकार थोड़ों को छूता; नमक सबको, हर दिन, महल से झोपड़ी तक हर रसोई में। एक सर्वजनीन ज़रूरत पर कर लगाकर साम्राज्य ने, बिना चाहे, आंदोलन को ऐसी शिकायत थमा दी जो धन, धर्म और क्षेत्र के हर बँटवारे के आर-पार साझी थी — और उस एक छोटे क़ानून को तोड़कर, गुजरात का मछुआरा और बंगाल का वकील स्वतंत्रता का एक ही कार्य करते थे। गांधी की अंतर्दृष्टि यह थी कि सबसे व्यापक एकता सबसे बड़े कारण के गिर्द नहीं, बल्कि उस सबसे मामूली चीज़ के गिर्द जुटती है जो सबमें साझी है। नमक चुनना एक कर को एक राष्ट्र में बदल गया।",
          mr: "निषेध तितकाच बळकट जितके लोक त्यात जुळू आणि तो आपला मानू शकतात. सोने वा मताधिकार थोड्यांना स्पर्शे; मीठ साऱ्यांना, रोज, राजवाड्यापासून झोपडीपर्यंत प्रत्येक स्वयंपाकघरात. एका सर्वसामान्य गरजेवर कर लावून साम्राज्याने, नकळत, चळवळीला अशी तक्रार दिली जी संपत्ती, धर्म आणि प्रदेशाच्या प्रत्येक विभाजनापार सामाईक होती — आणि तो एक छोटा कायदा मोडून, गुजरातचा कोळी आणि बंगालचा वकील स्वातंत्र्याचे एकच कृत्य करत. गांधींची अंतर्दृष्टी ही की सर्वांत व्यापक एकता सर्वांत मोठ्या कारणाभोवती नव्हे, तर साऱ्यांत सामाईक असलेल्या सर्वांत साध्या गोष्टीभोवती जमते. मीठ निवडणे एका कराचे राष्ट्रात रूपांतर करून गेले.",
        },
      },
    ],
  },
];
