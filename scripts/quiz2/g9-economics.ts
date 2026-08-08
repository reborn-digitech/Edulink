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
];
