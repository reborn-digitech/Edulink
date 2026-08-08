/**
 * Class 9 Economics — NCERT "Economics" (Understanding Economic Development I),
 * chapter by chapter, through the conceptual engine. The economy read from the
 * ground up: a single village's fields and workshops as a model of production,
 * people turned from mouths into makers, poverty measured and explained, and
 * the long fight to keep everyone fed.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Economics (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

export const G9_ECONOMICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The Story of Village Palampur                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-9-village-palampur",
    subject: "ECONOMICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 1 — The Story of Village Palampur",
      hi: "अध्याय 1 — पालमपुर गाँव की कहानी",
      mr: "प्रकरण 1 — पालमपूर गावाची गोष्ट",
    },
    name: {
      en: "The Story of Village Palampur",
      hi: "पालमपुर गाँव की कहानी",
      mr: "पालमपूर गावाची गोष्ट",
    },
    summary: {
      en: "A make-believe village used to learn how anything is produced: the four things every production needs, land that cannot grow yet yields more through irrigation and better seed, capital that is used up and capital that lasts, and the non-farm work a village must build because its fields cannot expand.",
      hi: "किसी भी उत्पादन का तरीक़ा सीखने को एक काल्पनिक गाँव: हर उत्पादन को चाहिए चार चीज़ें, भूमि जो बढ़ नहीं सकती फिर भी सिंचाई और बेहतर बीज से अधिक उपजाती, पूँजी जो खप जाती और पूँजी जो टिकती, और वह ग़ैर-कृषि काम जो गाँव को बनाना होता क्योंकि उसके खेत नहीं फैल सकते।",
      mr: "कोणतेही उत्पादन कसे होते हे शिकायला एक काल्पनिक गाव: प्रत्येक उत्पादनाला हव्या चार गोष्टी, जमीन जी वाढू शकत नाही तरी सिंचन आणि उत्तम बियाने अधिक पिकवते, भांडवल जे संपते आणि भांडवल जे टिकते, आणि ते बिगर-शेती काम जे गावाला बांधावे लागते कारण त्याची शेते वाढू शकत नाहीत.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "factors-of-production",
        name: {
          en: "The factors of production",
          hi: "उत्पादन के कारक",
          mr: "उत्पादनाचे घटक",
        },
        kind: "idea",
        prompt: {
          en: "To produce anything — a crop, a cloth, a meal — four things must always come together: a place, workers, tools and money, and know-how. What are these four requirements called?",
          hi: "कुछ भी उत्पादित करने को — फ़सल, कपड़ा, भोजन — चार चीज़ें सदा साथ आनी चाहिए: एक जगह, कामगार, औज़ार-पैसा, और जानकारी। इन चार आवश्यकताओं को क्या कहते?",
          mr: "काहीही उत्पादित करायला — पीक, कापड, जेवण — चार गोष्टी सदैव एकत्र याव्या लागतात: एक जागा, कामगार, अवजारे-पैसा, आणि माहिती. या चार आवश्यकतांना काय म्हणतात?",
        },
        statement: {
          en: "The factors of production are the four requirements of any production — land (and natural resources), labour, physical capital (tools and money), and human capital (the knowledge and skill to organise the rest).",
          hi: "उत्पादन के कारक किसी भी उत्पादन की चार आवश्यकताएँ — भूमि (और प्राकृतिक संसाधन), श्रम, भौतिक पूँजी (औज़ार-पैसा), और मानव पूँजी (बाक़ी को संगठित करने का ज्ञान-कौशल)।",
          mr: "उत्पादनाचे घटक कोणत्याही उत्पादनाच्या चार आवश्यकता — जमीन (आणि नैसर्गिक संसाधने), श्रम, भौतिक भांडवल (अवजारे-पैसा), आणि मानवी भांडवल (बाकीचे संघटित करण्याचे ज्ञान-कौशल्य).",
        },
        detail: {
          en: "Take away any one and production stops — the best land and tools are useless with no one to work them, and workers can do nothing with no land or capital.",
          hi: "किसी एक को हटाओ और उत्पादन रुकता — सर्वोत्तम भूमि-औज़ार बेकार बिना किसी के जो उन्हें चलाए, और कामगार कुछ नहीं कर सकते बिना भूमि या पूँजी।",
          mr: "कोणताही एक काढा आणि उत्पादन थांबते — उत्तम जमीन-अवजारे निरुपयोगी कोणी नसताना जे ती चालवेल, आणि कामगार काही करू शकत नाहीत जमीन वा भांडवलाविना.",
        },
        extra: {
          en: "The fourth factor, human capital, is what brings the other three together and puts them to work — the knowledge to farm well or run a workshop.",
          hi: "चौथा कारक, मानव पूँजी, वही जो बाक़ी तीन को साथ लाता और काम पर लगाता — अच्छी खेती या कारख़ाना चलाने का ज्ञान।",
          mr: "चौथा घटक, मानवी भांडवल, तेच जे बाकी तीन एकत्र आणते आणि कामाला लावते — चांगली शेती वा कारखाना चालवण्याचे ज्ञान.",
        },
        pair: {
          left: {
            en: "Land, labour, physical and human capital",
            hi: "भूमि, श्रम, भौतिक और मानव पूँजी",
            mr: "जमीन, श्रम, भौतिक आणि मानवी भांडवल",
          },
          right: {
            en: "the factors of production",
            hi: "उत्पादन के कारक",
            mr: "उत्पादनाचे घटक",
          },
        },
      },
      {
        id: "land-is-fixed",
        name: {
          en: "Land as a fixed factor",
          hi: "स्थिर कारक भूमि",
          mr: "स्थिर घटक जमीन",
        },
        kind: "idea",
        prompt: {
          en: "A village cannot make more land, so once all of it is farmed, the only way to grow more food is to make the same fields yield more. What quality of land does this describe?",
          hi: "गाँव अधिक भूमि नहीं बना सकता, अतः जब सारी जुत जाए, अधिक अन्न उगाने का एकमात्र रास्ता उन्हीं खेतों से अधिक उपजाना। भूमि का कौन-सा गुण यह बताता?",
          mr: "गाव अधिक जमीन बनवू शकत नाही, म्हणून जेव्हा सारी नांगरली जाते, अधिक अन्न पिकवण्याचा एकमेव मार्ग त्याच शेतांतून अधिक पिकवणे. जमिनीचा कोणता गुण हे सांगते?",
        },
        statement: {
          en: "Land is a fixed factor of production — its area cannot be increased, so once all the land is under cultivation, more food can come only from raising the yield of the same land, not from adding new land.",
          hi: "भूमि उत्पादन का स्थिर कारक — इसका क्षेत्रफल बढ़ाया नहीं जा सकता, अतः जब सारी भूमि जुताई में, अधिक अन्न केवल उसी भूमि की उपज बढ़ाने से आ सकता, नई भूमि जोड़ने से नहीं।",
          mr: "जमीन उत्पादनाचा स्थिर घटक — तिचे क्षेत्रफळ वाढवता येत नाही, म्हणून जेव्हा सारी जमीन लागवडीखाली, अधिक अन्न फक्त त्याच जमिनीची उत्पादकता वाढवून येऊ शकते, नवी जमीन जोडून नाही.",
        },
        detail: {
          en: "Palampur's farmers raised more grain from the same land in two ways — growing more than one crop a year, and switching to higher-yielding methods.",
          hi: "पालमपुर के किसानों ने उसी भूमि से अधिक अन्न दो तरह उठाया — वर्ष में एक से अधिक फ़सल उगाकर, और अधिक-उपज विधियों पर जाकर।",
          mr: "पालमपूरच्या शेतकऱ्यांनी त्याच जमिनीतून अधिक धान्य दोन प्रकारे काढले — वर्षात एकाहून अधिक पीक घेऊन, आणि अधिक-उत्पादन पद्धतींवर जाऊन.",
        },
        extra: {
          en: "Growing two or three crops on the same field in one year is called multiple cropping — the commonest way to squeeze more from fixed land.",
          hi: "एक ही खेत पर एक वर्ष में दो-तीन फ़सलें उगाना बहु-फ़सल कहलाता — स्थिर भूमि से अधिक निचोड़ने का सबसे आम तरीक़ा।",
          mr: "एकाच शेतावर एका वर्षात दोन-तीन पिके घेणे बहुपीक म्हणतात — स्थिर जमिनीतून अधिक पिळण्याचा सर्वांत सामान्य मार्ग.",
        },
        pair: {
          left: {
            en: "Cannot be expanded; must yield more instead",
            hi: "फैलाई नहीं जा सकती; बजाय अधिक उपजाए",
            mr: "वाढवता येत नाही; त्याऐवजी अधिक पिकवावी",
          },
          right: {
            en: "land as a fixed factor",
            hi: "स्थिर कारक भूमि",
            mr: "स्थिर घटक जमीन",
          },
        },
      },
      {
        id: "green-revolution",
        name: {
          en: "The Green Revolution methods",
          hi: "हरित क्रांति की विधियाँ",
          mr: "हरित क्रांतीच्या पद्धती",
        },
        kind: "idea",
        prompt: {
          en: "Palampur's leap in farm output came from tubewell irrigation, high-yielding seeds and chemical fertilisers, which together multiplied the grain from each hectare. What is this package of methods called?",
          hi: "पालमपुर की कृषि-उपज में छलाँग नलकूप सिंचाई, अधिक-उपज बीज और रासायनिक उर्वरकों से आई, जिन्होंने मिलकर हर हेक्टेयर से अन्न कई गुना किया। इस विधि-पुलिंदे को क्या कहते?",
          mr: "पालमपूरची शेती-उत्पादनातील झेप नळकूप सिंचन, अधिक-उत्पादन बियाणे आणि रासायनिक खतांतून आली, ज्यांनी मिळून प्रत्येक हेक्टरमधून धान्य अनेक पट केले. या पद्धती-जुडग्याला काय म्हणतात?",
        },
        statement: {
          en: "The Green Revolution methods — irrigation from tubewells, high-yielding variety (HYV) seeds and chemical fertilisers — greatly raised the grain harvested from each hectare of the same land.",
          hi: "हरित क्रांति की विधियाँ — नलकूपों से सिंचाई, अधिक-उपज किस्म (HYV) बीज और रासायनिक उर्वरक — ने उसी भूमि के हर हेक्टेयर से काटा अन्न बहुत बढ़ाया।",
          mr: "हरित क्रांतीच्या पद्धती — नळकूपांतून सिंचन, अधिक-उत्पादन जात (HYV) बियाणे आणि रासायनिक खते — यांनी त्याच जमिनीच्या प्रत्येक हेक्टरमधून कापलेले धान्य खूप वाढवले.",
        },
        detail: {
          en: "Assured irrigation was the key that made HYV seeds worthwhile, since those thirsty new seeds need plenty of water and fertiliser to give their high yields.",
          hi: "सुनिश्चित सिंचाई वह कुंजी जिसने HYV बीजों को सार्थक बनाया, क्योंकि वे प्यासे नए बीज अपनी अधिक उपज देने को भरपूर पानी-उर्वरक माँगते।",
          mr: "खात्रीशीर सिंचन ती किल्ली जिने HYV बियाणे सार्थक केले, कारण ती तहानलेली नवी बियाणे आपली अधिक उत्पादन द्यायला भरपूर पाणी-खत मागतात.",
        },
        extra: {
          en: "But the same methods have a cost — heavy use of chemical fertiliser and groundwater has, over time, tired the soil and lowered the water table.",
          hi: "पर उन्हीं विधियों की एक क़ीमत — रासायनिक उर्वरक और भूजल के भारी प्रयोग ने, समय के साथ, मिट्टी थकाई और जल-स्तर गिराया।",
          mr: "पण त्याच पद्धतींची एक किंमत — रासायनिक खत आणि भूजलाच्या भारी वापराने, काळानुसार, माती थकवली आणि पाणी-पातळी घसरवली.",
        },
        pair: {
          left: {
            en: "Irrigation, HYV seeds and fertiliser lifting yield",
            hi: "सिंचाई, HYV बीज और उर्वरक उपज उठाते",
            mr: "सिंचन, HYV बियाणे आणि खत उत्पादन उंचावत",
          },
          right: {
            en: "the Green Revolution methods",
            hi: "हरित क्रांति की विधियाँ",
            mr: "हरित क्रांतीच्या पद्धती",
          },
        },
      },
      {
        id: "fixed-working-capital",
        name: {
          en: "Fixed and working capital",
          hi: "स्थिर और कार्यशील पूँजी",
          mr: "स्थिर आणि खेळते भांडवल",
        },
        kind: "idea",
        prompt: {
          en: "A farmer's tractor and tools last for years of use, while his seeds, fertiliser and the cash for wages are used up in a single season. What two kinds of capital does this distinguish?",
          hi: "किसान का ट्रैक्टर और औज़ार वर्षों प्रयोग टिकते, जबकि उसके बीज, उर्वरक और मज़दूरी का नक़द एक ही मौसम में खप जाते। यह पूँजी के कौन-से दो प्रकार अलग करता?",
          mr: "शेतकऱ्याचा ट्रॅक्टर आणि अवजारे वर्षे वापर टिकतात, तर त्याचे बियाणे, खत आणि मजुरीची रोकड एकाच हंगामात संपते. हे भांडवलाचे कोणते दोन प्रकार वेगळे करते?",
        },
        statement: {
          en: "Fixed capital is tools, machines and buildings that last for many years of production, while working capital is the raw materials and money used up within a single cycle of production, like seeds and wages.",
          hi: "स्थिर पूँजी औज़ार, मशीनें और इमारतें जो उत्पादन के कई वर्ष टिकतीं, जबकि कार्यशील पूँजी कच्चा माल और पैसा जो उत्पादन के एक ही चक्र में खप जाता, जैसे बीज और मज़दूरी।",
          mr: "स्थिर भांडवल अवजारे, यंत्रे आणि इमारती जी उत्पादनाची अनेक वर्षे टिकतात, तर खेळते भांडवल कच्चा माल आणि पैसा जो उत्पादनाच्या एकाच चक्रात संपतो, जसे बियाणे आणि मजुरी.",
        },
        detail: {
          en: "A tractor is fixed capital — it ploughs many seasons; the diesel that runs it and the seed it sows are working capital, gone after one crop.",
          hi: "ट्रैक्टर स्थिर पूँजी — यह कई मौसम जोतता; उसे चलाता डीज़ल और वह बोता बीज कार्यशील पूँजी, एक फ़सल बाद ख़त्म।",
          mr: "ट्रॅक्टर स्थिर भांडवल — तो अनेक हंगाम नांगरतो; त्याला चालवणारे डिझेल आणि तो पेरणारे बियाणे खेळते भांडवल, एका पिकानंतर संपलेले.",
        },
        extra: {
          en: "Money is treated as capital because it can be used to buy the seeds, tools and labour that production actually needs.",
          hi: "पैसा पूँजी माना जाता क्योंकि इसे उन बीज, औज़ार और श्रम खरीदने वापरा जा सकता जो उत्पादन को वास्तव में चाहिए।",
          mr: "पैसा भांडवल मानला जातो कारण त्याला ते बियाणे, अवजारे आणि श्रम विकत घ्यायला वापरता येते जे उत्पादनाला प्रत्यक्षात हवे.",
        },
        pair: {
          left: {
            en: "Used up in one production cycle",
            hi: "एक उत्पादन चक्र में खप जाती",
            mr: "एका उत्पादन चक्रात संपते",
          },
          right: {
            en: "working capital",
            hi: "कार्यशील पूँजी",
            mr: "खेळते भांडवल",
          },
        },
      },
      {
        id: "labour",
        name: {
          en: "Labour in Palampur",
          hi: "पालमपुर में श्रम",
          mr: "पालमपूरमधील श्रम",
        },
        kind: "idea",
        prompt: {
          en: "Some in the village own no land and survive by working on others' fields for wages, often for very low pay and no security. Which factor of production, and its most vulnerable form, is this?",
          hi: "गाँव में कुछ के पास कोई भूमि नहीं और वे मज़दूरी को दूसरों के खेतों पर काम कर जीते, अक्सर बहुत कम वेतन और बिना सुरक्षा। यह कौन-सा उत्पादन कारक, और उसका सबसे कमज़ोर रूप है?",
          mr: "गावात काहींकडे कोणतीही जमीन नाही आणि ते मजुरीला इतरांच्या शेतांवर काम करून जगतात, अनेकदा फार कमी वेतन आणि सुरक्षेविना. हा कोणता उत्पादन घटक, आणि त्याचे सर्वांत दुर्बल रूप?",
        },
        statement: {
          en: "Labour is the human effort put into production; its most vulnerable form is the landless farm labourer, who owns no land and works on others' fields for low, insecure wages.",
          hi: "श्रम उत्पादन में लगाया मानवी प्रयास; इसका सबसे कमज़ोर रूप भूमिहीन कृषि मज़दूर, जिसके पास कोई भूमि नहीं और जो कम, असुरक्षित मज़दूरी को दूसरों के खेतों पर काम करता।",
          mr: "श्रम उत्पादनात लावलेला मानवी प्रयत्न; त्याचे सर्वांत दुर्बल रूप भूमिहीन शेतमजूर, ज्याच्याकडे कोणतीही जमीन नाही आणि जो कमी, असुरक्षित मजुरीला इतरांच्या शेतांवर काम करतो.",
        },
        detail: {
          en: "Because many landless labourers compete for limited work, wages are pushed low, often below the government's set minimum, keeping such families poor.",
          hi: "क्योंकि कई भूमिहीन मज़दूर सीमित काम को होड़ करते, मज़दूरी कम धकेली जाती, अक्सर सरकार की तय न्यूनतम से नीचे, ऐसे परिवारों को ग़रीब रखते।",
          mr: "कारण अनेक भूमिहीन मजूर मर्यादित कामासाठी स्पर्धा करतात, मजुरी कमी ढकलली जाते, अनेकदा सरकारच्या ठरलेल्या किमानहून खाली, अशा कुटुंबांना गरीब ठेवत.",
        },
        extra: {
          en: "Labour differs from the other factors in a human way — it is people, so its reward, the wage, decides whether whole families eat well or go hungry.",
          hi: "श्रम अन्य कारकों से एक मानवी तरह भिन्न — यह लोग हैं, अतः इसका प्रतिफल, मज़दूरी, तय करता कि पूरे परिवार अच्छा खाएँ या भूखे रहें।",
          mr: "श्रम इतर घटकांहून एका मानवी रीतीने वेगळे — ते लोक आहेत, म्हणून त्याचे प्रतिफळ, मजुरी, ठरवते की अख्खी कुटुंबे चांगले खातील की उपाशी राहतील.",
        },
        pair: {
          left: {
            en: "Landless workers on others' fields for low wages",
            hi: "कम मज़दूरी को दूसरों के खेतों पर भूमिहीन कामगार",
            mr: "कमी मजुरीला इतरांच्या शेतांवर भूमिहीन कामगार",
          },
          right: {
            en: "labour in Palampur",
            hi: "पालमपुर में श्रम",
            mr: "पालमपूरमधील श्रम",
          },
        },
      },
      {
        id: "non-farm-activities",
        name: {
          en: "Non-farm activities",
          hi: "ग़ैर-कृषि गतिविधियाँ",
          mr: "बिगर-शेती उपक्रम",
        },
        kind: "idea",
        prompt: {
          en: "Beyond farming, Palampur's people also run dairies, small workshops, shops and transport, giving work that does not depend on the fields. What is this whole set of livelihoods called?",
          hi: "खेती से परे, पालमपुर के लोग डेयरी, छोटे कारख़ाने, दुकानें और परिवहन भी चलाते, ऐसा काम देते जो खेतों पर निर्भर नहीं। इस पूरे जीविका-समूह को क्या कहते?",
          mr: "शेतीपलीकडे, पालमपूरचे लोक दुग्धशाळा, लहान कारखाने, दुकाने आणि वाहतूकही चालवतात, असे काम देत जे शेतांवर अवलंबून नाही. या अख्ख्या उपजीविका-समूहाला काय म्हणतात?",
        },
        statement: {
          en: "Non-farm activities are the ways of earning a living in a village that do not depend on the land — dairying, small-scale manufacturing, shopkeeping and transport — providing work beyond farming.",
          hi: "ग़ैर-कृषि गतिविधियाँ गाँव में जीविका कमाने के वे तरीक़े जो भूमि पर निर्भर नहीं — डेयरी, छोटे पैमाने का निर्माण, दुकानदारी और परिवहन — खेती से परे काम देते।",
          mr: "बिगर-शेती उपक्रम गावात उपजीविका कमवण्याचे ते मार्ग जे जमिनीवर अवलंबून नाहीत — दुग्धव्यवसाय, लहान-प्रमाण उत्पादन, दुकानदारी आणि वाहतूक — शेतीपलीकडे काम देत.",
        },
        detail: {
          en: "They matter most because land is fixed and cannot employ ever more people, so a growing village must find work off the fields for its extra hands.",
          hi: "वे सबसे अधिक मायने रखतीं क्योंकि भूमि स्थिर और और अधिक लोगों को रोज़गार नहीं दे सकती, अतः बढ़ता गाँव अपने अतिरिक्त हाथों को खेतों से बाहर काम खोजना पड़े।",
          mr: "ते सर्वांत जास्त महत्त्वाचे कारण जमीन स्थिर आणि आणखी अधिक लोकांना रोजगार देऊ शकत नाही, म्हणून वाढत्या गावाला आपल्या जादा हातांना शेतांबाहेर काम शोधावे लागते.",
        },
        extra: {
          en: "Only a small part of Palampur's workforce is in non-farm work today; expanding it is seen as the village's best hope for jobs and rising incomes.",
          hi: "पालमपुर के कार्यबल का केवल छोटा भाग आज ग़ैर-कृषि काम में; इसे बढ़ाना गाँव की रोज़गार और बढ़ती आय की सबसे अच्छी आशा माना जाता।",
          mr: "पालमपूरच्या कामगारवर्गाचा फक्त लहान भाग आज बिगर-शेती कामात; ते वाढवणे गावाची रोजगार आणि वाढत्या उत्पन्नाची सर्वांत चांगली आशा मानले जाते.",
        },
        pair: {
          left: {
            en: "Dairy, workshops and shops off the fields",
            hi: "खेतों से बाहर डेयरी, कारख़ाने और दुकानें",
            mr: "शेतांबाहेर दुग्धशाळा, कारखाने आणि दुकाने",
          },
          right: {
            en: "non-farm activities",
            hi: "ग़ैर-कृषि गतिविधियाँ",
            mr: "बिगर-शेती उपक्रम",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Palampur has not gained a single extra hectare of farmland in decades, since every field was already being cultivated. Yet over those years the village grew far more grain than before. How is it possible to produce more food without any more land?",
          hi: "पालमपुर ने दशकों में एक भी अतिरिक्त हेक्टेयर कृषि-भूमि नहीं पाई, क्योंकि हर खेत पहले ही जुत रहा था। फिर भी उन वर्षों गाँव ने पहले से कहीं अधिक अन्न उगाया। बिना किसी अधिक भूमि के अधिक अन्न उत्पादित करना कैसे संभव?",
          mr: "पालमपूरने दशकांत एकही जादा हेक्टर शेतजमीन मिळवली नाही, कारण प्रत्येक शेत आधीच लागवडीखाली होते. तरी त्या वर्षांत गावाने आधीहून कितीतरी अधिक धान्य पिकवले. कोणत्याही अधिक जमिनीविना अधिक अन्न उत्पादित करणे कसे शक्य?",
        },
        choices: [
          {
            en: "By raising the yield of the same land instead of adding land — growing more than one crop a year on each field (multiple cropping) and adopting Green Revolution methods of tubewell irrigation, HYV seeds and fertiliser, so each hectare produces far more grain",
            hi: "भूमि जोड़ने के बजाय उसी भूमि की उपज बढ़ाकर — हर खेत पर वर्ष में एक से अधिक फ़सल उगाकर (बहु-फ़सल) और नलकूप सिंचाई, HYV बीज और उर्वरक की हरित क्रांति विधियाँ अपनाकर, अतः हर हेक्टेयर कहीं अधिक अन्न उपजाता",
            mr: "जमीन जोडण्याऐवजी त्याच जमिनीची उत्पादकता वाढवून — प्रत्येक शेतावर वर्षात एकाहून अधिक पीक घेऊन (बहुपीक) आणि नळकूप सिंचन, HYV बियाणे आणि खताच्या हरित क्रांती पद्धती अवलंबून, म्हणून प्रत्येक हेक्टर कितीतरी अधिक धान्य पिकवते",
          },
          {
            en: "By secretly importing land from a neighbouring village",
            hi: "पड़ोसी गाँव से गुप्त रूप से भूमि आयात कर",
            mr: "शेजारच्या गावातून गुपचूप जमीन आयात करून",
          },
          {
            en: "By having every farmer work twice as many hours with no change in methods",
            hi: "हर किसान को बिना विधि बदले दुगुने घंटे काम कराकर",
            mr: "प्रत्येक शेतकऱ्याला पद्धत न बदलता दुप्पट तास काम करवून",
          },
          {
            en: "It is impossible; the story must be exaggerated",
            hi: "यह असंभव; कहानी बढ़ा-चढ़ाकर होगी",
            mr: "हे अशक्य; गोष्ट अतिशयोक्त असेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The key is to see that 'more food' can come either from more land or from more food per unit of land — and since land is a fixed factor that cannot be expanded, Palampur took the second route, and raised its yield. It did so in two connected ways. First, multiple cropping: instead of leaving a field idle after one harvest, farmers grow a second and sometimes a third crop on the same field within a single year, so each hectare produces several harvests instead of one. This became possible mainly because of assured irrigation — with tubewells providing water on demand, farmers were no longer dependent on the single rainy season and could plant again in the dry months. Second, the Green Revolution package: high-yielding variety (HYV) seeds, which give far more grain per plant, combined with the chemical fertilisers and steady water they need to deliver those yields. Together these lifted the amount of grain harvested from each hectare well above what traditional seeds and rain-fed farming ever produced. So Palampur's extra food did not come from extra land, which was impossible, but from making the fixed land work harder and smarter — the standard answer for a country where land is scarce but the demand for food keeps rising. The catch, worth remembering, is that this intensive method has strained the soil and lowered the water table, so squeezing more from fixed land has a long-run cost.",
          hi: "कुंजी यह देखना कि 'अधिक अन्न' या तो अधिक भूमि से या प्रति भूमि-इकाई अधिक अन्न से आ सकता — और चूँकि भूमि स्थिर कारक जो फैलाया नहीं जा सकता, पालमपुर ने दूसरा रास्ता लिया, और अपनी उपज बढ़ाई। इसने दो जुड़े तरीक़ों से किया। पहला, बहु-फ़सल: एक फ़सल बाद खेत ख़ाली छोड़ने के बजाय, किसान उसी खेत पर एक वर्ष में दूसरी और कभी तीसरी फ़सल उगाते, अतः हर हेक्टेयर एक के बजाय कई फ़सलें उपजाता। यह मुख्यतः सुनिश्चित सिंचाई से संभव हुआ — नलकूप माँग पर पानी देते, किसान अब एकल वर्षा-ऋतु पर निर्भर नहीं और शुष्क महीनों में फिर बो सकते। दूसरा, हरित क्रांति पुलिंदा: अधिक-उपज किस्म (HYV) बीज, जो प्रति पौधा कहीं अधिक अन्न देते, उन रासायनिक उर्वरकों और स्थिर पानी के साथ जो उन्हें वे उपज देने चाहिए। मिलकर इन्होंने हर हेक्टेयर से काटा अन्न परंपरागत बीज और वर्षा-आश्रित खेती के कभी उपजाए से बहुत ऊपर उठाया। अतः पालमपुर का अतिरिक्त अन्न अतिरिक्त भूमि से नहीं आया, जो असंभव था, बल्कि स्थिर भूमि को अधिक कठिन-चतुर काम कराने से — उस देश का मानक उत्तर जहाँ भूमि दुर्लभ पर अन्न की माँग बढ़ती। पकड़, याद रखने योग्य, कि इस गहन विधि ने मिट्टी थकाई और जल-स्तर गिराया, अतः स्थिर भूमि से अधिक निचोड़ने की एक दीर्घकालीन क़ीमत।",
          mr: "किल्ली हे पाहणे की 'अधिक अन्न' एकतर अधिक जमिनीतून किंवा प्रति जमीन-एकक अधिक अन्नातून येऊ शकते — आणि कारण जमीन स्थिर घटक जो वाढवता येत नाही, पालमपूरने दुसरा मार्ग घेतला, आणि आपली उत्पादकता वाढवली. त्याने दोन जोडलेल्या मार्गांनी केले. पहिले, बहुपीक: एका पिकानंतर शेत रिकामे सोडण्याऐवजी, शेतकरी त्याच शेतावर एका वर्षात दुसरे आणि कधी तिसरे पीक घेतात, म्हणून प्रत्येक हेक्टर एकाऐवजी अनेक पिके पिकवते. हे मुख्यतः खात्रीशीर सिंचनामुळे शक्य झाले — नळकूप मागणीनुसार पाणी देत, शेतकरी आता एकाच पावसाळ्यावर अवलंबून नाहीत आणि कोरड्या महिन्यांत पुन्हा पेरू शकतात. दुसरे, हरित क्रांती जुडगा: अधिक-उत्पादन जात (HYV) बियाणे, जे प्रति रोप कितीतरी अधिक धान्य देतात, त्या रासायनिक खतांसह आणि स्थिर पाण्यासह जे त्यांना ते उत्पादन द्यायला हवे. एकत्र यांनी प्रत्येक हेक्टरमधून कापलेले धान्य पारंपरिक बियाणे आणि पावसावर अवलंबून शेतीने कधी पिकवलेल्याहून बरेच वर उंचावले. म्हणून पालमपूरचे जादा अन्न जादा जमिनीतून आले नाही, जे अशक्य होते, तर स्थिर जमिनीला अधिक कठीण-हुशार काम करवून — त्या देशाचे प्रमाण उत्तर जिथे जमीन दुर्मिळ पण अन्नाची मागणी वाढती. पकड, लक्षात ठेवण्याजोगी, की या सघन पद्धतीने माती ताणली आणि पाणी-पातळी घसरवली, म्हणून स्थिर जमिनीतून अधिक पिळण्याची एक दीर्घकालीन किंमत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In Palampur only a small share of workers earn a living outside farming — from dairies, workshops, shops and transport. Economists argue that expanding these non-farm activities is vital to the village's future. Why can't the village simply rely on farming to employ its growing population?",
          hi: "पालमपुर में कामगारों का केवल छोटा हिस्सा खेती के बाहर जीविका कमाता — डेयरी, कारख़ाने, दुकानों और परिवहन से। अर्थशास्त्री तर्क देते इन ग़ैर-कृषि गतिविधियों को बढ़ाना गाँव के भविष्य को महत्वपूर्ण। गाँव अपनी बढ़ती आबादी को रोज़गार देने बस खेती पर क्यों नहीं टिक सकता?",
          mr: "पालमपूरमध्ये कामगारांचा फक्त लहान वाटा शेतीबाहेर उपजीविका कमवतो — दुग्धशाळा, कारखाने, दुकाने आणि वाहतुकीतून. अर्थतज्ज्ञ युक्तिवाद करतात या बिगर-शेती उपक्रमांना वाढवणे गावाच्या भविष्याला महत्त्वाचे. गाव आपल्या वाढत्या लोकसंख्येला रोजगार द्यायला फक्त शेतीवर का टिकू शकत नाही?",
        },
        choices: [
          {
            en: "Because land is fixed and cannot absorb ever more workers — beyond a point extra hands on the same fields add little or nothing to output (disguised unemployment); a growing population therefore needs jobs off the land, so non-farm activities are the only way to employ the surplus workers and raise incomes",
            hi: "क्योंकि भूमि स्थिर और और अधिक कामगार नहीं समा सकती — एक बिंदु के परे उन्हीं खेतों पर अतिरिक्त हाथ उपज में कम या कुछ नहीं जोड़ते (छिपी बेरोज़गारी); अतः बढ़ती आबादी को भूमि से बाहर रोज़गार चाहिए, अतः ग़ैर-कृषि गतिविधियाँ ही अधिशेष कामगारों को रोज़गार देने और आय बढ़ाने का रास्ता",
            mr: "कारण जमीन स्थिर आणि आणखी अधिक कामगार सामावू शकत नाही — एका बिंदूपलीकडे त्याच शेतांवर जादा हात उत्पादनात कमी वा काही जोडत नाहीत (छुपी बेरोजगारी); म्हणून वाढत्या लोकसंख्येला जमिनीबाहेर रोजगार हवा, म्हणून बिगर-शेती उपक्रमच जादा कामगारांना रोजगार देण्याचा आणि उत्पन्न वाढवण्याचा मार्ग",
          },
          {
            en: "Because farming has been made completely illegal in Palampur",
            hi: "क्योंकि पालमपुर में खेती पूरी तरह अवैध कर दी गई",
            mr: "कारण पालमपूरमध्ये शेती पूर्णपणे बेकायदा केली गेली",
          },
          {
            en: "Because farming can employ an unlimited number of people forever",
            hi: "क्योंकि खेती अनगिनत लोगों को सदा रोज़गार दे सकती",
            mr: "कारण शेती अगणित लोकांना सदैव रोजगार देऊ शकते",
          },
          {
            en: "Because the villagers dislike farming and prefer shops",
            hi: "क्योंकि ग्रामीणों को खेती नापसंद और दुकानें पसंद",
            mr: "कारण गावकऱ्यांना शेती नावडती आणि दुकाने आवडती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The heart of the matter is again that land is a fixed factor. A village's farmland cannot be enlarged, and even the tricks that raise its yield — multiple cropping, irrigation, HYV seeds — have limits and eventually stop soaking up extra workers. Once a farm has enough people to work it fully, adding still more does not increase the harvest: those extra workers are busy in appearance but contribute nothing to output, a condition economists call disguised unemployment. You could remove several of them and the same amount of grain would still be produced. Meanwhile the village's population keeps growing, so each generation brings more young people needing work than the fixed land can usefully employ. If they all stayed in farming, the result would just be more people sharing the same output, splitting a fixed pie into thinner and thinner slices and staying poor. The way out is to create work that does not depend on land at all — dairying, small manufacturing, shops, transport and other non-farm activities. These can expand without needing more farmland, absorbing the surplus workers, giving them productive jobs, and letting the village earn incomes beyond what its fields alone could ever provide. That is why economists treat the growth of non-farm activities as the key to Palampur's future: it is the only direction in which employment and incomes can genuinely rise once the land is full. Building it up, however, needs capital, skills, roads, electricity and markets — which is why rural development focuses on exactly those things.",
          hi: "मामले का हृदय फिर यह कि भूमि स्थिर कारक। गाँव की कृषि-भूमि बड़ी नहीं की जा सकती, और उसकी उपज बढ़ाती चालें — बहु-फ़सल, सिंचाई, HYV बीज — की भी सीमाएँ और अंततः अतिरिक्त कामगार सोखना बंद कर देतीं। जब खेत के पास उसे पूरा जोतने भर लोग हों, और अधिक जोड़ना फ़सल नहीं बढ़ाता: वे अतिरिक्त कामगार दिखने में व्यस्त पर उपज में कुछ नहीं जोड़ते, वह दशा जिसे अर्थशास्त्री छिपी बेरोज़गारी कहते। तुम उनमें से कई हटा सको और उतना ही अन्न फिर भी उपजे। इस बीच गाँव की आबादी बढ़ती रहती, अतः हर पीढ़ी काम चाहते अधिक युवा लाती जितने स्थिर भूमि उपयोगी रोज़गार दे सके। यदि वे सब खेती में रहें, परिणाम बस उसी उपज को अधिक लोग साझा करते, स्थिर पाई को पतले-पतले टुकड़ों में बाँटते और ग़रीब रहते। निकास ऐसा काम रचना जो भूमि पर बिलकुल निर्भर न हो — डेयरी, छोटा निर्माण, दुकानें, परिवहन और अन्य ग़ैर-कृषि गतिविधियाँ। ये अधिक कृषि-भूमि की ज़रूरत बिना फैल सकतीं, अधिशेष कामगार सोखते, उन्हें उत्पादक रोज़गार देते, और गाँव को उससे परे आय कमाने देते जितनी उसके खेत अकेले कभी दे सकें। इसी से अर्थशास्त्री ग़ैर-कृषि गतिविधियों की वृद्धि को पालमपुर के भविष्य की कुंजी मानते: भूमि भरने पर रोज़गार-आय के सचमुच बढ़ने की एकमात्र दिशा। इसे बनाने को, पर, पूँजी, कौशल, सड़कें, बिजली और बाज़ार चाहिए — इसी से ग्रामीण विकास ठीक उन्हीं चीज़ों पर केंद्रित।",
          mr: "प्रकरणाचे हृदय पुन्हा हे की जमीन स्थिर घटक. गावाची शेतजमीन मोठी करता येत नाही, आणि तिची उत्पादकता वाढवणाऱ्या युक्त्या — बहुपीक, सिंचन, HYV बियाणे — यांच्याही मर्यादा आणि अखेर जादा कामगार शोषणे थांबवतात. एकदा शेताकडे ते पूर्ण नांगरण्याइतके लोक असले, आणखी जोडणे पीक वाढवत नाही: ते जादा कामगार दिसण्यात व्यग्र पण उत्पादनात काही जोडत नाहीत, ती अवस्था जिला अर्थतज्ज्ञ छुपी बेरोजगारी म्हणतात. तुम्ही त्यांतले अनेक काढू शकता आणि तेवढेच धान्य तरी पिकेल. दरम्यान गावाची लोकसंख्या वाढत राहते, म्हणून प्रत्येक पिढी काम हवे असलेले अधिक तरुण आणते जितके स्थिर जमीन उपयुक्त रोजगार देऊ शकते. जर ते सारे शेतीत राहिले, परिणाम फक्त त्याच उत्पादनाला अधिक लोक वाटतील, स्थिर पाई पातळ-पातळ तुकड्यांत विभागत आणि गरीब राहत. मार्ग असे काम निर्माण करणे जे जमिनीवर मुळीच अवलंबून नाही — दुग्धव्यवसाय, लहान उत्पादन, दुकाने, वाहतूक आणि इतर बिगर-शेती उपक्रम. हे अधिक शेतजमिनीची गरज न बाळगता वाढू शकतात, जादा कामगार शोषत, त्यांना उत्पादक रोजगार देत, आणि गावाला त्याहून पलीकडे उत्पन्न कमवू देत जितके त्याची शेते एकटी कधी देऊ शकतील. म्हणूनच अर्थतज्ज्ञ बिगर-शेती उपक्रमांच्या वाढीला पालमपूरच्या भविष्याची किल्ली मानतात: जमीन भरल्यावर रोजगार-उत्पन्न खरोखर वाढण्याची एकमेव दिशा. ते उभारायला, मात्र, भांडवल, कौशल्ये, रस्ते, वीज आणि बाजार हवे — म्हणूनच ग्रामीण विकास नेमक्या त्याच गोष्टींवर केंद्रित.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — People as Resource                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-9-people-as-resource",
    subject: "ECONOMICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 2 — People as Resource",
      hi: "अध्याय 2 — संसाधन के रूप में लोग",
      mr: "प्रकरण 2 — संसाधन म्हणून लोक",
    },
    name: {
      en: "People as Resource",
      hi: "संसाधन के रूप में लोग",
      mr: "संसाधन म्हणून लोक",
    },
    summary: {
      en: "A crowd turned into a resource: population becomes an asset once it is educated, healthy and skilled; the work people do sorted into three great sectors; schooling and healthcare seen as investment that pays back; and the hidden waste of workers who look busy but add nothing.",
      hi: "एक भीड़ संसाधन में बदली: आबादी संपत्ति बनती जब शिक्षित, स्वस्थ और कुशल हो; लोगों का किया काम तीन बड़े क्षेत्रों में छँटा; शिक्षा-स्वास्थ्य निवेश के रूप में देखे जो लौटाता; और उन कामगारों की छिपी बर्बादी जो व्यस्त दिखते पर कुछ नहीं जोड़ते।",
      mr: "एक गर्दी संसाधनात बदलली: लोकसंख्या मालमत्ता बनते जेव्हा शिक्षित, निरोगी आणि कुशल असते; लोकांनी केलेले काम तीन मोठ्या क्षेत्रांत वेगळे; शिक्षण-आरोग्य गुंतवणूक म्हणून पाहिलेले जे परत करते; आणि त्या कामगारांची छुपी नासाडी जे व्यग्र दिसतात पण काही जोडत नाहीत.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "human-capital",
        name: {
          en: "Human capital",
          hi: "मानव पूँजी",
          mr: "मानवी भांडवल",
        },
        kind: "idea",
        prompt: {
          en: "A large population is often seen as a burden of mouths to feed, but educated, healthy, skilled people can produce far more than they consume. What do we call a population turned into a productive asset this way?",
          hi: "बड़ी आबादी अक्सर खिलाने को मुँहों का बोझ मानी जाती, पर शिक्षित, स्वस्थ, कुशल लोग खपत से कहीं अधिक उत्पादित कर सकते। यों उत्पादक संपत्ति में बदली आबादी को हम क्या कहते?",
          mr: "मोठी लोकसंख्या अनेकदा पोसायला तोंडांचे ओझे मानली जाते, पण शिक्षित, निरोगी, कुशल लोक खपाहून कितीतरी अधिक उत्पादित करू शकतात. अशी उत्पादक मालमत्तेत बदललेल्या लोकसंख्येला आपण काय म्हणतो?",
        },
        statement: {
          en: "Human capital is a population made productive through education, health and skills — when people are trained and healthy, they become an asset that adds to the economy rather than a mere burden.",
          hi: "मानव पूँजी शिक्षा, स्वास्थ्य और कौशल से उत्पादक बनी आबादी — जब लोग प्रशिक्षित और स्वस्थ, वे संपत्ति बनते जो अर्थव्यवस्था में जोड़ती, न कि मात्र बोझ।",
          mr: "मानवी भांडवल शिक्षण, आरोग्य आणि कौशल्याने उत्पादक बनलेली लोकसंख्या — जेव्हा लोक प्रशिक्षित आणि निरोगी, ते मालमत्ता बनतात जी अर्थव्यवस्थेत जोडते, न की केवळ ओझे.",
        },
        detail: {
          en: "The very same person is a cost when uneducated and unwell, but a resource when schooled, skilled and healthy — the difference is what has been invested in them.",
          hi: "वही व्यक्ति अशिक्षित और अस्वस्थ होने पर लागत, पर शिक्षित, कुशल और स्वस्थ होने पर संसाधन — अंतर वह जो उनमें निवेश किया गया।",
          mr: "तीच व्यक्ती अशिक्षित आणि अस्वस्थ असता खर्च, पण शिक्षित, कुशल आणि निरोगी असता संसाधन — फरक तो जो त्यांच्यात गुंतवला गेला.",
        },
        extra: {
          en: "A country's greatest resource can be its people — Japan, poor in natural resources, grew rich chiefly by investing heavily in the skills of its citizens.",
          hi: "किसी देश का सबसे बड़ा संसाधन उसके लोग हो सकते — जापान, प्राकृतिक संसाधनों में ग़रीब, मुख्यतः अपने नागरिकों के कौशल में भारी निवेश से समृद्ध हुआ।",
          mr: "एखाद्या देशाचे सर्वांत मोठे संसाधन त्याचे लोक असू शकतात — जपान, नैसर्गिक संसाधनांत गरीब, मुख्यतः आपल्या नागरिकांच्या कौशल्यात भारी गुंतवणुकीने समृद्ध झाला.",
        },
        pair: {
          left: {
            en: "A population made productive by education and health",
            hi: "शिक्षा-स्वास्थ्य से उत्पादक बनी आबादी",
            mr: "शिक्षण-आरोग्याने उत्पादक बनलेली लोकसंख्या",
          },
          right: {
            en: "human capital",
            hi: "मानव पूँजी",
            mr: "मानवी भांडवल",
          },
        },
      },
      {
        id: "economic-activities",
        name: {
          en: "Economic activities",
          hi: "आर्थिक गतिविधियाँ",
          mr: "आर्थिक उपक्रम",
        },
        kind: "idea",
        prompt: {
          en: "A shopkeeper selling goods, a teacher paid a salary and a farmer selling grain are all working to earn an income, unlike a person cooking only for their own family. What is the first kind of work called?",
          hi: "वस्तु बेचता दुकानदार, वेतन पाता शिक्षक और अन्न बेचता किसान सब आय कमाने काम करते, केवल अपने परिवार को पकाते व्यक्ति के विपरीत। पहले प्रकार के काम को क्या कहते?",
          mr: "वस्तू विकणारा दुकानदार, वेतन मिळणारा शिक्षक आणि धान्य विकणारा शेतकरी सारे उत्पन्न कमवायला काम करतात, फक्त आपल्या कुटुंबाला शिजवणाऱ्या व्यक्तीविरुद्ध. पहिल्या प्रकारच्या कामाला काय म्हणतात?",
        },
        statement: {
          en: "Economic activities are those done to earn an income by producing goods or services for the market; work done only for one's own household, without pay, is a non-economic activity.",
          hi: "आर्थिक गतिविधियाँ वे जो बाज़ार के लिए वस्तु या सेवा उत्पादित कर आय कमाने की जातीं; केवल अपने घर के लिए, बिना वेतन किया काम ग़ैर-आर्थिक गतिविधि।",
          mr: "आर्थिक उपक्रम ते जे बाजारासाठी वस्तू वा सेवा उत्पादित करून उत्पन्न कमवायला केले जातात; फक्त आपल्या घरासाठी, विनावेतन केलेले काम बिगर-आर्थिक उपक्रम.",
        },
        detail: {
          en: "The same task can be either: a cook paid in a restaurant does an economic activity, but cooking the family dinner at home, though real work, is non-economic.",
          hi: "वही काम कोई भी हो सकता: रेस्तराँ में वेतन पाता रसोइया आर्थिक गतिविधि करता, पर घर पर परिवार का खाना पकाना, यद्यपि असली काम, ग़ैर-आर्थिक।",
          mr: "तेच काम कोणतेही असू शकते: हॉटेलात वेतन मिळणारा स्वयंपाकी आर्थिक उपक्रम करतो, पण घरी कुटुंबाचे जेवण शिजवणे, जरी खरे काम, बिगर-आर्थिक.",
        },
        extra: {
          en: "This is why so much unpaid work, especially women's household labour, goes uncounted in the economy though it is real and vital.",
          hi: "इसी से इतना बिना-वेतन काम, ख़ासकर स्त्रियों का घरेलू श्रम, अर्थव्यवस्था में बिना-गिना रहता यद्यपि यह असली और अनिवार्य।",
          mr: "म्हणूनच इतके विनावेतन काम, विशेषतः स्त्रियांचे घरगुती श्रम, अर्थव्यवस्थेत न-मोजलेले राहते जरी ते खरे आणि अत्यावश्यक.",
        },
        pair: {
          left: {
            en: "Producing goods or services for an income",
            hi: "आय को वस्तु या सेवा उत्पादित करना",
            mr: "उत्पन्नासाठी वस्तू वा सेवा उत्पादित करणे",
          },
          right: {
            en: "economic activities",
            hi: "आर्थिक गतिविधियाँ",
            mr: "आर्थिक उपक्रम",
          },
        },
      },
      {
        id: "three-sectors",
        name: {
          en: "The three sectors of the economy",
          hi: "अर्थव्यवस्था के तीन क्षेत्र",
          mr: "अर्थव्यवस्थेची तीन क्षेत्रे",
        },
        kind: "idea",
        prompt: {
          en: "All economic activity is grouped into three broad kinds — drawing wealth from nature, turning it into manufactured goods, and providing services. What is this threefold division called?",
          hi: "सारी आर्थिक गतिविधि तीन व्यापक प्रकारों में समूहित — प्रकृति से धन खींचना, इसे निर्मित वस्तुओं में बदलना, और सेवाएँ देना। इस त्रि-विभाजन को क्या कहते?",
          mr: "सारी आर्थिक क्रिया तीन व्यापक प्रकारांत गटबद्ध — निसर्गातून संपत्ती खेचणे, तिला उत्पादित वस्तूंत बदलणे, आणि सेवा पुरवणे. या तिहेरी विभागणीला काय म्हणतात?",
        },
        statement: {
          en: "The economy is divided into three sectors — the primary sector drawing directly from nature (farming, mining, fishing), the secondary sector making goods (manufacturing), and the tertiary sector providing services (transport, trade, teaching).",
          hi: "अर्थव्यवस्था तीन क्षेत्रों में बँटी — प्राथमिक क्षेत्र सीधे प्रकृति से खींचता (खेती, खनन, मत्स्यन), द्वितीयक क्षेत्र वस्तु बनाता (निर्माण), और तृतीयक क्षेत्र सेवाएँ देता (परिवहन, व्यापार, शिक्षण)।",
          mr: "अर्थव्यवस्था तीन क्षेत्रांत विभागली — प्राथमिक क्षेत्र थेट निसर्गातून खेचते (शेती, खाणकाम, मत्स्यन), द्वितीयक क्षेत्र वस्तू बनवते (उत्पादन), आणि तृतीयक क्षेत्र सेवा पुरवते (वाहतूक, व्यापार, शिक्षण).",
        },
        detail: {
          en: "As a country develops, work usually shifts from the primary sector toward the secondary and, above all, the fast-growing service sector.",
          hi: "जैसे देश विकसित होता, काम आमतौर पर प्राथमिक क्षेत्र से द्वितीयक और, सबसे बढ़कर, तेज़-बढ़ते सेवा क्षेत्र की ओर खिसकता।",
          mr: "जसा देश विकसित होतो, काम सहसा प्राथमिक क्षेत्रातून द्वितीयक आणि, सर्वांहून, जलद-वाढत्या सेवा क्षेत्राकडे सरकते.",
        },
        extra: {
          en: "The tertiary sector includes not just trade and transport but also teachers, doctors, bankers and software workers — the growing world of services.",
          hi: "तृतीयक क्षेत्र में केवल व्यापार-परिवहन नहीं बल्कि शिक्षक, डॉक्टर, बैंककर्मी और सॉफ़्टवेयर कामगार भी — सेवाओं की बढ़ती दुनिया।",
          mr: "तृतीयक क्षेत्रात फक्त व्यापार-वाहतूक नव्हे तर शिक्षक, डॉक्टर, बँककर्मी आणि सॉफ्टवेअर कामगारही — सेवांचे वाढते जग.",
        },
        pair: {
          left: {
            en: "Primary from nature, secondary makes, tertiary serves",
            hi: "प्राथमिक प्रकृति से, द्वितीयक बनाता, तृतीयक सेवा",
            mr: "प्राथमिक निसर्गातून, द्वितीयक बनवते, तृतीयक सेवा",
          },
          right: {
            en: "the three sectors",
            hi: "तीन क्षेत्र",
            mr: "तीन क्षेत्रे",
          },
        },
      },
      {
        id: "investment-in-people",
        name: {
          en: "Investment in education and health",
          hi: "शिक्षा और स्वास्थ्य में निवेश",
          mr: "शिक्षण आणि आरोग्यातील गुंतवणूक",
        },
        kind: "idea",
        prompt: {
          en: "Money spent on schooling a child or curing an illness is not really a cost but a stake that pays back later, when that person can work more skilfully and earn more. What do economists call such spending on people?",
          hi: "बच्चे की शिक्षा या बीमारी के इलाज पर खर्चा वास्तव में लागत नहीं बल्कि एक दाँव जो बाद में लौटाता, जब वह व्यक्ति अधिक कुशलता से काम कर अधिक कमा सके। लोगों पर ऐसे खर्च को अर्थशास्त्री क्या कहते?",
          mr: "मुलाच्या शिक्षणावर वा आजाराच्या इलाजावर खर्च खरे तर खर्च नव्हे तर एक पैज जी नंतर परत करते, जेव्हा ती व्यक्ती अधिक कौशल्याने काम करून अधिक कमावू शकते. लोकांवरच्या अशा खर्चाला अर्थतज्ज्ञ काय म्हणतात?",
        },
        statement: {
          en: "Spending on education and health is treated as investment in human capital — like buying a machine, it costs now but yields returns later, as a schooled, healthy person works more productively and earns more.",
          hi: "शिक्षा और स्वास्थ्य पर खर्च मानव पूँजी में निवेश माना जाता — मशीन खरीदने की तरह, यह अभी लागत पर बाद में लौटाता, जैसे शिक्षित, स्वस्थ व्यक्ति अधिक उत्पादक काम कर अधिक कमाता।",
          mr: "शिक्षण आणि आरोग्यावरचा खर्च मानवी भांडवलातील गुंतवणूक मानला जातो — यंत्र विकत घेण्यासारखे, तो आता खर्च पण नंतर परत करतो, जसे शिक्षित, निरोगी व्यक्ती अधिक उत्पादक काम करून अधिक कमावते.",
        },
        detail: {
          en: "Just as a factory owner invests in machinery expecting future profit, a society investing in its children's schooling and health reaps a more productive workforce later.",
          hi: "जैसे कारख़ाना-मालिक भावी लाभ की आशा में मशीनरी में निवेश करता, अपने बच्चों की शिक्षा-स्वास्थ्य में निवेश करता समाज बाद में अधिक उत्पादक कार्यबल पाता।",
          mr: "जसा कारखाना-मालक भविष्यातील नफ्याच्या आशेने यंत्रात गुंतवणूक करतो, आपल्या मुलांच्या शिक्षण-आरोग्यात गुंतवणूक करणारा समाज नंतर अधिक उत्पादक कामगारवर्ग मिळवतो.",
        },
        extra: {
          en: "This is why schooling and healthcare are counted as building the nation, not merely spending on it — they are the seed of tomorrow's prosperity.",
          hi: "इसी से शिक्षा-स्वास्थ्य राष्ट्र-निर्माण गिने जाते, न कि केवल उस पर खर्च — वे कल की समृद्धि का बीज।",
          mr: "म्हणूनच शिक्षण-आरोग्य राष्ट्र-उभारणी मोजले जातात, न की फक्त त्यावर खर्च — ते उद्याच्या समृद्धीचे बी.",
        },
        pair: {
          left: {
            en: "Spending that costs now but pays back later",
            hi: "अभी लागत पर बाद में लौटाता खर्च",
            mr: "आता खर्च पण नंतर परत करणारा खर्च",
          },
          right: {
            en: "investment in human capital",
            hi: "मानव पूँजी में निवेश",
            mr: "मानवी भांडवलातील गुंतवणूक",
          },
        },
      },
      {
        id: "disguised-unemployment",
        name: {
          en: "Disguised unemployment",
          hi: "छिपी बेरोज़गारी",
          mr: "छुपी बेरोजगारी",
        },
        kind: "idea",
        prompt: {
          en: "On a small family farm, eight people work where five would be enough; the extra three appear employed but add nothing to the harvest, and could leave without any fall in output. What is this hidden joblessness called?",
          hi: "एक छोटे पारिवारिक खेत पर, आठ लोग काम करते जहाँ पाँच काफ़ी होते; अतिरिक्त तीन रोज़गार में दिखते पर फ़सल में कुछ नहीं जोड़ते, और उपज में बिना किसी गिरावट के जा सकते। इस छिपी बेरोज़गारी को क्या कहते?",
          mr: "एका लहान कौटुंबिक शेतावर, आठ लोक काम करतात जिथे पाच पुरेसे होते; जादा तीन रोजगारात दिसतात पण पिकात काही जोडत नाहीत, आणि उत्पादनात कोणतीही घट न होता जाऊ शकतात. या छुप्या बेरोजगारीला काय म्हणतात?",
        },
        statement: {
          en: "Disguised unemployment is when more people work on a task than are actually needed, so the extra workers appear employed but add nothing to output and could be removed with no fall in production.",
          hi: "छिपी बेरोज़गारी जब किसी काम पर वास्तव में ज़रूरत से अधिक लोग काम करें, अतः अतिरिक्त कामगार रोज़गार में दिखते पर उपज में कुछ नहीं जोड़ते और उत्पादन में बिना गिरावट हटाए जा सकते।",
          mr: "छुपी बेरोजगारी जेव्हा एखाद्या कामावर प्रत्यक्षात गरजेहून अधिक लोक काम करतात, म्हणून जादा कामगार रोजगारात दिसतात पण उत्पादनात काही जोडत नाहीत आणि उत्पादनात घट न होता काढता येतात.",
        },
        detail: {
          en: "It is common on India's small farms, where a whole family works land that only a few of them are really needed to farm — jobless in effect, though never idle.",
          hi: "यह भारत के छोटे खेतों पर आम, जहाँ पूरा परिवार भूमि जोतता जिसे जोतने उनमें से केवल कुछ ही वास्तव में चाहिए — प्रभाव में बेरोज़गार, यद्यपि कभी निठल्ले नहीं।",
          mr: "हे भारताच्या लहान शेतांवर सामान्य, जिथे अख्खे कुटुंब जमीन नांगरते जी नांगरायला त्यांतले फक्त काहीच खरोखर हवे — प्रत्यक्षात बेरोजगार, जरी कधी रिकामे नाहीत.",
        },
        extra: {
          en: "It differs from ordinary unemployment, where a willing worker finds no work at all — here the people have work, but their work is not truly needed.",
          hi: "यह साधारण बेरोज़गारी से भिन्न, जहाँ इच्छुक कामगार को कोई काम नहीं मिलता — यहाँ लोगों के पास काम, पर उनके काम की सचमुच ज़रूरत नहीं।",
          mr: "हे साध्या बेरोजगारीहून वेगळे, जिथे इच्छुक कामगाराला कोणतेही काम मिळत नाही — इथे लोकांकडे काम, पण त्यांच्या कामाची खरोखर गरज नाही.",
        },
        pair: {
          left: {
            en: "Extra workers who add nothing to output",
            hi: "उपज में कुछ न जोड़ते अतिरिक्त कामगार",
            mr: "उत्पादनात काही न जोडणारे जादा कामगार",
          },
          right: {
            en: "disguised unemployment",
            hi: "छिपी बेरोज़गारी",
            mr: "छुपी बेरोजगारी",
          },
        },
      },
      {
        id: "educated-unemployment",
        name: {
          en: "Educated unemployment",
          hi: "शिक्षित बेरोज़गारी",
          mr: "शिक्षित बेरोजगारी",
        },
        kind: "idea",
        prompt: {
          en: "In India's towns and cities, many young people with school and college degrees cannot find jobs that match their qualifications, so their skills go to waste. What is this particular joblessness called?",
          hi: "भारत के क़स्बों-शहरों में, स्कूल-कॉलेज की डिग्रियों वाले कई युवा अपनी योग्यता से मेल खाते रोज़गार नहीं पा सकते, अतः उनके कौशल बर्बाद जाते। इस विशेष बेरोज़गारी को क्या कहते?",
          mr: "भारताच्या गावा-शहरांत, शाळा-महाविद्यालयाच्या पदव्या असलेले अनेक तरुण आपल्या पात्रतेशी जुळणारे रोजगार मिळवू शकत नाहीत, म्हणून त्यांचे कौशल्य वाया जाते. या विशिष्ट बेरोजगारीला काय म्हणतात?",
        },
        statement: {
          en: "Educated unemployment is the joblessness of qualified people — those with school or college degrees who cannot find suitable work, so their training and skills lie unused, a peculiarly urban problem.",
          hi: "शिक्षित बेरोज़गारी योग्य लोगों की बेरोज़गारी — स्कूल या कॉलेज डिग्री वाले जो उपयुक्त काम नहीं पाते, अतः उनका प्रशिक्षण-कौशल अप्रयुक्त पड़ा, एक विशेष शहरी समस्या।",
          mr: "शिक्षित बेरोजगारी पात्र लोकांची बेरोजगारी — शाळा वा महाविद्यालयाची पदवी असलेले जे योग्य काम मिळवत नाहीत, म्हणून त्यांचे प्रशिक्षण-कौशल्य न-वापरलेले पडलेले, एक खास शहरी समस्या.",
        },
        detail: {
          en: "It is a painful waste: society spent to educate these young people, yet the economy offers them too few jobs to put that education to use.",
          hi: "यह एक पीड़ादायक बर्बादी: समाज ने इन युवाओं को शिक्षित करने खर्चा, फिर भी अर्थव्यवस्था उन्हें उस शिक्षा को काम में लाने बहुत कम रोज़गार देती।",
          mr: "ही एक वेदनादायक नासाडी: समाजाने या तरुणांना शिक्षित करायला खर्च केला, तरी अर्थव्यवस्था त्यांना ते शिक्षण कामात आणायला फार कमी रोजगार देते.",
        },
        extra: {
          en: "It coexists strangely with a shortage of some skills, showing the problem is often a mismatch between what is taught and what jobs actually demand.",
          hi: "यह कुछ कौशलों की कमी के साथ विचित्र रूप से रहती, दिखाते समस्या अक्सर सिखाए और रोज़गार जो वास्तव में माँगते के बीच बेमेल।",
          mr: "हे काही कौशल्यांच्या टंचाईसह विचित्रपणे राहते, दाखवत समस्या अनेकदा शिकवलेले आणि रोजगार जे प्रत्यक्षात मागतात यांतील विसंगती.",
        },
        pair: {
          left: {
            en: "Degree-holders who cannot find suitable work",
            hi: "उपयुक्त काम न पाते डिग्रीधारी",
            mr: "योग्य काम न मिळवणारे पदवीधर",
          },
          right: {
            en: "educated unemployment",
            hi: "शिक्षित बेरोज़गारी",
            mr: "शिक्षित बेरोजगारी",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A family of eight all work on their two-hectare farm, and they all say they are 'employed'. An economist studies them and declares that three of them are in fact unemployed, even though they work every day. How can someone who works daily be counted as unemployed?",
          hi: "आठ का परिवार सब अपने दो-हेक्टेयर खेत पर काम करता, और सब कहते वे 'रोज़गार में'। एक अर्थशास्त्री उन्हें अध्ययन कर घोषित करता कि उनमें से तीन वास्तव में बेरोज़गार, यद्यपि वे हर दिन काम करते। जो रोज़ काम करे उसे बेरोज़गार कैसे गिना जाए?",
          mr: "आठांचे कुटुंब सारे आपल्या दोन-हेक्टर शेतावर काम करते, आणि सारे म्हणतात ते 'रोजगारात'. एक अर्थतज्ज्ञ त्यांचा अभ्यास करून घोषित करतो की त्यांतले तीन खरे तर बेरोजगार, जरी ते दररोज काम करतात. जो रोज काम करतो त्याला बेरोजगार कसे मोजावे?",
        },
        choices: [
          {
            en: "This is disguised unemployment: the little farm needs only about five workers, so the other three add nothing to the harvest — if they left, output would not fall at all. They look employed but their labour is not really needed, so in effect they are unemployed",
            hi: "यह छिपी बेरोज़गारी: छोटे खेत को केवल लगभग पाँच कामगार चाहिए, अतः बाक़ी तीन फ़सल में कुछ नहीं जोड़ते — यदि वे चले जाएँ, उपज बिलकुल न गिरे। वे रोज़गार में दिखते पर उनके श्रम की सचमुच ज़रूरत नहीं, अतः प्रभाव में बेरोज़गार",
            mr: "ही छुपी बेरोजगारी: लहान शेताला फक्त सुमारे पाच कामगार हवेत, म्हणून बाकी तीन पिकात काही जोडत नाहीत — जर ते गेले, उत्पादन मुळीच घटणार नाही. ते रोजगारात दिसतात पण त्यांच्या श्रमाची खरोखर गरज नाही, म्हणून प्रत्यक्षात बेरोजगार",
          },
          {
            en: "The economist made an error; anyone who works daily is fully employed",
            hi: "अर्थशास्त्री ने ग़लती की; जो रोज़ काम करे पूरी तरह रोज़गार में",
            mr: "अर्थतज्ज्ञाने चूक केली; जो रोज काम करतो पूर्णपणे रोजगारात",
          },
          {
            en: "The three are unemployed only because they are paid too little",
            hi: "तीन बेरोज़गार केवल इसलिए कि उन्हें बहुत कम वेतन",
            mr: "तीन बेरोजगार फक्त म्हणून की त्यांना फार कमी वेतन",
          },
          {
            en: "They are unemployed because they secretly do not go to the farm at all",
            hi: "वे बेरोज़गार क्योंकि वे गुप्त रूप से खेत जाते ही नहीं",
            mr: "ते बेरोजगार कारण ते गुपचूप शेतावर जातच नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The economist is pointing to disguised unemployment, one of the most important ideas about work in a country like India. Normally we think of unemployment as a willing worker who can find no job at all — visibly idle. But there is a subtler kind that hides inside a job. On this small two-hectare farm, the actual amount of work needed might require only about five pairs of hands to do everything well. When all eight family members work it anyway, the extra three are not adding anything: the same amount of grain would be grown whether they were there or not. Their labour is being wasted, spread thin over a task that does not need it. The proof is a simple thought-experiment: if those three left to take jobs elsewhere, the farm's output would stay exactly the same. That is the tell-tale sign of disguised unemployment — you can remove the workers without reducing production, because they were never really needed. So although they are busy every day and would all describe themselves as employed, three of them are, in economic terms, unemployed: their work produces no extra output. This matters enormously, because it means a country can have a huge hidden reserve of underused labour on its farms — people whose effort is being wasted and who could be far more productive if there were non-farm jobs to move them into. Recognising disguised unemployment is exactly why economists press for creating new work off the land.",
          hi: "अर्थशास्त्री छिपी बेरोज़गारी की ओर इशारा कर रहा, भारत जैसे देश में काम के बारे में सबसे महत्वपूर्ण विचारों में। सामान्यतः हम बेरोज़गारी को इच्छुक कामगार मानते जो कोई काम नहीं पाता — दिखता निठल्ला। पर एक सूक्ष्मतर प्रकार जो काम के भीतर छिपता। इस छोटे दो-हेक्टेयर खेत पर, ज़रूरी असली काम शायद सब कुछ अच्छे से करने केवल लगभग पाँच जोड़ी हाथ माँगे। जब आठों परिवार-सदस्य फिर भी जोतें, अतिरिक्त तीन कुछ नहीं जोड़ते: उतना ही अन्न उगे चाहे वे हों या न हों। उनका श्रम बर्बाद हो रहा, ऐसे काम पर पतला फैला जिसे इसकी ज़रूरत नहीं। प्रमाण एक सरल विचार-प्रयोग: यदि वे तीन कहीं और काम लेने चले जाएँ, खेत की उपज ठीक वही रहे। यही छिपी बेरोज़गारी का पक्का चिह्न — तुम कामगार हटा सको बिना उत्पादन घटाए, क्योंकि उनकी कभी सचमुच ज़रूरत नहीं थी। अतः यद्यपि वे हर दिन व्यस्त और सब स्वयं को रोज़गार में बताएँ, उनमें से तीन, आर्थिक शब्दों में, बेरोज़गार: उनका काम कोई अतिरिक्त उपज नहीं पैदा करता। यह बहुत मायने रखता, क्योंकि इसका अर्थ देश के पास अपने खेतों पर अल्प-प्रयुक्त श्रम का विशाल छिपा भंडार हो सकता — लोग जिनका प्रयास बर्बाद हो रहा और जो कहीं अधिक उत्पादक हो सकते यदि उन्हें ले जाने ग़ैर-कृषि रोज़गार हों। छिपी बेरोज़गारी को पहचानना ठीक वह क्यों अर्थशास्त्री भूमि से बाहर नया काम रचने पर ज़ोर देते।",
          mr: "अर्थतज्ज्ञ छुप्या बेरोजगारीकडे निर्देश करत आहे, भारतासारख्या देशात कामाबद्दलच्या सर्वांत महत्त्वाच्या कल्पनांपैकी एक. सामान्यतः आपण बेरोजगारी इच्छुक कामगार मानतो जो कोणतेही काम मिळवत नाही — दिसतो रिकामा. पण एक सूक्ष्मतर प्रकार जो कामाच्या आत लपतो. या लहान दोन-हेक्टर शेतावर, आवश्यक खरे काम कदाचित सारे चांगले करायला फक्त सुमारे पाच जोड्या हात मागेल. जेव्हा आठही कुटुंब-सदस्य तरी नांगरतात, जादा तीन काही जोडत नाहीत: तेवढेच धान्य पिकेल ते असोत वा नसोत. त्यांचे श्रम वाया जात आहे, अशा कामावर पातळ पसरलेले ज्याला त्याची गरज नाही. पुरावा एक साधा विचार-प्रयोग: जर ते तीन इतरत्र काम घ्यायला गेले, शेताचे उत्पादन नेमके तेच राहील. हेच छुप्या बेरोजगारीचे खात्रीशीर चिन्ह — तुम्ही कामगार काढू शकता उत्पादन न घटवता, कारण त्यांची कधी खरोखर गरज नव्हती. म्हणून जरी ते दररोज व्यग्र आणि सारे स्वतःला रोजगारात सांगतील, त्यांतले तीन, आर्थिक भाषेत, बेरोजगार: त्यांचे काम कोणतेही जादा उत्पादन देत नाही. हे प्रचंड महत्त्वाचे, कारण याचा अर्थ देशाकडे आपल्या शेतांवर अल्प-वापरलेल्या श्रमाचा प्रचंड छुपा साठा असू शकतो — लोक ज्यांचा प्रयत्न वाया जात आहे आणि जे कितीतरी अधिक उत्पादक होऊ शकतील जर त्यांना न्यायला बिगर-शेती रोजगार असतील. छुपी बेरोजगारी ओळखणे नेमके ते का अर्थतज्ज्ञ जमिनीबाहेर नवे काम निर्माण करण्यावर जोर देतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two countries have the same number of people. One treats its population mainly as mouths to feed; the other spends heavily on schools, hospitals and training. Decades later the second is far richer. How does spending on people — which looks like a cost — end up creating wealth?",
          hi: "दो देशों की जनसंख्या समान। एक अपनी आबादी को मुख्यतः खिलाने के मुँह मानता; दूसरा स्कूलों, अस्पतालों और प्रशिक्षण पर भारी खर्चता। दशकों बाद दूसरा कहीं समृद्ध। लोगों पर खर्च — जो लागत दिखता — अंततः धन कैसे बनाता?",
          mr: "दोन देशांची लोकसंख्या समान. एक आपल्या लोकसंख्येला मुख्यतः पोसायची तोंडे मानतो; दुसरा शाळा, रुग्णालये आणि प्रशिक्षणावर भारी खर्च करतो. दशकांनी दुसरा कितीतरी श्रीमंत. लोकांवरचा खर्च — जो खर्च दिसतो — अखेर संपत्ती कशी निर्माण करतो?",
        },
        choices: [
          {
            en: "Educating and keeping people healthy is investment in human capital: like buying a machine, it costs now but yields returns later, because a skilled, healthy worker produces far more than an unschooled, sickly one; so the population turns from a burden into the economy's most productive asset",
            hi: "लोगों को शिक्षित और स्वस्थ रखना मानव पूँजी में निवेश: मशीन खरीदने की तरह, यह अभी लागत पर बाद में लौटाता, क्योंकि कुशल, स्वस्थ कामगार अशिक्षित, रुग्ण से कहीं अधिक उत्पादित करता; अतः आबादी बोझ से अर्थव्यवस्था की सबसे उत्पादक संपत्ति में बदलती",
            mr: "लोकांना शिक्षित आणि निरोगी ठेवणे मानवी भांडवलातील गुंतवणूक: यंत्र विकत घेण्यासारखे, तो आता खर्च पण नंतर परत करतो, कारण कुशल, निरोगी कामगार अशिक्षित, आजारी कामगाराहून कितीतरी अधिक उत्पादित करतो; म्हणून लोकसंख्या ओझ्यातून अर्थव्यवस्थेच्या सर्वांत उत्पादक मालमत्तेत बदलते",
          },
          {
            en: "Spending on people is pure waste and the richer country just got lucky",
            hi: "लोगों पर खर्च शुद्ध बर्बादी और समृद्ध देश बस भाग्यशाली रहा",
            mr: "लोकांवरचा खर्च शुद्ध नासाडी आणि श्रीमंत देश फक्त नशीबवान ठरला",
          },
          {
            en: "The richer country simply printed more money for its schools",
            hi: "समृद्ध देश ने बस अपने स्कूलों को अधिक पैसा छापा",
            mr: "श्रीमंत देशाने फक्त आपल्या शाळांसाठी अधिक पैसा छापला",
          },
          {
            en: "Education and health make no difference to how much a worker can produce",
            hi: "शिक्षा-स्वास्थ्य कामगार कितना उत्पादित कर सके उससे कोई फ़र्क़ नहीं",
            mr: "शिक्षण-आरोग्य कामगार किती उत्पादित करू शकतो त्यात काही फरक करत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The puzzle dissolves once you treat people the way economists treat a factory's machinery — as capital that can be invested in. When a factory owner buys a new machine, the purchase is a cost today, but it is not called waste: it is an investment, made because the machine will produce goods and profit for years to come, repaying its cost many times over. Exactly the same logic applies to human beings, and we call it human capital. Spending on educating a child, training a worker or curing an illness is money laid out now, but it transforms that person's future productivity. An educated, skilled, healthy worker can do more complex and valuable work, make fewer mistakes, adopt new technology, produce more per hour and earn more — vastly outproducing an uneducated, sickly worker over a working life. So the 'cost' of schools and hospitals is really a stake that pays back as a more productive workforce, higher incomes, more output and more tax revenue for decades. This is why the second country, having invested in its people, grows rich while the first, treating its population as merely mouths to feed, stays poor: same number of people, but one turned that population into human capital and the other did not. It also explains how countries poor in natural resources, like Japan, became wealthy — their real wealth was the skill and health of their people, built deliberately through investment. In short, people are not just consumers to be fed; invested in, they become the single most powerful resource an economy has.",
          hi: "पहेली तब घुल जाती जब लोगों को वैसे मानो जैसे अर्थशास्त्री कारख़ाने की मशीनरी — पूँजी जिसमें निवेश किया जा सके। जब कारख़ाना-मालिक नई मशीन खरीदता, ख़रीद आज लागत, पर इसे बर्बादी नहीं कहते: यह निवेश, इसलिए किया क्योंकि मशीन आने वाले वर्षों वस्तु और लाभ उत्पादित करेगी, अपनी लागत कई गुना लौटाती। ठीक वही तर्क मनुष्यों पर लागू, और इसे मानव पूँजी कहते। बच्चे को शिक्षित करने, कामगार को प्रशिक्षित करने या बीमारी के इलाज पर खर्च अभी लगाया पैसा, पर यह उस व्यक्ति की भावी उत्पादकता बदलता। शिक्षित, कुशल, स्वस्थ कामगार अधिक जटिल और मूल्यवान काम कर सकता, कम ग़लतियाँ करता, नई तकनीक अपनाता, प्रति घंटा अधिक उत्पादित कर अधिक कमाता — कार्य-जीवन भर अशिक्षित, रुग्ण कामगार से बहुत अधिक उत्पादित। अतः स्कूलों-अस्पतालों की 'लागत' वास्तव में एक दाँव जो अधिक उत्पादक कार्यबल, ऊँची आय, अधिक उपज और दशकों अधिक कर-राजस्व के रूप में लौटाता। इसी से दूसरा देश, अपने लोगों में निवेश कर, समृद्ध होता जबकि पहला, अपनी आबादी को केवल खिलाने के मुँह मानते, ग़रीब रहता: समान लोग, पर एक ने उस आबादी को मानव पूँजी में बदला और दूसरे ने नहीं। यह भी समझाता कैसे प्राकृतिक संसाधनों में ग़रीब देश, जापान जैसे, समृद्ध हुए — उनका असली धन उनके लोगों का कौशल और स्वास्थ्य, निवेश से जान-बूझकर बनाया। संक्षेप में, लोग केवल खिलाने के उपभोक्ता नहीं; निवेश किए, वे अर्थव्यवस्था का एकमात्र सबसे शक्तिशाली संसाधन बनते।",
          mr: "कोडे तेव्हा विरघळते जेव्हा लोकांना तसे मानता जसे अर्थतज्ज्ञ कारखान्याची यंत्रे — भांडवल ज्यात गुंतवणूक करता येते. जेव्हा कारखाना-मालक नवे यंत्र विकत घेतो, खरेदी आज खर्च, पण त्याला नासाडी म्हणत नाहीत: ती गुंतवणूक, म्हणून केली कारण यंत्र येत्या वर्षांत वस्तू आणि नफा उत्पादित करेल, आपला खर्च अनेक पट परत करत. नेमके तेच तर्कशास्त्र माणसांना लागू, आणि त्याला मानवी भांडवल म्हणतो. मुलाला शिक्षित करायला, कामगाराला प्रशिक्षित करायला वा आजाराच्या इलाजावर खर्च आता लावलेला पैसा, पण तो त्या व्यक्तीची भविष्यातील उत्पादकता बदलतो. शिक्षित, कुशल, निरोगी कामगार अधिक गुंतागुंतीचे आणि मौल्यवान काम करू शकतो, कमी चुका करतो, नवे तंत्रज्ञान अवलंबतो, प्रति तास अधिक उत्पादित करून अधिक कमावतो — कार्य-आयुष्यभर अशिक्षित, आजारी कामगाराहून कितीतरी अधिक उत्पादित. म्हणून शाळा-रुग्णालयांचा 'खर्च' खरे तर एक पैज जी अधिक उत्पादक कामगारवर्ग, उच्च उत्पन्न, अधिक उत्पादन आणि दशके अधिक कर-महसुलाच्या रूपात परत करते. म्हणूनच दुसरा देश, आपल्या लोकांत गुंतवणूक करून, श्रीमंत होतो तर पहिला, आपल्या लोकसंख्येला फक्त पोसायची तोंडे मानत, गरीब राहतो: समान लोक, पण एकाने त्या लोकसंख्येला मानवी भांडवलात बदलले आणि दुसऱ्याने नाही. हे हेही समजावते कसे नैसर्गिक संसाधनांत गरीब देश, जपानसारखे, श्रीमंत झाले — त्यांची खरी संपत्ती त्यांच्या लोकांचे कौशल्य आणि आरोग्य, गुंतवणुकीने जाणीवपूर्वक बांधलेली. थोडक्यात, लोक फक्त पोसायचे ग्राहक नाहीत; गुंतवणूक केली, ते अर्थव्यवस्थेचे एकमेव सर्वांत शक्तिशाली संसाधन बनतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Poverty as a Challenge                                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-9-poverty-as-a-challenge",
    subject: "ECONOMICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 3 — Poverty as a Challenge",
      hi: "अध्याय 3 — निर्धनता: एक चुनौती",
      mr: "प्रकरण 3 — दारिद्र्य: एक आव्हान",
    },
    name: {
      en: "Poverty as a Challenge",
      hi: "निर्धनता: एक चुनौती",
      mr: "दारिद्र्य: एक आव्हान",
    },
    summary: {
      en: "Poverty measured and explained: a line drawn below which a person is counted poor, the groups it strikes hardest, the deep causes that keep it turning, and the argument that a rupee line captures too little of what being poor really means.",
      hi: "निर्धनता नापी और समझाई: एक रेखा जिसके नीचे व्यक्ति निर्धन गिना, वे समूह जिन पर यह सबसे कठोर, गहरे कारण जो इसे घुमाते रखते, और यह तर्क कि रुपये की रेखा निर्धन होने के असली अर्थ का बहुत कम पकड़ती।",
      mr: "दारिद्र्य मोजलेले आणि समजावलेले: एक रेषा जिच्याखाली व्यक्ती दरिद्री मोजली, ते गट ज्यांवर हे सर्वांत कठोर, खोल कारणे जी ते फिरत ठेवतात, आणि हा युक्तिवाद की रुपयाची रेषा दरिद्री असण्याचा खरा अर्थ फार कमी पकडते.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "poverty-line",
        name: {
          en: "The poverty line",
          hi: "निर्धनता रेखा",
          mr: "दारिद्र्यरेषा",
        },
        kind: "idea",
        prompt: {
          en: "To count how many are poor, a cutoff level of income or consumption is fixed — the minimum needed for food and bare essentials — and anyone below it is counted as poor. What is this cutoff called?",
          hi: "कितने निर्धन हैं गिनने को, आय या उपभोग का एक कटऑफ़ स्तर तय — भोजन और बुनियादी आवश्यकताओं को न्यूनतम — और इसके नीचे कोई भी निर्धन गिना। इस कटऑफ़ को क्या कहते?",
          mr: "किती दरिद्री आहेत मोजायला, उत्पन्न वा उपभोगाची एक कटऑफ पातळी ठरवली — अन्न आणि मूलभूत गरजांना किमान — आणि तिच्याखाली कोणीही दरिद्री मोजला. या कटऑफला काय म्हणतात?",
        },
        statement: {
          en: "The poverty line is a cutoff level of income or consumption fixed at the minimum needed for food and basic necessities; anyone living below it is counted as poor.",
          hi: "निर्धनता रेखा आय या उपभोग का कटऑफ़ स्तर जो भोजन और बुनियादी आवश्यकताओं के न्यूनतम पर तय; इसके नीचे जीता कोई भी निर्धन गिना।",
          mr: "दारिद्र्यरेषा उत्पन्न वा उपभोगाची कटऑफ पातळी जी अन्न आणि मूलभूत गरजांच्या किमानावर ठरवली; तिच्याखाली जगणारा कोणीही दरिद्री मोजला.",
        },
        detail: {
          en: "It is worked out from a minimum daily calorie requirement plus the cost of clothing, footwear, fuel and a few other basics, converted into a rupee figure.",
          hi: "यह न्यूनतम दैनिक कैलोरी आवश्यकता जमा कपड़े, जूते, ईंधन और कुछ अन्य बुनियादी वस्तुओं की लागत से निकाली, रुपये के आँकड़े में बदली।",
          mr: "ती किमान दैनिक कॅलरी गरज अधिक कपडे, पादत्राणे, इंधन आणि काही इतर मूलभूत वस्तूंच्या खर्चातून काढली, रुपयाच्या आकड्यात बदलली.",
        },
        extra: {
          en: "The line is higher in cities than villages, because things like housing and transport cost more in town, so more rupees are needed there for the same basics.",
          hi: "रेखा गाँवों से शहरों में ऊँची, क्योंकि आवास-परिवहन जैसी चीज़ें नगर में अधिक क़ीमती, अतः वहाँ उन्हीं बुनियादी को अधिक रुपये चाहिए।",
          mr: "रेषा गावांहून शहरांत उंच, कारण घर-वाहतुकीसारख्या गोष्टी शहरात अधिक महाग, म्हणून तिथे त्याच मूलभूतांना अधिक रुपये हवेत.",
        },
        pair: {
          left: {
            en: "The income cutoff for counting the poor",
            hi: "निर्धन गिनने की आय-कटऑफ़",
            mr: "दरिद्री मोजण्याची उत्पन्न-कटऑफ",
          },
          right: {
            en: "the poverty line",
            hi: "निर्धनता रेखा",
            mr: "दारिद्र्यरेषा",
          },
        },
      },
      {
        id: "vulnerable-groups",
        name: {
          en: "The most vulnerable groups",
          hi: "सबसे संवेदनशील समूह",
          mr: "सर्वांत असुरक्षित गट",
        },
        kind: "idea",
        prompt: {
          en: "Poverty does not fall evenly — it strikes hardest at Scheduled Caste and Scheduled Tribe families, casual labourers and the landless, and among them women, the old and children suffer most. What does this uneven burden identify?",
          hi: "निर्धनता समान नहीं पड़ती — यह अनुसूचित जाति-जनजाति परिवारों, दिहाड़ी मज़दूरों और भूमिहीनों पर सबसे कठोर, और उनमें स्त्रियाँ, बूढ़े और बच्चे सबसे अधिक झेलते। यह असमान बोझ क्या पहचानता?",
          mr: "दारिद्र्य समान पडत नाही — ते अनुसूचित जाती-जमाती कुटुंबे, रोजंदारी मजूर आणि भूमिहीनांवर सर्वांत कठोर, आणि त्यांत स्त्रिया, वृद्ध आणि मुले सर्वांत जास्त सोसतात. हे असमान ओझे काय ओळखते?",
        },
        statement: {
          en: "Poverty falls hardest on certain vulnerable groups — Scheduled Caste and Scheduled Tribe households, casual labourers and the landless — and within any poor family, women, the elderly and children bear the worst of it.",
          hi: "निर्धनता कुछ संवेदनशील समूहों पर सबसे कठोर पड़ती — अनुसूचित जाति-जनजाति परिवार, दिहाड़ी मज़दूर और भूमिहीन — और किसी भी निर्धन परिवार में स्त्रियाँ, बूढ़े और बच्चे इसका सबसे बुरा झेलते।",
          mr: "दारिद्र्य काही असुरक्षित गटांवर सर्वांत कठोर पडते — अनुसूचित जाती-जमाती कुटुंबे, रोजंदारी मजूर आणि भूमिहीन — आणि कोणत्याही दरिद्री कुटुंबात स्त्रिया, वृद्ध आणि मुले याचे सर्वांत वाईट सोसतात.",
        },
        detail: {
          en: "This shows poverty is not just about lack of money but is tangled with old social inequalities of caste, land and gender.",
          hi: "यह दिखाता निर्धनता केवल पैसे की कमी नहीं बल्कि जाति, भूमि और लिंग की पुरानी सामाजिक असमानताओं से उलझी।",
          mr: "हे दाखवते दारिद्र्य फक्त पैशाची कमतरता नव्हे तर जात, जमीन आणि लिंगाच्या जुन्या सामाजिक असमानतांशी गुंतलेले.",
        },
        extra: {
          en: "So the poorest of the poor is often a landless Dalit or Adivasi woman — hit at once by caste, by having no land, and by her gender.",
          hi: "अतः निर्धनतम अक्सर एक भूमिहीन दलित या आदिवासी स्त्री — एक साथ जाति, बिना भूमि, और अपने लिंग से मारी।",
          mr: "म्हणून दरिद्रीतम अनेकदा एक भूमिहीन दलित वा आदिवासी स्त्री — एकाच वेळी जात, जमीन नसणे, आणि आपल्या लिंगाने मारलेली.",
        },
        pair: {
          left: {
            en: "SC/ST, landless, casual labour hit hardest",
            hi: "SC/ST, भूमिहीन, दिहाड़ी सबसे कठोर मारे",
            mr: "SC/ST, भूमिहीन, रोजंदारी सर्वांत कठोर मारले",
          },
          right: {
            en: "the most vulnerable groups",
            hi: "सबसे संवेदनशील समूह",
            mr: "सर्वांत असुरक्षित गट",
          },
        },
      },
      {
        id: "causes-of-poverty",
        name: {
          en: "The causes of poverty",
          hi: "निर्धनता के कारण",
          mr: "दारिद्र्याची कारणे",
        },
        kind: "idea",
        prompt: {
          en: "India's mass poverty has deep roots — a stagnant colonial economy, slow job growth, unequal ownership of land, rising population pressure and the trap of debt. What does this tangle of reasons explain?",
          hi: "भारत की व्यापक निर्धनता की गहरी जड़ें — ठहरी औपनिवेशिक अर्थव्यवस्था, धीमी रोज़गार-वृद्धि, भूमि का असमान स्वामित्व, बढ़ता जनसंख्या दबाव और क़र्ज़ का जाल। कारणों का यह उलझाव क्या समझाता?",
          mr: "भारताच्या व्यापक दारिद्र्याची खोल मुळे — थांबलेली वसाहती अर्थव्यवस्था, मंद रोजगार-वाढ, जमिनीची असमान मालकी, वाढता लोकसंख्या दाब आणि कर्जाचा सापळा. कारणांचा हा गुंता काय समजावतो?",
        },
        statement: {
          en: "The causes of poverty are historical and structural — a colonial economy that held India back, slow growth of jobs, hugely unequal ownership of land, population pressure, and the grip of indebtedness.",
          hi: "निर्धनता के कारण ऐतिहासिक और संरचनात्मक — औपनिवेशिक अर्थव्यवस्था जिसने भारत को रोका, रोज़गार की धीमी वृद्धि, भूमि का अत्यधिक असमान स्वामित्व, जनसंख्या दबाव, और ऋणग्रस्तता की पकड़।",
          mr: "दारिद्र्याची कारणे ऐतिहासिक आणि संरचनात्मक — वसाहती अर्थव्यवस्था जिने भारताला रोखले, रोजगाराची मंद वाढ, जमिनीची अत्यंत असमान मालकी, लोकसंख्या दाब, आणि कर्जबाजारीपणाची पकड.",
        },
        detail: {
          en: "Colonial rule stunted India's industries and drained its wealth, so the country began independent life already poor, with too few jobs for its people.",
          hi: "औपनिवेशिक शासन ने भारत के उद्योग रोके और इसका धन निकाला, अतः देश स्वतंत्र जीवन पहले से निर्धन शुरू, अपने लोगों को बहुत कम रोज़गार के साथ।",
          mr: "वसाहती राज्याने भारताचे उद्योग खुंटवले आणि त्याची संपत्ती काढली, म्हणून देश स्वतंत्र जीवन आधीच दरिद्री सुरू, आपल्या लोकांना फार कमी रोजगारासह.",
        },
        extra: {
          en: "Debt often deepens poverty: a poor farmer borrows for seed or a wedding, then the interest swallows so much that he can never climb out.",
          hi: "क़र्ज़ अक्सर निर्धनता गहराता: निर्धन किसान बीज या शादी को उधार लेता, फिर ब्याज इतना निगलता कि वह कभी बाहर नहीं चढ़ पाता।",
          mr: "कर्ज अनेकदा दारिद्र्य खोल करते: दरिद्री शेतकरी बियाणे वा लग्नाला उधार घेतो, मग व्याज इतके गिळते की तो कधी बाहेर चढू शकत नाही.",
        },
        pair: {
          left: {
            en: "Colonial legacy, few jobs, unequal land, debt",
            hi: "औपनिवेशिक विरासत, कम रोज़गार, असमान भूमि, क़र्ज़",
            mr: "वसाहती वारसा, कमी रोजगार, असमान जमीन, कर्ज",
          },
          right: {
            en: "the causes of poverty",
            hi: "निर्धनता के कारण",
            mr: "दारिद्र्याची कारणे",
          },
        },
      },
      {
        id: "anti-poverty-measures",
        name: {
          en: "Anti-poverty measures",
          hi: "निर्धनता-निवारण उपाय",
          mr: "दारिद्र्य-निवारण उपाय",
        },
        kind: "idea",
        prompt: {
          en: "The government fights poverty by promoting overall economic growth and by running targeted schemes — guaranteed wage employment, self-employment loans, and support for the poorest. What are these efforts called?",
          hi: "सरकार समग्र आर्थिक वृद्धि को बढ़ावा और लक्षित योजनाएँ चलाकर निर्धनता से लड़ती — गारंटीशुदा मज़दूरी रोज़गार, स्वरोज़गार ऋण, और निर्धनतम को सहारा। इन प्रयासों को क्या कहते?",
          mr: "सरकार समग्र आर्थिक वाढीला चालना आणि लक्ष्यित योजना चालवून दारिद्र्याशी लढते — हमी दिलेला मजुरी रोजगार, स्वयंरोजगार कर्ज, आणि दरिद्रीतमांना आधार. या प्रयत्नांना काय म्हणतात?",
        },
        statement: {
          en: "Anti-poverty measures combine promoting broad economic growth with targeted schemes — guaranteed wage employment, self-employment loans, and food and support programmes aimed directly at the poor.",
          hi: "निर्धनता-निवारण उपाय व्यापक आर्थिक वृद्धि को बढ़ावा देने को लक्षित योजनाओं से जोड़ते — गारंटीशुदा मज़दूरी रोज़गार, स्वरोज़गार ऋण, और सीधे निर्धनों को लक्षित भोजन-सहायता कार्यक्रम।",
          mr: "दारिद्र्य-निवारण उपाय व्यापक आर्थिक वाढीला चालना देण्याला लक्ष्यित योजनांशी जोडतात — हमी दिलेला मजुरी रोजगार, स्वयंरोजगार कर्ज, आणि थेट दरिद्रींना लक्ष्यित अन्न-मदत कार्यक्रम.",
        },
        detail: {
          en: "One well-known scheme guarantees rural households a set number of days of paid work each year, giving the poor a fallback when no other work is found.",
          hi: "एक प्रसिद्ध योजना ग्रामीण परिवारों को हर वर्ष नियत दिनों का वेतनयुक्त काम गारंटी करती, निर्धनों को कोई अन्य काम न मिलने पर सहारा देती।",
          mr: "एक प्रसिद्ध योजना ग्रामीण कुटुंबांना दरवर्षी ठराविक दिवसांचे वेतनयुक्त काम हमी देते, दरिद्रींना दुसरे काम न मिळाल्यावर आधार देत.",
        },
        extra: {
          en: "Growth alone is not enough — without schemes aimed at them, the poorest are often left out of the prosperity a growing economy brings.",
          hi: "वृद्धि अकेली काफ़ी नहीं — उन्हें लक्षित योजनाओं बिना, निर्धनतम अक्सर बढ़ती अर्थव्यवस्था की समृद्धि से छूट जाते।",
          mr: "वाढ एकटी पुरेशी नाही — त्यांना लक्ष्यित योजनांविना, दरिद्रीतम अनेकदा वाढत्या अर्थव्यवस्थेच्या समृद्धीतून वगळले जातात.",
        },
        pair: {
          left: {
            en: "Growth plus schemes aimed at the poor",
            hi: "वृद्धि साथ निर्धनों को लक्षित योजनाएँ",
            mr: "वाढ अधिक दरिद्रींना लक्ष्यित योजना",
          },
          right: {
            en: "anti-poverty measures",
            hi: "निर्धनता-निवारण उपाय",
            mr: "दारिद्र्य-निवारण उपाय",
          },
        },
      },
      {
        id: "human-poverty",
        name: {
          en: "Poverty beyond income",
          hi: "आय से परे निर्धनता",
          mr: "उत्पन्नापलीकडे दारिद्र्य",
        },
        kind: "idea",
        prompt: {
          en: "A person just above the rupee poverty line may still have no schooling, poor health, no clean water and no voice — hardships that money-counting misses. What broader view of poverty captures these?",
          hi: "रुपये की निर्धनता रेखा से ठीक ऊपर व्यक्ति के पास अब भी कोई शिक्षा, ख़राब स्वास्थ्य, कोई स्वच्छ पानी और कोई आवाज़ न हो — कष्ट जो पैसा-गिनना चूकता। निर्धनता का कौन-सा व्यापक दृष्टिकोण इन्हें पकड़ता?",
          mr: "रुपयाच्या दारिद्र्यरेषेच्या नेमके वर व्यक्तीकडे अजून कोणतेही शिक्षण, वाईट आरोग्य, स्वच्छ पाणी नाही आणि आवाज नाही — हालअपेष्टा ज्या पैसा-मोजणी चुकवते. दारिद्र्याचा कोणता व्यापक दृष्टिकोन हे पकडतो?",
        },
        statement: {
          en: "A broader view sees poverty as more than low income — it is also the lack of education, health care, clean water, sanitation, security and dignity, deprivations a mere rupee line cannot measure.",
          hi: "एक व्यापक दृष्टिकोण निर्धनता को कम आय से अधिक देखता — यह शिक्षा, स्वास्थ्य सेवा, स्वच्छ पानी, स्वच्छता, सुरक्षा और गरिमा की कमी भी, वंचनाएँ जो मात्र रुपये की रेखा नहीं नाप सकती।",
          mr: "एक व्यापक दृष्टिकोन दारिद्र्याला कमी उत्पन्नाहून अधिक पाहतो — ते शिक्षण, आरोग्य सेवा, स्वच्छ पाणी, स्वच्छता, सुरक्षा आणि प्रतिष्ठेची कमतरताही, वंचना ज्या केवळ रुपयाची रेषा मोजू शकत नाही.",
        },
        detail: {
          en: "By this fuller measure, two families with the same income can be very unequally poor, if one has a school and clinic nearby and the other has neither.",
          hi: "इस पूर्ण माप से, समान आय वाले दो परिवार बहुत असमान निर्धन हो सकते, यदि एक के पास पास में स्कूल-क्लिनिक और दूसरे के पास कोई नहीं।",
          mr: "या पूर्ण मापाने, समान उत्पन्न असलेली दोन कुटुंबे अतिशय असमान दरिद्री असू शकतात, जर एकाकडे जवळ शाळा-दवाखाना आणि दुसऱ्याकडे काहीच नाही.",
        },
        extra: {
          en: "This is why modern goals speak of 'human poverty' and target schooling, health and dignity, not just raising incomes above a line.",
          hi: "इसी से आधुनिक लक्ष्य 'मानव निर्धनता' की बात करते और शिक्षा, स्वास्थ्य और गरिमा को लक्षित करते, केवल आय को रेखा से ऊपर उठाना नहीं।",
          mr: "म्हणूनच आधुनिक ध्येये 'मानवी दारिद्र्या'ची बात करतात आणि शिक्षण, आरोग्य आणि प्रतिष्ठेला लक्ष्य करतात, फक्त उत्पन्न रेषेच्या वर उंचावणे नाही.",
        },
        pair: {
          left: {
            en: "Lacking schooling, health and dignity, not just money",
            hi: "केवल पैसा नहीं, शिक्षा-स्वास्थ्य-गरिमा की कमी",
            mr: "फक्त पैसा नव्हे, शिक्षण-आरोग्य-प्रतिष्ठेची कमतरता",
          },
          right: {
            en: "poverty beyond income",
            hi: "आय से परे निर्धनता",
            mr: "उत्पन्नापलीकडे दारिद्र्य",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The official poverty line is worked out mainly from the money needed to buy a minimum of calories and a few basics. Critics say a family lifted just above this line can still be desperately deprived. What is the weakness in measuring poverty by a rupee line alone?",
          hi: "आधिकारिक निर्धनता रेखा मुख्यतः न्यूनतम कैलोरी और कुछ बुनियादी वस्तुएँ खरीदने को चाहिए पैसे से निकाली जाती। आलोचक कहते इस रेखा से ठीक ऊपर उठा परिवार अब भी बुरी तरह वंचित हो सकता। केवल रुपये की रेखा से निर्धनता नापने में कमज़ोरी क्या?",
          mr: "अधिकृत दारिद्र्यरेषा मुख्यतः किमान कॅलरी आणि काही मूलभूत वस्तू विकत घ्यायला हव्या पैशातून काढली जाते. टीकाकार म्हणतात या रेषेच्या नेमके वर उचललेले कुटुंब अजून वाईट रीतीने वंचित असू शकते. फक्त रुपयाच्या रेषेने दारिद्र्य मोजण्यातील कमजोरी काय?",
        },
        choices: [
          {
            en: "A rupee-and-calorie line captures only the barest survival needs and ignores education, health care, clean water, sanitation, security and dignity; so someone counted 'not poor' for being just above it may still lack almost everything that makes a decent life",
            hi: "रुपये-और-कैलोरी की रेखा केवल सबसे नंगी जीवित रहने की ज़रूरतें पकड़ती और शिक्षा, स्वास्थ्य सेवा, स्वच्छ पानी, स्वच्छता, सुरक्षा और गरिमा अनदेखी करती; अतः इससे ठीक ऊपर होने से 'निर्धन नहीं' गिना कोई अब भी लगभग सब कुछ जो शालीन जीवन बनाता उससे वंचित हो सकता",
            mr: "रुपया-आणि-कॅलरीची रेषा फक्त अगदी उघड्या जगण्याच्या गरजा पकडते आणि शिक्षण, आरोग्य सेवा, स्वच्छ पाणी, स्वच्छता, सुरक्षा आणि प्रतिष्ठा दुर्लक्षते; म्हणून तिच्या नेमके वर असल्याने 'दरिद्री नाही' मोजलेला कोणी अजून जवळपास सारे जे सभ्य जीवन बनवते त्यापासून वंचित असू शकतो",
          },
          {
            en: "There is no weakness; income measures capture everything about being poor",
            hi: "कोई कमज़ोरी नहीं; आय-माप निर्धन होने के बारे में सब कुछ पकड़ते",
            mr: "कोणतीही कमजोरी नाही; उत्पन्न-मापे दरिद्री असण्याबद्दल सारे पकडतात",
          },
          {
            en: "The line is wrong only because it is measured in rupees rather than dollars",
            hi: "रेखा ग़लत केवल इसलिए कि यह डॉलर के बजाय रुपये में नापी",
            mr: "रेषा चुकीची फक्त म्हणून की ती डॉलरऐवजी रुपयात मोजली",
          },
          {
            en: "The problem is that the line is set far too high for anyone to fall below",
            hi: "समस्या कि रेखा किसी के नीचे गिरने को बहुत ऊँची तय",
            mr: "समस्या की रेषा कोणाच्या खाली पडायला फार उंच ठरवली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The criticism gets at a real limitation of how poverty is officially measured. The standard poverty line is built from a bare minimum: roughly the money needed to buy enough food to meet a calorie requirement, plus a small allowance for a few essentials like clothing and fuel. That gives a single rupee figure, and everyone below it is 'poor' while everyone above it is 'not poor'. The trouble is that this line captures only physical survival, and being genuinely not-poor means far more than not starving. A family lifted a rupee above the line might still have children who never see the inside of a school, no doctor or clinic within reach, no clean drinking water or toilet, no safety from violence, and no real say in the decisions that shape their lives. None of these deprivations shows up in the calorie-and-rupee calculation, yet each is central to a decent human life. So the number can badly understate real hardship: it treats 'able to buy enough calories' as the finish line, when in truth it is barely the starting point. This is why economists and bodies like the UN increasingly speak of 'human poverty', measuring deprivation in education, health, sanitation and dignity alongside income. The rupee line is still useful as a rough, comparable count, but read alone it hides how much of what makes a life livable the officially 'non-poor' may still lack.",
          hi: "आलोचना निर्धनता को आधिकारिक रूप से कैसे नापा जाता उसकी असली सीमा पकड़ती। मानक निर्धनता रेखा एक नंगे न्यूनतम से बनी: मोटे तौर कैलोरी आवश्यकता पूरी करने भर भोजन खरीदने का पैसा, जमा कपड़े-ईंधन जैसी कुछ आवश्यक वस्तुओं का छोटा भत्ता। यह एक अकेला रुपये का आँकड़ा देता, और इसके नीचे सब 'निर्धन' जबकि ऊपर सब 'निर्धन नहीं'। मुसीबत कि यह रेखा केवल शारीरिक जीवित रहना पकड़ती, और सचमुच निर्धन-न-होने का अर्थ भूखे न रहने से कहीं अधिक। रेखा से एक रुपया ऊपर उठे परिवार के बच्चे अब भी स्कूल का भीतर कभी न देखें, पहुँच में कोई डॉक्टर-क्लिनिक नहीं, कोई स्वच्छ पेय जल या शौचालय नहीं, हिंसा से कोई सुरक्षा नहीं, और अपने जीवन गढ़ते निर्णयों में कोई असली आवाज़ नहीं। इनमें से कोई वंचना कैलोरी-और-रुपये गणना में नहीं दिखती, फिर भी हर एक शालीन मानव जीवन को केंद्रीय। अतः संख्या असली कष्ट को बुरी तरह कम आँक सकती: यह 'पर्याप्त कैलोरी खरीद सकना' को समाप्ति-रेखा मानती, जबकि सच में यह मुश्किल से आरंभ-बिंदु। इसी से अर्थशास्त्री और UN जैसे निकाय बढ़ते 'मानव निर्धनता' की बात करते, आय के साथ शिक्षा, स्वास्थ्य, स्वच्छता और गरिमा में वंचना नापते। रुपये की रेखा एक मोटी, तुलनीय गिनती के रूप में अब भी उपयोगी, पर अकेली पढ़ी यह छिपाती कि जीवन जीने योग्य बनाते कितने का आधिकारिक 'निर्धन-नहीं' अब भी अभाव।",
          mr: "टीका दारिद्र्य अधिकृतपणे कसे मोजले जाते त्याची खरी मर्यादा पकडते. प्रमाण दारिद्र्यरेषा एका उघड्या किमानातून बनली: ढोबळमानाने कॅलरी गरज पूर्ण करण्याइतके अन्न विकत घ्यायचा पैसा, अधिक कपडे-इंधनासारख्या काही आवश्यक वस्तूंचा लहान भत्ता. ते एक एकटा रुपयाचा आकडा देते, आणि तिच्याखाली सारे 'दरिद्री' तर वर सारे 'दरिद्री नाही'. अडचण की ही रेषा फक्त शारीरिक जगणे पकडते, आणि खरोखर दरिद्री-न-असणे म्हणजे उपाशी न राहण्याहून कितीतरी अधिक. रेषेच्या एक रुपया वर उचललेल्या कुटुंबाची मुले अजून शाळेचा आत कधी न पाहोत, आवाक्यात कोणी डॉक्टर-दवाखाना नाही, स्वच्छ पिण्याचे पाणी वा शौचालय नाही, हिंसेपासून सुरक्षा नाही, आणि आपले जीवन घडवणाऱ्या निर्णयांत खरा आवाज नाही. यांतली कोणतीही वंचना कॅलरी-आणि-रुपया गणनेत दिसत नाही, तरी प्रत्येक सभ्य मानवी जीवनाला मध्यवर्ती. म्हणून संख्या खरे हाल वाईट रीतीने कमी लेखू शकते: ती 'पुरेशा कॅलरी विकत घेता येणे' समाप्ती-रेषा मानते, तर खरे तर ती जेमतेम सुरुवात-बिंदू. म्हणूनच अर्थतज्ज्ञ आणि UN सारखे निकाय वाढत 'मानवी दारिद्र्या'ची बात करतात, उत्पन्नासोबत शिक्षण, आरोग्य, स्वच्छता आणि प्रतिष्ठेतील वंचना मोजत. रुपयाची रेषा एका ढोबळ, तुलनीय मोजणीसाठी अजून उपयुक्त, पण एकटी वाचली ती लपवते की जीवन जगण्याजोगे बनवणाऱ्या किती गोष्टींची अधिकृत 'दरिद्री-नाही' अजून वानवा.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Poverty is often described as a vicious cycle that repeats from parents to children. What does this mean, and why can poor families find it so hard to escape poverty on their own?",
          hi: "निर्धनता अक्सर एक दुष्चक्र बताई जाती जो माता-पिता से बच्चों तक दोहराता। इसका क्या अर्थ, और निर्धन परिवार स्वयं निर्धनता से बचना इतना कठिन क्यों पाते?",
          mr: "दारिद्र्य अनेकदा एक दुष्टचक्र म्हणून वर्णिले जाते जे पालकांपासून मुलांपर्यंत पुनरावृत्त होते. याचा काय अर्थ, आणि दरिद्री कुटुंबे स्वतः दारिद्र्यातून सुटणे इतके कठीण का पाहतात?",
        },
        choices: [
          {
            en: "Poverty starves children of schooling, food and health, so they grow into low-earning adults who in turn cannot afford schooling, food and health for their own children — low income and low human capital feed each other, trapping family after family until outside help breaks the loop",
            hi: "निर्धनता बच्चों को शिक्षा, भोजन और स्वास्थ्य से वंचित करती, अतः वे कम-कमाते वयस्क बनते जो बदले में अपने बच्चों को शिक्षा, भोजन और स्वास्थ्य नहीं दे सकते — कम आय और कम मानव पूँजी एक-दूसरे को पालते, परिवार-दर-परिवार फँसाते जब तक बाहरी मदद फंदा न तोड़े",
            mr: "दारिद्र्य मुलांना शिक्षण, अन्न आणि आरोग्यापासून वंचित करते, म्हणून ते कमी-कमावणारे प्रौढ बनतात जे त्याबदल्यात आपल्या मुलांना शिक्षण, अन्न आणि आरोग्य देऊ शकत नाहीत — कमी उत्पन्न आणि कमी मानवी भांडवल एकमेकांना पोसतात, कुटुंबामागून कुटुंब अडकवत जोवर बाहेरची मदत फास तोडत नाही",
          },
          {
            en: "It means poor families simply do not want to work hard enough",
            hi: "इसका अर्थ निर्धन परिवार बस पर्याप्त मेहनत नहीं करना चाहते",
            mr: "याचा अर्थ दरिद्री कुटुंबे फक्त पुरेशी मेहनत करू इच्छित नाहीत",
          },
          {
            en: "It means poverty always disappears by itself within one generation",
            hi: "इसका अर्थ निर्धनता सदा एक पीढ़ी में स्वयं ग़ायब हो जाती",
            mr: "याचा अर्थ दारिद्र्य नेहमी एका पिढीत आपोआप नाहीसे होते",
          },
          {
            en: "It means the children of the poor are born less capable than others",
            hi: "इसका अर्थ निर्धनों के बच्चे दूसरों से कम सक्षम जन्मते",
            mr: "याचा अर्थ दरिद्रींची मुले इतरांहून कमी सक्षम जन्मतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The 'vicious cycle of poverty' describes how poverty tends to reproduce itself across generations, not because of any fault or lack of will in the poor, but because of how deprivation feeds on itself. Trace the loop. A poor family cannot afford good food, health care or schooling for its children. Those children grow up undernourished, more often sick, and with little or no education or skills — in economic terms, they accumulate very little human capital. As adults with weak health and few skills, they can only get low-paid, insecure work, so they too remain poor. And being poor, they in turn cannot afford good food, health care or schooling for their own children — and the cycle begins again. Low income leads to low investment in the next generation, which leads to low earning capacity, which leads back to low income: each turn of the wheel hands the poverty down. This is why it is so hard for poor families to climb out purely by their own effort: the very thing that would lift them — investing in education and health — is the thing their poverty denies them, and no amount of daily labour by unhealthy, unskilled hands can bridge that gap alone. It is also why outside intervention matters so much. Free or subsidised schooling, health care, nutrition programmes and employment guarantees act from outside the family to break the loop, giving children the human capital their parents could not afford, so the next generation can earn its way out. Breaking the cycle is precisely the aim of anti-poverty measures — the loop rarely breaks on its own.",
          hi: "'निर्धनता का दुष्चक्र' बताता कैसे निर्धनता पीढ़ियों में स्वयं को दोहराती, निर्धनों में किसी दोष या इच्छा-अभाव से नहीं, बल्कि कैसे वंचना स्वयं पर पलती। फंदे को खींचो। निर्धन परिवार अपने बच्चों को अच्छा भोजन, स्वास्थ्य सेवा या शिक्षा नहीं दे सकता। वे बच्चे कुपोषित बड़े होते, अधिक बार बीमार, और थोड़ी या कोई शिक्षा-कौशल के साथ — आर्थिक शब्दों में, वे बहुत कम मानव पूँजी जमा करते। कमज़ोर स्वास्थ्य और कम कौशल वाले वयस्क के रूप में, वे केवल कम-वेतन, असुरक्षित काम पा सकते, अतः वे भी निर्धन रहते। और निर्धन होकर, वे बदले में अपने बच्चों को अच्छा भोजन, स्वास्थ्य सेवा या शिक्षा नहीं दे सकते — और चक्र फिर शुरू। कम आय अगली पीढ़ी में कम निवेश की ओर, जो कम कमाने की क्षमता की ओर, जो वापस कम आय की ओर: पहिये का हर घुमाव निर्धनता नीचे सौंपता। इसी से निर्धन परिवारों को पूरी तरह अपने प्रयास से बाहर चढ़ना इतना कठिन: ठीक वह चीज़ जो उन्हें उठाती — शिक्षा-स्वास्थ्य में निवेश — वही जो उनकी निर्धनता उन्हें नकारती, और अस्वस्थ, अकुशल हाथों की कितनी भी दैनिक मेहनत वह खाई अकेले नहीं पाट सकती। यह भी क्यों बाहरी हस्तक्षेप इतना मायने रखता। मुफ़्त या सब्सिडी शिक्षा, स्वास्थ्य सेवा, पोषण कार्यक्रम और रोज़गार गारंटी परिवार के बाहर से फंदा तोड़ते, बच्चों को वह मानव पूँजी देते जो उनके माता-पिता न दे सके, अतः अगली पीढ़ी अपना रास्ता बाहर कमा सके। चक्र तोड़ना ठीक निर्धनता-निवारण उपायों का लक्ष्य — फंदा स्वयं शायद ही टूटता।",
          mr: "'दारिद्र्याचे दुष्टचक्र' सांगते कसे दारिद्र्य पिढ्यांत स्वतःची पुनरावृत्ती करते, दरिद्रींतल्या कोणत्याही दोषाने वा इच्छा-अभावाने नाही, तर कशी वंचना स्वतःवर पोसते. फास खेचा. दरिद्री कुटुंब आपल्या मुलांना चांगले अन्न, आरोग्य सेवा वा शिक्षण देऊ शकत नाही. ती मुले कुपोषित वाढतात, अधिक वेळा आजारी, आणि थोडे वा कोणतेही शिक्षण-कौशल्यासह — आर्थिक भाषेत, ती फार कमी मानवी भांडवल साठवतात. कमजोर आरोग्य आणि कमी कौशल्याचे प्रौढ म्हणून, ते फक्त कमी-वेतन, असुरक्षित काम मिळवू शकतात, म्हणून तेही दरिद्री राहतात. आणि दरिद्री असल्याने, ते त्याबदल्यात आपल्या मुलांना चांगले अन्न, आरोग्य सेवा वा शिक्षण देऊ शकत नाहीत — आणि चक्र पुन्हा सुरू. कमी उत्पन्न पुढच्या पिढीत कमी गुंतवणुकीकडे, जे कमी कमावण्याच्या क्षमतेकडे, जे परत कमी उत्पन्नाकडे: चाकाचा प्रत्येक फेरा दारिद्र्य खाली सोपवतो. म्हणूनच दरिद्री कुटुंबांना पूर्णपणे आपल्या प्रयत्नाने बाहेर चढणे इतके कठीण: नेमकी ती गोष्ट जी त्यांना उचलेल — शिक्षण-आरोग्यातील गुंतवणूक — तीच जी त्यांचे दारिद्र्य त्यांना नाकारते, आणि अस्वस्थ, अकुशल हातांची कितीही दैनिक मेहनत ती दरी एकटी भरू शकत नाही. हे हेही का बाहेरचा हस्तक्षेप इतका महत्त्वाचा. फुकट वा अनुदानित शिक्षण, आरोग्य सेवा, पोषण कार्यक्रम आणि रोजगार हमी कुटुंबाबाहेरून फास तोडतात, मुलांना ते मानवी भांडवल देत जे त्यांचे पालक देऊ शकले नाहीत, म्हणून पुढची पिढी आपला मार्ग बाहेर कमवू शकते. चक्र तोडणे नेमके दारिद्र्य-निवारण उपायांचे ध्येय — फास स्वतः क्वचित तुटतो.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Food Security in India                                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-9-food-security",
    subject: "ECONOMICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 4 — Food Security in India",
      hi: "अध्याय 4 — भारत में खाद्य सुरक्षा",
      mr: "प्रकरण 4 — भारतातील अन्नसुरक्षा",
    },
    name: {
      en: "Food Security in India",
      hi: "भारत में खाद्य सुरक्षा",
      mr: "भारतातील अन्नसुरक्षा",
    },
    summary: {
      en: "Keeping a nation fed at all times: food that must be not only grown but reachable and affordable to the poorest, the buffer stock the state builds by buying grain at a fair price, the ration shops that pass it on cheaply, and the hard truth that full granaries do not by themselves end hunger.",
      hi: "एक राष्ट्र को हर समय खिलाए रखना: अन्न जो न केवल उगाना बल्कि निर्धनतम तक पहुँच योग्य और वहनीय हो, वह बफ़र स्टॉक जो राज्य उचित क़ीमत पर अन्न खरीदकर बनाता, वे राशन दुकानें जो इसे सस्ते आगे देतीं, और यह कठोर सत्य कि भरे गोदाम स्वयं भूख समाप्त नहीं करते।",
      mr: "एका राष्ट्राला सर्वकाळ पोसलेले ठेवणे: अन्न जे केवळ पिकवायचे नव्हे तर दरिद्रीतमांपर्यंत पोहोचण्याजोगे आणि परवडणारे असावे, तो बफर साठा जो राज्य वाजवी किमतीला धान्य विकत घेऊन बनवते, त्या रेशन दुकाने जी ते स्वस्तात पुढे देतात, आणि हे कठोर सत्य की भरलेली गोदामे स्वतः भूक संपवत नाहीत.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "food-security-meaning",
        name: {
          en: "The meaning of food security",
          hi: "खाद्य सुरक्षा का अर्थ",
          mr: "अन्नसुरक्षेचा अर्थ",
        },
        kind: "idea",
        prompt: {
          en: "A country is truly food-secure only when enough food exists, everyone can physically reach it, and even the poorest can afford it — at all times. What is this three-part guarantee called?",
          hi: "देश तभी सचमुच खाद्य-सुरक्षित जब पर्याप्त अन्न मौजूद, हर कोई इस तक भौतिक पहुँच रखे, और निर्धनतम भी इसे वहन कर सके — हर समय। इस तीन-भाग गारंटी को क्या कहते?",
          mr: "देश तेव्हाच खरोखर अन्न-सुरक्षित जेव्हा पुरेसे अन्न अस्तित्वात, प्रत्येक त्यापर्यंत भौतिक पोहोच राखे, आणि दरिद्रीतमही ते परवडू शके — सर्वकाळ. या तीन-भाग हमीला काय म्हणतात?",
        },
        statement: {
          en: "Food security means food is available, accessible and affordable to all people at all times — enough food must exist, everyone must be able to reach it, and even the poorest must be able to buy it.",
          hi: "खाद्य सुरक्षा का अर्थ अन्न सभी लोगों को हर समय उपलब्ध, पहुँच योग्य और वहनीय — पर्याप्त अन्न मौजूद हो, हर कोई इस तक पहुँच सके, और निर्धनतम भी इसे खरीद सके।",
          mr: "अन्नसुरक्षा म्हणजे अन्न सर्व लोकांना सर्वकाळ उपलब्ध, पोहोचण्याजोगे आणि परवडणारे — पुरेसे अन्न अस्तित्वात असावे, प्रत्येक त्यापर्यंत पोहोचू शके, आणि दरिद्रीतमही ते विकत घेऊ शके.",
        },
        detail: {
          en: "All three must hold together — plenty of grain in the country is no use to a family that lives too far from a market or is too poor to buy any.",
          hi: "तीनों साथ टिकें — देश में भरपूर अन्न उस परिवार के किसी काम का नहीं जो बाज़ार से बहुत दूर रहे या कोई खरीदने बहुत निर्धन।",
          mr: "तिन्ही एकत्र टिकावे — देशात भरपूर धान्य त्या कुटुंबाच्या कोणत्याही उपयोगाचे नाही जे बाजारापासून फार दूर राहते वा काही विकत घ्यायला फार दरिद्री.",
        },
        extra: {
          en: "'At all times' matters too — food security means being safe from hunger not just in a good year but through droughts, floods and lean seasons.",
          hi: "'हर समय' भी मायने रखता — खाद्य सुरक्षा का अर्थ भूख से सुरक्षित रहना केवल अच्छे वर्ष नहीं बल्कि सूखों, बाढ़ों और दुबले मौसमों में भी।",
          mr: "'सर्वकाळ'ही महत्त्वाचे — अन्नसुरक्षा म्हणजे भुकेपासून सुरक्षित राहणे फक्त चांगल्या वर्षी नव्हे तर दुष्काळ, पूर आणि दुबळ्या हंगामांतही.",
        },
        pair: {
          left: {
            en: "Available, accessible and affordable to all, always",
            hi: "सबको, सदा, उपलब्ध, पहुँच योग्य और वहनीय",
            mr: "सर्वांना, सदैव, उपलब्ध, पोहोचण्याजोगे आणि परवडणारे",
          },
          right: {
            en: "food security",
            hi: "खाद्य सुरक्षा",
            mr: "अन्नसुरक्षा",
          },
        },
      },
      {
        id: "buffer-stock",
        name: {
          en: "Buffer stock and MSP",
          hi: "बफ़र स्टॉक और MSP",
          mr: "बफर साठा आणि MSP",
        },
        kind: "idea",
        prompt: {
          en: "The government buys grain from farmers at a guaranteed fair price and stores the surplus in huge warehouses, to be released in times of shortage. What is this stored reserve, and the price at which it is bought, called?",
          hi: "सरकार किसानों से गारंटीशुदा उचित क़ीमत पर अन्न खरीदती और अधिशेष विशाल गोदामों में जमा करती, कमी के समय छोड़ने को। इस जमा भंडार, और जिस क़ीमत पर खरीदा, को क्या कहते?",
          mr: "सरकार शेतकऱ्यांकडून हमी दिलेल्या वाजवी किमतीला धान्य विकत घेते आणि अतिरिक्त प्रचंड गोदामांत साठवते, टंचाईच्या वेळी सोडायला. या साठवलेल्या साठ्याला, आणि ज्या किमतीला विकत घेतले, त्याला काय म्हणतात?",
        },
        statement: {
          en: "The buffer stock is the reserve of grain the government builds by buying wheat and rice from farmers at a guaranteed Minimum Support Price (MSP), storing it to release in times of shortage.",
          hi: "बफ़र स्टॉक वह अन्न-भंडार जो सरकार किसानों से गारंटीशुदा न्यूनतम समर्थन मूल्य (MSP) पर गेहूँ-चावल खरीदकर बनाती, कमी के समय छोड़ने को जमा करती।",
          mr: "बफर साठा तो धान्य-साठा जो सरकार शेतकऱ्यांकडून हमी दिलेल्या किमान आधार किमतीला (MSP) गहू-तांदूळ विकत घेऊन बनवते, टंचाईच्या वेळी सोडायला साठवते.",
        },
        detail: {
          en: "The MSP protects the farmer — it guarantees a fair price so a good harvest does not crash the market and ruin those who grew the food.",
          hi: "MSP किसान को रक्षता — यह उचित क़ीमत गारंटी करता ताकि अच्छी फ़सल बाज़ार न गिराए और अन्न उगाने वालों को बर्बाद न करे।",
          mr: "MSP शेतकऱ्याला रक्षतो — तो वाजवी किंमत हमी देतो जेणेकरून चांगले पीक बाजार पाडणार नाही आणि अन्न पिकवणाऱ्यांना उद्ध्वस्त करणार नाही.",
        },
        extra: {
          en: "The Food Corporation of India does this buying and storing, holding a national reserve against the year a harvest fails.",
          hi: "भारतीय खाद्य निगम यह खरीद-भंडारण करता, उस वर्ष के विरुद्ध राष्ट्रीय भंडार रखते जब फ़सल विफल हो।",
          mr: "भारतीय अन्न महामंडळ हे खरेदी-साठवण करते, त्या वर्षाविरुद्ध राष्ट्रीय साठा राखत जेव्हा पीक अपयशी होते.",
        },
        pair: {
          left: {
            en: "Grain bought at a fair price and stored for shortage",
            hi: "उचित क़ीमत पर खरीदा और कमी को जमा अन्न",
            mr: "वाजवी किमतीला विकत घेतलेले आणि टंचाईला साठवलेले धान्य",
          },
          right: {
            en: "buffer stock and MSP",
            hi: "बफ़र स्टॉक और MSP",
            mr: "बफर साठा आणि MSP",
          },
        },
      },
      {
        id: "public-distribution-system",
        name: {
          en: "The Public Distribution System",
          hi: "सार्वजनिक वितरण प्रणाली",
          mr: "सार्वजनिक वितरण प्रणाली",
        },
        kind: "idea",
        prompt: {
          en: "The grain in the government's stores reaches poor families through a network of ration shops, which sell it to cardholders at prices far below the market. What is this delivery network called?",
          hi: "सरकार के भंडारों का अन्न राशन दुकानों के जाल से निर्धन परिवारों तक पहुँचता, जो इसे कार्डधारकों को बाज़ार से कहीं कम क़ीमतों पर बेचतीं। इस वितरण-जाल को क्या कहते?",
          mr: "सरकारच्या साठ्यांचे धान्य रेशन दुकानांच्या जाळ्यातून दरिद्री कुटुंबांपर्यंत पोहोचते, जी ते कार्डधारकांना बाजाराहून कितीतरी कमी किमतींना विकतात. या वितरण-जाळ्याला काय म्हणतात?",
        },
        statement: {
          en: "The Public Distribution System (PDS) is the network of ration shops through which the government's stored grain is sold to cardholding families at subsidised prices well below the market.",
          hi: "सार्वजनिक वितरण प्रणाली (PDS) राशन दुकानों का जाल जिससे सरकार का जमा अन्न कार्डधारक परिवारों को बाज़ार से कहीं कम रियायती क़ीमतों पर बेचा जाता।",
          mr: "सार्वजनिक वितरण प्रणाली (PDS) रेशन दुकानांचे जाळे ज्यातून सरकारचे साठवलेले धान्य कार्डधारक कुटुंबांना बाजाराहून कितीतरी कमी अनुदानित किमतींना विकले जाते.",
        },
        detail: {
          en: "A family shows its ration card and buys a fixed monthly quota of wheat, rice, sugar and kerosene at these low set prices.",
          hi: "परिवार अपना राशन कार्ड दिखाता और इन कम तय क़ीमतों पर गेहूँ, चावल, चीनी और मिट्टी के तेल का नियत मासिक कोटा खरीदता।",
          mr: "कुटुंब आपले रेशन कार्ड दाखवते आणि या कमी ठरलेल्या किमतींना गहू, तांदूळ, साखर आणि रॉकेलचा ठराविक मासिक कोटा विकत घेते.",
        },
        extra: {
          en: "It is the main channel through which the buffer stock actually turns into food on the plates of the poor.",
          hi: "यह मुख्य माध्यम जिससे बफ़र स्टॉक वास्तव में निर्धनों की थालियों पर अन्न में बदलता।",
          mr: "हे मुख्य माध्यम ज्यातून बफर साठा प्रत्यक्षात दरिद्रींच्या ताटांवर अन्नात बदलतो.",
        },
        pair: {
          left: {
            en: "Ration shops selling cheap grain to cardholders",
            hi: "कार्डधारकों को सस्ता अन्न बेचतीं राशन दुकानें",
            mr: "कार्डधारकांना स्वस्त धान्य विकणारी रेशन दुकाने",
          },
          right: {
            en: "the Public Distribution System",
            hi: "सार्वजनिक वितरण प्रणाली",
            mr: "सार्वजनिक वितरण प्रणाली",
          },
        },
      },
      {
        id: "seasonal-chronic-hunger",
        name: {
          en: "Seasonal and chronic hunger",
          hi: "मौसमी और दीर्घकालिक भूख",
          mr: "हंगामी आणि दीर्घकालीन भूक",
        },
        kind: "idea",
        prompt: {
          en: "Some hunger comes and goes with the farming season or a spell of no work, while another kind is a constant background of never quite having enough to eat. What two forms of hunger does this describe?",
          hi: "कुछ भूख खेती के मौसम या बिना-काम के दौर से आती-जाती, जबकि दूसरा प्रकार कभी पर्याप्त खाने को न होने की एक निरंतर पृष्ठभूमि। यह भूख के कौन-से दो रूप बताता?",
          mr: "काही भूक शेतीच्या हंगामासह वा बिना-कामाच्या काळासह येते-जाते, तर दुसरा प्रकार कधीच पुरेसे खायला नसण्याची एक सतत पार्श्वभूमी. हे भुकेचे कोणते दोन रूप सांगते?",
        },
        statement: {
          en: "Seasonal hunger comes and goes with the crop cycle or spells of no work, while chronic hunger is a constant, ongoing shortage — never having enough food day after day, year after year.",
          hi: "मौसमी भूख फ़सल-चक्र या बिना-काम के दौरों से आती-जाती, जबकि दीर्घकालिक भूख एक निरंतर, चलती कमी — दिन-दर-दिन, वर्ष-दर-वर्ष कभी पर्याप्त अन्न न होना।",
          mr: "हंगामी भूक पीक-चक्र वा बिना-कामाच्या काळांसह येते-जाते, तर दीर्घकालीन भूक एक सतत, चालू टंचाई — दिवसामागून दिवस, वर्षामागून वर्ष कधीच पुरेसे अन्न नसणे.",
        },
        detail: {
          en: "Seasonal hunger hits farm labourers between harvests, when there is no field work and so no wages to buy food.",
          hi: "मौसमी भूख कृषि मज़दूरों को फ़सलों के बीच मारती, जब कोई खेत-काम नहीं और अतः अन्न खरीदने कोई मज़दूरी नहीं।",
          mr: "हंगामी भूक शेतमजुरांना पिकांदरम्यान मारते, जेव्हा कोणतेही शेत-काम नाही आणि म्हणून अन्न विकत घ्यायला कोणतीही मजुरी नाही.",
        },
        extra: {
          en: "Chronic hunger is the deeper problem — it comes not from a bad season but from being so poor that even in normal times the family can never buy enough.",
          hi: "दीर्घकालिक भूख गहरी समस्या — यह ख़राब मौसम से नहीं बल्कि इतने निर्धन होने से कि सामान्य समय में भी परिवार कभी पर्याप्त नहीं खरीद सकता।",
          mr: "दीर्घकालीन भूक खोल समस्या — ती वाईट हंगामातून नव्हे तर इतके दरिद्री असण्यातून की सामान्य वेळीही कुटुंब कधी पुरेसे विकत घेऊ शकत नाही.",
        },
        pair: {
          left: {
            en: "A constant, year-round shortage of food",
            hi: "अन्न की निरंतर, साल भर कमी",
            mr: "अन्नाची सतत, वर्षभर टंचाई",
          },
          right: {
            en: "chronic hunger",
            hi: "दीर्घकालिक भूख",
            mr: "दीर्घकालीन भूक",
          },
        },
      },
      {
        id: "cooperatives",
        name: {
          en: "Cooperatives in food security",
          hi: "खाद्य सुरक्षा में सहकारी",
          mr: "अन्नसुरक्षेत सहकारी संस्था",
        },
        kind: "idea",
        prompt: {
          en: "Beyond the government, groups of people band together to run shops, dairies and grain stores that they own jointly, sharing the gains — as with the famous milk movement. What are such member-owned bodies called?",
          hi: "सरकार से परे, लोगों के समूह मिलकर दुकानें, डेयरी और अन्न-भंडार चलाते जिन्हें वे संयुक्त रूप से रखते, लाभ बाँटते — प्रसिद्ध दुग्ध आंदोलन की तरह। ऐसे सदस्य-स्वामित्व निकायों को क्या कहते?",
          mr: "सरकारपलीकडे, लोकांचे गट मिळून दुकाने, दुग्धशाळा आणि धान्य-साठे चालवतात जे ते संयुक्तपणे बाळगतात, लाभ वाटत — प्रसिद्ध दूध चळवळीसारखे. अशा सदस्य-मालकीच्या निकायांना काय म्हणतात?",
        },
        statement: {
          en: "Cooperatives are bodies owned jointly by their members, who run shops, dairies or grain stores together and share the benefits — an important non-government channel for food security.",
          hi: "सहकारी अपने सदस्यों द्वारा संयुक्त रूप से स्वामित्व निकाय, जो मिलकर दुकानें, डेयरी या अन्न-भंडार चलाते और लाभ बाँटते — खाद्य सुरक्षा का एक महत्वपूर्ण ग़ैर-सरकारी माध्यम।",
          mr: "सहकारी संस्था आपल्या सदस्यांनी संयुक्तपणे मालकीचे निकाय, जे मिळून दुकाने, दुग्धशाळा वा धान्य-साठे चालवतात आणि लाभ वाटतात — अन्नसुरक्षेचे एक महत्त्वाचे बिगर-सरकारी माध्यम.",
        },
        detail: {
          en: "In many places cooperatives run fair-price shops selling low-cost goods, and the Amul milk cooperative shows how they can transform a whole industry.",
          hi: "कई जगह सहकारी उचित-मूल्य दुकानें चलातीं कम-लागत वस्तुएँ बेचतीं, और अमूल दुग्ध सहकारी दिखाती वे कैसे पूरे उद्योग को बदल सकतीं।",
          mr: "अनेक ठिकाणी सहकारी संस्था रास्त-भाव दुकाने चालवतात कमी-किमतीच्या वस्तू विकत, आणि अमूल दूध सहकारी दाखवते त्या कशा अख्ख्या उद्योगाला बदलू शकतात.",
        },
        extra: {
          en: "Because the members own it themselves, a cooperative works for their benefit rather than an outside owner's profit.",
          hi: "क्योंकि सदस्य स्वयं इसे रखते, सहकारी उनके लाभ को काम करती न कि किसी बाहरी मालिक के लाभ को।",
          mr: "कारण सदस्य स्वतः ती बाळगतात, सहकारी त्यांच्या लाभासाठी काम करते न की कोणत्या बाहेरच्या मालकाच्या नफ्यासाठी.",
        },
        pair: {
          left: {
            en: "Member-owned shops and dairies sharing the gains",
            hi: "लाभ बाँटतीं सदस्य-स्वामित्व दुकानें-डेयरी",
            mr: "लाभ वाटणारी सदस्य-मालकीची दुकाने-दुग्धशाळा",
          },
          right: {
            en: "cooperatives",
            hi: "सहकारी",
            mr: "सहकारी संस्था",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "During some years India's government warehouses have overflowed with wheat and rice, grain even rotting for want of storage — and yet in the very same years millions of Indians went hungry. How can a country have too much food and too much hunger at once?",
          hi: "कुछ वर्षों भारत के सरकारी गोदाम गेहूँ-चावल से उमड़े, अन्न भंडारण के अभाव में सड़ता तक — फिर भी ठीक उन्हीं वर्षों करोड़ों भारतीय भूखे रहे। किसी देश के पास एक साथ बहुत अधिक अन्न और बहुत अधिक भूख कैसे हो सकती?",
          mr: "काही वर्षी भारताची सरकारी गोदामे गहू-तांदळाने ओसंडली, धान्य साठवणुकीअभावी कुजतसुद्धा — तरी नेमके त्याच वर्षी कोट्यवधी भारतीय उपाशी राहिले. एखाद्या देशाकडे एकाच वेळी फार अधिक अन्न आणि फार अधिक भूक कशी असू शकते?",
        },
        choices: [
          {
            en: "Because food security needs not just availability but accessibility and affordability: the grain existed in the warehouses, but the hungry were too poor to buy it and the distribution failed to reach them — plenty in the store does not feed a family that cannot afford or obtain it",
            hi: "क्योंकि खाद्य सुरक्षा को केवल उपलब्धता नहीं बल्कि पहुँच और वहनीयता चाहिए: अन्न गोदामों में मौजूद था, पर भूखे इसे खरीदने बहुत निर्धन और वितरण उन तक पहुँचने में विफल — भंडार में भरपूर उस परिवार को नहीं खिलाता जो इसे वहन या प्राप्त न कर सके",
            mr: "कारण अन्नसुरक्षेला फक्त उपलब्धता नव्हे तर पोहोच आणि परवडणे हवे: धान्य गोदामांत अस्तित्वात होते, पण उपाशी ते विकत घ्यायला फार दरिद्री आणि वितरण त्यांच्यापर्यंत पोहोचायला अपयशी — साठ्यात भरपूर त्या कुटुंबाला पोसत नाही जे ते परवडू वा मिळवू शकत नाही",
          },
          {
            en: "It is impossible; the report of full warehouses must be false",
            hi: "यह असंभव; भरे गोदामों की रिपोर्ट झूठी होगी",
            mr: "हे अशक्य; भरलेल्या गोदामांचा अहवाल खोटा असेल",
          },
          {
            en: "The hungry people simply refused to eat the grain",
            hi: "भूखे लोगों ने बस अन्न खाने से मना किया",
            mr: "उपाशी लोकांनी फक्त धान्य खायला नकार दिला",
          },
          {
            en: "The country grew too much food, which somehow causes hunger",
            hi: "देश ने बहुत अधिक अन्न उगाया, जो किसी तरह भूख पैदा करता",
            mr: "देशाने फार अधिक अन्न पिकवले, जे कसेतरी भूक निर्माण करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This apparent contradiction is the single most important lesson of the whole chapter, and it turns on the difference between food being available and food being accessible and affordable. Food security has three parts, all of which must hold: enough food must exist (availability), people must be able to physically get it (accessibility), and they must be able to pay for it (affordability). Overflowing government warehouses satisfy only the first. They prove the country as a whole has grown plenty of grain — but grain sitting in a Food Corporation godown does nothing for a hungry family unless it actually reaches that family at a price they can pay. And that is exactly where things broke down. The people going hungry were the very poor: casual labourers, the landless, families with almost no income. Even with grain piled high nationally, they simply did not have the money to buy food at market prices, and where the Public Distribution System failed to reach them or excluded them, the surplus in the warehouse never turned into a meal on their plate. So hunger amid plenty is not a paradox at all once you see that producing enough food is only step one; the harder problem is getting that food to the poorest and making sure they can afford it. This is why economists insist food security is about entitlement and access, not just total production — and why a working PDS, employment that gives the poor income, and anti-poverty measures matter as much as a good harvest. Full granaries and empty stomachs can coexist precisely because availability is not the same as access.",
          hi: "यह आभासी विरोधाभास पूरे अध्याय का सबसे महत्वपूर्ण सबक़, और यह अन्न के उपलब्ध होने और अन्न के पहुँच योग्य-वहनीय होने के अंतर पर मुड़ता। खाद्य सुरक्षा के तीन भाग, सभी टिकें: पर्याप्त अन्न मौजूद हो (उपलब्धता), लोग इसे भौतिक रूप से पा सकें (पहुँच), और वे इसका दाम चुका सकें (वहनीयता)। उमड़ते सरकारी गोदाम केवल पहला संतुष्ट करते। वे सिद्ध करते देश ने समग्र रूप से भरपूर अन्न उगाया — पर खाद्य निगम के गोदाम में पड़ा अन्न किसी भूखे परिवार के लिए कुछ नहीं करता जब तक यह वास्तव में उस परिवार तक ऐसी क़ीमत पर पहुँचे जो वे चुका सकें। और ठीक वहीं चीज़ें बिगड़ीं। भूखे रहते लोग निर्धनतम थे: दिहाड़ी मज़दूर, भूमिहीन, लगभग बिना आय के परिवार। राष्ट्रीय रूप से अन्न ऊँचा ढेर होने पर भी, उनके पास बस बाज़ार क़ीमतों पर अन्न खरीदने पैसा नहीं था, और जहाँ सार्वजनिक वितरण प्रणाली उन तक पहुँचने में विफल या उन्हें छोड़ती, गोदाम का अधिशेष कभी उनकी थाली पर भोजन में नहीं बदला। अतः भरपूर के बीच भूख कोई विरोधाभास नहीं जब तुम देखो कि पर्याप्त अन्न उगाना केवल पहला क़दम; कठिन समस्या वह अन्न निर्धनतम तक पहुँचाना और सुनिश्चित करना कि वे इसे वहन कर सकें। इसी से अर्थशास्त्री ज़ोर देते खाद्य सुरक्षा हक़दारी और पहुँच के बारे में, केवल कुल उत्पादन नहीं — और क्यों चलती PDS, निर्धनों को आय देता रोज़गार, और निर्धनता-निवारण उपाय अच्छी फ़सल जितने ही मायने रखते। भरे गोदाम और ख़ाली पेट ठीक इसलिए साथ रह सकते क्योंकि उपलब्धता पहुँच के बराबर नहीं।",
          mr: "हा आभासी विरोधाभास अख्ख्या प्रकरणाचा सर्वांत महत्त्वाचा धडा, आणि तो अन्न उपलब्ध असणे आणि अन्न पोहोचण्याजोगे-परवडणारे असणे यांच्या फरकावर वळतो. अन्नसुरक्षेचे तीन भाग, सारे टिकावे: पुरेसे अन्न अस्तित्वात असावे (उपलब्धता), लोक ते भौतिकरीत्या मिळवू शकावे (पोहोच), आणि ते त्याची किंमत मोजू शकावे (परवडणे). ओसंडणारी सरकारी गोदामे फक्त पहिले पूर्ण करतात. ती सिद्ध करतात देशाने समग्रपणे भरपूर धान्य पिकवले — पण अन्न महामंडळाच्या गोदामात पडलेले धान्य कोणत्याही उपाशी कुटुंबासाठी काही करत नाही जोवर ते प्रत्यक्षात त्या कुटुंबापर्यंत अशा किमतीला पोहोचत नाही जी ते मोजू शकतील. आणि नेमके तिथेच गोष्टी बिघडल्या. उपाशी राहणारे लोक दरिद्रीतम होते: रोजंदारी मजूर, भूमिहीन, जवळपास बिना उत्पन्नाची कुटुंबे. राष्ट्रीयदृष्ट्या धान्य उंच रचलेले असतानाही, त्यांच्याकडे फक्त बाजार किमतींना अन्न विकत घ्यायला पैसा नव्हता, आणि जिथे सार्वजनिक वितरण प्रणाली त्यांच्यापर्यंत पोहोचायला अपयशी वा त्यांना वगळत, गोदामाचा अतिरिक्त कधी त्यांच्या ताटावर अन्नात बदलला नाही. म्हणून भरपूरीमध्ये भूक कोणताही विरोधाभास नाही जेव्हा तुम्ही पाहता की पुरेसे अन्न पिकवणे फक्त पहिले पाऊल; कठीण समस्या ते अन्न दरिद्रीतमांपर्यंत पोहोचवणे आणि सुनिश्चित करणे की ते परवडू शकतील. म्हणूनच अर्थतज्ज्ञ जोर देतात अन्नसुरक्षा हक्क आणि पोहोचेबद्दल, फक्त एकूण उत्पादन नव्हे — आणि का चालणारी PDS, दरिद्रींना उत्पन्न देणारा रोजगार, आणि दारिद्र्य-निवारण उपाय चांगल्या पिकाइतकेच महत्त्वाचे. भरलेली गोदामे आणि रिकामी पोटे नेमके म्हणून एकत्र राहू शकतात कारण उपलब्धता पोहोचेइतकी नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "India's food security rests on three linked tools: the Minimum Support Price paid to farmers, the buffer stock held by the government, and the Public Distribution System that sells cheap grain to the poor. How do these three work together, and whom does each mainly protect?",
          hi: "भारत की खाद्य सुरक्षा तीन जुड़े औज़ारों पर टिकी: किसानों को दिया न्यूनतम समर्थन मूल्य, सरकार द्वारा रखा बफ़र स्टॉक, और निर्धनों को सस्ता अन्न बेचती सार्वजनिक वितरण प्रणाली। ये तीन कैसे साथ काम करते, और हर एक मुख्यतः किसे रक्षता?",
          mr: "भारताची अन्नसुरक्षा तीन जोडलेल्या साधनांवर टिकते: शेतकऱ्यांना दिलेला किमान आधार किंमत, सरकारने राखलेला बफर साठा, आणि दरिद्रींना स्वस्त धान्य विकणारी सार्वजनिक वितरण प्रणाली. ही तीन कशी एकत्र काम करतात, आणि प्रत्येक मुख्यतः कोणाला रक्षतो?",
        },
        choices: [
          {
            en: "The government buys grain at the MSP, which guarantees farmers a fair price and protects the producer; that grain becomes the buffer stock, a national reserve against shortage; and the PDS then sells it cheaply to poor families, protecting the consumer — together they steady prices, shield both farmer and poor, and keep food reaching the needy year-round",
            hi: "सरकार MSP पर अन्न खरीदती, जो किसानों को उचित क़ीमत गारंटी और उत्पादक को रक्षती; वह अन्न बफ़र स्टॉक बनता, कमी के विरुद्ध राष्ट्रीय भंडार; और PDS फिर इसे निर्धन परिवारों को सस्ते बेचती, उपभोक्ता को रक्षती — साथ मिलकर वे क़ीमतें स्थिर करते, किसान और निर्धन दोनों को ढालते, और अन्न ज़रूरतमंद तक साल भर पहुँचाते",
            mr: "सरकार MSP ला धान्य विकत घेते, जे शेतकऱ्यांना वाजवी किंमत हमी आणि उत्पादकाला रक्षते; ते धान्य बफर साठा बनते, टंचाईविरुद्ध राष्ट्रीय साठा; आणि PDS मग ते दरिद्री कुटुंबांना स्वस्तात विकते, ग्राहकाला रक्षत — एकत्र ती किमती स्थिर करतात, शेतकरी आणि दरिद्री दोघांना ढाल देतात, आणि अन्न गरजूंपर्यंत वर्षभर पोहोचवतात",
          },
          {
            en: "All three tools exist only to protect the government's own profits",
            hi: "तीनों औज़ार केवल सरकार के अपने लाभ रक्षने को मौजूद",
            mr: "तिन्ही साधने फक्त सरकारच्या स्वतःच्या नफ्याचे रक्षण करायला अस्तित्वात",
          },
          {
            en: "The MSP protects the poor and the PDS protects the farmer, with the buffer stock doing nothing",
            hi: "MSP निर्धनों को रक्षता और PDS किसान को, बफ़र स्टॉक कुछ नहीं करता",
            mr: "MSP दरिद्रींना रक्षतो आणि PDS शेतकऱ्याला, बफर साठा काही करत नाही",
          },
          {
            en: "The three tools work against each other and cancel out",
            hi: "तीन औज़ार एक-दूसरे के विरुद्ध काम करते और रद्द होते",
            mr: "तीन साधने एकमेकांविरुद्ध काम करतात आणि रद्द होतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The three tools form a single connected system, and the neat way to understand it is to follow the grain and ask, at each step, who is being protected. It begins with the farmer. When harvests are good, prices can crash so low that farmers lose money on the very crop they worked to grow — a disaster that would make them plant less next year. To prevent this, the government announces a Minimum Support Price before the sowing season and promises to buy grain at that price. This guarantees the producer a fair return no matter what the open market does, protecting the farmer and encouraging steady production. The grain the government buys at the MSP does not vanish; it is stored, and this accumulated reserve is the buffer stock, held by the Food Corporation of India. Its job is to protect the nation against future shortage: if a drought or flood wrecks a later harvest, the country can draw on this stockpile instead of facing famine, so the buffer smooths out the ups and downs between good and bad years. Finally, that stored grain is put to use through the Public Distribution System, the network of ration shops that sells wheat, rice and other essentials to poor cardholders at subsidised prices far below the market. This protects the consumer — specifically the poor, who could not otherwise afford enough food — by making food accessible and affordable, which, as we saw, is what availability alone cannot guarantee. So the chain runs: MSP (protect the farmer) → buffer stock (protect against shortage) → PDS (protect the poor consumer). Each tool guards a different vulnerability, and only together do they deliver real food security: fair prices for those who grow the food, a reserve against bad years, and affordable grain reaching the hungry. The system is not perfect — holding huge stocks is costly, some grain is wasted, and the PDS can leak or miss people — but its logic is exactly this careful balancing of farmer, reserve and poor consumer.",
          hi: "तीन औज़ार एक जुड़ा तंत्र बनाते, और इसे समझने का सुथरा तरीक़ा अन्न का पीछा करना और हर क़दम पूछना, किसे रक्षा जा रहा। यह किसान से शुरू। जब फ़सलें अच्छी, क़ीमतें इतनी गिर सकतीं कि किसान उसी फ़सल पर पैसा खोएँ जिसे उगाने मेहनत की — एक विपत्ति जो उन्हें अगले वर्ष कम बोने कराए। इसे रोकने, सरकार बुवाई ऋतु से पहले न्यूनतम समर्थन मूल्य घोषित करती और उस क़ीमत पर अन्न खरीदने का वादा करती। यह उत्पादक को उचित प्रतिफल गारंटी करता चाहे खुला बाज़ार कुछ भी करे, किसान को रक्षते और स्थिर उत्पादन प्रोत्साहित करते। सरकार MSP पर जो अन्न खरीदती वह लुप्त नहीं होता; यह जमा होता, और यह संचित भंडार बफ़र स्टॉक, भारतीय खाद्य निगम द्वारा रखा। इसका काम राष्ट्र को भावी कमी से रक्षना: यदि सूखा या बाढ़ बाद की फ़सल बर्बाद करे, देश अकाल के बजाय इस भंडार पर खींच सकता, अतः बफ़र अच्छे-बुरे वर्षों के बीच उतार-चढ़ाव सम करता। अंततः, वह जमा अन्न सार्वजनिक वितरण प्रणाली से काम में लाया जाता, राशन दुकानों का जाल जो गेहूँ, चावल और अन्य आवश्यक निर्धन कार्डधारकों को बाज़ार से कहीं कम रियायती क़ीमतों पर बेचता। यह उपभोक्ता को रक्षता — ख़ासकर निर्धनों को, जो अन्यथा पर्याप्त अन्न वहन न कर सकें — अन्न को पहुँच योग्य-वहनीय बनाकर, जो, जैसा हमने देखा, उपलब्धता अकेली गारंटी नहीं कर सकती। अतः श्रृंखला चलती: MSP (किसान रक्षो) → बफ़र स्टॉक (कमी से रक्षो) → PDS (निर्धन उपभोक्ता रक्षो)। हर औज़ार भिन्न संवेदनशीलता रक्षता, और केवल साथ वे असली खाद्य सुरक्षा देते: अन्न उगाने वालों को उचित क़ीमतें, बुरे वर्षों के विरुद्ध भंडार, और भूखों तक पहुँचता वहनीय अन्न। तंत्र संपूर्ण नहीं — विशाल भंडार रखना महँगा, कुछ अन्न बर्बाद, और PDS रिस या लोगों को चूक सकती — पर इसका तर्क ठीक यही किसान, भंडार और निर्धन उपभोक्ता का सावधान संतुलन।",
          mr: "तीन साधने एक जोडलेली यंत्रणा बनवतात, आणि हे समजण्याचा नीटनेटका मार्ग धान्याचा पाठलाग करणे आणि प्रत्येक पावलाला विचारणे, कोणाला रक्षले जात आहे. ते शेतकऱ्यापासून सुरू. जेव्हा पिके चांगली, किमती इतक्या घसरू शकतात की शेतकरी त्याच पिकावर पैसा गमावतात जे पिकवायला मेहनत केली — एक आपत्ती जी त्यांना पुढच्या वर्षी कमी पेरायला लावेल. हे रोखायला, सरकार पेरणी हंगामाआधी किमान आधार किंमत घोषित करते आणि त्या किमतीला धान्य विकत घ्यायचे वचन देते. हे उत्पादकाला वाजवी परतावा हमी देते खुला बाजार काहीही करो, शेतकऱ्याला रक्षत आणि स्थिर उत्पादन प्रोत्साहित करत. सरकार MSP ला जे धान्य विकत घेते ते नाहीसे होत नाही; ते साठवले जाते, आणि हा साठलेला साठा बफर साठा, भारतीय अन्न महामंडळाने राखलेला. त्याचे काम राष्ट्राला भविष्यातील टंचाईपासून रक्षणे: जर दुष्काळ वा पूर नंतरचे पीक उद्ध्वस्त करेल, देश दुष्काळाऐवजी या साठ्यावर खेचू शकतो, म्हणून बफर चांगल्या-वाईट वर्षांतील चढउतार सम करतो. अखेर, ते साठवलेले धान्य सार्वजनिक वितरण प्रणालीतून कामात आणले जाते, रेशन दुकानांचे जाळे जे गहू, तांदूळ आणि इतर आवश्यक दरिद्री कार्डधारकांना बाजाराहून कितीतरी कमी अनुदानित किमतींना विकते. हे ग्राहकाला रक्षते — विशेषतः दरिद्रींना, जे अन्यथा पुरेसे अन्न परवडू शकणार नाहीत — अन्न पोहोचण्याजोगे-परवडणारे बनवून, जे, जसे आपण पाहिले, उपलब्धता एकटी हमी देऊ शकत नाही. म्हणून साखळी चालते: MSP (शेतकऱ्याला रक्षा) → बफर साठा (टंचाईपासून रक्षा) → PDS (दरिद्री ग्राहकाला रक्षा). प्रत्येक साधन वेगळी असुरक्षितता रक्षते, आणि फक्त एकत्र ती खरी अन्नसुरक्षा देतात: अन्न पिकवणाऱ्यांना वाजवी किमती, वाईट वर्षांविरुद्ध साठा, आणि उपाशांपर्यंत पोहोचणारे परवडणारे अन्न. यंत्रणा परिपूर्ण नाही — प्रचंड साठे राखणे महाग, काही धान्य वाया, आणि PDS झिरपू वा लोकांना चुकवू शकते — पण तिचे तर्कशास्त्र नेमके हेच शेतकरी, साठा आणि दरिद्री ग्राहकाचा काळजीपूर्वक समतोल.",
        },
      },
    ],
  },
];
