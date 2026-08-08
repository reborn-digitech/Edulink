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
];
