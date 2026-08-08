/**
 * Class 8 Geography — NCERT "Resources and Development", chapter by chapter,
 * through the conceptual engine. The earth-science voice turns economic:
 * what counts as a resource, who spends it, and what tomorrow is owed.
 * Same distractor rule as everywhere — every statement must be false of
 * every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Resources and Development (Class 8)";
const LICENCE = "CC-BY-SA-4.0";

export const G8_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Resources (utility, and tomorrow's share)                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-8-resources",
    subject: "GEOGRAPHY",
    classLevel: 8,
    chapter: {
      en: "Chapter 1 — Resources",
      hi: "अध्याय 1 — संसाधन",
      mr: "प्रकरण 1 — संसाधने",
    },
    name: { en: "Resources", hi: "संसाधन", mr: "संसाधने" },
    summary: {
      en: "What makes a thing a resource: utility given by human ingenuity, nature's shelf against the human-made one, stocks that refill and stocks that only empty — and development the future can also afford.",
      hi: "क्या चीज़ किसी वस्तु को संसाधन बनाती है: मानवी सूझ से मिली उपयोगिता, प्रकृति की ताक़ बनाम मानव-निर्मित, भरते भंडार बनाम केवल ख़ाली होते — और वह विकास जिसे भविष्य भी वहन कर सके।",
      mr: "कशाने वस्तू संसाधन होते: मानवी कल्पकतेने मिळालेली उपयुक्तता, निसर्गाचे फडताळ विरुद्ध मानवनिर्मित, भरणारे साठे विरुद्ध फक्त रिकामे होणारे — आणि भविष्यालाही परवडणारा विकास.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "resource",
        name: { en: "A resource", hi: "संसाधन", mr: "संसाधन" },
        kind: "idea",
        prompt: {
          en: "Anything that satisfies a need and has utility — water, coal, a teacher's skill. What is such a thing called?",
          hi: "जो कुछ ज़रूरत पूरी करे और उपयोगिता रखे — पानी, कोयला, शिक्षक का हुनर। ऐसी चीज़ को क्या कहते हैं?",
          mr: "जे काही गरज भागवते आणि उपयुक्तता राखते — पाणी, कोळसा, शिक्षकाचे कौशल्य. अशा गोष्टीला काय म्हणतात?",
        },
        statement: {
          en: "A resource is anything with utility — the value comes from use, and the use from human ingenuity.",
          hi: "संसाधन वह है जिसमें उपयोगिता हो — मोल उपयोग से आता है, और उपयोग मानवी सूझ से।",
          mr: "संसाधन म्हणजे उपयुक्तता असलेले काहीही — मोल वापरातून येते, आणि वापर मानवी कल्पकतेतून.",
        },
        detail: {
          en: "Time and technology keep promoting mere 'stuff' into resources — crude oil was black nuisance until engines learnt to drink it.",
          hi: "समय और तकनीक 'चीज़ों' को संसाधन बनाते जाते हैं — कच्चा तेल काली मुसीबत था, जब तक इंजनों ने उसे पीना नहीं सीखा।",
          mr: "काळ आणि तंत्रज्ञान नुसत्या 'वस्तूंना' संसाधने करत जातात — कच्चे तेल काळा त्रास होते, इंजिनांनी ते प्यायला शिकेपर्यंत.",
        },
        extra: {
          en: "People themselves are resources — skill is wealth that walks on two feet.",
          hi: "मनुष्य स्वयं संसाधन हैं — हुनर वह दौलत है जो दो पैरों पर चलती है।",
          mr: "माणसे स्वतः संसाधने आहेत — कौशल्य ही दोन पायांवर चालणारी संपत्ती.",
        },
        pair: {
          left: { en: "Utility made valuable", hi: "मोल बनी उपयोगिता", mr: "मोल झालेली उपयुक्तता" },
          right: { en: "use gives the worth", hi: "उपयोग से मिला मूल्य", mr: "वापराने मिळालेले मूल्य" },
        },
      },
      {
        id: "natural-res",
        name: { en: "Natural resources", hi: "प्राकृतिक संसाधन", mr: "नैसर्गिक संसाधने" },
        kind: "class",
        prompt: {
          en: "Air, water, soils, minerals — which resources does nature hand over ready-made?",
          hi: "हवा, पानी, मिट्टियाँ, खनिज — कौन-से संसाधन प्रकृति बने-बनाए सौंपती है?",
          mr: "हवा, पाणी, माती, खनिजे — कोणती संसाधने निसर्ग तयार सोपवतो?",
        },
        statement: {
          en: "Natural resources come off nature's shelf — some renewable like sunlight, some exhaustible like coal seams.",
          hi: "प्राकृतिक संसाधन प्रकृति की ताक़ से उतरते हैं — कुछ नवीकरणीय जैसे धूप, कुछ समाप्य जैसे कोयला-परतें।",
          mr: "नैसर्गिक संसाधने निसर्गाच्या फडताळातून उतरतात — काही नवीकरणीय जसे ऊन, काही संपणारी जशी कोळसा-थर.",
        },
        pair: {
          left: { en: "Nature's shelf", hi: "प्रकृति की ताक़", mr: "निसर्गाचे फडताळ" },
          right: {
            en: "sun renewable, coal not",
            hi: "धूप नवीकरणीय, कोयला नहीं",
            mr: "ऊन नवीकरणीय, कोळसा नाही",
          },
        },
      },
      {
        id: "human-made-res",
        name: { en: "Human-made resources", hi: "मानव-निर्मित संसाधन", mr: "मानवनिर्मित संसाधने" },
        kind: "class",
        prompt: {
          en: "Roads, buildings, machines — which resources did people create by transforming nature's gifts?",
          hi: "सड़कें, इमारतें, मशीनें — कौन-से संसाधन लोगों ने प्रकृति की देनों को बदलकर रचे?",
          mr: "रस्ते, इमारती, यंत्रे — कोणती संसाधने माणसांनी निसर्गाच्या देणग्या बदलून घडवली?",
        },
        statement: {
          en: "Human-made resources are nature reworked — a bridge is a river-crossing manufactured out of stone and steel.",
          hi: "मानव-निर्मित संसाधन फिर से गढ़ी प्रकृति हैं — पुल पत्थर और इस्पात से निर्मित नदी-पार है।",
          mr: "मानवनिर्मित संसाधने म्हणजे पुन्हा घडवलेला निसर्ग — पूल हा दगड आणि पोलादातून बनवलेले नदी-उल्लंघन आहे.",
        },
        pair: {
          left: { en: "Nature reworked", hi: "फिर गढ़ी प्रकृति", mr: "पुन्हा घडवलेला निसर्ग" },
          right: { en: "bridges from stone", hi: "पत्थर से बने पुल", mr: "दगडांतून झालेले पूल" },
        },
      },
      {
        id: "renewable",
        name: { en: "Renewable resources", hi: "नवीकरणीय संसाधन", mr: "नवीकरणीय संसाधने" },
        kind: "class",
        prompt: {
          en: "Solar energy, wind, flowing water — which resources refill themselves faster than we spend them?",
          hi: "सौर ऊर्जा, हवा, बहता पानी — कौन-से संसाधन हमारे ख़र्चने से तेज़ ख़ुद भर जाते हैं?",
          mr: "सौरऊर्जा, वारा, वाहते पाणी — कोणती संसाधने आपल्या खर्चण्याहून वेगाने स्वतः भरतात?",
        },
        statement: {
          en: "Renewable resources restock themselves — the sun cannot be overdrawn, though a forest can be, if felled faster than it grows.",
          hi: "नवीकरणीय संसाधन स्वयं भरते हैं — सूरज से ओवरड्राफ़्ट नहीं हो सकता, पर जंगल से हो सकता है, यदि उगने से तेज़ काटा जाए।",
          mr: "नवीकरणीय संसाधने स्वतः भरतात — सूर्याकडून जादा उचल होऊ शकत नाही, पण जंगलाकडून होऊ शकते, वाढीहून वेगाने तोडले तर.",
        },
        detail: {
          en: "Renewable is a RATE, not a promise — groundwater renews, but slower than greedy pumps withdraw it.",
          hi: "नवीकरणीय एक दर है, वादा नहीं — भूजल भरता है, पर लालची पंपों की निकासी से धीमे।",
          mr: "नवीकरणीय हा दर आहे, वचन नाही — भूजल भरते, पण हावऱ्या पंपांच्या उपशाहून हळू.",
        },
        extra: {
          en: "A forest is renewable only on the forest's timetable — never on the sawmill's.",
          hi: "जंगल केवल जंगल की समय-सारिणी पर नवीकरणीय है — आरा-मशीन की पर कभी नहीं।",
          mr: "जंगल फक्त जंगलाच्या वेळापत्रकावर नवीकरणीय — करवतीच्या वेळापत्रकावर कधीच नाही.",
        },
        pair: {
          left: {
            en: "The self-refilling stock",
            hi: "ख़ुद भरता भंडार",
            mr: "स्वतः भरणारा साठा",
          },
          right: { en: "sun beyond overdraft", hi: "ओवरड्राफ़्ट से परे सूरज", mr: "जादा उचलीपलीकडचा सूर्य" },
        },
      },
      {
        id: "sustainable",
        name: { en: "Sustainable development", hi: "सतत विकास", mr: "शाश्वत विकास" },
        kind: "principle",
        prompt: {
          en: "Which principle spends resources today without robbing tomorrow — development the future can also afford?",
          hi: "कौन-सा सिद्धांत आज संसाधन ख़र्चता है कल को लूटे बिना — ऐसा विकास जिसे भविष्य भी वहन कर सके?",
          mr: "कोणते तत्त्व आज संसाधने खर्चते उद्याला न लुटता — असा विकास जो भविष्यालाही परवडेल?",
        },
        statement: {
          en: "Sustainable development balances present need against future right — using, without using up.",
          hi: "सतत विकास वर्तमान की ज़रूरत और भविष्य के हक़ को तौलता है — उपयोग, बिना चुकाए।",
          mr: "शाश्वत विकास वर्तमानाची गरज आणि भविष्याचा हक्क तोलतो — वापरणे, न संपवता.",
        },
        detail: {
          en: "The test is one question: after our use, can the next generation still meet its own needs?",
          hi: "कसौटी एक सवाल है: हमारे उपयोग के बाद क्या अगली पीढ़ी अपनी ज़रूरतें पूरी कर सकेगी?",
          mr: "कसोटी एकच प्रश्न: आपल्या वापरानंतर पुढची पिढी आपल्या गरजा भागवू शकेल का?",
        },
        extra: {
          en: "It is the resource chapter's one commandment — everything else in it is example.",
          hi: "यह संसाधन-अध्याय की इकलौती आज्ञा है — बाक़ी सब उसका उदाहरण।",
          mr: "ही संसाधन-प्रकरणाची एकमेव आज्ञा — बाकी सारे तिचे उदाहरण.",
        },
        pair: {
          left: {
            en: "Today without robbing tomorrow",
            hi: "कल को लूटे बिना आज",
            mr: "उद्याला न लुटता आज",
          },
          right: { en: "using, not using up", hi: "उपयोग, उपभोग नहीं", mr: "वापरणे, न संपवणे" },
        },
      },
      {
        id: "uneven",
        name: { en: "Uneven distribution", hi: "असमान वितरण", mr: "असमान वाटप" },
        kind: "fact",
        prompt: {
          en: "Oil under some deserts, fertile plains in some valleys — which fact about resources drives trade and quarrels alike?",
          hi: "कुछ रेगिस्तानों तले तेल, कुछ घाटियों में उपजाऊ मैदान — संसाधनों का कौन-सा तथ्य व्यापार और झगड़े दोनों चलाता है?",
          mr: "काही वाळवंटांखाली तेल, काही खोऱ्यांत सुपीक मैदाने — संसाधनांची कोणती वस्तुस्थिती व्यापार आणि भांडणे दोन्ही चालवते?",
        },
        statement: {
          en: "Resources are unevenly spread — geology and climate deal unequal hands, and trade or conflict follows the dealing.",
          hi: "संसाधन असमान बिखरे हैं — भूविज्ञान और जलवायु असमान पत्ते बाँटते हैं, और बँटवारे के पीछे व्यापार या टकराव चलता है।",
          mr: "संसाधने असमान पसरली आहेत — भूविज्ञान आणि जलवायुमान असमान पाने वाटतात, आणि वाटपामागून व्यापार वा संघर्ष येतो.",
        },
        pair: {
          left: { en: "Unequal hands dealt", hi: "बँटे असमान पत्ते", mr: "वाटलेली असमान पाने" },
          right: {
            en: "trade or quarrel follows",
            hi: "पीछे व्यापार या झगड़ा",
            mr: "मागून व्यापार वा भांडण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which list holds ONLY renewable resources?",
          hi: "किस सूची में केवल नवीकरणीय संसाधन हैं?",
          mr: "कोणत्या यादीत फक्त नवीकरणीय संसाधने आहेत?",
        },
        choices: [
          {
            en: "Sunlight · wind · flowing river water",
            hi: "धूप · हवा · बहता नदी-जल",
            mr: "ऊन · वारा · वाहते नदीचे पाणी",
          },
          {
            en: "Sunlight · coal · wind",
            hi: "धूप · कोयला · हवा",
            mr: "ऊन · कोळसा · वारा",
          },
          {
            en: "Petroleum · natural gas · sunlight",
            hi: "पेट्रोलियम · प्राकृतिक गैस · धूप",
            mr: "पेट्रोलियम · नैसर्गिक वायू · ऊन",
          },
          {
            en: "Iron ore · flowing water · wind",
            hi: "लौह अयस्क · बहता पानी · हवा",
            mr: "लोह धातुक · वाहते पाणी · वारा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ask each candidate: does tomorrow refill it? Sun, wind and river flow arrive again daily — pure flows. The other lists each smuggle in a stock laid down once — coal, oil, gas, ore — which use only empties. The sorting is about refill rate, not usefulness.",
          hi: "हर दावेदार से पूछिए: क्या कल उसे फिर भरता है? धूप, हवा और नदी-प्रवाह रोज़ फिर आते हैं — शुद्ध प्रवाह। बाक़ी सूचियों में एक-एक ऐसा भंडार छिपा है जो एक ही बार जमा हुआ — कोयला, तेल, गैस, अयस्क — जिसे उपयोग केवल ख़ाली करता है। छँटाई भराव-दर की है, उपयोगिता की नहीं।",
          mr: "प्रत्येक उमेदवाराला विचारा: उद्या त्याला पुन्हा भरतो का? ऊन, वारा आणि नदी-प्रवाह रोज पुन्हा येतात — शुद्ध प्रवाह. बाकी याद्यांत एक-एक असा साठा लपला आहे जो एकदाच साचला — कोळसा, तेल, वायू, धातुक — ज्याला वापर फक्त रिकामा करतो. निवड भरण-दराची आहे, उपयुक्ततेची नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In 1700 crude oil seeping from the ground was a nuisance that spoilt farmland; by 1950 nations bargained and fought over it. The oil never changed — what did?",
          hi: "1700 में ज़मीन से रिसता कच्चा तेल खेत बिगाड़ने वाली मुसीबत था; 1950 तक राष्ट्र उस पर सौदे और लड़ाइयाँ करने लगे। तेल कभी नहीं बदला — क्या बदला?",
          mr: "1700 मध्ये जमिनीतून झिरपणारे कच्चे तेल शेत बिघडवणारा त्रास होता; 1950 पर्यंत राष्ट्रे त्यावर सौदे आणि लढाया करू लागली. तेल कधीच बदलले नाही — काय बदलले?",
        },
        choices: [
          {
            en: "Technology: engines, refineries and plastics taught humanity USES for it — value is not in the substance but in what ingenuity can do with it, which is the definition of a resource",
            hi: "तकनीक: इंजनों, रिफ़ाइनरियों और प्लास्टिक ने मानवता को उसके उपयोग सिखाए — मोल पदार्थ में नहीं, उस सूझ में है जो उससे कुछ कर सके; और यही संसाधन की परिभाषा है",
            mr: "तंत्रज्ञान: इंजिने, शुद्धीकरण-कारखाने आणि प्लास्टिकने मानवतेला त्याचे उपयोग शिकवले — मोल पदार्थात नाही, त्याच्याशी काही करू शकणाऱ्या कल्पकतेत आहे; आणि हीच संसाधनाची व्याख्या",
          },
          {
            en: "The oil itself slowly grew more powerful underground",
            hi: "तेल स्वयं ज़मीन के नीचे धीरे-धीरे ताक़तवर होता गया",
            mr: "तेल स्वतःच जमिनीखाली हळूहळू शक्तिशाली होत गेले",
          },
          {
            en: "People in 1700 simply never noticed the oil",
            hi: "1700 के लोगों ने तेल देखा ही नहीं था",
            mr: "1700 च्या लोकांनी तेल पाहिलेच नव्हते",
          },
          {
            en: "Farmland stopped mattering by 1950",
            hi: "1950 तक खेती का महत्व ख़त्म हो गया",
            mr: "1950 पर्यंत शेतीचे महत्त्व संपले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A resource is a partnership between matter and mind. The seep of 1700 had every molecule of the barrel of 1950 — what it lacked was an engine to burn in, a refinery to split it, a chemistry to weave it into cloth and pipe. Each invention promoted the black nuisance one rank. The lesson cuts forward too: today's nuisances — sunlight on a desert, waste plastic, seawater — are resources waiting for their engine.",
          hi: "संसाधन पदार्थ और बुद्धि की साझेदारी है। 1700 के रिसाव में 1950 के बैरल का हर अणु था — कमी थी तो उस इंजन की जिसमें वह जले, उस रिफ़ाइनरी की जो उसे बाँटे, उस रसायन की जो उसे कपड़े और पाइप में बुने। हर आविष्कार ने काली मुसीबत को एक दर्जा चढ़ाया। सबक़ आगे भी काटता है: आज की मुसीबतें — रेगिस्तान की धूप, बेकार प्लास्टिक, खारा पानी — अपने इंजन की प्रतीक्षा में खड़े संसाधन हैं।",
          mr: "संसाधन ही पदार्थ आणि बुद्धीची भागीदारी. 1700 च्या झिरप्यात 1950 च्या पिंपाचा प्रत्येक रेणू होता — उणीव होती ती जळण्यासाठीच्या इंजिनाची, विभागणाऱ्या शुद्धीकरणाची, कापड-नळांत विणणाऱ्या रसायनाची. प्रत्येक शोधाने काळ्या त्रासाला एक दर्जा चढवला. धडा पुढेही लागू: आजचे त्रास — वाळवंटावरचे ऊन, टाकाऊ प्लास्टिक, खारे पाणी — आपल्या इंजिनाची वाट पाहणारी संसाधने आहेत.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Land, Soil, Water, Natural Vegetation and Wildlife          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-8-land-soil-water",
    subject: "GEOGRAPHY",
    classLevel: 8,
    chapter: {
      en: "Chapter 2 — Land, Soil, Water, Natural Vegetation and Wildlife",
      hi: "अध्याय 2 — भूमि, मृदा, जल, प्राकृतिक वनस्पति और वन्यजीव",
      mr: "प्रकरण 2 — जमीन, मृदा, पाणी, नैसर्गिक वनस्पती आणि वन्यजीव",
    },
    name: {
      en: "Land, Soil, Water, Vegetation and Wildlife",
      hi: "भूमि, मृदा, जल, वनस्पति और वन्यजीव",
      mr: "जमीन, मृदा, पाणी, वनस्पती आणि वन्यजीव",
    },
    summary: {
      en: "The living estate audited: a fixed plate of land divided by use, soil costing a millennium an inch, thirst amid oceans, vegetation as a walkable rain-gauge — and habitats fenced so the tiger saves itself.",
      hi: "जीवित जागीर का लेखा: उपयोग से बँटी भूमि की नियत थाली, इंच भर को सहस्राब्दी माँगती मिट्टी, महासागरों के बीच प्यास, चलकर पढ़ा जाने वाला वर्षा-मापी बनी वनस्पति — और घेरे गए आवास ताकि बाघ ख़ुद को बचा ले।",
      mr: "जिवंत मालमत्तेची तपासणी: वापराने वाटलेली जमिनीची ठरलेली थाळी, इंचभरासाठी सहस्रक मागणारी माती, महासागरांमधली तहान, चालत वाचता येणारा पर्जन्यमापक झालेली वनस्पती — आणि कुंपणलेले अधिवास म्हणजे वाघ स्वतःला वाचवेल.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "land-use",
        name: { en: "Land use", hi: "भूमि उपयोग", mr: "जमीन वापर" },
        kind: "division",
        prompt: {
          en: "Farms, forests, pastures, roads and cities all share one fixed plate of land. What is this division called?",
          hi: "खेत, जंगल, चरागाह, सड़कें और शहर भूमि की एक ही नियत थाली बाँटते हैं। इस बँटवारे का नाम क्या है?",
          mr: "शेते, जंगले, कुरणे, रस्ते आणि शहरे जमिनीची एकच ठरलेली थाळी वाटून घेतात. या वाटणीचे नाव काय?",
        },
        statement: {
          en: "Land use is the plate's division — farming, forest, pasture and settlement each claim acres from a total that never grows.",
          hi: "भूमि उपयोग थाली का बँटवारा है — खेती, वन, चरागाह और बस्ती, हर एक उस कुल से एकड़ माँगते हैं जो कभी बढ़ता नहीं।",
          mr: "जमीन वापर म्हणजे थाळीची वाटणी — शेती, वन, कुरण आणि वस्ती, प्रत्येक कधीही न वाढणाऱ्या एकुणातून एकर मागतात.",
        },
        detail: {
          en: "Every new use is an old use displaced — the city's growth is somebody's field gone.",
          hi: "हर नया उपयोग किसी पुराने की बेदख़ली है — शहर की बढ़त किसी का गया हुआ खेत है।",
          mr: "प्रत्येक नवा वापर म्हणजे जुन्याची हकालपट्टी — शहराची वाढ म्हणजे कोणाचे गेलेले शेत.",
        },
        extra: {
          en: "Private land has an owner's fence; common land — the village pond, the grazing ground — has everybody's and so, often, nobody's care.",
          hi: "निजी भूमि पर मालिक की बाड़ है; साझी भूमि — गाँव का तालाब, चरनोई — सबकी है, इसीलिए प्रायः किसी की देखरेख में नहीं।",
          mr: "खासगी जमिनीला मालकाचे कुंपण; सामाईक जमीन — गावचे तळे, गायरान — साऱ्यांची, म्हणूनच बहुधा कोणाच्याच निगराणीत नाही.",
        },
        pair: {
          left: { en: "The fixed plate divided", hi: "बँटी हुई नियत थाली", mr: "वाटलेली ठरलेली थाळी" },
          right: { en: "acres claimed by use", hi: "उपयोग से माँगे एकड़", mr: "वापराने मागितलेले एकर" },
        },
      },
      {
        id: "soil-formation",
        name: { en: "Soil formation", hi: "मृदा निर्माण", mr: "मृदा निर्मिती" },
        kind: "process",
        prompt: {
          en: "Weathered rock crumbs mixed with rotted life, ages in the stirring — what is slowly being made?",
          hi: "घिसी चट्टान का चूरा और सड़ा जीवन, हिलाने में बीतते युग — धीरे-धीरे क्या बन रहा है?",
          mr: "झिजलेल्या खडकाचा चुरा आणि कुजलेले जीवन, ढवळण्यात जाणारी युगे — हळूहळू काय बनते आहे?",
        },
        statement: {
          en: "Soil forms from weathered rock and humus over centuries — one inch of topsoil can cost a thousand years.",
          hi: "मिट्टी घिसी चट्टान और ह्यूमस से सदियों में बनती है — ऊपरी मिट्टी का एक इंच हज़ार वर्ष माँग सकता है।",
          mr: "माती झिजलेला खडक आणि ह्यूमसमधून शतकांत बनते — वरच्या मातीचा एक इंच हजार वर्षे मागू शकतो.",
        },
        detail: {
          en: "Parent rock, climate, organisms and time are the recipe's four cooks — change any one and the soil changes.",
          hi: "मूल चट्टान, जलवायु, जीव और समय — नुस्ख़े के चार रसोइए; एक भी बदलिए तो मिट्टी बदल जाती है।",
          mr: "मूळ खडक, जलवायुमान, जीव आणि काळ — कृतीचे चार स्वयंपाकी; एकही बदला आणि माती बदलते.",
        },
        extra: {
          en: "That price is why erosion is theft, not book-keeping — capital walks away as dust and silt.",
          hi: "यही दाम कारण है कि अपरदन चोरी है, बहीखाता नहीं — पूँजी धूल और गाद बनकर चली जाती है।",
          mr: "हीच किंमत कारण आहे की झीज म्हणजे चोरी, जमाखर्च नाही — भांडवल धूळ आणि गाळ होऊन निघून जाते.",
        },
        pair: {
          left: { en: "Rock and rot mixed", hi: "चूरा और सड़न मिले", mr: "चुरा आणि कुज मिसळलेले" },
          right: {
            en: "an inch per thousand years",
            hi: "हज़ार वर्ष में एक इंच",
            mr: "हजार वर्षांत एक इंच",
          },
        },
      },
      {
        id: "soil-conservation",
        name: { en: "Soil conservation", hi: "मृदा संरक्षण", mr: "मृदा संधारण" },
        kind: "practice",
        prompt: {
          en: "Terracing hillsides, planting shelter rows, bunding field edges — which practice keeps the topsoil from washing and blowing away?",
          hi: "पहाड़ियों पर सीढ़ियाँ, आड़ की पेड़-क़तारें, खेतों की मेड़बंदी — कौन-सा अभ्यास ऊपरी मिट्टी को बहने-उड़ने से रोकता है?",
          mr: "डोंगरउतारांवर पायऱ्या, आडोशाच्या झाड-रांगा, शेतांची बांधबंदिस्ती — कोणती पद्धत वरच्या मातीला वाहून-उडून जाण्यापासून रोखते?",
        },
        statement: {
          en: "Soil conservation holds the ground down — terraces slow the slope's rush, tree rows break the wind, bunds catch the runoff.",
          hi: "मृदा संरक्षण ज़मीन को थामे रखता है — सीढ़ियाँ ढलान की दौड़ धीमी करती हैं, पेड़-क़तारें हवा तोड़ती हैं, मेड़ें बहाव पकड़ती हैं।",
          mr: "मृदा संधारण जमिनीला धरून ठेवते — पायऱ्या उताराची धाव मंदावतात, झाड-रांगा वारा तोडतात, बांध वाहून जाणारे पकडतात.",
        },
        pair: {
          left: { en: "The ground held down", hi: "थामी हुई ज़मीन", mr: "धरून ठेवलेली जमीन" },
          right: {
            en: "terraces, rows and bunds",
            hi: "सीढ़ियाँ, क़तारें और मेड़ें",
            mr: "पायऱ्या, रांगा आणि बांध",
          },
        },
      },
      {
        id: "water-scarcity",
        name: { en: "Water scarcity", hi: "जल की कमी", mr: "पाणीटंचाई" },
        kind: "problem",
        prompt: {
          en: "Taps that run an hour a day, tankers with queues — which shortage bites even though water covers most of the planet?",
          hi: "दिन में घंटा भर चलते नल, क़तारों वाले टैंकर — कौन-सी कमी काटती है जबकि पानी ग्रह के अधिकांश को ढके है?",
          mr: "दिवसातून तासभर चालणारे नळ, रांगांचे टँकर — कोणती टंचाई चावते जरी पाणी ग्रहाचा बहुतांश भाग व्यापते?",
        },
        statement: {
          en: "Water scarcity is a freshwater problem — the seas are vast but salt, and the sweet share is small, uneven and falling.",
          hi: "जल-कमी मीठे पानी की समस्या है — समुद्र विशाल पर खारे हैं, और मीठा हिस्सा छोटा, असमान और घटता हुआ।",
          mr: "पाणीटंचाई ही गोड्या पाण्याची समस्या — समुद्र विशाल पण खारे, आणि गोड वाटा लहान, असमान आणि घटता.",
        },
        detail: {
          en: "Growing cities, thirsty crops and leaking pipes all draw on the same shrinking share.",
          hi: "बढ़ते शहर, प्यासी फ़सलें और रिसते पाइप — सब उसी सिकुड़ते हिस्से से खींचते हैं।",
          mr: "वाढणारी शहरे, तहानलेली पिके आणि गळणारे पाइप — सारे त्याच आकसणाऱ्या वाट्यातून ओढतात.",
        },
        extra: {
          en: "Harvesting rooftop rain refills wells street by street — scarcity fought at house scale.",
          hi: "छत की बारिश सहेजना गली-गली कुएँ भरता है — घर के पैमाने पर लड़ी गई कमी।",
          mr: "छपरावरचा पाऊस साठवणे गल्लोगल्ली विहिरी भरते — घराच्या पातळीवर लढलेली टंचाई.",
        },
        pair: {
          left: { en: "Thirst amid oceans", hi: "महासागरों के बीच प्यास", mr: "महासागरांमधली तहान" },
          right: {
            en: "sweet, small and uneven",
            hi: "मीठा, थोड़ा और असमान",
            mr: "गोड, लहान आणि असमान",
          },
        },
      },
      {
        id: "vegetation-belts",
        name: {
          en: "Natural vegetation belts",
          hi: "प्राकृतिक वनस्पति पेटियाँ",
          mr: "नैसर्गिक वनस्पती पट्टे",
        },
        kind: "pattern",
        prompt: {
          en: "Forests where rain is generous, grasslands where it is thrifty, thorn and scrub where it is stingy — what are these rainfall-drawn bands called?",
          hi: "जहाँ बारिश दिलदार वहाँ वन, जहाँ किफ़ायती वहाँ घासभूमि, जहाँ कंजूस वहाँ काँटे-झाड़ — इन वर्षा-खिंची पट्टियों को क्या कहते हैं?",
          mr: "जिथे पाऊस उदार तिथे वने, जिथे काटकसरी तिथे गवताळ भूमी, जिथे कंजूष तिथे काटे-खुरटे — या पाऊस-रेखित पट्ट्यांना काय म्हणतात?",
        },
        statement: {
          en: "Vegetation follows rainfall — dense forest, open grassland, thorny scrub: each belt is a rain-gauge you can walk through.",
          hi: "वनस्पति वर्षा के पीछे चलती है — घना वन, खुली घासभूमि, कँटीली झाड़ी: हर पेटी एक ऐसा वर्षा-मापी है जिसमें चला जा सकता है।",
          mr: "वनस्पती पावसामागून चालते — दाट वन, मोकळी गवताळ भूमी, काटेरी खुरटे: प्रत्येक पट्टा म्हणजे चालत जाता येणारा पर्जन्यमापक.",
        },
        pair: {
          left: {
            en: "Rainfall drawn in green",
            hi: "हरे में खिंची वर्षा",
            mr: "हिरव्यात रेखलेला पाऊस",
          },
          right: {
            en: "forest, grass and thorn",
            hi: "वन, घास और काँटा",
            mr: "वन, गवत आणि काटा",
          },
        },
      },
      {
        id: "wildlife-protection",
        name: { en: "Wildlife protection", hi: "वन्यजीव संरक्षण", mr: "वन्यजीव संरक्षण" },
        kind: "practice",
        prompt: {
          en: "National parks, sanctuaries, biosphere reserves — which effort fences a living SPACE rather than an animal?",
          hi: "राष्ट्रीय उद्यान, अभयारण्य, जैवमंडल आरक्षित क्षेत्र — कौन-सा प्रयास किसी प्राणी को नहीं, जीवित जगह को घेरता है?",
          mr: "राष्ट्रीय उद्याने, अभयारण्ये, जैवावरण राखीव क्षेत्रे — कोणता प्रयत्न प्राण्याला नव्हे, जिवंत जागेला कुंपण घालतो?",
        },
        statement: {
          en: "Wildlife protection guards habitats — save the forest whole, and the tiger inside saves itself.",
          hi: "वन्यजीव संरक्षण आवास बचाता है — जंगल को समूचा बचाइए, और भीतर का बाघ ख़ुद बच जाता है।",
          mr: "वन्यजीव संरक्षण अधिवास राखते — जंगल अख्खे वाचवा, आणि आतला वाघ स्वतःला वाचवतो.",
        },
        detail: {
          en: "Poaching and habitat loss are the twin threats — and the second is the quieter, larger one.",
          hi: "शिकार और आवास-नाश जुड़वाँ ख़तरे हैं — और दूसरा ज़्यादा ख़ामोश, ज़्यादा बड़ा है।",
          mr: "शिकार आणि अधिवास-नाश हे जुळे धोके — आणि दुसरा अधिक शांत, अधिक मोठा.",
        },
        extra: {
          en: "Migratory birds make conservation international — a wetland drained here starves a flock hatched a continent away.",
          hi: "प्रवासी पक्षी संरक्षण को अंतरराष्ट्रीय बना देते हैं — यहाँ सुखाई गई आर्द्रभूमि महाद्वीप भर दूर जन्मे झुंड को भूखा करती है।",
          mr: "स्थलांतरी पक्षी संरक्षणाला आंतरराष्ट्रीय करतात — इथे आटवलेली पाणथळ खंडभर दूर जन्मलेल्या थव्याला उपाशी ठेवते.",
        },
        pair: {
          left: { en: "The habitat fenced", hi: "घेरा गया आवास", mr: "कुंपणलेला अधिवास" },
          right: {
            en: "the tiger saves itself",
            hi: "बाघ ख़ुद बच जाता है",
            mr: "वाघ स्वतःला वाचवतो",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the guard to the thief it stops: A-hillside terraces, B-shelter-belt tree rows, C-field bunds. Which trio is right?",
          hi: "पहरेदार को उस चोर से मिलाइए जिसे वह रोकता है: अ-पहाड़ी सीढ़ियाँ, ब-आड़ की पेड़-क़तारें, स-खेत की मेड़ें। कौन-सी तिकड़ी सही है?",
          mr: "पहारेकऱ्याला तो थांबवत असलेल्या चोराशी जुळवा: अ-डोंगरी पायऱ्या, ब-आडोशाच्या झाड-रांगा, क-शेताचे बांध. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the slope's rushing water · B: the scouring wind · C: runoff escaping the field",
            hi: "अ: ढलान का दौड़ता पानी · ब: खुरचती हवा · स: खेत से भागता बहाव",
            mr: "अ: उताराचे धावणारे पाणी · ब: खरवडणारा वारा · क: शेतातून निसटणारे वाहून जाणे",
          },
          {
            en: "A: the wind · B: runoff · C: the slope's water",
            hi: "अ: हवा · ब: बहाव · स: ढलान का पानी",
            mr: "अ: वारा · ब: वाहून जाणे · क: उताराचे पाणी",
          },
          {
            en: "A: runoff · B: the slope's water · C: the wind",
            hi: "अ: बहाव · ब: ढलान का पानी · स: हवा",
            mr: "अ: वाहून जाणे · ब: उताराचे पाणी · क: वारा",
          },
          {
            en: "All three guard against the same single thief",
            hi: "तीनों एक ही चोर से पहरा देते हैं",
            mr: "तिघेही एकाच चोरापासून पहारा देतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each guard faces the thief its geometry can catch. Terraces cut a slope into steps so water loses its running start; a tree row stands up exactly where wind sweeps flat, open land; a bund is a low lip that keeps the field's own rain from leaving with the field's own soil. Conservation is matching the wall to the thief.",
          hi: "हर पहरेदार उसी चोर के सामने है जिसे उसकी बनावट पकड़ सकती है। सीढ़ियाँ ढलान को क़दमों में काटती हैं ताकि पानी की दौड़ती बढ़त छिन जाए; पेड़-क़तार ठीक वहाँ खड़ी होती है जहाँ हवा समतल, खुली ज़मीन बुहारती है; मेड़ वह नीची होंठ है जो खेत की अपनी बारिश को खेत की अपनी मिट्टी समेत जाने से रोकती है। संरक्षण चोर से दीवार का मिलान है।",
          mr: "प्रत्येक पहारेकरी त्याच चोरासमोर आहे ज्याला त्याची रचना पकडू शकते. पायऱ्या उताराला टप्प्यांत कापतात म्हणजे पाण्याची धावती आघाडी हिरावली जाते; झाड-रांग नेमकी तिथे उभी राहते जिथे वारा सपाट, मोकळी जमीन झाडतो; बांध हा खालचा ओठ जो शेताच्या स्वतःच्या पावसाला शेताच्या स्वतःच्या मातीसह जाऊ देत नाही. संधारण म्हणजे चोराशी भिंतीची जुळणी.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A farmer shrugs off a washed-away inch of topsoil: 'I lost harvests before; the land recovered.' Why is the lost INCH a different kind of loss from a lost harvest?",
          hi: "एक किसान बह गए इंच भर ऊपरी मिट्टी को झटक देता है: 'फ़सलें पहले भी गईं; ज़मीन सँभल गई।' गया हुआ इंच गई हुई फ़सल से अलग क़िस्म का नुक़सान क्यों है?",
          mr: "एक शेतकरी वाहून गेलेल्या इंचभर वरच्या मातीला झटकतो: 'पिके आधीही गेली; जमीन सावरली.' गेलेला इंच गेलेल्या पिकाहून वेगळ्या जातीचे नुकसान का?",
        },
        choices: [
          {
            en: "A harvest is interest, regrown next season; the inch is capital that took a thousand years to form — spending it converts a renewable income into an exhausted stock",
            hi: "फ़सल ब्याज है, अगले मौसम फिर उगती है; इंच वह पूँजी है जिसे बनने में हज़ार वर्ष लगे — उसे ख़र्चना नवीकरणीय आय को चुके हुए भंडार में बदल देना है",
            mr: "पीक म्हणजे व्याज, पुढच्या हंगामात पुन्हा उगवते; इंच म्हणजे बनायला हजार वर्षे लागलेले भांडवल — ते खर्चणे म्हणजे नवीकरणीय उत्पन्नाचे संपलेल्या साठ्यात रूपांतर",
          },
          {
            en: "There is no difference — soil and harvest both return alike",
            hi: "कोई फ़र्क़ नहीं — मिट्टी और फ़सल दोनों एक-सी लौटती हैं",
            mr: "फरक नाही — माती आणि पीक दोन्ही सारखीच परततात",
          },
          {
            en: "The inch matters only because it looks untidy",
            hi: "इंच केवल इसलिए मायने रखता है कि वह भद्दा दिखता है",
            mr: "इंच फक्त म्हणून महत्त्वाचा की तो बेढब दिसतो",
          },
          {
            en: "Fertiliser can rebuild topsoil in a single season",
            hi: "उर्वरक एक ही मौसम में ऊपरी मिट्टी फिर बना सकता है",
            mr: "खत एकाच हंगामात वरची माती पुन्हा बांधू शकते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The farm keeps two very different accounts. The harvest account refills every season from sun and rain — a bad year is bridged by the next. The soil account was deposited by a millennium of weathering and rot, and no season repays it; fertiliser feeds a crop but cannot manufacture the living, structured inch itself. Erosion therefore quietly changes the farm's category — from an enterprise living on income to one eating its endowment. That is why the shrug is the most expensive gesture in agriculture.",
          hi: "खेत दो बिलकुल अलग खाते रखता है। फ़सल-खाता हर मौसम धूप-बारिश से भरता है — बुरा साल अगला पाट देता है। मिट्टी-खाता सहस्राब्दी के अपक्षय और सड़न ने जमा किया था, और कोई मौसम उसे नहीं लौटाता; उर्वरक फ़सल को खिलाता है पर वह जीवित, बुनी हुई इंच स्वयं नहीं गढ़ सकता। अपरदन इसीलिए चुपचाप खेत की श्रेणी बदल देता है — आय पर जीते उद्यम से अपनी जमापूँजी खाते उद्यम में। इसीलिए वह झटकना खेती की सबसे महँगी अदा है।",
          mr: "शेत दोन अगदी वेगळी खाती ठेवते. पीक-खाते दर हंगामाला ऊन-पावसाने भरते — वाईट वर्ष पुढचे सांधते. माती-खाते सहस्रकाच्या झिजेने आणि कुजण्याने भरले होते, आणि कोणताही हंगाम ते फेडत नाही; खत पिकाला पोसते पण ती जिवंत, विणलेली इंच स्वतः घडवू शकत नाही. झीज म्हणून गुपचूप शेताची जात बदलते — उत्पन्नावर जगणाऱ्या उद्यमातून आपली ठेव खाणाऱ्या उद्यमात. म्हणूनच ते झटकणे ही शेतीतली सर्वांत महाग अदा.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Mineral and Power Resources                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-8-mineral-power",
    subject: "GEOGRAPHY",
    classLevel: 8,
    chapter: {
      en: "Chapter 3 — Mineral and Power Resources",
      hi: "अध्याय 3 — खनिज और शक्ति संसाधन",
      mr: "प्रकरण 3 — खनिज आणि ऊर्जा संसाधने",
    },
    name: {
      en: "Mineral and Power Resources",
      hi: "खनिज और शक्ति संसाधन",
      mr: "खनिज आणि ऊर्जा संसाधने",
    },
    summary: {
      en: "Rock worth digging and current worth making: ores that must pay for their mining, steam and falling water spinning the same magnet, panels and mills harvesting flows — and scrap serving as the second mine.",
      hi: "खोदने लायक़ चट्टान और बनाने लायक़ धारा: अयस्क जो अपनी खुदाई का दाम चुकाएँ, एक ही चुंबक घुमाते भाप और गिरता पानी, प्रवाह सहेजते पैनल-पवनचक्कियाँ — और दूसरी खदान बना कबाड़।",
      mr: "खणण्याजोगा खडक आणि बनवण्याजोगी धारा: आपल्या खाणकामाची किंमत देणारी धातुके, एकच चुंबक फिरवणारी वाफ आणि पडणारे पाणी, प्रवाह वेचणारी पॅनेले-पवनचक्क्या — आणि दुसरी खाण झालेले भंगार.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "ores",
        name: { en: "Ores", hi: "अयस्क", mr: "धातुके" },
        kind: "mineral",
        prompt: {
          en: "Which rocks hold enough metal to be worth mining — iron's haematite, aluminium's bauxite?",
          hi: "किन चट्टानों में इतनी धातु है कि खोदना सधे — लोहे का हेमेटाइट, अल्युमिनियम का बॉक्साइट?",
          mr: "कोणत्या खडकांत इतका धातू आहे की खणणे परवडेल — लोखंडाचे हेमॅटाइट, अ‍ॅल्युमिनियमचे बॉक्साइट?",
        },
        statement: {
          en: "An ore is a mineral worth mining — the metal's share must pay for the digging, or the rock stays rock.",
          hi: "अयस्क खोदने लायक़ खनिज है — धातु के हिस्से को खुदाई का दाम चुकाना होगा, वरना चट्टान चट्टान ही रहती है।",
          mr: "धातुक म्हणजे खणण्याजोगे खनिज — धातूच्या वाट्याने खाणकामाची किंमत दिली पाहिजे, नाहीतर खडक खडकच राहतो.",
        },
        pair: {
          left: { en: "Rock worth digging", hi: "खोदने लायक़ चट्टान", mr: "खणण्याजोगा खडक" },
          right: {
            en: "metal paying the bill",
            hi: "बिल चुकाती धातु",
            mr: "बिल देणारा धातू",
          },
        },
      },
      {
        id: "iron-ore",
        name: { en: "Iron ore", hi: "लौह अयस्क", mr: "लोह धातुक" },
        kind: "mineral",
        prompt: {
          en: "Which mineral feeds every steel plant — the raw form of the metal that frames the modern world?",
          hi: "कौन-सा खनिज हर इस्पात-संयंत्र को खिलाता है — उस धातु का कच्चा रूप जो आधुनिक दुनिया का ढाँचा है?",
          mr: "कोणते खनिज प्रत्येक पोलाद-प्रकल्पाला पोसते — आधुनिक जगाचा सांगाडा असलेल्या धातूचे कच्चे रूप?",
        },
        statement: {
          en: "Iron ore is steel's beginning — mined, smelted with coke, and poured into rails, beams and machines.",
          hi: "लौह अयस्क इस्पात की शुरुआत है — खोदा गया, कोक संग गलाया गया, और पटरियों, धरनों और मशीनों में ढाला गया।",
          mr: "लोह धातुक ही पोलादाची सुरुवात — खणलेले, कोकसह वितळवलेले, आणि रूळ, तुळया आणि यंत्रांत ओतलेले.",
        },
        pair: {
          left: { en: "Steel's beginning", hi: "इस्पात की शुरुआत", mr: "पोलादाची सुरुवात" },
          right: { en: "smelted with coke", hi: "कोक संग गलाया", mr: "कोकसह वितळवलेले" },
        },
      },
      {
        id: "thermal",
        name: { en: "Thermal power", hi: "ताप विद्युत", mr: "औष्णिक वीज" },
        kind: "power",
        prompt: {
          en: "Which electricity comes from boiling water with coal's heat, the steam spinning turbines?",
          hi: "कौन-सी बिजली कोयले की आँच से पानी उबालकर बनती है, भाप से घूमते टरबाइन?",
          mr: "कोणती वीज कोळशाच्या आचेने पाणी उकळून बनते, वाफेने फिरणारी टर्बाइने?",
        },
        statement: {
          en: "Thermal power burns fuel to boil water — steam spins the turbine, the turbine spins the magnet, the wire carries the result.",
          hi: "ताप विद्युत ईंधन जलाकर पानी उबालती है — भाप टरबाइन घुमाती है, टरबाइन चुंबक, और तार नतीजा ढोता है।",
          mr: "औष्णिक वीज इंधन जाळून पाणी उकळते — वाफ टर्बाइन फिरवते, टर्बाइन चुंबक, आणि तार निकाल वाहते.",
        },
        detail: {
          en: "Its smoke-stack is the price tag — carbon and ash billed to the whole sky.",
          hi: "उसकी चिमनी ही दाम-पर्ची है — कार्बन और राख का बिल पूरे आसमान के नाम।",
          mr: "तिची धुराडी हीच किंमत-चिठ्ठी — कार्बन आणि राखेचे बिल अख्ख्या आकाशाच्या नावे.",
        },
        extra: {
          en: "It sits near coalfields to save hauling — power stations follow their fuel.",
          hi: "ढुलाई बचाने को वह कोयला-क्षेत्रों के पास बैठती है — बिजलीघर अपने ईंधन के पीछे चलते हैं।",
          mr: "वाहतूक वाचवायला ती कोळसा-क्षेत्रांजवळ बसते — वीजकेंद्रे आपल्या इंधनामागून जातात.",
        },
        pair: {
          left: { en: "Steam-spun electricity", hi: "भाप से कती बिजली", mr: "वाफेने फिरवलेली वीज" },
          right: { en: "coal boiled to current", hi: "धारा बना उबला कोयला", mr: "धारा झालेला उकळलेला कोळसा" },
        },
      },
      {
        id: "hydel",
        name: { en: "Hydroelectric power", hi: "जल विद्युत", mr: "जलविद्युत" },
        kind: "power",
        prompt: {
          en: "Which electricity is made by falling water spinning turbines at the foot of a dam?",
          hi: "कौन-सी बिजली बाँध के तल पर गिरते पानी के टरबाइन घुमाने से बनती है?",
          mr: "कोणती वीज धरणाच्या पायथ्याशी पडणाऱ्या पाण्याने टर्बाइने फिरवून बनते?",
        },
        statement: {
          en: "Hydel power is gravity harvested — stored river height cashed as spinning current, with no smoke in the bargain.",
          hi: "जल विद्युत सहेजा गया गुरुत्व है — जमा नदी-ऊँचाई घूमती धारा में भुनाई गई, सौदे में धुआँ नहीं।",
          mr: "जलविद्युत म्हणजे वेचलेले गुरुत्व — साठवलेली नदी-उंची फिरत्या धारेत वटवलेली, सौद्यात धूर नाही.",
        },
        detail: {
          en: "Its cost stands upstream — submerged valleys, displaced villages, and silt held back from the delta below.",
          hi: "उसका दाम ऊपर की धारा में खड़ा है — डूबी घाटियाँ, उजड़े गाँव, और नीचे के डेल्टा से रोकी गई गाद।",
          mr: "तिची किंमत वरच्या प्रवाहात उभी — बुडालेली खोरी, विस्थापित गावे, आणि खालच्या त्रिभुजापासून अडवलेला गाळ.",
        },
        extra: {
          en: "Once built, its fuel is the monsoon itself — delivered free, cancelled in drought.",
          hi: "बन जाने पर उसका ईंधन स्वयं मानसून है — मुफ़्त पहुँचाया गया, सूखे में रद्द।",
          mr: "बांधल्यावर तिचे इंधन खुद्द मान्सून — फुकट पोहोचवलेले, दुष्काळात रद्द.",
        },
        pair: {
          left: { en: "Falling water's spin", hi: "गिरते पानी की घुमाई", mr: "पडत्या पाण्याची फिरकी" },
          right: {
            en: "height cashed as current",
            hi: "धारा में भुनाई ऊँचाई",
            mr: "धारेत वटवलेली उंची",
          },
        },
      },
      {
        id: "solar-wind",
        name: { en: "Solar and wind power", hi: "सौर और पवन ऊर्जा", mr: "सौर आणि पवन ऊर्जा" },
        kind: "power",
        prompt: {
          en: "Panels on rooftops, mills on windy ridges — which renewable pair turns sunshine and moving air into current?",
          hi: "छतों पर पैनल, हवादार मुंडेरों पर चक्कियाँ — कौन-सी नवीकरणीय जोड़ी धूप और चलती हवा को धारा बनाती है?",
          mr: "छपरांवर पॅनेले, वाऱ्याच्या कण्यांवर चक्क्या — कोणती नवीकरणीय जोडी ऊन आणि वाहत्या हवेची धारा करते?",
        },
        statement: {
          en: "Solar and wind power harvest flows, not stocks — no fuel bill ever, but sunset and calm are their strikes.",
          hi: "सौर और पवन ऊर्जा प्रवाह सहेजती हैं, भंडार नहीं — ईंधन का बिल कभी नहीं, पर सूर्यास्त और शांति उनकी हड़तालें हैं।",
          mr: "सौर आणि पवन ऊर्जा प्रवाह वेचतात, साठे नाहीत — इंधनाचे बिल कधीच नाही, पण सूर्यास्त आणि शांतता या त्यांच्या संपा.",
        },
        pair: {
          left: { en: "Panels and mills", hi: "पैनल और चक्कियाँ", mr: "पॅनेले आणि चक्क्या" },
          right: {
            en: "flows harvested, not stocks",
            hi: "सहेजे प्रवाह, भंडार नहीं",
            mr: "वेचलेले प्रवाह, साठे नाहीत",
          },
        },
      },
      {
        id: "mineral-conservation",
        name: { en: "Mineral conservation", hi: "खनिज संरक्षण", mr: "खनिज संधारण" },
        kind: "practice",
        prompt: {
          en: "Recycling scrap, substituting materials, mining with less waste — which practice stretches ore bodies that never regrow?",
          hi: "कबाड़ का पुनर्चक्रण, विकल्प पदार्थ, कम बर्बादी की खुदाई — कौन-सा अभ्यास उन अयस्कों को खींचता है जो फिर कभी नहीं उगते?",
          mr: "भंगाराचे पुनर्चक्रण, पर्यायी पदार्थ, कमी नासाडीचे खाणकाम — कोणती पद्धत पुन्हा कधीही न वाढणारी धातुके ताणते?",
        },
        statement: {
          en: "Mineral conservation stretches the unrenewable — recycled metal is ore that never needed a mine.",
          hi: "खनिज संरक्षण असमाप्य को खींचता है — पुनर्चक्रित धातु वह अयस्क है जिसे खदान की ज़रूरत ही नहीं पड़ी।",
          mr: "खनिज संधारण न भरणाऱ्याला ताणते — पुनर्चक्रित धातू म्हणजे खाणीची गरजच न पडलेले धातुक.",
        },
        pair: {
          left: {
            en: "The stretched ore body",
            hi: "खींचा गया अयस्क-भंडार",
            mr: "ताणलेला धातुक-साठा",
          },
          right: {
            en: "scrap as a second mine",
            hi: "दूसरी खदान बना कबाड़",
            mr: "दुसरी खाण झालेले भंगार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Every power source carries a price besides money. Match: A-thermal, B-hydel, C-solar. Which trio of prices is right?",
          hi: "हर शक्ति-स्रोत पैसे के अलावा एक दाम ढोता है। मिलाइए: अ-ताप, ब-जल, स-सौर। दामों की कौन-सी तिकड़ी सही है?",
          mr: "प्रत्येक ऊर्जा-स्रोत पैशाशिवाय एक किंमत वाहतो. जुळवा: अ-औष्णिक, ब-जल, क-सौर. किमतींची कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: smoke billed to the sky · B: valleys submerged upstream · C: output stopping at sunset",
            hi: "अ: आसमान के नाम धुआँ · ब: ऊपर डूबी घाटियाँ · स: सूर्यास्त पर थमता उत्पादन",
            mr: "अ: आकाशाच्या नावे धूर · ब: वर बुडालेली खोरी · क: सूर्यास्ताला थांबणारे उत्पादन",
          },
          {
            en: "A: sunset stops it · B: smoke · C: submerged valleys",
            hi: "अ: सूर्यास्त रोकता है · ब: धुआँ · स: डूबी घाटियाँ",
            mr: "अ: सूर्यास्त थांबवतो · ब: धूर · क: बुडालेली खोरी",
          },
          {
            en: "A: submerged valleys · B: sunset · C: smoke",
            hi: "अ: डूबी घाटियाँ · ब: सूर्यास्त · स: धुआँ",
            mr: "अ: बुडालेली खोरी · ब: सूर्यास्त · क: धूर",
          },
          {
            en: "None of the three carries any cost beyond money",
            hi: "तीनों में से कोई पैसे से आगे दाम नहीं ढोता",
            mr: "तिघांतले कोणीही पैशापलीकडे किंमत वाहत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The bill follows the mechanism. Burning writes its cost in the air; damming writes it on the drowned land behind the wall; the sun's panel simply clocks off with its star. Choosing a power mix is choosing which price, paid by whom, at what hour — engineering's question wearing an ethical coat.",
          hi: "बिल तंत्र के पीछे चलता है। जलाना अपना दाम हवा में लिखता है; बाँधना दीवार के पीछे डूबी ज़मीन पर; सूर्य का पैनल बस अपने तारे के साथ छुट्टी कर लेता है। ऊर्जा-मिश्रण चुनना यह चुनना है कि कौन-सा दाम, किसके ज़िम्मे, किस घड़ी — नैतिक कोट पहने अभियांत्रिकी का सवाल।",
          mr: "बिल यंत्रणेमागून चालते. जाळणे आपली किंमत हवेत लिहिते; धरण बांधणे भिंतीमागच्या बुडालेल्या जमिनीवर; सूर्याचे पॅनेल नुसते आपल्या ताऱ्यासोबत सुट्टी घेते. ऊर्जा-मिश्रण निवडणे म्हणजे कोणती किंमत, कोणाच्या माथी, कोणत्या घटकेला हे निवडणे — नैतिक कोट घातलेला अभियांत्रिकीचा प्रश्न.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Melting a recycled aluminium can uses a small fraction of the energy that smelting new metal from bauxite does. Why does the recycled can arrive so much 'cheaper' in energy?",
          hi: "पुनर्चक्रित अल्युमिनियम डिब्बा गलाने में उस ऊर्जा का छोटा अंश लगता है जो बॉक्साइट से नई धातु गलाने में लगती है। पुनर्चक्रित डिब्बा ऊर्जा में इतना 'सस्ता' क्यों पड़ता है?",
          mr: "पुनर्चक्रित अ‍ॅल्युमिनियम डबा वितळवायला त्या ऊर्जेचा लहान अंश लागतो जी बॉक्साइटमधून नवा धातू वितळवायला लागते. पुनर्चक्रित डबा ऊर्जेत इतका 'स्वस्त' का पडतो?",
        },
        choices: [
          {
            en: "The hardest work — tearing the metal's atoms free of their oxide ore — was already done once; remelting only softens finished metal, so recycling banks the ore-chemistry of the first extraction for ever",
            hi: "सबसे कठिन काम — धातु के परमाणुओं को ऑक्साइड अयस्क से छुड़ाना — एक बार हो चुका; दोबारा गलाना बनी-बनाई धातु को केवल नरम करता है, अतः पुनर्चक्रण पहली निकासी की अयस्क-रसायनशाला सदा के लिए जमा रखता है",
            mr: "सर्वांत कठीण काम — धातूचे अणू ऑक्साइड धातुकातून सोडवणे — एकदा झालेले आहे; पुन्हा वितळवणे तयार धातूला फक्त मऊ करते, म्हणून पुनर्चक्रण पहिल्या काढणीचे धातुक-रसायन कायमचे जमा ठेवते",
          },
          {
            en: "Old cans burn as fuel while melting themselves",
            hi: "पुराने डिब्बे गलते-गलते ख़ुद ईंधन बन जलते हैं",
            mr: "जुने डबे वितळताना स्वतः इंधन होऊन जळतात",
          },
          {
            en: "Recycled metal is a weaker, lesser aluminium",
            hi: "पुनर्चक्रित धातु कमज़ोर, घटिया अल्युमिनियम है",
            mr: "पुनर्चक्रित धातू दुबळा, हलका अ‍ॅल्युमिनियम असतो",
          },
          {
            en: "Bauxite mines are simply far from cities",
            hi: "बॉक्साइट खदानें बस शहरों से दूर हैं",
            mr: "बॉक्साइट खाणी नुसत्या शहरांपासून दूर आहेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Aluminium clings to oxygen with ferocious stubbornness; prising it loose from bauxite demands furnaces and rivers of electricity. That chemistry, once paid for, is stored IN the metal itself — the can on the shelf is congealed energy. Remelting merely reshapes it. So every recycled can is a mine that need not be dug and a power station that need not burn: conservation not as sacrifice, but as refusing to pay the same enormous bill twice.",
          hi: "अल्युमिनियम ऑक्सीजन से ज़बरदस्त ज़िद से चिपका है; उसे बॉक्साइट से छुड़ाने को भट्ठियाँ और बिजली की नदियाँ चाहिए। वह रसायन, एक बार चुकाया गया, धातु में ही जमा है — ताक़ पर रखा डिब्बा जमी हुई ऊर्जा है। दोबारा गलाना उसे केवल नया आकार देता है। अतः हर पुनर्चक्रित डिब्बा वह खदान है जो खोदनी नहीं पड़ी और वह बिजलीघर जो जलाना नहीं पड़ा: संरक्षण त्याग नहीं, एक ही विराट बिल दो बार चुकाने से इनकार है।",
          mr: "अ‍ॅल्युमिनियम ऑक्सिजनला जबर हट्टाने चिकटलेला; त्याला बॉक्साइटमधून सोडवायला भट्ट्या आणि विजेच्या नद्या लागतात. ते रसायन, एकदा भरलेले, धातूतच साठलेले आहे — फडताळावरचा डबा म्हणजे गोठलेली ऊर्जा. पुन्हा वितळवणे त्याला फक्त नवा आकार देते. म्हणून प्रत्येक पुनर्चक्रित डबा म्हणजे खणावी न लागलेली खाण आणि जाळावे न लागलेले वीजकेंद्र: संधारण म्हणजे त्याग नव्हे, एकच प्रचंड बिल दोनदा भरायला नकार.",
        },
      },
    ],
  },
];
